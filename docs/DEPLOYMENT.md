# Deploy the website and CRM together

The Node server serves the website at `/`, the CRM at `/crm`, API routes at `/api/*`, and the catalogue at `/catalogue`. Both frontend and backend should use the same HTTPS origin, so sign-in and API calls work without cross-origin configuration.

## Hosting requirements

- Node 24 runtime, or a host that builds the included Dockerfile.
- One application instance with persistent storage for SQLite and uploaded attachments.
- HTTPS in front of the application, a supervised process, and a health check at `/healthz`.
- An owner password configured as a host secret. Public demo mode is disabled.

## Native Node service

Build command: `npm ci --omit=dev`

Start command: `node server.mjs`

Set the following environment variables in the hosting dashboard or secure process environment:

| Variable | Value |
| --- | --- |
| `NODE_ENV` | `production` |
| `HOST` | `0.0.0.0` |
| `PORT` | Hosting provider's assigned port, or `4173` |
| `DATA_DIR` | The persistent disk mount directory, e.g. `/var/lib/shakthi` |
| `SECURE_COOKIES` | `1` when accessed through HTTPS |
| `ADMIN_PASSWORD` | A unique secret of at least 14 characters |
| `CRM_USERS` | Optional named-user JSON, configured as a secret |

The runtime user needs read/write access to `DATA_DIR`. Do not use an ephemeral directory for the database. Use a fresh production directory unless the owner explicitly approves importing the local review data. Production mode does not seed demonstration records.

## Docker service

The Dockerfile packages the Node server, website, CRM and catalogue. Set `ADMIN_PASSWORD` through the host's secret configuration. Attach a persistent disk at `/var/lib/shakthi`, accessible by container user `node` (UID 1000). The image uses port 4173 unless the host supplies a different `PORT`.

Run only one instance against the SQLite store. A restart preserves disk data but expires in-memory login sessions; users sign in again. Horizontal scaling requires a shared database and shared session architecture.

## Publication checklist

1. Select and connect a hosting account, confirm the paid plan/disk if required, and choose the service address.
2. Configure the password and persistent storage; do not commit secrets or local review data.
3. Deploy and verify `/healthz`, `/`, `/crm`, `/catalogue`, sign-in and authenticated API access over HTTPS.
4. Verify a test upload and record persist after a restart. Set up off-host backups and exercise the restore procedure.
5. Update the public website's CRM navigation only when the live backend address is known. Keep the existing Firebase catalogue URL available so printed QR codes continue to work.

## Current Firebase site

Firebase Hosting currently serves the public website and catalogue as static files. Publishing the `public` directory there does not start `server.mjs` or provide a CRM API. A single Node host can serve both applications, while the Firebase address continues to serve the existing public catalogue. No backend hosting service is created by adding these deployment files.
