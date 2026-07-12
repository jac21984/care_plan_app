// 🔗 Your deployed Apps Script Web App URL
const API = "https://script.google.com/macros/s/AKfycbwMGzHuzxf81qsGb0AOLPaPny6gw85lBRL8DDFvUbQypTan0LGBqa73xhqALt2-CvOInQ/exec";

// 🔐 Shared secret API key (must match Apps Script)
const API_KEY = "MY_SUPER_SECRET_KEY_9834hf9834hf9834hf9834hf";

// State
let selectedTopics = new Set();
let selectedResources = new Set();

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

// Sync button
document.getElementById("syncBtn").onclick = () => {
  setStatus("Syncing resources…");

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
      loadTopics();
    })
    .catch(err => {
      console.error(err);
      setStatus("Error syncing resources.", "error");
    });
};

// Load topics
function loadTopics() {
  setStatus("Loading topics…");

  fetch(API, {
    method: "POST",
    body: JSON.stringify({
      apiKey: API_KEY,
      action: "getTopics"
    })
  })
    .then(r => r.json())
    .then(topics => {
      const container = document.getElementById("topicList");
      container.innerHTML = "";
      selectedTopics.clear();

      topics.forEach(topic => {
        const chip = document.createElement("div");
        chip.className = "chip";
        chip.textContent = topic;

        chip.onclick = () => {
          if (selectedTopics.has(topic)) {
            selectedTopics.delete(topic);
            chip.classList.remove("selected");
          } else {
            selectedTopics.add(topic);
            chip.classList.add("selected");
          }
          loadResources();
        };

        container.appendChild(chip);
      });

      setStatus("Topics loaded.");
    })
    .catch(err => {
      console.error(err);
      setStatus("Error loading topics.", "error");
    });
}

// Load resources
function loadResources() {
  const topicsArray = Array.from(selectedTopics);
  setStatus("Loading resources…");

  fetch(API, {
    method: "POST",
    body: JSON.stringify({
      apiKey: API_KEY,
      action: "getResources",
      topics: topicsArray
    })
  })
    .then(r => r.json())
    .then(resources => {
      const container = document.getElementById("resourceList");
      container.innerHTML = "";
      selectedResources.clear();

      resources.forEach(res => {
        const card = document.createElement("div");
        card.className = "resource-card";

        card.innerHTML = `
          <div class="resource-title">${res.title || "Untitled resource"}</div>
          <div class="resource-meta">
            ${res.type || "Unknown type"} · ${res.topic || ""}
          </div>
        `;

        const key = res.id || res.title;

        card.onclick = () => {
          if (selectedResources.has(key)) {
            selectedResources.delete(key);
            card.classList.remove("selected");
          } else {
            selectedResources.add(key);
            card.classList.add("selected");
          }
        };

        container.appendChild(card);
      });

      setStatus("Resources loaded.");
    })
    .catch(err => {
      console.error(err);
      setStatus("Error loading resources.", "error");
    });
}

// Generate PDF
document.getElementById("generatePdfBtn").onclick = () => {
  const topicsArray = Array.from(selectedTopics);
  const resourcesArray = Array.from(selectedResources);

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
      setStatus("PDF generated successfully.");
    })
    .catch(err => {
      console.error(err);
      setStatus("Error generating PDF.", "error");
    });
};

// Email PDF
document.getElementById("emailPdfBtn").onclick = () => {
  const topicsArray = Array.from(selectedTopics);
  const resourcesArray = Array.from(selectedResources);

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
      setStatus("PDF emailed to client.");
    })
    .catch(err => {
      console.error(err);
      setStatus("Error emailing PDF.", "error");
    });
};

// Initial load
window.onload = () => {
  loadTopics();
};
