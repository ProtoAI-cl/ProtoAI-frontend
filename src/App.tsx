import "./App.css";
import CameraComponent from "./components/camara/CameraComponent";
import { CardsContainer } from "./components/CardsContainer";
import { InputContainer } from "./components/input/InputContainer";
import { Links } from "./components/links/Links";

function App() {
    return (
        <>
            <h1>PROTO AI</h1>
            <h2>Prueba las imágenes!</h2>
            <CardsContainer />
            <InputContainer />
            <Links />
            <CameraComponent />
        </>
    );
}

export default App;
