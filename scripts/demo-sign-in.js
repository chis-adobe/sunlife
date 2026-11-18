/**
 * Demo sign-in: a login wall for demos, driven by a spreadsheet of demo accounts.
 *
 * NOT A SECURITY CONTROL. Everything runs in the browser: page content stays reachable
 * (e.g. `.plain.html`) and the accounts sheet is public. Use made-up demo accounts only —
 * never real passwords or personal data. Real protection belongs at the CDN (see docs/demo-sign-in.md).
 *
 * Pages opt in with `sign-in` page metadata (path of their sign-in page). The sign-in page
 * (a page with the Sign In block) starts the session; `?sign-out` on it ends the session.
 */

const SESSION_PREFIX = 'demo-sign-in:';
const SESSION_HOURS = 8;

/** Local previews serve pages under /content/; returns the prefix to keep, if any. */
function contentPrefix() {
  const { hostname, pathname } = window.location;
  const isLocal = ['localhost', '127.0.0.1'].includes(hostname);
  return isLocal && pathname.startsWith('/content/') ? '/content' : '';
}

/**
 * Site path of a URL or path (same origin only; local `/content` prefix removed).
 * @param {string} value URL or path
 * @returns {string} pathname
 */
export function toSitePath(value) {
  const prefix = contentPrefix();
  const { pathname } = new URL(value, window.location);
  return prefix && pathname.startsWith(`${prefix}/`) ? pathname.slice(prefix.length) : pathname;
}

/**
 * Browser path for a site path (adds the local `/content` prefix when needed).
 * @param {string} sitePath path starting with `/`
 * @returns {string}
 */
export function toBrowserPath(sitePath) {
  return `${contentPrefix()}${sitePath}`;
}

/**
 * A safe post sign-in destination: a site-relative path only (no other origins).
 * @param {string|null} value requested destination
 * @param {string} fallback site path used when the value is missing or unsafe
 * @returns {string}
 */
export function safeRedirect(value, fallback) {
  if (!value || !value.startsWith('/') || value.startsWith('//') || value.includes('\\')) return fallback;
  const url = new URL(value, window.location.origin);
  return url.origin === window.location.origin ? `${url.pathname}${url.search}${url.hash}` : fallback;
}

const sessionKey = (signInPath) => `${SESSION_PREFIX}${toSitePath(signInPath)}`;

/**
 * Current demo session for a sign-in page, if still valid.
 * @param {string} signInPath sign-in page path
 * @returns {{email: string, name: string}|null}
 */
export function getSession(signInPath) {
  try {
    const session = JSON.parse(localStorage.getItem(sessionKey(signInPath)));
    if (session && session.expires > Date.now()) return session;
  } catch {
    // unreadable or blocked storage: treated as signed out
  }
  return null;
}

/**
 * Starts a demo session (only the email and name are stored, never the password).
 * @param {string} signInPath sign-in page path
 * @param {{email: string, name: string}} user
 */
export function startSession(signInPath, { email, name }) {
  const expires = Date.now() + SESSION_HOURS * 60 * 60 * 1000;
  localStorage.setItem(sessionKey(signInPath), JSON.stringify({ email, name, expires }));
}

/** Ends the demo session for a sign-in page. */
export function endSession(signInPath) {
  localStorage.removeItem(sessionKey(signInPath));
}

/**
 * Sends visitors without a session to the sign-in page (and back here afterwards).
 * @param {string} signInPath value of the page's `sign-in` metadata
 * @returns {boolean} true when the page may be shown
 */
export function requireSignIn(signInPath) {
  if (getSession(signInPath)) return true;
  const { pathname, search, hash } = window.location;
  const target = new URL(toBrowserPath(toSitePath(signInPath)), window.location.origin);
  target.searchParams.set('redirect', `${toSitePath(pathname)}${search}${hash}`);
  window.location.replace(target.href);
  return false;
}
