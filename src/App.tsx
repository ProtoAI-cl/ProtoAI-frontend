// import { useState } from "react";
import "./App.css";
import { CardsContainer } from "./components/CardsContainer";
import { InputContainer } from "./components/input/inputContainer";
// import { InputContainer } from "./components/input/inputContainer";

function App() {
  // const [base64, setBase64] = useState<string | null>(null);

  // const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
  //   const file = event.target.files?.[0];
  //   if (file) {
  //     const reader = new FileReader();
  //     reader.onloadend = () => {
  //       setBase64(reader.result as string);
  //     };
  //     reader.readAsDataURL(file);
  //   }
  // };

  // const handleUpload = () => {
  //   fetch("http://127.0.0.1:8000/upload-image", {
  //     method: "POST",
  //     headers: {
  //       "Content-Type": "application/json",
  //     },
  //     body: JSON.stringify({ data: base64 }),
  //   })
  //     .then((response) => response.json())
  //     .then((data) => {
  //       console.log("Success:", data);
  //     })
  //     .catch((error) => {
  //       console.error("Error:", error);
  //     })
  //     .finally(() => {
  //       setBase64(null);
  //     });
  // };

  return (
    <>
      <h1>PROTO HACK</h1>
      <h2>Prueba las imágenes!</h2>
      <CardsContainer />
      <InputContainer />
    </>
  );
}

export default App;
