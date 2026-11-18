/* eslint-disable */
/* global WebImporter */

/**
 * Shared helpers for the Monarch Financial (web.sunlife.ca advisor site) parsers.
 */
export const ORIGIN = 'https://web.sunlife.ca';

export function absUrl(url) {
  if (!url) return url;
  const clean = url.trim();
  if (clean.startsWith('//')) return `https:${clean}`;
  if (clean.startsWith('/')) return `${ORIGIN}${clean}`;
  return clean;
}

/** Reads the url(...) of an inline or stamped (data-bg-src) background image. */
export function backgroundUrl(el) {
  if (!el) return '';
  const stamped = el.getAttribute('data-bg-src');
  if (stamped) return stamped;
  const m = (el.getAttribute('style') || '').match(/background-image\s*:\s*url\(\s*['"]?([^'")]+)['"]?\s*\)/i);
  return m ? m[1] : '';
}

export function buildImage(document, src, alt) {
  const img = document.createElement('img');
  img.src = absUrl(src);
  img.alt = (alt || '').trim();
  return img;
}

export function text(el) {
  return el ? el.textContent.replace(/\u00a0/g, ' ').replace(/\s+/g, ' ').trim() : '';
}
