/* eslint-disable */
/* global WebImporter */
import { text } from './monarch-utils.js';

/**
 * Parser for Carousel (testimonials) on the Monarch Financial site.
 * Source: .da-updates .carousel (one .item per client quote).
 * One row per slide, single cell: [quote paragraph, attribution paragraph].
 * The quote glyph and prev/next controls are decorative and rebuilt by the block.
 */
export default function parse(element, { document }) {
  const cells = [];
  element.querySelectorAll('.carousel-inner > .item, .item').forEach((item) => {
    const paragraphs = [...item.querySelectorAll('p')].map(text).filter(Boolean);
    if (!paragraphs.length) return;
    const content = paragraphs.map((t) => {
      const p = document.createElement('p');
      p.textContent = t;
      return p;
    });
    cells.push([content]);
  });

  const block = WebImporter.Blocks.createBlock(document, { name: 'Carousel (testimonials)', cells });
  element.replaceWith(block);
}
