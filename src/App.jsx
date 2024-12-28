import { useState } from "react";
import axios from "axios";
import {
  Box,
  Button,
  TextField,
  Typography,
  Container,
  Paper,
} from "@mui/material";
import { motion } from "framer-motion";

const App = () => {
  const [emailContent, setEmailContent] = useState("");
  const [file, setFile] = useState(null);
  const [message, setMessage] = useState("");

  const downloadTemplate = async () => {
    const response = await axios.get(
      "http://localhost:4000/download-template",
      { responseType: "blob" }
    );
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "dummy_template.xlsx");
    document.body.appendChild(link);
    link.click();
  };

  const handleFileChange = (e) => setFile(e.target.files[0]);
  const handleEmailContentChange = (e) => setEmailContent(e.target.value);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file || !emailContent) {
      setMessage("Please provide both the file and email content.");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);

    try {
      const uploadResponse = await axios.post(
        "http://localhost:4000/upload",
        formData,
        { headers: { "Content-Type": "multipart/form-data" } }
      );

      const { filePath } = uploadResponse.data;

      const sendEmailsResponse = await axios.post(
        "http://localhost:4000/send-emails",
        { filePath, emailContent }
      );

      setMessage(sendEmailsResponse.data.message);
    } catch (error) {
      console.error("Error sending emails:", error);
      setMessage("Error sending emails. Please try again.");
    }
  };

  return (
    <Box sx={{ position: "relative", overflow: "hidden", minHeight: "100vh" }}>
      {/* Animated Background */}
      <motion.div
        initial={{ opacity: 0.5, backgroundPosition: "0% 50%" }}
        animate={{ opacity: 1, backgroundPosition: ["0% 50%", "100% 50%"] }}
        transition={{ duration: 5, repeat: Infinity, ease: "linear" }}
        style={{
          background: "linear-gradient(90deg, #ff5722, #ffc107)",
          backgroundSize: "200% 200%",
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          zIndex: -1,
        }}
      ></motion.div>

      {/* UI Content */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "100vh",
          minWidth: "100vw",
          padding: 2,
        }}
      >
        <Paper elevation={6} sx={{ padding: 4, maxWidth: 500, width: "100%" }}>
          <Container>
            <Typography
              variant="h4"
              gutterBottom
              textAlign="center"
              sx={{ fontWeight: "bold" }}
            >
              Email Sender
            </Typography>
            <Button
              variant="contained"
              onClick={downloadTemplate}
              sx={{
                marginBottom: 2,
                background: "#ff5722",
                color: "white",
                "&:hover": { background: "#e64a19" },
              }}
            >
              Download Template
            </Button>
            <form onSubmit={handleSubmit}>
              <TextField
                label="Email Content"
                multiline
                rows={4}
                fullWidth
                value={emailContent}
                onChange={handleEmailContentChange}
                sx={{ marginBottom: 2 }}
                required
              />
              <Button
                variant="contained"
                component="label"
                sx={{
                  marginBottom: 2,
                  background: "#ff5722",
                  color: "white",
                  "&:hover": { background: "#e64a19" },
                }}
              >
                Upload File
                <input type="file" hidden onChange={handleFileChange} />
              </Button>
              <Button
                type="submit"
                variant="contained"
                fullWidth
                sx={{
                  background: "#ff5722",
                  color: "white",
                  "&:hover": { background: "#e64a19" },
                }}
              >
                Send Emails
              </Button>
            </form>
            {message && (
              <Typography
                variant="body1"
                color="error"
                sx={{ marginTop: 2, textAlign: "center" }}
              >
                {message}
              </Typography>
            )}
          </Container>
        </Paper>
      </Box>
    </Box>
  );
};

export default App;
