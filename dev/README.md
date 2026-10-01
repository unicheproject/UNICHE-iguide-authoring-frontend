# Local UNICHE stand-ins

`docker-compose.yml` runs a local Keycloak and a stub of the Catalogue API, so the CMS and the backend can
be exercised end to end without the live platform. Use it for development and testing only.

| Service | URL | Notes |
|---|---|---|
| Keycloak | `http://localhost:8180` | realm `uniche`, public client `iguide-web` (PKCE S256, `uniche-platform` audience) |
| Keycloak admin | `http://localhost:8180/admin` | `admin` / `admin` |
| Test user | | `curator` / `curator` (Maria Papadaki) |
| Catalogue mock | `http://localhost:8181` | in-memory, data in `catalogue-mock/fixture.json`, resets on restart |
| Asset store | `http://localhost:9090` | S3-compatible (`adobe/s3mock`), bucket `iguide-assets`; files are lost when the container stops |

## Start

```bash
docker compose -f dev/docker-compose.yml up -d
```

Keycloak takes about 30 seconds to import the realm on first start.

## Point the CMS at it

In `.env.local`:

```text
VITE_IDP_URL=http://localhost:8180
```

Restart `npm run dev` after changing it.

## Point the backend at it

Tokens from this Keycloak are rejected by the live Catalogue, so the backend uses the stub while testing:

```text
IDP_ISSUER_URI=http://localhost:8180/realms/uniche
CATALOGUE_BASE_URL=http://localhost:8181
ASSETS_S3_ENDPOINT=http://localhost:9090
ASSETS_S3_REGION=us-east-1
ASSETS_S3_BUCKET=iguide-assets
ASSETS_S3_ACCESS_KEY=local
ASSETS_S3_SECRET_KEY=local-secret
```

The backend refuses to start without the five `ASSETS_S3_*` settings and checks at startup that the bucket
exists. The mock accepts any access key.

## Back to the live platform

```text
CMS      VITE_IDP_URL=https://idp.uniche-eccch.eu
Backend  IDP_ISSUER_URI=https://idp.uniche-eccch.eu/realms/uniche
         CATALOGUE_BASE_URL=https://catalogue.uniche-eccch.eu
```

The live realm needs its own `iguide-web` client registration first.

## Catalogue mock

`catalogue-mock/server.mjs` serves the Catalogue paths the backend calls for the test user in
`catalogue-mock/fixture.json`:

- `Museum of Cycladic Art`, which the test user manages, so Projects can be created in it;
- `Syros Historical Archive`, where the test user is only a member of `Syros Photo Archive`, so the other
  Project there stays invisible.

It enforces the rules the CMS depends on: only managers create Projects (`403`), slugs are unique per
organisation (`409`), and Projects outside the user's memberships answer `404`. Created Projects live in
memory until `docker compose -f dev/docker-compose.yml restart catalogue`. Add a route to `server.mjs` for each
further Catalogue endpoint the backend starts to call.
