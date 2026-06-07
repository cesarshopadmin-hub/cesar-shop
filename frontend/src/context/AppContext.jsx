import { useMemo, useState } from "react";
import { AppContext } from "./appContext.js";

export function AppProvider({ children }) {
  const [theme, setTheme] = useState("dark");

  const value = useMemo(
    () => ({
      theme,
      setTheme,
    }),
    [theme],
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}
