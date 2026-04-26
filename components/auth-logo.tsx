"use client";

import Image from "next/image";
import Link from "next/link";

/**
 * Auth logo – Subrocket-style: symbol (icon) for light/dark, optional full logo.
 * Uses public/symbol_light.svg and symbol_dark.svg (CareNova branding).
 */
export function AuthLogo({
  size = 80,
  showLink = true,
  useFullLogo = false,
}: {
  size?: number;
  showLink?: boolean;
  useFullLogo?: boolean;
}) {
  const height = size;
  const width = useFullLogo ? undefined : size;

  const content = useFullLogo ? (
    <>
      <Image
        src="/Logo_light.svg"
        alt="CareNova"
        width={160}
        height={48}
        className="dark:hidden"
        priority
      />
      <Image
        src="/Logo_Dark.svg"
        alt="CareNova"
        width={160}
        height={48}
        className="hidden dark:block"
        priority
      />
    </>
  ) : (
    <>
      <Image
        src="/symbol_light.svg"
        alt="CareNova"
        width={width ?? 80}
        height={height}
        className="dark:hidden"
        priority
      />
      <Image
        src="/symbol_dark.svg"
        alt="CareNova"
        width={width ?? 80}
        height={height}
        className="hidden dark:block"
        priority
      />
    </>
  );

  if (showLink) {
    return (
      <Link
        href="/"
        className="focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 rounded-md"
        aria-label="CareNova home"
      >
        {content}
      </Link>
    );
  }

  return <div className="flex items-center justify-center">{content}</div>;
}
