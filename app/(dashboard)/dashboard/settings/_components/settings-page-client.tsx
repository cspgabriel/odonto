"use client";

import { useState, useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Building2, Palette, User, Moon, Globe, Mail, Camera, Loader2, Sun, Monitor, Save, CheckCircle, FileJson, Trash2, Tag } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useTheme } from "next-themes";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import type { CurrentClinic, ClinicType } from "@/lib/actions/clinic-actions";
import { updateClinicType } from "@/lib/actions/clinic-actions";
import { updateProfilePicture, uploadAvatar, updateUserName, updateUserEmail, updateUserPassword } from "@/lib/actions/auth-actions";
import { setThemeModeCookie, setThemePresetCookie, setMultiDoctorCookie } from "@/lib/actions/settings-actions";
import { importSeedDataFromJson, clearSeedData } from "@/lib/actions/import-seed-actions";
import { updateThemePreset } from "@/lib/theme-utils";
import { THEME_MODE_OPTIONS, THEME_PRESET_OPTIONS } from "@/types/preferences/theme";
import { CurrencyShortcut } from "../../_components/currency-shortcut";
import { LanguageShortcut } from "../../_components/language-shortcut";
import { ThemeSwitcher } from "../../_components/theme-switcher";
import { getInitials, cn } from "@/lib/utils";
import { ROLE_INIT_AVATARS } from "@/lib/constants/avatars";
import type { UserRole } from "@/lib/auth";
import type { VersionInfo } from "@/lib/versions";
import { SettingsVersionTab } from "./settings-version-tab";

type TabId = "profile" | "clinic" | "preferences" | "version";

interface SettingsPageClientProps {
  clinic: CurrentClinic | null;
  userRole: UserRole;
  userEmail: string;
  initialAvatarUrl: string | null;
  userFullName: string;
  memberSince?: string;
  emailVerified?: boolean;
  initialShowMultiDoctors: boolean;
  versionInfo: VersionInfo;
}

export function SettingsPageClient({
  clinic: initialClinic,
  userRole,
  userEmail,
  initialAvatarUrl,
  userFullName,
  memberSince,
  emailVerified = false,
  initialShowMultiDoctors,
  versionInfo,
}: SettingsPageClientProps) {
  const t = useTranslations("settings");
  const router = useRouter();
  const searchParams = useSearchParams();
  const isAdmin = userRole === "admin";
  const TABS = [
    { id: "preferences" as const, label: t("preferences"), icon: Palette },
    { id: "profile" as const, label: t("profile"), icon: User },
    ...(isAdmin ? [{ id: "clinic" as const, label: t("clinic"), icon: Building2 }] : []),
    { id: "version" as const, label: t("version"), icon: Tag },
  ];

  const [activeTab, setActiveTab] = useState<TabId>("preferences");
  const [mainNavExpanded, setMainNavExpanded] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState(initialAvatarUrl ?? "");
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Profile form state
  const [name, setName] = useState(userFullName);
  const [email, setEmail] = useState(userEmail);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [tempImageFile, setTempImageFile] = useState<File | null>(null);
  const [tempImageUrl, setTempImageUrl] = useState<string | null>(null);
  const [imageUpdateKey, setImageUpdateKey] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  
  // Theme state
  const { theme, setTheme } = useTheme();
  const [themePreset, setThemePresetState] = useState("default");
  
  // Initialize theme preset from DOM
  useEffect(() => {
    const preset = document.documentElement.getAttribute("data-theme-preset") ?? "default";
    setThemePresetState(preset);
  }, []);
  const [clinicName, setClinicName] = useState(initialClinic?.name ?? "Dental Clinic");
  const [clinicType, setClinicType] = useState<ClinicType>(initialClinic?.type ?? "general");
  const [pendingClinicType, setPendingClinicType] = useState<ClinicType | null>(null);
  const [showClinicTypeWarning, setShowClinicTypeWarning] = useState(false);
  const [savingClinic, setSavingClinic] = useState(false);
  const [showMultiDoctors, setShowMultiDoctors] = useState(initialShowMultiDoctors);
  const [importing, setImporting] = useState(false);
  const [importProgress, setImportProgress] = useState<string | null>(null);
  const [clearing, setClearing] = useState(false);
  const importFileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const tab = searchParams.get("tab");
    if (tab && TABS.some((t) => t.id === tab)) {
      setActiveTab(tab as TabId);
    }
  }, [searchParams]);



  useEffect(() => {
    setAvatarUrl(initialAvatarUrl ?? "");
  }, [initialAvatarUrl]);

  const triggerFileUpload = () => {
    fileInputRef.current?.click();
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || !file.type.startsWith("image/")) {
      toast.error(t("toastSelectImage"));
      return;
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast.error(t("toastImageSize2MB"));
      return;
    }

    // Store the file temporarily and create a preview URL
    setTempImageFile(file);
    const previewUrl = URL.createObjectURL(file);
    setTempImageUrl(previewUrl);

    toast.success(t("imageSelectedClickSave"));
  };

  const handleSaveProfile = async () => {
    setIsSaving(true);
    try {
      // Upload profile picture if a new one was selected
      if (tempImageFile) {
        setUploadingAvatar(true);
        const formData = new FormData();
        formData.set("file", tempImageFile);
        const uploadResult = await uploadAvatar(formData);
        if (uploadResult.success) {
          const updateResult = await updateProfilePicture(uploadResult.url);
          if (updateResult.success) {
            setAvatarUrl(uploadResult.url);
            setTempImageFile(null);
            setTempImageUrl(null);
            setImageUpdateKey((prev) => prev + 1);
            toast.success(t("toastProfilePictureUpdated"));
          } else {
            toast.error(updateResult.error);
            setIsSaving(false);
            setUploadingAvatar(false);
            return;
          }
        } else {
          toast.error(uploadResult.error);
          setIsSaving(false);
          setUploadingAvatar(false);
          return;
        }
        setUploadingAvatar(false);
      }

      // Update name if changed
      if (name.trim() !== userFullName) {
        const nameResult = await updateUserName(name.trim());
        if (!nameResult.success) {
          toast.error(nameResult.error);
          setIsSaving(false);
          return;
        }
      }

      // Update email if changed
      if (email.trim().toLowerCase() !== userEmail.toLowerCase()) {
        const emailResult = await updateUserEmail(email.trim());
        if (!emailResult.success) {
          toast.error(emailResult.error);
          setIsSaving(false);
          return;
        }
        toast.info(t("toastVerificationEmailSent"));
      }

      // Update password if provided
      if (newPassword) {
        if (newPassword.length < 8) {
          toast.error(t("toastPasswordMin8"));
          setIsSaving(false);
          return;
        }
        if (newPassword !== confirmPassword) {
          toast.error(t("toastPasswordsDoNotMatch"));
          setIsSaving(false);
          return;
        }
        if (!currentPassword) {
          toast.error(t("toastEnterCurrentPassword"));
          setIsSaving(false);
          return;
        }
        const passwordResult = await updateUserPassword(currentPassword, newPassword);
        if (!passwordResult.success) {
          toast.error(passwordResult.error);
          setIsSaving(false);
          return;
        }
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
        toast.success(t("toastPasswordUpdated"));
      }

      toast.success(t("toastProfileUpdated"));
      router.refresh();
    } catch (error) {
      console.error("Profile update error:", error);
      toast.error(t("toastFailedToUpdateProfile"));
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveClinic = async () => {
    setSavingClinic(true);
    try {
      const result = await updateClinicType(initialClinic?.id ?? "", clinicType, clinicName);
      if (result.success) {
        // Also save cookie preference for doctors
        await setMultiDoctorCookie(showMultiDoctors);

        toast.success(t("toastClinicSettingsSaved"));
        // Force full reload to ensure sidebar, header, and all components update
        window.location.reload(); 
      } else {
        toast.error("error" in result ? result.error : t("toastFailedToSaveClinic"));
      }
    } finally {
      setSavingClinic(false);
    }
  };

  const handleImportSeed = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.name.endsWith(".json")) {
      toast.error(t("toastSelectJsonOnly"));
      return;
    }
    setImporting(true);
    setImportProgress(t("importing"));
    try {
      const text = await file.text();
      setImportProgress(t("importing"));
      const result = await importSeedDataFromJson(text);
      setImportProgress(null);
      if (result.success) {
        const total = Object.values(result.inserted).reduce((a, b) => a + b, 0);
        toast.success(t("toastImportedRows", { total, tables: Object.keys(result.inserted).length }));
        router.refresh();
      } else {
        toast.error(result.error);
      }
    } catch (err) {
      setImportProgress(null);
      toast.error(err instanceof Error ? err.message : t("toastImportFailed"));
    } finally {
      setImporting(false);
      e.target.value = "";
    }
  };

  const handleClearSeed = async () => {
    if (!confirm(t("toastClearSeedConfirm"))) return;
    setClearing(true);
    try {
      const result = await clearSeedData();
      if (result.success) {
        toast.success(t("toastSeedDataCleared"));
        router.refresh();
      } else {
        toast.error(result.error);
      }
    } finally {
      setClearing(false);
    }
  };

  return (
    <div className="dashboard-page">
      <div className="dashboard-page-header">
        <h1 className="dashboard-page-title font-heading">{t("title")}</h1>
        <p className="dashboard-page-description text-muted-foreground">{t("pageSubtitle")}</p>
      </div>

      <div className="flex gap-6">
        {/* Main settings nav: collapsed by default, expands on hover */}
        <aside
          onMouseEnter={() => setMainNavExpanded(true)}
          onMouseLeave={() => setMainNavExpanded(false)}
          className={cn(
            "shrink-0 rounded-lg border bg-background transition-[width] duration-200 ease-out overflow-hidden",
            mainNavExpanded ? "w-48" : "w-14"
          )}
        >
          <nav className="p-2 space-y-0.5">
            {TABS.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  type="button"
                  title={tab.label}
                  onClick={() => {
                    setActiveTab(tab.id as TabId);
                    const url = new URL(window.location.href);
                    url.searchParams.set("tab", tab.id);
                    window.history.replaceState({}, "", url.pathname + "?" + url.searchParams.toString());
                  }}
                  className={cn(
                    "flex w-full items-center rounded-md px-2.5 py-2 text-sm font-medium transition-colors",
                    mainNavExpanded ? "gap-2 text-left" : "justify-center",
                    activeTab === tab.id
                      ? "bg-accent text-accent-foreground"
                      : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                  )}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  {mainNavExpanded && <span className="truncate">{tab.label}</span>}
                </button>
              );
            })}
          </nav>
        </aside>

        {/* Content */}
        <div className="min-w-0 flex-1">
          {activeTab === "profile" && (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              {/* Profile Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5" />
                    {t("profileInformation")}
                  </CardTitle>
                  <CardDescription>{t("updatePersonalInfo")}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* ... profile content ... */}
                  <div className="flex items-center gap-4">
                    <div className="group relative cursor-pointer">
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/jpeg,image/png,image/webp,image/gif"
                        className="sr-only"
                        aria-hidden
                        onChange={handleFileSelect}
                        disabled={uploadingAvatar}
                      />
                      <Avatar
                        className="h-16 w-16"
                        key={`${tempImageUrl || avatarUrl}-${imageUpdateKey}`}
                      >
                        <AvatarImage
                          src={tempImageUrl || avatarUrl || ROLE_INIT_AVATARS[userRole]}
                          alt={t("profilePicture")}
                          referrerPolicy="no-referrer"
                        />
                        <AvatarFallback className="bg-primary text-primary-foreground">{getInitials(name || userFullName)}</AvatarFallback>
                      </Avatar>
                      <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/50 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                        {uploadingAvatar ? (
                          <div className="relative">
                            <div className="h-8 w-8 animate-pulse rounded-lg bg-white"></div>
                          </div>
                        ) : (
                          <Camera className="h-6 w-6 text-white" />
                        )}
                      </div>
                      <div
                        className="absolute inset-0 cursor-pointer rounded-full"
                        onClick={triggerFileUpload}
                        aria-hidden
                      />
                    </div>
                    <div>
                      <p className="font-medium">{t("profilePicture")}</p>
                      <p className="text-muted-foreground text-sm">
                        {tempImageFile ? t("imageSelectedClickSave") : t("clickToUpload")}
                      </p>
                      <p className="text-muted-foreground text-xs">{t("mustBeUnder2MB")}</p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <Label htmlFor="name">{t("fullName")}</Label>
                    <Input
                      id="name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder={t("enterFullName")}
                      className="cursor-text"
                    />
                  </div>

                  <div className="space-y-3">
                    <Label htmlFor="email">{t("emailAddress")}</Label>
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder={t("enterEmail")}
                      className="cursor-text"
                    />
                  </div>

                  <div className="space-y-3">
                    <Label htmlFor="current-password">{t("currentPassword")}</Label>
                    <Input
                      id="current-password"
                      type="password"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder={t("enterCurrentPassword")}
                    />
                  </div>

                  <div className="space-y-3">
                    <Label htmlFor="new-password">{t("newPassword")}</Label>
                    <Input
                      id="new-password"
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder={t("enterNewPassword")}
                    />
                  </div>

                  <div className="space-y-3">
                    <Label htmlFor="confirm-password">{t("confirmPassword")}</Label>
                    <Input
                      id="confirm-password"
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder={t("confirmNewPassword")}
                    />
                  </div>

                  <Button
                    className="w-full cursor-pointer transition-colors duration-200"
                    onClick={handleSaveProfile}
                    disabled={isSaving}
                  >
                    {isSaving ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        {t("saving")}
                      </>
                    ) : (
                      <>
                        <Save className="mr-2 h-4 w-4" />
                        {t("saveChanges")}
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>

              {/* Account Status */}
              <Card className="h-fit">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5" />
                    {t("accountStatus")}
                  </CardTitle>
                  <CardDescription>{t("accountInformationStatus")}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{t("role")}</p>
                      <p className="text-muted-foreground text-sm capitalize">{userRole}</p>
                    </div>
                    <Badge variant="outline">{userRole}</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{t("email")}</p>
                      <p className="text-muted-foreground text-sm truncate max-w-[150px]">{userEmail}</p>
                    </div>
                    <Mail className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{t("memberSince")}</p>
                      <p className="text-muted-foreground text-sm">{memberSince}</p>
                    </div>
                    <p className="text-sm">{memberSince}</p>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{t("accountStatusLabel")}</p>
                      <p className="text-muted-foreground text-sm">{t("verified")}</p>
                    </div>
                    <Badge variant="outline" className="text-green-600">{t("verified")}</Badge>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {activeTab === "clinic" && initialClinic && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5" />
                  {t("clinicCardTitle")}
                </CardTitle>
                <CardDescription>
                  {t("clinicCardDescription")}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="clinic-name">{t("clinicName")}</Label>
                    <Input
                      id="clinic-name"
                      value={clinicName}
                      onChange={(e) => setClinicName(e.target.value)}
                      placeholder={t("clinicPlaceholder")}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>{t("clinicType")}</Label>
                    <Select
                      value={clinicType}
                      onValueChange={(v) => {
                        const newType = v as ClinicType;
                        if (newType !== clinicType) {
                          setPendingClinicType(newType);
                          setShowClinicTypeWarning(true);
                        }
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="general">{t("clinicTypeGeneral")}</SelectItem>
                        <SelectItem value="dental">{t("clinicTypeDental")}</SelectItem>
                        <SelectItem value="ophthalmology">{t("clinicTypeOphthalmology")}</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground mt-1">
                      {t("changeClinicTypeNote")}
                    </p>
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="flex items-center justify-between space-x-2">
                    <div className="space-y-0.5">
                      <Label htmlFor="multi-doctor-clinic" className="text-sm font-medium">{t("multipleDoctors")}</Label>
                      <p className="text-xs text-muted-foreground">{t("multipleDoctorsDescription")}</p>
                    </div>
                    <Switch
                      id="multi-doctor-clinic"
                      checked={showMultiDoctors}
                      onCheckedChange={setShowMultiDoctors}
                    />
                  </div>
                </div>

                <div className="border-t pt-4 mt-4 space-y-3">
                  <p className="text-sm font-medium">{t("importSeedData")}</p>
                  <p className="text-xs text-muted-foreground">
                    {t("importSeedDescription")}
                  </p>
                  <div className="flex flex-wrap items-center gap-2">
                    <input
                      ref={importFileRef}
                      type="file"
                      accept=".json"
                      className="hidden"
                      onChange={handleImportSeed}
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => importFileRef.current?.click()}
                      disabled={importing}
                    >
                      {importing ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          {importProgress ?? t("importing")}
                        </>
                      ) : (
                        <>
                          <FileJson className="mr-2 h-4 w-4" />
                          {t("importJson")}
                        </>
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleClearSeed}
                      disabled={clearing}
                      className="text-destructive hover:text-destructive"
                    >
                      {clearing ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="mr-2 h-4 w-4" />
                      )}
                      {clearing ? t("clearing") : t("clear")}
                    </Button>
                  </div>
                </div>

                <Button onClick={handleSaveClinic} disabled={savingClinic}>
                  {savingClinic ? t("saving") : t("save")}
                </Button>

                <AlertDialog open={showClinicTypeWarning} onOpenChange={setShowClinicTypeWarning}>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>{t("changeClinicTypeTitle")}</AlertDialogTitle>
                      <AlertDialogDescription>
                        {t("changeClinicTypeMessage", {
                          current: t(`clinicType${clinicType.charAt(0).toUpperCase()}${clinicType.slice(1)}` as "clinicTypeGeneral" | "clinicTypeDental" | "clinicTypeOphthalmology"),
                          new: pendingClinicType
                            ? t(`clinicType${pendingClinicType.charAt(0).toUpperCase()}${pendingClinicType.slice(1)}` as "clinicTypeGeneral" | "clinicTypeDental" | "clinicTypeOphthalmology")
                            : "",
                        })}
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel
                        onClick={() => {
                          setShowClinicTypeWarning(false);
                          setPendingClinicType(null);
                        }}
                      >
                        {t("cancel")}
                      </AlertDialogCancel>
                      <AlertDialogAction
                        className="bg-destructive text-white hover:bg-destructive/90 hover:text-white"
                        onClick={async (e) => {
                          e.preventDefault();
                          if (!pendingClinicType) return;
                          const newType = pendingClinicType;
                          const newName =
                            newType === "general"
                              ? "General Clinic"
                              : newType === "dental"
                                ? "Dental Clinic"
                                : "Ophthalmology Clinic";
                          setClinicType(newType);
                          setClinicName(newName);
                          setShowClinicTypeWarning(false);
                          setPendingClinicType(null);
                          setSavingClinic(true);
                          try {
                            const result = await updateClinicType(initialClinic?.id ?? "", newType, newName);
                            if (result.success) {
                              await setMultiDoctorCookie(showMultiDoctors);
                              toast.success(t("toastClinicSettingsSaved"));
                              window.location.reload();
                            } else {
                              toast.error("error" in result ? result.error : t("toastFailedToSaveClinic"));
                            }
                          } finally {
                            setSavingClinic(false);
                          }
                        }}
                      >
                        {t("yesSwitchType")}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </CardContent>
            </Card>
          )}

          {activeTab === "version" && (
            <SettingsVersionTab versionInfo={versionInfo} />
          )}

          {activeTab === "preferences" && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-base">
                      <Palette className="h-4 w-4" />
                      {t("themeSettings")}
                    </CardTitle>
                    <CardDescription className="text-sm">{t("customizeAppearance")}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center justify-between gap-4">
                      <p className="text-sm font-medium">{t("themeMode")}</p>
                      <Select
                        value={theme ?? "system"}
                        onValueChange={async (value) => {
                          const mode = value as "light" | "dark" | "system";
                          setTheme(mode);
                          await setThemeModeCookie("dashboard", mode);
                        }}
                      >
                        <SelectTrigger className="w-36 h-8 text-sm">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="light">{t("light")}</SelectItem>
                          <SelectItem value="dark">{t("dark")}</SelectItem>
                          <SelectItem value="system">{t("system")}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="flex items-center justify-between gap-4">
                      <p className="text-sm font-medium">{t("themePreset")}</p>
                      <Select
                        value={themePreset}
                        onValueChange={async (value) => {
                          updateThemePreset(value);
                          setThemePresetState(value);
                          await setThemePresetCookie(value);
                        }}
                      >
                        <SelectTrigger className="w-36 h-8 text-sm">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {THEME_PRESET_OPTIONS.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-base">
                      <Globe className="h-4 w-4" />
                      {t("languageCurrency")}
                    </CardTitle>
                    <CardDescription className="text-sm">{t("dashboardOptions")}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center justify-between gap-4">
                      <p className="text-sm font-medium">{t("displayLanguage")}</p>
                      <div className="shrink-0 w-36">
                        <LanguageShortcut />
                      </div>
                    </div>
                    <div className="flex items-center justify-between gap-4">
                      <p className="text-sm font-medium">{t("displayCurrency")}</p>
                      <div className="shrink-0 w-36">
                        <CurrencyShortcut />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

