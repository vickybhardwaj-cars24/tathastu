# Tathastu Weddings — Studio Management

A static browser application hosted on Vercel. Its data lives in a Cloudflare R2 bucket behind `worker.js`; deploying the website does not deploy the Worker or copy customer data.

## Run locally

1. Open this folder in PowerShell.
2. Run `npx.cmd serve .` or any static HTTP server.
3. Open the local address shown by the server and sign in with the existing studio account.

The app has no npm build step. `index.html`, `wedding-functions.js`, `studio-business.js`, and `logo.png` must be deployed together. Keep `.env.local` and `.vercel` out of Git.

## Existing data

The app reads the current R2 JSON document and preserves unknown top-level fields and existing booking arrays. Wedding function records are added only when a booking is edited in the function manager. Loading records never writes them back automatically. The **Backup JSON** button downloads the full data currently loaded in the browser; keep a copy before making major changes. If the cloud save fails, the browser keeps unsynced changes and blocks another cloud write until the conflict is resolved.

The revised Worker creates a versioned R2 copy of the previous `studio-db.json` before each successful replacement and rejects stale writes. To activate these protections, deploy `worker.js` separately through Cloudflare (`wrangler deploy`) using the existing `TATHASTU_BUCKET` binding and `AUTH_USERNAME` / `AUTH_PASSWORD` secrets. Do not create a new bucket or reset the existing one. A Vercel deployment alone uses whichever Worker is currently live.

## New workflows

- **Events → Functions:** schedule named wedding functions from a main date, manually override individual dates, assign staff, set priority, and track deliverables. Date changes show a confirmation list.
- **Fast Billing / Catalogue:** configure service prices, make multi-item bills, apply discounts and tax, take partial payment, and print or save the bill as PDF from the browser.
- **Quotations:** save a wedding quote, print it, and confirm it as a booking.
- **Studio Jobs:** track editing, printing, album, and delivery work.
- **WhatsApp:** edit a template before opening WhatsApp; the history distinguishes opening WhatsApp from manually marking a message sent.
- **Reports:** daily, weekly, and monthly sales and expense summaries.

## Current limits

The existing single shared account still controls all data. Staff roles and scoped permissions require a server-side account model; hiding buttons in the browser would not protect customer or payment records. PDFs use the browser's Print / Save as PDF control. Messages are opened in WhatsApp and are not sent automatically.
