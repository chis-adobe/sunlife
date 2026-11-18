/* eslint-disable */
var CustomImportScript = (() => {
  var __defProp = Object.defineProperty;
  var __defProps = Object.defineProperties;
  var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
  var __getOwnPropDescs = Object.getOwnPropertyDescriptors;
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __getOwnPropSymbols = Object.getOwnPropertySymbols;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
  var __propIsEnum = Object.prototype.propertyIsEnumerable;
  var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
  var __spreadValues = (a, b) => {
    for (var prop in b || (b = {}))
      if (__hasOwnProp.call(b, prop))
        __defNormalProp(a, prop, b[prop]);
    if (__getOwnPropSymbols)
      for (var prop of __getOwnPropSymbols(b)) {
        if (__propIsEnum.call(b, prop))
          __defNormalProp(a, prop, b[prop]);
      }
    return a;
  };
  var __spreadProps = (a, b) => __defProps(a, __getOwnPropDescs(b));
  var __export = (target, all) => {
    for (var name in all)
      __defProp(target, name, { get: all[name], enumerable: true });
  };
  var __copyProps = (to, from, except, desc) => {
    if (from && typeof from === "object" || typeof from === "function") {
      for (let key of __getOwnPropNames(from))
        if (!__hasOwnProp.call(to, key) && key !== except)
          __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
    }
    return to;
  };
  var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);
  var __async = (__this, __arguments, generator) => {
    return new Promise((resolve, reject) => {
      var fulfilled = (value) => {
        try {
          step(generator.next(value));
        } catch (e) {
          reject(e);
        }
      };
      var rejected = (value) => {
        try {
          step(generator.throw(value));
        } catch (e) {
          reject(e);
        }
      };
      var step = (x) => x.done ? resolve(x.value) : Promise.resolve(x.value).then(fulfilled, rejected);
      step((generator = generator.apply(__this, __arguments)).next());
    });
  };

  // tools/importer/import-monarch-financial.js
  var import_monarch_financial_exports = {};
  __export(import_monarch_financial_exports, {
    default: () => import_monarch_financial_default
  });

  // tools/importer/parsers/monarch-utils.js
  var ORIGIN = "https://web.sunlife.ca";
  function absUrl(url) {
    if (!url) return url;
    const clean2 = url.trim();
    if (clean2.startsWith("//")) return `https:${clean2}`;
    if (clean2.startsWith("/")) return `${ORIGIN}${clean2}`;
    return clean2;
  }
  function backgroundUrl(el2) {
    if (!el2) return "";
    const stamped = el2.getAttribute("data-bg-src");
    if (stamped) return stamped;
    const m = (el2.getAttribute("style") || "").match(/background-image\s*:\s*url\(\s*['"]?([^'")]+)['"]?\s*\)/i);
    return m ? m[1] : "";
  }
  function buildImage(document, src, alt) {
    const img = document.createElement("img");
    img.src = absUrl(src);
    img.alt = (alt || "").trim();
    return img;
  }
  function text(el2) {
    return el2 ? el2.textContent.replace(/\u00a0/g, " ").replace(/\s+/g, " ").trim() : "";
  }

  // tools/importer/parsers/monarch-hero-panel.js
  function parse(element, { document }) {
    const cells = [];
    const bg = element.querySelector("#bannerBackgroundImage, .theme-banner");
    const src = backgroundUrl(bg);
    if (src) {
      const alt = bg.getAttribute("title") || bg.getAttribute("alt") || "";
      cells.push([buildImage(document, src, alt)]);
    }
    const cta = element.querySelector(".call-to-action") || element;
    const content = [];
    const title = cta.querySelector("h1, h2");
    if (title) {
      const h1 = document.createElement("h1");
      h1.textContent = text(title);
      content.push(h1);
    }
    cta.querySelectorAll("p").forEach((p) => {
      if (!text(p)) return;
      const para = document.createElement("p");
      para.innerHTML = p.innerHTML.trim();
      content.push(para);
    });
    if (content.length) cells.push([content]);
    const block = WebImporter.Blocks.createBlock(document, { name: "Hero (panel)", cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/monarch-columns-media.js
  function parse2(element, { document }) {
    const imageHolder = element.querySelector('.image-2, [class^="image-section"] [data-bg-src]');
    const src = backgroundUrl(imageHolder);
    const imageCell = src ? [buildImage(document, src, imageHolder.getAttribute("title"))] : [];
    const textEl = element.querySelector('[class^="text-section"]') || element;
    const textCell = [];
    [...textEl.children].forEach((child) => {
      if (!text(child)) return;
      if (/^H[1-6]$/.test(child.tagName)) {
        const h2 = document.createElement("h2");
        h2.textContent = text(child).replace(/\s*:\s*$/, ":");
        textCell.push(h2);
      } else {
        textCell.push(child);
      }
    });
    const cells = [[imageCell, textCell]];
    const block = WebImporter.Blocks.createBlock(document, { name: "Columns (media)", cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/monarch-columns-callout.js
  function parse3(element, { document }) {
    const srcImg = element.querySelector("img");
    const imageCell = srcImg ? [buildImage(document, srcImg.getAttribute("src"), srcImg.getAttribute("alt"))] : [];
    const textEl = element.querySelector(".right, .have-questions-text") || element;
    const textCell = [];
    textEl.querySelectorAll("h1, h2, h3, h4, p, a").forEach((el2) => {
      if (!text(el2)) return;
      if (/^H[1-6]$/.test(el2.tagName)) {
        const h2 = document.createElement("h2");
        h2.textContent = text(el2);
        textCell.push(h2);
      } else if (el2.tagName === "P") {
        if (el2.closest("a")) return;
        const p = document.createElement("p");
        p.textContent = text(el2);
        textCell.push(p);
      } else if (el2.tagName === "A" && !el2.closest("p")) {
        const a = document.createElement("a");
        a.href = el2.getAttribute("href");
        a.textContent = text(el2);
        const strong = document.createElement("strong");
        strong.append(a);
        const p = document.createElement("p");
        p.append(strong);
        textCell.push(p);
      }
    });
    const cells = [[imageCell, textCell]];
    const block = WebImporter.Blocks.createBlock(document, { name: "Columns (callout)", cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/monarch-carousel-testimonials.js
  function parse4(element, { document }) {
    const cells = [];
    element.querySelectorAll(".carousel-inner > .item, .item").forEach((item) => {
      const paragraphs = [...item.querySelectorAll("p")].map(text).filter(Boolean);
      if (!paragraphs.length) return;
      const content = paragraphs.map((t) => {
        const p = document.createElement("p");
        p.textContent = t;
        return p;
      });
      cells.push([content]);
    });
    const block = WebImporter.Blocks.createBlock(document, { name: "Carousel (testimonials)", cells });
    element.replaceWith(block);
  }

  // tools/importer/transformers/monarch-cleanup.js
  var ORIGIN2 = "https://web.sunlife.ca";
  var SITE_PATH = "/monarch-financial";
  function rewriteHref(href) {
    if (!href || /^(#|mailto:|tel:)/i.test(href)) return href;
    if (/^javascript:/i.test(href)) return null;
    let url;
    try {
      url = new URL(href, `${ORIGIN2}/`);
    } catch (e) {
      return href;
    }
    if (url.origin !== ORIGIN2) return href;
    if (url.pathname === SITE_PATH || url.pathname.startsWith(`${SITE_PATH}/`)) {
      const path = url.pathname.replace(/\/home\/?$/, "/").replace(new RegExp(`^${SITE_PATH}$`), `${SITE_PATH}/`);
      return `${path}${url.search}${url.hash}`;
    }
    return url.href;
  }
  function unwrap(el2) {
    el2.replaceWith(...el2.childNodes);
  }
  function transform(hookName, element, payload) {
    const document = payload && payload.document || element.ownerDocument;
    if (hookName === "beforeTransform") {
      WebImporter.DOMUtils.remove(element, [
        "#scrolling-div",
        ".navbar-fixed-top",
        ".mobile-nav",
        ".more-nav--container",
        "footer#footer",
        "#footer",
        "#sub-footer",
        "#stickyfooter",
        ".scroll-button",
        ".TopBar",
        ".supernav",
        ".resourceVersionMetaData",
        ".carousel-control",
        ".carousel-indicators",
        ".helping-cta-background-mobile",
        // OneTrust cookie consent / Qualtrics feedback
        "#onetrust-consent-sdk",
        '[id^="onetrust-"]',
        '[class*="QSI"]',
        '[id^="QSI"]',
        // tracking, scripts, embeds, portal plumbing
        "script",
        "style",
        "noscript",
        "link",
        "iframe",
        "input",
        'img[width="1"][height="1"]',
        // decorative Font Awesome glyphs (quote marks, phone, ellipsis)
        "span.fa",
        "i.fa"
      ]);
      element.querySelectorAll("form").forEach(unwrap);
      element.querySelectorAll("font").forEach((font) => {
        const em = document.createElement("em");
        em.append(...font.childNodes);
        font.replaceWith(em);
      });
      element.querySelectorAll("h1 strong, h2 strong, h3 strong, h4 strong").forEach(unwrap);
      element.querySelectorAll(".helping-cta-background").forEach((bg) => {
        const src = bg.getAttribute("data-bg-src");
        if (!src) {
          bg.remove();
          return;
        }
        const img = document.createElement("img");
        img.src = src;
        img.alt = bg.getAttribute("data-bg-alt") || "";
        const p = document.createElement("p");
        p.append(img);
        bg.replaceWith(p);
      });
    }
    if (hookName === "afterTransform") {
      element.querySelectorAll("a[href]").forEach((a) => {
        const href = rewriteHref(a.getAttribute("href"));
        if (href === null) a.removeAttribute("href");
        else a.setAttribute("href", href);
      });
      element.querySelectorAll("*").forEach((el2) => {
        [...el2.attributes].forEach((attr) => {
          const n = attr.name;
          if (n.startsWith("data-excat-")) return;
          if (n === "id" || n === "style" || n.startsWith("on") || n.startsWith("data-") || n.startsWith("aria-") || n === "role") {
            el2.removeAttribute(n);
          }
        });
      });
    }
  }

  // tools/importer/transformers/sunlife-sections.js
  var MARKER = "data-excat-section-id";
  function findSectionElement(root, section) {
    const selectors = Array.isArray(section.selector) ? section.selector : [section.selector];
    for (const sel of selectors) {
      if (!sel) continue;
      try {
        const el2 = root.querySelector(sel);
        if (el2) return el2;
      } catch (e) {
      }
    }
    return null;
  }
  function transform2(hookName, element, payload) {
    const template = payload && payload.template;
    const sections = template && template.sections;
    if (!sections || sections.length < 2) return;
    const document = payload && payload.document || element.ownerDocument;
    if (hookName === "beforeTransform") {
      for (let i = sections.length - 1; i >= 0; i -= 1) {
        const section = sections[i];
        const el2 = findSectionElement(element, section);
        if (!el2) continue;
        if (i === 0 && !section.style) continue;
        const hr = document.createElement("hr");
        if (section.style) hr.setAttribute(MARKER, section.id);
        if (i === 0) hr.setAttribute("data-excat-first-section", "true");
        el2.parentNode.insertBefore(hr, el2);
      }
    }
    if (hookName === "afterTransform") {
      for (let i = sections.length - 1; i >= 0; i -= 1) {
        const section = sections[i];
        if (!section.style) continue;
        const marker = element.querySelector(`hr[${MARKER}="${section.id}"]`);
        const anchor = marker || findSectionElement(element, section);
        if (!anchor) continue;
        const meta = WebImporter.Blocks.createBlock(document, {
          name: "Section Metadata",
          cells: { style: section.style }
        });
        anchor.after(meta);
      }
      element.querySelectorAll(`hr[${MARKER}]`).forEach((hr) => {
        if (hr.hasAttribute("data-excat-first-section")) {
          hr.remove();
        } else {
          hr.removeAttribute(MARKER);
        }
      });
    }
  }

  // tools/importer/import-monarch-financial.js
  var PAGE_TEMPLATE = {
    "name": "monarch-financial",
    "urls": [
      "https://web.sunlife.ca/monarch-financial/"
    ],
    "representativeUrl": "https://web.sunlife.ca/monarch-financial/",
    "description": "Monarch Financial advisor sub site (web.sunlife.ca advisor platform): full-bleed hero with caption panel, services media columns, Sun Life contract notice, beige intro, client testimonial carousel, intake questionnaire callout and a photo-strip closing banner. Own nav/footer fragments under /monarch-financial/fragments/.",
    "urlPattern": "https://web.sunlife.ca/monarch-financial/*",
    "targetPath": "/monarch-financial/",
    "pageMetadata": {
      "template": "monarch-financial",
      "nav": "/monarch-financial/fragments/nav",
      "footer": "/monarch-financial/fragments/footer"
    },
    "fragments": {
      "nav": "/monarch-financial/fragments/nav",
      "footer": "/monarch-financial/fragments/footer"
    },
    "blocks": [
      { "name": "hero-panel", "instances": ["header#header"] },
      { "name": "columns-media", "instances": [".image-text-section-2"] },
      { "name": "columns-callout", "instances": [".section1_hp", ".have-questions"] },
      { "name": "carousel-testimonials", "instances": [".da-updates .carousel"] }
    ],
    "sections": [
      { "id": "mf1", "name": "Hero", "selector": ["header#header"], "style": null, "blocks": ["hero-panel"], "defaultContent": [] },
      { "id": "mf2", "name": "Our services", "selector": [".image-text-section-2"], "style": null, "blocks": ["columns-media"], "defaultContent": [] },
      { "id": "mf3", "name": "Sun Life contract notice", "selector": [".section1_hp"], "style": "dark", "blocks": ["columns-callout"], "defaultContent": [] },
      { "id": "mf4", "name": "Why Monarch Financial", "selector": [".header-background"], "style": "beige", "blocks": [], "defaultContent": [".header-background-text"] },
      { "id": "mf5", "name": "Client testimonials", "selector": [".what-clients-say-about-us"], "style": "dark", "blocks": ["carousel-testimonials"], "defaultContent": [".what-clients-say-about-us h2"] },
      { "id": "mf6", "name": "Have questions", "selector": [".have-questions"], "style": null, "blocks": ["columns-callout"], "defaultContent": [] },
      { "id": "mf7", "name": "Helping clients", "selector": [".helping-cta"], "style": "photo-strip", "blocks": [], "defaultContent": [".helping-cta-text h3", ".helping-cta-background"] }
    ]
  };
  var ORIGIN3 = "https://web.sunlife.ca";
  var SITE_PATH2 = "/monarch-financial";
  var parsers = {
    "hero-panel": parse,
    "columns-media": parse2,
    "columns-callout": parse3,
    "carousel-testimonials": parse4
  };
  var transformers = [transform, transform2];
  var NAV_LABELS = ["Open menu: Open menu", "Close menu: Close menu", "Home: Home"];
  function executeTransformers(hookName, element, payload) {
    const enhancedPayload = __spreadProps(__spreadValues({}, payload), { template: PAGE_TEMPLATE });
    transformers.forEach((fn) => {
      try {
        fn(hookName, element, enhancedPayload);
      } catch (e) {
        console.error(`Transformer failed at ${hookName}:`, e);
      }
    });
  }
  function findBlocksOnPage(document, template) {
    const pageBlocks = [];
    template.blocks.forEach((blockDef) => {
      blockDef.instances.forEach((selector) => {
        document.querySelectorAll(selector).forEach((element) => {
          pageBlocks.push({ name: blockDef.name, selector, element });
        });
      });
    });
    return pageBlocks;
  }
  var clean = (s) => (s || "").replace(/\u00a0/g, " ").replace(/\s+/g, " ").trim();
  function absUrl2(url) {
    if (!url) return url;
    return new URL(url.trim(), `${ORIGIN3}/`).href;
  }
  function siteHref(href) {
    if (!href || /^(#|mailto:|tel:)/i.test(href)) return href;
    const url = new URL(href.trim(), `${ORIGIN3}/`);
    if (url.origin === ORIGIN3 && (url.pathname === SITE_PATH2 || url.pathname.startsWith(`${SITE_PATH2}/`))) {
      return url.pathname.replace(/\/home\/?$/, "/").replace(new RegExp(`^${SITE_PATH2}$`), `${SITE_PATH2}/`);
    }
    return url.href;
  }
  function el(document, tag, props = {}, children = []) {
    const node = document.createElement(tag);
    Object.entries(props).forEach(([k, v]) => {
      if (v != null) node.setAttribute(k, v);
    });
    children.forEach((c) => node.append(typeof c === "string" ? document.createTextNode(c) : c));
    return node;
  }
  function link(document, a, content) {
    return el(document, "a", { href: siteHref(a.getAttribute("href")) }, [content || clean(a.textContent)]);
  }
  function imageLink(document, a, img) {
    const image = el(document, "img", { src: absUrl2(img.getAttribute("src")), alt: clean(img.getAttribute("alt")) });
    return link(document, a, image);
  }
  function list(document, items) {
    return el(document, "ul", {}, items.map((item) => el(document, "li", {}, [item])));
  }
  function buildNav(document) {
    const source = document.querySelector("#scrolling-div, .navbar-fixed-top");
    if (!source) return null;
    const root = document.createElement("div");
    const sections = [];
    const logoLink = source.querySelector(".cust-theme-logo, .logo-holder a");
    const logo = logoLink && logoLink.querySelector("img");
    if (logo) sections.push([el(document, "p", {}, [imageLink(document, logoLink, logo)])]);
    const items = [...source.querySelectorAll(".nav-pages--items > li")].filter((li) => li.querySelector("a"));
    const isTool = (li) => /login|sign-?in/i.test(li.id || li.querySelector("a").getAttribute("href"));
    const visible = items.filter((li) => !isTool(li));
    const overflow = items.filter(isTool);
    sections.push([list(document, visible.map((li) => link(document, li.querySelector("a"))))]);
    if (overflow.length) sections.push([list(document, overflow.map((li) => link(document, li.querySelector("a"))))]);
    sections.push([list(document, NAV_LABELS)]);
    const skip = source.querySelector("#skip-to-main, .TopBar--skipLinks a");
    if (skip) sections.push([list(document, [el(document, "a", { href: "#main" }, [clean(skip.textContent)])])]);
    sections.forEach((nodes, i) => {
      if (i) root.append(document.createElement("hr"));
      root.append(...nodes);
    });
    return root;
  }
  function buildFooter(document) {
    const source = document.querySelector("footer#footer");
    if (!source) return null;
    const disclosure = source.querySelector(".disclosure") || source;
    const root = document.createElement("div");
    const grid = disclosure.querySelector(".footer-grid");
    const row = [];
    if (grid) {
      const logoA = grid.querySelector(".footer-logo a");
      const logo = logoA && logoA.querySelector("img");
      if (logo) row.push(el(document, "p", {}, [imageLink(document, logoA, logo)]));
      const contact = grid.querySelector(".contact-us-button a");
      if (contact) row.push(el(document, "p", {}, [el(document, "strong", {}, [link(document, contact)])]));
      const privacy = grid.querySelector(".privacy-terms-button a");
      if (privacy) row.push(el(document, "p", {}, [link(document, privacy)]));
      const social = [...grid.querySelectorAll(".footer-social-media a")].filter((a) => a.querySelector("img")).map((a) => imageLink(document, a, a.querySelector("img")));
      if (social.length) row.push(list(document, social));
    }
    root.append(...row);
    const legalList = disclosure.querySelector(".disclosure-links ul");
    const paragraphs = [...disclosure.querySelectorAll(":scope > p")].filter((p) => clean(p.textContent));
    const isBefore = (p) => legalList && p.compareDocumentPosition(legalList) & 4;
    const statement = paragraphs.filter(isBefore);
    const disclosures = paragraphs.filter((p) => !isBefore(p));
    root.append(document.createElement("hr"));
    statement.forEach((p) => root.append(el(document, "p", {}, [clean(p.textContent)])));
    root.append(document.createElement("hr"));
    if (legalList) {
      root.append(list(document, [...legalList.querySelectorAll("a")].map((a) => link(document, a))));
    }
    disclosures.forEach((p) => root.append(el(document, "p", {}, [clean(p.textContent)])));
    return root;
  }
  var DESCRIPTION_FALLBACK = ".header-background-text p";
  function readDescription(document) {
    const desc = document.querySelector('meta[name="description"]');
    if (desc && clean(desc.content)) return clean(desc.content);
    const intro = document.querySelector(DESCRIPTION_FALLBACK);
    return intro ? clean(intro.textContent) : "";
  }
  function buildMetadata(document, description) {
    const meta = {};
    const title = document.querySelector("title");
    if (title) meta.Title = clean(title.textContent);
    if (description) meta.Description = description;
    const ogImage = document.querySelector('meta[property="og:image"]');
    if (ogImage && ogImage.content) {
      const og = new URL(absUrl2(ogImage.content));
      meta.Image = el(document, "img", { src: `${ORIGIN3}${og.pathname}${og.search}`, alt: "" });
    }
    meta.Template = PAGE_TEMPLATE.pageMetadata.template;
    meta.nav = PAGE_TEMPLATE.pageMetadata.nav;
    meta.footer = PAGE_TEMPLATE.pageMetadata.footer;
    return WebImporter.Blocks.createBlock(document, { name: "Metadata", cells: meta });
  }
  var import_monarch_financial_default = {
    /**
     * Runs on the live page: stylesheet-driven background images are not visible on the
     * importer's document, so stamp their URLs (and titles as alt text) onto the elements.
     */
    onLoad: (_0) => __async(null, [_0], function* ({ document }) {
      document.querySelectorAll(".image-2, .helping-cta-background, #bannerBackgroundImage").forEach((node) => {
        const m = getComputedStyle(node).backgroundImage.match(/url\(["']?([^"')]+)["']?\)/);
        if (m) node.setAttribute("data-bg-src", m[1]);
        if (node.getAttribute("title")) node.setAttribute("data-bg-alt", node.getAttribute("title"));
      });
    }),
    transform: (payload) => {
      const { document, url, params } = payload;
      const main = document.body;
      const nav = buildNav(document);
      const footer = buildFooter(document);
      const description = readDescription(document);
      executeTransformers("beforeTransform", main, payload);
      const pageBlocks = findBlocksOnPage(document, PAGE_TEMPLATE);
      pageBlocks.forEach((block) => {
        if (!block.element.parentNode) return;
        const parser = parsers[block.name];
        if (!parser) return;
        try {
          parser(block.element, { document, url, params });
        } catch (e) {
          console.error(`Failed to parse ${block.name} (${block.selector}):`, e);
        }
      });
      executeTransformers("afterTransform", main, payload);
      main.appendChild(document.createElement("hr"));
      main.append(buildMetadata(document, description));
      WebImporter.rules.transformBackgroundImages(main, document);
      WebImporter.rules.adjustImageUrls(main, url, params.originalURL);
      const { pathname } = new URL(params.originalURL);
      const rawPath = pathname.replace(/\.html?$/, "").replace(/\/$/, "/index");
      const path = WebImporter.FileUtils.sanitizePath(rawPath === "" ? "/index" : rawPath);
      const results = [{
        element: main,
        path,
        report: { title: document.title, template: PAGE_TEMPLATE.name, blocks: pageBlocks.map((b) => b.name) }
      }];
      if (nav) results.push({ element: nav, path: PAGE_TEMPLATE.fragments.nav, report: { fragment: "nav" } });
      if (footer) results.push({ element: footer, path: PAGE_TEMPLATE.fragments.footer, report: { fragment: "footer" } });
      return results;
    }
  };
  return __toCommonJS(import_monarch_financial_exports);
})();
