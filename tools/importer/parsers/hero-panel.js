/* eslint-disable */
/* global WebImporter */

/**
 * Parser for Hero (panel).
 * Source: .hero-banner .sl-banner (background picture + dark overlay card).
 * Rows: [image], [h1, paragraph(s), <strong> CTA link].
 */
const ORIGIN = 'https://www.sunlife.ca';

function absUrl(url) {
  if (!url) return url;
  if (url.startsWith('//')) return `https:${url}`;
  if (url.startsWith('/')) return `${ORIGIN}${url}`;
  return url;
}

function linkText(a) {
  const clone = a.cloneNode(true);
  clone.querySelectorAll('svg, img, .visually-hidden, .sr-only').forEach((n) => n.remove());
  return clone.textContent.replace(/\s+/g, ' ').trim();
}

export default function parse(element, { document }) {
  const cells = [];

  // Row 1: background image (largest desktop source preferred, falls back to img src)
  const picture = element.querySelector('picture');
  const srcImg = picture ? picture.querySelector('img') : element.querySelector('img');
  if (srcImg) {
    const desktop = picture && picture.querySelector('source[media*="1240"]');
    const src = (desktop && desktop.getAttribute('srcset')) || srcImg.getAttribute('src');
    const img = document.createElement('img');
    img.src = absUrl(src);
    img.alt = srcImg.getAttribute('alt') || '';
    cells.push([img]);
  }

  // Row 2: text panel
  const panel = element.querySelector('.card-content-overlay') || element.querySelector('.card-img-overlay') || element;
  const content = [];
  const title = panel.querySelector('h1, .card-title');
  if (title) {
    const h1 = document.createElement('h1');
    h1.textContent = title.textContent.replace(/\s+/g, ' ').trim();
    content.push(h1);
  }
  panel.querySelectorAll('.card-text p').forEach((p) => {
    if (!p.textContent.trim()) return;
    const para = document.createElement('p');
    para.innerHTML = p.innerHTML.trim();
    content.push(para);
  });
  const cta = panel.querySelector('a.sl-btn, a.btn');
  if (cta) {
    const a = document.createElement('a');
    a.href = cta.getAttribute('href');
    a.textContent = linkText(cta);
    const strong = document.createElement('strong');
    strong.append(a);
    const p = document.createElement('p');
    p.append(strong);
    content.push(p);
  }
  if (content.length) cells.push([content]);

  const block = WebImporter.Blocks.createBlock(document, { name: 'Hero (panel)', cells });
  element.replaceWith(block);
}
