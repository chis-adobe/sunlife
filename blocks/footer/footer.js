import { getFragmentPath } from '../../scripts/scripts.js';
import { loadFragment } from '../fragment/fragment.js';

/**
 * Groups each heading with the content that follows it into a column.
 * @param {Element} container section content wrapper
 */
function buildLinkColumns(container) {
  const columns = document.createElement('div');
  columns.className = 'footer-columns';
  let column;
  [...container.children].forEach((el) => {
    if (/^H[1-6]$/.test(el.tagName) || !column) {
      column = document.createElement('div');
      column.className = 'footer-column';
      columns.append(column);
    }
    column.append(el);
  });
  container.append(columns);
}

/**
 * loads and decorates the footer
 * @param {Element} block The footer block element
 */
export default async function decorate(block) {
  // load footer as fragment
  const fragment = await loadFragment(getFragmentPath('footer'));

  // decorate footer DOM
  block.textContent = '';
  const footer = document.createElement('div');
  while (fragment.firstElementChild) footer.append(fragment.firstElementChild);

  // sections, in authored order: link columns, brand statement, legal + social
  const classes = ['footer-links', 'footer-brand', 'footer-legal'];
  [...footer.children].forEach((section, i) => {
    if (classes[i]) section.classList.add(classes[i]);
  });

  const links = footer.querySelector('.footer-links > div');
  if (links) buildLinkColumns(links);

  // icon-only links (social) take their accessible name from the authored link title
  footer.querySelectorAll('a').forEach((a) => {
    const icon = a.querySelector('.icon');
    if (icon && !a.textContent.trim()) {
      a.classList.add('footer-icon-link');
      if (a.title) a.setAttribute('aria-label', a.title);
    }
  });

  block.append(footer);
}
