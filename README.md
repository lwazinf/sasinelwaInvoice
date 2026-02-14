# Sasinelwa Invoice Processor

A lightweight Node service to:
- render a cleaner invoice design,
- generate PDF invoices,
- receive invoice instructions by email webhook,
- and return the processed PDF to the sender.

## Endpoints

- `GET /health` – health check.
- `GET /preview` – visual preview of the cleaned invoice design.
- `POST /generate` – generate invoice PDF from JSON body.
- `POST /email/inbound` – receive inbound email payload (`from`, `subject`, and `text`/`body-plain`), parse instructions, and email the resulting PDF back.

## Instruction format in inbound email body

```txt
company: Sasinelwa Studio
company_email: billing@sasinelwa.com
invoice_number: P00005402
issue_date: 2026-02-14
due_date: 2026-02-28
client_name: Acme Ops
client_email: ops@acme.com
tax_rate: 0.15
item: Design cleanup | 1 | 1200
item: Automation setup | 2 | 350
notes: Please pay within 14 days.
```

## Fly.io setup

1. Install Fly CLI and login.
2. Set app secrets:
   - `MAILGUN_DOMAIN`
   - `MAILGUN_API_KEY`
   - `REPLY_FROM`
3. Deploy:

```bash
fly launch --no-deploy
fly deploy
```

`fly.toml` and `Dockerfile` are included.


## Deploy from GitHub to Fly.io

1. Push this repo to GitHub.
2. In Fly, create app once (or keep existing app name in `fly.toml`).
3. In GitHub repo settings, add secret `FLY_API_TOKEN` (create via `fly tokens create deploy`).
4. Ensure your default deploy branch is `main` (workflow triggers on push to `main`).
5. Push to `main` or run the **Fly Deploy** workflow manually from Actions.

After deploy, verify:

```bash
fly status
fly logs
curl https://<your-fly-app>.fly.dev/health
```

To test the full email flow in production, point your inbound email provider webhook to:

`https://<your-fly-app>.fly.dev/email/inbound`

Then send an instruction email body in the documented format and confirm you receive a PDF reply.

## Local run

```bash
npm start
```

Then open `http://localhost:3000/preview`.
