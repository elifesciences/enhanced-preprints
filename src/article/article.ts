import { JSDOM } from 'jsdom';
import { ProcessedArticle } from '../model/model';

const generateToC = (headings: Heading[]): string => (headings.length ? `
    <div class="toc-container">
      <ul class="toc-list">${headings.map((heading) => `
              <li class="toc-list__item"><a class="toc-list__link" href="#${heading.id}">${heading.text}</a></li>
            `).join('')
  }
      </ul>
    </div>
` : '');

type HeadingData = { id: string, text: string };
type Heading = { children: HeadingData[] } & HeadingData;
const getHeadings = (articleDom: DocumentFragment): Heading[] => {
  const headingElements = articleDom.querySelectorAll('article > [itemtype="http://schema.stenci.la/Heading"], article > [data-itemprop="description"] > [data-itemtype="http://schema.stenci.la/Heading"]');

  return Array.from(headingElements).reduce((headings: Heading[], heading) => {
    if (heading.tagName === 'H2') {
      headings.push({
        id: heading.getAttribute('id') || '',
        text: heading.textContent || '',
        children: new Array<HeadingData>(),
      });
    } else if (heading.tagName === 'H3') {
      headings[headings.length - 1].children.push({
        id: heading.getAttribute('id') || '',
        text: heading.textContent || '',
      });
    }
    return headings;
  }, new Array<Heading>());
};

const getDoi = (articleDom: DocumentFragment): string => {
  const dois = Array.from(articleDom.querySelectorAll('[data-itemprop="identifiers"] [itemtype="http://schema.org/PropertyValue"]'))
    .filter((identifierDom) => identifierDom.querySelector('[itemprop="name"]')?.textContent?.trim() === 'doi').map((identifierDom) => {
      const doi = identifierDom.querySelector('[itemprop="value"]')?.textContent?.trim();
      return `<li class="content-header__identifier"><a href="https://doi.org/${doi}">https://doi.org/${doi}</a></li>`;
    });

  if (dois.length > 1) {
    throw Error(`Found multiple DOIs in manuscript: ${dois.join(',')}`);
  }
  if (dois.length === 0) {
    return '';
  }
  const doi = dois.shift();
  return `<ul class="content-header__identifiers">${doi}</ul>`;
};

const getArticleHtmlWithoutHeader = (articleDom: DocumentFragment): string => {
  const articleElement = articleDom.children[0];

  const articleHtml = Array.from(articleElement.querySelectorAll('[data-itemprop="identifiers"] ~ *'))
    .reduce((prev, current) => prev.concat(current.outerHTML), '');

  return `<article itemtype="http://schema.org/Article">${articleHtml}</article>`;
};

const replaceAttributesWithClassName = (
  articleDom: DocumentFragment,
  selector: string,
  newClass?: string,
): void => {
  Array.from(articleDom.querySelectorAll(selector)).forEach((element) => {
    element.removeAttribute('itemprop');
    element.removeAttribute('itemtype');
    element.removeAttribute('data-itemprop');
    element.removeAttribute('itemscope');
    if (newClass) {
      element.classList.add(newClass);
    }
  });
};

const getHeader = (articleDom: DocumentFragment): string => {
  replaceAttributesWithClassName(articleDom, 'article > [itemprop="headline"]', 'content-header__title');
  replaceAttributesWithClassName(articleDom, '[itemprop="author"]', 'person');
  replaceAttributesWithClassName(articleDom, '[data-itemprop="familyNames"]');
  replaceAttributesWithClassName(articleDom, '[itemprop="familyName"]', 'person__family_name');
  replaceAttributesWithClassName(articleDom, '[data-itemprop="givenNames"]');
  replaceAttributesWithClassName(articleDom, '[itemprop="givenName"]', 'person__given_name');
  replaceAttributesWithClassName(articleDom, 'article > [data-itemprop="authors"]', 'content-header__authors');
  replaceAttributesWithClassName(articleDom, '.person [data-itemprop="affiliations"]', 'person__affiliations');
  replaceAttributesWithClassName(articleDom, '.person [itemprop="affiliation"]');
  replaceAttributesWithClassName(articleDom, 'article > [data-itemprop="affiliations"]', 'content-header__affiliations');
  replaceAttributesWithClassName(articleDom, '.content-header__affiliations > [itemtype="http://schema.org/Organization"]', 'organisation');
  replaceAttributesWithClassName(articleDom, '.organisation > address', 'organisation__address');

  const headline = articleDom.querySelector('.content-header__title');
  const authors = articleDom.querySelector('.content-header__authors');
  const affiliations = articleDom.querySelector('.content-header__affiliations');
  const doi = getDoi(articleDom);

  return `<div class="content-header">
    ${headline?.outerHTML}
    ${authors?.outerHTML}
    ${affiliations?.outerHTML}
    <div class="content-header__footer">
      ${doi}
      <ul class="content-header__icons">
        <li>
          <a href="https://en.wikipedia.org/wiki/Open_access" class="content-header__icon content-header__icon--oa">
            <span class="visuallyhidden">Open access</span>
          </a>
        </li>
        <li>
          <a href="https://creativecommons.org/licenses/by/4.0/" class="content-header__icon content-header__icon--cc">
            <span class="visuallyhidden">Copyright information</span>
          </a>
        </li>
      </ul>
    </div>
  </div>`;
};

export const buildArticlePage = (article: ProcessedArticle): string => {
  const articleFragment = JSDOM.fragment(article.html);
  const articleHtmlWithoutHeader = getArticleHtmlWithoutHeader(articleFragment);
  const headings = getHeadings(articleFragment);
  const header = getHeader(articleFragment);
  return `${header}
      <div class="secondary-column">
        <div class="article-furniture">
          <div class="article-status">
              <h2 class="article-status__heading">Reviewed Preprint</h2>
              <span class="article-status__text">This preprint has been reviewed by eLife. Authors have responded but not yet submitted a revised edition</span>
              <div class="article-actions">
                <a class="article-actions__button" href="#"><span class="material-icons article-actions__button_icon">download</span>Download</a>
                <a class="article-actions__button" href="#"><span class="material-icons article-actions__button_icon">format_quote</span>Cite</a>
                <a class="article-actions__button" href="#"><span class="material-icons article-actions__button_icon">notifications</span>Follow</a>
                <a class="article-actions__button" href="#"><span class="material-icons article-actions__button_icon">share</span>Share</a>
            </div>
          </div>
          <div class="review-timeline">
              <ol class="review-timeline__list">
                  <li class="review-timeline__list_item"><span class="review-timeline__event">Author response</span><span class="review-timeline__date">Mar 6, 2022</span></li>
                  <li class="review-timeline__list_item"><span class="review-timeline__event">Peer review</span><span class="review-timeline__date">Mar 3, 2022</span></li>
                  <li class="review-timeline__list_item"><span class="review-timeline__event">Preprint posted</span><span class="review-timeline__date">Nov 8, 2021</span></li>
              </ol>
              <a class="review-timeline__reviews_link" href="/article/${article.doi}/reviews"><span class="material-icons link-icon">arrow_forward</span>Read the peer-review by eLife</a>
          </div>
          <div class="article-metadata">
              <ul class="article-metrics">
                  <li class="article-metrics__item">1,467 views</li>
                  <li class="article-metrics__item">1 citation</li>
                  <li class="article-metrics__item">13 tweets</li>
              </ul>
              <ul class="article-subject-areas">
                  <li class="article-subject-areas__item">Important findings</li>
                  <li class="article-subject-areas__item">Single-molecule</li>
                  <li class="article-subject-areas__item">Ion channels</li>
                  <li class="article-subject-areas__item">Ligand binding</li>
              </ul>
              <a class="article-metadata__similar_research_link" href="#"><span class="material-icons link-icon">arrow_forward</span>See similar research</a>
          </div>
        </div>
      </div>

      <main class="primary-column">
        <div class="table-contents">
          ${generateToC(headings)}
        </div>
        <div class="main-content-area">
          ${articleHtmlWithoutHeader}
        </div>
      </main>`;
};
