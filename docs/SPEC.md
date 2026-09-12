# Virtual Closet — Build Spec (AI Agent Brief)

## Product Description
A virtual closet cataloging app. The user builds their closet by photographing an
outfit; the app breaks it into individual pieces, guesses basic attributes for each,
and lets the user confirm/edit before saving. As the closet grows, the app surfaces
usage metrics (times worn, cost per wear, counts by category) in a Pinterest-style
grid. If a photographed piece already exists in the closet, the app should recognize
that and increment its wear count rather than creating a duplicate.

This is a 3-screen interactive mock-up for an early user-comprehension test — not a
production ML product. Depth of "intelligence" should be just enough to feel
believable in a demo, not accurate at scale.

## Step 1 — Need, Persona, Capability, Value
*(carried over as written)*

- **Need:** To keep track of closet usage, fashion aficionados must rely on memory
  or a very complex and manual spreadsheet.
- **Persona:** Intentionally shops for and invests in articles of clothing, cares
  about "cost per wear" (a metric used to determine utility of an article of
  clothing), wants to understand their personal style better.
- **Capability:** Keep track of items in closet virtually.
- **Fundamental Value:** Curation. The user is better able to select and understand
  their closet to be able to curate their style into who they want to be.

## Step 2 — The Three Screens

| # | Name | Primary Job | Design Question It Answers |
|---|------|-------------|------------------------------|
| 1 | Landing / Hero | Signal the core value (curation) and primary capability (virtual closet tracking) in a glance, with 2 nav buttons forward | Does the value land before the user reads anything? |
| 2 | Capture & Log | Take a photo of an outfit, break it into pieces, guess attributes, let user confirm/edit, save to closet | Does the capability feel fast and low-effort to demonstrate? |
| 3 | Virtual Closet | Browse the full closet as a Bento-style grid with filters, see per-item metrics | Does the payoff (curation, cost-per-wear insight) feel real once items accumulate? |

### Screen 1 — Landing
- Headline / affordance sentence stating the value proposition. **This is the
  dominant element on the screen** — everything else, including any animation,
  must stay visually subordinate to it.
- Subtle looping background animation cycling through a couple of states (e.g. a
  garment scan, a rotating closet carousel). Keep it muted/low-contrast — it
  illustrates, it doesn't compete.
- Two clear navigation buttons: "Log an Outfit" (→ Screen 2) and "View My Closet"
  (→ Screen 3).
- Visual style: simple, modern, brutalist/material — flat colors, strong type,
  minimal chrome.

### Screen 2 — Capture & Log
- Native webcam capture (`getUserMedia`) — must be fully functional, not a stub.
- After capture, break the outfit photo into individual "detected pieces" (can be
  simulated segmentation — e.g. simple cropped regions or a fixed demo
  breakdown — real segmentation is out of scope).
- For each piece, run the guess pipeline (see Feature Requirements) and show an
  editable form: type, color, material, size — all pre-filled with guesses, all
  overridable by the user.
- If a piece looks like an existing closet item (see duplicate detection below),
  show it as a suggestion ("Looks similar to [item] — same piece?") rather than
  auto-merging silently. Confirming increments that item's `numWear`. Declining
  proceeds to add it as new.
- Clear back-to-landing navigation.

### Screen 3 — Virtual Closet
- 2-by-x Bento-style grid, vertical scroll, one photo preview per item.
- Horizontal scrolling row of pill-shaped filter buttons above the grid (by
  category, color, fiber/material, etc.), Gestalt "common region" grouping to
  visually separate filters from grid content.
- Each item tile shows enough to support the metrics story (e.g. times worn, cost
  per wear) — full detail can be a tap-to-expand if time allows, not required for
  v1.
- Clear back-to-landing navigation.

## Feature Requirements

**Camera capture**
- Real `getUserMedia` webcam access. Must work over HTTPS on the deployed
  CloudFront domain — this only works once the distribution/cert are live (see
  "Infrastructure & Deployment" below); `localhost` works over plain HTTP during
  dev regardless. No mocked camera.

**Attribute guessing (kept intentionally light)**
- *Color*: compute directly from the captured image (e.g. average/dominant RGB
  via canvas `getImageData`) — this should be real, not faked.
- *Type*: best-effort guess using a small pretrained image classifier loaded
  client-side (e.g. MobileNet via TensorFlow.js or ml5.js). Treat the result as a
  rough suggestion, always editable.
- *Material* and *Size*: no reliable lightweight way to infer these from a photo.
  Present plausible placeholder guesses (e.g. a short rotating/randomized set of
  common values) clearly as editable suggestions, not as claimed fact.

**Duplicate / "already in closet" detection**
- Heuristic only: compare the new item's dominant color (and optionally guessed
  type) against existing closet items; flag items under a distance threshold as
  possible matches. This will have false positives/negatives — that's acceptable
  for a demo, so the UI must present it as a suggestion to confirm, not an
  automatic silent action.
- Confirmed match → increment that item's `numWear`. No match / declined →
  create a new closet entry.

**Metrics**
- Per item: `numWear`, `costPerWear` (cost ÷ numWear, handle divide-by-zero),
  category.
- Aggregate (for future screens, not required to display fully in this v1):
  counts by category (tops, dresses, sneakers, etc.).

**Data**
- Pre-populate the closet with ~15–20 dummy items spanning several categories,
  colors, and materials so Screen 3 looks populated on first load.
- No backend, no auth, no persistence requirement beyond in-session state
  (optional: `localStorage` if you want changes to survive a refresh).

## Tech Stack & Constraints
- Vite + React + TypeScript, all dependencies as npm packages bundled at build
  time (do not mix in runtime CDN `<script>` imports — pick one loading
  strategy, this is it).
- Static output only — no server, no API routes.
- Deploy target: existing Route 53 domain (`senahpark.com`), served via S3 +
  CloudFront at `senahpark.com/is551/{app-name}`. See "Infrastructure &
  Deployment" below for details.
- Keep dependencies minimal. Avoid pulling in a full ML training stack, backend
  frameworks, or component/design-system libraries — none of that is graded and
  it adds deployment risk for a 3-screen mock-up.
- No client-side routing library (React Router, etc.). Switch between the three
  screens with in-app state, not URLs. This avoids all SPA deep-link/rewrite
  complications on S3/CloudFront, which don't natively support them the way
  Vercel/Netlify do.

## Infrastructure & Deployment (Route 53 + S3 + CloudFront)

**Architecture** (assumes `senahpark.com` will host multiple `/is551/*` course
projects over time, so the bucket and distribution are shared, not per-project):
- One S3 bucket holds all `is551` projects, one prefix per app:
  `s3://<bucket>/is551/<app-name>/`.
- One CloudFront distribution in front of the bucket (required for HTTPS on a
  custom domain — **plain S3 static website hosting is HTTP-only, and
  `getUserMedia` camera access will not work over HTTP on a real domain**, only
  on `localhost`). Origin Access Control (OAC) so the bucket itself can stay
  private.
- ACM certificate for `senahpark.com` (must be requested in `us-east-1` — this
  is a CloudFront requirement regardless of which region you otherwise use),
  DNS-validated via the existing Route 53 hosted zone.
- Route 53 ALIAS record for `senahpark.com` → the CloudFront distribution
  domain name (skip if this record already exists from a prior project).

**Inputs Claude Code will need from you** (gather interactively, don't
hardcode/guess):
- The S3 bucket name (existing, or create one).
- Whether a CloudFront distribution for `senahpark.com` already exists — if so,
  its distribution ID; if not, one needs to be created (one-time, ~15–40 min
  for the cert + distribution to fully propagate).
- The ACM certificate ARN, if one already exists.
- The `{app-name}` slug to use for this project's path.

**Vite config**
- Set `base: '/is551/{app-name}/'` in `vite.config.ts` so built asset URLs
  resolve correctly under the subpath instead of the domain root.

**Local CLI access**
- Assume `gh` is already authenticated locally (`gh auth login` already run) —
  use it to create the repo, push, and open/merge the PR. Do not prompt for or
  store any GitHub token.
- Assume `aws` is already configured locally (`aws configure`) with a profile
  that has access to the target account — use it for one-time setup
  (bucket/distribution/cert) and to verify deploys. Do not print or store
  access keys anywhere in the repo.

**Continuous deploy on push**
- Add a GitHub Actions workflow that, on push to `main`:
  1. `npm ci && npm run build`
  2. `aws s3 sync dist/ s3://<bucket>/is551/<app-name>/ --delete`
  3. `aws cloudfront create-invalidation --distribution-id <id> --paths "/is551/<app-name>/*"`
     (CloudFront caches aggressively — skip this step and updates may not
     appear for a while)
- AWS credentials for the Action should be a **scoped-down IAM identity**
  (permissions limited to that one S3 prefix plus invalidation rights on that
  one distribution), stored as repo secrets — not your personal/root
  credentials. OIDC role assumption is the more secure option if you want to
  avoid long-lived keys in secrets at all; plain access-key secrets are the
  faster path if you're time-boxed.

## Build Order
Infrastructure status is currently unknown (may or may not already exist for
`senahpark.com`). Because ACM validation + CloudFront propagation is the slowest,
least predictable step in this whole project, front-load it:
1. **First**, check what already exists — an existing CloudFront distribution
   aliased to `senahpark.com`? An existing ACM cert? An existing S3 bucket used
   for prior `is551` projects? (`aws cloudfront list-distributions`,
   `aws acm list-certificates --region us-east-1`, `aws s3 ls`.) Don't create
   duplicates of anything that already exists.
2. Kick off whatever's missing (cert request/validation, distribution creation)
   immediately, then let it propagate in the background.
3. Build the app itself (Screens 1–3, feature requirements) in parallel while
   that propagates.
4. Once both are ready, wire up the GitHub Actions deploy workflow and do the
   first real sync.

## Non-Goals (explicitly out of scope)
- Real trained fashion-recognition ML (material, precise sizing, accurate item
  matching)
- Accounts, login, or any auth flow
- Backend, database, or persistent server-side storage
- Design system, tokens, or reusable component library
- A fourth screen of any kind

## Instructions to the Agent
- Treat Screen 1's affordance sentence as the single most important thing a
  first-time viewer must register — nothing else on that screen should compete
  with it for attention.
- All three screens need obvious, working navigation back to the landing screen.
- Apply Gestalt grouping (proximity, similarity, common region) to the closet
  grid and filter row so related information reads as related.
- Ask clarifying questions when a requirement above is ambiguous rather than
  guessing silently.
- Build in a first pass, then expect at least one deliberate revision round for
  signaling/grouping/comprehension — don't treat the first output as final.
