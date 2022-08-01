const gtm = `
<!-- Google Tag Manager -->
<script>(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','GTM-5GJVXT2');</script>
<!-- End Google Tag Manager -->
`;

const gtmNoScript = `
<!-- Google Tag Manager (noscript) -->
<noscript><iframe src="https://www.googletagmanager.com/ns.html?id=GTM-5GJVXT2"
height="0" width="0" style="display:none;visibility:hidden"></iframe></noscript>
<!-- End Google Tag Manager (noscript) -->
`;

export const basePage = (pageContent: string, noHeader: boolean = false): string => `<html lang="en">
      <head>
        <title>Enhanced Preprints</title>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <meta http-equiv="X-UA-Compatible" content="ie=edge">
        <link href="https://fonts.googleapis.com/css2?family=Noto+Sans:wght@400;600&family=Noto+Serif" rel="stylesheet">
        <link href="https://fonts.googleapis.com/icon?family=Material+Icons" rel="stylesheet">
        <link rel="stylesheet" href="/styles/styles.css"/>
        ${gtm}
      </head>
      <body>
      ${gtmNoScript}
        <div class="grid-container">
          ${noHeader ? '' : '<div class="banner"></div>'}
          ${pageContent}
        </div>
        <script src="/script.js"></script>
    </body>
  </html>`;
