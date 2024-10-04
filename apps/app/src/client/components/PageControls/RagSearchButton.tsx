import React, { useCallback } from 'react';

import { NotAvailableForGuest } from '~/client/components/NotAvailableForGuest';
import { useIsAiEnabled } from '~/stores-universal/context';
import { useRagSearchModal } from '~/stores/rag-search';

import styles from './RagSearchButton.module.scss';

const RagSearchButton = (): JSX.Element => {
  const { data: isAiEnabled } = useIsAiEnabled();
  const { open: openRagSearchModal } = useRagSearchModal();

  console.log('isAiEnabled', isAiEnabled);

  const ragSearchButtonClickHandler = useCallback(() => {
    openRagSearchModal();
  }, [openRagSearchModal]);

  if (!isAiEnabled) {
    return <></>;
  }

  return (
    <NotAvailableForGuest>
      <button
        type="button"
        className={`btn btn-search ${styles['btn-rag-search']}`}
        onClick={ragSearchButtonClickHandler}
        data-testid="open-search-modal-button"
      >
        <span className="material-symbols-outlined">chat</span>
      </button>
    </NotAvailableForGuest>
  );
};

export default RagSearchButton;
