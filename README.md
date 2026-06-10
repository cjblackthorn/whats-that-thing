# What's That Thing?

Initial MVP prototype for a local-only product, supply, replacement, and restock memory tool.

## What it does

- Tracks exact products and supplies across Pets, Household, Personal, and Plants.
- Adds new things with brand, flavor, size, model, usual store, backup store, check-stock date, and stock status.
- Shows due-soon stock checks and a shopping list.
- Opens item details with exact product notes, stores, stock, and shopping actions.
- Saves data in browser `localStorage`; there is no backend or account system.

## Run locally

Open `index.html` in a browser.

For a local static server:

```bash
npm run dev
```

Then open `http://localhost:4173`.

Without npm, run the same static server directly:

```bash
python3 -m http.server 4173 --bind 127.0.0.1
```

## Prototype scope

This is intentionally plain HTML, CSS, and JavaScript. The goal is to validate the core workflow for remembering the exact stuff someone buys, uses, replaces, refills, or restocks before choosing a framework, database, authentication, notifications, or sharing model.

Out of scope for this MVP: plant watering, pet feeding schedules, cleaning chores, plant care advice, household chore tracking, or recommendations about what care should be done.
