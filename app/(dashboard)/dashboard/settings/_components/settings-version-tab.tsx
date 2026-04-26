"use client";

import { useState } from "react";
import { useTranslations } from "@/lib/i18n";
import { motion } from "framer-motion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { VersionInfo } from "@/lib/versions";
import { cn } from "@/lib/utils";

interface SettingsVersionTabProps {
  versionInfo: VersionInfo;
}

function formatReleaseDate(dateStr: string): string {
  if (!dateStr) return "—";
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  } catch {
    return dateStr;
  }
}

export function SettingsVersionTab({ versionInfo }: SettingsVersionTabProps) {
  const t = useTranslations("settings");
  const [isOpen, setIsOpen] = useState(false);
  const currentEntry = versionInfo.allVersions[0];
  const releaseDate = formatReleaseDate(versionInfo.currentDate);
  const isFirstRelease = versionInfo.currentVersion === "1.0.0";

  return (
    <Card className="border-border/50">
      <CardHeader className="">
        <CardTitle className="text-base font-heading">{t("versions")}</CardTitle>
        <CardDescription className="text-sm">
          {t("versionDescription")}
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-0">
        <motion.div
          animate={isOpen ? "open" : "closed"}
          className={cn(
            "rounded-lg border transition-colors border-border",
            isOpen ? "bg-muted/50" : "bg-card"
          )}
        >
          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            className="flex w-full items-center justify-between gap-3 px-3 py-3 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-lg"
          >
            <div className="min-w-0 flex-1 flex items-center gap-2">
              <span
                className={cn(
                  "text-sm font-medium font-heading tabular-nums transition-colors",
                  isOpen ? "text-foreground" : "text-muted-foreground"
                )}
              >
                v{versionInfo.currentVersion}
              </span>
              <Badge className="bg-primary text-primary-foreground hover:bg-primary/90 font-medium text-[10px] px-1.5 py-0 h-4 shrink-0">
                {t("current")}
              </Badge>
              {isFirstRelease && (
                <Badge variant="secondary" className="font-medium text-[10px] px-1.5 py-0 h-4 shrink-0">
                  {t("firstRelease")}
                </Badge>
              )}
              <span className="text-xs text-muted-foreground shrink-0">
                {releaseDate}
              </span>
            </div>
            <motion.span
              variants={{ open: { rotate: "45deg" }, closed: { rotate: "0deg" } }}
              transition={{ duration: 0.2 }}
              className="shrink-0"
            >
              <Plus
                className={cn(
                  "h-4 w-4 transition-colors",
                  isOpen ? "text-foreground" : "text-muted-foreground"
                )}
              />
            </motion.span>
          </button>

          <motion.div
            initial={false}
            animate={{
              height: isOpen ? "auto" : "0px",
              marginBottom: isOpen ? "12px" : "0px",
            }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="overflow-hidden px-3"
          >
            <div className="prose prose-sm dark:prose-invert max-w-none text-muted-foreground text-xs pb-2 pt-0.5">
              {currentEntry?.body ? (
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {currentEntry.body}
                </ReactMarkdown>
              ) : (
                <p className="text-xs">{t("noChangelog")}</p>
              )}
            </div>
          </motion.div>
        </motion.div>
      </CardContent>
    </Card>
  );
}
