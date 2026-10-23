import { decorateIcons, getMetadata, toClassName } from '../../scripts/aem.js';
import { getFragmentPath } from '../../scripts/scripts.js';
import { loadFragment } from '../fragment/fragment.js';

// desktop header layout (source switches from drawer to bar navigation at its 1240px breakpoint)
const isDesktop = window.matchMedia('(width >= 1200px)');

// grouped utility dropdowns (e.g. region list) flow into this many columns
const UTILITY_PANEL_COLUMNS = 3;

let idCounter = 0;
const nextId = (prefix) => {
  idCounter += 1;
  return `${prefix}-${idCounter}`;
};

/**
 * Converts inline `:icon-name:` notation inside mixed text nodes into EDS icon spans.
 * (Whole-node notation is already handled by decorateMain; DA delivers icon spans directly.)
 * @param {Element} root container
 */
function decorateInlineIcons(root) {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  const nodes = [];
  while (walker.nextNode()) {
    if (/:[a-z0-9-]+:/.test(walker.currentNode.nodeValue)) nodes.push(walker.currentNode);
  }
  nodes.forEach((node) => {
    const parts = node.nodeValue.split(/:([a-z0-9-]+):/);
    const frag = document.createDocumentFragment();
    parts.forEach((part, i) => {
      if (i % 2) {
        const span = document.createElement('span');
        span.className = `icon icon-${part}`;
        frag.append(span);
      } else if (part.trim()) {
        frag.append(document.createTextNode(i === parts.length - 1 ? part.trimStart() : part));
      }
    });
    node.replaceWith(frag);
  });
  decorateIcons(root);
  // icons are decorative next to visible text
  root.querySelectorAll('span.icon img').forEach((img) => { img.alt = ''; });
}

/**
 * Reads "Key: value" list items from a labels section into a lookup.
 * @param {Element} section labels section
 * @returns {Object<string,string>}
 */
function readLabels(section) {
  const labels = {};
  if (!section) return labels;
  section.querySelectorAll('li, p').forEach((item) => {
    const text = item.textContent.trim();
    const idx = text.indexOf(':');
    if (idx > 0) labels[toClassName(text.slice(0, idx))] = text.slice(idx + 1).trim();
  });
  return labels;
}

/**
 * Returns the label nodes (text + icons) that precede a nested list.
 * @param {Element} li list item
 * @returns {Node[]}
 */
function getLabelNodes(li) {
  return [...li.childNodes].filter((n) => !(n.nodeType === Node.ELEMENT_NODE && n.matches('ul, ol')));
}

/** Marks the author-highlighted (bold) entry as the current one. */
function markCurrent(ul) {
  ul.querySelectorAll('strong > a, b > a').forEach((a) => {
    a.setAttribute('aria-current', 'true');
    a.classList.add('nav-current');
    a.parentElement.replaceWith(a);
  });
}

/** External links inside panels open in a new tab (same as the source site). */
function decoratePanelLinks(panel) {
  panel.querySelectorAll('a[href]').forEach((a) => {
    let url;
    try {
      url = new URL(a.href);
    } catch {
      return;
    }
    if (url.host !== window.location.host && a.getAttribute('aria-current') !== 'true'
      && /^https?:$/.test(url.protocol)) {
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
    }
  });
}

/**
 * Turns a list item with a nested list into a disclosure (button + panel).
 * Leading links become the panel intro (e.g. "overview"), nested lists become
 * titled columns and trailing links become the panel footer.
 * @param {Element} li list item containing a nested <ul>
 * @param {number} [stackColumns] stack the groups into this many columns (0 = one per group)
 */
function buildDropdown(li, stackColumns = 0) {
  const list = li.querySelector(':scope > ul, :scope > ol');
  const trigger = document.createElement('button');
  trigger.type = 'button';
  trigger.className = 'nav-drop-trigger';
  trigger.setAttribute('aria-expanded', 'false');
  const label = document.createElement('span');
  label.className = 'nav-drop-label';
  label.append(...getLabelNodes(li));
  trigger.append(label);

  const panel = document.createElement('div');
  panel.className = 'nav-panel';
  panel.id = nextId('nav-panel');
  trigger.setAttribute('aria-controls', panel.id);
  markCurrent(list);

  const items = [...list.children];
  const hasGroups = items.some((item) => item.querySelector(':scope > ul, :scope > ol'));
  if (hasGroups) {
    const intro = document.createElement('div');
    intro.className = 'nav-panel-intro';
    const columns = document.createElement('div');
    columns.className = 'nav-panel-columns';
    const outro = document.createElement('div');
    outro.className = 'nav-panel-outro';
    items.forEach((item) => {
      const sub = item.querySelector(':scope > ul, :scope > ol');
      if (sub) {
        const group = document.createElement('div');
        group.className = 'nav-group';
        const title = document.createElement('p');
        title.className = 'nav-group-title';
        title.append(...getLabelNodes(item));
        group.append(title, sub);
        columns.append(group);
      } else {
        const p = document.createElement('p');
        p.append(...item.childNodes);
        (columns.children.length ? outro : intro).append(p);
      }
    });
    if (stackColumns > 0) {
      const groups = [...columns.children];
      const perColumn = Math.ceil(groups.length / stackColumns);
      for (let i = 0; i < groups.length; i += perColumn) {
        const col = document.createElement('div');
        col.className = 'nav-panel-col';
        col.append(...groups.slice(i, i + perColumn));
        columns.append(col);
      }
    }
    [intro, columns, outro].forEach((part) => { if (part.children.length) panel.append(part); });
    li.classList.add('nav-drop-wide');
  } else {
    panel.append(list);
  }
  decoratePanelLinks(panel);
  li.classList.add('nav-drop');
  li.replaceChildren(trigger, panel);
  return trigger;
}

function setExpanded(trigger, expanded) {
  trigger.setAttribute('aria-expanded', expanded ? 'true' : 'false');
  trigger.closest('.nav-drop')?.classList.toggle('is-open', expanded);
}

function closeAllDropdowns(nav, except) {
  nav.querySelectorAll('.nav-drop-trigger[aria-expanded="true"]').forEach((t) => {
    if (t !== except) setExpanded(t, false);
  });
}

/**
 * Builds a search form (controls live in code; copy comes from the nav search link).
 * @param {HTMLAnchorElement} link authored search link (href = results page, text = label)
 * @param {string} idPrefix unique id prefix
 */
function buildSearchForm(link, idPrefix) {
  const text = link.textContent.trim();
  const form = document.createElement('form');
  form.className = 'nav-search-form';
  form.setAttribute('role', 'search');
  form.action = link.href;
  form.method = 'get';
  const input = document.createElement('input');
  input.type = 'search';
  input.name = 'q';
  input.id = nextId(idPrefix);
  input.placeholder = text;
  input.setAttribute('aria-label', text);
  input.autocomplete = 'off';
  const submit = document.createElement('button');
  submit.type = 'submit';
  submit.className = 'nav-search-submit';
  submit.textContent = text;
  form.append(input, submit);
  return form;
}

/**
 * Builds skip links from an authored list of in-page anchors. A hash resolves to an element id,
 * a landmark tag (#main, #footer) or a header link with the same name (#sign-in -> "Sign in").
 * @param {Element} section skip links section
 * @param {Element} nav decorated nav
 */
function buildSkipLinks(section, nav) {
  const list = section.querySelector('ul');
  if (!list) return null;
  list.className = 'nav-skip-links';
  list.querySelectorAll('a[href^="#"]').forEach((a) => {
    const key = a.getAttribute('href').slice(1);
    a.addEventListener('click', (e) => {
      const target = document.getElementById(key)
        || (/^[a-z]+$/.test(key) ? document.querySelector(key) : null)
        || [...nav.querySelectorAll('a[href], button')].find((el) => toClassName(el.textContent) === key);
      if (!target) return;
      e.preventDefault();
      if (!target.matches('a[href], button, input, [tabindex]')) target.setAttribute('tabindex', '-1');
      target.focus();
      target.scrollIntoView?.({ block: 'start' });
    });
  });
  return list;
}

/**
 * Builds breadcrumbs (opt-in via `breadcrumbs: true` page metadata) from the nav tree.
 * @param {Element} nav decorated nav
 * @param {string} homeLabel label for the home crumb
 */
function buildBreadcrumbs(nav, homeLabel) {
  const homeLink = nav.querySelector('.nav-brand a[href]');
  const homeUrl = homeLink ? homeLink.href : `${window.location.origin}/`;
  const currentUrl = window.location.href;
  const crumbs = [];
  const match = [...nav.querySelectorAll('.nav-sections a[href]')].find((a) => a.href === currentUrl);
  if (match) {
    crumbs.push({ title: match.textContent.trim() });
    const group = match.closest('.nav-group')?.querySelector('.nav-group-title');
    if (group) crumbs.unshift({ title: group.textContent.trim() });
    const top = match.closest('.nav-drop')?.querySelector('.nav-drop-trigger');
    if (top) crumbs.unshift({ title: top.textContent.trim() });
  } else if (currentUrl !== homeUrl) {
    crumbs.push({ title: getMetadata('og:title') || document.title });
  }
  crumbs.unshift({ title: homeLabel, url: homeUrl });

  const breadcrumbs = document.createElement('nav');
  breadcrumbs.className = 'breadcrumbs';
  const ol = document.createElement('ol');
  crumbs.forEach((item, i) => {
    const li = document.createElement('li');
    if (i === crumbs.length - 1) li.setAttribute('aria-current', 'page');
    if (item.url && i < crumbs.length - 1) {
      const a = document.createElement('a');
      a.href = item.url;
      a.textContent = item.title;
      li.append(a);
    } else {
      li.textContent = item.title;
    }
    ol.append(li);
  });
  breadcrumbs.append(ol);
  return breadcrumbs;
}

/**
 * loads and decorates the header, mainly the nav
 * @param {Element} block The header block element
 */
export default async function decorate(block) {
  // load nav as fragment (locale-aware; honours a `nav` metadata override)
  const fragment = await loadFragment(getFragmentPath('nav'));
  if (!fragment) return;
  decorateInlineIcons(fragment);

  const allSections = [...fragment.querySelectorAll(':scope > .section')];
  // a section made only of in-page anchors holds the skip links (position independent)
  const skipSection = allSections.find((sec) => {
    const links = [...sec.querySelectorAll('a')];
    return links.length && links.every((a) => a.getAttribute('href')?.startsWith('#'));
  });
  const sections = allSections.filter((sec) => sec !== skipSection);
  const [utilitySection, brandSection, mainSection, toolsSection, labelsSection] = sections;
  const labels = readLabels(labelsSection);

  // normalise link accessible names (visible text / img alt is enough)
  fragment.querySelectorAll('a[aria-label]').forEach((a) => {
    if (a.textContent.trim() || a.querySelector('img[alt]')) a.removeAttribute('aria-label');
  });
  fragment.querySelectorAll('.button-wrapper, .button').forEach((el) => el.classList.remove('button-wrapper', 'button', 'primary', 'secondary', 'accent'));

  const nav = document.createElement('nav');
  nav.id = 'nav';
  nav.setAttribute('aria-expanded', 'false');

  const bar = document.createElement('div');
  bar.className = 'nav-bar';

  // brand
  const brand = document.createElement('div');
  brand.className = 'nav-brand';
  if (brandSection) brand.append(...brandSection.querySelector('.default-content-wrapper, div')?.childNodes || []);
  brand.querySelectorAll('img').forEach((img) => { img.loading = 'eager'; });

  // drawer holds everything that collapses into the mobile menu
  const drawer = document.createElement('div');
  drawer.className = 'nav-drawer';
  drawer.id = nextId('nav-drawer');

  const wrapSection = (section, className) => {
    const div = document.createElement('div');
    div.className = className;
    if (section) div.append(...(section.querySelector('.default-content-wrapper') || section).childNodes);
    return div;
  };
  const navSections = wrapSection(mainSection, 'nav-sections');
  const navTools = wrapSection(toolsSection, 'nav-tools');
  const navUtility = wrapSection(utilitySection, 'nav-utility');

  // megamenus: one column per group; utility dropdowns stack groups into fixed columns
  [[navSections, 0], [navUtility, UTILITY_PANEL_COLUMNS]].forEach(([container, cols]) => {
    container.querySelectorAll(':scope > ul > li').forEach((li) => {
      if (li.querySelector(':scope > ul')) buildDropdown(li, cols);
    });
  });

  // search: the authored link (results page) becomes a toggle + forms built in code
  const searchLink = [...navTools.querySelectorAll('a[href]')].find((a) => /search/i.test(new URL(a.href).pathname));
  let searchBar;
  let searchToggle;
  if (searchLink) {
    searchBar = document.createElement('div');
    searchBar.className = 'nav-search';
    searchBar.id = nextId('nav-search');
    searchBar.hidden = true;
    const searchInner = document.createElement('div');
    searchInner.className = 'nav-search-inner';
    const close = document.createElement('button');
    close.type = 'button';
    close.className = 'nav-search-close';
    close.setAttribute('aria-label', labels['close-search'] || '');
    searchInner.append(buildSearchForm(searchLink, 'nav-search-input'), close);
    searchBar.append(searchInner);

    const drawerSearch = document.createElement('div');
    drawerSearch.className = 'nav-drawer-search';
    drawerSearch.append(buildSearchForm(searchLink, 'nav-drawer-search-input'));
    drawer.append(drawerSearch);

    searchToggle = document.createElement('button');
    searchToggle.type = 'button';
    searchToggle.className = 'nav-search-toggle';
    searchToggle.setAttribute('aria-expanded', 'false');
    searchToggle.setAttribute('aria-controls', searchBar.id);
    searchToggle.append(...searchLink.childNodes);
    searchLink.closest('li').classList.add('nav-tools-search');
    searchLink.replaceWith(searchToggle);

    const setSearch = (open) => {
      searchBar.hidden = !open;
      searchToggle.setAttribute('aria-expanded', open ? 'true' : 'false');
      block.classList.toggle('search-open', open);
      if (open) searchBar.querySelector('input').focus();
    };
    searchToggle.addEventListener('click', () => {
      closeAllDropdowns(nav);
      setSearch(searchBar.hidden);
    });
    close.addEventListener('click', () => {
      setSearch(false);
      searchToggle.focus();
    });
    searchBar.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        setSearch(false);
        searchToggle.focus();
      }
    });
  }

  drawer.append(navSections, navTools, navUtility);

  // hamburger (mobile drawer toggle)
  const hamburger = document.createElement('button');
  hamburger.type = 'button';
  hamburger.className = 'nav-hamburger';
  hamburger.setAttribute('aria-controls', drawer.id);
  hamburger.setAttribute('aria-expanded', 'false');
  hamburger.setAttribute('aria-label', labels['open-menu'] || '');
  hamburger.innerHTML = '<span class="nav-hamburger-icon" aria-hidden="true"></span>';

  const toggleMenu = (force) => {
    const open = typeof force === 'boolean' ? force : nav.getAttribute('aria-expanded') !== 'true';
    nav.setAttribute('aria-expanded', open ? 'true' : 'false');
    hamburger.setAttribute('aria-expanded', open ? 'true' : 'false');
    hamburger.setAttribute('aria-label', (open ? labels['close-menu'] : labels['open-menu']) || '');
    document.body.style.overflowY = open && !isDesktop.matches ? 'hidden' : '';
    if (!open) closeAllDropdowns(nav);
  };
  hamburger.addEventListener('click', () => toggleMenu());

  bar.append(hamburger, brand, drawer);
  nav.append(bar);

  // dropdown / accordion behaviour (click on desktop and mobile, like the source)
  nav.querySelectorAll('.nav-drop-trigger').forEach((trigger) => {
    trigger.addEventListener('click', () => {
      const expanded = trigger.getAttribute('aria-expanded') === 'true';
      if (isDesktop.matches) {
        closeAllDropdowns(nav, trigger);
        if (searchBar && !searchBar.hidden) searchBar.querySelector('.nav-search-close').click();
      }
      setExpanded(trigger, !expanded);
    });
  });

  // close panels on outside click, focus loss and Escape (desktop)
  document.addEventListener('click', (e) => {
    if (isDesktop.matches && !nav.contains(e.target)) closeAllDropdowns(nav);
  });
  nav.addEventListener('focusout', (e) => {
    if (isDesktop.matches && e.relatedTarget && !nav.contains(e.relatedTarget)) closeAllDropdowns(nav);
  });
  nav.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return;
    const open = nav.querySelector('.nav-drop-trigger[aria-expanded="true"]');
    if (open) {
      setExpanded(open, false);
      open.focus();
    } else if (!isDesktop.matches && nav.getAttribute('aria-expanded') === 'true') {
      toggleMenu(false);
      hamburger.focus();
    }
  });

  // reset state when crossing the desktop breakpoint
  isDesktop.addEventListener('change', () => {
    toggleMenu(false);
    closeAllDropdowns(nav);
    if (searchBar && !searchBar.hidden) searchBar.querySelector('.nav-search-close').click();
  });

  const navWrapper = document.createElement('div');
  navWrapper.className = 'nav-wrapper';
  const skipLinks = skipSection && buildSkipLinks(skipSection, nav);
  if (skipLinks) navWrapper.append(skipLinks);
  if (searchBar) navWrapper.append(searchBar);
  navWrapper.append(nav);
  block.replaceChildren(navWrapper);

  if (getMetadata('breadcrumbs').toLowerCase() === 'true') {
    const homeLabel = labels.home || brand.querySelector('img')?.alt || '';
    navWrapper.append(buildBreadcrumbs(nav, homeLabel));
  }
}
