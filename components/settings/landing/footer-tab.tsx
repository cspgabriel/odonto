"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import { useFormContext, Controller } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ImageUploadField } from "./image-upload-field";
import type { LandingSettings } from "@/lib/validations/landing-settings";
import {
  Plus,
  Trash2,
  Link2,
  Link2Off,
  ExternalLink,
  Pencil,
  ImageIcon,
} from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ColorPicker } from "@/components/ui/color-picker";
import { cn } from "@/lib/utils";
import Image from "next/image";

// ── All linkable destinations (labelKey = landingSettings key) ─────────────────
const LINK_OPTIONS = {
  sections: [
    { labelKey: "footerSectionHome", value: "#hero" },
    { labelKey: "footerSectionServices", value: "#services" },
    { labelKey: "footerSectionAbout", value: "#about" },
    { labelKey: "footerSectionWeCare", value: "#we-care" },
    { labelKey: "footerSectionComparison", value: "#comparison" },
    { labelKey: "footerSectionPricing", value: "#pricing" },
    { labelKey: "footerSectionNews", value: "#news" },
    { labelKey: "footerSectionTestimonials", value: "#testimonials" },
    { labelKey: "footerSectionWhyChoose", value: "#why-choose" },
    { labelKey: "footerSectionContact", value: "#contact" },
    { labelKey: "footerSectionDoctors", value: "#doctors" },
  ],
  pages: [
    { labelKey: "footerPageAppointment", value: "/appointment" },
    { labelKey: "footerPagePortal", value: "/portal" },
    { labelKey: "footerPageBlog", value: "/blog" },
    { labelKey: "footerPageLogin", value: "/login" },
    { labelKey: "footerPageSignUp", value: "/signup" },
  ],
  policies: [
    { labelKey: "footerPolicyPrivacy", value: "/policies/privacy-policy" },
    { labelKey: "footerPolicyTerms", value: "/policies/terms-of-service" },
    { labelKey: "footerPolicyRefund", value: "/policies/refund-policy" },
    { labelKey: "footerPolicyCookie", value: "/policies/cookie-settings" },
  ],
} as const;

const ALL_KNOWN_VALUES = [
  ...LINK_OPTIONS.sections,
  ...LINK_OPTIONS.pages,
  ...LINK_OPTIONS.policies,
].map((o) => o.value);

const CUSTOM_URL = "__custom__";

function isKnownUrl(url: string | null | undefined): boolean {
  return ALL_KNOWN_VALUES.includes(url as (typeof ALL_KNOWN_VALUES)[number]);
}

function getLabelKeyForUrl(url: string | null | undefined): string | undefined {
  if (!url) return undefined;
  const found = [
    ...LINK_OPTIONS.sections,
    ...LINK_OPTIONS.pages,
    ...LINK_OPTIONS.policies,
  ].find((o) => o.value === url);
  return found?.labelKey;
}

// ── LinkRowEditor ─────────────────────────────────────────────────────────────
function LinkRowEditor({
  label,
  url,
  openInNewTab,
  onLabelChange,
  onUrlChange,
  onOpenInNewTabChange,
  onRemove,
  t,
  getLabelForUrl,
}: {
  label: string;
  url: string;
  openInNewTab: boolean;
  onLabelChange: (v: string) => void;
  onUrlChange: (v: string) => void;
  onOpenInNewTabChange: (v: boolean) => void;
  onRemove: () => void;
  t: (key: string) => string;
  getLabelForUrl: (url: string | null | undefined) => string | undefined;
}) {
  const known = isKnownUrl(url);
  const isAnchor = url.startsWith("#");
  const [mode, setMode] = useState<"known" | "custom">(known ? "known" : "custom");

  const handleSelectChange = (val: string) => {
    if (val === CUSTOM_URL) {
      setMode("custom");
      onUrlChange("");
    } else {
      setMode("known");
      onUrlChange(val);
      if (!label) {
        const found = getLabelForUrl(val);
        if (found) onLabelChange(found);
      }
      onOpenInNewTabChange(!val.startsWith("#"));
    }
  };

  const selectValue = known && mode === "known" ? url : CUSTOM_URL;

  return (
    <div className="flex flex-col gap-1.5 p-3 rounded-lg border border-border bg-muted/20">
      <Input
        value={label}
        onChange={(e) => onLabelChange(e.target.value)}
        placeholder={t("footerLinkLabelPlaceholder")}
        className="h-8 text-sm"
      />

      <div className="flex gap-2 items-center">
        <Select value={selectValue} onValueChange={handleSelectChange}>
          <SelectTrigger className="h-8 text-xs flex-1">
            <SelectValue placeholder={t("chooseDestination")} />
          </SelectTrigger>
          <SelectContent className="max-h-72">
            <SelectGroup>
              <SelectLabel>{t("landingPageSections")}</SelectLabel>
              {LINK_OPTIONS.sections.map((s) => (
                <SelectItem key={s.value} value={s.value} className="text-xs">{t(s.labelKey)}</SelectItem>
              ))}
            </SelectGroup>
            <SelectGroup>
              <SelectLabel>{t("appPages")}</SelectLabel>
              {LINK_OPTIONS.pages.map((s) => (
                <SelectItem key={s.value} value={s.value} className="text-xs">{t(s.labelKey)}</SelectItem>
              ))}
            </SelectGroup>
            <SelectGroup>
              <SelectLabel>{t("legalPages")}</SelectLabel>
              {LINK_OPTIONS.policies.map((s) => (
                <SelectItem key={s.value} value={s.value} className="text-xs">{t(s.labelKey)}</SelectItem>
              ))}
            </SelectGroup>
            <SelectGroup>
              <SelectItem value={CUSTOM_URL} className="text-xs">{t("customUrl")}</SelectItem>
            </SelectGroup>
          </SelectContent>
        </Select>

        <Button type="button" variant="ghost" size="icon" onClick={onRemove}
          className="h-8 w-8 text-muted-foreground hover:text-destructive shrink-0">
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>

      {mode === "custom" && (
        <Input
          value={url}
          onChange={(e) => {
            onUrlChange(e.target.value);
            onOpenInNewTabChange(!e.target.value.startsWith("#"));
          }}
          placeholder={t("customUrlPlaceholder")}
          className="h-8 text-xs font-mono"
          type="url"
        />
      )}

      {!isAnchor && (
        <label className="flex items-center gap-2 cursor-pointer select-none mt-0.5">
          <div
            role="checkbox"
            aria-checked={openInNewTab}
            tabIndex={0}
            onClick={() => onOpenInNewTabChange(!openInNewTab)}
            onKeyDown={(e) => e.key === " " && onOpenInNewTabChange(!openInNewTab)}
            className={cn(
              "relative h-4 w-7 rounded-full transition-colors duration-150 outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
              openInNewTab ? "bg-primary" : "bg-input"
            )}
          >
            <span className={cn(
              "absolute top-0.5 h-3 w-3 rounded-full bg-white shadow-sm transition-transform duration-150",
              openInNewTab ? "translate-x-3.5" : "translate-x-0.5"
            )} />
          </div>
          <span className="text-[11px] text-muted-foreground">{t("openInNewTab")}</span>
        </label>
      )}
      {isAnchor && (
        <p className="text-[10px] text-muted-foreground">{t("samePageSection")}</p>
      )}
    </div>
  );
}

// ── PolicyLinkField ───────────────────────────────────────────────────────────
function PolicyLinkField({
  label,
  description,
  value,
  onChange,
  getLabelForUrl,
  t,
}: {
  label: string;
  description: string;
  value: string | null | undefined;
  onChange: (v: string | null) => void;
  getLabelForUrl: (url: string | null | undefined) => string | undefined;
  t: (key: string) => string;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value ?? "");

  const hasValue = !!value;
  const displayLabel = getLabelForUrl(value) ?? value;

  const commit = () => {
    onChange(draft || null);
    setEditing(false);
  };

  if (editing) {
    return (
      <div className="space-y-2">
        <Label className="text-sm">{label}</Label>
        <p className="text-xs text-muted-foreground">{description}</p>
        <div className="flex flex-wrap gap-1.5 mb-2">
          {LINK_OPTIONS.policies.map((p) => (
            <button
              key={p.value}
              type="button"
              onClick={() => { onChange(p.value); setEditing(false); }}
              className={cn(
                "text-xs px-2.5 py-1 rounded-full border transition-colors",
                draft === p.value
                  ? "bg-primary text-primary-foreground border-primary"
                  : "border-border text-muted-foreground hover:border-primary hover:text-primary"
              )}
            >
              {t(p.labelKey)}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <Input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="https://example.com/privacy"
            className="h-8 text-xs font-mono flex-1"
            type="url"
          />
          <Button type="button" size="sm" className="h-8" onClick={commit}>Set</Button>
          <Button type="button" variant="ghost" size="sm" className="h-8" onClick={() => setEditing(false)}>Cancel</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-1.5">
      <Label className="text-sm">{label}</Label>
      <p className="text-xs text-muted-foreground">{description}</p>
      {hasValue ? (
        <div className="flex items-center gap-2 mt-1 p-2 rounded-lg border border-border bg-muted/30 w-fit max-w-full">
          <Link2 className="h-3.5 w-3.5 text-primary shrink-0" />
          <span className="text-xs font-medium text-foreground truncate max-w-[200px]">{displayLabel}</span>
          <div className="flex items-center gap-1 ml-1 shrink-0">
            <button type="button" onClick={() => window.open(value!, "_blank")}
              className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors" title="Open">
              <ExternalLink className="h-3 w-3" />
            </button>
            <button type="button" onClick={() => { setDraft(value ?? ""); setEditing(true); }}
              className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors" title="Change">
              <Pencil className="h-3 w-3" />
            </button>
            <button type="button" onClick={() => { onChange(null); setDraft(""); }}
              className="p-1 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors" title="Remove">
              <Link2Off className="h-3 w-3" />
            </button>
          </div>
        </div>
      ) : (
        <button type="button" onClick={() => setEditing(true)}
          className="flex items-center gap-2 text-xs text-muted-foreground border border-dashed border-border rounded-lg px-3 py-2 hover:border-primary hover:text-primary transition-colors mt-1">
          <Link2 className="h-3.5 w-3.5" />
          Click to link a page
        </button>
      )}
    </div>
  );
}

// ── Main FooterTab ─────────────────────────────────────────────────────────────
export function FooterTab() {
  const t = useTranslations("landingSettings");
  const form = useFormContext<LandingSettings>();
  const footer = form.watch("footer") ?? {};
  const branding = form.watch("branding") ?? {};
  const quickLinks = footer.quickLinks ?? [];
  const serviceLinks = footer.serviceLinks ?? [];

  const getLabelForUrl = (url: string | null | undefined) => {
    const key = getLabelKeyForUrl(url);
    return key ? t(key) : undefined;
  };

  // Effective logo for preview hint: footer.logoUrl → branding.primaryLogoUrl → null
  const effectiveLightLogo = footer.logoUrl ?? branding.primaryLogoUrl ?? null;
  const effectiveDarkLogo  = branding.darkLogoUrl ?? footer.logoUrl ?? null;

  const addLink = (type: "quickLinks" | "serviceLinks") => {
    const current = form.getValues(`footer.${type}`) ?? [];
    form.setValue(`footer.${type}`, [...current, { label: "", url: "" }], { shouldDirty: true });
  };

  const removeLink = (type: "quickLinks" | "serviceLinks", index: number) => {
    const current = form.getValues(`footer.${type}`) ?? [];
    form.setValue(`footer.${type}`, current.filter((_: unknown, i: number) => i !== index), { shouldDirty: true });
  };

  const updateLink = (
    type: "quickLinks" | "serviceLinks",
    index: number,
    field: "label" | "url" | "openInNewTab",
    value: string | boolean
  ) => {
    const current = form.getValues(`footer.${type}`) ?? [];
    const next = [...current];
    next[index] = { ...next[index], [field]: value };
    form.setValue(`footer.${type}`, next, { shouldDirty: true });
  };

  const setFooter = (field: string, value: unknown) => {
    form.setValue(`footer.${field}` as keyof LandingSettings, value as never, { shouldDirty: true });
  };

  return (
    <div className="space-y-4">

      {/* ── Logo & Description ─────────────────────────────────────────────── */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-base">Logo & Description</CardTitle>
          <CardDescription>
            Footer-specific logo and company description. Leave logo empty to inherit the branding logo.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col md:flex-row gap-6">
            <div className="w-full md:w-1/3 space-y-2">
              <ImageUploadField
                label="Footer Logo (optional)"
                currentImageUrl={footer.logoUrl ?? undefined}
                onImageUploaded={(url) => setFooter("logoUrl", url || null)}
                assetType="footer-logo"
                recommendedSize="200×60px"
              />
              {/* Hint: show the effective logo being used */}
              {!footer.logoUrl && effectiveLightLogo && (
                <div className="rounded-lg border border-dashed border-border bg-muted/20 p-2 space-y-1">
                  <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                    <ImageIcon className="h-3 w-3" />
                    Currently using branding logo:
                  </p>
                  <div className="flex items-center gap-2">
                    {effectiveLightLogo && (
                      <Image src={effectiveLightLogo} alt="Current logo" width={100} height={28}
                        className="h-7 w-auto object-contain opacity-70 block dark:hidden" />
                    )}
                    {effectiveDarkLogo && (
                      <Image src={effectiveDarkLogo} alt="Current logo" width={100} height={28}
                        className="h-7 w-auto object-contain opacity-70 hidden dark:block" />
                    )}
                  </div>
                </div>
              )}
            </div>
            <div className="w-full md:w-2/3 space-y-2">
              <Label>Company Description</Label>
              <Textarea
                {...form.register("footer.companyDescription")}
                placeholder="Brief description of your clinic..."
                rows={4}
                className="h-[108px]"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ── Quick Links & Service Links ────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <CardTitle className="text-base">Quick Links</CardTitle>
                <CardDescription>Navigation links shown in the footer.</CardDescription>
              </div>
              <Button type="button" variant="outline" size="sm" onClick={() => addLink("quickLinks")} className="h-8">
                <Plus className="h-4 w-4 mr-1.5" /> Add
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            {quickLinks.length === 0 && (
              <p className="text-sm text-muted-foreground italic">No links added yet.</p>
            )}
            {quickLinks.map((link: { label?: string | null; url?: string | null; openInNewTab?: boolean | null }, index: number) => (
              <LinkRowEditor
                key={index}
                label={link.label ?? ""}
                url={link.url ?? ""}
                openInNewTab={link.openInNewTab ?? !(link.url ?? "").startsWith("#")}
                onLabelChange={(v) => updateLink("quickLinks", index, "label", v)}
                onUrlChange={(v) => updateLink("quickLinks", index, "url", v)}
                onOpenInNewTabChange={(v) => updateLink("quickLinks", index, "openInNewTab", v)}
                onRemove={() => removeLink("quickLinks", index)}
                t={t}
                getLabelForUrl={getLabelForUrl}
              />
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <CardTitle className="text-base">Service Links</CardTitle>
                <CardDescription>Specific service pages in the footer.</CardDescription>
              </div>
              <Button type="button" variant="outline" size="sm" onClick={() => addLink("serviceLinks")} className="h-8">
                <Plus className="h-4 w-4 mr-1.5" /> Add
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            {serviceLinks.length === 0 && (
              <p className="text-sm text-muted-foreground italic">No links added yet.</p>
            )}
            {serviceLinks.map((link: { label?: string | null; url?: string | null; openInNewTab?: boolean | null }, index: number) => (
              <LinkRowEditor
                key={index}
                label={link.label ?? ""}
                url={link.url ?? ""}
                openInNewTab={link.openInNewTab ?? !(link.url ?? "").startsWith("#")}
                onLabelChange={(v) => updateLink("serviceLinks", index, "label", v)}
                onUrlChange={(v) => updateLink("serviceLinks", index, "url", v)}
                onOpenInNewTabChange={(v) => updateLink("serviceLinks", index, "openInNewTab", v)}
                onRemove={() => removeLink("serviceLinks", index)}
                t={t}
                getLabelForUrl={getLabelForUrl}
              />
            ))}
          </CardContent>
        </Card>
      </div>

      {/* ── Legal & Copyright ─────────────────────────────────────────────── */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-base">Legal & Copyright</CardTitle>
          <CardDescription>Copyright text and policy page links.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">

          <div className="space-y-2">
            <Label>Copyright Text</Label>
            <Input {...form.register("footer.copyrightText")} placeholder="© 2025 ClinicMaster. All rights reserved." />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <PolicyLinkField
              label={t("footerPolicyPrivacy")}
              description="Link to your privacy policy page."
              value={footer.privacyPolicyLink}
              onChange={(v) => setFooter("privacyPolicyLink", v)}
              getLabelForUrl={getLabelForUrl}
              t={t}
            />
            <PolicyLinkField
              label={t("footerPolicyTerms")}
              description="Link to your terms of service page."
              value={footer.termsLink}
              onChange={(v) => setFooter("termsLink", v)}
              getLabelForUrl={getLabelForUrl}
              t={t}
            />
          </div>

          <div className="space-y-2">
            <Label>Footer Background Color</Label>
            <div className="flex gap-3 items-center">
              <Controller
                control={form.control}
                name="footer.backgroundColor"
                render={({ field }) => (
                  <Popover>
                    <PopoverTrigger asChild>
                      <div
                        className="h-9 w-12 rounded border border-input cursor-pointer shadow-sm"
                        style={{ backgroundColor: field.value ?? "#000000" }}
                        aria-label="Pick footer background color"
                      />
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0 border-none bg-transparent shadow-none" align="start">
                      <ColorPicker value={field.value ?? "#000000"} onChange={field.onChange} />
                    </PopoverContent>
                  </Popover>
                )}
              />
              <Input {...form.register("footer.backgroundColor")} placeholder="#000000" className="font-mono text-xs max-w-[120px]" />
            </div>
          </div>

        </CardContent>
      </Card>
    </div>
  );
}
