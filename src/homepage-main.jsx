import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import HomepageApp from "./components/HomepageApp.jsx";
import { configured } from "./services/parse.js";
import "./pages/HomePage.css";

// This entry belongs only to the homepage. The original App.jsx and main.jsx
// remain exactly as the teammate pushed them and still run the original task app.
createRoot(document.getElementById("root")).render(
  <StrictMode>
    {/* Wrap the app once, as in Week 6. React Router handles page addresses. */}
    <BrowserRouter>
      <HomepageApp configured={configured} />
    </BrowserRouter>
  </StrictMode>,
);
