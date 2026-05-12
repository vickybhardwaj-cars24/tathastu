# Tathastu Weddings — Studio Management System

Single-file HTML dashboard for managing walk-ins, events, tasks, pricing, customers, deliveries and reports.

## Stack
- **Frontend:** Vanilla HTML/CSS/JS — single `index.html`, no build step
- **Auth + Storage:** Cloudflare Worker + R2 bucket (`tathastu-studio-data`)
- **Hosting:** Vercel (static)

## Setup
1. Create R2 bucket `tathastu-studio-data` in Cloudflare
2. Deploy worker: `wrangler deploy`
3. Set secrets: `wrangler secret put AUTH_USERNAME` / `AUTH_PASSWORD`
4. Deploy `index.html` on Vercel

## Login
- Username: set via `AUTH_USERNAME` secret
- Password: set via `AUTH_PASSWORD` secret
