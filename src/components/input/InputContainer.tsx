import { UrlInput } from "./UrlInput";

export const InputContainer = () => {
  return (
    <div
      // el texto debe estar arriva del input
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "1rem",
        margin: "1rem",
      }}
    >
      <text style={{ color: "white" }}>O sube el link de la imagen</text>
      <div style={{ width: 800 }}>
        <UrlInput />
      </div>
    </div>
  );
};
