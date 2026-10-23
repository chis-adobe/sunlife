/* eslint-disable */
/* global WebImporter */

/**
 * Sun Life sections transformer.
 * beforeTransform: inserts <hr> section breaks (while parser targets still exist).
 * afterTransform: adds Section Metadata for styled sections and removes temp markers.
 */

const MARKER = 'data-excat-section-id';

function findSectionElement(root, section) {
  const selectors = Array.isArray(section.selector) ? section.selector : [section.selector];
  for (const sel of selectors) {
    if (!sel) continue;
    try {
      const el = root.querySelector(sel);
      if (el) return el;
    } catch (e) {
      // invalid selector; try next
    }
  }
  return null;
}

export default function transform(hookName, element, payload) {
  const template = payload && payload.template;
  const sections = template && template.sections;
  if (!sections || sections.length < 2) return;
  const document = (payload && payload.document) || element.ownerDocument;

  if (hookName === 'beforeTransform') {
    for (let i = sections.length - 1; i >= 0; i -= 1) {
      const section = sections[i];
      const el = findSectionElement(element, section);
      if (!el) continue;
      if (i === 0 && !section.style) continue;
      const hr = document.createElement('hr');
      if (section.style) hr.setAttribute(MARKER, section.id);
      if (i === 0) hr.setAttribute('data-excat-first-section', 'true');
      el.parentNode.insertBefore(hr, el);
    }
  }

  if (hookName === 'afterTransform') {
    for (let i = sections.length - 1; i >= 0; i -= 1) {
      const section = sections[i];
      if (!section.style) continue;
      const marker = element.querySelector(`hr[${MARKER}="${section.id}"]`);
      const anchor = marker || findSectionElement(element, section);
      if (!anchor) continue;
      const meta = WebImporter.Blocks.createBlock(document, {
        name: 'Section Metadata',
        cells: { style: section.style },
      });
      anchor.after(meta);
    }

    element.querySelectorAll(`hr[${MARKER}]`).forEach((hr) => {
      if (hr.hasAttribute('data-excat-first-section')) {
        hr.remove();
      } else {
        hr.removeAttribute(MARKER);
      }
    });
  }
}
