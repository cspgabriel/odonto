"use client";

import { useState, useEffect } from "react";
import { LandingButton } from "@/components/ui/landing-button";
import { ArrowUp } from "lucide-react";
import { cn } from "@/lib/utils";

export function GeneralBackToTop() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const checkScroll = () => {
      setVisible(window.scrollY > 100);
    };

    checkScroll();
    window.addEventListener("scroll", checkScroll, { passive: true });
    return () => window.removeEventListener("scroll", checkScroll);
  }, []);

  return (
    <LandingButton
      size="icon"
      variant="primary"
      className={cn(
        "fixed bottom-6 end-6 z-50 h-9 w-9 text-white transition-all rounded-xl bg-[#0cc0df] hover:bg-[#0aa5c4] dark:bg-[#0cc0df] dark:hover:bg-[#0aa5c4]",
        visible
          ? "translate-y-0 opacity-100"
          : "pointer-events-none translate-y-4 opacity-0"
      )}
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      aria-label="Back to top"
    >
      <ArrowUp className="h-4 w-4" />
    </LandingButton>
  );
}
