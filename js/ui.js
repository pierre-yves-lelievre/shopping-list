//Rendering

function renderShoppingList() {
    const container = document.getElementById("shopping-list-container");
    if (!container) return;

    container.innerHTML = "";

    if (!currentList || currentList.items.length === 0) {
        const p = document.createElement("p");
        p.id = "empty-list-placeholder";
        p.textContent = currentUser ?
            `Your shopping list is empty, ${currentUser.username}. Add your first item!` :
            "Your shopping list is empty. Add your first item!";
        container.appendChild(p);
        updateTotalDisplay();
        return;
    }

    const ul = document.createElement("ul");
    ul.id = "shopping-list";
    ul.setAttribute("aria-label","Shopping items");

    currentList.items.forEach((item, index) => {
        const li = document.createElement("li");
        li.className = "shopping-item";
        li.dataset.itemId = item.id;
        li.dataset.index = index;
        li.draggable = true;

        const itemTotal = (item.quantity * item.unitPrice).toFixed(2);

        li.innerHTML = `
      <div class="item-main">
        <label>
          <input type="checkbox" name="item-picked-${item.id}"  class="item-picked" ${item.picked ? "checked" : ""} />
          <span class="item-name${item.picked ? " item-picked-label" : ""}">
            ${item.name}
          </span>
        </label>
        <div class="item-desc">${item.description || ""}</div>
      </div>
      <div class="item-controls${item.picked ? " item-controls-disabled" : ""}">
        <div class="item-qty-block">
          <label>
            Qty:
            <input
              type="number"
              name="item-qty-${item.id}" 
              class="item-qty"
              min="0"
              step="1"
              value="${item.quantity}"
            />
          </label>
        </div>
        <div class="item-price-block">
          £${item.unitPrice.toFixed(2)} each<br />
          <strong>£${itemTotal}</strong>
        </div>
        <button type="button" class="btn item-delete">🗑</button>
        
      </div>
      <div class="item-move-controls">
        <button type="button" class="item-move-up" aria-label="Move ${item.name} up">▲</button>
        <button type="button" class="item-move-down" aria-label="Move ${item.name} down">▼</button>
        </div>
    `;

        ul.appendChild(li);
    });

    container.appendChild(ul);
    updateTotalDisplay();
}

function updateTotalDisplay() {
    const totalEl = document.getElementById("shopping-total");
    const warningEl = document.getElementById("total-warning");
    const limitValue = document.getElementById("spending-limit-value");
    const totalWrapper = totalEl ? totalEl.closest(".total-display") : null;

    if (!totalEl) return;

    const total = currentList ?
        currentList.items.reduce(
            (sum, item) => sum + item.quantity * item.unitPrice,
            0
        ) :
        0;

    totalEl.textContent = total.toFixed(2);

    const limit = currentList ? currentList.spendingLimit || 20 : 20;

    if (limitValue) {
        limitValue.textContent = limit.toString();
    }

    if (!warningEl) return;

    if (limit > 0 && total > limit) {
        warningEl.textContent = " Over your spending limit!";
        if (totalWrapper) {
            totalWrapper.classList.add("over-limit");
        }
    } else {
        warningEl.textContent = "";
        if (totalWrapper) {
            totalWrapper.classList.remove("over-limit");
        }
    }
}

function syncSpendingLimitControls() {
    const limitRange = document.getElementById("spending-limit-range");
    const limitValue = document.getElementById("spending-limit-value");

    if (!limitRange || !limitValue) return;

    const limit = currentList ? currentList.spendingLimit || 20 : 20;

    limitRange.value = limit;
    limitValue.textContent = limit.toString();
}

function clearCurrentList() {
    if (!currentUser) return;

    const confirmClear = window.confirm(
          "Are you sure you want to clear your shopping list?"
    );
    if (!confirmClear) return;

    const storageKey = getStorageKeyForUser(currentUser.username);
    localStorage.removeItem(storageKey);

    currentList = {
        items: [],
        spendingLimit: 0
      };
    renderShoppingList();
  }

function populateItemSelect() {
    const select = document.getElementById("item-select");
    const priceInput = document.getElementById("item-price");
    const descPreview = document.getElementById("item-description");

    if (!select || !Array.isArray(GROCERY_ITEMS)) {
        console.warn("Item select or GROCERY_ITEMS not available yet");
        return;
    }

    // Clear existing options
    select.innerHTML = '<option value="">Select an item…</option>';

    GROCERY_ITEMS.forEach((item) => {
        const option = document.createElement("option");
        option.value = item.id;
        option.textContent = `${item.name} (£${item.unitPrice.toFixed(2)})`;
        option.dataset.price = item.unitPrice;
        option.dataset.description = item.description;
        select.appendChild(option);
    });

    // When user changes selected item, pre-fill price & description
    select.addEventListener("change", () => {
        const selected = select.options[select.selectedIndex];
        if (!selected || !selected.dataset.price) return;

        if (priceInput) {
            priceInput.value = Number(selected.dataset.price).toFixed(2);
        }
        if (descPreview) {
            descPreview.textContent = selected.dataset.description || "";
        }
    });
}

//Overlay / layout

function openAddItemOverlay() {
    const backdrop = document.getElementById("add-item-overlay-backdrop");
    const form = document.getElementById("add-item-form");
    const itemSelect = document.getElementById("item-select");

    lastFocusedElementBeforeOverlay = document.activeElement;

    if (form) {
        form.reset();
    }

    if (backdrop) {
        backdrop.style.display = "flex";
    }

    if (itemSelect) {
        itemSelect.focus();
    }
}

function isAddItemOverlayOpen() {
    const backdrop = document.getElementById("add-item-overlay-backdrop");
    return backdrop && backdrop.style.display === "flex";
}

function closeAddItemOverlay() {
    const backdrop = document.getElementById("add-item-overlay-backdrop");
    if (backdrop) {
        backdrop.style.display = "none";
    }
    if (lastFocusedElementBeforeOverlay && lastFocusedElementBeforeOverlay.focus) {
        lastFocusedElementBeforeOverlay.focus();
    }
}

// Event wiring

function initUI(handlers) {
  const loginForm       = document.getElementById("login-form");
  const addItemButton   = document.getElementById("add-item-button");
  const cancelAddButton = document.getElementById("cancel-add-item");
  const addItemForm     = document.getElementById("add-item-form");
  const clearListButton = document.getElementById("clear-list-button");
  const shareListButton = document.getElementById("share-list-button");
  const logoutButton    = document.getElementById("logout-button");
  const limitRange      = document.getElementById("spending-limit-range");
  const limitValue      = document.getElementById("spending-limit-value");
  const listContainer   = document.getElementById("shopping-list-container");
  const backdrop        = document.getElementById("add-item-overlay-backdrop");

  // --- Top-level forms/buttons ---

  if (loginForm && handlers.onLoginSubmit) {
    loginForm.addEventListener("submit", handlers.onLoginSubmit);
  }

  if (logoutButton && handlers.onLogout) {
    logoutButton.addEventListener("click", handlers.onLogout);
  }

  if (addItemButton && handlers.onAddItemClick) {
    addItemButton.addEventListener("click", handlers.onAddItemClick);
  }

  if (cancelAddButton) {
    cancelAddButton.addEventListener("click", closeAddItemOverlay);
  }

  if (addItemForm && handlers.onAddItemSubmit) {
    addItemForm.addEventListener("submit", handlers.onAddItemSubmit);
  }

  if (clearListButton && handlers.onClearList) {
    clearListButton.addEventListener("click", handlers.onClearList);
  }

  if (shareListButton && handlers.onShareList) {
    shareListButton.addEventListener("click", handlers.onShareList);
  }

  // --- Slider: live label on input, commit via handler on change ---

  if (limitRange) {
    // live update of the label only
    limitRange.addEventListener("input", (event) => {
      const value = Number(event.target.value) || 0;
      if (limitValue) {
        limitValue.textContent = value.toString();
      }
    });

    if (handlers.onSpendingLimitChange) {
      limitRange.addEventListener("change", (event) => {
        const value = Number(event.target.value) || 0;
        handlers.onSpendingLimitChange(value);
      });
    }
  }

  // --- List item events (delete / qty / picked / move up/down) ---

  if (listContainer) {
    listContainer.addEventListener("click", (event) => {
      const target = event.target;
      const li = target.closest(".shopping-item");
      if (!li) return;

      const index  = Number(li.dataset.index);
      const itemId = li.dataset.itemId;

      if (target.classList.contains("item-delete") && handlers.onItemDelete) {
        handlers.onItemDelete(itemId);
        return;
      }

      if (target.classList.contains("item-move-up") && handlers.onReorder) {
        handlers.onReorder(index, index - 1);
        return;
      }

      if (target.classList.contains("item-move-down") && handlers.onReorder) {
        handlers.onReorder(index, index + 1);
        return;
      }
    });

    listContainer.addEventListener("change", (event) => {
      const target = event.target;
      const li = target.closest(".shopping-item");
      if (!li) return;

      const itemId = li.dataset.itemId;

      if (target.classList.contains("item-qty") && handlers.onItemQtyChange) {
        handlers.onItemQtyChange(itemId, target.value);
      }

      if (target.classList.contains("item-picked") && handlers.onItemPickedToggle) {
        handlers.onItemPickedToggle(itemId, target.checked);
      }
    });

    // drag/touch based reorder
    initiateItemDragEvent(handlers);
  }

  // --- Close overlay on backdrop click ---

  if (backdrop) {
    backdrop.addEventListener("click", (event) => {
      if (event.target === backdrop) {
        closeAddItemOverlay();
      }
    });
  }

  // --- Close overlay on ESC ---

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" || event.key === "Esc") {
      if (isAddItemOverlayOpen()) {
        event.preventDefault();
        closeAddItemOverlay();
      }
    }
  });

  // Populate the select with the static list
  populateItemSelect();
}




function startReorderFromItem(li) {
    if (!li) return;
    reorderStartIndex = Number(li.dataset.index);
    li.classList.add("dragging");
}

function finishReorderAtPoint(x, y) {
    if (reorderStartIndex === null) return;

    const listContainer = document.getElementById("shopping-list-container");
    if (!listContainer) return;

    const dragging = listContainer.querySelector(".shopping-item.dragging");
    if (dragging) {
        dragging.classList.remove("dragging");
    }

    const targetElem = document.elementFromPoint(x, y);
    const targetLi = targetElem ? targetElem.closest(".shopping-item") : null;
    if (!targetLi) {
        reorderStartIndex = null;
        return;
    }

    const targetIndex = Number(targetLi.dataset.index);
    if (!Number.isNaN(targetIndex)) {
        moveItemInCurrentList(reorderStartIndex, targetIndex);
    }

    reorderStartIndex = null;
}


function initiateItemDragEvent() {
    const listContainer = document.getElementById("shopping-list-container");
    if (listContainer) {
        // DESKTOP DRAG & DROP
        listContainer.addEventListener("dragstart", (event) => {
            const li = event.target.closest(".shopping-item");
            if (!li) return;

            event.dataTransfer.effectAllowed = "move";
            event.dataTransfer.setData("text/plain", li.dataset.itemId);

            startReorderFromItem(li);
        });

        listContainer.addEventListener("dragend", () => {
            // If they cancel or drop outside, just reset visuals/state
            reorderStartIndex = null;
            const dragging = listContainer.querySelector(".shopping-item.dragging");
            if (dragging) {
                dragging.classList.remove("dragging");
            }
        });

        listContainer.addEventListener("dragover", (event) => {
            event.preventDefault(); // needed to allow drop
            event.dataTransfer.dropEffect = "move";
        });

        listContainer.addEventListener("drop", (event) => {
            event.preventDefault();
            finishReorderAtPoint(event.clientX, event.clientY);
        });

        // TOUCH REORDER (MOBILE) – reuse the *same* start/finish helpers
        listContainer.addEventListener("touchstart", (event) => {
            const li = event.target.closest(".shopping-item");
            if (!li) return;
            startReorderFromItem(li);
            // don't preventDefault here so scrolling still works
        });

        listContainer.addEventListener("touchend", (event) => {
            const touch = event.changedTouches[0];
            if (!touch) {
                reorderStartIndex = null;
                return;
            }
            finishReorderAtPoint(touch.clientX, touch.clientY);
        });

        listContainer.addEventListener("touchcancel", () => {
            reorderStartIndex = null;
            const dragging = listContainer.querySelector(".shopping-item.dragging");
            if (dragging) {
                dragging.classList.remove("dragging");
            }
        });
    }

}

