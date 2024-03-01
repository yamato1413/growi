import React, { useState } from 'react';

import { Dropdown } from 'reactstrap';

import { useCreateTemplatePage, useToastrOnError } from '~/client/services/create-page';

import { CreateButton } from './CreateButton';
import { DropendMenu } from './DropendMenu';
import { DropendToggle } from './DropendToggle';
import { useCreateNewPage, useCreateTodaysMemo } from './hooks';


export const PageCreateButton = React.memo((): JSX.Element => {
  const [isHovered, setIsHovered] = useState(false);

  const [dropdownOpen, setDropdownOpen] = useState(false);

  const { createNewPage, isCreating: isNewPageCreating } = useCreateNewPage();
  // TODO: https://redmine.weseek.co.jp/issues/138806
  const { createTodaysMemo, isCreating: isTodaysPageCreating, todaysPath } = useCreateTodaysMemo();
  // TODO: https://redmine.weseek.co.jp/issues/138805
  const {
    createTemplate,
    isCreating: isTemplatePageCreating, isCreatable: isTemplatePageCreatable,
  } = useCreateTemplatePage();

  const createNewPageWithToastr = useToastrOnError(createNewPage);
  const createTodaysMemoWithToastr = useToastrOnError(createTodaysMemo);
  const createTemplateWithToastr = useToastrOnError(createTemplate);

  const onMouseEnterHandler = () => {
    setIsHovered(true);
  };

  const onMouseLeaveHandler = () => {
    setIsHovered(false);
    setDropdownOpen(false);
  };

  const toggle = () => setDropdownOpen(!dropdownOpen);

  return (
    <div
      className="d-flex flex-row mt-2"
      onMouseEnter={onMouseEnterHandler}
      onMouseLeave={onMouseLeaveHandler}
    >
      <div className="btn-group flex-grow-1">
        <CreateButton
          className="z-2"
          onClick={createNewPageWithToastr}
          disabled={isNewPageCreating || isTodaysPageCreating || isTemplatePageCreating}
        />
      </div>
      { isHovered && (
        <Dropdown
          isOpen={dropdownOpen}
          toggle={toggle}
          direction="end"
          className="position-absolute"
        >
          <DropendToggle />
          <DropendMenu
            onClickCreateNewPage={createNewPageWithToastr}
            onClickCreateTodaysMemo={createTodaysMemoWithToastr}
            onClickCreateTemplate={isTemplatePageCreatable ? createTemplateWithToastr : undefined}
            todaysPath={todaysPath}
          />
        </Dropdown>
      )}
    </div>
  );
});
