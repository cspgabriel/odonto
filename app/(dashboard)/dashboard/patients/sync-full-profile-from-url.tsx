"use client";

import { useEffect } from "react";
import { useFullProfileSheet } from "./full-profile-sheet-context";

export function SyncFullProfileFromUrl({ fullProfileId }: { fullProfileId: string | undefined }) {
  const { openFullProfile } = useFullProfileSheet();
  useEffect(() => {
    if (fullProfileId) openFullProfile(fullProfileId);
  }, [fullProfileId, openFullProfile]);
  return null;
}
