# Firebase CRM backend

The static company website remains on Firebase Hosting. The `crmApi` second-generation function serves `/api/**` on the same origin; `crmTaskRunner` checks approved tasks every minute. The isolated `shakthi-crm` Firestore database is in `asia-south1`.

Firestore is the authoritative store for records, audit history, settings, login sessions and private uploaded-file chunks. SQLite is an ephemeral calculation cache, refreshed whenever the committed Firestore revision changes. A Firestore transaction commits changes before a successful HTTP response is sent. Failed commits invalidate the cache. A control document serializes transactions across cold starts and overlapping deployments.

Browser access to the database is denied by `firestore.crm.rules`. Business permissions remain enforced by the CRM API. Firebase Hosting forwards the secure `__session` cookie to the API. The local server retains its original `crm_session` cookie and local SQLite storage.

## Owner access

The production user ID is `admin`. The password is stored in Google Cloud Secret Manager as `SHAKTHI_ADMIN_PASSWORD`; retrieve it using an authorised owner account. Never commit the password or include it in logs. Demo sign-in is disabled in production.

## Deployment

The deployer needs permissions to create the named Firestore database, deploy HTTPS Cloud Functions and act as the function's runtime service account. Firebase reported missing database-creation permission and `cloudfunctions.functions.setIamPolicy` during initial provisioning. Its recommended role for the latter is Cloud Functions Admin.

```powershell
npx firebase-tools firestore:databases:create shakthi-crm --location asia-south1 --delete-protection ENABLED --project shakthi-enterprises-2df21
npm ci --prefix functions
npm test
npx firebase-tools deploy --only firestore,functions,hosting --project shakthi-enterprises-2df21
```

Do not repeat database creation when it already exists. The predeploy script copies only application source and the optional private reference catalogue into the function package. It excludes local databases, review sessions and local uploads. The production reference catalogue is stored privately in `crmCatalogue/reference` in the named Firestore database. Functions load it on cold start, independently of ignored local files or source packaging. The local catalogue can be regenerated with `scripts/import-product-catalogue.py`; its prices are not imported into orders or stock.

## Verification and recovery

Verify anonymous API access is rejected, owner sign-in works, sessions survive a cold start, and a private test upload and record remain available after a backend revision change. Check an API backup includes attachment contents. The scheduled runner must use the same durable transaction path as HTTP requests.

The server's local SQLite restore script is not a restore tool for this Firestore-backed deployment. Use a reviewed Firestore backup/restore procedure for managed production data. Never overwrite production with local demo records.

## Live deployment verification — 25 November 2026

The API, scheduled runner, isolated database and Hosting rewrite are deployed. The live URL is https://shakthi-enterprises-2df21.web.app/crm.

Verified production owner sign-in, secure `__session` cookies, anonymous-access rejection, the private eleven-family product catalogue, a byte-for-byte private file round trip through Firestore, persisted session storage, sign-out, and the scheduled runner's successful execution. Temporary verification records and file chunks were removed without changing business balances. Local review records were not imported.

Function container build images have a 30-day retention policy. This policy does not delete CRM records or uploaded files.
