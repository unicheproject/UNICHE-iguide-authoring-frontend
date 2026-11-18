# Round-0 baseline screenshots

Captured by `../tools/baseline.mjs` (curator account; admin for Create Project). Full-page: the app's inner scroll container is expanded before each shot. Populated = `/projects/6958c18f-60d2-4140-a524-5a43f8a2f6b5`, Empty = `/projects/65f8958a-144a-46fe-851b-f1176b2a597e`.

| screen | state | viewport | file | how to open |
|---|---|---|---|---|
| sign-in | signed-out | 1440 | sign-in__signed-out__1440.png | http://localhost:5173/ in a private window with no session |
| create-project | step1-empty | 1440 | create-project__step1-empty__1440.png | /projects/new (admin account) |
| create-project | step1-filled | 1440 | create-project__step1-filled__1440.png | /projects/new, type a name (not submitted) |
| create-project | step2-template-style-languages-surfaces | 1440 | create-project__step2-template-style-languages-surfaces__1440.png | /projects/new, fill name, click "Create Project" (baseline used a stubbed response; step 2 unlocks) |
| create-project | step3-summary-initialize | 1440 | create-project__step3-summary-initialize__1440.png | as step 2, then click "Continue" under Style; step 3 shows the summary and "Initialize" (not clicked) |
| dashboard | populated | 1440 | dashboard__populated__1440.png | /projects/6958c18f-60d2-4140-a524-5a43f8a2f6b5 |
| dashboard | empty-project | 1440 | dashboard__empty-project__1440.png | /projects/65f8958a-144a-46fe-851b-f1176b2a597e (Empty Project) |
| places-list | populated | 1440 | places-list__populated__1440.png | /projects/6958c18f-60d2-4140-a524-5a43f8a2f6b5/places |
| places-list | filtered-empty | 1440 | places-list__filtered-empty__1440.png | /projects/6958c18f-60d2-4140-a524-5a43f8a2f6b5/places, type "zzzz" in the search box |
| places-list | empty-project | 1440 | places-list__empty-project__1440.png | /projects/65f8958a-144a-46fe-851b-f1176b2a597e/places (Empty Project) |
| places-list | create-dialog | 1440 | places-list__create-dialog__1440.png | /projects/6958c18f-60d2-4140-a524-5a43f8a2f6b5/places, click "New place" |
| pois-list | populated | 1440 | pois-list__populated__1440.png | /projects/6958c18f-60d2-4140-a524-5a43f8a2f6b5/pois |
| pois-list | filtered-empty | 1440 | pois-list__filtered-empty__1440.png | /projects/6958c18f-60d2-4140-a524-5a43f8a2f6b5/pois, type "zzzz" in the search box |
| pois-list | empty-project | 1440 | pois-list__empty-project__1440.png | /projects/65f8958a-144a-46fe-851b-f1176b2a597e/pois (Empty Project) |
| pois-list | create-dialog | 1440 | pois-list__create-dialog__1440.png | /projects/6958c18f-60d2-4140-a524-5a43f8a2f6b5/pois, click "New point of interest" |
| routes-list | populated | 1440 | routes-list__populated__1440.png | /projects/6958c18f-60d2-4140-a524-5a43f8a2f6b5/routes |
| routes-list | filtered-empty | 1440 | routes-list__filtered-empty__1440.png | /projects/6958c18f-60d2-4140-a524-5a43f8a2f6b5/routes, type "zzzz" in the search box |
| routes-list | empty-project | 1440 | routes-list__empty-project__1440.png | /projects/65f8958a-144a-46fe-851b-f1176b2a597e/routes (Empty Project) |
| routes-list | create-dialog | 1440 | routes-list__create-dialog__1440.png | /projects/6958c18f-60d2-4140-a524-5a43f8a2f6b5/routes, click "New route" |
| guides-list | populated | 1440 | guides-list__populated__1440.png | /projects/6958c18f-60d2-4140-a524-5a43f8a2f6b5/guides |
| guides-list | filtered-empty | 1440 | guides-list__filtered-empty__1440.png | /projects/6958c18f-60d2-4140-a524-5a43f8a2f6b5/guides, type "zzzz" in the search box |
| guides-list | empty-project | 1440 | guides-list__empty-project__1440.png | /projects/65f8958a-144a-46fe-851b-f1176b2a597e/guides (Empty Project) |
| guides-list | create-dialog | 1440 | guides-list__create-dialog__1440.png | /projects/6958c18f-60d2-4140-a524-5a43f8a2f6b5/guides, click "New guide" |
| events-list | populated | 1440 | events-list__populated__1440.png | /projects/6958c18f-60d2-4140-a524-5a43f8a2f6b5/events |
| events-list | filtered-empty | 1440 | events-list__filtered-empty__1440.png | /projects/6958c18f-60d2-4140-a524-5a43f8a2f6b5/events, type "zzzz" in the search box |
| events-list | empty-project | 1440 | events-list__empty-project__1440.png | /projects/65f8958a-144a-46fe-851b-f1176b2a597e/events (Empty Project) |
| events-list | create-dialog | 1440 | events-list__create-dialog__1440.png | /projects/6958c18f-60d2-4140-a524-5a43f8a2f6b5/events, click "New event" |
| categories-list | populated | 1440 | categories-list__populated__1440.png | /projects/6958c18f-60d2-4140-a524-5a43f8a2f6b5/categories |
| categories-list | filtered-empty | 1440 | categories-list__filtered-empty__1440.png | /projects/6958c18f-60d2-4140-a524-5a43f8a2f6b5/categories, type "zzzz" in the search box |
| categories-list | empty-project | 1440 | categories-list__empty-project__1440.png | /projects/65f8958a-144a-46fe-851b-f1176b2a597e/categories (Empty Project) |
| categories-list | create-dialog | 1440 | categories-list__create-dialog__1440.png | /projects/6958c18f-60d2-4140-a524-5a43f8a2f6b5/categories, click "New category" |
| poi-editor | draft | 1440 | poi-editor__draft__1440.png | /projects/6958c18f-60d2-4140-a524-5a43f8a2f6b5/pois/cb763579-1082-45a7-8038-ed6a91ecc3d4 |
| poi-editor | active | 1440 | poi-editor__active__1440.png | /projects/6958c18f-60d2-4140-a524-5a43f8a2f6b5/pois/9d32bf3f-6d1b-4ab1-a129-f52f4a890403 |
| poi-editor | pending-working-copy | 1440 | poi-editor__pending-working-copy__1440.png | /projects/6958c18f-60d2-4140-a524-5a43f8a2f6b5/pois/546c5177-effd-49c8-acae-85d751f89bbe |
| place-editor | draft | 1440 | place-editor__draft__1440.png | /projects/6958c18f-60d2-4140-a524-5a43f8a2f6b5/places/01d4dbd4-3a16-411a-a663-0d2a164888e1 |
| place-editor | active | 1440 | place-editor__active__1440.png | /projects/6958c18f-60d2-4140-a524-5a43f8a2f6b5/places/e5932358-078d-4872-a903-8b726793b9d5 |
| route-editor | draft | 1440 | route-editor__draft__1440.png | /projects/6958c18f-60d2-4140-a524-5a43f8a2f6b5/routes/e415a909-58aa-433d-b16b-fd735896979c |
| route-editor | active | 1440 | route-editor__active__1440.png | /projects/6958c18f-60d2-4140-a524-5a43f8a2f6b5/routes/9743e460-8351-4897-8ee5-eecc13fcbf19 |
| route-editor | pending-working-copy | 1440 | route-editor__pending-working-copy__1440.png | /projects/6958c18f-60d2-4140-a524-5a43f8a2f6b5/routes/d73250f8-85ff-44ae-a758-e269d1b8e5dc |
| guide-editor | draft | 1440 | guide-editor__draft__1440.png | /projects/6958c18f-60d2-4140-a524-5a43f8a2f6b5/guides/35bc2737-7b97-44fd-bdb4-85f3fb65846c |
| guide-editor | active | 1440 | guide-editor__active__1440.png | /projects/6958c18f-60d2-4140-a524-5a43f8a2f6b5/guides/1c85f8b3-6ecd-4580-a13a-96df5823d863 |
| guide-editor | pending-working-copy | 1440 | guide-editor__pending-working-copy__1440.png | /projects/6958c18f-60d2-4140-a524-5a43f8a2f6b5/guides/bcc7d2be-50ef-46cb-85e2-ced86c6559a3 |
| event-editor | draft | 1440 | event-editor__draft__1440.png | /projects/6958c18f-60d2-4140-a524-5a43f8a2f6b5/events/baaa64b3-8ed8-4369-94bd-471c4980e289 |
| event-editor | active | 1440 | event-editor__active__1440.png | /projects/6958c18f-60d2-4140-a524-5a43f8a2f6b5/events/6e8462e3-a8b5-4f4b-a625-6140c1fd117e |
| category-editor | active | 1440 | category-editor__active__1440.png | /projects/6958c18f-60d2-4140-a524-5a43f8a2f6b5/categories/79aaf581-d009-4294-a11b-bf5a8fa980f3 |
| category-editor | active-subcategory | 1440 | category-editor__active-subcategory__1440.png | /projects/6958c18f-60d2-4140-a524-5a43f8a2f6b5/categories/51c12bfc-c55a-40b3-8829-fcf656677449 |
| poi-editor | preview-in-app-panel | 1440 | poi-editor__preview-in-app-panel__1440.png | /projects/6958c18f-60d2-4140-a524-5a43f8a2f6b5/pois/9d32bf3f-6d1b-4ab1-a129-f52f4a890403, click "Preview in app" |
| asset-picker | open-from-poi-editor | 1440 | asset-picker__open-from-poi-editor__1440.png | /projects/6958c18f-60d2-4140-a524-5a43f8a2f6b5/pois/cb763579-1082-45a7-8038-ed6a91ecc3d4, in the media slots click "Choose asset" |
| maps-list | populated | 1440 | maps-list__populated__1440.png | /projects/6958c18f-60d2-4140-a524-5a43f8a2f6b5/maps |
| map-editor | populated | 1440 | map-editor__populated__1440.png | /projects/6958c18f-60d2-4140-a524-5a43f8a2f6b5/maps/5eef6cab-a61e-419e-adff-053edfff9939 |
| maps-list | empty-project | 1440 | maps-list__empty-project__1440.png | /projects/65f8958a-144a-46fe-851b-f1176b2a597e/maps (Empty Project) |
| maps-list | new-map-dialog | 1440 | maps-list__new-map-dialog__1440.png | /projects/6958c18f-60d2-4140-a524-5a43f8a2f6b5/maps, click "New map" |
| floor-plans-list | populated | 1440 | floor-plans-list__populated__1440.png | /projects/6958c18f-60d2-4140-a524-5a43f8a2f6b5/floor-plans (or Maps page, tab "Floor plans") |
| floor-plans-list | empty-project | 1440 | floor-plans-list__empty-project__1440.png | /projects/65f8958a-144a-46fe-851b-f1176b2a597e/floor-plans (Empty Project) |
| floor-plans-list | new-floor-plan-dialog | 1440 | floor-plans-list__new-floor-plan-dialog__1440.png | /projects/6958c18f-60d2-4140-a524-5a43f8a2f6b5/floor-plans, click "New floor plan" |
| floor-plan-editor | populated | 1440 | floor-plan-editor__populated__1440.png | /projects/6958c18f-60d2-4140-a524-5a43f8a2f6b5/floor-plans/d40864d1-684a-466f-819d-68fa651b7146 |
| media-library | grid | 1440 | media-library__grid__1440.png | /projects/6958c18f-60d2-4140-a524-5a43f8a2f6b5/media |
| media-library | list | 1440 | media-library__list__1440.png | /projects/6958c18f-60d2-4140-a524-5a43f8a2f6b5/media, click "List" in the View toggle |
| media-library | filtered-empty | 1440 | media-library__filtered-empty__1440.png | /projects/6958c18f-60d2-4140-a524-5a43f8a2f6b5/media, type "zzzz" in the search box |
| media-library | empty-project | 1440 | media-library__empty-project__1440.png | /projects/65f8958a-144a-46fe-851b-f1176b2a597e/media (Empty Project) |
| media-library | upload-dialog | 1440 | media-library__upload-dialog__1440.png | /projects/6958c18f-60d2-4140-a524-5a43f8a2f6b5/media, click "Upload" |
| asset-editor | image | 1440 | asset-editor__image__1440.png | /projects/6958c18f-60d2-4140-a524-5a43f8a2f6b5/media/484a6bb2-d08c-41df-aa7c-d8cf2a2f1823 (or click the asset in the library) |
| asset-editor | audio | 1440 | asset-editor__audio__1440.png | /projects/6958c18f-60d2-4140-a524-5a43f8a2f6b5/media/cd03daa8-2684-4f8b-84b8-f674babe501b (or click the asset in the library) |
| asset-editor | pdf | 1440 | asset-editor__pdf__1440.png | /projects/6958c18f-60d2-4140-a524-5a43f8a2f6b5/media/b8c67518-8f82-44ca-a62f-b56d518f04ba (or click the asset in the library) |
| preview | web | 1440 | preview__web__1440.png | /projects/6958c18f-60d2-4140-a524-5a43f8a2f6b5/preview, choose surface WEB |
| preview | mobile | 1440 | preview__mobile__1440.png | /projects/6958c18f-60d2-4140-a524-5a43f8a2f6b5/preview, choose surface MOBILE |
| preview | kiosk | 1440 | preview__kiosk__1440.png | /projects/6958c18f-60d2-4140-a524-5a43f8a2f6b5/preview, choose surface KIOSK |
| app-preview | mobile | 1440 | app-preview__mobile__1440.png | /projects/6958c18f-60d2-4140-a524-5a43f8a2f6b5/app-preview?surface=MOBILE&lang=en&mode=WORKING (Preview page, "Open in new tab") |
| app-preview | web | 1440 | app-preview__web__1440.png | /projects/6958c18f-60d2-4140-a524-5a43f8a2f6b5/app-preview?surface=WEB&lang=en&mode=WORKING (Preview page, "Open in new tab") |
| app-preview | kiosk | 1440 | app-preview__kiosk__1440.png | /projects/6958c18f-60d2-4140-a524-5a43f8a2f6b5/app-preview?surface=KIOSK&lang=en&mode=WORKING (Preview page, "Open in new tab") |
| preview | empty-project | 1440 | preview__empty-project__1440.png | /projects/65f8958a-144a-46fe-851b-f1176b2a597e/preview (Empty Project) |
| oos__overview | render-check | 1440 | oos__overview__render-check__1440.png | /projects/6958c18f-60d2-4140-a524-5a43f8a2f6b5/overview |
| oos__app-settings | render-check | 1440 | oos__app-settings__render-check__1440.png | /projects/6958c18f-60d2-4140-a524-5a43f8a2f6b5/app-settings |
| oos__languages | render-check | 1440 | oos__languages__render-check__1440.png | /projects/6958c18f-60d2-4140-a524-5a43f8a2f6b5/languages |
| oos__surfaces | render-check | 1440 | oos__surfaces__render-check__1440.png | /projects/6958c18f-60d2-4140-a524-5a43f8a2f6b5/surfaces |
| oos__features | render-check | 1440 | oos__features__render-check__1440.png | /projects/6958c18f-60d2-4140-a524-5a43f8a2f6b5/features |
| oos__pages | render-check | 1440 | oos__pages__render-check__1440.png | /projects/6958c18f-60d2-4140-a524-5a43f8a2f6b5/pages |
| oos__navigation | render-check | 1440 | oos__navigation__render-check__1440.png | /projects/6958c18f-60d2-4140-a524-5a43f8a2f6b5/navigation |
| oos__translations | render-check | 1440 | oos__translations__render-check__1440.png | /projects/6958c18f-60d2-4140-a524-5a43f8a2f6b5/translations |
| oos__launch | render-check | 1440 | oos__launch__render-check__1440.png | /projects/6958c18f-60d2-4140-a524-5a43f8a2f6b5/launch |
| oos__audit-log | render-check | 1440 | oos__audit-log__render-check__1440.png | /projects/6958c18f-60d2-4140-a524-5a43f8a2f6b5/audit-log |
| header | project-switcher-open | 1440 | header__project-switcher-open__1440.png | /projects/6958c18f-60d2-4140-a524-5a43f8a2f6b5, click the project name in the header |
| chrome | offline-banner | 1440 | chrome__offline-banner__1440.png | /projects/6958c18f-60d2-4140-a524-5a43f8a2f6b5, switch network offline (DevTools), click a nav item |
| error | 403-access-denied | 1440 | error__403-access-denied__1440.png | /projects/6958c18f-60d2-4140-a524-5a43f8a2f6b5 with GET /projects/{id} answering 403 (page.route) |
| error | 404-not-found | 1440 | error__404-not-found__1440.png | /projects/6958c18f-60d2-4140-a524-5a43f8a2f6b5 with GET /projects/{id} answering 404 (page.route) |
| error | 503-platform-unreachable | 1440 | error__503-platform-unreachable__1440.png | /projects/6958c18f-60d2-4140-a524-5a43f8a2f6b5 with GET /projects/{id} answering 503 (page.route) |
| error | 503-on-poi-list | 1440 | error__503-on-poi-list__1440.png | /projects/6958c18f-60d2-4140-a524-5a43f8a2f6b5/pois with the POI list request answering 503 (page.route) |
| dashboard | populated | 1024 | dashboard__populated__1024.png | /projects/6958c18f-60d2-4140-a524-5a43f8a2f6b5 |
| pois-list | populated | 1024 | pois-list__populated__1024.png | /projects/6958c18f-60d2-4140-a524-5a43f8a2f6b5/pois |
| poi-editor | active | 1024 | poi-editor__active__1024.png | /projects/6958c18f-60d2-4140-a524-5a43f8a2f6b5/pois/9d32bf3f-6d1b-4ab1-a129-f52f4a890403 |
| map-editor | populated | 1024 | map-editor__populated__1024.png | /projects/6958c18f-60d2-4140-a524-5a43f8a2f6b5/maps/5eef6cab-a61e-419e-adff-053edfff9939 |
| media-library | grid | 1024 | media-library__grid__1024.png | /projects/6958c18f-60d2-4140-a524-5a43f8a2f6b5/media |
| preview | mobile | 1024 | preview__mobile__1024.png | /projects/6958c18f-60d2-4140-a524-5a43f8a2f6b5/preview, choose surface MOBILE |
| dashboard | populated | 768 | dashboard__populated__768.png | /projects/6958c18f-60d2-4140-a524-5a43f8a2f6b5 |
| pois-list | populated | 768 | pois-list__populated__768.png | /projects/6958c18f-60d2-4140-a524-5a43f8a2f6b5/pois |
| poi-editor | active | 768 | poi-editor__active__768.png | /projects/6958c18f-60d2-4140-a524-5a43f8a2f6b5/pois/9d32bf3f-6d1b-4ab1-a129-f52f4a890403 |
| map-editor | populated | 768 | map-editor__populated__768.png | /projects/6958c18f-60d2-4140-a524-5a43f8a2f6b5/maps/5eef6cab-a61e-419e-adff-053edfff9939 |
| media-library | grid | 768 | media-library__grid__768.png | /projects/6958c18f-60d2-4140-a524-5a43f8a2f6b5/media |
| preview | mobile | 768 | preview__mobile__768.png | /projects/6958c18f-60d2-4140-a524-5a43f8a2f6b5/preview, choose surface MOBILE |

Not captured: silent SSO landing, session-expired, configuration error (need auth/config manipulation). Create Project steps 2-3 use a stubbed POST response (nothing created). Offline banner and 403/404/503 states are forced via browser offline mode / `page.route`. No DRAFT Category exists in the seed; no pending Working Copy known for Places, Events, Categories.