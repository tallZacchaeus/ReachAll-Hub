import { useState, useEffect } from "react";

import {
  CHART_COLORS_LIGHT,
  CHART_COLORS_DARK,
  CHART_COLOR_ARRAY_LIGHT,
  CHART_COLOR_ARRAY_DARK,
  type ChartColors,
} from "@/lib/constants";

interface UseChartColorsReturn {
  colors: ChartColors;
  colorArray: readonly string[];
  isDark: boolean;
}

// Reactive hook that returns chart colours appropriate for the current theme.
// Subscribes to class changes on <html> so charts re-colour on theme toggle.
export function useChartColors(): UseChartColorsReturn {
  const [isDark, setIsDark] = useState<boolean>(() => {
    if (typeof document === "undefined") return false;
    return document.documentElement.classList.contains("dark");
  });

  useEffect(() => {
    const observer = new MutationObserver(() => {
      setIsDark(document.documentElement.classList.contains("dark"));
    });
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });
    return () => observer.disconnect();
  }, []);

  const colors: ChartColors = isDark ? CHART_COLORS_DARK : CHART_COLORS_LIGHT;
  const colorArray: readonly string[] = isDark ? CHART_COLOR_ARRAY_DARK : CHART_COLOR_ARRAY_LIGHT;
  return { colors, colorArray, isDark };
}
