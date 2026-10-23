/* eslint-disable */
/* global WebImporter */

/**
 * Parser for Cards (article).
 * Source: .sl-cards.vertical > .card (picture + .card-body with linked h3 and text).
 * One row per card: [image, body]. Body: linked h3, paragraph(s).
 */
const ORIGIN = 'https://www.sunlife.ca';

function absUrl(url) {
  if (!url) return url;
  if (url.startsWith('//')) return `https:${url}`;
  if (url.startsWith('/')) return `${ORIGIN}${url}`;
  return url;
}

function cleanText(el) {
  const clone = el.cloneNode(true);
  clone.querySelectorAll('svg, img, .visually-hidden, .sr-only').forEach((n) => n.remove());
  return clone.textContent.replace(/\s+/g, ' ').trim();
}

export default function parse(element, { document }) {
  const cells = [];
  const cards = element.querySelectorAll(':scope > .card, :scope > div > .card:not(.card .card)');
  const items = cards.length ? [...cards] : [...element.querySelectorAll('.card')];

  items.forEach((card) => {
    // image cell
    const srcImg = card.querySelector('picture img, img');
    let imageCell = '';
    if (srcImg) {
      const img = document.createElement('img');
      img.src = absUrl(srcImg.getAttribute('src'));
      img.alt = srcImg.getAttribute('alt') || '';
      imageCell = [img];
    }

    // body cell
    const body = [];
    const titleLink = card.querySelector('h1 a[href], h2 a[href], h3 a[href], h4 a[href], a.card-title[href]');
    const titleEl = card.querySelector('h1, h2, h3, h4, .card-title');
    const href = (titleLink && titleLink.getAttribute('href'))
      || card.getAttribute('data-href') || (card.querySelector('a[href]') || {}).getAttribute?.('href');
    const titleText = cleanText(titleLink || titleEl || document.createElement('span'));
    if (titleText) {
      const h3 = document.createElement('h3');
      if (href) {
        const a = document.createElement('a');
        a.href = href;
        a.textContent = titleText;
        h3.append(a);
      } else {
        h3.textContent = titleText;
      }
      body.push(h3);
    }
    card.querySelectorAll('.card-text p, .body-text p').forEach((p) => {
      if (!p.textContent.trim()) return;
      const para = document.createElement('p');
      para.innerHTML = p.innerHTML.trim();
      body.push(para);
    });

    if (imageCell || body.length) cells.push([imageCell, body]);
  });

  const block = WebImporter.Blocks.createBlock(document, { name: 'Cards (article)', cells });
  element.replaceWith(block);
}
