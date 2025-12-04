# Shopping List (Mayden Coding Challenge)

A small, mobile-friendly supermarket shopping list app built with **HTML**, **CSS**, and **vanilla JavaScript**.

The goal was to implement a simple but realistic shopping list with login, persistence, totals, a spending limit, reordering, and some basic accessibility considerations — all within the constraints of a short coding exercise.

---

## How to run

No build step, no dependencies.

You have two options:

### Option 1 – Open the file directly

1. Clone or download this repository.
2. Open `shopping_list.html` directly in your browser (e.g. double-click it in Finder / Explorer).

### Option 2 – Use a simple local web server (recommended)

1. From the project root, start a simple HTTP server (example with Python 3):

   ```bash
   python -m http.server 8000

    Open in your browser:

    http://localhost:8000/shopping_list.html

Tested mainly in Chrome on desktop and mobile viewport.

---

## Features

### Login & Per-user Lists

* Very simple, **in-memory demo login** with two users:

  * `alice` / `password1`
  * `bob` / `password2`

* After login:

  * The current user is stored in `localStorage` as `currentUserName`.
  * A **separate shopping list is persisted per user**, so Alice and Bob each have their own list.

> ⚠️ This is deliberately *not* production-grade authentication. Passwords are hardcoded and visible in the source. In a real application this would be server-side auth with hashed passwords.

---

### Shopping List

Each item in the list shows:

* **Name**
* **Description**
* **Quantity** (editable numeric input)
* **Unit price**
* **Item total** (`quantity × unit price`)
* **Actions**:

  * 🗑 Delete button
  * ✅ “Picked” checkbox

Core behaviours:

* **Add item** via an overlay:

  * User selects a grocery item from a predefined list.
  * Quantity and unit price can be set.
  * Description is shown read-only from the predefined item.
* If the user adds an item that **already exists** in the list:

  * The quantity is **incremented**, rather than adding a duplicate row.
* If the user changes quantity to **0**, the item is **removed** from the list.
* When an item is **marked as picked**:

  * It is visually styled as picked.
  * **Quantity and delete controls are disabled** to avoid accidental changes.

All changes update the **running total** automatically.

---

### Reordering Items

Reordering is supported in two ways:

1. **Drag-and-drop** (desktop + touch):

   * Items can be dragged to a new position using the standard HTML5 drag API.
   * On touch devices, pressing and releasing on an item will move it based on where the finger is released.
2. **Single-click reordering (accessibility)**:

   * Each item has **“Move up”** (▲) and **“Move down”** (▼) buttons.
   * This provides a non-drag, single-pointer method to reorder items.
   * Works with mouse, touch, and keyboard (Tab to the button + Enter/Space).

This addresses **WCAG 2.2 – 2.5.7 Dragging Movements** by ensuring drag operations are not the *only* way to reorder.

---

### Persistence (Local Storage)

For the purposes of this exercise, persistence is fully client-side:

* **Per-user shopping lists** are stored in `localStorage` under a key derived from the username.
* On reload:

  * The previously logged-in user is restored (if any).
  * Their last shopping list is reloaded.

> In a production system, I would replace this with a proper backend (e.g. REST API + database such as MySQL/DynamoDB, or Redis for quick access), and real authentication/authorisation.

---

### Spending Limit Slider

* A **spending limit** can be set via a slider under the list.
* The current limit value is shown next to the slider.
* If the **total exceeds the limit**:

  * A warning message appears.
  * The total line is visually highlighted (e.g. with a warning color).

Default behaviour:

* If no list or limit is defined, the slider defaults to **£20**.
* The limit is persisted with the user’s shopping list.

---

### Share by Email

* A **“Share list”** button creates a `mailto:` link using the current shopping list.
* The email body includes:

  * Each item, quantity, and total
  * Overall total
* This launches the user’s default email client to send the list.

For the challenge, this is implemented using a simple client-side `mailto:` link.
With more time and a backend, this could be extended to send structured HTML emails or integrate an email service.

---

## Data Model

A small static list of ~20 popular UK grocery items is defined in `shopping_list_items.js`, each with:

* `id` (UUID string)
* `name`
* `description`
* `unitPrice` (in £)

This keeps the UI simple: users pick from a known set of items instead of typing names/descriptions.

---

## Architecture

The JavaScript is split into three main modules:

### `shopping_list_items.js`

* Contains the **static grocery catalog** (`GROCERY_ITEMS`).
* No DOM logic, just data.

### `shopping_list_helpers.js`

Contains **pure logic** for working with shopping lists, independent of the DOM:

* `addItemToList(list, groceryItems, itemId, quantity, unitPrice, description)`
* `moveItemInList(list, fromIndex, toIndex)`
* `buildEmailBodyFromCurrentList()`
* plus small helpers.

App-level helpers that work with the current user/list simply **delegate to these pure functions** and then handle save + re-render:

* `addItemToCurrentList(...)`
* `moveItemInCurrentList(fromIndex, toIndex)`
* `deleteItemFromCurrentList(itemId)`
* `updateItemQuantity(itemId, newQty)`
* `toggleItemPicked(itemId, picked)`

### `ui.js`

Handles **DOM rendering and event wiring**:

* `renderShoppingList()` – builds the DOM for the list based on `currentList`.
* `updateTotalDisplay()` – updates total, warning, and spending limit display.
* `syncSpendingLimitControls()` – syncs slider and label from the current list.
* `populateItemSelect()` – fills the “Add item” overlay select with `GROCERY_ITEMS`.

* Overlay controls:

  * `openAddItemOverlay()`
  * `closeAddItemOverlay()`
  * `isAddItemOverlayOpen()`
  
* Reorder behaviour:

  * `startReorderFromItem`, `finishReorderAtPoint`, `initiateItemDragEvent`

* Event wiring:
    * initUI(handlers):
        * Wires all DOM events (login, logout, add item, clear list, share, item actions, slider, overlay events) to handler callbacks provided by login.js.

### `login.js`

Acts as the **application “brain”**:

* Holds global state:

  * `currentUser`
  * `currentList`
  * `reorderStartIndex`
  
* Simple in-memory users (`alice` / `bob`).
* Login + restore flow:

  * `findUser(username, password)`
  * `handleLoginSubmit(event)`
  * `restoreCurrentUser()`
  * `logout()`
  
* Event handlers passed into `initUI`:

  * `handleAddItemSubmit(event)`
  * `handleClearList()`
  * `handleShareList()`
  * `handleItemDelete(itemId)`
  * `handleItemQtyChange(itemId, newQty)`
  * `handleItemPickedToggle(itemId, picked)`
  * `handleReorder(fromIndex, toIndex)`
  * `handleSpendingLimitChange(newLimit)`

`login.js` coordinates between:

* **Helpers** (pure logic)
* **UI** (DOM rendering)
* **Storage** (localStorage)

---

## Accessibility

A few specific things were done to improve accessibility:

* All form inputs have **associated `<label>`s** (login, add item, quantity, slider).
* The "Add item" overlay:

  * Uses `role="dialog"` and `aria-modal="true"`.
  * Moves focus into the dialog when opened.
  * Restores focus to the triggering element when closed.
  * Can be closed via **Esc** key or backdrop click.
* Status messages (e.g. login status) are announced with `aria-live="polite"`.
* Reordering:

  * Not only drag-and-drop; **move up/down buttons** provide a keyboard- and single-click-friendly alternative to satisfy WCAG 2.5.7.
* The UI is designed to be **mobile-friendly**, with larger touch targets for key actions (pick checkbox, delete, reordering buttons).

With more time, I’d extend this with full focus trapping in the dialog and additional keyboard shortcuts for reordering.

---

## Tests

There is a small browser-based test harness in:

* `js/tests_helpers.js`

It exercises the **pure helper functions** only:

* Adding new items and merging existing items (`addItemToList`)
* Reordering items (`moveItemInList`)

To run them:

* Include `tests_helpers.js` after the helpers and items scripts on the page, then
* Open the page and check the **browser console** – you’ll see ✅ / ❌ for each test.

This keeps the logic testable without introducing a full test framework for such a small project.

---

## Security Notes / Production Considerations

For this exercise:

* Users and passwords are **hardcoded** in the front-end.
* Data is stored in `localStorage` and is not encrypted.
* There is no backend — all logic runs in the browser.

In a real application, I would:

* Implement proper authentication (e.g. OAuth / Cognito / custom backend).
* Store hashed passwords server-side.
* Persist shopping lists in a database (e.g. MySQL, PostgreSQL, DynamoDB) or cache layer (Redis).
* Add server-side validation and filtering, and ensure all user-entered content is safely rendered.

---

## If I had more time…

Given more time, I would:

* Add a real backend API with authentication and server-side storage.
* Implement a proper test suite (e.g. Jest) for both helpers and UI behaviour.
* Extend accessibility further (focus trapping in dialogs, more ARIA roles, better keyboard shortcuts).
* Improve styling and theming, and add more feedback (e.g. inline validation messages).
* Allow users to create custom items (free-text name/description) and store them safely.