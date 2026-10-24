"use strict";

const assert = require("node:assert/strict");
const { test } = require("node:test");
const { readFileSync } = require("node:fs");
const { join } = require("node:path");
const vm = require("node:vm");

const ROOT = join(__dirname, "..");
const source = readFileSync(join(ROOT, "src/app.js"), "utf8");

function mount(stored, { storageBlocked = false } = {}) {
  const els = new Map();
  const makeEl = () => ({
    hidden: false,
    textContent: "",
    innerHTML: "",
    className: "",
    value: "",
    dataset: {},
    classList: { toggle() {} },
    addEventListener() {},
    reset() {},
    elements: { name: { focus() {} } }
  });
  const selectors = [
    "#add-panel", "[data-close-add]", "#detail-content",
    "#detail-empty", "#due-count", "#empty-state",
    "#thing-form", "#thing-list", "[data-open-add]",
    "#search-input", "#total-count", "#view-kicker", "#view-title"
  ];
  for (const selector of selectors) els.set(selector, makeEl());
  const navItems = [{ dataset: { view: "all" }, classList: { toggle() {} }, addEventListener() {} }];
  const storage = {
    getItem() {
      if (storageBlocked) throw new Error("storage denied");
      return stored;
    },
    setItem() {}
  };
  const sandbox = {
    document: {
      querySelector(selector) { return els.get(selector); },
      querySelectorAll(selector) {
        assert.equal(selector, ".nav-item");
        return navItems;
      }
    },
    localStorage: storage,
    crypto: { randomUUID() { return "generated-uuid"; } },
    console
  };
  vm.runInNewContext(source + "\n;globalThis.__state = {items: things, activeView, selectedId};", sandbox);
  return { state: sandbox.__state, els };
}

function savedThing(overrides = {}) {
  return {
    id: "valid-item",
    name: "A saved item",
    category: "Household",
    location: "Local store",
    notes: "Ordinary item",
    reminderDate: "2026-11-01",
    supply: "One unit",
    stockStatus: "ok",
    shopping: false,
    ...overrides
  };
}

test("first launch loads seed inventory", () => {
  const { state, els } = mount(null);
  assert.equal(state.items.length, 5);
  assert.equal(els.get("#total-count").textContent, 5);
});

test("an intentionally empty saved inventory remains empty", () => {
  const { state, els } = mount("[]");
  assert.equal(state.items.length, 0);
  assert.equal(state.selectedId, null);
  assert.equal(els.get("#empty-state").hidden, false);
});

test("corrupted JSON and denied storage do not crash startup", () => {
  assert.equal(mount("{broken").state.items.length, 5);
  assert.equal(mount(null, { storageBlocked: true }).state.items.length, 5);
});

test("invalid persisted entries cannot break rendering or inject card attributes", () => {
  const malicious = savedThing({ id: 'x" onmouseover="alert(1)' });
  const good = savedThing({ id: "safe_123", notes: '<img src=x onerror="alert(1)">' });
  const { state, els } = mount(JSON.stringify([malicious, good, null, 123]));
  assert.equal(state.items.length, 1);
  assert.equal(state.items[0].id, "safe_123");
  const html = els.get("#thing-list").innerHTML;
  assert.match(html, /data-id="safe_123"/);
  assert.match(html, /&lt;img src=x onerror=&quot;alert\(1\)&quot;&gt;/);
  assert.doesNotMatch(html, /<img src=x onerror/);
});

test("valid date, status and category survive storage validation", () => {
  const { state } = mount(JSON.stringify([savedThing()]));
  assert.equal(state.items.length, 1);
  assert.equal(state.items[0].reminderDate, "2026-11-01");
});

test("source provides accessible skip navigation and motion controls", () => {
  const html = readFileSync(join(ROOT, "index.html"), "utf8");
  const css = readFileSync(join(ROOT, "src/styles.css"), "utf8");
  assert.match(html, /class="skip-link" href="#main-content"/);
  assert.match(html, /<main class="workspace" id="main-content" tabindex="-1">/);
  assert.match(css, /:focus-visible/);
  assert.match(css, /prefers-reduced-motion:\s*reduce/);
});
