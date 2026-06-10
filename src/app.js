const STORAGE_KEY = "whats-that-thing.mvp.products-v2";

const seedThings = [
  {
    id: "cat-food-moon",
    name: "Moon's cat food",
    category: "Pets",
    location: "Chewy; backup at Petco",
    notes: "Tiki Cat After Dark Chicken & Quail Egg, 5.5 oz cans. Moon rejects the pate version, so keep the exact variety on the label.",
    reminderDate: "2026-06-14",
    supply: "Tiki Cat After Dark Chicken & Quail Egg 5.5 oz cans",
    stockStatus: "low",
    shopping: true
  },
  {
    id: "furnace-filter",
    name: "Furnace air filter",
    category: "Household",
    location: "Hardware aisle; backup at Target",
    notes: "Filtrete 20x25x1 MPR 1000. Keep one spare in the garage because the size is easy to misremember.",
    reminderDate: "2026-07-01",
    supply: "Filtrete 20x25x1 MPR 1000",
    stockStatus: "out",
    shopping: true
  },
  {
    id: "deodorant",
    name: "Everyday deodorant",
    category: "Personal",
    location: "Target; backup at CVS",
    notes: "Dove Men+Care Clean Comfort, 2.7 oz stick. Avoid the spray and the extra-fresh scent.",
    reminderDate: "2026-08-20",
    supply: "Dove Men+Care Clean Comfort 2.7 oz",
    stockStatus: "ok",
    shopping: false
  },
  {
    id: "plant-food",
    name: "Plant food",
    category: "Plants",
    location: "Local nursery; backup online",
    notes: "Dyna-Gro Foliage-Pro 9-3-6, 8 oz bottle. Track the exact bottle so the replacement is the same formula.",
    reminderDate: "2026-06-11",
    supply: "Dyna-Gro Foliage-Pro 9-3-6 8 oz",
    stockStatus: "low",
    shopping: true
  },
  {
    id: "fridge-filter",
    name: "Fridge water filter",
    category: "Household",
    location: "Appliance store; backup online",
    notes: "Whirlpool EveryDrop Filter 4, model EDR4RXD1. Keep the model number here because the packaging looks almost identical to Filter 1.",
    reminderDate: "2026-06-25",
    supply: "EveryDrop Filter 4 EDR4RXD1",
    stockStatus: "low",
    shopping: true
  }
];

let things = loadThings();
let activeView = "all";
let selectedId = things[0]?.id || null;

const els = {
  addPanel: document.querySelector("#add-panel"),
  closeAdd: document.querySelector("[data-close-add]"),
  detailContent: document.querySelector("#detail-content"),
  detailEmpty: document.querySelector("#detail-empty"),
  dueCount: document.querySelector("#due-count"),
  emptyState: document.querySelector("#empty-state"),
  form: document.querySelector("#thing-form"),
  list: document.querySelector("#thing-list"),
  navItems: document.querySelectorAll(".nav-item"),
  openAdd: document.querySelector("[data-open-add]"),
  search: document.querySelector("#search-input"),
  totalCount: document.querySelector("#total-count"),
  viewKicker: document.querySelector("#view-kicker"),
  viewTitle: document.querySelector("#view-title")
};

els.openAdd.addEventListener("click", () => {
  els.addPanel.hidden = false;
  els.form.elements.name.focus();
});

els.closeAdd.addEventListener("click", () => {
  els.addPanel.hidden = true;
  els.form.reset();
});

els.form.addEventListener("submit", (event) => {
  event.preventDefault();
  const form = new FormData(els.form);
  const thing = {
    id: crypto.randomUUID(),
    name: form.get("name").trim(),
    category: form.get("category"),
    location: form.get("location").trim() || "Not set",
    notes: form.get("notes").trim() || "No notes yet.",
    reminderDate: form.get("reminderDate"),
    supply: form.get("supply").trim(),
    stockStatus: form.get("stockStatus"),
    shopping: ["low", "out"].includes(form.get("stockStatus"))
  };

  things = [thing, ...things];
  selectedId = thing.id;
  activeView = thing.category;
  els.addPanel.hidden = true;
  els.form.reset();
  saveThings();
  render();
});

els.search.addEventListener("input", render);

els.navItems.forEach((item) => {
  item.addEventListener("click", () => {
    activeView = item.dataset.view;
    render();
  });
});

els.list.addEventListener("click", (event) => {
  const card = event.target.closest("[data-id]");
  if (!card) return;
  selectedId = card.dataset.id;
  renderDetails();
  renderCards();
});

els.detailContent.addEventListener("click", (event) => {
  const button = event.target.closest("button[data-action]");
  if (!button) return;

  const thing = things.find((item) => item.id === selectedId);
  if (!thing) return;

  if (button.dataset.action === "toggle-shopping") {
    thing.shopping = !thing.shopping;
  }

  if (button.dataset.action === "mark-stocked") {
    thing.stockStatus = "ok";
    thing.shopping = false;
  }

  saveThings();
  render();
});

render();

function loadThings() {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) return seedThings;

  try {
    const parsed = JSON.parse(stored);
    return Array.isArray(parsed) && parsed.length ? parsed : seedThings;
  } catch {
    return seedThings;
  }
}

function saveThings() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(things));
}

function render() {
  renderNavigation();
  renderHeader();
  renderSummary();
  renderCards();
  renderDetails();
}

function renderNavigation() {
  els.navItems.forEach((item) => {
    item.classList.toggle("is-active", item.dataset.view === activeView);
  });
}

function renderHeader() {
  const titles = {
    all: ["All Things", "Exact products and replacements"],
    Pets: ["Pets", "Food, litter, substrate, filters, and pet supplies"],
    Household: ["Household", "Filters, bulbs, parts, and replacement supplies"],
    Personal: ["Personal", "Toiletries, staples, and exact personal products"],
    Plants: ["Plants", "Plant food, soil, pots, lights, and plant supplies"],
    reminders: ["Reminders", "Stock checks and replacement checks due soon"],
    shopping: ["Shopping List", "Products and supplies to buy or refill"]
  };
  const [kicker, title] = titles[activeView];
  els.viewKicker.textContent = kicker;
  els.viewTitle.textContent = title;
}

function renderSummary() {
  els.totalCount.textContent = things.length;
  els.dueCount.textContent = things.filter(isDueSoon).length;
}

function renderCards() {
  const filtered = getFilteredThings();
  els.list.className = activeView === "shopping" ? "shopping-list" : "thing-list";
  els.list.innerHTML = filtered.map((thing) => {
    if (activeView === "shopping") return shoppingTemplate(thing);
    return cardTemplate(thing);
  }).join("");

  els.emptyState.hidden = filtered.length > 0;
}

function renderDetails() {
  const thing = things.find((item) => item.id === selectedId);
  els.detailEmpty.hidden = Boolean(thing);
  els.detailContent.hidden = !thing;
  if (!thing) return;

  const reminder = thing.reminderDate ? formatDate(thing.reminderDate) : "No check date";
  const shoppingLabel = thing.shopping ? "Remove from list" : "Add to list";

  els.detailContent.innerHTML = `
    <div class="detail-stack">
      <div>
        <p class="eyebrow">${escapeHtml(thing.category)} Details</p>
        <h3>${escapeHtml(thing.name)}</h3>
      </div>
      <p>${escapeHtml(thing.notes)}</p>
      <div class="detail-meta">
        <div><small>Store/location</small>${escapeHtml(thing.location || "Not set")}</div>
        <div><small>Check-stock date</small>${reminder}</div>
        <div><small>Exact product</small>${escapeHtml(thing.supply || "None")}</div>
        <div><small>Stock</small>${stockLabel(thing.stockStatus)}</div>
      </div>
      <div class="detail-actions">
        <button class="ghost-action" type="button" data-action="toggle-shopping">${shoppingLabel}</button>
        <button class="primary-action" type="button" data-action="mark-stocked">Mark Stocked</button>
      </div>
    </div>
  `;
}

function getFilteredThings() {
  const query = els.search.value.trim().toLowerCase();

  return things
    .filter((thing) => {
      if (activeView === "all") return true;
      if (activeView === "reminders") return isDueSoon(thing);
      if (activeView === "shopping") return thing.shopping || ["low", "out"].includes(thing.stockStatus);
      return thing.category === activeView;
    })
    .filter((thing) => {
      if (!query) return true;
      return [thing.name, thing.category, thing.location, thing.notes, thing.supply]
        .filter(Boolean)
        .some((value) => value.toLowerCase().includes(query));
    })
    .sort((a, b) => reminderSort(a.reminderDate, b.reminderDate));
}

function cardTemplate(thing) {
  return `
    <button class="thing-card ${thing.id === selectedId ? "is-selected" : ""}" type="button" data-id="${thing.id}">
      <div class="thing-card-header">
        <h3>${escapeHtml(thing.name)}</h3>
        <span class="category-pill">${escapeHtml(thing.category)}</span>
      </div>
      <p>${escapeHtml(thing.notes)}</p>
      <div class="meta-row">
        <span>${escapeHtml(thing.location || "No location")}</span>
        <span class="status-pill ${statusClass(thing)}">${statusText(thing)}</span>
      </div>
    </button>
  `;
}

function shoppingTemplate(thing) {
  return `
    <button class="shopping-item" type="button" data-id="${thing.id}">
      <span>
        <strong>${escapeHtml(thing.supply || thing.name)}</strong><br>
        <small>${escapeHtml(thing.name)} - ${stockLabel(thing.stockStatus)}</small>
      </span>
      <span class="status-pill ${statusClass(thing)}">${statusText(thing)}</span>
    </button>
  `;
}

function isDueSoon(thing) {
  if (!thing.reminderDate) return false;
  const today = startOfDay(new Date());
  const due = startOfDay(new Date(`${thing.reminderDate}T00:00:00`));
  const days = Math.ceil((due - today) / 86400000);
  return days <= 14;
}

function reminderSort(a, b) {
  if (!a && !b) return 0;
  if (!a) return 1;
  if (!b) return -1;
  return new Date(a) - new Date(b);
}

function startOfDay(date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function formatDate(value) {
  return new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric", year: "numeric" })
    .format(new Date(`${value}T00:00:00`));
}

function statusText(thing) {
  if (isDueSoon(thing)) return "Check stock";
  return stockLabel(thing.stockStatus);
}

function stockLabel(status) {
  return {
    ok: "In stock",
    low: "Running low",
    out: "Out"
  }[status] || "Not set";
}

function statusClass(thing) {
  if (isDueSoon(thing)) return "due";
  return thing.stockStatus || "ok";
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
