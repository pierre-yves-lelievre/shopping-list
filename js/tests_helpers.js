function assertEqual(actual, expected, message) {
  const pass = JSON.stringify(actual) === JSON.stringify(expected);
  if (!pass) {
    console.error("❌", message, "\n  expected:", expected, "\n  got     :", actual);
  } else {
    console.log("✅", message);
  }
}

function runHelperTests() {
  console.log("=== Running helper tests ===");

  // Example: addItemToList
  (function testAddItemNew() {
    const list = { items: [], spendingLimit: 0 };
    const item = GROCERY_ITEMS[0];
    addItemToList(list, GROCERY_ITEMS, item.id, 2, item.unitPrice, "Test desc");

    assertEqual(list.items.length, 1, "addItemToList adds a new item");
    assertEqual(list.items[0].quantity, 2, "quantity set correctly on new item");
  })();

  (function testAddItemExisting() {
    const list = { items: [], spendingLimit: 0 };
    const item = GROCERY_ITEMS[0];
    addItemToList(list, GROCERY_ITEMS, item.id, 1, item.unitPrice, "");
    addItemToList(list, GROCERY_ITEMS, item.id, 2, item.unitPrice, "");

    assertEqual(list.items.length, 1, "addItemToList merges same item");
    assertEqual(list.items[0].quantity, 3, "quantity incremented correctly");
  })();

  (function testMoveItemInList() {
    const list = {
      items: [
        { id: "a" },
        { id: "b" },
        { id: "c" }
      ],
      spendingLimit: 0
    };
    moveItemInList(list, 0, 2); // move "a" to the end
    assertEqual(
      list.items.map((i) => i.id),
      ["b", "c", "a"],
      "moveItemInList reorders items"
    );
  })();

  console.log("=== Helper tests finished ===");
}

// run automatically when loaded
document.addEventListener("DOMContentLoaded", runHelperTests);
