/* eslint-disable */
/* global WebImporter */

/**
 * Parser for Columns (banner).
 * Source: .sl-banner-image-block > .banner-image-block-row with a .body-container text column
 * and an image column; order follows the source DOM (image-left banners put the image first).
 * Text: h2, paragraph(s), badge image links (own paragraph each), disclaimer, <em> CTA link.
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

function buildImage(document, srcImg, fallbackAlt) {
  const img = document.createElement('img');
  img.src = absUrl(srcImg.getAttribute('src'));
  img.alt = srcImg.getAttribute('alt') || fallbackAlt || '';
  return img;
}

function buildParagraph(document, p) {
  const para = document.createElement('p');
  const badgeLinks = [...p.querySelectorAll('a[href]')].filter((a) => a.querySelector('img'));
  if (badgeLinks.length && !linkText(p)) {
    // app-store badge: image wrapped in its link
    badgeLinks.forEach((src) => {
      const a = document.createElement('a');
      a.href = src.getAttribute('href');
      a.append(buildImage(document, src.querySelector('img'), src.getAttribute('title')));
      para.append(a);
    });
    return para;
  }
  const clone = p.cloneNode(true);
  clone.querySelectorAll('svg, .visually-hidden, .sr-only').forEach((n) => n.remove());
  // unwrap styling spans (e.g. .body-small disclaimer)
  clone.querySelectorAll('span').forEach((span) => span.replaceWith(...span.childNodes));
  para.innerHTML = clone.innerHTML.trim();
  return para.textContent.trim() || para.querySelector('img') ? para : null;
}

function buildText(document, body) {
  const content = [];
  const title = body.querySelector('h1, h2, h3, h4, .card-title');
  if (title) {
    const h2 = document.createElement('h2');
    h2.textContent = title.textContent.replace(/\s+/g, ' ').trim();
    content.push(h2);
  }
  body.querySelectorAll('.card-text > p').forEach((p) => {
    const para = buildParagraph(document, p);
    if (para) content.push(para);
  });
  body.querySelectorAll('a.sl-btn, a.btn').forEach((cta) => {
    if (cta.closest('.card-text')) return;
    const a = document.createElement('a');
    a.href = cta.getAttribute('href');
    a.textContent = linkText(cta);
    const em = document.createElement('em');
    em.append(a);
    const p = document.createElement('p');
    p.append(em);
    content.push(p);
  });
  return content;
}

export default function parse(element, { document }) {
  const rowEl = element.querySelector('.banner-image-block-row') || element;
  const row = [];
  [...rowEl.children].forEach((col) => {
    if (col.classList.contains('body-container') || col.querySelector('.card-body')) {
      row.push(buildText(document, col.querySelector('.card-body') || col));
    } else {
      const srcImg = col.tagName === 'IMG' ? col : col.querySelector('img');
      if (srcImg) row.push([buildImage(document, srcImg)]);
    }
  });
  while (row.length < 2) row.push('');

  const cells = [row];
  const block = WebImporter.Blocks.createBlock(document, { name: 'Columns (banner)', cells });
  element.replaceWith(block);
}
