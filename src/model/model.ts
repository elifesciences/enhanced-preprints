import { Content } from './content';

export type Doi = string;

export type ArticleXML = string;
export type ArticleDocument = string;
export type ArticleHTML = string;
export type ArticleContent = {
  doi: Doi
  xml: ArticleXML,
  document: ArticleDocument,
  html: ArticleHTML,
};

export type ArticleTitle = Content;
export type ArticleAbstract = Content;
export type Address = {
  addressCountry: string,
};
export type Organisation = {
  name: string,
  address?: Address,
};

export type Author = {
  familyNames: string[],
  givenNames: string[],
  affiliations: Organisation[],
};

export type License = {
  type: string,
  url: string,
};

export type Heading = {
  id: string,
  text: Content,
};

export type ProcessedArticle = ArticleContent & {
  title: ArticleTitle,
  date: Date,
  authors: Author[],
  abstract: ArticleAbstract,
  licenses: License[],
  content: Content,
  headings: Heading[],
};

export type ArticleSummary = {
  doi: Doi
  title: ArticleTitle,
  date: Date,
};

export type ReviewText = string;
export enum ReviewType {
  EvaluationSummary = 'evaluation-summary',
  Review = 'review-article',
  AuthorResponse = 'reply',
}

export type Participant = {
  name: string,
  role: string,
};

export type Evaluation = {
  date: Date,
  reviewType: ReviewType,
  text: ReviewText,
  participants: Participant[],
};

export type PeerReview = {
  evaluationSummary: Evaluation,
  reviews: Evaluation[],
  authorResponse?: Evaluation,
};

export type EnhancedArticle = ProcessedArticle & {
  peerReview: PeerReview,
};

export interface ArticleRepository {
  storeArticle(article: ProcessedArticle): Promise<boolean>;
  getArticle(doi: Doi): Promise<ProcessedArticle>;
  getArticleSummaries(): Promise<ArticleSummary[]>;
}
