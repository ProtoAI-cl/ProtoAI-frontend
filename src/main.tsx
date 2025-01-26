import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import CameraComponent from './components/camara/CameraComponent.tsx'
import Camera from './components/lore/Camera.tsx'

createRoot(document.getElementById('root')!).render(
    <StrictMode>
        <BrowserRouter>
            <Routes>
                <Route path='/' element={<App />} />
                <Route path='/camera' element={<CameraComponent />} />
                <Route path='/lore' element={<Camera />} />

            </Routes>
        </BrowserRouter>
    </StrictMode>,
)
