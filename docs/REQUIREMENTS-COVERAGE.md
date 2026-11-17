# Requirements coverage and review notes

Read against all 13 pages of the 16 November 2026 discussion draft. The user's current request authorizes implementation; instructions embedded in the PDF are treated as document content. The implementation is a local review build, as requested. No deployment or customer messaging has occurred.

| PDF page | Implemented behaviour | Review / configuration needed |
| --- | --- | --- |
| 1 | Connected manufacturing workspace, durable SQLite records and shared website | Local demonstration, not approved operating records |
| 2 | Both units; six owner-listed machines; unit-scoped users, stock ownership and locations | Exact machine models, technical limits, physical opening counts |
| 3 | Enquiry → PO → reservation → material → job → production → quality → dispatch → invoice draft → review → receipts | Confirm job-work, tooling and service billing events; current default is dispatched finished components |
| 4 | Clients, revision-specific components, weights/cavities/cycles, rates, drawings/files, mould ownership, compatible machines, location and audit history | Enter real client-specific rates, mould dimensions, quality standards, family-mould component data |
| 5 | Multi-line client POs, multiple delivery dates, partial delivery, atomic stock reservations, linked-job demand deduction, amendments and cancellations | Amendment deliberately requires linked jobs closed/cancelled first; it does not silently reschedule existing commitments |
| 6 | Material batches/owners/status/location; purchase request → owner approval → supplier PO receipt → quality; customer-supplied receipts; issues, returns, job allocations, mix estimates and regrind allowances | Supplier pack-size rounding and external purchasing/accounting integration are not automatic |
| 7 | Scheduled job cards, cycle/setup capacity checks, machine/mould overlap and maintenance checks, operator shifts, downtime, quality pending/hold/reject/release, mass reconciliation and regrind hold | Validate shifts, working calendars, planned yield and actual weighing procedures. Equipment scheduling uses explicit continuous start/end periods |
| 8 | Accepted/free/reserved stock; two-stage transfers; immutable owner on movements; mould location history; scheduled partial dispatch; acknowledgement; customer return hold and inspection; approved count adjustments | Return credits are reviewed separately. Replacement demand can be entered as a new linked PO reference; automatic replacement-order generation is not implemented |
| 9 | Dispatch-generated invoice drafts, partial draft splitting, duplicate billing prevention, controlled issue sequence, terms/due dates, partial/multiple receipts, multi-invoice allocation, advances, credit notes, client statements and ageing | Tax configuration defaults unconfirmed; tax advice, statutory invoicing/e-invoicing and accounting integration are excluded pending accounts decisions |
| 10 | Internal due/overdue/payment-promise, delivery-risk, late production, breakdown, mould shot-service and overdue transfer alerts; settlement suppression, documented dispute and snooze | External email/WhatsApp delivery, delivery/failure logs and unattended notification jobs are not enabled. Working-day/channel/recipient policy needs confirmation |
| 11 | Named server users, roles and units, staff/shift/attendance, financial field filtering, central dashboard with actionable queues and module directory, command search, connected-record correction links, search/filter, attachment upload/download, CSV export, print, before/after audit, full backup and offline restore verification | Detailed payroll excluded. User provisioning uses server configuration; no self-service access administration. Arrange scheduled backups and operational restore drills before live use |
| 12 | The exact 2,000-free / 8,000-good / 4,082-shot / 229.51-kg / 69.51-kg example is tested, including downstream 6,000-piece dispatch and partial payment | All supplied demo records are illustrative |
| 13 | Automated acceptance tests cover duplicate reservations, ownership isolation, holds, calculations, mould transfers, partial delivery/billing/payments, settled reminders and role restrictions | Owner, stores, unit managers and accounts should perform acceptance review with real configuration before go-live |

## Technical boundaries

- Local Node 22.18+ server with SQLite `BEGIN IMMEDIATE` transactions; no browser-local business balances.
- Password verification uses scrypt, opaque server sessions and HttpOnly SameSite cookies. Business-mode roles come from configured users, never the login form. The role chooser exists only in labelled demonstration mode.
- SQLite supports this single-server deployment shape. Multi-server cloud scaling needs a coordinated database migration and a shared session store.
- Files are private authenticated downloads with a 5 MB limit; supported references are PDF, images, STEP and CSV. File malware scanning is not included.
- The 3D mould is original procedural geometry, illustrative rather than an accurate CAD assembly. The presentation uses locally bundled Three.js with original studio geometry and a scroll-controlled camera; the CRM shares the detailed precision scene in its overview and module headers. Reduced-motion, keyboard rotation and a fallback image are included.
- Company brochure PDF and QR destination remain available. The infrastructure web page now follows the newer operating machine register; the historic brochure PDF is unchanged.
- `firebase deploy --only hosting` would deploy public pages but cannot run this CRM API. Keep the review server local; select a persistent server architecture before production publication.
