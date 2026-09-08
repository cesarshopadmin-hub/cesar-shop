import { useEffect, useMemo, useState } from "react";
import { AppContext } from "./appContext.js";
import api from "../Services/api.js";

export function AppProvider({ children }) {
  const [theme, setTheme] = useState("dark");
  const [settings, setSettings] = useState({ logoUrl: "" });

  // Fetch global settings once on mount so logoUrl is available everywhere
  useEffect(() => {
    api
      .get("/settings")
      .then((res) => setSettings(res.data || {}))
      .catch(() => {}); // silent — logo falls back to static asset if this fails
  }, []);

  const value = useMemo(
    () => ({
      theme,
      setTheme,
      settings,
      setSettings,
    }),
    [theme, settings],
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}
