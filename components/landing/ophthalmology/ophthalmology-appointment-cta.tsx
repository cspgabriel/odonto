"use client";

import { useState } from "react";
import { LandingButton } from "@/components/ui/landing-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { LANDING_IMAGES } from "@/lib/landing-images";

const SERVICES_OPTIONS = [
  "General Check-up",
  "Teeth Whitening",
  "Dental Implants",
  "Root Canal",
  "Cosmetic Dentistry",
  "Braces",
  "Emergency Care",
];

export function OphthalmologyAppointmentCTA() {
  const [service, setService] = useState<string>("");

  return (
    <section
      id="contact"
      className="relative overflow-hidden border-b border-slate-800 bg-gradient-to-br from-slate-800 to-slate-900 py-12 sm:py-14"
    >
      <div className="mx-auto max-w-7xl px-4">
        <div className="grid gap-10 lg:grid-cols-2 lg:items-start lg:gap-12">
          <div className="rounded-3xl bg-slate-800/50 p-6 sm:p-8">
            <p className="text-xs font-semibold uppercase tracking-widest text-teal-400">
              Book Now
            </p>
            <h2 className="mt-3 text-2xl font-bold tracking-tight text-white sm:text-3xl">
              Get In Touch For Appointment
            </h2>
            <p className="mt-4 text-slate-300 leading-relaxed">
              Fill in your details and we&apos;ll confirm your visit shortly.
            </p>
            <form
              className="mt-6 space-y-4"
              onSubmit={(e) => e.preventDefault()}
            >
              <div className="space-y-2">
                <Label htmlFor="cta-name" className="text-slate-200">
                  Name
                </Label>
                <Input
                  id="cta-name"
                  placeholder="Your name"
                  className="rounded-2xl border-slate-600 bg-slate-800/80 text-white placeholder:text-slate-400 focus-visible:ring-teal-500"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cta-phone" className="text-slate-200">
                  Phone
                </Label>
                <Input
                  id="cta-phone"
                  type="tel"
                  placeholder="Your phone"
                  className="rounded-2xl border-slate-600 bg-slate-800/80 text-white placeholder:text-slate-400 focus-visible:ring-teal-500"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cta-service" className="text-slate-200">
                  Service
                </Label>
                <Select value={service} onValueChange={setService}>
                  <SelectTrigger
                    id="cta-service"
                    className="rounded-2xl border-slate-600 bg-slate-800/80 text-white focus:ring-teal-500 [&>span]:text-slate-300"
                  >
                    <SelectValue placeholder="Select a service" />
                  </SelectTrigger>
                  <SelectContent>
                    {SERVICES_OPTIONS.map((s) => (
                      <SelectItem key={s} value={s}>
                        {s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="cta-date" className="text-slate-200">
                  Date
                </Label>
                <Input
                  id="cta-date"
                  type="date"
                  className="rounded-2xl border-slate-600 bg-slate-800/80 text-white focus-visible:ring-teal-500"
                />
              </div>
              <LandingButton type="submit" size="lg" variant="primary" className="w-full rounded-full">
                Submit
              </LandingButton>
            </form>
          </div>
          <div className="relative hidden lg:block">
            <div
              className="absolute inset-0 rounded-3xl bg-slate-700/50"
              style={{
                backgroundImage: `url(${LANDING_IMAGES.makeAppointmentDoctors})`,
                backgroundSize: "cover",
                backgroundPosition: "center",
              }}
              aria-hidden
            />
            <div className="absolute inset-0 rounded-3xl bg-slate-900/60" aria-hidden />
          </div>
        </div>
      </div>
    </section>
  );
}
