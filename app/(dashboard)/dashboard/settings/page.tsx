import { redirect } from "next/navigation";
import { getAuthUser } from "@/lib/auth";
import { checkPermission } from "@/lib/auth/require-permission";
import { getCachedCurrentUser, getCachedClinic } from "@/lib/cache";
import { getVersionInfo } from "@/lib/versions";
import { SettingsPageClient } from "./_components/settings-page-client";
import { cookies } from "next/headers";
import { LANDING_DOCTORS_COOKIE } from "@/lib/preferences/constants";

export default async function SettingsPage() {
  const canView = await checkPermission("settings.view");
  if (!canView) redirect("/dashboard?error=no_permission");

  const user = await getCachedCurrentUser();
  if (!user) redirect("/login");

  const authUser = await getAuthUser();
  const avatarUrl =
    (authUser?.user_metadata?.avatar_url as string)?.trim() ||
    (authUser?.user_metadata?.image as string)?.trim() ||
    null;

  let clinic: Awaited<ReturnType<typeof getCachedClinic>> | null = null;
  if (user.role === "admin") {
    try {
      clinic = await getCachedClinic();
    } catch {
      clinic = null;
    }
  }

  // Format member since date
  const memberSince = authUser?.created_at
    ? new Date(authUser.created_at).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : undefined;

  const emailVerified = authUser?.email_confirmed_at !== null && authUser?.email_confirmed_at !== undefined;

  // Read multi-doctor setting
  const cookieStore = await cookies();
  const showMultiDoctors = cookieStore.get(LANDING_DOCTORS_COOKIE)?.value === "true";

  const versionInfo = await getVersionInfo();

  return (
    <div className="space-y-6">
      <SettingsPageClient
        clinic={clinic}
        userRole={user.role}
        userEmail={user.email}
        initialAvatarUrl={avatarUrl}
        userFullName={user.fullName}
        memberSince={memberSince}
        emailVerified={emailVerified}
        initialShowMultiDoctors={showMultiDoctors}
        versionInfo={versionInfo}
      />
    </div>
  );
}
