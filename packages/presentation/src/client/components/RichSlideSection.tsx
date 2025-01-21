import type { ReactNode } from 'react';
import React from 'react';

type RichSlideSectionProps = {
  children?: ReactNode,
  presentation?: boolean,
}

const OriginalRichSlideSection = React.memo((props: RichSlideSectionProps): React.ReactElement => {
  const { children, presentation } = props;

  return (
    <section className={presentation ? 'm-2' : 'shadow rounded m-2'}>
      <svg data-marpit-svg="" viewBox="0 0 1280 720">
        <foreignObject width="1280" height="720">
          <section>
            {children ?? <></>}
          </section>
        </foreignObject>
      </svg>
    </section>
  );
});


const RichSlideSectionNoMemorized = (props: RichSlideSectionProps): React.ReactElement => {
  const { children } = props;

  return (
    <OriginalRichSlideSection>
      {children}
    </OriginalRichSlideSection>
  );
};
export const RichSlideSection = React.memo(RichSlideSectionNoMemorized) as typeof RichSlideSectionNoMemorized;


const PresentationRichSlideSectionNoMemorized = (props: RichSlideSectionProps): React.ReactElement => {
  const { children } = props;

  return (
    <OriginalRichSlideSection presentation>
      {children}
    </OriginalRichSlideSection>
  );
};
export const PresentationRichSlideSection = React.memo(PresentationRichSlideSectionNoMemorized) as typeof PresentationRichSlideSectionNoMemorized;
