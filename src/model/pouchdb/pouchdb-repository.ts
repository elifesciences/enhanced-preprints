/* eslint-disable no-underscore-dangle */
import { randomUUID } from 'crypto';
import PouchDB from 'pouchdb';
import MemoryAdapter from 'pouchdb-adapter-memory';
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
};

class PouchDBArticleRepository implements ArticleRepository {
  database: PouchDB.Database<StoredArticle>;

  constructor(database: PouchDB.Database<StoredArticle>) {
    this.database = database;
  }

  async storeArticle(article: ProcessedArticle): Promise<boolean> {
    const existingArticle = await this.database.get(article.doi).catch(() => false);
    if (existingArticle) {
      return false;
    }
    const response = await this.database.put({
      _id: article.doi,
      ...article,
    }, {

    });

    if (!response.ok) {
      return false;
    }

    const xmlResponse = await this.database.putAttachment(article.doi, 'xml', response.rev, Buffer.from(article.xml), 'application/xml');
    const jsonResponse = await this.database.putAttachment(article.doi, 'json', xmlResponse.rev, Buffer.from(article.document), 'application/json');
    const htmlResponse = await this.database.putAttachment(article.doi, 'html', jsonResponse.rev, Buffer.from(article.html), 'text/html');

    return xmlResponse.ok && jsonResponse.ok && htmlResponse.ok;
  }

  async getArticle(doi: Doi): Promise<ProcessedArticle> {
    const article = await this.database.get(doi, { attachments: true, binary: true });
    if (!article) {
      throw new Error(`Article with DOI "${doi}" was not found`);
    }

    if (article._attachments?.html === undefined) {
      throw new Error(`Cannot find HTML attachment for Article with DOI "${doi}"`);
    }

    if (article._attachments?.xml === undefined) {
      throw new Error(`Cannot find XML attachment for Article with DOI "${doi}"`);
    }
    const html = (article._attachments?.html as PouchDB.Core.FullAttachment).data.toString();
    const xml = (article._attachments?.xml as PouchDB.Core.FullAttachment).data.toString();
    return {
      ...article,
      date: new Date(article.date),
      xml,
      html,
    };
  }

  async getArticleSummaries(): Promise<ArticleSummary[]> {
    const { rows } = await this.database.query<ArticleSummary>((doc, emit) => {
      if (emit === undefined) {
        return;
      }
      emit(doc._id, { doi: doc.doi, title: doc.title, date: doc.date });
    });
    return rows.map((row) => ({
      doi: row.value.doi,
      date: new Date(row.value.date),
      title: row.value.title,
    }));
  }
}

export const createPouchDBArticleRepository = async (connectionString: string, username: string, password: string) => {
  if (connectionString === ':memory:') {
    PouchDB.plugin(MemoryAdapter);
    return new PouchDBArticleRepository(
      new PouchDB<StoredArticle>(
        randomUUID(),
        { adapter: 'memory' },
      ),
    );
  }
  const eppDb = new PouchDB<StoredArticle>(connectionString, {
    auth: {
      username,
      password,
    },
  });

  return new PouchDBArticleRepository(eppDb);
};
