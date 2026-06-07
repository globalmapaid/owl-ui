const DATASETS = {
  documents: {
    label: "Document classifications",
    file: "web-data/document_classifications.json",
    columns: [
      "file_name",
      "total_pages",
      "dewey_decimal_classifications",
      "geographies_mentioned",
      "has_water_flag",
      "water_pages",
    ],
  },
  wells: {
    label: "Well extractions",
    file: "web-data/well_extractions.json",
    columns: [
      "file_name",
      "well_id",
      "object_description",
      "location_name",
      "depth_m",
      "yield_m3_per_hour",
      "coordinate_system",
    ],
  },
};

const TABLE_PAGE_SIZE = 18;
const PERMISSION_STORAGE_KEY = "mapaid-online-water-library-access";

const state = {
  summary: null,
  documents: [],
  wells: [],
  currentDataset: "documents",
  query: "",
  unlocked: false,
};

const elements = {
  documentCount: document.querySelector("#document-count"),
  waterDocumentCount: document.querySelector("#water-document-count"),
  wellCount: document.querySelector("#well-count"),
  geographyCount: document.querySelector("#geography-count"),
  featuredGeographies: document.querySelector("#featured-geographies"),
  featuredLocations: document.querySelector("#featured-locations"),
  datasetSelect: document.querySelector("#dataset-select"),
  tableSearch: document.querySelector("#table-search"),
  tableHead: document.querySelector("#table-head"),
  tableBody: document.querySelector("#table-body"),
  tableNote: document.querySelector("#table-note"),
};

init().catch((error) => {
  console.error(error);
  if (elements.tableNote) {
    elements.tableNote.textContent = "Unable to load the archive preview. Check that the data exports were generated.";
  }
});

async function init() {
  const embedded = window.MAPAID_LIBRARY_DATA;
  const [summary, documents, wells] = embedded
    ? [embedded.summary, embedded.documents, embedded.wells]
    : await Promise.all([
        fetchJson("web-data/summary.json"),
        fetchJson(DATASETS.documents.file),
        fetchJson(DATASETS.wells.file),
      ]);

  state.summary = summary;
  state.documents = documents;
  state.wells = wells;

  hydratePermissionState();
  renderSummary();
  renderTags();
  renderTable();
  wireEvents();
}

async function fetchJson(path) {
  const response = await fetch(path);
  if (!response.ok) {
    throw new Error(`Failed to load ${path}`);
  }
  return response.json();
}

function hydratePermissionState() {
  const accessRecord = window.localStorage.getItem(PERMISSION_STORAGE_KEY);
  state.unlocked = Boolean(accessRecord);
  syncDownloadState();
}

function wireEvents() {
  elements.datasetSelect.addEventListener("change", (event) => {
    state.currentDataset = event.target.value;
    renderTable();
  });

  elements.tableSearch.addEventListener("input", (event) => {
    state.query = event.target.value.trim().toLowerCase();
    renderTable();
  });
}

function syncDownloadState() {
  return state.unlocked;
}

function renderSummary() {
  elements.documentCount.textContent = formatNumber(state.summary.documentCount);
  elements.waterDocumentCount.textContent = formatNumber(state.summary.waterDocumentCount);
  elements.wellCount.textContent = formatNumber(state.summary.wellExtractionCount);
  elements.geographyCount.textContent = formatNumber(state.summary.geographyCount);
}

function renderTags() {
  paintTags(elements.featuredGeographies, state.summary.featuredGeographies);
  paintTags(elements.featuredLocations, state.summary.featuredLocations);
}

function paintTags(container, values) {
  if (!container) {
    return;
  }
  
  container.replaceChildren(
    ...values.map((value) => {
      const pill = document.createElement("span");
      pill.textContent = value;
      return pill;
    }),
  );
}

function renderTable() {
  const dataset = DATASETS[state.currentDataset];
  const rows = getFilteredRows(state.currentDataset, state.query).slice(0, TABLE_PAGE_SIZE);

  elements.tableHead.innerHTML = `
    <tr>${dataset.columns.map((column) => `<th>${formatHeading(column)}</th>`).join("")}</tr>
  `;

  elements.tableBody.innerHTML = rows
    .map(
      (row) => `
        <tr>
          ${dataset.columns.map((column) => `<td>${escapeHtml(displayValue(row[column]))}</td>`).join("")}
        </tr>
      `,
    )
    .join("");

  const totalCount = getRows(state.currentDataset).length;
  const filteredCount = getFilteredRows(state.currentDataset, state.query).length;
  elements.tableNote.textContent = `Showing ${Math.min(TABLE_PAGE_SIZE, filteredCount)} of ${filteredCount} matching rows from ${formatNumber(totalCount)} ${dataset.label.toLowerCase()}.`;
}

function getRows(datasetKey) {
  return datasetKey === "documents" ? state.documents : state.wells;
}

function getFilteredRows(datasetKey, query) {
  const rows = getRows(datasetKey);
  if (!query) {
    return rows;
  }
  return rows.filter((row) =>
    Object.values(row).some((value) => JSON.stringify(value ?? "").toLowerCase().includes(query)),
  );
}

function displayValue(value) {
  if (Array.isArray(value)) {
    return value.join(", ");
  }
  if (value === null || value === undefined || value === "") {
    return "—";
  }
  if (typeof value === "boolean") {
    return value ? "Yes" : "No";
  }
  return String(value);
}

function formatHeading(value) {
  return value.replaceAll("_", " ");
}

function formatNumber(value) {
  return new Intl.NumberFormat().format(value);
}

function escapeHtml(value) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}
