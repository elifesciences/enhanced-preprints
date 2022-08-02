import { StoreType } from './model/create-article-repository';
import { logger } from './utils/logger';

const getStoreTypeFromString = (repoType: string): StoreType => {
  if (repoType === 'Sqlite') {
    return StoreType.Sqlite;
  }
  if (repoType === 'CouchDB') {
    return StoreType.CouchDB;
  }
  if (repoType === 'InMemory') {
    return StoreType.InMemory;
  }

  logger.error(`Cannot find article repository type of ${repoType}, defaulting to InMemory`);
  return StoreType.InMemory;
};

export const config = {
  id: process.env.REVIEWGROUP_ID ?? 'https://elifesciences.org',
  name: process.env.REVIEWGROUP_NAME ?? 'eLife',
  dataDir: process.env.IMPORT_DIR_PATH ?? './data/10.1101',
  repoType: process.env.REPO_TYPE ? getStoreTypeFromString(process.env.REPO_TYPE) : StoreType.Sqlite,
  repoConnection: process.env.REPO_CONNECTION ?? './data.db',
  repoUserName: process.env.REPO_USERNAME ?? '',
  repoPassword: process.env.REPO_PASSWORD ?? '',
};
