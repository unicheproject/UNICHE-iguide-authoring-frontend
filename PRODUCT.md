# Product

<!-- impeccable:product-schema 1 -->

Source: the owner's UX-overhaul brief (2026-11-12, `ux-audit/BRIEF.md` §2), `AGENTS.md` §1 and the specs
`12-cms-experience.md`, `14-accessibility-and-content-guidelines.md`, `03-core-entities.md`.

## Platform

web

## Users

People in cultural heritage institutions (museums, archaeological sites, trails, towns) who build and
maintain a visitor-facing guide. Every Project member has full authoring rights (`12` §2):

- **Content editor** — lives in the tool daily; creates Places, Points of Interest, Routes, Guides, Events,
  Categories, maps and floor plans; uploads media; decides what becomes `ACTIVE`. Needs speed, keyboard
  flow, clear save feedback, and never losing work.
- **Translator** — works per language across the whole Project, often Greek and other non-English
  languages; needs to find untranslated work and see the default-language text beside the target.
- **Project manager** — short, infrequent sessions, low training; creates and initializes Projects, reads
  the Dashboard to decide what blocks launch.
- **Kiosk operator** — checks how the guide looks on `KIOSK`, `MOBILE` and `WEB`; often on a tablet on site.

## Product Purpose

The iGuide CMS is the only authoring surface of iGuide: every change to a Project's content passes through
it. Success is an author who can go from an empty Project to a complete, translated, ready guide without
training, and a daily editor who can maintain 40+ items per list quickly and confidently.

## Positioning

Built around the domain of heritage guides rather than generic content: Places nested indoors and
outdoors, POIs placed on maps and floor plans, ordered Routes and story Guides, visitor triggers (QR,
geo-proximity, beacon) inside each item, per-language completeness, a single readiness model, and a live
preview of the visitor app per surface and language.

## Operating Context

- Authors work inside one Project at a time; Project creation lives in the UNICHE Platform Catalogue,
  initialization (Template, style preset, languages, surfaces) happens in the CMS.
- Lifecycle `DRAFT` → `ACTIVE` → `ARCHIVED`. An `ACTIVE` item is edited through a **Working Copy** (Save
  draft / Apply changes / Discard); visitors see nothing until Apply. The word "published" is never used.
- **Readiness** (blocking issues, warnings) is the single answer to "what is missing": Dashboard status
  card, activation refusal, and each editor's "What needs attention".
- Saving is explicit and versioned: `409` shows per-field mine/current; `422` shows errors at the field and
  in a summary; unsaved form state survives in browser storage with Restore / Discard.
- Desktop is primary (1440 and 1280 wide); tablets (1024, 768) must remain fully usable, on site, by touch.

## Capabilities and Constraints

- Vue 3 SPA, TypeScript strict, Tailwind + shadcn-vue; API client generated from the backend's OpenAPI
  contract; errors are RFC 7807 problem details matched on `code` and shown with their `requestId`.
- Tokens in memory only; the CMS talks only to the authoring API and the identity provider; no analytics.
- Spec vocabulary (actions, codes, enums) is canonical; spec behaviour in `12` and `14` is fixed.

## Brand Commitments

UNICHE platform identity (UNICHE logo, purple brand colour) is the incumbent; the owner has authorized
departing from the incumbent look where it improves usability, with each direction change recorded in
DECISIONS.md. Tone: calm, trustworthy, institutional-but-friendly, for cultural heritage professionals.
Anti-references: generic SaaS dashboards, developer-console feel.

## Product Principles

1. The author always knows where they are, what state an item is in, and what visitors currently see.
2. Nothing is lost silently: saving, applying and discarding are explicit and confirmed.
3. One answer to "what is missing" — readiness — surfaced where the author is working.
4. Every language is a first-class citizen; untranslated work is easy to find.
5. Calm precision over decoration: the content and the visitor result lead.

## Accessibility & Inclusion

WCAG 2.1 AA is a release gate (`14` §4): visible labels; errors linked to controls, announced and
summarized; keyboard alternatives for every reorder and for map/floor-plan placement (coordinate fields);
state shown by text and icon, never colour alone; labelled preview frame with CMS chrome operable while it
has focus; live-region announcements for uploads and long operations; 200 % text scaling; contrast 4.5:1
text, 3:1 UI.
