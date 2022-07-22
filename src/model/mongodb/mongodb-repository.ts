/* eslint-disable no-underscore-dangle */
import { Collection, MongoClient } from "mongodb";
import { Content } from '../content';
import {
  Doi,
  ArticleRepository,
  ProcessedArticle,
  ArticleSummary,
  ArticleTitle,
  ArticleAbstract,
  ArticleDocument,
  License,
  Heading,
  Author,
} from '../model';

type StoredArticle = {
  _id: string,
  doi: string,
  document: ArticleDocument,
  title: ArticleTitle,
  date: Date,
  authors: Author[],
  abstract: ArticleAbstract,
  licenses: License[],
  content: Content,
  headings: Heading[],
  xml: string,
  html: string,
};

class MongoDBArticleRepository implements ArticleRepository {
  collection: Collection<StoredArticle>;

  constructor(collection: Collection<StoredArticle>) {
    this.collection = collection;
  }

  async storeArticle(article: ProcessedArticle): Promise<boolean> {
    const response = await this.collection.insertOne({
      _id: article.doi,
      ...article,
    });

    return response.acknowledged;
  }

  async getArticle(doi: Doi): Promise<ProcessedArticle> {
    const article = await this.collection.findOne({ _id: doi });
    if (!article) {
      throw new Error(`Article with DOI "${doi}" was not found`);
    }

    return {
      ...article,
      date: new Date(article.date),
    };
  }

  async getArticleSummaries(): Promise<ArticleSummary[]> {
    const results = await this.collection.find({}).project<ArticleSummary>({
      _id: 0,
      doi: 1,
      date: 1,
      title: 1,
    });

    return results.toArray();
  }
}

export const createMongoDBArticleRepository = async (connectionString: string) => {
  const client = new MongoClient(connectionString);

  const collection = client.db('epp').collection<StoredArticle>('articles');

  return new MongoDBArticleRepository(collection);
};
