import { moveInstrumentation } from '../../scripts/scripts.js';

/**
 * Builds a single card (li) from a block row: moves content into the li and applies
 * cards-card-image / cards-card-body classes to its children.
 * @param {Element} row - A direct child of the cards block (author row)
 * @returns {Element} The card li element
 */
export function createCard(row) {
  const li = document.createElement('li');
  moveInstrumentation(row, li);
  while (row.firstElementChild) li.append(row.firstElementChild);
  [...li.children].forEach((div) => {
    const isMedia = div.children.length === 1 && div.querySelector('picture');
    // an authored icon (`:name:`) alone in a cell acts as the card image
    const isIcon = div.querySelector('.icon') && !div.textContent.trim()
      && div.querySelectorAll('.icon').length === 1;
    if (isMedia || isIcon) div.className = 'cards-card-image';
    else div.className = 'cards-card-body';
  });
  return li;
}

/**
 * Returns the element's own text, excluding nested lists.
 * @param {Element} el
 * @returns {string}
 */
function ownText(el) {
  return [...el.childNodes]
    .filter((node) => !(node.nodeType === Node.ELEMENT_NODE && /^(UL|OL)$/.test(node.tagName)))
    .map((node) => node.textContent)
    .join('')
    .trim();
}

/**
 * True when the list item holds a single link and nothing else.
 * @param {Element} li
 * @returns {boolean}
 */
function isLinkItem(li) {
  const links = li.querySelectorAll('a[href]');
  return links.length === 1 && li.textContent.trim() === links[0].textContent.trim();
}

/**
 * Accepts only http(s) URLs as navigation targets.
 * @param {string} href
 * @returns {boolean}
 */
function isSafeHref(href) {
  try {
    return ['http:', 'https:'].includes(new URL(href, window.location.href).protocol);
  } catch {
    return false;
  }
}

/**
 * Finds an authored option list in a card body and its label.
 * Supported authoring:
 *  1. nested list: `- Label` with an inner list of links
 *  2. a list of links whose first item is plain text (the label)
 *  3. a list of links preceded by a lead-in paragraph (the label), when a CTA follows the list
 * @param {Element} body
 * @param {Element} cta
 * @returns {{ list: Element, items: Element[], label: string, remove: Element[] } | null}
 */
function findOptionList(body, cta) {
  const lists = [...body.querySelectorAll(':scope > ul, :scope > ol')];
  let found = null;
  lists.some((list) => {
    const lis = [...list.children];
    // 1. nested list
    if (lis.length === 1) {
      const inner = lis[0].querySelector(':scope > ul, :scope > ol');
      const label = ownText(lis[0]);
      const items = inner ? [...inner.children] : [];
      if (label && items.length && items.every(isLinkItem)) {
        found = {
          list, items, label, remove: [],
        };
        return true;
      }
    }
    // 2. first item is the label
    const [first, ...rest] = lis;
    if (first && !first.querySelector('a') && rest.length && rest.every(isLinkItem)) {
      found = {
        list, items: rest, label: first.textContent.trim(), remove: [],
      };
      return true;
    }
    // 3. lead-in paragraph + list of links, followed by the card CTA
    const lead = list.previousElementSibling;
    const followedByCta = cta
      // eslint-disable-next-line no-bitwise
      && (list.compareDocumentPosition(cta) & Node.DOCUMENT_POSITION_FOLLOWING);
    if (lis.length && lis.every(isLinkItem) && followedByCta
      && lead && lead.tagName === 'P' && !lead.querySelector('a') && lead.textContent.trim()) {
      found = {
        list, items: lis, label: lead.textContent.trim(), remove: [lead],
      };
      return true;
    }
    return false;
  });
  return found;
}

/**
 * Progressively enhances an authored list of links inside a card into a native <select>
 * paired with the card's CTA button. Choosing an option does not navigate; it retargets the
 * CTA, which falls back to its own authored href when nothing is selected.
 * Label text comes from the authored content (no hard-coded strings).
 * @param {Element} li The card element (from createCard)
 * @param {string} idPrefix Unique id prefix for the generated control
 * @returns {boolean} true when a select was created
 */
export function decorateCardSelect(li, idPrefix) {
  const body = li.querySelector('.cards-card-body');
  if (!body) return false;
  const cta = [...body.querySelectorAll('a[href]')]
    .filter((a) => !body.contains(a.closest('ul, ol')))
    .pop();
  const match = findOptionList(body, cta);
  if (!match || !cta) return false;

  const wrapper = document.createElement('div');
  wrapper.className = 'cards-card-select';
  const id = `${idPrefix}-select`;

  const label = document.createElement('label');
  label.className = 'cards-card-select-label';
  label.htmlFor = id;
  label.textContent = match.label;

  const select = document.createElement('select');
  select.id = id;
  const placeholder = document.createElement('option');
  placeholder.value = '';
  placeholder.textContent = match.label;
  select.append(placeholder);
  match.items.forEach((item) => {
    const a = item.querySelector('a[href]');
    if (!isSafeHref(a.href)) return;
    const option = document.createElement('option');
    option.value = a.href;
    option.textContent = a.textContent.trim();
    select.append(option);
  });

  const fallbackHref = cta.href;
  select.addEventListener('change', () => {
    cta.href = select.value && isSafeHref(select.value) ? select.value : fallbackHref;
  });

  wrapper.append(label, select);
  match.list.replaceWith(wrapper);
  match.remove.forEach((el) => el.remove());
  const ctaHolder = cta.closest('.cards-card-body > *') || cta;
  wrapper.after(ctaHolder);
  li.classList.add('cards-card-has-select');
  return true;
}

/**
 * Marks the card's trailing call-to-action paragraph (a paragraph holding only a link)
 * with `cards-card-cta` so variants can align it to the bottom of the card.
 * @param {Element} li The card element (from createCard)
 */
export function markCardCta(li) {
  const body = li.querySelector('.cards-card-body');
  const last = body?.lastElementChild;
  if (!last || last.tagName !== 'P') return;
  const links = last.querySelectorAll('a[href]');
  if (links.length === 1 && last.textContent.trim() === links[0].textContent.trim()) {
    last.classList.add('cards-card-cta');
  }
}
