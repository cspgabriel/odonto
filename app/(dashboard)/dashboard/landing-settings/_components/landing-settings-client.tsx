"use client";

import { useState } from "react";
import { LandingPageSettings } from "@/components/settings/landing/landing-page-settings";
import type { ClinicType } from "@/lib/actions/clinic-actions";

export function LandingSettingsClient({ clinicType }: { clinicType: ClinicType }) {
  const [activeTab, setActiveTab] = useState("branding");

  return (
    <LandingPageSettings
      activeSubTab={activeTab}
      onSubTabChange={setActiveTab}
      clinicType={clinicType}
    />
  );
}
