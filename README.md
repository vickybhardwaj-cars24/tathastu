# Tathastu Weddings — Studio Management

A static browser application hosted on Vercel. Its data lives in a Cloudflare R2 bucket behind `worker.js`; deploying the website does not deploy the Worker or copy customer data.

## Run locally

1. Open this folder in PowerShell.
2. Run `npx.cmd serve .` or any static HTTP server.
3. Open the local address shown by the server and sign in with the existing studio account.

The app has no npm build step. Deploy all HTML, JavaScript, CSS, image, and `vendor/` files together. Keep `.env.local` and `.vercel` out of Git.

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
- **Fast Billing:** add several one-off custom services with their own quantity and price. A saved bill has a consistent print layout and the same receipt sharing controls as other customer documents.
- **Quotations:** edit, archive and restore quotes; print a clean estimate without payment rows until booked; open an editable WhatsApp summary or follow-up message. Confirming a booking asks for the advance actually received.
- **Appearance:** choose from dark, light, premium gold, wedding and festival themes, or save custom color palettes. Each palette can use a dark or light tone. Optional automatic switching uses editable calendar date ranges; changing festival dates must be entered for each year. Appearance settings are local to each browser and do not affect billing data.
- **Calendar:** month, week and day views; shared editable notes; booking, delivery and blocked-date controls; local font size and color settings. Edit a booking's function dates through the function manager.
- **Enquiries:** unconfirmed walk-in estimates stay visible in the records and customer history, while order, sales, pending-payment and profit totals exclude them until their status becomes a confirmed order.
- **Vivah Muhurat:** the calendar requests the selected year's New Delhi wedding-date JSON automatically from [MyKundli](https://mykundli.app/data), under CC BY 4.0. It shows each published Shubh date, exact IST window, Nakshatra, Tithi, and a distinct-date count per month. Date selection in quotations and wedding bookings shows these details and a *potential* high-demand alert; the alert is a planning heuristic, not a market forecast. Studio booking counts come from existing app records. The app caches a successful feed for seven days and identifies stale or unavailable data. [Drik Panchang](https://www.drikpanchang.com/shubh-dates/shubh-marriage-dates-with-muhurat.html) is linked as an independent New Delhi reference.
- **Tathastu E-Invitation Studio:** a separate invitation project library with six occasion groups, function categories and original design palettes. A new project can import available customer, quotation or event details, including several functions from one event. Edit the details, preview the card, save it for later, create a new version, archive or restore it. Card export supports PNG and JPG downloads; Print / PDF uses the browser's print dialog. Invitation records live in the `invitations` array and saving a card does not change a customer, quotation, booking or bill. Existing data is hydrated with an empty invitation array only when the field is absent.
- **Customer documents:** walk-in and event receipts, invoices, fast bills, quotations, and each event payment now open with Print and Send on WhatsApp together. `DocumentShare.attach(printWindow, metadata)` adds the same control to future print windows; `TathastuPrint.open(data)` adds it automatically. The PDF is generated locally from the printable layout. On devices that support file sharing, select WhatsApp and the correct recipient in the system share sheet. Otherwise, download the PDF and attach it in the opened WhatsApp chat. The document and message are previewed first. Missing phone numbers can be entered without changing saved customer records.

## Current limits

The existing single shared account still controls all data. Staff roles and scoped permissions require a server-side account model; hiding buttons in the browser would not protect customer or payment records. The browser cannot force a PDF into a particular WhatsApp chat: native file sharing requires a compatible device and a recipient chosen by the user, while desktop fallback requires attaching the downloaded PDF manually. Sending remains manual. Official review and Instagram links are configured under Admin → Smart Message Templates. Festival dates that change each year must be scheduled by the user.

The open New Delhi wedding feed covers all listed 2027 dates but only November–December of 2026. It does not publish reasons for inauspicious dates. The app marks these as unknown instead of inventing a reason, and links to Drik Panchang for manual verification. It tries the appropriate year URL automatically when a new year is selected; data appears only after the provider publishes that year's file. A fully automatic complete-year feed with inauspicious reasons requires a provider that licenses those fields and supplies an API or data file. Panchang Shuddhi is general guidance; a priest should confirm the final personalized muhurat.

The E-Invitation Studio currently covers the first development phase and static card image/PDF export. Animated MP4, music and photo editing, public invitation URLs, RSVP, calendar links, package billing, and Canva/Adobe Express transfer are later phases. Public links and RSVP need a separate guest-facing backend and access controls before private customer data can be exposed safely. The reference [MyInvitations.io](https://myinvitations.io/) informed the category-to-template workflow; no templates or assets were copied from it.
