let allBooks = [];

const grid = document.getElementById("grid");
const search = document.getElementById("search");
const count = document.getElementById("count");
const modalBackdrop = document.getElementById("modal-backdrop");

const filterTag = document.getElementById("filter-tag");
const filterStatus = document.getElementById("filter-status");
const sortKey = document.getElementById("sort-key");
const sortDir = document.getElementById("sort-dir");
const filterReset = document.getElementById("filter-reset");
const filterRefresh = document.getElementById("filter-refresh");

function stars(rating) {
  if (!rating) return "";
  const full = Math.round(rating);
  return "★".repeat(full) + "☆".repeat(5 - full);
}

function splitAuthors(authors) {
  return (authors || "").split(" & ").map(s => s.trim()).filter(Boolean);
}

function splitTags(tags) {
  return (tags || "").split("、").map(s => s.trim()).filter(Boolean);
}

function populateFilterOptions() {
  const tags = new Set();
  for (const b of allBooks) {
    splitTags(b.tags).forEach(t => tags.add(t));
  }
  for (const t of [...tags].sort((a, b) => a.localeCompare(b, "zh-Hant"))) {
    const opt = document.createElement("option");
    opt.value = t;
    opt.textContent = t;
    filterTag.appendChild(opt);
  }

  const statuses = new Set();
  let hasBlank = false;
  for (const b of allBooks) {
    if (b.reading_status) statuses.add(b.reading_status);
    else hasBlank = true;
  }
  for (const s of [...statuses].sort()) {
    const opt = document.createElement("option");
    opt.value = s;
    opt.textContent = s;
    filterStatus.appendChild(opt);
  }
  if (hasBlank) {
    const opt = document.createElement("option");
    opt.value = "__blank__";
    opt.textContent = "(未標記)";
    filterStatus.appendChild(opt);
  }
}

function matchesFilters(b) {
  const q = search.value.trim().toLowerCase();
  if (q) {
    const hit =
      (b.title && b.title.toLowerCase().includes(q)) ||
      (b.authors && b.authors.toLowerCase().includes(q)) ||
      (b.tags && b.tags.toLowerCase().includes(q)) ||
      (b.rating_label && b.rating_label.toLowerCase().includes(q));
    if (!hit) return false;
  }

  if (filterTag.value && !splitTags(b.tags).includes(filterTag.value)) return false;

  if (filterStatus.value === "__blank__") {
    if (b.reading_status) return false;
  } else if (filterStatus.value && b.reading_status !== filterStatus.value) {
    return false;
  }

  return true;
}

const collator = new Intl.Collator("zh-Hant");

function sortBooks(books) {
  const key = sortKey.value;
  const dir = sortDir.value === "asc" ? 1 : -1;
  return [...books].sort((a, b) => {
    let va = a[key];
    let vb = b[key];
    if (key === "quality_rating") {
      va = va || 0;
      vb = vb || 0;
      return (va - vb) * dir;
    }
    va = (va || "").toString();
    vb = (vb || "").toString();
    return collator.compare(va, vb) * dir;
  });
}

function applyFilters() {
  const filtered = allBooks.filter(matchesFilters);
  render(sortBooks(filtered));
}

let booksById = new Map();

function escapeHtml(s) {
  return (s || "").replace(/[&<>"']/g, c => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  }[c]));
}

function cardHtml(b) {
  const title = escapeHtml(b.title);
  const img = b.cover
    ? `<img src="${b.cover}" alt="" loading="lazy">`
    : `<div class="no-cover">${title}</div>`;
  return `
    <div class="card" data-id="${b.id}">
      ${img}
      <div class="title">${title}</div>
      <div class="stars">${stars(b.quality_rating)}</div>
    </div>
  `;
}

// 分批渲染：一次只畫 CHUNK 張卡片，捲到底再補下一批
const CHUNK = 120;
let renderList = [];
let renderedCount = 0;

const sentinel = document.createElement("div");
sentinel.id = "scroll-sentinel";

function appendChunk() {
  const next = renderList.slice(renderedCount, renderedCount + CHUNK);
  if (!next.length) return;
  renderedCount += next.length;
  grid.insertAdjacentHTML("beforeend", next.map(cardHtml).join(""));
  if (renderedCount < renderList.length) {
    grid.after(sentinel);
  } else {
    sentinel.remove();
  }
}

const observer = new IntersectionObserver((entries) => {
  if (entries.some(e => e.isIntersecting)) appendChunk();
}, { rootMargin: "1000px" });
observer.observe(sentinel);

function render(books) {
  count.textContent = `${books.length} books`;
  booksById = new Map(books.map(b => [b.id, b]));
  renderList = books;
  renderedCount = 0;
  grid.innerHTML = "";
  appendChunk();
}

grid.addEventListener("click", (e) => {
  const card = e.target.closest(".card");
  if (!card) return;
  const book = booksById.get(Number(card.dataset.id));
  if (book) openModal(book);
});

function openModal(b) {
  document.getElementById("modal-cover").src = b.cover || "";
  document.getElementById("modal-cover").style.display = b.cover ? "block" : "none";
  document.getElementById("modal-title").textContent = b.title;
  document.getElementById("modal-authors").textContent = b.authors;
  document.getElementById("modal-rating").textContent = stars(b.quality_rating);
  document.getElementById("modal-label").textContent = b.rating_label;
  document.getElementById("modal-review").textContent = b.key_review;
  document.getElementById("modal-tags").textContent = b.tags ? `Tags: ${b.tags}` : "";
  document.getElementById("modal-status").textContent = b.reading_status ? `Status: ${b.reading_status}` : "";
  document.getElementById("modal-pubdate").textContent = b.date_added ? `Added: ${b.date_added.slice(0, 10)}` : "";
  modalBackdrop.classList.remove("hidden");
}

document.getElementById("modal-close").addEventListener("click", () => {
  modalBackdrop.classList.add("hidden");
});
modalBackdrop.addEventListener("click", (e) => {
  if (e.target === modalBackdrop) modalBackdrop.classList.add("hidden");
});

// 打字防抖：停止輸入 150ms 後才重新過濾，避免每個字都重畫
let searchTimer;
search.addEventListener("input", () => {
  clearTimeout(searchTimer);
  searchTimer = setTimeout(applyFilters, 150);
});
filterTag.addEventListener("change", applyFilters);
filterStatus.addEventListener("change", applyFilters);
sortKey.addEventListener("change", applyFilters);
sortDir.addEventListener("change", applyFilters);

filterReset.addEventListener("click", () => {
  search.value = "";
  filterTag.value = "";
  filterStatus.value = "";
  sortKey.value = "date_added";
  sortDir.value = "desc";
  applyFilters();
});

function loadLibrary() {
  return fetch(`library.json?t=${Date.now()}`, { cache: "no-store" })
    .then(r => r.json())
    .then(data => {
      allBooks = data;
      filterTag.innerHTML = '<option value="">Tag: All</option>';
      filterStatus.innerHTML = '<option value="">Status: All</option>';
      populateFilterOptions();
      applyFilters();
    });
}

filterRefresh.addEventListener("click", () => {
  filterRefresh.disabled = true;
  loadLibrary().finally(() => { filterRefresh.disabled = false; });
});

loadLibrary();
