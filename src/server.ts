import express from 'express';
import { generateArticleList } from './article-list/article-list';
import { articlePage } from './article/article-page';
import { generateReviewPage } from './reviews/reviews';
import { basePage } from './base-page/base-page';
import { ArticleRepository } from './model/model';
import { loadXmlArticlesFromDirIntoStores } from './data-loader/data-loader';
import { createEnhancedArticleGetter, GetEnhancedArticle } from './reviews/get-enhanced-article';
import { createArticleRepository } from './model/create-article-repository';
import { config } from './config';
import { logger } from './utils/logger';

const app = express();

let articleRepository: ArticleRepository;
let getEnhancedArticle: GetEnhancedArticle;
createArticleRepository(config.repoType, config.repoConnection, config.repoUserName, config.repoPassword).then(async (repo: ArticleRepository) => {
  articleRepository = repo;
  getEnhancedArticle = createEnhancedArticleGetter(articleRepository, config.id);
  app.listen(3000, () => {
    logger.info('Example app listening on port 3000');
  });
});

app.use(express.static('public'));

app.get('/', async (req, res) => {
  res.send(basePage(generateArticleList(config.name, await articleRepository.getArticleSummaries())));
});

app.get('/article/:publisherId/:articleId', async (req, res) => {
  const { publisherId, articleId } = req.params;
  const doi = `${publisherId}/${articleId}`;
  const noHeader = req.query.noHeader !== undefined && req.query.noHeader === 'true';
  const pageContent = articlePage(await articleRepository.getArticle(doi), noHeader);
  res.send(basePage(pageContent, noHeader));
});

app.get('/article/:publisherId/:articleId/reviews', async (req, res) => {
  const { publisherId, articleId } = req.params;
  const doi = `${publisherId}/${articleId}`;
  const noHeader = req.query.noHeader !== undefined && req.query.noHeader === 'true';
  const pageContent = generateReviewPage(await getEnhancedArticle(doi), noHeader);
  res.send(basePage(pageContent, noHeader));
});

app.get('/import', async (req, res) => {
  res.send(basePage(`<form method="POST">
    <input type="submit" value="import">
  </form>`));
});
app.post('/import', async (req, res) => {
  const results = await loadXmlArticlesFromDirIntoStores(config.dataDir, articleRepository);
  if (results.every((value) => value)) {
    res.send({ status: true, message: 'Import completed' });
  } else if (results.every((value) => !value)) {
    res.send({ status: false, message: 'No new files were imported' });
  } else {
    res.send({ status: true, message: 'Some new items imported' });
  }
});
