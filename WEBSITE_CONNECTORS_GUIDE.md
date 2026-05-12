# How to Make Your Website Live — A Beginner's Guide to "Connectors"

Think of making a website live like opening a shop. Your code is the building,
but you need electricity, a phone line, a sign outside, and a cash register
before customers can walk in. Those are your **connectors** — the services and
integrations that wire everything together.

---

## The Big Picture (Step by Step)

```
Your Code  →  Git (save your work)  →  Hosting Platform  →  The Internet
                                              ↑
                              Domain + DB + APIs + Secrets
```

---

## Connector 1 — Git & GitHub (Version Control)

**What it is:** A safe place to store your code and track every change you make.
**Why you need it:** Every hosting platform reads your code from here to deploy it.

### How to set it up
```bash
# 1. Initialize git in your project folder
git init

# 2. Stage all your files
git add .

# 3. Save a snapshot (commit)
git commit -m "first commit"

# 4. Push to GitHub
git remote add origin https://github.com/your-username/your-repo.git
git push -u origin main
```

> Think of GitHub like Google Drive, but specifically built for code.

---

## Connector 2 — Hosting Platform (Where your site lives)

This is the server that runs your website 24/7 so anyone in the world can visit it.

| Platform  | Best For              | Free Tier? |
|-----------|-----------------------|------------|
| **Vercel**  | React / Next.js       | Yes        |
| **Netlify** | Static / JAMstack     | Yes        |
| **Railway** | Full-stack + Database | Yes        |
| **Render**  | Node / Python apps    | Yes        |

### How to deploy on Vercel (easiest option)
1. Go to [vercel.com](https://vercel.com) and sign up with your GitHub account
2. Click **"Add New Project"**
3. Import your GitHub repository
4. Click **Deploy** — Vercel reads your code and builds it automatically

Every time you push new code to GitHub, Vercel re-deploys automatically. That
is called **Continuous Deployment (CD)**.

---

## Connector 3 — Environment Variables & Secrets

**What it is:** Private values (passwords, API keys) your app needs at runtime,
stored securely outside your code.

**Why you need it:** You never put passwords directly in your code — anyone who
sees your repo can steal them.

### Example `.env` file (never commit this to git!)
```
DATABASE_URL=postgres://user:password@host:5432/mydb
STRIPE_SECRET_KEY=sk_live_xxxxxxxxxxxxx
NEXTAUTH_SECRET=some-random-secret-string
```

### How to add them on Vercel
1. Open your project on Vercel dashboard
2. Go to **Settings → Environment Variables**
3. Add each key/value pair
4. Re-deploy — your app now has access to them as `process.env.KEY_NAME`

> Rule of thumb: if it's a secret, it belongs in env vars, not in your code.

---

## Connector 4 — Database

**What it is:** Where your app stores data that needs to survive restarts
(users, orders, posts, etc.)

| Database    | Type        | Good managed option         |
|-------------|-------------|-----------------------------|
| PostgreSQL  | Relational  | Supabase, Railway, Neon     |
| MySQL       | Relational  | PlanetScale, Railway        |
| MongoDB     | Document    | MongoDB Atlas               |
| Redis       | Key-Value   | Upstash                     |

### How to connect (example with Supabase + Next.js)
```bash
# Install the client
npm install @supabase/supabase-js
```

```js
// lib/supabase.js
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
)

export default supabase
```

Then add `SUPABASE_URL` and `SUPABASE_ANON_KEY` to your env vars on Vercel.

---

## Connector 5 — Domain Name (Your website's address)

**What it is:** The human-readable address people type to reach your site
(e.g. `www.myshop.com`).

### Steps
1. Buy a domain from **Namecheap**, **GoDaddy**, or **Cloudflare Registrar**
2. On Vercel: go to **Settings → Domains → Add Domain**
3. Copy the DNS records Vercel gives you
4. Paste those DNS records in your domain registrar's dashboard
5. Wait 5–30 minutes for DNS to propagate worldwide

> Without this step your site is only reachable at a long ugly URL like
> `your-project-abc123.vercel.app`.

---

## Connector 6 — Authentication (Who is this user?)

**What it is:** The login/signup system. Instead of building it yourself, use
a service.

| Service      | What it does                     |
|--------------|----------------------------------|
| **NextAuth** | Auth library for Next.js         |
| **Clerk**    | Drop-in login UI + user mgmt     |
| **Supabase Auth** | Auth + DB in one place      |
| **Auth0**    | Enterprise-grade auth            |

### Quick Clerk setup (example)
```bash
npm install @clerk/nextjs
```

```js
// middleware.js
import { clerkMiddleware } from '@clerk/nextjs/server'
export default clerkMiddleware()
```

Add `CLERK_PUBLISHABLE_KEY` and `CLERK_SECRET_KEY` to env vars on Vercel.

---

## Connector 7 — Payments (Taking money)

| Service   | When to use                |
|-----------|----------------------------|
| **Stripe**  | One-time payments, subscriptions |
| **Razorpay** | India-focused payments   |
| **PayPal**  | Simple checkout button     |

### Stripe in 3 steps
1. Create an account at [stripe.com](https://stripe.com)
2. Copy your **Secret Key** and **Publishable Key**
3. Add them as env vars → use the `stripe` npm package in your code

---

## Connector 8 — Email (Sending notifications, OTPs)

| Service       | Free Tier            |
|---------------|----------------------|
| **Resend**    | 3,000 emails/month   |
| **SendGrid**  | 100 emails/day       |
| **Mailgun**   | 5,000 emails/month   |

```bash
npm install resend
```
```js
import { Resend } from 'resend'
const resend = new Resend(process.env.RESEND_API_KEY)

await resend.emails.send({
  from: 'hello@yourdomain.com',
  to: 'user@example.com',
  subject: 'Welcome!',
  html: '<p>Thanks for signing up!</p>',
})
```

---

## The Complete Checklist

```
[ ] Code pushed to GitHub
[ ] Hosting platform connected to GitHub repo
[ ] Environment variables added on hosting platform
[ ] Database created and DATABASE_URL added to env vars
[ ] Domain purchased and DNS pointed to hosting platform
[ ] Auth service set up (if users need to log in)
[ ] Payment gateway set up (if taking payments)
[ ] Email service set up (if sending emails)
[ ] HTTPS enabled (Vercel/Netlify do this automatically)
```

---

## How It All Flows Together

```
User types yourdomain.com
        ↓
  DNS routes to Vercel
        ↓
  Vercel runs your code
        ↓
  Code reads ENV VARS (secrets)
        ↓
  Code talks to Database (Supabase/Railway)
        ↓
  Code calls external APIs (Stripe, Clerk, Resend)
        ↓
  Response sent back to user's browser
```

---

## Quick Start Order (Do this first)

If you are starting from zero, do connectors in this order:

1. **Git + GitHub** — store your code
2. **Vercel** — deploy it instantly for free
3. **Database** — add Supabase or Railway
4. **Env vars** — move all secrets out of code
5. **Domain** — buy a domain and point it
6. **Auth** — add Clerk or NextAuth
7. **Everything else** — payments, email, analytics, etc.

---

> You do not need all connectors at once. Start with 1 + 2, get something
> online, then add the rest as you need them.
