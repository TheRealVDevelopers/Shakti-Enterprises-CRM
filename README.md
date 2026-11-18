# Shakthi Enterprises — 3D website & manufacturing CRM

Local review implementation of the full 13-page requirements draft, with an original interactive WebGL battery assembly, a shared website theme, and a database-backed manufacturing workspace. The current presentation uses the battery’s graphite, white and signal-red identity, with bold Manrope typography and scroll-driven product storytelling across the website and CRM. The 3D mould, studio geometry and page code are original; reference-site assets are not copied.

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

The CRM uses locally hosted Manrope fonts (SIL Open Font License, included under `public/assets`) and the same detailed 3D mould study as the website. The overview battery assembly control expands / closes the model; dragging or arrow keys rotate it. Small module studies use the same scene. Reduced-motion preferences are respected.

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

See [page-by-page coverage and operating boundaries](docs/REQUIREMENTS-COVERAGE.md). The review build is not a statutory accounting system. External reminders, integrations, automated replacement orders are not enabled. The task calendar supports reviewed, automated production bookings as described below.

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

For a future production deployment, keep Node behind HTTPS with persistent storage, set `SECURE_COOKIES=1`, configure supervised startup and arrange scheduled backups. The current server intentionally remains local. SQLite supports a single application-server topology; horizontal deployment requires a shared database and session architecture. Source updates are maintained in GitHub. The website and CRM remain a local review build; no production deployment has been performed.

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

## Expanded company website and operational planner

The homepage now includes a longer company story, mould-making development journey, new illustrative manufacturing photography, material applications, agricultural needs and a scroll-expanded original 3D battery enclosure. Each selectable battery component links to its purpose and inspection considerations. Dedicated pages: `/mould-making`, `/plastic-applications`, `/battery-components`, `/machinery` and `/agriculture`. Existing company, services, infrastructure, materials, quality and contact URLs remain available with expanded matching content. The original catalogue remains unchanged.

Manufacturing visuals in `public/assets/manufacturing-editorial.png` were AI-generated for this website and are labelled as illustrations, not actual facility photographs. The new website does not reuse the old promotional photographs. Contact and business details are retained from the existing site. Technical examples describe candidate applications; customer drawings, material grades and validation remain the approval basis.

The workspace displays **Tooling operations** and **Production operations**. Admin automatically accesses **All operations** without choosing a location at login. Internal unit keys remain unchanged for compatibility with existing records and permissions.

- **Quick notes**, available near the top of each module, saves a database-backed notebook with editable entries. Authors and authorised managers can view notes within their operation scope.
- **Task calendar** (`/crm#planner`) shows tasks and production bookings by day and month. Create a manual task, choose its operations, priority, due time and assigned employee, and move it through its status workflow. Times use Asia/Kolkata (IST).
- Admin and managers may explicitly approve a task to **schedule production when due**. Select the real order, machine, mould, quantity, production window and optional operator, and confirm compatibility and approval. The local application checks due tasks every 30 seconds and on state refresh. It creates a real job card using the same transaction, permission, demand, capacity, compatibility and maintenance rules as manual planning. Each task produces at most one job. Conflicts and missed start times block the task and record a reason; edit and reapprove before retrying. Completed or cancelled jobs update their linked task status.
- Scheduling runs while the application server is running; it does not control physical equipment. Material issues, actual shift output, inspection, quality release and dispatch retain their existing controlled actions. No output or quality decision is invented by a calendar task.
- Open a **component, machine, mould or employee** record to upload a photo (PNG/JPEG/WebP, up to 5 MB). Photos appear in private galleries, register thumbnails and machine-floor cards. View full-size or download through authenticated routes. Image signatures and scope are checked server-side; images are included in full backups.

Maintain expanded website content in `scripts/expand-website.py`; it is applied after the original brochure generator. The opening homepage source remains `templates/index.html`. `public/stories.*` controls the expanded design and interactions; `public/battery-scene.js` creates the original WebGL enclosure. Planner UI is in `public/crm-planner.*`; its server-side permissions, task execution and photo detection are in `lib/workspace.mjs`.

### Tall tubular battery reference revision

The battery study follows the owner-supplied cutaway and exploded concept images: a white ribbed jar, black lid, six vent plugs with separate housings, terminal protection, rope handles, retainers, separators and the front label recess. Scroll to separate the assembly, use the manual expansion and cutaway controls, or select a visible 3D part to read its description. Eleven component links lead to the matching detail-page section. The detail page also switches between both supplied reference diagrams. The original model label uses Shakthi branding without treating the reference artwork’s capacity or warranty text as verified product specifications. Reference images are stored as `public/assets/battery-internal-reference.png` and `public/assets/battery-exploded-reference.png`.

The opening homepage scene now uses the same live tubular battery geometry in place of the mould. As you scroll, it moves alongside the introductory copy, then expands into its component study. Animated callout labels and projected leader lines follow the 3D parts during rotation. Clicking a label opens its explanation and a link to the corresponding battery-detail section. The CRM and other tooling studies retain their existing mould scenes.

## Shared battery design system

`public/battery-theme.css` is the final stylesheet on every public page, the recovery page and the CRM. It owns the shared colour tokens, Manrope typography, lightning brand treatment, action states, navigation, cards, forms, dialogs, notebook, calendar and battery labels. Graphite (`#171b21`), signal red (`#bd1226`), white and cool silver follow the product’s case, lid and label. Success, warning and blocked statuses retain distinct semantic colours.

`scripts/apply-battery-theme.py` applies the shared stylesheet to every page and normalises legacy green presentation styles to the neutral substrate. It runs automatically after `scripts/expand-website.py`, so regeneration preserves the theme. `public/workspace-battery-scene.js` provides the same live battery model to CRM sign-in, the dashboard and other shared 3D panels. Its fallback remains a battery illustration when WebGL is unavailable.

## Detailed 3D product viewer

The live battery now uses environment reflections, textured plastic, metal terminal interfaces, transparent vent tubes, separate threaded housings, knurled caps, slotted retainers, braided handle strands, moulded seams, cell numbering and a higher-resolution product label. A contact shadow grounds the product without adding a display platform. These remain illustrative component details, not a released production drawing.

Drag with a mouse or swipe horizontally on a touch screen to orbit; vertical touch gestures remain available for page scrolling. Use camera presets (perspective, front, side and top), bounded zoom, optional slow auto-rotation, and focus mode to inspect a selected component while other parts fade. The detailed homepage viewer includes a live assembly-separation slider. The opening scene keeps its scroll story, projected labels and explicit assembly / follow-scroll controls.

Keyboard controls while the canvas is focused: arrow keys rotate, `+` / `-` zoom, `Home` resets the camera, Space toggles auto-rotate, and Escape leaves focus mode. Reduced-motion preferences use immediate pose changes and disable auto-rotation. Renderers stop animating when motion settles, when off screen or when the document is hidden. Shared geometry and part materials reduce duplication, and each scene disposes its controls, textures, environment and listeners when removed.

`public/battery-motion.js` owns the bounds and damped pose interpolation; `public/battery-controls.js` supplies the viewer controls. Motion regression tests cover zoom and pitch limits, convergence without overshoot, immediate reduced-motion changes and shortest-path view rotation.
