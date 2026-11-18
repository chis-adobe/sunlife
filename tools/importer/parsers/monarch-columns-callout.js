/* eslint-disable */
/* global WebImporter */
import { buildImage, text } from './monarch-utils.js';

/**
 * Parser for Columns (callout) on the Monarch Financial site: a small image column (logo or
 * decorative symbol) beside a text column.
 * Sources: .section1_hp (Sun Life contract notice) and .have-questions (intake questionnaire CTA).
 * One row: [image | heading, paragraph(s), <strong> CTA link].
 */
export default function parse(element, { document }) {
  const srcImg = element.querySelector('img');
  const imageCell = srcImg
    ? [buildImage(document, srcImg.getAttribute('src'), srcImg.getAttribute('alt'))]
    : [];

  const textEl = element.querySelector('.right, .have-questions-text') || element;
  const textCell = [];
  textEl.querySelectorAll('h1, h2, h3, h4, p, a').forEach((el) => {
    if (!text(el)) return;
    if (/^H[1-6]$/.test(el.tagName)) {
      const h2 = document.createElement('h2');
      h2.textContent = text(el);
      textCell.push(h2);
    } else if (el.tagName === 'P') {
      if (el.closest('a')) return;
      const p = document.createElement('p');
      p.textContent = text(el);
      textCell.push(p);
    } else if (el.tagName === 'A' && !el.closest('p')) {
      // button-styled link (e.g. .lets-connect-button) -> primary button
      const a = document.createElement('a');
      a.href = el.getAttribute('href');
      a.textContent = text(el);
      const strong = document.createElement('strong');
      strong.append(a);
      const p = document.createElement('p');
      p.append(strong);
      textCell.push(p);
    }
  });

  const cells = [[imageCell, textCell]];
  const block = WebImporter.Blocks.createBlock(document, { name: 'Columns (callout)', cells });
  element.replaceWith(block);
}
