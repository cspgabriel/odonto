import { headers } from "next/headers";

export async function getClientIp(): Promise<string | null> {
  try {
    const headersList = await headers();

    const forwardedFor = headersList.get("x-forwarded-for");
    if (forwardedFor) {
      const ips = forwardedFor.split(",").map((ip) => ip.trim());
      const firstIp = ips[0];
      if (firstIp) return firstIp;
    }

    const realIp = headersList.get("x-real-ip");
    if (realIp) return realIp;

    const cfConnectingIp = headersList.get("cf-connecting-ip");
    if (cfConnectingIp) return cfConnectingIp;

    return null;
  } catch {
    return null;
  }
}

export async function getUserAgent(): Promise<string | null> {
  try {
    const headersList = await headers();
    return headersList.get("user-agent");
  } catch {
    return null;
  }
}
