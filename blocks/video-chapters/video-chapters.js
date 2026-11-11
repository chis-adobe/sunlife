/*
 * Video Chapters Block
 * Plays an AEM Dynamic Media (with OpenAPI) video with chapter markers on the timeline
 * and a clickable, always-visible chapter list that seeks the video.
 *
 * Authoring (cells are read in order, as rows or as columns of one row):
 *   cell 1: link to the video delivery URL  (.../adobe/assets/urn:aaid:aem:<id>[/play])
 *   cell 2: link to the chapters WebVTT file (.../original/as/<name>.vtt)
 *   cell 3: (optional) label shown above the chapter list
 *
 * Variants:
 *   smartcrop: plays the video's Dynamic Media smart crops (the video must have smart crops
 *   generated); the player follows the subject and picks the crop that fits the player size.
 */

import { loadCSS, loadScript } from '../../scripts/aem.js';

// DM with OpenAPI delivery hosts, e.g. delivery-p130746-e1275972.adobeaemcloud.com
const DELIVERY_HOST = /^delivery-p\d+-e\d+\.adobeaemcloud\.com$/;
const ASSET_PATH = /^\/adobe\/assets\/(urn:aaid:aem:[0-9a-f-]+)(?:\/play)?\/?$/i;
const MAX_CHAPTERS = 100;
const SEEK_TOLERANCE = 0.25; // seconds

let blockCount = 0;
const libraries = new Map();

/**
 * Validates the video link and derives the delivery base URL from it.
 * Only DM with OpenAPI delivery hosts are accepted because the player scripts are
 * loaded from the same origin.
 * @param {string} href Authored video link
 * @returns {{origin: string, assetUrl: string}|null}
 */
function parseVideoUrl(href) {
  if (!URL.canParse(href)) return null;
  const url = new URL(href);
  const match = url.pathname.match(ASSET_PATH);
  if (url.protocol !== 'https:' || !DELIVERY_HOST.test(url.hostname) || !match) return null;
  return { origin: url.origin, assetUrl: `${url.origin}/adobe/assets/${match[1]}` };
}

/**
 * Validates the chapters link: https only.
 * @param {string} href Authored chapters link
 * @returns {string|null}
 */
function parseChaptersUrl(href) {
  if (!URL.canParse(href)) return null;
  const url = new URL(href);
  return url.protocol === 'https:' ? url.href : null;
}

/**
 * Loads the DM with OpenAPI player once per delivery host.
 * @param {string} origin Delivery host origin
 * @returns {Promise}
 */
function loadPlayerLibraries(origin) {
  if (!libraries.has(origin)) {
    const base = `${origin}/adobe/assets`;
    const promise = (async () => {
      // css is not critical for init; do not fail the player if it is slow or missing
      loadCSS(`${base}/urn:aaid:aem:dmviewers-html5-css/as/core-player.css`).catch(() => {});
      await loadScript(`${base}/urn:aaid:aem:dmviewers-html5/as/VideoPlayer.js`);
      await loadScript(`${base}/urn:aaid:aem:dmviewers-html5/as/CorePlayer.js`);
    })();
    promise.catch(() => libraries.delete(origin));
    libraries.set(origin, promise);
  }
  return libraries.get(origin);
}

/**
 * Parses a WebVTT timestamp ([hh:]mm:ss.mmm) into seconds.
 * @param {string} value Timestamp
 * @returns {number} seconds, or NaN when invalid
 */
function parseTimestamp(value) {
  const match = value.trim().match(/^(?:(\d+):)?(\d{1,2}):(\d{2})(?:[.,](\d{1,3}))?$/);
  if (!match) return NaN;
  const [, hours = '0', minutes, seconds, millis = '0'] = match;
  return Number(hours) * 3600 + Number(minutes) * 60 + Number(seconds)
    + Number(millis.padEnd(3, '0')) / 1000;
}

/**
 * Parses WebVTT text into chapter cues.
 * @param {string} text WebVTT file content
 * @returns {{start: number, title: string}[]}
 */
export function parseChapters(text) {
  const clean = text.charCodeAt(0) === 0xfeff ? text.slice(1) : text;
  return clean
    .replace(/\r\n?/g, '\n')
    .split(/\n{2,}/)
    .map((cue) => {
      const lines = cue.split('\n');
      const timingIndex = lines.findIndex((line) => line.includes('-->'));
      if (timingIndex < 0) return null;
      const start = parseTimestamp(lines[timingIndex].split('-->')[0]);
      if (Number.isNaN(start)) return null;
      const title = lines.slice(timingIndex + 1).join(' ').trim();
      return title ? { start, title } : null;
    })
    .filter(Boolean)
    .sort((a, b) => a.start - b.start)
    .slice(0, MAX_CHAPTERS);
}

/**
 * Formats seconds as m:ss or h:mm:ss.
 * @param {number} seconds Time in seconds
 * @returns {string}
 */
function formatTime(seconds) {
  const total = Math.floor(seconds);
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = String(total % 60).padStart(2, '0');
  return h ? `${h}:${String(m).padStart(2, '0')}:${s}` : `${m}:${s}`;
}

async function fetchChapters(url) {
  const resp = await fetch(url).catch(() => null);
  if (!resp?.ok) return [];
  return parseChapters(await resp.text());
}

function buildChapterList(chapters, label) {
  const nav = document.createElement('div');
  nav.className = 'video-chapters-nav';

  const list = document.createElement('ol');
  list.className = 'video-chapters-list';

  if (label) {
    const heading = document.createElement('p');
    heading.className = 'video-chapters-label';
    heading.id = `video-chapters-label-${blockCount}`;
    heading.textContent = label;
    nav.append(heading);
    list.setAttribute('aria-labelledby', heading.id);
  }

  chapters.forEach((chapter) => {
    const item = document.createElement('li');
    const button = document.createElement('button');
    button.type = 'button';
    button.dataset.start = chapter.start;

    const time = document.createElement('span');
    time.className = 'video-chapters-time';
    time.textContent = formatTime(chapter.start);

    const title = document.createElement('span');
    title.className = 'video-chapters-title';
    title.textContent = chapter.title;

    button.append(time, title);
    item.append(button);
    list.append(item);
  });

  nav.append(list);
  return nav;
}

function setActiveChapter(list, chapters, currentTime) {
  let active = -1;
  chapters.forEach((chapter, i) => {
    // streaming seeks can land a fraction of a second before the requested time
    if (currentTime + SEEK_TOLERANCE >= chapter.start) active = i;
  });
  [...list.querySelectorAll('button')].forEach((button, i) => {
    if (i === active) button.setAttribute('aria-current', 'true');
    else button.removeAttribute('aria-current');
  });
}

/**
 * Language name of the page (e.g. 'English' for lang="en"), used to switch on the matching caption
 * track. Caption tracks are labelled with the language name in Dynamic Media.
 * @returns {string|null}
 */
function getCaptionLanguage() {
  const code = document.documentElement.lang?.split('-')[0];
  if (!code || !/^[a-z]{2,3}$/i.test(code)) return null;
  return new Intl.DisplayNames(['en'], { type: 'language' }).of(code) || null;
}

async function initPlayer(playerEl, video, chaptersUrl, smartCrop) {
  const language = getCaptionLanguage();
  await loadPlayerLibraries(video.origin);
  const player = await window.dmViewers.VideoPlayer.init(playerEl.id, {
    sources: {
      DASH: `${video.assetUrl}/manifest.mpd`,
      HLS: `${video.assetUrl}/manifest.m3u8`,
    },
    posterImage: `${video.assetUrl}/as/thumbnail.jpeg?width=1280&height=720`,
    ...(chaptersUrl && { chapter: chaptersUrl }),
    ...(smartCrop && { mode: 'smartcrop' }),
    ...(language && { language }),
    solution: 'polaris',
    autoplay: false,
    controls: true,
    isLetterBoxed: false,
  });
  await player.setupPlayer(window.dmViewers.CorePlayer);
}

/**
 * loads and decorates the block
 * @param {Element} block The block element
 */
export default async function decorate(block) {
  // authors may put the values in separate rows or as columns of one row; read cells in order
  const cells = [...block.children].flatMap((row) => [...row.children]);
  const videoLink = cells[0]?.querySelector('a');
  const chaptersLink = cells[1]?.querySelector('a');
  const label = cells[2]?.textContent.trim();

  const video = videoLink && parseVideoUrl(videoLink.href);
  if (!video) {
    // leave the authored content in place when the video link is missing or not supported
    // eslint-disable-next-line no-console
    console.warn('video-chapters: expected a Dynamic Media with OpenAPI video link in the first cell');
    return;
  }
  const chaptersUrl = chaptersLink ? parseChaptersUrl(chaptersLink.href) : null;

  blockCount += 1;
  block.textContent = '';

  const playerEl = document.createElement('div');
  playerEl.className = 'video-chapters-player';
  playerEl.id = `video-chapters-player-${blockCount}`;
  block.append(playerEl);

  let chapters = [];
  let list = null;
  if (chaptersUrl) {
    chapters = await fetchChapters(chaptersUrl);
    if (chapters.length) {
      const nav = buildChapterList(chapters, label);
      list = nav.querySelector('.video-chapters-list');
      block.append(nav);
      block.classList.add('has-chapters');

      list.addEventListener('click', (e) => {
        const button = e.target.closest('button[data-start]');
        const videoEl = playerEl.querySelector('video');
        if (!button || !videoEl) return;
        const start = Number(button.dataset.start);
        videoEl.currentTime = start;
        setActiveChapter(list, chapters, start);
        videoEl.play().catch(() => {});
      });

      // media events do not bubble; capture them on the player element
      playerEl.addEventListener('timeupdate', (e) => {
        setActiveChapter(list, chapters, e.target.currentTime);
      }, true);
    }
  }

  const observer = new IntersectionObserver((entries) => {
    if (!entries.some((entry) => entry.isIntersecting)) return;
    observer.disconnect();
    initPlayer(playerEl, video, chaptersUrl, block.classList.contains('smartcrop')).catch(() => {
      // fail safely: fall back to the authored link
      playerEl.classList.add('error');
      playerEl.append(videoLink);
    });
  }, { rootMargin: '200px' });
  observer.observe(block);
}
