import { ErrorV3 } from '@growi/core/dist/models';
import { serializeUserSecurely } from '@growi/core/dist/models/serializers';
import express from 'express';
import { connection } from 'mongoose';

import { accessTokenParser } from '~/server/middlewares/access-token-parser';
import { Revision } from '~/server/models/revision';
import { normalizeLatestRevisionIfBroken } from '~/server/service/revision/normalize-latest-revision-if-broken';
import loggerFactory from '~/utils/logger';

import { apiV3FormValidator } from '../../middlewares/apiv3-form-validator';

const logger = loggerFactory('growi:routes:apiv3:pages');

const { query, param } = require('express-validator');

const router = express.Router();

const MIGRATION_FILE_NAME = '20211227060705-revision-path-to-page-id-schema-migration--fixed-7549';

/** @param {import('~/server/crowi').default} crowi Crowi instance */
module.exports = (crowi) => {
  const certifySharedPage = require('../../middlewares/certify-shared-page')(crowi);
  const loginRequired = require('../../middlewares/login-required')(crowi, true);

  const {
    Page,
    User,
  } = crowi.models;

  const validator = {
    retrieveRevisions: [
      query('pageId').isMongoId().withMessage('pageId is required'),
      query('offset').if(value => value != null).isInt({ min: 0 }).withMessage('offset must be int'),
      query('limit').if(value => value != null).isInt({ max: 100 }).withMessage('You should set less than 100 or not to set limit.'),

    ],
    retrieveRevisionById: [
      query('pageId').isMongoId().withMessage('pageId is required'),
      param('id').isMongoId().withMessage('id is required'),
    ],
  };

  /**
   * @swagger
   *
   *    /revisions/list:
   *      get:
   *        tags: [Revisions]
   *        description: Get revisions by page id
   *        parameters:
   *          - in: query
   *            name: pageId
   *            schema:
   *              type: string
   *              description: page id
   *          - in: query
   *            name: page
   *            description: selected page number
   *            schema:
   *              type: number
   *          - in: query
   *            name: limit
   *            description: page item limit
   *            schema:
   *              type: number
   *        responses:
   *          200:
   *            description: Return revisions belong to page
   *
   */
  let cachedAppliedAt = null;

  const getAppliedAtOfTheMigrationFile = async() => {

    if (cachedAppliedAt != null) {
      return cachedAppliedAt;
    }

    const migrationCollection = connection.collection('migrations');
    const migration = await migrationCollection.findOne({ fileName: { $regex: `^${MIGRATION_FILE_NAME}` } });
    const appliedAt = migration.appliedAt;

    cachedAppliedAt = appliedAt;

    return appliedAt;
  };

  router.get('/list', certifySharedPage, accessTokenParser, loginRequired, validator.retrieveRevisions, apiV3FormValidator, async(req, res) => {
    const pageId = req.query.pageId;
    const limit = req.query.limit || await crowi.configManager.getConfig('customize:showPageLimitationS') || 10;
    const { isSharedPage } = req;
    const offset = req.query.offset || 0;

    // check whether accessible
    if (!isSharedPage && !(await Page.isAccessiblePageByViewer(pageId, req.user))) {
      return res.apiv3Err(new ErrorV3('Current user is not accessible to this page.', 'forbidden-page'), 403);
    }

    // Normalize the latest revision which was borken by the migration script '20211227060705-revision-path-to-page-id-schema-migration--fixed-7549.js'
    try {
      await normalizeLatestRevisionIfBroken(pageId);
    }
    catch (err) {
      logger.error('Error occurred in normalizing the latest revision');
    }

    try {
      const page = await Page.findOne({ _id: pageId });

      const appliedAt = await getAppliedAtOfTheMigrationFile();

      const queryOpts = {
        offset,
        sort: { createdAt: -1 },
        populate: 'author',
        pagination: false,
      };

      if (limit > 0) {
        queryOpts.limit = limit;
        queryOpts.pagination = true;
      }

      const queryCondition = {
        pageId: page._id,
        createdAt: { $gt: appliedAt },
      };

      // https://redmine.weseek.co.jp/issues/151652
      const paginateResult = await Revision.paginate(
        queryCondition,
        queryOpts,
      );

      paginateResult.docs.forEach((doc) => {
        if (doc.author != null && doc.author instanceof User) {
          doc.author = serializeUserSecurely(doc.author);
        }
      });

      const result = {
        revisions: paginateResult.docs,
        totalCount: paginateResult.totalDocs,
        offset: paginateResult.offset,
      };

      return res.apiv3(result);
    }
    catch (err) {
      const msg = 'Error occurred in getting revisions by poge id';
      logger.error('Error', err);
      return res.apiv3Err(new ErrorV3(msg, 'faild-to-find-revisions'), 500);
    }

  });

  /**
   * @swagger
   *
   *    /revisions/{id}:
   *      get:
   *        tags: [Revisions]
   *        description: Get one revision by id
   *        parameters:
   *          - in: query
   *            name: pageId
   *            required: true
   *            description: page id
   *            schema:
   *              type: string
   *          - in: path
   *            name: id
   *            required: true
   *            description: revision id
   *            schema:
   *              type: string
   *        responses:
   *          200:
   *            description: Return revision
   *
   */
  router.get('/:id', certifySharedPage, accessTokenParser, loginRequired, validator.retrieveRevisionById, apiV3FormValidator, async(req, res) => {
    const revisionId = req.params.id;
    const pageId = req.query.pageId;
    const { isSharedPage } = req;

    // check whether accessible
    if (!isSharedPage && !(await Page.isAccessiblePageByViewer(pageId, req.user))) {
      return res.apiv3Err(new ErrorV3('Current user is not accessible to this page.', 'forbidden-page'), 403);
    }

    try {
      const revision = await Revision.findById(revisionId).populate('author');

      if (revision.author != null && revision.author instanceof User) {
        revision.author = serializeUserSecurely(revision.author);
      }

      return res.apiv3({ revision });
    }
    catch (err) {
      const msg = 'Error occurred in getting revision data by id';
      logger.error('Error', err);
      return res.apiv3Err(new ErrorV3(msg, 'faild-to-find-revision'), 500);
    }

  });

  return router;
};
