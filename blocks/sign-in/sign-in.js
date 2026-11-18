import { readBlockConfig } from '../../scripts/aem.js';
import {
  endSession, safeRedirect, startSession, toBrowserPath, toSitePath,
} from '../../scripts/demo-sign-in.js';

/*
 * Sign In block (demo login wall — not a security control, see scripts/demo-sign-in.js).
 * Authored as key/value rows; all copy comes from the block:
 *   Users              | link to the accounts sheet (columns: Email, Password, Name)
 *   Email label        | Email
 *   Password label     | Password
 *   Button             | Sign in
 *   Error message      | shown for an unknown email/password
 *   Signed out message | shown after `?sign-out`
 *   Unavailable message| shown when the accounts sheet can't be read
 *   Home               | optional: where to go after signing in (default: this page's folder)
 */

let idCounter = 0;

/** Reads the rows of a sheet (single or first sheet of a multi-sheet). */
function sheetRows(json) {
  if (Array.isArray(json?.data)) return json.data;
  const [first] = json?.[':names'] || [];
  return Array.isArray(json?.[first]?.data) ? json[first].data : [];
}

/** Case-insensitive column lookup (authors may write "Email" or "email"). */
function column(row, name) {
  const key = Object.keys(row).find((k) => k.trim().toLowerCase() === name);
  return key ? String(row[key] ?? '').trim() : '';
}

async function findAccount(usersHref, email, password) {
  const resp = await fetch(toBrowserPath(toSitePath(usersHref)), { cache: 'no-store' });
  if (!resp.ok) throw new Error(`accounts sheet: ${resp.status}`);
  const match = sheetRows(await resp.json()).find((row) => column(row, 'email').toLowerCase() === email
    && column(row, 'password') === password);
  return match ? { email, name: column(match, 'name') } : null;
}

function field(type, label, autocomplete) {
  idCounter += 1;
  const id = `sign-in-${type}-${idCounter}`;
  const wrapper = document.createElement('div');
  wrapper.className = 'sign-in-field';
  const labelEl = document.createElement('label');
  labelEl.htmlFor = id;
  labelEl.textContent = label;
  const input = document.createElement('input');
  input.id = id;
  input.name = type;
  input.type = type;
  input.required = true;
  input.autocomplete = autocomplete;
  wrapper.append(labelEl, input);
  return { wrapper, input };
}

/**
 * loads and decorates the sign-in block
 * @param {Element} block The block element
 */
export default function decorate(block) {
  const config = readBlockConfig(block);
  const signInPath = toSitePath(window.location.pathname);
  const folder = signInPath.slice(0, signInPath.lastIndexOf('/') + 1);
  const home = config.home ? safeRedirect(toSitePath(config.home), folder) : folder;

  const status = document.createElement('p');
  status.className = 'sign-in-status';
  status.setAttribute('role', 'status');
  status.setAttribute('aria-live', 'polite');

  const params = new URLSearchParams(window.location.search);
  if (params.has('sign-out')) {
    endSession(signInPath);
    status.textContent = config['signed-out-message'] || '';
    // drop the sign-out flag from the address so a reload doesn't repeat it
    const url = new URL(window.location.href);
    url.searchParams.delete('sign-out');
    window.history.replaceState(null, '', url.href);
  }

  const form = document.createElement('form');
  form.className = 'sign-in-form';
  const email = field('email', config['email-label'] || '', 'username');
  const password = field('password', config['password-label'] || '', 'current-password');
  const submit = document.createElement('button');
  submit.type = 'submit';
  submit.textContent = config.button || '';
  form.append(email.wrapper, password.wrapper, submit);

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    status.textContent = '';
    status.classList.remove('sign-in-error');
    submit.disabled = true;
    try {
      const account = config.users && await findAccount(
        config.users,
        email.input.value.trim().toLowerCase(),
        password.input.value,
      );
      if (account) {
        startSession(signInPath, account);
        const target = safeRedirect(new URLSearchParams(window.location.search).get('redirect'), home);
        window.location.assign(toBrowserPath(target));
        return;
      }
      status.textContent = config['error-message'] || '';
      password.input.value = '';
      password.input.focus();
    } catch {
      status.textContent = config['unavailable-message'] || config['error-message'] || '';
    }
    status.classList.add('sign-in-error');
    submit.disabled = false;
  });

  block.replaceChildren(status, form);
}
