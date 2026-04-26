"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Copy, Check, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";

const DEMO_CREDENTIALS = [
  { role: "Admin", email: "admin@carenova.demo", accessKey: "demoAccessAdmin" as const },
  { role: "Doctor", email: "doctor@carenova.demo", accessKey: "demoAccessDoctor" as const },
  { role: "Receptionist", email: "receptionist@carenova.demo", accessKey: "demoAccessReceptionist" as const },
  { role: "Nurse", email: "nurse@carenova.demo", accessKey: "demoAccessNurse" as const },
] as const;

const DEMO_PASSWORD = "Demo123!";

interface DemoLoginsProps {
  onAutoFill?: (email: string, password: string) => void;
}

export function DemoLogins({ onAutoFill }: DemoLoginsProps) {
  const t = useTranslations("auth");
  const [copiedEmail, setCopiedEmail] = useState<string | null>(null);

  const handleCopyEmail = async (email: string) => {
    try {
      await navigator.clipboard.writeText(email);
      setCopiedEmail(email);
      toast.success(t("emailCopied"));
      setTimeout(() => setCopiedEmail(null), 2000);
    } catch (err) {
      toast.error(t("copyFailed"));
    }
  };

  const handleAutoFill = (email: string) => {
    if (onAutoFill) {
      onAutoFill(email, DEMO_PASSWORD);
      toast.success(t("credentialsFilled"));
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="text-muted-foreground hover:text-foreground gap-1.5 text-xs font-normal"
          aria-label={t("demoLoginsAria")}
        >
          <Info className="h-3.5 w-3.5" />
          {t("demoLogins")}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        side="bottom"
        sideOffset={8}
        className="w-[min(380px,calc(100vw-2rem))] max-h-[min(85vh,500px)] overflow-y-auto p-0"
      >
        <div className="p-4 text-sm">
          <p className="mb-2 text-muted-foreground text-xs">
            {t("demoInstructions")}
          </p>
          <p className="mb-3 text-muted-foreground text-xs">
            <strong className="text-foreground">{t("demoPasswordLabel")}</strong>{" "}
            <code className="rounded bg-muted px-1 py-0.5 text-xs font-mono">{DEMO_PASSWORD}</code>
          </p>
          <div className="space-y-2">
            {DEMO_CREDENTIALS.map((row) => (
              <div
                key={row.role}
                className="group rounded-lg border border-border p-3 hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold text-foreground text-xs">{row.role}</span>
                    </div>
                    <div className="flex items-center gap-2 mb-1.5">
                      <code className="text-xs font-mono text-muted-foreground break-all">{row.email}</code>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCopyEmail(row.email);
                        }}
                        className="shrink-0 text-muted-foreground hover:text-foreground transition-colors p-1 rounded hover:bg-muted"
                        aria-label={t("copyEmailAria", { email: row.email })}
                      >
                        {copiedEmail === row.email ? (
                          <Check className="h-3.5 w-3.5 text-primary" />
                        ) : (
                          <Copy className="h-3.5 w-3.5" />
                        )}
                      </button>
                    </div>
                    <p className="text-xs text-muted-foreground">{t(row.accessKey)}</p>
                  </div>
                  {onAutoFill && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleAutoFill(row.email);
                      }}
                      className="shrink-0 text-xs h-7 px-2 rounded-lg"
                    >
                      {t("fill")}
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
