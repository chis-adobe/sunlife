/* eslint-disable */
/* global WebImporter */

import heroPanelParser from './parsers/monarch-hero-panel.js';
import columnsMediaParser from './parsers/monarch-columns-media.js';
import columnsCalloutParser from './parsers/monarch-columns-callout.js';
import carouselTestimonialsParser from './parsers/monarch-carousel-testimonials.js';
import monarchCleanupTransformer from './transformers/monarch-cleanup.js';
import sectionsTransformer from './transformers/sunlife-sections.js';

/**
 * Import script for the Monarch Financial advisor sub site (https://web.sunlife.ca/monarch-financial/).
 * Produces the page under /monarch-financial/ plus the sub site's own nav and footer fragments
 * under /monarch-financial/fragments/. Pages point at those fragments through page metadata.
 */

const PAGE_TEMPLATE = {
  "name": "monarch-financial",
  "urls": [
    "https://web.sunlife.ca/monarch-financial/"
  ],
  "representativeUrl": "https://web.sunlife.ca/monarch-financial/",
  "description": "Monarch Financial advisor sub site (web.sunlife.ca advisor platform): full-bleed hero with caption panel, services media columns, Sun Life contract notice, beige intro, client testimonial carousel, intake questionnaire callout and a photo-strip closing banner. Own nav/footer fragments under /monarch-financial/fragments/.",
  "urlPattern": "https://web.sunlife.ca/monarch-financial/*",
  "targetPath": "/monarch-financial/",
  "pageMetadata": {
    "template": "monarch-financial",
    "nav": "/monarch-financial/fragments/nav",
    "footer": "/monarch-financial/fragments/footer"
  },
  "fragments": {
    "nav": "/monarch-financial/fragments/nav",
    "footer": "/monarch-financial/fragments/footer"
  },
  "blocks": [
    { "name": "hero-panel", "instances": ["header#header"] },
    { "name": "columns-media", "instances": [".image-text-section-2"] },
    { "name": "columns-callout", "instances": [".section1_hp", ".have-questions"] },
    { "name": "carousel-testimonials", "instances": [".da-updates .carousel"] }
  ],
  "sections": [
    { "id": "mf1", "name": "Hero", "selector": ["header#header"], "style": null, "blocks": ["hero-panel"], "defaultContent": [] },
    { "id": "mf2", "name": "Our services", "selector": [".image-text-section-2"], "style": null, "blocks": ["columns-media"], "defaultContent": [] },
    { "id": "mf3", "name": "Sun Life contract notice", "selector": [".section1_hp"], "style": "dark", "blocks": ["columns-callout"], "defaultContent": [] },
    { "id": "mf4", "name": "Why Monarch Financial", "selector": [".header-background"], "style": "beige", "blocks": [], "defaultContent": [".header-background-text"] },
    { "id": "mf5", "name": "Client testimonials", "selector": [".what-clients-say-about-us"], "style": "dark", "blocks": ["carousel-testimonials"], "defaultContent": [".what-clients-say-about-us h2"] },
    { "id": "mf6", "name": "Have questions", "selector": [".have-questions"], "style": null, "blocks": ["columns-callout"], "defaultContent": [] },
    { "id": "mf7", "name": "Helping clients", "selector": [".helping-cta"], "style": "photo-strip", "blocks": [], "defaultContent": [".helping-cta-text h3", ".helping-cta-background"] }
  ]
};

const ORIGIN = 'https://web.sunlife.ca';
const SITE_PATH = '/monarch-financial';

const parsers = {
  'hero-panel': heroPanelParser,
  'columns-media': columnsMediaParser,
  'columns-callout': columnsCalloutParser,
  'carousel-testimonials': carouselTestimonialsParser,
};

const transformers = [monarchCleanupTransformer, sectionsTransformer];

// labels the header reads from its nav fragment (accessible names of the menu toggle)
const NAV_LABELS = ['Open menu: Open menu', 'Close menu: Close menu', 'Home: Home'];

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

const clean = (s) => (s || '').replace(/\u00a0/g, ' ').replace(/\s+/g, ' ').trim();

function absUrl(url) {
  if (!url) return url;
  return new URL(url.trim(), `${ORIGIN}/`).href;
}

/** Sub site pages -> relative paths (source "home" -> sub site root); the rest absolute. */
function siteHref(href) {
  if (!href || /^(#|mailto:|tel:)/i.test(href)) return href;
  const url = new URL(href.trim(), `${ORIGIN}/`);
  if (url.origin === ORIGIN && (url.pathname === SITE_PATH || url.pathname.startsWith(`${SITE_PATH}/`))) {
    return url.pathname.replace(/\/home\/?$/, '/').replace(new RegExp(`^${SITE_PATH}$`), `${SITE_PATH}/`);
  }
  return url.href;
}

function el(document, tag, props = {}, children = []) {
  const node = document.createElement(tag);
  Object.entries(props).forEach(([k, v]) => { if (v != null) node.setAttribute(k, v); });
  children.forEach((c) => node.append(typeof c === 'string' ? document.createTextNode(c) : c));
  return node;
}

function link(document, a, content) {
  return el(document, 'a', { href: siteHref(a.getAttribute('href')) }, [content || clean(a.textContent)]);
}

function imageLink(document, a, img) {
  const image = el(document, 'img', { src: absUrl(img.getAttribute('src')), alt: clean(img.getAttribute('alt')) });
  return link(document, a, image);
}

function list(document, items) {
  return el(document, 'ul', {}, items.map((item) => el(document, 'li', {}, [item])));
}


/**
 * Nav fragment, in the section order the header block reads:
 * brand | main links | tools | labels | skip links.
 */
function buildNav(document) {
  const source = document.querySelector('#scrolling-div, .navbar-fixed-top');
  if (!source) return null;
  const root = document.createElement('div');
  const sections = [];

  const logoLink = source.querySelector('.cust-theme-logo, .logo-holder a');
  const logo = logoLink && logoLink.querySelector('img');
  if (logo) sections.push([el(document, 'p', {}, [imageLink(document, logoLink, logo)])]);

  // page links form the main nav; the client login (only in the source's overflow menu) is a tool
  const items = [...source.querySelectorAll('.nav-pages--items > li')].filter((li) => li.querySelector('a'));
  const isTool = (li) => /login|sign-?in/i.test(li.id || li.querySelector('a').getAttribute('href'));
  const visible = items.filter((li) => !isTool(li));
  const overflow = items.filter(isTool);
  sections.push([list(document, visible.map((li) => link(document, li.querySelector('a'))))]);
  if (overflow.length) sections.push([list(document, overflow.map((li) => link(document, li.querySelector('a'))))]);
  sections.push([list(document, NAV_LABELS)]);

  const skip = source.querySelector('#skip-to-main, .TopBar--skipLinks a');
  if (skip) sections.push([list(document, [el(document, 'a', { href: '#main' }, [clean(skip.textContent)])])]);

  sections.forEach((nodes, i) => {
    if (i) root.append(document.createElement('hr'));
    root.append(...nodes);
  });
  return root;
}

/**
 * Footer fragment, in the section order the footer block reads:
 * brand row (logo, contact, privacy, social) | brand statement | legal links + disclosures.
 */
function buildFooter(document) {
  const source = document.querySelector('footer#footer');
  if (!source) return null;
  const disclosure = source.querySelector('.disclosure') || source;
  const root = document.createElement('div');

  const grid = disclosure.querySelector('.footer-grid');
  const row = [];
  if (grid) {
    const logoA = grid.querySelector('.footer-logo a');
    const logo = logoA && logoA.querySelector('img');
    if (logo) row.push(el(document, 'p', {}, [imageLink(document, logoA, logo)]));
    const contact = grid.querySelector('.contact-us-button a');
    if (contact) row.push(el(document, 'p', {}, [el(document, 'strong', {}, [link(document, contact)])]));
    const privacy = grid.querySelector('.privacy-terms-button a');
    if (privacy) row.push(el(document, 'p', {}, [link(document, privacy)]));
    const social = [...grid.querySelectorAll('.footer-social-media a')]
      .filter((a) => a.querySelector('img'))
      .map((a) => imageLink(document, a, a.querySelector('img')));
    if (social.length) row.push(list(document, social));
  }
  root.append(...row);

  // statement paragraph(s) before the legal links, then legal links + disclosures
  const legalList = disclosure.querySelector('.disclosure-links ul');
  const paragraphs = [...disclosure.querySelectorAll(':scope > p')].filter((p) => clean(p.textContent));
  const isBefore = (p) => legalList
    && (p.compareDocumentPosition(legalList) & 4 /* Node.DOCUMENT_POSITION_FOLLOWING */);
  const statement = paragraphs.filter(isBefore);
  const disclosures = paragraphs.filter((p) => !isBefore(p));

  root.append(document.createElement('hr'));
  statement.forEach((p) => root.append(el(document, 'p', {}, [clean(p.textContent)])));

  root.append(document.createElement('hr'));
  if (legalList) {
    root.append(list(document, [...legalList.querySelectorAll('a')].map((a) => link(document, a))));
  }
  disclosures.forEach((p) => root.append(el(document, 'p', {}, [clean(p.textContent)])));
  return root;
}

// the platform renders no meta description; fall back to the page's intro copy
const DESCRIPTION_FALLBACK = '.header-background-text p';

function readDescription(document) {
  const desc = document.querySelector('meta[name="description"]');
  if (desc && clean(desc.content)) return clean(desc.content);
  const intro = document.querySelector(DESCRIPTION_FALLBACK);
  return intro ? clean(intro.textContent) : '';
}

function buildMetadata(document, description) {
  const meta = {};
  const title = document.querySelector('title');
  if (title) meta.Title = clean(title.textContent);
  if (description) meta.Description = description;
  const ogImage = document.querySelector('meta[property="og:image"]');
  if (ogImage && ogImage.content) {
    // the platform reports its internal (http) host; the asset is served from the public origin
    const og = new URL(absUrl(ogImage.content));
    meta.Image = el(document, 'img', { src: `${ORIGIN}${og.pathname}${og.search}`, alt: '' });
  }
  meta.Template = PAGE_TEMPLATE.pageMetadata.template;
  meta.nav = PAGE_TEMPLATE.pageMetadata.nav;
  meta.footer = PAGE_TEMPLATE.pageMetadata.footer;
  return WebImporter.Blocks.createBlock(document, { name: 'Metadata', cells: meta });
}

export default {
  /**
   * Runs on the live page: stylesheet-driven background images are not visible on the
   * importer's document, so stamp their URLs (and titles as alt text) onto the elements.
   */
  onLoad: async ({ document }) => {
    document.querySelectorAll('.image-2, .helping-cta-background, #bannerBackgroundImage').forEach((node) => {
      const m = getComputedStyle(node).backgroundImage.match(/url\(["']?([^"')]+)["']?\)/);
      if (m) node.setAttribute('data-bg-src', m[1]);
      if (node.getAttribute('title')) node.setAttribute('data-bg-alt', node.getAttribute('title'));
    });
  },

  transform: (payload) => {
    const { document, url, params } = payload;
    const main = document.body;

    // fragments come from the chrome the cleanup transformer removes
    const nav = buildNav(document);
    const footer = buildFooter(document);
    const description = readDescription(document);

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
    main.append(buildMetadata(document, description));
    WebImporter.rules.transformBackgroundImages(main, document);
    WebImporter.rules.adjustImageUrls(main, url, params.originalURL);

    // folder URLs (/monarch-financial/) map to the folder's index document
    const { pathname } = new URL(params.originalURL);
    const rawPath = pathname.replace(/\.html?$/, '').replace(/\/$/, '/index');
    const path = WebImporter.FileUtils.sanitizePath(rawPath === '' ? '/index' : rawPath);

    const results = [{
      element: main,
      path,
      report: { title: document.title, template: PAGE_TEMPLATE.name, blocks: pageBlocks.map((b) => b.name) },
    }];
    if (nav) results.push({ element: nav, path: PAGE_TEMPLATE.fragments.nav, report: { fragment: 'nav' } });
    if (footer) results.push({ element: footer, path: PAGE_TEMPLATE.fragments.footer, report: { fragment: 'footer' } });
    return results;
  },
};
