/**
 * CareNova – Seed storage buckets (create or update all 4 buckets)
 * Run: npm run db:buckets
 *
 * Uses SUPABASE_SERVICE_ROLE_KEY from .env to create/update buckets via Supabase JS client.
 * If a bucket already exists, its config is updated; otherwise it is created.
 * Also uploads default role avatars to the avatars bucket.
 */

import "dotenv/config";
import { readFileSync, existsSync } from "fs";
import { resolve } from "path";
import { createClient } from "@supabase/supabase-js";

const AVATAR_PATHS = [
  (role: string) => `public/${role}.png`,
  (role: string) => `public/avatars/${role}.png`,
  (role: string) => `public/images/avatars/${role}.png`,
  (role: string) => `public/assets/avatars/${role}.png`,
  (role: string) => `scripts/assets/avatars/${role}.png`,
];

function findAvatarPath(role: string): string | null {
  for (const toPath of AVATAR_PATHS) {
    const filePath = resolve(process.cwd(), toPath(role));
    if (existsSync(filePath)) return filePath;
  }
  return null;
}

const BUCKETS = [
  {
    name: "avatars",
    public: true,
    fileSizeLimit: 2_097_152, // 2MB
    allowedMimeTypes: ["image/jpeg", "image/png", "image/webp", "image/gif"] as string[],
  },
  {
    name: "logos",
    public: true,
    fileSizeLimit: 2_097_152, // 2MB
    allowedMimeTypes: ["image/jpeg", "image/png", "image/webp", "image/svg+xml"] as string[],
  },
  {
    name: "medical-attachments",
    public: true,
    fileSizeLimit: 10_485_760, // 10MB
    allowedMimeTypes: [
      "application/pdf",
      "image/jpeg",
      "image/png",
      "image/gif",
      "image/webp",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ] as string[],
  },
  {
    name: "landing-assets",
    public: true,
    fileSizeLimit: 5_242_880, // 5MB
    allowedMimeTypes: ["image/jpeg", "image/png", "image/webp", "image/svg+xml"] as string[],
  },
] as const;

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    console.error("Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env");
    process.exit(1);
  }

  const supabase = createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data: existingBuckets, error: listError } = await supabase.storage.listBuckets();
  if (listError) {
    console.error("Failed to list buckets:", listError.message);
    process.exit(1);
  }

  const existingNames = new Set((existingBuckets ?? []).map((b) => b.name));

  for (const bucket of BUCKETS) {
    const opts = {
      public: bucket.public,
      fileSizeLimit: bucket.fileSizeLimit,
      allowedMimeTypes: [...bucket.allowedMimeTypes],
    };

    if (existingNames.has(bucket.name)) {
      const { error: updateError } = await supabase.storage.updateBucket(bucket.name, opts);
      if (updateError) {
        console.error(`Failed to update bucket '${bucket.name}':`, updateError.message);
        process.exit(1);
      }
    } else {
      const { error: createError } = await supabase.storage.createBucket(bucket.name, opts);
      if (createError && !createError.message?.toLowerCase().includes("already exists")) {
        console.error(`Failed to create bucket '${bucket.name}':`, createError.message);
        process.exit(1);
      }
    }

    console.log(`✓ ${bucket.name} bucket ready`);
  }

  // Upload default role avatars to avatars bucket
  const roles = ["admin", "doctor", "receptionist", "nurse"];
  for (const role of roles) {
    const filePath = findAvatarPath(role);
    if (!filePath) {
      console.warn(`⚠ ${role} avatar not found (skipped) — looked in public/, public/avatars, public/images/avatars, public/assets/avatars, scripts/assets/avatars`);
      continue;
    }
    try {
      const file = readFileSync(filePath);
      const { error } = await supabase.storage
        .from("avatars")
        .upload(`avatars/${role}.png`, file, {
          contentType: "image/png",
          upsert: true,
        });
      if (error) {
        console.error(`✗ Failed to upload ${role} avatar:`, error.message);
      } else {
        console.log(`✓ ${role} avatar uploaded`);
      }
    } catch (err) {
      console.error(`✗ Failed to read/upload ${role} avatar:`, err instanceof Error ? err.message : err);
    }
  }

  console.log("All buckets and assets ready.");
  process.exit(0);
}

main().catch((err) => {
  console.error("Seed buckets failed:", err);
  process.exit(1);
});
