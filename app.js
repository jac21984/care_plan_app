// 🔗 Your deployed Apps Script Web App URL
const API = "https://script.google.com/macros/s/AKfycbxcCW6oGiB0Rp4L6LP2YCDWlWxc72chsrjtkCrq52WPzpYIYLuTqT47vdG1hUQ8CwDszA/exec";

// 🔐 Shared secret API key (must match Apps Script)
const API_KEY = "MY_ULTRA_SECRET_KEY_92jf02jf02jf02jf02jf02jf02j"; // <-- use your real key

// State
let catalog = [];               // full list of resources from backend
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
      setStatus("Resources synced successfully.");
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

// Load catalog (all resources) and build category tree
function loadCatalog() {
  setStatus("Loading catalog…");

  fetch(API, {
    method: "POST",
    body: JSON.stringify({
      apiKey: API_KEY,
      action: "getResources",
      topics: [] // empty = all resources
    })
  })
    .then(r => r.json())
    .then(resources => {
      catalog = resources || [];
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

  // Group by topic (acts as category for now)
  const categoriesMap = new Map();

  catalog.forEach(res => {
    const topic = res.topic || "Uncategorized";
    if (!categoriesMap.has(topic)) {
      categoriesMap.set(topic, []);
    }
    categoriesMap.get(topic).push(res);
  });

  categoriesMap.forEach((items, categoryName) => {
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

      const key = res.id || res.title;
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
      itemTitle.textContent = res.title || "Untitled";

      const itemMeta = document.createElement("div");
      itemMeta.className = "item-meta";
      itemMeta.textContent = `${res.type || "Unknown"} · ${categoryName}`;

      rowEl.appendChild(itemCheckbox);
      rowEl.appendChild(itemTitle);
      rowEl.appendChild(itemMeta);

      itemListEl.appendChild(rowEl);
    });

    // Category checkbox behavior
    checkboxEl.onchange = () => {
      const checked = checkboxEl.checked;
      items.forEach(res => {
        const key = res.id || res.title;
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
    const key = res.id || res.title;
    if (selectedItems.has(key)) selectedCount++;
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
  catalog.forEach(res => {
    const key = res.id || res.title;
    if (selectedItems.has(key)) {
      selected.push(res);
    }
  });
  return selected;
}

// Generate PDF
document.getElementById("generatePdfBtn").onclick = () => {
  const resourcesArray = getSelectedResources();

  const clientEmail = getClientEmail();
  const clientName = getClientName();
  const clientNotes = getClientNotes();

  if (!clientName) {
    setStatus("Please enter the client's name.", "error");
    return;
  }

  if (!clientEmail) {
    setStatus("Please enter the client's email.", "error");
    return;
  }

  if (resourcesArray.length === 0) {
    setStatus("Please select at least one item.", "error");
    return;
  }

  const topicsArray = Array.from(
    new Set(resourcesArray.map(r => r.topic || "Uncategorized"))
  );

  setStatus("Generating PDF…");

  fetch(API, {
    method: "POST",
    body: JSON.stringify({
      apiKey: API_KEY,
      action: "generatePdf",
      topics: topicsArray,
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

  if (!clientName) {
    setStatus("Please enter the client's name.", "error");
    return;
  }

  if (!clientEmail) {
    setStatus("Please enter the client's email.", "error");
    return;
  }

  if (resourcesArray.length === 0) {
    setStatus("Please select at least one item.", "error");
    return;
  }

  const topicsArray = Array.from(
    new Set(resourcesArray.map(r => r.topic || "Uncategorized"))
  );

  setStatus("Emailing PDF…");

  fetch(API, {
    method: "POST",
    body: JSON.stringify({
      apiKey: API_KEY,
      action: "emailPdf",
      topics: topicsArray,
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
