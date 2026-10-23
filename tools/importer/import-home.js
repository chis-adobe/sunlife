/* eslint-disable */
/* global WebImporter */

import heroPanelParser from './parsers/hero-panel.js';
import columnsMediaParser from './parsers/columns-media.js';
import cardsIconParser from './parsers/cards-icon.js';
import columnsBannerParser from './parsers/columns-banner.js';
import cardsArticleParser from './parsers/cards-article.js';
import sunlifeCleanupTransformer from './transformers/sunlife-cleanup.js';
import sunlifeSectionsTransformer from './transformers/sunlife-sections.js';

const PAGE_TEMPLATE = {
  "name": "home",
  "urls": [
    "https://www.sunlife.ca/en/"
  ],
  "representativeUrl": "https://www.sunlife.ca/en/",
  "description": "Sun Life homepage / landing page: hero panel, product intros (media columns + icon cards), banners, icon-card groups with headings, article cards and a cream closing call to action.",
  "urlPattern": "/*",
  "blocks": [
    {
      "name": "hero-panel",
      "instances": [
        ".hero-banner .sl-banner"
      ]
    },
    {
      "name": "columns-media",
      "instances": [
        ".sl-media-block-container"
      ]
    },
    {
      "name": "cards-icon",
      "instances": [
        ".sl-segmented-blocks"
      ]
    },
    {
      "name": "columns-banner",
      "instances": [
        ".sl-banner-image-block"
      ]
    },
    {
      "name": "cards-article",
      "instances": [
        ".sl-cards.vertical"
      ]
    }
  ],
  "sections": [
    {
      "id": "rc2",
      "name": "Hero",
      "selector": [
        "#main-content .aem-Grid > .hero-banner"
      ],
      "style": null,
      "blocks": [
        "hero-panel"
      ],
      "defaultContent": []
    },
    {
      "id": "rc3",
      "name": "Insurance",
      "selector": [
        "#main-content .aem-Grid > div:nth-child(2)"
      ],
      "style": null,
      "blocks": [
        "columns-media",
        "cards-icon"
      ],
      "defaultContent": []
    },
    {
      "id": "rc6",
      "name": "Investments",
      "selector": [
        "#main-content .aem-Grid > div:nth-child(5)"
      ],
      "style": null,
      "blocks": [
        "columns-media",
        "cards-icon"
      ],
      "defaultContent": []
    },
    {
      "id": "rc9",
      "name": "Health",
      "selector": [
        "#main-content .aem-Grid > div:nth-child(8)"
      ],
      "style": null,
      "blocks": [
        "columns-media",
        "cards-icon"
      ],
      "defaultContent": []
    },
    {
      "id": "rc11",
      "name": "Brand banner",
      "selector": [
        "#main-content .aem-Grid > div:nth-child(10)"
      ],
      "style": null,
      "blocks": [
        "columns-banner"
      ],
      "defaultContent": []
    },
    {
      "id": "rc12",
      "name": "Why choose",
      "selector": [
        "#main-content .aem-Grid > div:nth-child(11)"
      ],
      "style": null,
      "blocks": [
        "cards-icon"
      ],
      "defaultContent": [
        "#main-content .aem-Grid > div:nth-child(11) h2"
      ]
    },
    {
      "id": "rc14",
      "name": "Get started",
      "selector": [
        "#main-content .aem-Grid > div:nth-child(13)"
      ],
      "style": null,
      "blocks": [
        "cards-icon"
      ],
      "defaultContent": [
        "#main-content .aem-Grid > div:nth-child(13) .cmp-text"
      ]
    },
    {
      "id": "rc17",
      "name": "Client support",
      "selector": [
        "#main-content .aem-Grid > div:nth-child(16)"
      ],
      "style": null,
      "blocks": [
        "cards-icon"
      ],
      "defaultContent": [
        "#main-content .aem-Grid > div:nth-child(16) h2"
      ]
    },
    {
      "id": "rc19",
      "name": "App promo banner",
      "selector": [
        "#main-content .aem-Grid > .experiencefragment"
      ],
      "style": null,
      "blocks": [
        "columns-banner"
      ],
      "defaultContent": []
    },
    {
      "id": "rc20",
      "name": "Articles",
      "selector": [
        "#main-content .aem-Grid > div:nth-child(19)"
      ],
      "style": null,
      "blocks": [
        "cards-article"
      ],
      "defaultContent": [
        "#main-content .aem-Grid > div:nth-child(19) .cmp-text"
      ]
    },
    {
      "id": "rc22",
      "name": "Find an advisor",
      "selector": [
        "#main-content .aem-Grid > div:nth-child(21)",
        ".sl-banner-content-block"
      ],
      "style": "cream",
      "blocks": [],
      "defaultContent": [
        ".sl-banner-content-block"
      ]
    }
  ]
};

const parsers = {
  'hero-panel': heroPanelParser,
  'columns-media': columnsMediaParser,
  'cards-icon': cardsIconParser,
  'columns-banner': columnsBannerParser,
  'cards-article': cardsArticleParser,
};

const transformers = [sunlifeCleanupTransformer, sunlifeSectionsTransformer];

function executeTransformers(hookName, element, payload) {
  const enhancedPayload = { ...payload, template: PAGE_TEMPLATE };
  transformers.forEach((fn) => {
    try { fn(hookName, element, enhancedPayload); }
    catch (e) { console.error(`Transformer failed at ${hookName}:`, e); }
  });
}

function findBlocksOnPage(document, template) {
  const pageBlocks = [];
  template.blocks.forEach((blockDef) => {
    blockDef.instances.forEach((selector) => {
      document.querySelectorAll(selector).forEach((element) => {
        pageBlocks.push({ name: blockDef.name, selector, element });
      });
    });
  });
  return pageBlocks;
}

export default {
  transform: (payload) => {
    const { document, url, params } = payload;
    const main = document.body;

    executeTransformers('beforeTransform', main, payload);

    const pageBlocks = findBlocksOnPage(document, PAGE_TEMPLATE);
    pageBlocks.forEach((block) => {
      if (!block.element.parentNode) return;
      const parser = parsers[block.name];
      if (!parser) return;
      try { parser(block.element, { document, url, params }); }
      catch (e) { console.error(`Failed to parse ${block.name} (${block.selector}):`, e); }
    });

    executeTransformers('afterTransform', main, payload);

    main.appendChild(document.createElement('hr'));
    WebImporter.rules.createMetadata(main, document);
    WebImporter.rules.transformBackgroundImages(main, document);
    WebImporter.rules.adjustImageUrls(main, url, params.originalURL);

    // folder URLs (/en/) map to the folder's index document (/en/index)
    const { pathname } = new URL(params.originalURL);
    const rawPath = pathname.replace(/\.html?$/, '').replace(/\/$/, '/index');
    const path = WebImporter.FileUtils.sanitizePath(rawPath === '' ? '/index' : rawPath);

    return [{
      element: main,
      path,
      report: { title: document.title, template: PAGE_TEMPLATE.name, blocks: pageBlocks.map((b) => b.name) },
    }];
  },
};
