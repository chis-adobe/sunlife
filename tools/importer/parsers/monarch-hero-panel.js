/* eslint-disable */
/* global WebImporter */
import { backgroundUrl, buildImage, text } from './monarch-utils.js';

/**
 * Parser for Hero (panel) on the Monarch Financial site.
 * Source: header#header (#bannerBackgroundImage background + .call-to-action h1).
 * Rows: [image], [h1, paragraph(s)].
 */
export default function parse(element, { document }) {
  const cells = [];

  const bg = element.querySelector('#bannerBackgroundImage, .theme-banner');
  const src = backgroundUrl(bg);
  if (src) {
    const alt = bg.getAttribute('title') || bg.getAttribute('alt') || '';
    cells.push([buildImage(document, src, alt)]);
  }

  const cta = element.querySelector('.call-to-action') || element;
  const content = [];
  const title = cta.querySelector('h1, h2');
  if (title) {
    const h1 = document.createElement('h1');
    h1.textContent = text(title);
    content.push(h1);
  }
  cta.querySelectorAll('p').forEach((p) => {
    if (!text(p)) return;
    const para = document.createElement('p');
    para.innerHTML = p.innerHTML.trim();
    content.push(para);
  });
  if (content.length) cells.push([content]);

  const block = WebImporter.Blocks.createBlock(document, { name: 'Hero (panel)', cells });
  element.replaceWith(block);
}
