# Form Relay

Worker relay for the GitHub Pages forms.

The site submits to this Worker when `PUBLIC_CONTACT_FORM_RELAY_URL` is configured. The Worker validates the browser challenge server-side, quietly accepts unwanted submissions without forwarding them, then forwards accepted submissions to the configured destination.

## Required secrets

Set these with Wrangler. Do not commit them.

```bash
npx wrangler secret put TURNSTILE_SECRET_KEY --config workers/contact-form-relay/wrangler.jsonc
npx wrangler secret put FORM_SUBMIT_ENDPOINT --config workers/contact-form-relay/wrangler.jsonc
```

Optionally set `CONTENT_BLOCKLIST` as a Worker secret with comma-separated phrases if a temporary private content rule is needed.

## Deploy

```bash
npx wrangler deploy --config workers/contact-form-relay/wrangler.jsonc
```

After deploy, set the GitHub repository variable `PUBLIC_CONTACT_FORM_RELAY_URL` to the deployed Worker URL, then redeploy the GitHub Pages site.
