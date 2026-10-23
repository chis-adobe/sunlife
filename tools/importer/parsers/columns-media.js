/* eslint-disable */
/* global WebImporter */

/**
 * Parser for Columns (media).
 * Source: .sl-media-block-container > .sl-media-block (picture + .card-body).
 * One row: [image, text] in source DOM order. Text: h2, paragraph(s), <em> CTA link.
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

function buildImage(document, srcImg) {
  const img = document.createElement('img');
  img.src = absUrl(srcImg.getAttribute('src'));
  img.alt = srcImg.getAttribute('alt') || '';
  return img;
}

function buildText(document, body) {
  const content = [];
  const title = body.querySelector('h1, h2, h3, h4, .card-title');
  if (title) {
    const h2 = document.createElement('h2');
    h2.textContent = title.textContent.replace(/\s+/g, ' ').trim();
    content.push(h2);
  }
  body.querySelectorAll('.card-text p').forEach((p) => {
    if (!p.textContent.trim() && !p.querySelector('img')) return;
    const para = document.createElement('p');
    para.innerHTML = p.innerHTML.trim();
    content.push(para);
  });
  const ctas = new Set([...body.querySelectorAll('.media-cta-container a[href], a.sl-btn[href]')]);
  ctas.forEach((cta) => {
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
  const card = element.querySelector('.sl-media-block') || element;
  const row = [];
  [...card.children].forEach((child) => {
    const srcImg = child.tagName === 'PICTURE' || child.tagName === 'IMG'
      ? (child.tagName === 'IMG' ? child : child.querySelector('img'))
      : (child.querySelector(':scope > picture img, :scope > img'));
    if (srcImg && !child.classList.contains('card-body')) {
      row.push([buildImage(document, srcImg)]);
    } else if (child.classList.contains('card-body')) {
      row.push(buildText(document, child));
    }
  });
  // fallback if structure differs
  if (!row.length) {
    const img = card.querySelector('img');
    if (img) row.push([buildImage(document, img)]);
    const body = card.querySelector('.card-body') || card;
    row.push(buildText(document, body));
  }
  while (row.length < 2) row.push('');

  const cells = [row];
  const block = WebImporter.Blocks.createBlock(document, { name: 'Columns (media)', cells });
  element.replaceWith(block);
}
