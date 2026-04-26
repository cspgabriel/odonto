"use client";

import { useState, useEffect, useTransition, useMemo } from "react";
import { useTranslations } from "@/lib/i18n";
import {
  getRolePermissions,
  saveRolePermissions,
  setPermissionForAllRoles,
} from "@/lib/actions/permission-actions";
import {
  PERMISSION_KEYS,
  PERMISSION_LABELS,
  ROLE_CONFIG,
  ROLES,
  type Role,
} from "@/lib/constants/permissions";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Search, Save } from "lucide-react";

interface Props {
  initialCounts: Record<string, number>;
}

type PermEntry = { key: string; granted: boolean };

export function PermissionsClient({ initialCounts }: Props) {
  const t = useTranslations("permissions");
  const [selectedRole, setSelectedRole] = useState<Role>("admin");
  const [permissions, setPermissions] = useState<PermEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [search, setSearch] = useState("");
  const [counts, setCounts] = useState(initialCounts);

  useEffect(() => {
    setIsLoading(true);
    setSearch("");
    getRolePermissions(selectedRole)
      .then((r) => {
        if (r.success && r.data) setPermissions(r.data);
      })
      .finally(() => setIsLoading(false));
  }, [selectedRole]);

  const filtered = useMemo(
    () =>
      permissions.filter((p) => {
        const label =
          PERMISSION_LABELS[p.key as keyof typeof PERMISSION_LABELS] ?? p.key;
        const q = search.toLowerCase();
        return (
          label.toLowerCase().includes(q) || p.key.toLowerCase().includes(q)
        );
      }),
    [permissions, search]
  );

  const grantedCount = permissions.filter((p) => p.granted).length;
  const allSelected =
    permissions.length > 0 && permissions.every((p) => p.granted);
  const someSelected = permissions.some((p) => p.granted) && !allSelected;

  const toggle = (key: string) =>
    setPermissions((prev) =>
      prev.map((p) =>
        p.key === key ? { ...p, granted: !p.granted } : p
      )
    );

  const selectAll = () =>
    setPermissions((prev) => prev.map((p) => ({ ...p, granted: true })));

  const deselectAll = () =>
    setPermissions((prev) => prev.map((p) => ({ ...p, granted: false })));

  const handleSave = () => {
    startTransition(async () => {
      const result = await saveRolePermissions({
        role: selectedRole,
        permissions,
      });
      if (result.success) {
        toast.success(
          t("savedSuccess", { role: ROLE_CONFIG[selectedRole].label })
        );
        setCounts((prev) => ({ ...prev, [selectedRole]: grantedCount }));
      } else {
        toast.error(result.error ?? t("failedToSave"));
      }
    });
  };

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[260px_1fr]">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold">{t("roles")}</CardTitle>
          <p className="text-muted-foreground text-xs">
            {t("selectRoleDescription")}
          </p>
        </CardHeader>
        <CardContent className="p-2 pt-0">
          <div className="space-y-0.5">
            {ROLES.map((role) => {
              const config = ROLE_CONFIG[role];
              const count =
                selectedRole === role ? grantedCount : counts[role] ?? 0;
              const isSelected = selectedRole === role;

              return (
                <button
                  key={role}
                  type="button"
                  onClick={() => setSelectedRole(role)}
                  className={`flex w-full items-center justify-between rounded-lg px-3 py-3 text-left text-sm transition-colors ${
                    isSelected
                      ? "bg-primary/10 font-medium text-primary"
                      : "text-foreground hover:bg-muted"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <span
                      className={`rounded-md px-2 py-0.5 text-xs font-bold ${config.badgeClass}`}
                    >
                      {config.shortLabel}
                    </span>
                    <span>{config.label}</span>
                  </div>
                  <span className="text-muted-foreground whitespace-nowrap text-xs">
                    {count} {t("perms")}
                  </span>
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-4 pb-4">
          <div>
            <CardTitle className="text-sm font-semibold">{t("permissionsLabel")}</CardTitle>
            <p className="text-muted-foreground text-xs">
              {t("permissionsSubtitle", { granted: grantedCount, total: permissions.length, role: ROLE_CONFIG[selectedRole].label })}
            </p>
          </div>
          <Button
            onClick={handleSave}
            disabled={isPending || isLoading}
            size="sm"
          >
            <Save className="mr-2 h-4 w-4" />
            {isPending ? t("saving") : t("saveChanges")}
          </Button>
        </CardHeader>

        <CardContent>
          <div className="mb-4 flex flex-wrap items-center gap-3">
            <div className="relative min-w-[200px] flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder={t("searchPlaceholder")}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-9 pl-9"
              />
            </div>

            <label className="text-muted-foreground flex cursor-pointer select-none items-center gap-2 text-sm">
              <Checkbox
                checked={allSelected}
                data-state={someSelected ? "indeterminate" : undefined}
                onCheckedChange={(checked) =>
                  checked ? selectAll() : deselectAll()
                }
              />
              <span>{t("selectAll")}</span>
              <span className="text-xs">
                — {t("selectedCount", { granted: grantedCount, total: PERMISSION_KEYS.length })}
              </span>
            </label>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {Array.from({ length: 16 }).map((_, i) => (
                <div
                  key={i}
                  className="h-[58px] animate-pulse rounded-lg bg-muted"
                />
              ))}
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {filtered.map((perm) => {
                  const label =
                    PERMISSION_LABELS[
                      perm.key as keyof typeof PERMISSION_LABELS
                    ] ?? perm.key;

                  return (
                    <div
                      key={perm.key}
                      className={`flex items-start gap-3 rounded-lg border p-3 transition-colors ${
                        perm.granted
                          ? "border-primary/30 bg-primary/5 dark:bg-primary/10"
                          : "border-border hover:bg-muted/50"
                      }`}
                    >
                      <label className="flex flex-1 cursor-pointer items-start gap-3 min-w-0">
                        <Checkbox
                          checked={perm.granted}
                          onCheckedChange={() => toggle(perm.key)}
                          className="mt-0.5 shrink-0"
                        />
                        <div className="min-w-0">
                          <p className="text-sm font-medium leading-snug">
                            {label}
                          </p>
                          <p className="truncate text-xs text-muted-foreground">
                            {perm.key}
                          </p>
                        </div>
                      </label>
                      <div className="flex shrink-0 gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 px-2 text-xs"
                          disabled={isPending}
                          title={t("grantToAllRoles")}
                          onClick={() => {
                            startTransition(async () => {
                              const r = await setPermissionForAllRoles({
                                permissionKey: perm.key,
                                granted: true,
                              });
                              if (r.success) {
                                setPermissions((prev) =>
                                  prev.map((p) =>
                                    p.key === perm.key ? { ...p, granted: true } : p
                                  )
                                );
                                toast.success(t("grantedToAll", { label }));
                                getRolePermissions(selectedRole).then((res) => {
                                  if (res.success && res.data) setPermissions(res.data);
                                });
                              } else {
                                toast.error(r.error ?? t("failedToSave"));
                              }
                            });
                          }}
                        >
                          {t("all")}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 px-2 text-xs text-destructive hover:text-destructive"
                          disabled={isPending}
                          title={t("revokeFromAllRoles")}
                          onClick={() => {
                            startTransition(async () => {
                              const r = await setPermissionForAllRoles({
                                permissionKey: perm.key,
                                granted: false,
                              });
                              if (r.success) {
                                setPermissions((prev) =>
                                  prev.map((p) =>
                                    p.key === perm.key ? { ...p, granted: false } : p
                                  )
                                );
                                toast.success(t("revokedFromAll", { label }));
                                getRolePermissions(selectedRole).then((res) => {
                                  if (res.success && res.data) setPermissions(res.data);
                                });
                              } else {
                                toast.error(r.error ?? t("failedToSave"));
                              }
                            });
                          }}
                        >
                          {t("none")}
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {filtered.length === 0 && (
                <div className="flex flex-col items-center justify-center py-16 text-center text-muted-foreground">
                  <Search className="mb-3 h-8 w-8 opacity-30" />
                  <p className="text-sm font-medium">{t("noPermissionsFound")}</p>
                  <p className="text-xs">{t("tryDifferentSearch")}</p>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
