/* eslint-disable */
/* global WebImporter */

/**
 * Sun Life cleanup transformer.
 * Removes non-authorable chrome (header, footer, consent, feedback widgets,
 * tracking, forms, skip links, helper text, decorative icons).
 */

const DECORATIVE_ICON_PATTERN = /fa-(arrow|long-arrow|chevron|angle|external-link|times|search|bars|caret)/i;

function isDecorativeDataSvg(img) {
  const src = img.getAttribute('src') || '';
  if (!src.startsWith('data:image/svg+xml')) return false;
  let svg = '';
  try {
    const b64 = src.split('base64,')[1];
    svg = b64 ? atob(b64) : decodeURIComponent(src.split(',')[1] || '');
  } catch (e) {
    return false;
  }
  // Card icons (sl-card-icon) are authorable content for cards-icon blocks.
  if (/sl-card-icon/.test(svg)) return false;
  return /svg-inline--fa/.test(svg) || DECORATIVE_ICON_PATTERN.test(svg);
}

export default function transform(hookName, element, payload) {
  const document = (payload && payload.document) || element.ownerDocument;

  if (hookName === 'beforeTransform') {
    // Global header (wrapped in its experience fragment) and footer.
    element.querySelectorAll('.experiencefragment').forEach((xf) => {
      if (xf.querySelector('.header, footer, #footer')) xf.remove();
    });
    WebImporter.DOMUtils.remove(element, [
      'div.header.aem-GridColumn',
      'header',
      '#footer',
      'footer',
      '.footer.aem-GridColumn',
      '.region-menu.aem-GridColumn',
      '.megamenu.navigation',
      '.skip-links',
      'a.visually-hidden-focusable',
      // OneTrust cookie consent
      '#onetrust-consent-sdk',
      '[id^="onetrust-"]',
      '.onetrust-pc-dark-filter',
      '#ot-sdk-btn-floating',
      // Qualtrics / feedback widgets
      '[class*="QSI"]',
      '[id^="QSI"]',
      '.QSILink',
      // tracking pixels, scripts, embeds
      'script',
      'style',
      'noscript',
      'link',
      'iframe',
      'img[src*="doubleclick"]',
      'img[width="1"][height="1"]',
    ]);

    // In-page anchors: EDS derives heading ids from heading text, so retarget `#id` links to
    // the slug of the heading at (or inside) the original anchor target.
    element.querySelectorAll('a[href^="#"]').forEach((a) => {
      const id = a.getAttribute('href').slice(1);
      const target = id && document.getElementById(id);
      if (!target) return;
      const heading = /^H[1-6]$/.test(target.tagName) ? target : target.querySelector('h1, h2, h3, h4, h5, h6');
      if (!heading) return;
      const slug = heading.textContent.trim().toLowerCase()
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
        .replace(/[^0-9a-z]+/g, '-')
        .replace(/^[^a-z]+|-+$/g, '');
      if (slug) a.setAttribute('href', `#${slug}`);
    });

    // Default-content call-to-action banners (e.g. "Find an advisor"): icon-kit glyph ->
    // EDS icon (`:name:`), and the GET search form -> a primary button link to the form action.
    element.querySelectorAll('.sl-banner-content-block').forEach((banner) => {
      banner.querySelectorAll('svg.sl-card-icon[data-icon]').forEach((svg) => {
        const p = document.createElement('p');
        p.textContent = `:${svg.getAttribute('data-icon').replace(/^info-/, '')}:`;
        svg.replaceWith(p);
      });
      banner.querySelectorAll('form[action]').forEach((form) => {
        const button = form.querySelector('button, input[type="submit"]');
        const text = button && (button.textContent.trim() || button.getAttribute('value'));
        if (!text) return;
        const p = document.createElement('p');
        const strong = document.createElement('strong');
        const a = document.createElement('a');
        a.href = form.getAttribute('action');
        a.textContent = text;
        strong.append(a);
        p.append(strong);
        form.replaceWith(p);
      });
    });
  }

  if (hookName === 'afterTransform') {
    // Removed here (not in beforeTransform) so section nth-child selectors stay valid.
    WebImporter.DOMUtils.remove(element, [
      '.separator.aem-GridColumn',
      'form',
      'input',
      'select',
      'textarea',
      'button',
      '.search-bar',
      'a .visually-hidden',
      'a .sr-only',
      '.visually-hidden',
      '.sr-only',
      'svg.svg-inline--fa:not(.sl-card-icon)',
    ]);

    // Decorative Font Awesome icons captured as data: SVG images.
    element.querySelectorAll('img[src^="data:image/svg+xml"]').forEach((img) => {
      if (isDecorativeDataSvg(img)) img.remove();
    });

    // Internal sunlife.ca links -> relative paths.
    element.querySelectorAll('a[href]').forEach((a) => {
      const href = a.getAttribute('href');
      const m = href.match(/^https?:\/\/(?:www\.)?sunlife\.ca(\/en\/.*)$/i);
      if (m) a.setAttribute('href', m[1]);
      if (/^javascript:/i.test(href)) a.removeAttribute('href');
    });

    // Tracking / analytics attributes.
    element.querySelectorAll('*').forEach((el) => {
      [...el.attributes].forEach((attr) => {
        const n = attr.name;
        if (
          n.startsWith('data-di-')
          || n.startsWith('data-analytics')
          || n.startsWith('data-track')
          || n === 'data-sl-aem-component'
          || n.startsWith('on')
        ) {
          el.removeAttribute(n);
        }
      });
    });
  }
}
