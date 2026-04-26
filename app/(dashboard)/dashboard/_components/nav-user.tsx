"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut, Loader2, Settings } from "lucide-react";
import { useTranslations } from "@/lib/i18n";
import Link from "next/link";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { createClient } from "@/lib/supabase/client";
import { getInitials } from "@/lib/utils";
import { ROLE_INIT_AVATARS } from "@/lib/constants/avatars";
import type { UserRole } from "@/lib/auth";

export function NavUser({
  user,
}: {
  user: {
    name: string;
    email: string;
    avatar?: string | null;
    role: UserRole;
  };
}) {
  const router = useRouter();
  const t = useTranslations("user");
  const tCommon = useTranslations("common");
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const customAvatar = user.avatar?.trim() || null;
  const avatarSrc = customAvatar || ROLE_INIT_AVATARS[user.role];

  async function handleLogout() {
    setIsLoggingOut(true);
    try {
      const supabase = createClient();
      await supabase.auth.signOut();
      router.push("/login");
      router.refresh();
    } catch {
      setIsLoggingOut(false);
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="relative inline-flex h-7 w-7 cursor-pointer items-center justify-center rounded-full border border-border bg-muted transition-all duration-200 hover:bg-muted/80 hover:shadow-md focus-visible:outline-none focus-visible:ring-0 p-0 m-0"
        >
          <Avatar className="h-7 w-7 rounded-full">
            <AvatarImage
              src={avatarSrc}
              alt={user.name}
              className="h-full w-full object-cover rounded-full"
              referrerPolicy="no-referrer"
            />
            <AvatarFallback className="rounded-full text-xs bg-primary text-primary-foreground">
              {getInitials(user.name)}
            </AvatarFallback>
          </Avatar>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        className="mt-2 min-w-56 rounded-lg"
        side="bottom"
        align="end"
        sideOffset={4}
      >
        <DropdownMenuLabel className="p-0 font-normal">
          <Link
            href="/dashboard/settings?tab=profile"
            className="hover:bg-accent flex items-center gap-2 rounded-md px-1 py-1.5 text-left text-sm transition-colors"
          >
            <Avatar className="h-8 w-8 rounded-full">
              <AvatarImage
                src={avatarSrc}
                alt={user.name}
                referrerPolicy="no-referrer"
              />
              <AvatarFallback className="rounded-full bg-primary text-primary-foreground">
                {getInitials(user.name)}
              </AvatarFallback>
            </Avatar>
            <div className="grid flex-1 text-left text-sm leading-tight">
              <span className="truncate font-medium">{user.name}</span>
              <span className="text-muted-foreground truncate text-xs">
                {user.email}
              </span>
            </div>
          </Link>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem asChild className="cursor-pointer">
            <Link href="/dashboard/settings">
              <Settings className="size-4" />
              {t("settings")}
            </Link>
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <DropdownMenuItem
              className="cursor-pointer text-red-600 hover:bg-red-50 hover:text-red-700 hover:[&_svg]:text-red-700 dark:hover:bg-red-950/20 focus:bg-red-50 focus:text-red-700 focus:[&_svg]:text-red-700 dark:focus:bg-red-950/20 [&_svg]:!text-red-600 dark:[&_svg]:!text-red-400"
              onSelect={(e) => e.preventDefault()}
            >
              <LogOut className="size-4" />
              {t("logOut")}
            </DropdownMenuItem>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{t("logOutConfirm")}</AlertDialogTitle>
              <AlertDialogDescription>
                {t("logOutDescription")}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={isLoggingOut}>{tCommon("cancel")}</AlertDialogCancel>
              <Button
                type="button"
                onClick={handleLogout}
                disabled={isLoggingOut}
                className="bg-red-600 text-white hover:bg-red-700 min-w-[7rem]"
              >
                {isLoggingOut ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden />
                    {t("loggingOut")}
                  </>
                ) : (
                  t("logOut")
                )}
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
