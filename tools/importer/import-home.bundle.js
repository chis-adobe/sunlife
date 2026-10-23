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

  // tools/importer/import-home.js
  var import_home_exports = {};
  __export(import_home_exports, {
    default: () => import_home_default
  });

  // tools/importer/parsers/hero-panel.js
  var ORIGIN = "https://www.sunlife.ca";
  function absUrl(url) {
    if (!url) return url;
    if (url.startsWith("//")) return `https:${url}`;
    if (url.startsWith("/")) return `${ORIGIN}${url}`;
    return url;
  }
  function linkText(a) {
    const clone = a.cloneNode(true);
    clone.querySelectorAll("svg, img, .visually-hidden, .sr-only").forEach((n) => n.remove());
    return clone.textContent.replace(/\s+/g, " ").trim();
  }
  function parse(element, { document }) {
    const cells = [];
    const picture = element.querySelector("picture");
    const srcImg = picture ? picture.querySelector("img") : element.querySelector("img");
    if (srcImg) {
      const desktop = picture && picture.querySelector('source[media*="1240"]');
      const src = desktop && desktop.getAttribute("srcset") || srcImg.getAttribute("src");
      const img = document.createElement("img");
      img.src = absUrl(src);
      img.alt = srcImg.getAttribute("alt") || "";
      cells.push([img]);
    }
    const panel = element.querySelector(".card-content-overlay") || element.querySelector(".card-img-overlay") || element;
    const content = [];
    const title = panel.querySelector("h1, .card-title");
    if (title) {
      const h1 = document.createElement("h1");
      h1.textContent = title.textContent.replace(/\s+/g, " ").trim();
      content.push(h1);
    }
    panel.querySelectorAll(".card-text p").forEach((p) => {
      if (!p.textContent.trim()) return;
      const para = document.createElement("p");
      para.innerHTML = p.innerHTML.trim();
      content.push(para);
    });
    const cta = panel.querySelector("a.sl-btn, a.btn");
    if (cta) {
      const a = document.createElement("a");
      a.href = cta.getAttribute("href");
      a.textContent = linkText(cta);
      const strong = document.createElement("strong");
      strong.append(a);
      const p = document.createElement("p");
      p.append(strong);
      content.push(p);
    }
    if (content.length) cells.push([content]);
    const block = WebImporter.Blocks.createBlock(document, { name: "Hero (panel)", cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/columns-media.js
  var ORIGIN2 = "https://www.sunlife.ca";
  function absUrl2(url) {
    if (!url) return url;
    if (url.startsWith("//")) return `https:${url}`;
    if (url.startsWith("/")) return `${ORIGIN2}${url}`;
    return url;
  }
  function linkText2(a) {
    const clone = a.cloneNode(true);
    clone.querySelectorAll("svg, img, .visually-hidden, .sr-only").forEach((n) => n.remove());
    return clone.textContent.replace(/\s+/g, " ").trim();
  }
  function buildImage(document, srcImg) {
    const img = document.createElement("img");
    img.src = absUrl2(srcImg.getAttribute("src"));
    img.alt = srcImg.getAttribute("alt") || "";
    return img;
  }
  function buildText(document, body) {
    const content = [];
    const title = body.querySelector("h1, h2, h3, h4, .card-title");
    if (title) {
      const h2 = document.createElement("h2");
      h2.textContent = title.textContent.replace(/\s+/g, " ").trim();
      content.push(h2);
    }
    body.querySelectorAll(".card-text p").forEach((p) => {
      if (!p.textContent.trim() && !p.querySelector("img")) return;
      const para = document.createElement("p");
      para.innerHTML = p.innerHTML.trim();
      content.push(para);
    });
    const ctas = /* @__PURE__ */ new Set([...body.querySelectorAll(".media-cta-container a[href], a.sl-btn[href]")]);
    ctas.forEach((cta) => {
      const a = document.createElement("a");
      a.href = cta.getAttribute("href");
      a.textContent = linkText2(cta);
      const em = document.createElement("em");
      em.append(a);
      const p = document.createElement("p");
      p.append(em);
      content.push(p);
    });
    return content;
  }
  function parse2(element, { document }) {
    const card = element.querySelector(".sl-media-block") || element;
    const row = [];
    [...card.children].forEach((child) => {
      const srcImg = child.tagName === "PICTURE" || child.tagName === "IMG" ? child.tagName === "IMG" ? child : child.querySelector("img") : child.querySelector(":scope > picture img, :scope > img");
      if (srcImg && !child.classList.contains("card-body")) {
        row.push([buildImage(document, srcImg)]);
      } else if (child.classList.contains("card-body")) {
        row.push(buildText(document, child));
      }
    });
    if (!row.length) {
      const img = card.querySelector("img");
      if (img) row.push([buildImage(document, img)]);
      const body = card.querySelector(".card-body") || card;
      row.push(buildText(document, body));
    }
    while (row.length < 2) row.push("");
    const cells = [row];
    const block = WebImporter.Blocks.createBlock(document, { name: "Columns (media)", cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/cards-icon.js
  var ORIGIN3 = "https://www.sunlife.ca";
  function absUrl3(url) {
    if (!url) return url;
    if (url.startsWith("//")) return `https:${url}`;
    if (url.startsWith("/")) return `${ORIGIN3}${url}`;
    return url;
  }
  function cleanText(el) {
    const clone = el.cloneNode(true);
    clone.querySelectorAll("svg, img, .visually-hidden, .sr-only").forEach((n) => n.remove());
    return clone.textContent.replace(/\s+/g, " ").trim();
  }
  function buildIcon(document, card) {
    const container = card.querySelector(".icon-container") || card;
    const glyph = container.querySelector("svg.sl-card-icon[data-icon], i.sl-card-icon");
    if (glyph) {
      const name = glyph.getAttribute("data-icon") || ([...glyph.classList].find((c) => /^fa-info-/.test(c)) || "").replace(/^fa-/, "");
      if (name) return document.createTextNode(`:${name.replace(/^info-/, "")}:`);
    }
    const srcImg = container.querySelector("img");
    if (srcImg && srcImg.getAttribute("src") && !srcImg.getAttribute("src").startsWith("data:")) {
      const img = document.createElement("img");
      img.alt = "";
      img.src = absUrl3(srcImg.getAttribute("src"));
      return img;
    }
    return null;
  }
  function buildParagraph(document, p) {
    const clone = p.cloneNode(true);
    clone.querySelectorAll("svg, .visually-hidden, .sr-only").forEach((n) => n.remove());
    clone.querySelectorAll("span").forEach((span) => {
      if (/bold/.test(span.className) || span.tagName === "B") {
        const strong = document.createElement("strong");
        strong.textContent = span.textContent;
        span.replaceWith(strong);
      } else {
        span.replaceWith(...span.childNodes);
      }
    });
    clone.querySelectorAll("a[href]").forEach((a) => {
      const link = document.createElement("a");
      link.href = a.getAttribute("href");
      link.textContent = cleanText(a);
      a.replaceWith(link);
    });
    const para = document.createElement(p.tagName === "P" ? "p" : p.tagName.toLowerCase());
    para.innerHTML = clone.innerHTML.trim();
    return para.textContent.trim() ? para : null;
  }
  function linkParagraph(document, href, text, wrapperTag) {
    const a = document.createElement("a");
    a.href = href;
    a.textContent = text;
    const p = document.createElement("p");
    if (wrapperTag) {
      const wrap = document.createElement(wrapperTag);
      wrap.append(a);
      p.append(wrap);
    } else {
      p.append(a);
    }
    return p;
  }
  function buildFormContent(document, formRoot) {
    const out = [];
    const form = formRoot.querySelector("form") || formRoot;
    const labelEl = formRoot.querySelector(".sl-combo-label, label");
    const select = formRoot.querySelector("select");
    const label = labelEl && cleanText(labelEl) || select && select.getAttribute("name") || "";
    let options = select ? [...select.querySelectorAll("option")].filter((o) => !o.disabled && !o.hasAttribute("disabled") && o.getAttribute("value") && o.getAttribute("value") !== "defaultNoneSelected").map((o) => ({ value: o.getAttribute("value"), text: cleanText(o) })) : [];
    if (!options.length) {
      options = [...formRoot.querySelectorAll(".combo-option")].map((o) => ({ value: o.getAttribute("value"), text: cleanText(o) }));
    }
    const action = form.getAttribute && form.getAttribute("action");
    const fallbackHref = action || options[0] && options[0].value || "";
    if (label && options.length) {
      const ul = document.createElement("ul");
      const li = document.createElement("li");
      li.append(document.createTextNode(label));
      const inner = document.createElement("ul");
      options.forEach(({ value, text }) => {
        const item = document.createElement("li");
        const a = document.createElement("a");
        a.href = /^(https?:)?\/|^https?:/.test(value || "") ? value : action || value || fallbackHref;
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
      const text = cleanText(button) || button.getAttribute("value") || "";
      if (text) out.push(linkParagraph(document, fallbackHref, text, "strong"));
    }
    return out;
  }
  function buildBody(document, card) {
    const body = [];
    const title = card.querySelector("h1:not(.icon-container), h2, h3, h4, h5, h6");
    if (title) {
      const h3 = document.createElement("h3");
      h3.textContent = cleanText(title);
      body.push(h3);
    }
    const text = card.querySelector(".card-text");
    if (text) {
      [...text.children].forEach((child) => {
        if (child.tagName === "P" || child.tagName === "DIV") {
          const para = buildParagraph(document, child);
          if (para) body.push(para);
        } else if (child.tagName === "UL" || child.tagName === "OL") {
          const list = document.createElement(child.tagName.toLowerCase());
          child.querySelectorAll(":scope > li").forEach((li) => {
            const item = buildParagraph(document, li);
            if (item) list.append(item);
          });
          if (list.children.length) body.push(list);
        }
      });
    }
    const formRoot = card.querySelector(".grouped-form");
    if (formRoot) body.push(...buildFormContent(document, formRoot));
    card.querySelectorAll(".link-container a[href]").forEach((cta) => {
      const linkTxt = cleanText(cta);
      if (!linkTxt) return;
      const isButton = /\b(sl-btn|btn)\b/.test(cta.className);
      body.push(linkParagraph(document, cta.getAttribute("href"), linkTxt, isButton ? "em" : null));
    });
    return body;
  }
  function parse3(element, { document }) {
    const cells = [];
    let cards = [...element.querySelectorAll(":scope > .card")];
    if (!cards.length) {
      cards = [...element.querySelectorAll(".card")].filter((c) => !c.parentElement.closest(".card"));
    }
    cards.forEach((card) => {
      const icon = buildIcon(document, card);
      const body = buildBody(document, card);
      if (icon || body.length) cells.push([icon ? [icon] : "", body]);
    });
    const block = WebImporter.Blocks.createBlock(document, { name: "Cards (icon)", cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/columns-banner.js
  var ORIGIN4 = "https://www.sunlife.ca";
  function absUrl4(url) {
    if (!url) return url;
    if (url.startsWith("//")) return `https:${url}`;
    if (url.startsWith("/")) return `${ORIGIN4}${url}`;
    return url;
  }
  function linkText3(a) {
    const clone = a.cloneNode(true);
    clone.querySelectorAll("svg, img, .visually-hidden, .sr-only").forEach((n) => n.remove());
    return clone.textContent.replace(/\s+/g, " ").trim();
  }
  function buildImage2(document, srcImg, fallbackAlt) {
    const img = document.createElement("img");
    img.src = absUrl4(srcImg.getAttribute("src"));
    img.alt = srcImg.getAttribute("alt") || fallbackAlt || "";
    return img;
  }
  function buildParagraph2(document, p) {
    const para = document.createElement("p");
    const badgeLinks = [...p.querySelectorAll("a[href]")].filter((a) => a.querySelector("img"));
    if (badgeLinks.length && !linkText3(p)) {
      badgeLinks.forEach((src) => {
        const a = document.createElement("a");
        a.href = src.getAttribute("href");
        a.append(buildImage2(document, src.querySelector("img"), src.getAttribute("title")));
        para.append(a);
      });
      return para;
    }
    const clone = p.cloneNode(true);
    clone.querySelectorAll("svg, .visually-hidden, .sr-only").forEach((n) => n.remove());
    clone.querySelectorAll("span").forEach((span) => span.replaceWith(...span.childNodes));
    para.innerHTML = clone.innerHTML.trim();
    return para.textContent.trim() || para.querySelector("img") ? para : null;
  }
  function buildText2(document, body) {
    const content = [];
    const title = body.querySelector("h1, h2, h3, h4, .card-title");
    if (title) {
      const h2 = document.createElement("h2");
      h2.textContent = title.textContent.replace(/\s+/g, " ").trim();
      content.push(h2);
    }
    body.querySelectorAll(".card-text > p").forEach((p) => {
      const para = buildParagraph2(document, p);
      if (para) content.push(para);
    });
    body.querySelectorAll("a.sl-btn, a.btn").forEach((cta) => {
      if (cta.closest(".card-text")) return;
      const a = document.createElement("a");
      a.href = cta.getAttribute("href");
      a.textContent = linkText3(cta);
      const em = document.createElement("em");
      em.append(a);
      const p = document.createElement("p");
      p.append(em);
      content.push(p);
    });
    return content;
  }
  function parse4(element, { document }) {
    const rowEl = element.querySelector(".banner-image-block-row") || element;
    const row = [];
    [...rowEl.children].forEach((col) => {
      if (col.classList.contains("body-container") || col.querySelector(".card-body")) {
        row.push(buildText2(document, col.querySelector(".card-body") || col));
      } else {
        const srcImg = col.tagName === "IMG" ? col : col.querySelector("img");
        if (srcImg) row.push([buildImage2(document, srcImg)]);
      }
    });
    while (row.length < 2) row.push("");
    const cells = [row];
    const block = WebImporter.Blocks.createBlock(document, { name: "Columns (banner)", cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/cards-article.js
  var ORIGIN5 = "https://www.sunlife.ca";
  function absUrl5(url) {
    if (!url) return url;
    if (url.startsWith("//")) return `https:${url}`;
    if (url.startsWith("/")) return `${ORIGIN5}${url}`;
    return url;
  }
  function cleanText2(el) {
    const clone = el.cloneNode(true);
    clone.querySelectorAll("svg, img, .visually-hidden, .sr-only").forEach((n) => n.remove());
    return clone.textContent.replace(/\s+/g, " ").trim();
  }
  function parse5(element, { document }) {
    const cells = [];
    const cards = element.querySelectorAll(":scope > .card, :scope > div > .card:not(.card .card)");
    const items = cards.length ? [...cards] : [...element.querySelectorAll(".card")];
    items.forEach((card) => {
      var _a, _b;
      const srcImg = card.querySelector("picture img, img");
      let imageCell = "";
      if (srcImg) {
        const img = document.createElement("img");
        img.src = absUrl5(srcImg.getAttribute("src"));
        img.alt = srcImg.getAttribute("alt") || "";
        imageCell = [img];
      }
      const body = [];
      const titleLink = card.querySelector("h1 a[href], h2 a[href], h3 a[href], h4 a[href], a.card-title[href]");
      const titleEl = card.querySelector("h1, h2, h3, h4, .card-title");
      const href = titleLink && titleLink.getAttribute("href") || card.getAttribute("data-href") || ((_b = (_a = card.querySelector("a[href]") || {}).getAttribute) == null ? void 0 : _b.call(_a, "href"));
      const titleText = cleanText2(titleLink || titleEl || document.createElement("span"));
      if (titleText) {
        const h3 = document.createElement("h3");
        if (href) {
          const a = document.createElement("a");
          a.href = href;
          a.textContent = titleText;
          h3.append(a);
        } else {
          h3.textContent = titleText;
        }
        body.push(h3);
      }
      card.querySelectorAll(".card-text p, .body-text p").forEach((p) => {
        if (!p.textContent.trim()) return;
        const para = document.createElement("p");
        para.innerHTML = p.innerHTML.trim();
        body.push(para);
      });
      if (imageCell || body.length) cells.push([imageCell, body]);
    });
    const block = WebImporter.Blocks.createBlock(document, { name: "Cards (article)", cells });
    element.replaceWith(block);
  }

  // tools/importer/transformers/sunlife-cleanup.js
  var DECORATIVE_ICON_PATTERN = /fa-(arrow|long-arrow|chevron|angle|external-link|times|search|bars|caret)/i;
  function isDecorativeDataSvg(img) {
    const src = img.getAttribute("src") || "";
    if (!src.startsWith("data:image/svg+xml")) return false;
    let svg = "";
    try {
      const b64 = src.split("base64,")[1];
      svg = b64 ? atob(b64) : decodeURIComponent(src.split(",")[1] || "");
    } catch (e) {
      return false;
    }
    if (/sl-card-icon/.test(svg)) return false;
    return /svg-inline--fa/.test(svg) || DECORATIVE_ICON_PATTERN.test(svg);
  }
  function transform(hookName, element, payload) {
    const document = payload && payload.document || element.ownerDocument;
    if (hookName === "beforeTransform") {
      element.querySelectorAll(".experiencefragment").forEach((xf) => {
        if (xf.querySelector(".header, footer, #footer")) xf.remove();
      });
      WebImporter.DOMUtils.remove(element, [
        "div.header.aem-GridColumn",
        "header",
        "#footer",
        "footer",
        ".footer.aem-GridColumn",
        ".region-menu.aem-GridColumn",
        ".megamenu.navigation",
        ".skip-links",
        "a.visually-hidden-focusable",
        // OneTrust cookie consent
        "#onetrust-consent-sdk",
        '[id^="onetrust-"]',
        ".onetrust-pc-dark-filter",
        "#ot-sdk-btn-floating",
        // Qualtrics / feedback widgets
        '[class*="QSI"]',
        '[id^="QSI"]',
        ".QSILink",
        // tracking pixels, scripts, embeds
        "script",
        "style",
        "noscript",
        "link",
        "iframe",
        'img[src*="doubleclick"]',
        'img[width="1"][height="1"]'
      ]);
      element.querySelectorAll('a[href^="#"]').forEach((a) => {
        const id = a.getAttribute("href").slice(1);
        const target = id && document.getElementById(id);
        if (!target) return;
        const heading = /^H[1-6]$/.test(target.tagName) ? target : target.querySelector("h1, h2, h3, h4, h5, h6");
        if (!heading) return;
        const slug = heading.textContent.trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^0-9a-z]+/g, "-").replace(/^[^a-z]+|-+$/g, "");
        if (slug) a.setAttribute("href", `#${slug}`);
      });
      element.querySelectorAll(".sl-banner-content-block").forEach((banner) => {
        banner.querySelectorAll("svg.sl-card-icon[data-icon]").forEach((svg) => {
          const p = document.createElement("p");
          p.textContent = `:${svg.getAttribute("data-icon").replace(/^info-/, "")}:`;
          svg.replaceWith(p);
        });
        banner.querySelectorAll("form[action]").forEach((form) => {
          const button = form.querySelector('button, input[type="submit"]');
          const text = button && (button.textContent.trim() || button.getAttribute("value"));
          if (!text) return;
          const p = document.createElement("p");
          const strong = document.createElement("strong");
          const a = document.createElement("a");
          a.href = form.getAttribute("action");
          a.textContent = text;
          strong.append(a);
          p.append(strong);
          form.replaceWith(p);
        });
      });
    }
    if (hookName === "afterTransform") {
      WebImporter.DOMUtils.remove(element, [
        ".separator.aem-GridColumn",
        "form",
        "input",
        "select",
        "textarea",
        "button",
        ".search-bar",
        "a .visually-hidden",
        "a .sr-only",
        ".visually-hidden",
        ".sr-only",
        "svg.svg-inline--fa:not(.sl-card-icon)"
      ]);
      element.querySelectorAll('img[src^="data:image/svg+xml"]').forEach((img) => {
        if (isDecorativeDataSvg(img)) img.remove();
      });
      element.querySelectorAll("a[href]").forEach((a) => {
        const href = a.getAttribute("href");
        const m = href.match(/^https?:\/\/(?:www\.)?sunlife\.ca(\/en\/.*)$/i);
        if (m) a.setAttribute("href", m[1]);
        if (/^javascript:/i.test(href)) a.removeAttribute("href");
      });
      element.querySelectorAll("*").forEach((el) => {
        [...el.attributes].forEach((attr) => {
          const n = attr.name;
          if (n.startsWith("data-di-") || n.startsWith("data-analytics") || n.startsWith("data-track") || n === "data-sl-aem-component" || n.startsWith("on")) {
            el.removeAttribute(n);
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
        const el = root.querySelector(sel);
        if (el) return el;
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
        const el = findSectionElement(element, section);
        if (!el) continue;
        if (i === 0 && !section.style) continue;
        const hr = document.createElement("hr");
        if (section.style) hr.setAttribute(MARKER, section.id);
        if (i === 0) hr.setAttribute("data-excat-first-section", "true");
        el.parentNode.insertBefore(hr, el);
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

  // tools/importer/import-home.js
  var PAGE_TEMPLATE = {
    "name": "home",
    "urls": [
      "https://www.sunlife.ca/en/"
    ],
    "representativeUrl": "https://www.sunlife.ca/en/",
    "description": "Sun Life homepage / landing page: hero panel, product intros (media columns + icon cards), banners, icon-card groups with headings, article cards and a cream closing call to action.",
    "urlPattern": "/*",
    "blocks": [
      {
        "name": "hero-panel",
        "instances": [
          ".hero-banner .sl-banner"
        ]
      },
      {
        "name": "columns-media",
        "instances": [
          ".sl-media-block-container"
        ]
      },
      {
        "name": "cards-icon",
        "instances": [
          ".sl-segmented-blocks"
        ]
      },
      {
        "name": "columns-banner",
        "instances": [
          ".sl-banner-image-block"
        ]
      },
      {
        "name": "cards-article",
        "instances": [
          ".sl-cards.vertical"
        ]
      }
    ],
    "sections": [
      {
        "id": "rc2",
        "name": "Hero",
        "selector": [
          "#main-content .aem-Grid > .hero-banner"
        ],
        "style": null,
        "blocks": [
          "hero-panel"
        ],
        "defaultContent": []
      },
      {
        "id": "rc3",
        "name": "Insurance",
        "selector": [
          "#main-content .aem-Grid > div:nth-child(2)"
        ],
        "style": null,
        "blocks": [
          "columns-media",
          "cards-icon"
        ],
        "defaultContent": []
      },
      {
        "id": "rc6",
        "name": "Investments",
        "selector": [
          "#main-content .aem-Grid > div:nth-child(5)"
        ],
        "style": null,
        "blocks": [
          "columns-media",
          "cards-icon"
        ],
        "defaultContent": []
      },
      {
        "id": "rc9",
        "name": "Health",
        "selector": [
          "#main-content .aem-Grid > div:nth-child(8)"
        ],
        "style": null,
        "blocks": [
          "columns-media",
          "cards-icon"
        ],
        "defaultContent": []
      },
      {
        "id": "rc11",
        "name": "Brand banner",
        "selector": [
          "#main-content .aem-Grid > div:nth-child(10)"
        ],
        "style": null,
        "blocks": [
          "columns-banner"
        ],
        "defaultContent": []
      },
      {
        "id": "rc12",
        "name": "Why choose",
        "selector": [
          "#main-content .aem-Grid > div:nth-child(11)"
        ],
        "style": null,
        "blocks": [
          "cards-icon"
        ],
        "defaultContent": [
          "#main-content .aem-Grid > div:nth-child(11) h2"
        ]
      },
      {
        "id": "rc14",
        "name": "Get started",
        "selector": [
          "#main-content .aem-Grid > div:nth-child(13)"
        ],
        "style": null,
        "blocks": [
          "cards-icon"
        ],
        "defaultContent": [
          "#main-content .aem-Grid > div:nth-child(13) .cmp-text"
        ]
      },
      {
        "id": "rc17",
        "name": "Client support",
        "selector": [
          "#main-content .aem-Grid > div:nth-child(16)"
        ],
        "style": null,
        "blocks": [
          "cards-icon"
        ],
        "defaultContent": [
          "#main-content .aem-Grid > div:nth-child(16) h2"
        ]
      },
      {
        "id": "rc19",
        "name": "App promo banner",
        "selector": [
          "#main-content .aem-Grid > .experiencefragment"
        ],
        "style": null,
        "blocks": [
          "columns-banner"
        ],
        "defaultContent": []
      },
      {
        "id": "rc20",
        "name": "Articles",
        "selector": [
          "#main-content .aem-Grid > div:nth-child(19)"
        ],
        "style": null,
        "blocks": [
          "cards-article"
        ],
        "defaultContent": [
          "#main-content .aem-Grid > div:nth-child(19) .cmp-text"
        ]
      },
      {
        "id": "rc22",
        "name": "Find an advisor",
        "selector": [
          "#main-content .aem-Grid > div:nth-child(21)",
          ".sl-banner-content-block"
        ],
        "style": "cream",
        "blocks": [],
        "defaultContent": [
          ".sl-banner-content-block"
        ]
      }
    ]
  };
  var parsers = {
    "hero-panel": parse,
    "columns-media": parse2,
    "cards-icon": parse3,
    "columns-banner": parse4,
    "cards-article": parse5
  };
  var transformers = [transform, transform2];
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
  var import_home_default = {
    transform: (payload) => {
      const { document, url, params } = payload;
      const main = document.body;
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
      WebImporter.rules.createMetadata(main, document);
      WebImporter.rules.transformBackgroundImages(main, document);
      WebImporter.rules.adjustImageUrls(main, url, params.originalURL);
      const { pathname } = new URL(params.originalURL);
      const rawPath = pathname.replace(/\.html?$/, "").replace(/\/$/, "/index");
      const path = WebImporter.FileUtils.sanitizePath(rawPath === "" ? "/index" : rawPath);
      return [{
        element: main,
        path,
        report: { title: document.title, template: PAGE_TEMPLATE.name, blocks: pageBlocks.map((b) => b.name) }
      }];
    }
  };
  return __toCommonJS(import_home_exports);
})();
