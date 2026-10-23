/* eslint-disable */
/* global WebImporter */

/**
 * Parser for Cards (icon).
 * Source: .sl-segmented-blocks > .card (.card-body with .icon-container, h3/h4 title, .card-text,
 * .link-container; optional .grouped-form with a "Choose a product" dropdown + submit button).
 * One row per card: [icon image, body].
 * Body: h3, paragraph(s) (bold lead spans -> <strong>), optional list, CTA link.
 * Dropdown cards follow the cards.js contract: one-item list holding the label with a nested
 * list of option links, followed by a <strong> CTA link with the button text.
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

/**
 * Icon: the source uses icon-kit glyphs (`fa-info-<name>`), which map to project icons in
 * /icons/<name>.svg. Emitted as EDS icon notation `:<name>:` so authors can swap icons by name.
 * Falls back to a real image when the card uses one.
 */
function buildIcon(document, card) {
  const container = card.querySelector('.icon-container') || card;
  const glyph = container.querySelector('svg.sl-card-icon[data-icon], i.sl-card-icon');
  if (glyph) {
    const name = glyph.getAttribute('data-icon')
      || ([...glyph.classList].find((c) => /^fa-info-/.test(c)) || '').replace(/^fa-/, '');
    // `:name:` is the authoring notation; the EDS pipeline renders it as span.icon
    if (name) return document.createTextNode(`:${name.replace(/^info-/, '')}:`);
  }
  const srcImg = container.querySelector('img');
  if (srcImg && srcImg.getAttribute('src') && !srcImg.getAttribute('src').startsWith('data:')) {
    const img = document.createElement('img');
    img.alt = '';
    img.src = absUrl(srcImg.getAttribute('src'));
    return img;
  }
  return null;
}

/** Copies a paragraph, turning bold styling spans into <strong> and dropping icons. */
function buildParagraph(document, p) {
  const clone = p.cloneNode(true);
  clone.querySelectorAll('svg, .visually-hidden, .sr-only').forEach((n) => n.remove());
  clone.querySelectorAll('span').forEach((span) => {
    if (/bold/.test(span.className) || span.tagName === 'B') {
      const strong = document.createElement('strong');
      strong.textContent = span.textContent;
      span.replaceWith(strong);
    } else {
      span.replaceWith(...span.childNodes);
    }
  });
  clone.querySelectorAll('a[href]').forEach((a) => {
    const link = document.createElement('a');
    link.href = a.getAttribute('href');
    link.textContent = cleanText(a);
    a.replaceWith(link);
  });
  const para = document.createElement(p.tagName === 'P' ? 'p' : p.tagName.toLowerCase());
  para.innerHTML = clone.innerHTML.trim();
  return para.textContent.trim() ? para : null;
}

function linkParagraph(document, href, text, wrapperTag) {
  const a = document.createElement('a');
  a.href = href;
  a.textContent = text;
  const p = document.createElement('p');
  if (wrapperTag) {
    const wrap = document.createElement(wrapperTag);
    wrap.append(a);
    p.append(wrap);
  } else {
    p.append(a);
  }
  return p;
}

/** Product dropdown -> nested list + <strong> CTA. */
function buildFormContent(document, formRoot) {
  const out = [];
  const form = formRoot.querySelector('form') || formRoot;
  const labelEl = formRoot.querySelector('.sl-combo-label, label');
  const select = formRoot.querySelector('select');
  const label = (labelEl && cleanText(labelEl)) || (select && select.getAttribute('name')) || '';

  let options = select
    ? [...select.querySelectorAll('option')]
      .filter((o) => !o.disabled && !o.hasAttribute('disabled') && o.getAttribute('value') && o.getAttribute('value') !== 'defaultNoneSelected')
      .map((o) => ({ value: o.getAttribute('value'), text: cleanText(o) }))
    : [];
  if (!options.length) {
    options = [...formRoot.querySelectorAll('.combo-option')]
      .map((o) => ({ value: o.getAttribute('value'), text: cleanText(o) }));
  }
  const action = form.getAttribute && form.getAttribute('action');
  const fallbackHref = action || (options[0] && options[0].value) || '';

  if (label && options.length) {
    const ul = document.createElement('ul');
    const li = document.createElement('li');
    li.append(document.createTextNode(label));
    const inner = document.createElement('ul');
    options.forEach(({ value, text }) => {
      const item = document.createElement('li');
      const a = document.createElement('a');
      a.href = /^(https?:)?\/|^https?:/.test(value || '') ? value : (action || value || fallbackHref);
      a.textContent = text;
      item.append(a);
      inner.append(item);
    });
    li.append(inner);
    ul.append(li);
    out.push(ul);
  }

  const button = formRoot.querySelector('button, input[type="submit"]');
  if (button && fallbackHref) {
    const text = cleanText(button) || button.getAttribute('value') || '';
    if (text) out.push(linkParagraph(document, fallbackHref, text, 'strong'));
  }
  return out;
}

function buildBody(document, card) {
  const body = [];
  const title = card.querySelector('h1:not(.icon-container), h2, h3, h4, h5, h6');
  if (title) {
    const h3 = document.createElement('h3');
    h3.textContent = cleanText(title);
    body.push(h3);
  }

  const text = card.querySelector('.card-text');
  if (text) {
    [...text.children].forEach((child) => {
      if (child.tagName === 'P' || child.tagName === 'DIV') {
        const para = buildParagraph(document, child);
        if (para) body.push(para);
      } else if (child.tagName === 'UL' || child.tagName === 'OL') {
        const list = document.createElement(child.tagName.toLowerCase());
        child.querySelectorAll(':scope > li').forEach((li) => {
          const item = buildParagraph(document, li);
          if (item) list.append(item);
        });
        if (list.children.length) body.push(list);
      }
    });
  }

  const formRoot = card.querySelector('.grouped-form');
  if (formRoot) body.push(...buildFormContent(document, formRoot));

  card.querySelectorAll('.link-container a[href]').forEach((cta) => {
    const linkTxt = cleanText(cta);
    if (!linkTxt) return;
    const isButton = /\b(sl-btn|btn)\b/.test(cta.className);
    body.push(linkParagraph(document, cta.getAttribute('href'), linkTxt, isButton ? 'em' : null));
  });
  return body;
}

export default function parse(element, { document }) {
  const cells = [];
  let cards = [...element.querySelectorAll(':scope > .card')];
  if (!cards.length) {
    cards = [...element.querySelectorAll('.card')].filter((c) => !c.parentElement.closest('.card'));
  }

  cards.forEach((card) => {
    const icon = buildIcon(document, card);
    const body = buildBody(document, card);
    if (icon || body.length) cells.push([icon ? [icon] : '', body]);
  });

  const block = WebImporter.Blocks.createBlock(document, { name: 'Cards (icon)', cells });
  element.replaceWith(block);
}
