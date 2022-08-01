import { marked } from 'marked';
import { jumpToMenu } from '../article/jump-menu';
import { EnhancedArticle, Evaluation, Heading } from '../model/model';
import { editorsAndReviewers } from './reviews-editors-and-reviewers';
import { reviewsOf } from './reviews-peer-review-of';

const wrapWithHtml = (editorsAndReviewersSection: string, reviews: string, article: EnhancedArticle, noHeader: boolean): string => {
  const headings: Heading[] = [
    { id: 'evaluation-summary', text: 'Evaluation summary' },
    { id: 'editors-and-reviewers', text: 'Editors and reviewers' },
  ];
  headings.push(...Array.from({ length: article.peerReview.reviews.length }, (value, key) => key).map<Heading>((review, index) => ({
    id: `review-${index + 1}`,
    text: `Review ${index + 1}`,
  })));

  if (article.peerReview.authorResponse) {
    headings.push({
      id: 'author-response',
      text: 'Author response',
    });
  }

  return `
  <div class="secondary-column">
    ${reviewsOf(article, noHeader)}
  </div>
  <main class="primary-column">
    <div class="table-contents">
      <a class="return-button" href="/article/${article.doi}${noHeader ? '?noHeader=true' : ''}"><span class="material-icons return-button__icon">chevron_left</span>Back to article</a>
      ${jumpToMenu(headings)}
    </div>
    <div class="main-content-area">
      <div class="article-review-status">
        <h1 class="article-review-status__heading">Peer reviewed by eLife</h1>
        <span class="article-review-status__text">
          This research was submitted to eLife and sent for consultative peer review. Reviewers and eLife's editors
          consulted to provide a summary following individual anonymous reviews. Authors have not yet chosen to
          revise and resubmit their paper, but have provided a response to the reviews.
        </span>
        <div class="article-review-status-timeline">
          <ol class="article-review-status-timeline__list">
            <li class="article-review-status-timeline__list_item"><span class="article-review-status-timeline__event">Author response</span><span class="article-review-status-timeline__date">Mar 6, 2022</span></li>
            <li class="article-review-status-timeline__list_item"><span class="article-review-status-timeline__event">Peer review</span><span class="article-review-status-timeline__date">Mar 3, 2022</span></li>
            <li class="article-review-status-timeline__list_item"><span class="article-review-status-timeline__event">Preprint posted</span><span class="article-review-status-timeline__date">Nov 8, 2021</span></li>
          </ol>
        </div>
        <a class="article-review-link" href="#">
          <span class="material-icons link-icon">arrow_forward</span>
          Read about eLife’s peer review process
        </a>
      </div>
      <div class="summary">
        <h2 class="summary-title" id="evaluation-summary">Evaluation summary</h2>
        <p class="summary-text">
          This is a <span class="summary-text__highlight">landmark</span> paper and a <span class="summary-text__highlight">tour-de-force</span> that ties together decades of advances in electron microscopy
          to produce a dataset of both breadth and extreme technical quality whose very existence will have profound
          and lasting influence on neuroscience. The manuscript is extensive and well-illustrated, and the data,
          methods and analyses are made available to the community in an exemplary manner. The work represents
          ambitious, large-scale biological resource generation at its apotheosis.
        </p>

        <h3 class="summary-heading">Importance of claim</h3>
        <ol class="summary-badge-list">
          <li class="summary-badge-list__item summary-badge-list__item--active">Landmark</li>
          <li class="summary-badge-list__item">Fundamental</li>
          <li class="summary-badge-list__item">Important</li>
          <li class="summary-badge-list__item">Noteworthy</li>
          <li class="summary-badge-list__item">Useful</li>
          <li class="summary-badge-list__item">Flawed</li>
        </ol>
        <p class="summary-text">
          The insights (if true) will substantially change the way we think about an important topic - or have wide reaching practical implications. Important idea that everybody in the field should know about.
        </p>

        <h3 class="summary-heading">Strength of evidence</h3>
        <ol class="summary-badge-list">
          <li class="summary-badge-list__item summary-badge-list__item--active">Tour-de-force</li>
          <li class="summary-badge-list__item">Compelling</li>
          <li class="summary-badge-list__item">Convincing</li>
          <li class="summary-badge-list__item">Solid</li>
          <li class="summary-badge-list__item">Incomplete</li>
          <li class="summary-badge-list__item">Inadequate</li>
        </ol>
        <p class="summary-text">
          The quality of the dataset and / or analysis by far exceeds the current state of the art in the field. A major tour-de-force that sets new standards for years to come.
        </p>
      </div>
      ${editorsAndReviewersSection}
      <ul class="review-list">
          ${reviews}
      </ul>
    </div>
  </main>`;
};

export const generateReviewPage = (article: EnhancedArticle, noHeader: boolean): string => {
  if (typeof article.peerReview === 'string' || article.peerReview.reviews.length === 0) {
    return wrapWithHtml(editorsAndReviewers(), '<li class="review-list__item"><article class="review-list-content">No reviews found</article></li>', article, noHeader);
  }

  const reviewList: Evaluation[] = [];
  reviewList.push(...article.peerReview.reviews);

  const reviewListItems = reviewList.map((review, index) => `<li class="review-list__item"><article class="review-list-content" id="review-${index + 1}">${marked.parse(review.text)}</article></li>`);
  if (article.peerReview.authorResponse) {
    reviewListItems.push(`<li class="review-list__item"><article class="review-list-content" id="author-response">${marked.parse(article.peerReview.authorResponse.text)}</article></li>`);
  }

  return wrapWithHtml(editorsAndReviewers(), reviewListItems.join(''), article, noHeader);
};
