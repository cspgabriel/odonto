import Image from "next/image";
import { Card, CardContent } from "@/components/ui/card";
import { Facebook, Twitter, Linkedin } from "lucide-react";
import { cn } from "@/lib/utils";
import { GENERAL_SECTION_TITLE, GENERAL_SECTION_PADDING, GENERAL_SECTION_BG, GENERAL_HEADER_CONTENT_GAP } from "./config";
import { LANDING_IMAGES } from "@/lib/landing-images";

const DOCTORS = [
  { name: "Dr. Michael Williams", specialty: "Oral Surgeon", image: LANDING_IMAGES.doctor1 },
  { name: "Dr. Jessica Brown", specialty: "Orthodontist", image: LANDING_IMAGES.doctor2 },
  { name: "Dr. David Chen", specialty: "General & Cosmetic Dentistry", image: LANDING_IMAGES.doctor3 },
];

const XIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" aria-hidden="true" className={className} fill="currentColor">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231 5.45-6.231zm-1.161 17.52h1.833L7.084 4.126H5.117L17.083 19.77z" />
  </svg>
);

const SOCIAL_ICONS = [
  { Icon: Facebook, label: "Facebook", hoverColor: "hover:text-white dark:hover:text-white hover:border-[#1877F2] hover:bg-[#1877F2] dark:hover:bg-[#1877F2] dark:hover:border-[#1877F2]" },
  { Icon: XIcon, label: "X", hoverColor: "hover:text-white dark:hover:text-black hover:border-black dark:hover:border-white hover:bg-black dark:hover:bg-white" },
  { Icon: Linkedin, label: "LinkedIn", hoverColor: "hover:text-white dark:hover:text-white hover:border-[#0A66C2] hover:bg-[#0A66C2] dark:hover:bg-[#0A66C2] dark:hover:border-[#0A66C2]" },
];

export function GeneralDoctors() {
  return (
    <section id="doctors" className={cn("border-b border-border", GENERAL_SECTION_BG, GENERAL_SECTION_PADDING)}>
      <div className="mx-auto max-w-7xl px-4">
        <p className="text-center text-xs font-semibold uppercase tracking-widest text-primary">
          Our Team
        </p>
        <h2 className={cn("mt-3 text-center", GENERAL_SECTION_TITLE, GENERAL_HEADER_CONTENT_GAP)}>
          Meet Our Doctors
        </h2>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {DOCTORS.map(({ name, specialty, image }) => (
            <Card
              key={name}
              className="group overflow-hidden rounded-3xl border-slate-100 bg-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:ring-2 hover:ring-primary/20"
            >
              <CardContent className="p-0">
                <div className="relative aspect-[3/4] w-full overflow-hidden rounded-t-3xl bg-slate-100 ring-2 ring-primary/20 ring-offset-2 transition-colors group-hover:ring-primary/30">
                  <Image
                    src={image}
                    alt={name}
                    fill
                    className="object-cover object-top transition-transform duration-300 group-hover:scale-105"
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  />
                </div>
                <div className="p-5 text-center">
                  <p className="font-semibold text-slate-900">{name}</p>
                  <p className="mt-1 text-sm text-slate-600">{specialty}</p>
                  <div className="mt-4 flex justify-center gap-3">
                    {SOCIAL_ICONS.map(({ Icon, label, hoverColor }) => (
                      <a
                        key={label}
                        href="#"
                        className={cn(
                          "flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 dark:border-slate-800 text-slate-500 transition-all",
                          hoverColor
                        )}
                        aria-label={label}
                      >
                        <Icon className="h-4 w-4" />
                      </a>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
