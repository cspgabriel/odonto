import { Clock, Award, Settings } from "lucide-react";
import { cn } from "@/lib/utils";

const FEATURES = [
  {
    icon: Clock,
    title: "24/7 Support",
    description: "Round-the-clock assistance when you need it most.",
  },
  {
    icon: Award,
    title: "Certified Doctors",
    description: "Board-certified specialists with years of experience.",
  },
  {
    icon: Settings,
    title: "Modern Equipment",
    description: "State-of-the-art technology for precise care.",
  },
];

export function GeneralTrustFeatures() {
  return (
    <section className="border-b border-border bg-background py-10 sm:py-12">
      <div className="mx-auto max-w-7xl px-4">
        <div className="grid gap-6 sm:grid-cols-3">
          {FEATURES.map(({ icon: Icon, title, description }) => (
            <div
              key={title}
              className={cn(
                "flex items-start gap-4 rounded-3xl border border-slate-100 bg-slate-50/50 p-5 transition-shadow hover:shadow-md"
              )}
            >
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <Icon className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-900">{title}</h3>
                <p className="mt-1 text-sm text-slate-600">{description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
