# Shakthi Enterprises — 3D website & manufacturing CRM

Local review implementation of the full 13-page requirements draft, with an original interactive WebGL mould assembly, a shared website theme, and a database-backed manufacturing workspace. The current presentation follows the cream-and-green palette, oversized typography and scroll-driven product storytelling of Caeli Énergie, adapted to Shakthi’s manufacturing identity. The 3D mould, studio geometry and page code are original; reference-site assets are not copied.

## Run the local review

Requires Node.js 22.18 or newer. The server uses Node’s built-in modules. Three.js browser assets are bundled in `public/vendor`, so this checkout starts without an installation step. `package-lock.json` pins the source package used to prepare those assets.

```powershell
cd C:\Projects\Club-GrowLine\Shakti-Enterprises-CRM
npm start
```

Or double-click `START-CRM.cmd`. Keep the terminal running.

- Website: http://127.0.0.1:4173/
- CRM: http://127.0.0.1:4173/crm
- Demonstration password: `shakthi-demo`
- Select `admin` to explore the complete workspace. Other demo roles demonstrate permission boundaries.

Without `ADMIN_PASSWORD`, the application explicitly starts in demonstration mode and seeds illustrative PDF-example records. It binds only to loopback. The owner-listed six machines and sample stock are examples for review, not approved live balances. The browser review reserved the example order's 2,000 free pieces; its production need remains 8,000 pieces.

## Website interactions

Scroll through the opening scene to reveal the studio and mould assembly. Choose **Discover** to jump to the interactive product, use the four capability hotspots, and toggle **Explore the assembly**. Drag the mould or use its left/right arrow-key controls to rotate. The capabilities section supports clickable and keyboard-operated tabs. The connected-operation diagram explains each workflow stage. Mobile navigation includes a focus trap, close button and Escape support. Reduced-motion preferences disable decorative animation.

## CRM overview and navigation

The overview is the main operating workspace. It includes clickable KPIs, role- and unit-scoped action queues, upcoming deliveries, machine cards, every module in a searchable directory, quick entry and recent activity. Open a queue item or machine card to inspect its source record and available correction actions without leaving the dashboard.

Use **Ctrl K / Cmd K** or the search button to find a module, client, PO, component or other visible record. Connected-record panels link orders to jobs, equipment, production, dispatch, invoices and receipts. Module pages have status / attention filters, sorting and live result counts. Accounts summaries remain limited to the owner and accounts roles.

The CRM uses locally hosted Manrope fonts (SIL Open Font License, included under `public/assets`) and the same detailed 3D mould study as the website. The overview assembly control expands / closes the model; dragging or arrow keys rotate it. Small module studies use the same scene. Reduced-motion preferences are respected.

## Implemented workflows

- Two units, machines, compatible moulds, client ownership, revision-specific components, attachments and locations.
- Enquiries, multi-component client POs, individual delivery schedules, atomic stock reservations, material estimates and shortage calculation.
- Job-specific material reservations; supplier requests / owner approvals / receipts / quality acceptance; customer-supplied receipts; batch issues and usable returns.
- Compatible-machine scheduling, maintenance exclusions, cycle-time and setup allowance checks, assigned operators, shift output and downtime.
- Separate pending / accepted / rejected / held quality quantities; family-mould output queues; reinspection; material mass reconciliation; traceable regrind.
- Accepted stock, partial scheduled dispatch, acknowledgement, two-stage unit transfers, customer returns on quality hold and approved stock adjustments.
- Accounts-reviewed invoice drafts, partial invoice splitting, duplicate-billing prevention, controlled numbering, configured taxes and terms, receipts, multi-invoice allocations, advances and credit notes.
- Internal reminders, promise / dispute / snooze records, client statements, ageing, management reports, attendance, role permissions and unit boundaries.
- Search, filters, CSV export, print, private attachments, before / after audit and full backup / restore verification.

See [page-by-page coverage and operating boundaries](docs/REQUIREMENTS-COVERAGE.md). The review build is not a statutory accounting system. External reminders, integrations, automated replacement orders and advanced shift calendars are not enabled.

## Verify

```powershell
npm test
```

Tests cover the PDF example, full order-to-partial-payment flow, stock and material allocation conflicts, quality holds, family output, unit transfers, partial billing, permissions, authenticated HTTP routes, CSRF protection, backup and restore. Tests create isolated databases rather than changing review data.

## Business-mode preparation

Use a new data directory to keep illustrative records out of business use. Set a strong owner password in the process environment. Do not commit passwords or put them in source files.

```powershell
$env:DATA_DIR = 'C:\ShakthiData'
# Set ADMIN_PASSWORD securely through your process / server environment.
npm start
```

`ADMIN_PASSWORD` must contain at least 14 characters. Business mode has no role chooser and no automatic demo seeding. Owner user ID is `admin`. Additional named accounts come from the `CRM_USERS` environment variable as an array of objects with `id`, `name`, `role`, `unit` and `password`. Valid non-admin roles: `manager`, `stores`, `operator`, `quality`, `accounts`, `sales`; units are `Unit 1`, `Unit 2` or `all`. Each password must contain 14+ characters. Operator user IDs must match their assigned staff record IDs. Use `all` only for roles whose responsibilities span units.

For a future production deployment, keep Node behind HTTPS with persistent storage, set `SECURE_COOKIES=1`, configure supervised startup and arrange scheduled backups. The current server intentionally remains local. SQLite supports a single application-server topology; horizontal deployment requires a shared database and session architecture. No production deployment or GitHub push has been performed.

Accounts must confirm tax/billing treatment in Settings before an invoice can be issued. Review exact machine/mould limits, ownership, rates, physical opening counts, staff responsibilities and reminder policy with the team. The current billing trigger is finished-component dispatch; job-work and tooling billing need the business decisions identified in the draft.

## Backups and restore

Owner: **Settings & backup → Download complete backup**. The JSON includes all records, audit history, settings and attachment bytes. Keep backups securely.

```powershell
# Validate only:
node scripts/restore.mjs C:\Backups\shakthi-backup.json
# Restore into a NEW directory and verify counts:
node scripts/restore.mjs C:\Backups\shakthi-backup.json C:\Shakthi-Restore-Review
```

The utility refuses to overwrite an existing directory. Start a separate server against the restored data and verify balances and attachments before changing the business server's data location. Passwords and server users are configured separately from business backups.

## Source layout

- `server.mjs`: local HTTP server, sign-in, sessions, authenticated API, files and backup.
- `lib/engine.mjs`: transactional operations, planning, permissions and audit.
- `public/crm*`: responsive workspace, forms, shared dashboard calculations, module directory, command search and connected-record navigation.
- `public/precision-scene.js`: detailed Three.js mould assembly, manufacturing studio, lighting and scroll-driven camera.
- `public/caeli.css` / `public/landing.js`: current presentation and interactions.
- `public/scene.js`: retained original compact WebGL scene; the workspace now shares the detailed precision scene.
- `public/vendor`: locally bundled Three.js modules and their MIT license.
- `templates/index.html`: maintained 3D homepage source.
- `scripts/refresh-pages.py`: shared 3D theme and current machine register for existing pages.
- `build_site.py`: original brochure-based page generator; now reapplies the maintained homepage and theme after generation.
- `tests/`: workflow, HTTP and restore acceptance checks.

The original catalogue, `/catalogue` URL and printed QR destination are preserved. The original website documentation is retained at [docs/ORIGINAL-WEBSITE.md](docs/ORIGINAL-WEBSITE.md). Firebase Hosting serves static files only and cannot execute this CRM server; do not treat a static website deployment as a working CRM deployment.
