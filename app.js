let allBooks = [];

const grid = document.getElementById("grid");
const search = document.getElementById("search");
const count = document.getElementById("count");
const modalBackdrop = document.getElementById("modal-backdrop");

const filterTag = document.getElementById("filter-tag");
const sortKey = document.getElementById("sort-key");
const sortDir = document.getElementById("sort-dir");
const filterReset = document.getElementById("filter-reset");

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

  return true;
}

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
    return va.localeCompare(vb, "zh-Hant") * dir;
  });
}

function applyFilters() {
  const filtered = allBooks.filter(matchesFilters);
  render(sortBooks(filtered));
}

function render(books) {
  grid.innerHTML = "";
  count.textContent = `${books.length} 本`;
  for (const b of books) {
    const card = document.createElement("div");
    card.className = "card";

    const img = b.cover
      ? `<img src="${b.cover}" alt="" loading="lazy">`
      : `<div class="no-cover">${b.title}</div>`;

    card.innerHTML = `
      ${img}
      <div class="title">${b.title}</div>
      <div class="stars">${stars(b.quality_rating)}</div>
    `;
    card.addEventListener("click", () => openModal(b));
    grid.appendChild(card);
  }
}

function openModal(b) {
  document.getElementById("modal-cover").src = b.cover || "";
  document.getElementById("modal-cover").style.display = b.cover ? "block" : "none";
  document.getElementById("modal-title").textContent = b.title;
  document.getElementById("modal-authors").textContent = b.authors;
  document.getElementById("modal-rating").textContent = stars(b.quality_rating);
  document.getElementById("modal-label").textContent = b.rating_label;
  document.getElementById("modal-review").textContent = b.key_review;
  document.getElementById("modal-tags").textContent = b.tags ? `標籤：${b.tags}` : "";
  document.getElementById("modal-pubdate").textContent = b.date_added ? `加入日期：${b.date_added.slice(0, 10)}` : "";
  modalBackdrop.classList.remove("hidden");
}

document.getElementById("modal-close").addEventListener("click", () => {
  modalBackdrop.classList.add("hidden");
});
modalBackdrop.addEventListener("click", (e) => {
  if (e.target === modalBackdrop) modalBackdrop.classList.add("hidden");
});

search.addEventListener("input", applyFilters);
filterTag.addEventListener("change", applyFilters);
sortKey.addEventListener("change", applyFilters);
sortDir.addEventListener("change", applyFilters);

filterReset.addEventListener("click", () => {
  search.value = "";
  filterTag.value = "";
  sortKey.value = "date_added";
  sortDir.value = "desc";
  applyFilters();
});

fetch("library.json")
  .then(r => r.json())
  .then(data => {
    allBooks = data;
    populateFilterOptions();
    applyFilters();
  });
