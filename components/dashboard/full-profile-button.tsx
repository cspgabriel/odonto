"use client";

import { useFullProfileSheet } from "@/app/(dashboard)/dashboard/patients/full-profile-sheet-context";
import { Button } from "@/components/ui/button";

type FullProfileButtonProps = {
  patientId: string;
  variant?: "default" | "outline" | "link" | "ghost" | "destructive" | "secondary";
  size?: "default" | "sm" | "lg" | "icon";
  className?: string;
  children?: React.ReactNode;
};

export function FullProfileButton({
  patientId,
  variant = "outline",
  size,
  className,
  children = "Full Profile",
}: FullProfileButtonProps) {
  const { openFullProfile } = useFullProfileSheet();
  return (
    <Button
      variant={variant}
      size={size}
      className={className}
      onClick={() => openFullProfile(patientId)}
    >
      {children}
    </Button>
  );
}
