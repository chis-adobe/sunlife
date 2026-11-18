/* eslint-disable */
/* global WebImporter */
import { backgroundUrl, buildImage, text } from './monarch-utils.js';

/**
 * Parser for Columns (media) on the Monarch Financial site.
 * Source: .image-text-section-2 (.text-section-2 copy + .image-section-2 background image).
 * One row: [image | heading + copy], image first (as rendered on the source).
 */
export default function parse(element, { document }) {
  const imageHolder = element.querySelector('.image-2, [class^="image-section"] [data-bg-src]');
  const src = backgroundUrl(imageHolder);
  const imageCell = src
    ? [buildImage(document, src, imageHolder.getAttribute('title'))]
    : [];

  const textEl = element.querySelector('[class^="text-section"]') || element;
  const textCell = [];
  [...textEl.children].forEach((child) => {
    if (!text(child)) return;
    if (/^H[1-6]$/.test(child.tagName)) {
      const h2 = document.createElement('h2');
      h2.textContent = text(child).replace(/\s*:\s*$/, ':');
      textCell.push(h2);
    } else {
      textCell.push(child);
    }
  });

  const cells = [[imageCell, textCell]];
  const block = WebImporter.Blocks.createBlock(document, { name: 'Columns (media)', cells });
  element.replaceWith(block);
}
