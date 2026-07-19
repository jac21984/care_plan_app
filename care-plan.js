document.addEventListener("DOMContentLoaded", () => {
  const genBtn = document.getElementById("cpGeneratePdfBtn");
  const sendBtn = document.getElementById("cpSendEmailBtn");
  const statusEl = document.getElementById("cpStatus");

  let lastPdfFileId = null;

  function getSelectedResourcesStub() {
    return [
      {
        title: "Latch Technique",
        description: "Video on deep latch.",
        url: "https://example.com/latch"
      },
      {
        title: "Paced Bottle Feeding",
        description: "Article on paced feeding.",
        url: "https://example.com/bottle"
      }
    ];
  }

  genBtn.addEventListener("click", async () => {
    try {
      const clientInfo = {
        name: document.getElementById("cpClientName").value || "Client",
        date: new Date().toLocaleDateString(),
        notes: document.getElementById("cpNotes").value || ""
      };
      const selectedResources = getSelectedResourcesStub();

      statusEl.textContent = "Generating PDF via backend...";
      const result = await apiGenerateCarePlanPdf(clientInfo, selectedResources, settings);

      lastPdfFileId = result.pdfFileId;
      statusEl.textContent = `PDF generated. View: ${result.pdfUrl}`;
    } catch (e) {
      console.error(e);
      statusEl.textContent = "Error generating PDF.";
    }
  });

  sendBtn.addEventListener("click", async () => {
    try {
      if (!lastPdfFileId) {
        statusEl.textContent = "Generate a PDF first.";
        return;
      }
      const email = document.getElementById("cpClientEmail").value;
      if (!email) {
        statusEl.textContent = "Enter client email.";
        return;
      }

      statusEl.textContent = "Sending email via backend...";
      await apiSendCarePlanEmail(lastPdfFileId, email, settings);
      statusEl.textContent = "Email sent.";
    } catch (e) {
      console.error(e);
      statusEl.textContent = "Error sending email.";
    }
  });
});
