// 🔗 Your deployed Apps Script Web App URL
const API = "https://script.google.com/macros/s/AKfycbz-tVXWuB6IIOecXsj7J5gyLbFD_BZd7fWLCl6LMZE34f9mRo8Q22a_y7YrA8ewDyNcQQ/exec";

// 🔐 Shared secret API key (must match Apps Script)
const API_KEY = "MY_SUPER_SECRET_KEY_9834hf9834hf9834hf9834hf";

// State
let catalog = {};               // category → items[]
let selectedItems = new Set();  // ids of selected items

// Status helper
function setStatus(message, type = "info") {
  const el = document.getElementById("statusArea");
  el.textContent = message;
  el.style.color = type === "error" ? "#c0392b" : "#7b8194";
}

// Form helpers
function getClientEmail() {
  return document.getElementById("clientEmail").value.trim();
}

function getClientName() {
  return document.getElementById("clientName").value.trim();
}

function getClientNotes() {
  return document.getElementById("clientNotes").value.trim();
}

// Sync button with animation
const syncBtn = document.getElementById("syncBtn");

syncBtn.onclick = () => {
  setStatus("Syncing resources…");
  startSyncAnimation();

  fetch(API, {
    method: "POST",
    body: JSON.stringify({
      apiKey: API_KEY,
      action: "fullSync"
    })
  })
    .then(r => r.json())
    .then(data => {
      console.log("Sync complete:", data);
      stopSyncAnimation(true);
      loadCatalog();
    })
    .catch(err => {
      console.error(err);
      setStatus("Error syncing resources.", "error");
      stopSyncAnimation(false);
    });
};

function startSyncAnimation() {
  syncBtn.classList.add("btn-loading");
  syncBtn.classList.remove("btn-success");
  syncBtn.innerHTML = `<span>Syncing…</span>`;
}

function stopSyncAnimation(success) {
  syncBtn.classList.remove("btn-loading");
  if (success) {
    syncBtn.classList.add("btn-success");
    syncBtn.textContent = "✓ Synced";
    setTimeout(() => {
      syncBtn.classList.remove("btn-success");
      syncBtn.textContent = "⟳ Sync Resources";
    }, 2000);
  } else {
    syncBtn.textContent = "⟳ Sync Resources";
  }
}

// Load catalog (all categories + items)
function loadCatalog() {
  setStatus("Loading catalog…");

  fetch(API, {
    method: "POST",
    body: JSON.stringify({
      apiKey: API_KEY,
      action: "getCatalog"
    })
  })
    .then(r => r.json())
    .then(data => {
      console.log("Catalog:", data);
      catalog = data || {};
      selectedItems.clear();
      buildCategoryTree();
      setStatus("Catalog loaded.");
    })
    .catch(err => {
      console.error(err);
      setStatus("Error loading catalog.", "error");
    });
}

// Build category tree UI
function buildCategoryTree() {
  const container = document.getElementById("categoryList");
  container.innerHTML = "";

  Object.keys(catalog).forEach(categoryName => {
    const items = catalog[categoryName];

    const categoryEl = document.createElement("div");
    categoryEl.className = "category";

    const headerEl = document.createElement("div");
    headerEl.className = "category-header";

    const checkboxEl = document.createElement("input");
    checkboxEl.type = "checkbox";
    checkboxEl.className = "category-checkbox";

    const toggleEl = document.createElement("div");
    toggleEl.className = "category-toggle";

    const titleEl = document.createElement("div");
    titleEl.className = "category-title";
    titleEl.textContent = categoryName;

    const itemListEl = document.createElement("div");
    itemListEl.className = "item-list";

    // Build items
    items.forEach(res => {
      const rowEl = document.createElement("div");
      rowEl.className = "item-row";

      const itemCheckbox = document.createElement("input");
      itemCheckbox.type = "checkbox";

      const key = res.id;
      itemCheckbox.checked = selectedItems.has(key);

      itemCheckbox.onchange = () => {
        if (itemCheckbox.checked) {
          selectedItems.add(key);
        } else {
          selectedItems.delete(key);
        }
        updateCategoryCheckboxState(checkboxEl, items);
      };

      const itemTitle = document.createElement("div");
      itemTitle.className = "item-title";
      itemTitle.textContent = res.title;

      const itemMeta = document.createElement("div");
      itemMeta.className = "item-meta";
      itemMeta.textContent = `${res.type} · ${categoryName}`;

      rowEl.appendChild(itemCheckbox);
      rowEl.appendChild(itemTitle);
      rowEl.appendChild(itemMeta);

      itemListEl.appendChild(rowEl);
    });

    // Category checkbox behavior
    checkboxEl.onchange = () => {
      const checked = checkboxEl.checked;
      items.forEach(res => {
        const key = res.id;
        if (checked) {
          selectedItems.add(key);
        } else {
          selectedItems.delete(key);
        }
      });
      const itemCheckboxes = itemListEl.querySelectorAll("input[type='checkbox']");
      itemCheckboxes.forEach(cb => {
        cb.checked = checked;
      });
    };

    // Toggle dropdown
    headerEl.onclick = (e) => {
      if (e.target === checkboxEl) return;
      const isOpen = itemListEl.classList.toggle("open");
      toggleEl.classList.toggle("open", isOpen);
    };

    headerEl.appendChild(checkboxEl);
    headerEl.appendChild(toggleEl);
    headerEl.appendChild(titleEl);

    categoryEl.appendChild(headerEl);
    categoryEl.appendChild(itemListEl);

    container.appendChild(categoryEl);

    updateCategoryCheckboxState(checkboxEl, items);
  });
}

// Update category checkbox to reflect item selection
function updateCategoryCheckboxState(categoryCheckbox, items) {
  let selectedCount = 0;
  items.forEach(res => {
    if (selectedItems.has(res.id)) selectedCount++;
  });

  if (selectedCount === 0) {
    categoryCheckbox.indeterminate = false;
    categoryCheckbox.checked = false;
  } else if (selectedCount === items.length) {
    categoryCheckbox.indeterminate = false;
    categoryCheckbox.checked = true;
  } else {
    categoryCheckbox.indeterminate = true;
  }
}

// Helper: get selected resource objects
function getSelectedResources() {
  const selected = [];
  Object.keys(catalog).forEach(category => {
    catalog[category].forEach(res => {
      if (selectedItems.has(res.id)) {
        selected.push(res);
      }
    });
  });
  return selected;
}

// Generate PDF
document.getElementById("generatePdfBtn").onclick = () => {
  const resourcesArray = getSelectedResources();

  const clientEmail = getClientEmail();
  const clientName = getClientName();
  const clientNotes = getClientNotes();

  if (!clientName) return setStatus("Please enter the client's name.", "error");
  if (!clientEmail) return setStatus("Please enter the client's email.", "error");
  if (resourcesArray.length === 0) return setStatus("Please select at least one item.", "error");

  setStatus("Generating PDF…");

  fetch(API, {
    method: "POST",
    body: JSON.stringify({
      apiKey: API_KEY,
      action: "generatePdf",
      resources: resourcesArray,
      clientEmail,
      clientName,
      clientNotes
    })
  })
    .then(r => r.json())
    .then(data => {
      console.log("PDF generated:", data);
      if (data.error) {
        setStatus("Error generating PDF: " + data.error, "error");
      } else {
        setStatus("PDF generated successfully.");
      }
    })
    .catch(err => {
      console.error(err);
      setStatus("Error generating PDF.", "error");
    });
};

// Email PDF
document.getElementById("emailPdfBtn").onclick = () => {
  const resourcesArray = getSelectedResources();

  const clientEmail = getClientEmail();
  const clientName = getClientName();
  const clientNotes = getClientNotes();

  if (!clientName) return setStatus("Please enter the client's name.", "error");
  if (!clientEmail) return setStatus("Please enter the client's email.", "error");
  if (resourcesArray.length === 0) return setStatus("Please select at least one item.", "error");

  setStatus("Emailing PDF…");

  fetch(API, {
    method: "POST",
    body: JSON.stringify({
      apiKey: API_KEY,
      action: "emailPdf",
      resources: resourcesArray,
      clientEmail,
      clientName,
      clientNotes
    })
  })
    .then(r => r.json())
    .then(data => {
      console.log("PDF emailed:", data);
      if (data.error) {
        setStatus("Error emailing PDF: " + data.error, "error");
      } else {
        setStatus("PDF emailed to client.");
      }
    })
    .catch(err => {
      console.error(err);
      setStatus("Error emailing PDF.", "error");
    });
};

// Initial load
window.onload = () => {
  loadCatalog();
};
