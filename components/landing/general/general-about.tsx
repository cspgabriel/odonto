import Link from "next/link";
import Image from "next/image";
import { LandingButton } from "@/components/ui/landing-button";
import { cn } from "@/lib/utils";
import { GENERAL_SECTION_TITLE, GENERAL_SECTION_DESCRIPTION, GENERAL_SECTION_PADDING, GENERAL_SECTION_BG, GENERAL_TITLE_DESCRIPTION_GAP, GENERAL_HEADER_CONTENT_GAP, GENERAL_RADIUS_BUTTON, GENERAL_BUTTON_PRIMARY } from "./config";
import { CheckCircle2 } from "lucide-react";
import { LANDING_IMAGES } from "@/lib/landing-images";

const HIGHLIGHTS = [
  { num: "01", title: "Experienced Doctors", desc: "Our team brings decades of combined expertise." },
  { num: "02", title: "Modern Equipment", desc: "Latest technology for accurate diagnosis and treatment." },
  { num: "03", title: "Advanced Technology", desc: "Evidence-based protocols and digital workflows." },
];

export function GeneralAbout() {
  return (
    <section id="about" className={cn("relative overflow-hidden", GENERAL_SECTION_PADDING, GENERAL_SECTION_BG)}>
      <div className="mx-auto max-w-7xl px-4">
        <div className="grid gap-10 lg:grid-cols-2 lg:items-center lg:gap-12">
          <div className="relative flex justify-center lg:justify-start">
            <div className="relative h-[280px] w-full max-w-md overflow-hidden rounded-2xl bg-slate-200 shadow-lg sm:h-[320px]">
              <Image
                src={LANDING_IMAGES.weCarePatient}
                alt="Patient in clinic"
                fill
                className="object-cover object-center"
                sizes="(max-width: 1024px) 100vw, 50vw"
              />
            </div>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-primary">
              Why Choose Us
            </p>
            <h2 className={cn("mt-3", GENERAL_SECTION_TITLE, GENERAL_TITLE_DESCRIPTION_GAP)}>
              Why Choose Our Clinic
            </h2>
            <p className={cn(GENERAL_SECTION_DESCRIPTION, GENERAL_HEADER_CONTENT_GAP)}>
              We combine clinical excellence with a patient-first approach. From
              preventive care to advanced treatments, we are committed to your
              long-term oral health.
            </p>
            <ul className="space-y-3">
              {HIGHLIGHTS.map(({ num, title, desc }) => (
                <li
                  key={num}
                  className="flex gap-4 rounded-xl bg-slate-900 px-4 py-3 text-white"
                >
                  <span className="text-sm font-bold text-primary">{num}</span>
                  <div>
                    <p className="font-semibold">{title}</p>
                    <p className="text-sm text-slate-300">{desc}</p>
                  </div>
                  <CheckCircle2 className="ml-auto h-5 w-5 shrink-0 text-primary" />
                </li>
              ))}
            </ul>
            <LandingButton
              size="lg"
              className={cn("mt-6 px-4 py-2.5 text-sm font-semibold text-white", GENERAL_RADIUS_BUTTON, GENERAL_BUTTON_PRIMARY)}
              asChild
            >
              <Link href="#contact">Learn More</Link>
            </LandingButton>
          </div>
        </div>
      </div>
    </section>
  );
}
