/* eslint-disable */
/* global WebImporter */

/**
 * Monarch Financial (web.sunlife.ca advisor site) cleanup transformer.
 * beforeTransform: removes non-authorable chrome (fixed nav, footer, scroll button, portal
 * forms/inputs, consent and tracking) and normalises inline content.
 * afterTransform: rewrites links (site links -> relative, assets -> absolute) and strips attributes.
 */
const ORIGIN = 'https://web.sunlife.ca';
const SITE_PATH = '/monarch-financial';

/** Rewrites a source href: sub site pages -> relative, other source-relative URLs -> absolute. */
function rewriteHref(href) {
  if (!href || /^(#|mailto:|tel:)/i.test(href)) return href;
  if (/^javascript:/i.test(href)) return null;
  let url;
  try {
    url = new URL(href, `${ORIGIN}/`);
  } catch (e) {
    return href;
  }
  if (url.origin !== ORIGIN) return href;
  if (url.pathname === SITE_PATH || url.pathname.startsWith(`${SITE_PATH}/`)) {
    // the source "home" page is the sub site root
    const path = url.pathname.replace(/\/home\/?$/, '/').replace(new RegExp(`^${SITE_PATH}$`), `${SITE_PATH}/`);
    return `${path}${url.search}${url.hash}`;
  }
  return url.href;
}

function unwrap(el) {
  el.replaceWith(...el.childNodes);
}

export default function transform(hookName, element, payload) {
  const document = (payload && payload.document) || element.ownerDocument;

  if (hookName === 'beforeTransform') {
    WebImporter.DOMUtils.remove(element, [
      '#scrolling-div',
      '.navbar-fixed-top',
      '.mobile-nav',
      '.more-nav--container',
      'footer#footer',
      '#footer',
      '#sub-footer',
      '#stickyfooter',
      '.scroll-button',
      '.TopBar',
      '.supernav',
      '.resourceVersionMetaData',
      '.carousel-control',
      '.carousel-indicators',
      '.helping-cta-background-mobile',
      // OneTrust cookie consent / Qualtrics feedback
      '#onetrust-consent-sdk',
      '[id^="onetrust-"]',
      '[class*="QSI"]',
      '[id^="QSI"]',
      // tracking, scripts, embeds, portal plumbing
      'script',
      'style',
      'noscript',
      'link',
      'iframe',
      'input',
      'img[width="1"][height="1"]',
      // decorative Font Awesome glyphs (quote marks, phone, ellipsis)
      'span.fa',
      'i.fa',
    ]);

    // Liferay wraps every content portlet in a JSF <form>: keep the content, drop the form.
    element.querySelectorAll('form').forEach(unwrap);

    // Coloured words (<font style="color:...">) become emphasis, styled by the template.
    element.querySelectorAll('font').forEach((font) => {
      const em = document.createElement('em');
      em.append(...font.childNodes);
      font.replaceWith(em);
    });
    // Headings are bold by design; drop redundant <strong> wrappers inside them.
    element.querySelectorAll('h1 strong, h2 strong, h3 strong, h4 strong').forEach(unwrap);

    // Helping Clients banner: its background photo strip becomes an authored image.
    element.querySelectorAll('.helping-cta-background').forEach((bg) => {
      const src = bg.getAttribute('data-bg-src');
      if (!src) {
        bg.remove();
        return;
      }
      const img = document.createElement('img');
      img.src = src;
      img.alt = bg.getAttribute('data-bg-alt') || '';
      const p = document.createElement('p');
      p.append(img);
      bg.replaceWith(p);
    });
  }

  if (hookName === 'afterTransform') {
    element.querySelectorAll('a[href]').forEach((a) => {
      const href = rewriteHref(a.getAttribute('href'));
      if (href === null) a.removeAttribute('href');
      else a.setAttribute('href', href);
    });

    element.querySelectorAll('*').forEach((el) => {
      [...el.attributes].forEach((attr) => {
        const n = attr.name;
        // data-excat-* markers belong to the sections transformer, which runs after this one
        if (n.startsWith('data-excat-')) return;
        if (n === 'id' || n === 'style' || n.startsWith('on') || n.startsWith('data-')
          || n.startsWith('aria-') || n === 'role') {
          el.removeAttribute(n);
        }
      });
    });
  }
}
