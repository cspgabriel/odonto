import Link from "next/link";
import Image from "next/image";
import { LandingButton } from "@/components/ui/landing-button";
import { CheckCircle2 } from "lucide-react";
import { LANDING_IMAGES } from "@/lib/landing-images";

const HIGHLIGHTS = [
  { num: "01", title: "Experienced Doctors", desc: "Our team brings decades of combined expertise." },
  { num: "02", title: "Modern Equipment", desc: "Latest technology for accurate diagnosis and treatment." },
  { num: "03", title: "Advanced Technology", desc: "Evidence-based protocols and digital workflows." },
];

export function OphthalmologyAbout() {
  return (
    <section id="about" className="relative overflow-hidden py-12 lg:py-16 bg-white dark:bg-slate-950">
      <div className="mx-auto max-w-7xl px-4">
        <div className="grid gap-10 lg:grid-cols-2 lg:items-center lg:gap-12">
          <div className="relative flex justify-center lg:justify-start">
            <div className="relative h-[280px] w-full max-w-md overflow-hidden rounded-3xl bg-slate-200 shadow-lg sm:h-[320px]">
              <Image
                src={LANDING_IMAGES.weCarePatient}
                alt="Patient in dental chair"
                fill
                className="object-cover object-center"
                sizes="(max-width: 1024px) 100vw, 50vw"
              />
            </div>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-teal-500">
              Why Choose Us
            </p>
            <h2 className="mt-3 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
              Why Choose Our Clinic
            </h2>
            <p className="mt-4 text-slate-600 leading-relaxed">
              We combine clinical excellence with a patient-first approach. From
              preventive care to advanced treatments, we are committed to your
              long-term oral health.
            </p>
            <ul className="mt-6 space-y-3">
              {HIGHLIGHTS.map(({ num, title, desc }) => (
                <li
                  key={num}
                  className="flex gap-4 rounded-2xl bg-slate-900 px-4 py-3 text-white"
                >
                  <span className="text-sm font-bold text-teal-400">{num}</span>
                  <div>
                    <p className="font-semibold">{title}</p>
                    <p className="text-sm text-slate-300">{desc}</p>
                  </div>
                  <CheckCircle2 className="ml-auto h-5 w-5 shrink-0 text-teal-400" />
                </li>
              ))}
            </ul>
            <LandingButton
              size="lg"
              className="mt-6 rounded-full bg-gradient-to-r from-teal-500 to-teal-600 px-6 text-white shadow-md shadow-teal-500/25 hover:from-teal-600 hover:to-teal-700"
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
