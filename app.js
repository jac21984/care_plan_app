let activeDatabase = null;
let settings = {
  defaultSignature: "",
  defaultEmailTemplate: "clinical",
  defaultPdfBranding: { headerText: "Care Plan" }
};

function showPage(id) {
  document.querySelectorAll("main .panel").forEach(p => p.classList.add("hidden"));
  document.getElementById(id).classList.remove("hidden");
}

function initHeaderMenu() {
  const menuBtn = document.getElementById("menuBtn");
  const menu = document.getElementById("headerMenu");

  menuBtn.addEventListener("click", () => {
    menu.classList.toggle("hidden");
  });

  menu.querySelectorAll("button[data-target]").forEach(btn => {
    btn.addEventListener("click", () => {
      const target = btn.getAttribute("data-target");
      showPage(target);
      menu.classList.add("hidden");
    });
  });

  document.getElementById("goToDatabaseBtn").addEventListener("click", () => {
    showPage("databasePage");
  });

  document.getElementById("startCarePlanBtn").addEventListener("click", () => {
    showPage("carePlanPage");
  });

  document.getElementById("addResourceBtn").addEventListener("click", () => {
    showPage("resourcePage");
  });

  document.getElementById("switchDatabaseBtn").addEventListener("click", () => {
    showPage("databasePage");
  });
}

function updateHomePage() {
  const noDb = document.getElementById("homeNoDbMessage");
  const content = document.getElementById("homeContent");

  if (!activeDatabase) {
    noDb.classList.remove("hidden");
    content.classList.add("hidden");
    document.getElementById("activeDatabaseLabel").textContent = "";
    return;
  }

  noDb.classList.add("hidden");
  content.classList.remove("hidden");

  document.getElementById("homeDbName").textContent =
    `Active Database: ${activeDatabase.name}`;
  document.getElementById("homeDbStats").textContent =
    `Topics: ${activeDatabase.topicCount}  Resources: ${activeDatabase.resourceCount}`;
  document.getElementById("activeDatabaseLabel").textContent =
    `DB: ${activeDatabase.name}`;

  const list = document.getElementById("recentCarePlansList");
  list.innerHTML = "";
  (activeDatabase.recentCarePlans || []).forEach(cp => {
    const li = document.createElement("li");
    li.textContent = `${cp.client} — ${cp.date} — ${cp.topics} — ${cp.status}`;
    list.appendChild(li);
  });
}

function checkSystemStatus() {
  const icon = document.getElementById("systemStatusIcon");
  const healthList = document.getElementById("systemHealthList");
  healthList.innerHTML = "";

  const checks = [];

  checks.push({ name: "Backend", ok: !!window.BACKEND_STATUS_OK, message: window.BACKEND_STATUS_OK ? "Reachable" : "Not checked yet" });
  checks.push({ name: "Output folder", ok: !!activeDatabase, message: activeDatabase ? "Configured" : "No active database" });
  checks.push({ name: "PDF Generator", ok: true, message: "Doc → PDF via Apps Script" });
  checks.push({ name: "Email Sender", ok: true, message: "MailApp via Apps Script" });

  const allOk = checks.every(c => c.ok);
  icon.textContent = allOk ? "✔" : "✖";

  checks.forEach(c => {
    const li = document.createElement("li");
    li.textContent = `${c.name}: ${c.ok ? "✔" : "✖"} ${c.message}`;
    healthList.appendChild(li);
  });
}

function initSystemStatusModal() {
  const popup = document.getElementById("systemStatusPopup");
  const modal = document.getElementById("systemStatusModal");
  const closeBtn = document.getElementById("closeSystemStatusModalBtn");

  popup.addEventListener("click", () => {
    checkSystemStatus();
    modal.classList.remove("hidden");
  });

  closeBtn.addEventListener("click", () => {
    modal.classList.add("hidden");
  });
}

function initDatabaseManagerStub() {
  const btn = document.getElementById("activateDummyDbBtn");
  btn.addEventListener("click", () => {
    activeDatabase = {
      name: "Apex (Primary)",
      topicCount: 12,
      resourceCount: 87,
      outputFolderId: "1Kt_2tV94NNhTLl7GRpkE6D8wlHhgiXsc",
      topicsFolderId: "1IjzDqshgZjGVaT256BicUPnu070AL2wJ",
      resourcesFolderId: "1LuLI2kgJa5pUzcnvqyKhJ8ux1tpDaH_B",
      appConfigFolderId: "1ntyRVFYhpiNWoxPle-t2PvSujnmCCa0v",
      recentCarePlans: [
        { client: "Sarah M.", date: "Jul 15", topics: "Latch, Bottle Feeding", status: "PDF, Sent" },
        { client: "Emma R.", date: "Jul 14", topics: "Pumping", status: "PDF, Sent" },
        { client: "Jacob T.", date: "Jul 13", topics: "Sleep Training", status: "PDF, Not Sent" }
      ]
    };
    updateHomePage();
    showPage("homePage");
  });
}

function initSettingsPanel() {
  const btn = document.getElementById("settingsBtn");
  const panel = document.getElementById("settingsPanel");
  const saveBtn = document.getElementById("saveSettingsBtn");
  const closeBtn = document.getElementById("closeSettingsBtn");

  btn.addEventListener("click", () => {
    document.getElementById("settingsSignatureInput").value = settings.defaultSignature || "";
    document.getElementById("settingsEmailTemplateSelect").value = settings.defaultEmailTemplate || "clinical";
    document.getElementById("settingsPdfHeaderInput").value =
      settings.defaultPdfBranding?.headerText || "Care Plan";
    panel.classList.remove("hidden");
  });

  saveBtn.addEventListener("click", () => {
    const signature = document.getElementById("settingsSignatureInput").value;
    const template = document.getElementById("settingsEmailTemplateSelect").value;
    const headerText = document.getElementById("settingsPdfHeaderInput").value;

    settings.defaultSignature = signature;
    settings.defaultEmailTemplate = template;
    settings.defaultPdfBranding = { headerText };

    alert("Settings saved (in memory).");
    panel.classList.add("hidden");
  });

  closeBtn.addEventListener("click", () => panel.classList.add("hidden"));
}

document.addEventListener("DOMContentLoaded", async () => {
  initHeaderMenu();
  initSystemStatusModal();
  initDatabaseManagerStub();
  initSettingsPanel();
  showPage("homePage");

  // Ping backend
  try {
    const status = document.getElementById("status");
    const res = await pingBackend();
    window.BACKEND_STATUS_OK = true;
    status.textContent = "Backend OK (Apps Script).";
  } catch (e) {
    console.error(e);
    window.BACKEND_STATUS_OK = false;
    document.getElementById("status").textContent = "Backend error.";
  }
});
