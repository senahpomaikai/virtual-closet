# Virtual Closet — First Three Screens Prototype

A virtual closet cataloging mock-up. Photograph an outfit, get it broken into
pieces with guessed attributes, and browse your growing closet as a Pinterest-style
grid with cost-per-wear tracking.

> **Status:** This README follows the course assignment's required structure.
> Sections marked `TODO` need to be completed after the prototype is built and
> revised — they require reflection on the actual live app, not the plan.

## Live Demo
TODO — `https://senahpark.com/is551/{app-name}/`

## Repository
TODO — link if this README lives somewhere other than the repo root

---

## 1. Need, Persona, Capability, Value

- **Need:** To keep track of closet usage, fashion aficionados must rely on memory
  or a very complex and manual spreadsheet.
- **Persona:** Intentionally shops for and invests in articles of clothing, cares
  about "cost per wear," wants to understand their personal style better.
- **Capability:** Keep track of items in closet virtually.
- **Fundamental Value:** Curation. The user is better able to select and understand
  their closet to be able to curate their style into who they want to be.

## 2. The Three Screens

| Screen | Job | Why It Earned a Slot | Design Question |
|--------|-----|----------------------|------------------|
| Landing | Signal the core value and primary capability at a glance | First and only chance to hook the persona before they decide whether to explore | Does the value land before the user reads anything? |
| Capture & Log | Demonstrate the primary capability in action | Shows the app actually doing the work the persona currently does by memory/spreadsheet | Does the capability feel fast and low-effort? |
| Virtual Closet | Demonstrate the payoff of accumulated data | Shows *why* logging outfits matters — curation only shows up once there's a closet to curate | Does the payoff feel real once items accumulate? |

## 3. Feedback Question Plan
TODO — pick at least 4 questions (at least one from each of Need, Value, Persona,
Capability), rewritten in the words you'd actually say to your persona, each with a
prediction tied to a specific part of the built prototype. Suggested starting shape:

| Question (as you'd say it) | Predicted answer | What in the prototype the prediction rests on |
|---|---|---|
| *(Need)* | | |
| *(Value)* | | |
| *(Persona)* | | |
| *(Capability)* | | |

## 4. Design Justification & First Read
TODO — after building and revising, open your own live URL as if seeing it for the
first time and answer:
- Does the landing screen signal the primary capability and fundamental value at
  first glance, before reading?
- Does every element on the landing screen earn its place, or does anything
  compete with the primary job?
- What belongs together on each screen, and which Gestalt principle communicates
  that grouping?
- Do Screens 2 and 3 stay on mission, and can you return to the landing screen
  from everywhere?
- What did the AI initially get wrong, skip, or oversimplify, and what did you
  change?
- Which design/signaling/grouping decision motivated each important change?

Include one concrete before-and-after (screenshots, or a link to the initial commit
next to the revised screen).

---

## Tech Stack
- Vite + React + TypeScript
- Client-side only — no backend, no auth
- Attribute guessing: canvas-based color extraction (real) + lightweight
  pretrained image classifier for type (rough guess) — see `SPEC.md` for details
- Deployed as a static site to `senahpark.com/is551/{app-name}` via S3 + CloudFront

## Running Locally
```bash
npm install
npm run dev
```

## Deployment
Built as a static site and published to `senahpark.com/is551/{app-name}` via S3 +
CloudFront (custom domain managed in Route 53). A GitHub Actions workflow builds
the app, syncs `dist/` to the app's S3 prefix, and invalidates the CloudFront
cache on every push to `main`. See `SPEC.md` → "Infrastructure & Deployment" for
the full setup (bucket/distribution/cert requirements, IAM scoping, and the
Vite `base` path needed for subpath hosting).

## Commit History Note
Initial commit reflects the AI agent's first output, unmodified. Subsequent
commits, merged via Pull Request, contain the reviewed revisions described in
Section 4 above.
