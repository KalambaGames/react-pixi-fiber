import { useEffect, useState } from "react";
import { browserStorage } from "../storage";

export type Theme = "system" | "light" | "dark";

const KEY = "playground:theme";
const query = "(prefers-color-scheme: dark)";

function stored(): Theme {
  const value = browserStorage.get(KEY);
  return value === "light" || value === "dark" ? value : "system";
}

// `dark` tells whether the page shows dark colours. It sets the `dark` class on <html>.
export function useTheme(): { dark: boolean; setTheme: (theme: Theme) => void; theme: Theme } {
  const [theme, setTheme] = useState(stored);
  const [systemDark, setSystemDark] = useState(() => matchMedia(query).matches);

  useEffect(() => {
    const media = matchMedia(query);
    const onChange = () => setSystemDark(media.matches);
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, []);

  const dark = theme === "dark" || (theme === "system" && systemDark);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
    document.documentElement.style.colorScheme = dark ? "dark" : "light";
  }, [dark]);

  useEffect(() => {
    browserStorage.set(KEY, theme === "system" ? null : theme);
  }, [theme]);

  return { dark, setTheme, theme };
}
