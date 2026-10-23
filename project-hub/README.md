# Project Workbench

A phone-friendly project notebook for GitHub Pages. Conversations and AI stay in ChatGPT. Notion is the source of truth. No AI API, browser Notion token, private notes, financial figures, or project IDs are embedded in the public app.

## What works

- Loads configured Notion project pages and native checklist blocks.
- Check/uncheck tasks with save confirmation and error rollback.
- Adds Progress, Blocked, Question, and Decision updates to the original page.
- Reads nested notes and tables; searches project titles.
- Retains unsent update drafts in tab-scoped session storage.
- Copies a review prompt to bring back to ChatGPT.
- Includes a clearly marked, temporary sample project for trying the interface.

## Hosting

The static frontend is `project-hub/index.html` in the existing Pages repository. No build step. It does not need to replace the repository homepage or change the existing navigation. GitHub Pages cannot run the private bridge: deploy `bridge/worker.mjs` separately to Cloudflare Workers (or port the standard Request/Response handler to another server).

## Setup

1. Create an internal Notion integration at https://www.notion.so/profile/integrations with read, update, and insert content capabilities. Keep its token private; do not paste it into chat, source code, or the browser app.
2. In Notion, connect the integration to **each of the nine project-note pages**. They are standalone private pages linked from Ray’s Project Hub; sharing only the hub does not grant access to its linked pages.
3. Copy each project page UUID from its Notion URL, ignoring `?pvs=...`. Put those nine IDs in a comma-separated value for `PROJECT_PAGE_IDS` below. Do not include the hub itself unless you want it to appear as a project too.
4. From `project-hub/bridge`, use Cloudflare’s Wrangler CLI and sign in. Add values through its interactive secret prompts:

```sh
npx wrangler login
npx wrangler secret put NOTION_TOKEN
npx wrangler secret put WORKBENCH_KEY
npx wrangler secret put PROJECT_PAGE_IDS
npx wrangler deploy
```

Use a password-manager-generated random access key of at least 32 characters for WORKBENCH_KEY. It is a separate app key, **not** your Notion token. Keep it in your password manager. Configure ALLOWED_ORIGIN in wrangler.toml to the exact Pages origin (no path); the supplied value is for `https://raemennj.github.io`. A custom domain requires updating that value.

5. Open the Pages frontend, select **Connect Notion**, enter the HTTPS Worker URL and the workbench access key. The app remembers only the URL. The access key stays in memory and is cleared by disconnect/reload. Do not expose the bridge without configuring its secrets.
6. Verify a reversible checkbox change in the app appears in Notion, then reverse it. Save a test update and confirm it in Notion. Refresh to verify both directions. Only then consider live sync ready.

The authenticated API returns private data with `Cache-Control: no-store`. The server permits only configured pages and native checklist descendants. It never returns the Notion token. This is a single-owner key-based connection, not a multi-user account system. Use HTTPS, a strong random key, and rotate that key if exposed. Configure host-level request rate limiting for an internet-facing deployment.

## Daily use

Open a project, tick completed steps, and save blockers/questions before your ChatGPT review. Only confirmed Notion writes are visible to ChatGPT. Unsaved browser drafts and sample-mode changes are not synced. A daily morning review was separately scheduled in ChatGPT; this static page does not schedule anything itself.

## Verification

```sh
node --check project-hub/app.js
node --check project-hub/bridge/worker.mjs
node --test project-hub/bridge/worker.test.mjs
```

Tests use a mock Notion service and do not alter private pages. Live integration requires the credentials above. A timed-out append may have reached Notion: refresh and inspect before resubmitting to avoid duplicate updates. The checkbox stale-value check prevents common stale updates but is not a transactional lock across simultaneous clients. Notes are rendered as plain text; unsupported rich blocks can be viewed using Open in Notion.

## API references

- https://developers.notion.com/reference/get-block-children
- https://developers.notion.com/reference/update-a-block
- https://developers.notion.com/reference/patch-block-children

The bridge pins the Notion API version to 2022-06-28 for these page/block endpoints; it does not use database endpoints.
