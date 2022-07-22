import { createInMemoryArticleRepository } from './in-memory/in-memory-repository';
import { ArticleRepository } from './model';
import { createSqliteArticleRepository } from './sqlite/sqlite-repository';
import { createCouchDBArticleRepository } from './couchdb/couchdb-repository';
import { createPouchDBArticleRepository } from './pouchdb/pouchdb-repository';
import { createMongoDBArticleRepository } from './mongodb/mongodb-repository';

export enum StoreType {
  InMemory = 'InMemory',
  Sqlite = 'Sqlite',
  CouchDB = 'CouchDB',
  PouchDB = 'PouchDB',
  MongoDB = 'MongoDB',
}

export const createArticleRepository = async (kind: StoreType, connectionString = '', username = '', password = ''): Promise<ArticleRepository> => {
  switch (kind) {
    case StoreType.Sqlite:
      return createSqliteArticleRepository(connectionString);
    case StoreType.CouchDB:
      return createCouchDBArticleRepository(connectionString, username, password);
    case StoreType.PouchDB:
      return createPouchDBArticleRepository(connectionString, username, password);
    case StoreType.MongoDB:
      return createMongoDBArticleRepository(connectionString);
    case StoreType.InMemory:
    default:
      return createInMemoryArticleRepository();
  }
};
