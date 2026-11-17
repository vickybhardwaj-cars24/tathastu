# Tathastu Weddings — Studio Management

A static browser application hosted on Vercel. Its data lives in a Cloudflare R2 bucket behind `worker.js`; deploying the website does not deploy the Worker or copy customer data.

## Run locally

1. Open this folder in PowerShell.
2. Run `npx.cmd serve .` or any static HTTP server.
3. Open the local address shown by the server and sign in with the existing studio account.

The app has no npm build step. `index.html`, `wedding-functions.js`, `studio-business.js`, `quotation-upgrades.js`, `print-layout.js`, `appearance.js`, and `logo.png` must be deployed together. Keep `.env.local` and `.vercel` out of Git.

## Existing data

The app reads the current R2 JSON document and preserves unknown top-level fields and existing booking arrays. Wedding function records are added only when a booking is edited in the function manager. Loading records never writes them back automatically. The **Backup JSON** button downloads the full data currently loaded in the browser; keep a copy before making major changes. If the cloud save fails, the browser keeps unsynced changes and blocks another cloud write until the conflict is resolved. Deleting a quotation archives it with a restore option; it does not remove a linked booking. Calendar notes are optional new records and do not alter booking dates.

The revised Worker creates a versioned R2 copy of the previous `studio-db.json` before each successful replacement and rejects stale writes. To activate these protections, deploy `worker.js` separately through Cloudflare using the existing `TATHASTU_BUCKET` binding and `AUTH_USERNAME` / `AUTH_PASSWORD` secrets. `wrangler.toml` now targets the `tathastu` Worker used by the website; confirm the Worker URL and binding in Cloudflare before deploying. Do not create a new bucket or reset the existing one. A Vercel deployment alone uses whichever Worker is currently live.

## New workflows

- **Events → Functions:** schedule named wedding functions from a main date, manually override individual dates, assign staff, set priority, and track deliverables. Date changes show a confirmation list.
- **Fast Billing / Catalogue:** configure service prices, make multi-item bills, apply discounts and tax, take partial payment, and print or save the bill as PDF from the browser.
- **Quotations:** save a wedding quote, print it, and confirm it as a booking.
- **Studio Jobs:** track editing, printing, album, and delivery work.
- **WhatsApp:** edit a template before opening WhatsApp; the history distinguishes opening WhatsApp from manually marking a message sent.
- **Reports:** daily, weekly, and monthly sales and expense summaries.
- **Fast Billing:** add several one-off custom services with their own quantity and price. A saved bill has a consistent print layout and offers a Google review WhatsApp draft when a customer phone and Google review URL are configured.
- **Quotations:** edit, archive and restore quotes; print a clean estimate without payment rows until booked; open an editable WhatsApp summary or follow-up message. Confirming a booking asks for the advance actually received.
- **Appearance:** choose from dark, light, premium gold, wedding and festival themes, or save custom color palettes. Each palette can use a dark or light tone. Optional automatic switching uses editable calendar date ranges; changing festival dates must be entered for each year. Appearance settings are local to each browser and do not affect billing data.
- **Calendar:** month, week and day views; shared editable notes; booking, delivery and blocked-date controls; local font size and color settings. Edit a booking's function dates through the function manager.

## Current limits

The existing single shared account still controls all data. Staff roles and scoped permissions require a server-side account model; hiding buttons in the browser would not protect customer or payment records. PDFs use the browser's Print / Save as PDF control. WhatsApp opens an editable text draft; attaching a saved quotation PDF and pressing Send remain manual. The Google review URL must be saved under Pricing → GST & Invoice Configuration before review templates appear. Festival dates that change each year must be scheduled by the user.
