require("dotenv").config();
const express = require("express");
const multer = require("multer");
const cors = require("cors");
const path = require("path");
const xlsx = require("xlsx");
const nodemailer = require("nodemailer");
const fs = require("fs");

const app = express();
const upload = multer({ dest: "uploads/" }); // Temporary storage for uploaded files

app.use(cors());
app.use(express.json());

// Email transporter configuration
const newTransporter = () => {
  const { EMAIL_USER, EMAIL_PASS } = process.env;

  if (!EMAIL_USER || !EMAIL_PASS) {
    console.error(
      "Email credentials are missing. Please set them in the environment variables."
    );
    process.exit(1);
  }

  return nodemailer.createTransport({
    service: "gmail",
    pool: true,
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    auth: {
      user: EMAIL_USER,
      pass: EMAIL_PASS,
    },
  });
};

const transporter = newTransporter();

// Endpoint to download a dummy Excel template
app.get("/download-template", (req, res) => {
  const filePath = path.join(__dirname, "dummy_template.xlsx");
  if (fs.existsSync(filePath)) {
    res.download(filePath, "dummy_template.xlsx");
  } else {
    res.status(404).send("Template file not found.");
  }
});

// Endpoint to upload an Excel file
app.post("/upload", upload.single("file"), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: "No file uploaded" });
  }

  const uploadedFilePath = req.file.path;
  console.log("Uploaded file path:", uploadedFilePath);
  res.json({
    message: "File uploaded successfully",
    filePath: uploadedFilePath,
  });
});

// Function to send emails
const sendEmail = async (row, emailContent) => {
  const { Name, Company, Email, Role } = row;
  if (!Name || !Company || !Email || !Role) {
    console.warn(`Skipping row due to missing data: ${JSON.stringify(row)}`);
    return false;
  }

  const name = Name.split(" ")[0];
  const mailOptions = {
    from: `Harshit Raj <${process.env.EMAIL_USER}>`,
    to: Email,
    subject: `Request for an Interview Opportunity - ${Role} at ${Company}`,
    html: emailContent
      .replace("{name}", name)
      .replace("{company}", Company)
      .replace("{role}", Role),
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Email sent to: ${Email}`);
    return true;
  } catch (error) {
    console.error(`Error sending email to ${Email}:`, error.message);
    return false;
  }
};

// Endpoint to send emails
app.post("/send-emails", async (req, res) => {
  const { filePath, emailContent } = req.body;

  if (!filePath || !emailContent) {
    return res.status(400).json({ message: "Missing required parameters" });
  }

  // Load the uploaded Excel file
  try {
    const workbook = xlsx.readFile(filePath);
    const sheetName = "Sheet1";

    if (!workbook.SheetNames.includes(sheetName)) {
      return res
        .status(400)
        .json({ message: `Sheet "${sheetName}" not found in the file` });
    }

    const worksheet = workbook.Sheets[sheetName];
    const data = xlsx.utils.sheet_to_json(worksheet);

    if (data.length === 0) {
      return res
        .status(400)
        .json({ message: "No data found in the Excel sheet" });
    }

    // Send emails
    console.log("Sending your emails, please be patient...");
    let successCount = 0;

    for (const row of data) {
      const success = await sendEmail(row, emailContent);
      if (success) successCount++;
    }

    res.json({
      message: `Done sending emails. Successfully sent: ${successCount}/${data.length} emails.`,
    });
  } catch (error) {
    console.error(
      "Error processing the Excel file or sending emails:",
      error.message
    );
    res.status(500).json({ message: "Internal Server Error" });
  }
});

// Start the server
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
