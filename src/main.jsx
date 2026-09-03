import React from "react";
import ReactDOM from "react-dom/client";
import { SpeedInsights } from "@vercel/speed-insights/react";
import App from "./App";
import SetupNotice from "./components/SetupNotice";
import { isConfigured } from "./lib/supabase";
import "./styles.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    {isConfigured ? (
      <>
        <App />
        <SpeedInsights />
      </>
    ) : (
      <SetupNotice />
    )}
  </React.StrictMode>
);
