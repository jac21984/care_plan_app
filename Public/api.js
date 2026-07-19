const BACKEND_URL = "https://script.google.com/macros/s/AKfycby9i-D5spxfD7q3mrXPSlwoE8QdBw-t7bVpxUkmhTZ5-2KvaICmQ5AdvWPyp-pjcip2Zg/exec"; // e.g. https://script.google.com/macros/s/AKfycbx.../exec

async function pingBackend() {
  const res = await fetch(BACKEND_URL);
  if (!res.ok) throw new Error("Backend ping failed");
  return res.json();
}

async function apiGenerateCarePlanPdf(clientInfo, selectedResources, settings) {
  const payload = {
    action: "generateCarePlanPdf",
    clientInfo,
    selectedResources,
    settings
  };

  const res = await fetch(BACKEND_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });

  const data = await res.json();
  if (data.error) throw new Error(data.error);
  return data;
}

async function apiSendCarePlanEmail(pdfFileId, clientEmail, settings) {
  const payload = {
    action: "sendCarePlanEmail",
    pdfFileId,
    clientEmail,
    settings
  };

  const res = await fetch(BACKEND_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });

  const data = await res.json();
  if (data.error) throw new Error(data.error);
  return data;
}
