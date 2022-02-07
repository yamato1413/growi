import React, {
  FC, useCallback,
} from 'react';
import { useTranslation } from 'react-i18next';
import PaginationWrapper from './PaginationWrapper';
import { ITagCountHasId } from '~/interfaces/tag';

type TagListProps = {
  tagData: ITagCountHasId[],
  totalTags: number,
  activePage: number,
  onChangePage?: (selectedPageNumber: number) => void,
  limit: number,
  isPaginationShown?: boolean,
}

const defaultProps = {
  isPaginationShown: true,
};

const TagList: FC<TagListProps> = (props:(TagListProps & typeof defaultProps)) => {
  const {
    tagData, totalTags, activePage, onChangePage, limit, isPaginationShown,
  } = props;
  const isTagExist: boolean = tagData.length > 0;
  const { t } = useTranslation('');

  const generateTagList = useCallback((tagData) => {
    return tagData.map((data:ITagCountHasId, index:number) => {
      const tagListClasses: string = index === 0 ? 'list-group-item d-flex' : 'list-group-item d-flex border-top-0';
      return (
        <a
          key={data.name}
          href={`/_search?q=tag:${encodeURIComponent(data.name)}`}
          className={tagListClasses}
        >
          <div className="text-truncate">{data.name}</div>
          <div className="ml-4 my-auto py-1 px-2 list-tag-count badge badge-secondary text-white">{data.count}</div>
        </a>
      );
    });
  }, []);

  if (!isTagExist) {
    return <h3>{ t('You have no tag, You can set tags on pages') }</h3>;
  }

  return (
    <>
      <ul className="list-group text-left mb-4">
        {generateTagList(tagData)}
      </ul>
      {isPaginationShown
      && (
        <PaginationWrapper
          activePage={activePage}
          changePage={onChangePage}
          totalItemsCount={totalTags}
          pagingLimit={limit}
          align="center"
          size="md"
        />
      )
      }
    </>
  );

};

TagList.defaultProps = defaultProps;

export default TagList;
