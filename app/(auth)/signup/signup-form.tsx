"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Eye, EyeOff } from "lucide-react";
import { signUp } from "@/lib/actions/auth-actions";
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

export function SignupForm() {
  const t = useTranslations("auth");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [role, setRole] = useState<string>("receptionist");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (password !== confirmPassword) {
      setError(t("errorPasswordMismatch"));
      return;
    }
    setLoading(true);
    try {
      const result = await signUp({
        email,
        password,
        fullName: fullName || undefined,
        phone: phone.trim() || undefined,
        role: role || undefined,
      });
      if (!result.success) {
        setError(result.error);
        setLoading(false);
        return;
      }
      // Staff must wait for admin approval; show pending message on login page (no dashboard access).
      window.location.href = "/login?pending=1";
    } catch {
      setError(t("errorGeneric"));
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="w-full grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-6">
      <div className="space-y-2">
        <Label htmlFor="signup-name">{t("fullName")}</Label>
        <Input
          id="signup-name"
          type="text"
          placeholder={t("enterFullName")}
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          required
          autoComplete="name"
          disabled={loading}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="signup-email">{t("email")}</Label>
        <Input
          id="signup-email"
          type="email"
          placeholder={t("enterEmail")}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          autoComplete="email"
          disabled={loading}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="signup-phone">{t("phone")}</Label>
        <Input
          id="signup-phone"
          type="tel"
          placeholder={t("enterPhone")}
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          autoComplete="tel"
          disabled={loading}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="signup-role">{t("role")}</Label>
        <Select value={role} onValueChange={setRole} disabled={loading}>
          <SelectTrigger id="signup-role" className="w-full">
            <SelectValue placeholder={t("selectRole")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="doctor">{t("roleDoctor")}</SelectItem>
            <SelectItem value="receptionist">{t("roleReceptionist")}</SelectItem>
            <SelectItem value="nurse">{t("roleNurse")}</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="signup-password">{t("password")}</Label>
        <div className="relative">
          <Input
            id="signup-password"
            type={showPassword ? "text" : "password"}
            placeholder={t("enterPassword")}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={8}
            autoComplete="new-password"
            disabled={loading}
            className="pr-10"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="text-muted-foreground hover:text-foreground absolute top-1/2 right-3 -translate-y-1/2 cursor-pointer"
            disabled={loading}
            aria-label={showPassword ? t("hidePassword") : t("showPassword")}
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="signup-confirm-password">{t("confirmPassword")}</Label>
        <div className="relative">
          <Input
            id="signup-confirm-password"
            type={showConfirmPassword ? "text" : "password"}
            placeholder={t("enterConfirmPassword")}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            minLength={8}
            autoComplete="new-password"
            disabled={loading}
            className="pr-10"
          />
          <button
            type="button"
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            className="text-muted-foreground hover:text-foreground absolute top-1/2 right-3 -translate-y-1/2 cursor-pointer"
            disabled={loading}
            aria-label={showConfirmPassword ? t("hidePassword") : t("showPassword")}
          >
            {showConfirmPassword ? (
              <EyeOff className="h-4 w-4" />
            ) : (
              <Eye className="h-4 w-4" />
            )}
          </button>
        </div>
      </div>
      {error && (
        <p className="text-sm text-destructive col-span-1 sm:col-span-2" role="alert">
          {error}
        </p>
      )}
      <Button
        type="submit"
        className="w-full cursor-pointer col-span-1 sm:col-span-2"
        disabled={loading}
      >
        {loading ? t("creatingAccount") : t("createAccount")}
      </Button>
    </form>
  );
}
