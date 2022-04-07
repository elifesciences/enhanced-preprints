export const generateArticleList = (journals: string[], articles: Record<string, string[]>): string => `
<html lang="en">
  <head>
    <title>Enhanced Preprint</title>
    <link rel="stylesheet" href="/styles.css"/>
  </head>
  <body>
    <div class="articles-page">
      <h1>Enhanced Preprint Display</h1>
      <div class="articles-list">
        ${journals.map(journal => `
        <h2>${journal}</h2>
        <ul>
            ${articles[journal].map(article => `<li><a href="/article/${journal}/${article}">${article}</a></li>`)}
        </ul>
        `).join('')}
      </div>
    </div>
  </body>
</html>
`;
