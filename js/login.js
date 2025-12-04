  // --- Simple in-memory "users" ---
  const USERS = [{
          username: "alice",
          password: "password1"
      },
      {
          username: "bob",
          password: "password2"
      }
  ];

  // active user in memory 
  let currentUser = null;
  // active user's shopping list in memory    
  let currentList = null;
  let reorderStartIndex = null;
  let lastFocusedElementBeforeOverlay = null;

  function findUser(username, password) {
      return USERS.find(
          (u) => u.username === username && u.password === password
      );
  }

  function restoreCurrentUser() {
      const currentUserLabel = document.getElementById("current-user-label");
      const loginStatus = document.getElementById("login-status");
      const storedUsername = localStorage.getItem("currentUserName");
      const shoppingSection = document.getElementById("shopping-section");
      const logoutButton = document.getElementById("logout-button");

      const restoredUser = storedUsername ?
          USERS.find((u) => u.username === storedUsername) :
          null;


      if (restoredUser) {
          // simulate "logged in"
          currentUser = restoredUser;

          document.body.classList.remove("logged-out");
          document.body.classList.add("logged-in");

          if (shoppingSection) {
              shoppingSection.style.display = "block";
          }

          if (loginStatus) {
              loginStatus.textContent = `Welcome back, ${restoredUser.username}`;
              loginStatus.style.color = "green";
          }
          if (logoutButton) {
              logoutButton.style.display = "inline-block";
          }

          loadShoppingListForUser(restoredUser.username);
      } else {
          // fall back to logged-out state
          document.body.classList.add("logged-out");
          document.body.classList.remove("logged-in");
          if (shoppingSection) {
              shoppingSection.style.display = "none";
          }
      }
  }

  function logout() {
      currentUser = null;
      currentList = null;
      localStorage.removeItem("currentUserName");

      document.body.classList.add("logged-out");
      document.body.classList.remove("logged-in");

      const shoppingSection = document.getElementById("shopping-section");
      const loginStatus = document.getElementById("login-status");
      const logoutButton = document.getElementById("logout-button");
      if (shoppingSection) {
          shoppingSection.style.display = "none";
      }

      if (loginStatus) {
          loginStatus.textContent = "";
      }
      if (logoutButton) {
          logoutButton.style.display = "none";
      }
  }

  document.addEventListener("DOMContentLoaded", () => {
      const shoppingSection = document.getElementById("shopping-section");

      // Ensure shopping section is hidden until login
      if (shoppingSection) {
          shoppingSection.style.display = "none";
      }

      initUI({
          onLoginSubmit: handleLoginSubmit,
          onLogout: logout,
          onAddItemClick: openAddItemOverlay,
          onAddItemSubmit: handleAddItemSubmit,
          onClearList: handleClearList,
          onShareList: handleShareList,
          onItemDelete: handleItemDelete,
          onItemQtyChange: handleItemQtyChange,
          onItemPickedToggle: handleItemPickedToggle,
          onReorder: handleReorder,
          onSpendingLimitChange: handleSpendingLimitChange
      });

      restoreCurrentUser();
  });

  function shareListByEmail() {
      if (!currentUser) {
          alert("Please log in before sharing your shopping list.");
          return;
      }

      if (!currentList || currentList.items.length === 0) {
          alert("Your shopping list is empty. Add some items before sharing.");
          return;
      }

      const subject = `Shopping list for ${currentUser.username}`;
      const body = buildEmailBodyFromCurrentList();

      const mailtoLink = `mailto:?subject=${encodeURIComponent(
    subject
  )}&body=${encodeURIComponent(body)}`;

      // Trigger the user's email client
      window.location.href = mailtoLink;
  }

  //Handlers
  function handleLoginSubmit(event) {
      event.preventDefault();

      const usernameInput = document.getElementById("username");
      const passwordInput = document.getElementById("password");
      const loginError = document.getElementById("login-error");
      const status = document.getElementById("login-status");
      const shoppingSection = document.getElementById("shopping-section");
      const currentUserLabel = document.getElementById("current-user-label");
      const logoutButton = document.getElementById("logout-button");

      loginError.textContent = "";

      const username = usernameInput.value.trim();
      const password = passwordInput.value;

      const user = findUser(username, password);

      if (!user) {
          loginError.textContent = "Invalid username or password.";
          loginError.style.color = "red";
          return;
      }

      currentUser = user;
      status.textContent = `Logged in as ${user.username}`;
      status.style.color = "green";


      if (logoutButton) {
          logoutButton.style.display = "inline-block";
      }

      // persist logged-in user for next visit (demo only)
      localStorage.setItem("currentUserName", user.username);
      // --- toggle body classes ---
      document.body.classList.remove("logged-out");
      document.body.classList.add("logged-in");

      // Show shopping section once logged in
      if (shoppingSection) {
          shoppingSection.style.display = "block";
      }


      // Load that user's shopping list from localStorage
      loadShoppingListForUser(user.username);
  }

  function handleAddItemSubmit(event) {
      event.preventDefault();

      const select = document.getElementById("item-select");
      const qtyInput = document.getElementById("item-quantity");
      const priceInput = document.getElementById("item-price");
      const descPreview = document.getElementById("item-description");

      const itemId = select ? select.value : "";
      const quantity = qtyInput ? qtyInput.value : "1";
      const unitPrice = priceInput ? priceInput.value : "0";
      const description = descPreview ? descPreview.textContent.trim() : "";

      if (!itemId) {
          alert("Please select an item.");
          return;
      }

      addItemToCurrentList(itemId, quantity, unitPrice, description);

      // Close overlay after adding
      closeAddItemOverlay();
  }


  function handleClearList() {
      clearCurrentList();
  }

  function handleShareList() {
      shareListByEmail();
  }

  function handleItemDelete(itemId) {
      deleteItemFromCurrentList(itemId);
  }

  function handleItemQtyChange(itemId, newQty) {
      updateItemQuantity(itemId, newQty);
  }

  function handleItemPickedToggle(itemId, picked) {
      toggleItemPicked(itemId, picked);
  }

  function handleReorder(fromIndex, toIndex) {
      moveItemInCurrentList(fromIndex, toIndex);
  }

  function handleSpendingLimitChange(newLimit) {
      if (!currentList) return;
      currentList.spendingLimit = newLimit;
      saveCurrentList();
      updateTotalDisplay();
  }