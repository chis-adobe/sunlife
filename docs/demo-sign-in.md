# Demo sign-in (login wall for demos)

**Not a security control.** It makes pages *look* protected in a demo. Page content stays reachable
(e.g. `/monarch-financial/index.plain.html`) and the accounts sheet is public. Use made-up demo
accounts only — never real passwords or personal data.

## How it works

- A page is gated when its metadata has `sign-in` = path of its sign-in page
  (e.g. `/monarch-financial/sign-in`). Visitors without a session are sent there and returned afterwards.
- The sign-in page holds a **Sign In** block. Its rows (key | value):

  | Key | Value |
  |---|---|
  | Users | link to the accounts sheet, e.g. `/monarch-financial/users.json` |
  | Email label / Password label / Button | form copy |
  | Error message / Signed out message / Unavailable message | status copy |
  | Home (optional) | where to go after signing in; default: the sign-in page's folder |

- The accounts sheet (`users` spreadsheet) has the columns **Email**, **Password**, **Name**.
  Emails are matched case-insensitively. Preview/publish the sheet after editing it.
- `?sign-out` on the sign-in page ends the session (the Monarch nav's "Sign out" link).
- Sessions last 8 hours and are stored in the browser per sign-in page (email + name only).
- The gate is skipped in the Universal Editor so authors can edit gated pages.

Code: `scripts/demo-sign-in.js` (gate + session), `blocks/sign-in/` (form).

## Real protection

For real external users, the login has to run at a CDN you control (e.g. a Cloudflare Worker or
Fastly Compute) with a customer identity provider (OpenID Connect), with Edge Delivery site
authentication enabled so the `aem.live` / `aem.page` origins only answer the CDN.
