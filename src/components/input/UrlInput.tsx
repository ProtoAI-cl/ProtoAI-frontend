import { Button, CircularProgress, TextField } from "@mui/material";
import { useState } from "react";

export const UrlInput = () => {
  const [url, setUrl] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const handleUpload = (url: string) => {
    setLoading(true);
    fetch("http://127.0.0.1:8000/upload-image", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ data: url }),
    })
      .then((response) => response.json())
      .then((data) => {
        console.log("Success:", data);
        setLoading(false);
        setUrl("");
      })
      .catch((error) => {
        console.error("Error:", error);
      })
      .then(() => {
        setUrl("");
      });
  };
  console.log(url);

  return (
    <div style={{ display: "flex", gap: 10 }}>
      <TextField
        id="url"
        label="Url de la imagen"
        variant="filled"
        style={{ backgroundColor: "white" }}
        fullWidth={true}
        onChange={(e) => setUrl(e.target.value)}
        disabled={loading === true}
      />
      {!loading ? (
        <Button
          variant="contained"
          color="primary"
          onClick={() => handleUpload(url)}
        >
          Testear!
        </Button>
      ) : (
        <CircularProgress />
      )}
    </div>
  );
};
