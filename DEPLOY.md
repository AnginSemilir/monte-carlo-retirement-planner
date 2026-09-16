# Putting this online

The build is a folder of static files. There is no server, no database and no account: every figure is
computed in the visitor's browser, and their plan is stored there too. So any static host will do, and
the cheapest ones are free at this scale.

## Settings, whichever host

| | |
|---|---|
| Build command | `npm run build` |
| Publish directory | `dist` |
| Node version | 20 or newer |

No redirect or rewrite rules are needed. The apps are one page — the tabs are state, not routes — so
there is nothing for a deep link to miss.

**Cloudflare Pages** and **Netlify** both do this from the repository: connect it, set the two fields
above, and every push to the branch you nominate is published. Cloudflare Access (free for small
numbers of people) can sit in front of it if the beta should not be public.

## One link, and what happens when you update

You get **one stable production URL** — that is the link to share. Deploying replaces what it serves;
the URL does not change. You also get a **separate immutable URL per deploy**, useful for looking at a
build before promoting it, and those are different origins.

**Saved plans survive updates.** They live in the visitor's own browser under `localStorage`, keyed to
the origin, so the same URL means the same storage and their figures are still there after a deploy.
Three things would orphan them, all within your control:

- **Bumping a storage key.** `rp_plan_full_v28`, `rp_simple_v1`, `rp_saved_scenarios_v3`,
  `rp_simple_scenarios_v1`, `rp_theme_v1`, `rp_which_app`. Adding a FIELD is safe: `normalizePlan`
  migrates an old shape on load, and the simple page spreads a saved plan over its blank. Only change a
  key when a shape changes so incompatibly that loading the old one would be wrong.
- **Moving domain.** A custom domain is a different origin from `*.pages.dev`, so pick the final address
  before inviting people rather than after.
- **Someone using a preview URL.** Send the production link, not a deploy-specific one.

## Before the link goes out

- `FEEDBACK_URL` in `src/Shell.jsx` is blank, so no feedback link renders. Point it at a form, a thread
  or a mailbox and it appears in the footer of both apps.
- `SHOW_INHERITANCE` in `src/App.jsx` is `false`, so the Inheritance tab stays hidden. Its code and its
  268 assertions are untouched; flipping it to `true` is the whole of turning it on.
- `APP_VERSION` in `src/App.jsx` reads `v0.8 beta`.

## Checking a build before promoting it

```
npm run build
npx serve -s dist -l 4173
node research/ui-harnesses/production-build-ui.cjs 4173
```

That harness is the one that reads the built site rather than the dev server: it fails if a third-party
stylesheet creeps back in, if the authoring tools ship, if the sharing metadata is missing, or if the
worker does not answer.
