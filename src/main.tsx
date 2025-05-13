
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'

// Add a debug message for initialization
console.log("[App Debug] Main.tsx initializing application");

createRoot(document.getElementById("root")!).render(<App />);
