# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

A static, no-build front end for the **MapAid Online Water Library ("OWL")** — a
browse/search UI over a classified archive of African water-infrastructure documents
(produced by a MapAid x Databricks data pipeline, see `../_resources/Code`). There is
no server, no package manager, and no build step: open `index.html` directly or serve
the directory with any static file server (e.g. `python3 -m http.server`).

Note: the git repository root is one level up at `/Users/esemen/Sites/gma/owl`; this
`web/` directory is the deployable site.

## Architecture

- `index.html` — main library page: hero stats, a searchable/sortable archive table,
  and "featured geographies" tag list.
- `access.html` / `access.js` — a "Request access" form. On submit it just writes the
  form fields to `localStorage` under `mapaid-online-water-library-access` — there is
  **no real backend validation**; this purely gates the UI's perceived "unlocked" state
  client-side.
- `app.js` — all page logic for `index.html`:
  - `DATASETS` defines the two browsable datasets (`documents` = document
    classifications, `wells` = well extractions), each with a label, source JSON file,
    and the table columns to render.
  - `init()` loads data either from the pre-embedded `window.MAPAID_LIBRARY_DATA`
    global (set by `web-data/archive-data.js`) or, if absent, by fetching
    `web-data/summary.json` + the per-dataset JSON files. The embedded-data path is
    what makes the site work when opened via `file://` (fetch is blocked by CORS there).
  - Rendering is plain DOM/string-template based — no framework. `renderTable()`
    re-renders on dataset switch or search input change, filtering rows client-side
    (`getFilteredRows`) by stringifying each row and matching the lowercased query.
  - Permission state (`hydratePermissionState`/`syncDownloadState`) just reflects
    whether the `localStorage` access record exists; it does not currently gate any
    content in the UI.
- `web-data/archive-data.js` — generated data bundle. Defines
  `window.MAPAID_LIBRARY_DATA = { summary, documents, wells }`, a large (~400KB)
  inlined copy of the JSON exports, used as the primary data source (see `init()`
  above). `summary.featuredGeographies` / `summary.featuredLocations` drive the tag
  lists; `summary.downloadFiles` records the relative paths of the source
  spreadsheet/JSON/CSV exports.
- `web-data/*.json` / `web-data/*.csv` — the underlying per-row exports for the two
  datasets (document classifications and well extractions), generated upstream by
  `../_resources/scripts/export_archive_data.py` from the Databricks pipeline output.
- `styles.css` — all styling; uses CSS custom properties defined on `:root` for the
  warm "archive" color palette, plus a `page-shell`/`panel` layout convention reused
  across both pages.
- `assets/` — static images (MapAid logo).

## Working with the data

- When `web-data/archive-data.js` and `web-data/*.json` disagree, the embedded bundle
  (`archive-data.js`) wins at runtime — regenerate it (or hand-edit consistently) if you
  change the JSON/CSV exports.
- Table columns shown for each dataset are declared in `app.js`'s `DATASETS[...].columns`
  — add/remove a column there (and ensure the field exists in the corresponding JSON) to
  change what's displayed.
- `displayValue()` in `app.js` controls how arrays, booleans, nulls, and empty strings
  are rendered in table cells (e.g. arrays joined with `, `, booleans as Yes/No, empty
  as `—`). Keep new fields compatible with this formatter or extend it.
