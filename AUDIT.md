# Tathastu studio application audit

This audit describes the code in the repository before the upgrade. It does not claim that production records or every browser workflow were tested.

## Implemented in the existing code

- Walk-in and event booking forms, delivery status, customer list, task board, calendar, staff list, expenses, equipment, and summary reports.
- Printable receipts and invoice/quotation views.
- Cloudflare Worker authentication and one R2 JSON document for shared storage, with a browser cache for offline viewing.
- WhatsApp links with preset messages, payment installment entries for events, and phone-based customer lookup.

## Partial workflows and problems

- Event bookings have a primary date plus extra dates and venues, but no named function records, offsets, chronological timeline, or manual override rules. Editing extra dates can populate only the final row because each delayed callback targets the last row.
- Quick Log creates one walk-in service per order, requires a customer name, and has no cart, product catalogue, quantity, discount, or tax calculation.
- WhatsApp templates open a message URL immediately. There is no edit-before-send view or communication history. A URL opening cannot prove that a message was sent.
- Quotation output is generated from an existing order. It is not a saved quotation that can be converted to a booking.
- Customer creation checks phone numbers in some workflows, but manual customer creation can duplicate a profile.
- Staff records and assignments are visible, but the application uses one shared credential and has no enforceable employee roles.
- Editing an event's advance does not reconcile its installments, so displayed balances and payment history may disagree.
- Loading the Worker JSON copies a fixed list of fields into a fresh object. Unknown fields can be lost on the next save. Customer backfill can trigger a save during loading. The Worker replaces the entire R2 object for each save and keeps no versioned backup.
- User-entered strings are interpolated into HTML and inline handlers in many views without escaping; this needs a systematic security pass.

## Missing from the requested system

- Wedding date automation, function-level schedule and priority, timeline, assignments, and deliverables.
- Fast billing POS, configurable product and service catalogue, and guest billing.
- Saved message drafts and attempt history, saved quotations, studio job tracking, and richer customer and sales reports.
- Server-enforced roles and scoped data access, backup recovery, and conflict-safe multi-device writes.

## Upgrade order

1. Preserve all existing JSON fields and stop automatic writes during data loading. Add a read-only JSON backup download.
2. Add function records and date automation without changing legacy event records until a user edits a booking.
3. Add message drafting and history, POS and catalogue, CRM, quotations, jobs, and reports.
4. Introduce server-enforced roles and versioned R2 backups before giving staff accounts access.

Existing records remain in the original `walkins`, `events`, `customers`, and other arrays. New fields must be optional when reading older records. No upgrade step deletes or replaces the live R2 object.
