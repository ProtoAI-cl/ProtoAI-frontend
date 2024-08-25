import { useState } from "react";
import { testsImages } from "../assets/images";
import { TestsImagesCard } from "./TestsImagesCard";
import CircularProgress from "@mui/material/CircularProgress/CircularProgress";

export const CardsContainer = () => {
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
      })
      .catch((error) => {
        console.error("Error:", error);
      });
  };

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        gap: "1rem",
        maxHeight: "100vh",
      }}
    >
      {!loading ? (
        testsImages.map((image, index) => (
          <TestsImagesCard
            key={index}
            imageUrl={image.imageUrl}
            title={image.title}
            onClick={() => handleUpload(image.imageUrl)}
          />
        ))
      ) : (
        <CircularProgress />
      )}
    </div>
  );
};
