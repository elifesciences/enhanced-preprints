import { existsSync, readdirSync, readFileSync, realpathSync } from 'fs';
import { JSDOM } from 'jsdom';
import { convertJatsToHtml, convertJatsToJson, PreprintXmlFile } from './conversion/encode';
import {
  ArticleRepository,
  ProcessedArticle,
  Heading,
  ArticleContent,
} from '../model/model';
import { Content, HeadingContent } from '../model/content';
import { dirname, normalize } from 'path';
import { cwd } from 'process';

// type related to the JSON output of encoda
type Address = {
  type: 'PostalAddress',
  addressCountry: string,
};
type Organisation = {
  type: 'Organization',
  name: string,
  address: Address,
};
type Person = {
  type: 'Person',
  affiliations: Array<Organisation>,
  familyNames: Array<string>,
  givenNames: Array<string>,
};
type License = {
  type: 'CreativeWork',
  url: string,
};

export type ArticleStruct = {
  id: string,
  journal: string,
  title: Content,
  datePublished: DateType
  dateAccepted: DateType
  dateReceived: DateType
  identifiers: Array<ArticleIdentifier>
  authors: Array<Person>,
  description: Content,
  licenses: Array<License>,
  content: Content,
};
type ArticleIdentifier = {
  name: string,
  value: string
};

type DateType = {
  type: string,
  value: string
};

const getDirectories = (source: string) => readdirSync(source, { withFileTypes: true })
  .filter((dirent) => dirent.isDirectory())
  .map((dirent) => dirent.name);

const extractArticleHtmlWithoutHeader = (articleDom: DocumentFragment): string => {
  const articleElement = articleDom.children[0];

  // label the abstract with an id
  const abstractHeading = articleDom.querySelector('article > [data-itemprop="description"] > h2[data-itemtype="http://schema.stenci.la/Heading"]');
  abstractHeading?.setAttribute('id', 'abstract');

  // extract all HTML elements after [data-itemprop="identifiers"] (the last of the "header" elements)
  const articleHtml = Array.from(articleElement.querySelectorAll('[data-itemprop="identifiers"] ~ *'))
    .reduce((prev, current) => prev.concat(current.outerHTML), '');

  return `<article itemtype="http://schema.org/Article">${articleHtml}</article>`;
};

const processXml = async (file: PreprintXmlFile): Promise<ArticleContent> => {
  const xml = readFileSync(file).toString();
  let html = await convertJatsToHtml(file);
  let json = await convertJatsToJson(file);

  const articleStruct = JSON.parse(json) as ArticleStruct;

  // extract DOI
  const dois = articleStruct.identifiers.filter((identifier) => identifier.name === 'doi');
  const doi = dois[0].value;

  // HACK: replace all locally referenced files with a relative URL path
  json = json.replaceAll(dirname(realpathSync(file)), `/article/${doi}/external`);
  html = html.replaceAll(dirname(realpathSync(file)), `/article/${doi}/external`);

  // extract HTML content without header
  const content = extractArticleHtmlWithoutHeader(JSDOM.fragment(html));

  return {
    doi,
    xml,
    html: content,
    document: json,
  };
};

const extractHeadings = (content: Content): Heading[] => {
  if (typeof content === 'string') {
    return [];
  }

  if (!Array.isArray(content)) {
    return extractHeadings([content]);
  }

  const headingContentParts = content.filter((contentPart) => {
    if (typeof contentPart === 'string') {
      return false;
    }

    if (contentPart.type !== 'Heading') {
      return false;
    }

    const heading = contentPart as HeadingContent;

    if (heading.depth > 1) {
      return false;
    }

    return true;
  });

  const headings = headingContentParts.map((contentPart) => {
    const heading = contentPart as HeadingContent;
    return {
      id: heading.id,
      text: heading.content,
    };
  });

  return headings;
};

const processArticle = (article: ArticleContent): ProcessedArticle => {
  const articleStruct = JSON.parse(article.document) as ArticleStruct;

  // extract title
  const {
    title, authors, description: abstract, licenses,
  } = articleStruct;

  // extract publish date
  const date = new Date(articleStruct.datePublished.value);

  return {
    ...article,
    title,
    date,
    authors,
    abstract,
    licenses,
    content: extractArticleHtmlWithoutHeader(JSDOM.fragment(article.html)),
    headings: extractHeadings(articleStruct.content),
  };
};

export const loadXmlArticlesFromDirIntoStores = async (dataDir: string, articleRepository: ArticleRepository): Promise<boolean[]> => {
  const existingDocuments = (await articleRepository.getArticleSummaries()).map(({ doi }) => doi);
  const xmlFiles = getDirectories(dataDir)
    .filter((articleId) => !existingDocuments.includes(`${dataDir.substring(dataDir.lastIndexOf('/') + 1)}/${articleId}`))
    .map((articleId) => `${dataDir}/${articleId}/${articleId}.xml`)
    .filter((xmlFilePath) => existsSync(xmlFilePath));

  return Promise.all(xmlFiles.map((xmlFile) => processXml(xmlFile).then((articleContent) => articleRepository.storeArticle(processArticle(articleContent)))));
};
