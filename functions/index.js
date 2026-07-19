const functions = require("@google-cloud/functions-framework");
const { google } = require("googleapis");
const puppeteer = require("puppeteer");

functions.http("generateCarePlanPdf", async (req, res) => {
  try {
    const { html, outputFolderId } = req.body;
    if (!html || !outputFolderId) {
      res.status(400).send("Missing html or outputFolderId");
      return;
    }

    const browser = await puppeteer.launch({
      args: ["--no-sandbox", "--disable-setuid-sandbox"]
    });
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "networkidle0" });
    const pdfBuffer = await page.pdf({ format: "A4" });
    await browser.close();

    const auth = new google.auth.GoogleAuth({
      scopes: ["https://www.googleapis.com/auth/drive.file"]
    });
    const drive = google.drive({ version: "v3", auth });

    const file = await drive.files.create({
      requestBody: {
        name: `CarePlan_${Date.now()}.pdf`,
        parents: [outputFolderId],
        mimeType: "application/pdf"
      },
      media: {
        mimeType: "application/pdf",
        body: Buffer.from(pdfBuffer)
      }
    });

    res.json({
      pdfFileId: file.data.id,
      pdfUrl: `https://drive.google.com/file/d/${file.data.id}/view`
    });
  } catch (e) {
    console.error(e);
    res.status(500).send("Error generating PDF");
  }
});
