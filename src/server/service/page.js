const mongoose = require('mongoose');
const escapeStringRegexp = require('escape-string-regexp');
const logger = require('@alias/logger')('growi:models:page');
const debug = require('debug')('growi:models:page');
const { serializePageSecurely } = require('../models/serializers/page-serializer');

const STATUS_PUBLISHED = 'published';

class PageService {

  constructor(crowi) {
    this.crowi = crowi;
  }

  async deleteCompletely(pageId, pagePath) {
    // Delete Bookmarks, Attachments, Revisions, Pages and emit delete
    const Bookmark = this.crowi.model('Bookmark');
    const Comment = this.crowi.model('Comment');
    const Page = this.crowi.model('Page');
    const PageTagRelation = this.crowi.model('PageTagRelation');
    const ShareLink = this.crowi.model('ShareLink');
    const Revision = this.crowi.model('Revision');

    return Promise.all([
      Bookmark.removeBookmarksByPageId(pageId),
      Comment.removeCommentsByPageId(pageId),
      PageTagRelation.remove({ relatedPage: pageId }),
      ShareLink.remove({ relatedPage: pageId }),
      Revision.removeRevisionsByPath(pagePath),
      Page.findByIdAndRemove(pageId),
      Page.removeRedirectOriginPageByPath(pagePath),
      this.removeAllAttachments(pageId),
    ]);
  }

  async removeAllAttachments(pageId) {
    const Attachment = this.crowi.model('Attachment');
    const { attachmentService } = this.crowi;

    const attachments = await Attachment.find({ page: pageId });

    const promises = attachments.map(async(attachment) => {
      return attachmentService.removeAttachment(attachment._id);
    });

    return Promise.all(promises);
  }

  async duplicate(page, newPagePath, user) {
    const Page = this.crowi.model('Page');
    const PageTagRelation = mongoose.model('PageTagRelation');
    // populate
    await page.populate({ path: 'revision', model: 'Revision', select: 'body' }).execPopulate();

    // create option
    const options = { page };
    options.grant = page.grant;
    options.grantUserGroupId = page.grantedGroup;
    options.grantedUsers = page.grantedUsers;

    const createdPage = await Page.create(
      newPagePath, page.revision.body, user, options,
    );

    // take over tags
    const originTags = await page.findRelatedTagsById();
    let savedTags = [];
    if (originTags != null) {
      await PageTagRelation.updatePageTags(createdPage.id, originTags);
      savedTags = await PageTagRelation.listTagNamesByPage(createdPage.id);
    }

    const result = serializePageSecurely(createdPage);
    result.tags = savedTags;

    return result;
  }

  async duplicateRecursively(page, newPagePath, user) {
    const Page = this.crowi.model('Page');
    // const newPagePathPrefix = newPagePath;
    const pathRegExp = new RegExp(`^${escapeStringRegexp(page.path)}`, 'i');

    const pages = await Page.findManageableListWithDescendants(page, user);

    const promise = pages.map(async(page) => {
      const newPagePath1 = page.path.replace(pathRegExp, newPagePath);
      return this.duplicate(page, newPagePath1, user);
    });

    const newPath = page.path.replace(pathRegExp, newPagePath);

    await Promise.allSettled(promise);

    const newParentpage = await Page.findByPath(newPath);

    // TODO GW-4634 use stream
    return newParentpage;
  }


  async completelyDeletePage(pageData, user, options = {}) {
    this.validateCrowi();
    let pageEvent;
    // init event
    if (this.crowi != null) {
      pageEvent = this.crowi.event('page');
      pageEvent.on('create', pageEvent.onCreate);
      pageEvent.on('update', pageEvent.onUpdate);
    }

    const { _id, path } = pageData;
    const socketClientId = options.socketClientId || null;

    logger.debug('Deleting completely', path);

    await this.deleteCompletely(_id, path);

    if (socketClientId != null) {
      pageEvent.emit('delete', pageData, user, socketClientId); // update as renamed page
    }
    return pageData;
  }

  /**
   * Delete Bookmarks, Attachments, Revisions, Pages and emit delete
   */
  async completelyDeletePageRecursively(targetPage, user, options = {}) {
    const findOpts = { includeTrashed: true };
    const Page = this.crowi.model('Page');

    // find manageable descendants (this array does not include GRANT_RESTRICTED)
    const pages = await Page.findManageableListWithDescendants(targetPage, user, findOpts);

    await Promise.all(pages.map((page) => {
      return this.completelyDeletePage(page, user, options);
    }));
  }


  async revertDeletedPage(page, user, options = {}) {
    const Page = this.crowi.model('Page');
    const newPath = Page.getRevertDeletedPageName(page.path);
    const originPage = await Page.findByPath(newPath);
    if (originPage != null) {
      // When the page is deleted, it will always be created with "redirectTo" in the path of the original page.
      // So, it's ok to delete the page
      // However, If a page exists that is not "redirectTo", something is wrong. (Data correction is needed).
      if (originPage.redirectTo !== page.path) {
        throw new Error('The new page of to revert is exists and the redirect path of the page is not the deleted page.');
      }
      await this.completelyDeletePage(originPage, options);
    }

    page.status = STATUS_PUBLISHED;
    page.lastUpdateUser = user;
    debug('Revert deleted the page', page, newPath);
    const updatedPage = await Page.rename(page, newPath, user, {});
    return updatedPage;
  }

  async handlePrivatePagesForDeletedGroup(deletedGroup, action, transferToUserGroupId) {
    const Page = this.crowi.model('Page');
    const pages = await Page.find({ grantedGroup: deletedGroup });

    switch (action) {
      case 'public':
        await Promise.all(pages.map((page) => {
          return Page.publicizePage(page);
        }));
        break;
      case 'delete':
        await Promise.all(pages.map((page) => {
          return this.completelyDeletePage(page);
        }));
        break;
      case 'transfer':
        await Promise.all(pages.map((page) => {
          return Page.transferPageToGroup(page, transferToUserGroupId);
        }));
        break;
      default:
        throw new Error('Unknown action for private pages');
    }
  }

  validateCrowi() {
    if (this.crowi == null) {
      throw new Error('"crowi" is null. Init User model with "crowi" argument first.');
    }
  }

}

module.exports = PageService;
