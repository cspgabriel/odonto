"use client";

import { useEffect } from "react";
import { usePreferences } from "@/contexts/preferences-context";
import type { LocaleCode } from "@/lib/preferences/constants";

/** When Arabic is selected: RTL layout and Arabic font. Syncs dir/lang to document. */
export function LocaleDirFont() {
  const { locale } = usePreferences();

  useEffect(() => {
    const html = document.documentElement;
    html.setAttribute("dir", locale === "ar" ? "rtl" : "ltr");
    html.setAttribute("lang", locale);
    if (locale === "ar") {
      html.classList.add("locale-ar");
    } else {
      html.classList.remove("locale-ar");
    }
  }, [locale]);

  return null;
}
