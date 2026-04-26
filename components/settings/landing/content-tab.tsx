"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import { useFormContext } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ImageUploadField } from "./image-upload-field";
import {
  ChevronDown,
  Plus,
  X,
  Sparkles,
  Briefcase,
  User,
  Star,
  DollarSign,
  ThumbsUp,
  Activity,
} from "lucide-react";
import type { LandingSettings } from "@/lib/validations/landing-settings";
import type { ClinicType } from "@/lib/actions/clinic-actions";
import { cn } from "@/lib/utils";

interface ContentTabProps {
  clinicType?: ClinicType;
}

export function ContentTab({ clinicType = "dental" }: ContentTabProps) {
  const t = useTranslations("landingSettings");
  const form = useFormContext<LandingSettings>();
  const content = form.watch("content") ?? {};
  const hero = content.hero ?? {};
  const services = content.services ?? [];
  const aboutDoctor = content.aboutDoctor ?? {};
  const testimonials = (content.testimonials?.reviews) ?? [];
  const testimonialsTitle = content.testimonials?.sectionTitle ?? "";
  const pricing = content.pricing ?? {};
  const pricingPlans = pricing.plans ?? [];
  const whyChooseUs = content.whyChooseUs ?? {};
  const whyReasons = whyChooseUs.reasons ?? [];
  const dentalHealth = content.dentalHealth ?? {};

  const [openSections, setOpenSections] = useState<string[]>(["hero"]);

  // --- Generic helpers ---
  const setHero = (field: string, value: unknown) => {
    form.setValue(`content.hero.${field}` as keyof LandingSettings, value as never, { shouldDirty: true });
  };
  const setAboutDoctor = (field: string, value: unknown) => {
    form.setValue(`content.aboutDoctor.${field}` as keyof LandingSettings, value as never, { shouldDirty: true });
  };

  // --- Services ---
  const addService = () =>
    form.setValue("content.services", [...services, { title: "", description: "", iconUrl: null }], { shouldDirty: true });
  const removeService = (i: number) =>
    form.setValue("content.services", services.filter((_: unknown, idx: number) => idx !== i), { shouldDirty: true });
  const updateService = (i: number, field: string, value: unknown) => {
    const next = [...services];
    next[i] = { ...next[i], [field]: value };
    form.setValue("content.services", next, { shouldDirty: true });
  };

  // --- Testimonials ---
  const addTestimonial = () =>
    form.setValue("content.testimonials.reviews", [...testimonials, { name: "", role: "", text: "", avatarUrl: null, rating: 5 }], { shouldDirty: true });
  const removeTestimonial = (i: number) =>
    form.setValue("content.testimonials.reviews", testimonials.filter((_: unknown, idx: number) => idx !== i), { shouldDirty: true });
  const updateTestimonial = (i: number, field: string, value: unknown) => {
    const next = [...testimonials];
    next[i] = { ...next[i], [field]: value };
    form.setValue("content.testimonials.reviews", next, { shouldDirty: true });
  };

  // --- Pricing ---
  const addPlan = () =>
    form.setValue("content.pricing.plans", [...pricingPlans, { name: "", price: 0, currency: "USD", features: [], ctaText: "Get Started", featured: false }], { shouldDirty: true });
  const removePlan = (i: number) =>
    form.setValue("content.pricing.plans", pricingPlans.filter((_: unknown, idx: number) => idx !== i), { shouldDirty: true });
  const updatePlan = (i: number, field: string, value: unknown) => {
    const next = [...pricingPlans];
    next[i] = { ...next[i], [field]: value };
    form.setValue("content.pricing.plans", next, { shouldDirty: true });
  };
  const updatePlanFeatures = (i: number, raw: string) => {
    const features = raw.split("\n").map((s: string) => s.trim()).filter(Boolean);
    updatePlan(i, "features", features);
  };

  // --- Why Choose Us ---
  const addReason = () =>
    form.setValue("content.whyChooseUs.reasons", [...whyReasons, { title: "", description: "", iconUrl: null }], { shouldDirty: true });
  const removeReason = (i: number) =>
    form.setValue("content.whyChooseUs.reasons", whyReasons.filter((_: unknown, idx: number) => idx !== i), { shouldDirty: true });
  const updateReason = (i: number, field: string, value: unknown) => {
    const next = [...whyReasons];
    next[i] = { ...next[i], [field]: value };
    form.setValue("content.whyChooseUs.reasons", next, { shouldDirty: true });
  };

  const toggleSection = (section: string) =>
    setOpenSections((prev) =>
      prev.includes(section) ? prev.filter((s) => s !== section) : [...prev, section]
    );

  const SectionHeader = ({
    id, icon: Icon, title, subtitle,
  }: { id: string; icon: React.ElementType; title: string; subtitle: string }) => (
    <CollapsibleTrigger className="w-full px-4 hover:no-underline">
      <CardHeader className="flex flex-row items-center justify-between py-3 px-4">
        <div className="flex items-center gap-3 text-left">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
            <Icon className="h-5 w-5 text-primary" />
          </div>
          <div>
            <CardTitle className="text-base">{title}</CardTitle>
            <p className="text-sm text-muted-foreground font-normal">{subtitle}</p>
          </div>
        </div>
        <ChevronDown className={cn("h-5 w-5 transition-transform", openSections.includes(id) && "rotate-180")} />
      </CardHeader>
    </CollapsibleTrigger>
  );

  return (
    <div className="space-y-4">

      {/* ── Hero ──────────────────────────────────────── */}
      <Collapsible open={openSections.includes("hero")} onOpenChange={() => toggleSection("hero")}>
        <Card className="py-2 gap-0">
          <SectionHeader id="hero" icon={Sparkles} title={t("heroSection")} subtitle={t("heroSectionSubtitle")} />
          <CollapsibleContent>
            <CardContent className="space-y-3 px-4 pb-4 pt-0">
              <div className="space-y-2">
                <Label>{t("headline")}</Label>
                <Input value={hero.headline ?? ""} onChange={(e) => setHero("headline", e.target.value)} placeholder={t("headlinePlaceholder")} />
                <p className="text-xs text-muted-foreground">{t("headlineHint")}</p>
              </div>
              <div className="space-y-2">
                <Label>{t("subtitle")}</Label>
                <Textarea value={hero.subtitle ?? ""} onChange={(e) => setHero("subtitle", e.target.value)} placeholder="We are world-class specialist..." rows={3} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>{t("primaryCta")}</Label>
                  <Input value={hero.ctaPrimary ?? ""} onChange={(e) => setHero("ctaPrimary", e.target.value)} placeholder={t("bookAppointment")} />
                </div>
                <div className="space-y-2">
                  <Label>{t("secondaryCta")}</Label>
                  <Input value={hero.ctaSecondary ?? ""} onChange={(e) => setHero("ctaSecondary", e.target.value)} placeholder={t("learnMore")} />
                </div>
              </div>
              <ImageUploadField label={t("heroImage")} currentImageUrl={hero.imageUrl ?? undefined} onImageUploaded={(url) => setHero("imageUrl", url || null)} assetType="hero" recommendedSize="1920×1080px" />
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>{t("rating")}</Label>
                  <Input type="number" min={0} max={5} step={0.1} value={hero.rating ?? ""} onChange={(e) => setHero("rating", e.target.value ? parseFloat(e.target.value) : null)} />
                </div>
                <div className="space-y-2">
                  <Label>{t("reviewCount")}</Label>
                  <Input type="number" min={0} value={hero.reviewCount ?? ""} onChange={(e) => setHero("reviewCount", e.target.value ? parseInt(e.target.value, 10) : null)} />
                </div>
                <div className="space-y-2">
                  <Label>{t("patientCount")}</Label>
                  <Input type="number" min={0} value={hero.patientCount ?? ""} onChange={(e) => setHero("patientCount", e.target.value ? parseInt(e.target.value, 10) : null)} />
                </div>
              </div>
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      {/* ── Services ──────────────────────────────────── */}
      <Collapsible open={openSections.includes("services")} onOpenChange={() => toggleSection("services")}>
        <Card className="py-2 gap-0">
          <SectionHeader id="services" icon={Briefcase} title={t("servicesSection")} subtitle={t("servicesCount", { count: services.length })} />
          <CollapsibleContent>
            <CardContent className="space-y-3 px-4 pb-4 pt-0">
              {services.map((service, index) => (
                <Card key={index} className="relative border-b border-l-0 border-r-0 border-t-0 border-solid border-border rounded-none last:border-0 shadow-none py-0 gap-0">
                  <CardContent className="p-4 pt-4">
                    <Button type="button" variant="ghost" size="icon" className="absolute top-2 right-2 h-6 w-6" onClick={() => removeService(index)}>
                      <X className="h-4 w-4" />
                    </Button>
                    <div className="space-y-4 pr-10">
                      <div className="space-y-2">
                        <Label>{t("serviceTitle")}</Label>
                        <Input value={service.title ?? ""} onChange={(e) => updateService(index, "title", e.target.value)} placeholder={t("serviceTitlePlaceholder")} />
                      </div>
                      <div className="space-y-2">
                        <Label>{t("serviceDescription")}</Label>
                        <Textarea value={service.description ?? ""} onChange={(e) => updateService(index, "description", e.target.value)} placeholder={t("serviceDescriptionPlaceholder")} rows={2} />
                      </div>
                      <ImageUploadField label={t("iconImage")} currentImageUrl={service.iconUrl ?? undefined} onImageUploaded={(url) => updateService(index, "iconUrl", url || null)} assetType={`service-${index}`} recommendedSize="64×64px" />
                    </div>
                  </CardContent>
                </Card>
              ))}
              {services.length < 6 && (
                <Button type="button" variant="outline" onClick={addService} className="w-full">
                  <Plus className="h-4 w-4 mr-2" />{t("addService")}
                </Button>
              )}
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      {/* ── About Doctor ──────────────────────────────── */}
      <Collapsible open={openSections.includes("aboutDoctor")} onOpenChange={() => toggleSection("aboutDoctor")}>
        <Card className="py-2 gap-0">
          <SectionHeader id="aboutDoctor" icon={User} title={t("aboutDoctorSection")} subtitle={t("aboutDoctorSubtitle")} />
          <CollapsibleContent>
            <CardContent className="space-y-3 px-4 pb-4 pt-0">
              <div className="space-y-2">
                <Label>{t("sectionTitle")}</Label>
                <Input value={aboutDoctor.sectionTitle ?? ""} onChange={(e) => setAboutDoctor("sectionTitle", e.target.value)} placeholder={t("aboutDoctorSectionTitlePlaceholder")} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>{t("doctorName")}</Label>
                  <Input value={aboutDoctor.doctorName ?? ""} onChange={(e) => setAboutDoctor("doctorName", e.target.value)} placeholder={t("doctorNamePlaceholder")} />
                </div>
                <div className="space-y-2">
                  <Label>{t("doctorTitle")}</Label>
                  <Input value={aboutDoctor.doctorTitle ?? ""} onChange={(e) => setAboutDoctor("doctorTitle", e.target.value)} placeholder={t("doctorTitlePlaceholder")} />
                </div>
              </div>
              <ImageUploadField label={t("doctorImage")} currentImageUrl={aboutDoctor.doctorImageUrl ?? undefined} onImageUploaded={(url) => setAboutDoctor("doctorImageUrl", url || null)} assetType="doctor" recommendedSize="400×400px" />
              <div className="space-y-2">
                <Label>{t("paragraph1")}</Label>
                <Textarea value={aboutDoctor.paragraph1 ?? ""} onChange={(e) => setAboutDoctor("paragraph1", e.target.value)} placeholder={t("paragraph1Placeholder")} rows={3} />
              </div>
              <div className="space-y-2">
                <Label>{t("paragraph2")}</Label>
                <Textarea value={aboutDoctor.paragraph2 ?? ""} onChange={(e) => setAboutDoctor("paragraph2", e.target.value)} placeholder={t("paragraph2Placeholder")} rows={3} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                {([1, 2, 3, 4] as const).map((num) => (
                  <div key={num} className="space-y-2">
                    <Label>{t("checkmark", { n: num })}</Label>
                    <Input
                      value={(aboutDoctor as Record<string, unknown>)[`checkmark${num}`] as string ?? ""}
                      onChange={(e) => setAboutDoctor(`checkmark${num}`, e.target.value)}
                      placeholder={t("pointPlaceholder", { n: num })}
                    />
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>{t("yearsExperience")}</Label>
                  <Input type="number" min={0} value={aboutDoctor.yearsOfExperience ?? ""} onChange={(e) => setAboutDoctor("yearsOfExperience", e.target.value ? parseInt(e.target.value, 10) : null)} />
                </div>
                <div className="space-y-2">
                  <Label>{t("totalPatientsLabel")}</Label>
                  <Input type="number" min={0} value={aboutDoctor.totalPatients ?? ""} onChange={(e) => setAboutDoctor("totalPatients", e.target.value ? parseInt(e.target.value, 10) : null)} />
                </div>
              </div>
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      {/* ── Testimonials ──────────────────────────────── */}
      <Collapsible open={openSections.includes("testimonials")} onOpenChange={() => toggleSection("testimonials")}>
        <Card className="py-2 gap-0">
          <SectionHeader id="testimonials" icon={Star} title={t("testimonialsSection")} subtitle={t("testimonialsCount", { count: testimonials.length })} />
          <CollapsibleContent>
            <CardContent className="space-y-3 px-4 pb-4 pt-0">
              <div className="space-y-2">
                <Label>{t("sectionTitle")}</Label>
                <Input
                  value={testimonialsTitle}
                  onChange={(e) => form.setValue("content.testimonials.sectionTitle", e.target.value, { shouldDirty: true })}
                  placeholder={t("whatOurPatientsSay")}
                />
              </div>
              {testimonials.map((r, i) => (
                <Card key={i} className="relative border-b border-l-0 border-r-0 border-t-0 border-solid border-border rounded-none last:border-0 shadow-none py-0 gap-0">
                  <CardContent className="p-4 pt-4">
                    <Button type="button" variant="ghost" size="icon" className="absolute top-2 right-2 h-6 w-6" onClick={() => removeTestimonial(i)}>
                      <X className="h-4 w-4" />
                    </Button>
                    <div className="space-y-3 pr-10">
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-2">
                          <Label>{t("name")}</Label>
                          <Input value={r.name ?? ""} onChange={(e) => updateTestimonial(i, "name", e.target.value)} placeholder={t("patientNamePlaceholder")} />
                        </div>
                        <div className="space-y-2">
                          <Label>{t("roleLabel")}</Label>
                          <Input value={r.role ?? ""} onChange={(e) => updateTestimonial(i, "role", e.target.value)} placeholder={t("happyPatientPlaceholder")} />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>{t("quote")}</Label>
                        <Textarea value={r.text ?? ""} onChange={(e) => updateTestimonial(i, "text", e.target.value)} placeholder={t("quotePlaceholder")} rows={2} />
                      </div>
                      <div className="space-y-2">
                        <Label>{t("rating15")}</Label>
                        <Input type="number" min={1} max={5} value={r.rating ?? 5} onChange={(e) => updateTestimonial(i, "rating", parseFloat(e.target.value))} />
                      </div>
                      <ImageUploadField label={t("avatar")} currentImageUrl={r.avatarUrl ?? undefined} onImageUploaded={(url) => updateTestimonial(i, "avatarUrl", url || null)} assetType={`testimonial-${i}`} recommendedSize="80×80px" />
                    </div>
                  </CardContent>
                </Card>
              ))}
              {testimonials.length < 6 && (
                <Button type="button" variant="outline" onClick={addTestimonial} className="w-full">
                  <Plus className="h-4 w-4 mr-2" />{t("addTestimonial")}
                </Button>
              )}
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      {/* ── Pricing ───────────────────────────────────── */}
      <Collapsible open={openSections.includes("pricing")} onOpenChange={() => toggleSection("pricing")}>
        <Card className="py-2 gap-0">
          <SectionHeader id="pricing" icon={DollarSign} title={t("pricingPlansSection")} subtitle={t("pricingPlansCount", { count: pricingPlans.length })} />
          <CollapsibleContent>
            <CardContent className="space-y-3 px-4 pb-4 pt-0">
              <div className="space-y-2">
                <Label>{t("sectionTitle")}</Label>
                <Input
                  value={pricing.sectionTitle ?? ""}
                  onChange={(e) => form.setValue("content.pricing.sectionTitle", e.target.value, { shouldDirty: true })}
                  placeholder={t("ourPricingPlans")}
                />
              </div>
              {pricingPlans.map((plan, i) => (
                <Card key={i} className={cn("relative border-b border-l-0 border-r-0 border-t-0 border-solid border-border rounded-none last:border-0 shadow-none py-0 gap-0", plan.featured && "bg-primary/5")}>
                  <CardContent className="p-4 pt-4">
                    <Button type="button" variant="ghost" size="icon" className="absolute top-2 right-2 h-6 w-6" onClick={() => removePlan(i)}>
                      <X className="h-4 w-4" />
                    </Button>
                    <div className="space-y-3 pr-10">
                      <div className="flex items-center gap-3">
                        <Switch
                          checked={plan.featured ?? false}
                          onCheckedChange={(v) => updatePlan(i, "featured", v)}
                        />
                        <Label className="text-sm">{t("featuredPlan")}</Label>
                      </div>
                      <div className="grid grid-cols-3 gap-3">
                        <div className="col-span-2 space-y-2">
                          <Label>{t("planName")}</Label>
                          <Input value={plan.name ?? ""} onChange={(e) => updatePlan(i, "name", e.target.value)} placeholder={t("planNamePlaceholder")} />
                        </div>
                        <div className="space-y-2">
                          <Label>{t("price")}</Label>
                          <Input type="number" min={0} value={plan.price ?? ""} onChange={(e) => updatePlan(i, "price", e.target.value ? parseFloat(e.target.value) : 0)} />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-2">
                          <Label>{t("currencyLabel")}</Label>
                          <Input value={plan.currency ?? "USD"} onChange={(e) => updatePlan(i, "currency", e.target.value.toUpperCase().slice(0, 3))} placeholder="USD" />
                        </div>
                        <div className="space-y-2">
                          <Label>{t("ctaButtonText")}</Label>
                          <Input value={plan.ctaText ?? ""} onChange={(e) => updatePlan(i, "ctaText", e.target.value)} placeholder={t("getStarted")} />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>{t("featuresOnePerLine")}</Label>
                        <Textarea
                          value={(plan.features ?? []).join("\n")}
                          onChange={(e) => updatePlanFeatures(i, e.target.value)}
                          placeholder={t("featuresPlaceholder")}
                          rows={4}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
              {pricingPlans.length < 3 && (
                <Button type="button" variant="outline" onClick={addPlan} className="w-full">
                  <Plus className="h-4 w-4 mr-2" />{t("addPlan")}
                </Button>
              )}
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      {/* ── Why Choose Us ─────────────────────────────── */}
      <Collapsible open={openSections.includes("whyChooseUs")} onOpenChange={() => toggleSection("whyChooseUs")}>
        <Card className="py-2 gap-0">
          <SectionHeader id="whyChooseUs" icon={ThumbsUp} title={t("whyChooseUsSection")} subtitle={t("whyChooseUsReasons", { count: whyReasons.length })} />
          <CollapsibleContent>
            <CardContent className="space-y-3 px-4 pb-4 pt-0">
              <div className="space-y-2">
                <Label>{t("sectionTitle")}</Label>
                <Input
                  value={whyChooseUs.sectionTitle ?? ""}
                  onChange={(e) => form.setValue("content.whyChooseUs.sectionTitle", e.target.value, { shouldDirty: true })}
                  placeholder={t("whyChooseUsPlaceholder")}
                />
              </div>
              {whyReasons.map((r, i) => (
                <Card key={i} className="relative border-b border-l-0 border-r-0 border-t-0 border-solid border-border rounded-none last:border-0 shadow-none py-0 gap-0">
                  <CardContent className="p-4 pt-4">
                    <Button type="button" variant="ghost" size="icon" className="absolute top-2 right-2 h-6 w-6" onClick={() => removeReason(i)}>
                      <X className="h-4 w-4" />
                    </Button>
                    <div className="space-y-3 pr-10">
                      <div className="space-y-2">
                        <Label>{t("reasonTitle")}</Label>
                        <Input value={r.title ?? ""} onChange={(e) => updateReason(i, "title", e.target.value)} placeholder={t("reasonTitlePlaceholder")} />
                      </div>
                      <div className="space-y-2">
                        <Label>{t("serviceDescription")}</Label>
                        <Textarea value={r.description ?? ""} onChange={(e) => updateReason(i, "description", e.target.value)} rows={2} />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
              <Button type="button" variant="outline" onClick={addReason} className="w-full">
                <Plus className="h-4 w-4 mr-2" />{t("addReason")}
              </Button>
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      {/* ── Dental Health / Stats (dental only) ─────────────────────── */}
      {clinicType === "dental" && (
        <Collapsible open={openSections.includes("dentalHealth")} onOpenChange={() => toggleSection("dentalHealth")}>
          <Card className="py-2 gap-0">
            <SectionHeader id="dentalHealth" icon={Activity} title={t("statsSection")} subtitle={t("statsSectionSubtitle")} />
            <CollapsibleContent>
              <CardContent className="space-y-3 px-4 pb-4 pt-0">
                <div className="space-y-2">
                  <Label>{t("sectionTitle")}</Label>
                  <Input
                    value={dentalHealth.sectionTitle ?? ""}
                    onChange={(e) => form.setValue("content.dentalHealth.sectionTitle", e.target.value, { shouldDirty: true })}
                    placeholder={t("committedToHealth")}
                  />
                </div>
                <div className="space-y-2">
                  <Label>{t("mainParagraph")}</Label>
                  <Textarea
                    value={dentalHealth.mainParagraph ?? ""}
                    onChange={(e) => form.setValue("content.dentalHealth.mainParagraph", e.target.value, { shouldDirty: true })}
                    rows={3}
                  />
                </div>
                <div className="grid grid-cols-3 gap-3">
                  {([1, 2, 3] as const).map((n) => (
                    <div key={n} className="space-y-3 p-3 rounded-lg border">
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{t("statLabel", { n })}</p>
                      <div className="space-y-2">
                        <Label className="text-xs">{t("numberLabel")}</Label>
                        <Input
                          type="number"
                          value={(dentalHealth as Record<string, unknown>)[`stat${n}Number`] as number ?? ""}
                          onChange={(e) => form.setValue(`content.dentalHealth.stat${n}Number` as Parameters<typeof form.setValue>[0], e.target.value ? parseInt(e.target.value, 10) : null as never, { shouldDirty: true })}
                          placeholder={t("statNumberPlaceholder")}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs">{t("labelLabel")}</Label>
                        <Input
                          value={(dentalHealth as Record<string, unknown>)[`stat${n}Label`] as string ?? ""}
                          onChange={(e) => form.setValue(`content.dentalHealth.stat${n}Label` as keyof LandingSettings, e.target.value as never, { shouldDirty: true })}
                          placeholder={t("happyPatientsPlaceholder")}
                        />
                      </div>
                    </div>
                  ))}
                </div>
                <ImageUploadField
                  label={t("sectionImage")}
                  currentImageUrl={dentalHealth.imageUrl ?? undefined}
                  onImageUploaded={(url) => form.setValue("content.dentalHealth.imageUrl", url || null, { shouldDirty: true })}
                  assetType="dental-health"
                  recommendedSize="600×700px"
                />
              </CardContent>
            </CollapsibleContent>
          </Card>
        </Collapsible>
      )}



    </div>
  );
}
