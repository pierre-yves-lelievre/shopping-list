//Helpers

//List structure & storage

function getStorageKeyForUser(username) {
    return `shoppingList_${username}`;
}

function loadShoppingListForUser(username) {
    const storageKey = getStorageKeyForUser(username);

    const raw = localStorage.getItem(storageKey);

    let list = null;

    try {
        list = raw ? JSON.parse(raw) : null;
    } catch (e) {
        console.warn("Invalid stored data, resetting list for user", username);
        list = null;
    }

    if (!list) {
        // Initialise an empty list object
        list = {
            items: [],
            spendingLimit: 0
        };
        localStorage.setItem(storageKey, JSON.stringify(list));
    }



    const placeholder = document.getElementById("empty-list-placeholder");
    if (placeholder) {
        if (list.items.length === 0) {
            placeholder.textContent = `Your shopping list is empty, ${username}. Add your first item!`;
        } else {
            placeholder.textContent = `You have ${list.items.length} items in your shopping list, ${username}.`;
        }
    }

    currentList = list;
    syncSpendingLimitControls();
    renderShoppingList();

}

function saveCurrentList() {
    if (!currentUser || !currentList) return;
    const storageKey = getStorageKeyForUser(currentUser.username);
    localStorage.setItem(storageKey, JSON.stringify(currentList));
}


//List operations
function addItemToList(list, groceryItems, itemId, quantity, unitPrice, description) {
    if (!list || !Array.isArray(list.items)) {
        throw new Error("addItemToList: 'list' must have an items array");
    }

    const baseItem = groceryItems.find((item) => item.id === itemId);
    if (!baseItem) {
        throw new Error(`addItemToList: unknown item id ${itemId}`);
    }

    const qty = Number(quantity) || 0;
    const price = Number(unitPrice) || 0;

    if (qty <= 0 || price < 0) {
        // no-op for invalid values in the pure helper
        return;
    }

    const existing = list.items.find((it) => it.id === itemId);

    if (existing) {
        existing.quantity += qty;
        existing.unitPrice = price;
        if (description) {
            existing.description = description;
        }
    } else {
        list.items.push({
            id: itemId,
            name: baseItem.name,
            description: description || baseItem.description || "",
            quantity: qty,
            unitPrice: price,
            picked: false
        });
    }
}

function addItemToCurrentList(itemId, quantity, unitPrice, description) {
    if (!currentUser || !currentList) {
        alert("Please log in first.");
        return;
    }

    addItemToList(currentList, GROCERY_ITEMS, itemId, quantity, unitPrice, description);

    saveCurrentList();
    renderShoppingList();
}

function deleteItemFromCurrentList(itemId) {
    if (!currentList) return;
    currentList.items = currentList.items.filter((item) => item.id !== itemId);
    saveCurrentList();
    renderShoppingList();
}

function updateItemQuantity(itemId, newQty) {
    if (!currentList) return;
    const qty = Number(newQty);

    const item = currentList.items.find((it) => it.id === itemId);
    if (!item) return;

    if (qty <= 0) {
        // quantity 0 means remove from list
        deleteItemFromCurrentList(itemId);
        return;
    }

    item.quantity = qty;
    saveCurrentList();
    renderShoppingList();
}

function toggleItemPicked(itemId, picked) {
    if (!currentList) return;
    const item = currentList.items.find((it) => it.id === itemId);
    if (!item) return;

    item.picked = !!picked;
    saveCurrentList();
    renderShoppingList();
}

function moveItemInList(list, fromIndex, toIndex) {
  if (!list || !Array.isArray(list.items)) return;
  if (fromIndex === toIndex) return;

  const items = list.items;

  if (
    fromIndex < 0 || fromIndex >= items.length ||
    toIndex   < 0 || toIndex   >= items.length
  ) {
    return;
  }

  const [moved] = items.splice(fromIndex, 1);
  items.splice(toIndex, 0, moved);
}


function moveItemInCurrentList(fromIndex, toIndex) {
    if (!currentList || fromIndex === toIndex) return;

    moveItemInList(currentList, fromIndex, toIndex);

    saveCurrentList();
    renderShoppingList();
}

//Email / formatting

function buildEmailBodyFromCurrentList() {
    if (!currentList) return "";

    const lines = [];

    const userName = currentUser ? currentUser.username : "your account";
    lines.push(`Shopping list for ${userName}`);
    lines.push("------------------------------");
    lines.push("");

    if (!currentList.items.length) {
        lines.push("Your shopping list is currently empty.");
    } else {
        currentList.items.forEach((item) => {
            const status = item.picked ? "[x]" : "[ ]";
            const lineTotal = (item.quantity * item.unitPrice).toFixed(2);
            lines.push(
                `${status} ${item.name} x${item.quantity} - £${lineTotal}`
            );
            if (item.description) {
                lines.push(`    ${item.description}`);
            }
        });
    }

    lines.push("");
    const total = currentList.items.reduce(
        (sum, item) => sum + item.quantity * item.unitPrice,
        0
    );
    lines.push(`Total: £${total.toFixed(2)}`);

    const limit = currentList.spendingLimit || 0;
    if (limit > 0) {
        lines.push(`Spending limit: £${limit.toFixed(2)}`);
        if (total > limit) {
            lines.push("⚠ Over your spending limit!");
        }
    }

    lines.push("");
    lines.push("Sent from the Smart Shopping List demo.");

    return lines.join("\n");
}