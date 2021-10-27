import React, { FC } from 'react';
import {
  Modal, ModalHeader, ModalBody, ModalFooter,
} from 'reactstrap';
import { useTranslation } from 'react-i18next';

type V5PageMigrationModalProps = {
  isModalOpen: boolean
  onConfirm?: () => Promise<any>;
  onCancel?: () => void;
};

export const V5PageMigrationModal: FC<V5PageMigrationModalProps> = (props: V5PageMigrationModalProps) => {
  const { t } = useTranslation();

  const onCancel = () => {
    if (props.onCancel != null) {
      props.onCancel();
    }
  };

  const onConfirm = () => {
    if (props.onConfirm != null) {
      props.onConfirm();
    }
  };

  return (
    <Modal isOpen={props.isModalOpen} toggle={onCancel} className="">
      <ModalHeader tag="h4" toggle={onCancel} className="bg-warning">
        <i className="icon-fw icon-question" />
        Warning
      </ModalHeader>
      <ModalBody>
        TODO: tell user
        that this process may take long,
        that the admin user is responsible for telling users not to do important interaction until it ends,
        and that Page schema will no longer have a unique constraint in page path.
      </ModalBody>
      <ModalFooter>
        <button
          type="button"
          className="btn btn-outline-secondary"
          onClick={onCancel}
        >
          {t('Cancel')}
        </button>
        <button
          type="button"
          className="btn btn-outline-primary ml-3"
          onClick={onConfirm}
        >
          Start Upgrading
        </button>
      </ModalFooter>
    </Modal>
  );
};
