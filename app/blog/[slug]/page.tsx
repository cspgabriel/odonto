import { getCachedClinic, getCachedLandingSettings } from "@/lib/cache";
import { getDefaultLandingSettingsForClinicType, mergeWithLandingDefaults } from "@/lib/constants/landing-defaults";
import { BlogDetailContent as DentalBlogDetailContent } from "@/components/landing/dental/blog-detail-content";
import { BlogDetailContent as GeneralBlogDetailContent } from "@/components/landing/general/blog-detail-content";
import { BlogDetailContent as OphthalmologyBlogDetailContent } from "@/components/landing/ophthalmology/blog-detail-content";
import { getBlogPostBySlug } from "@/lib/actions/blog-actions";
import { LANDING_CLINIC_DEMO_COOKIE } from "@/lib/preferences/constants";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import type { Metadata } from "next";

const VALID_CLINIC_TYPES = ["dental", "ophthalmology", "general"] as const;
type ClinicType = (typeof VALID_CLINIC_TYPES)[number];
function getEffectiveClinicType(dbType: string | undefined, cookieValue: string | undefined): ClinicType {
  if (cookieValue && VALID_CLINIC_TYPES.includes(cookieValue as ClinicType)) return cookieValue as ClinicType;
  if (dbType === "ophthalmology" || dbType === "general") return dbType as ClinicType;
  return "dental";
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const cookieStore = await cookies();
  const [landingSettingsRaw, post, clinic] = await Promise.all([
    getCachedLandingSettings(),
    getBlogPostBySlug(slug),
    getCachedClinic(),
  ]);
  const effectiveType = getEffectiveClinicType(clinic?.type, cookieStore.get(LANDING_CLINIC_DEMO_COOKIE)?.value);
  const settingsForType =
    effectiveType === "ophthalmology"
      ? await getCachedLandingSettings("ophthalmology")
      : effectiveType === "general"
        ? await getCachedLandingSettings("general")
        : landingSettingsRaw;
  const settings = mergeWithLandingDefaults(settingsForType ?? {}, effectiveType);

  if (!post) return { title: "Post Not Found | ClinicMaster" };

  const favicon = settings.branding?.faviconUrl || "/favicon.ico";
  return {
    title: `${post.title} | ${settings.branding?.brandName || "ClinicMaster"}`,
    description: post.seoDescription || post.excerpt,
    icons: { icon: favicon, shortcut: favicon, apple: favicon },
    openGraph: {
      title: post.seoTitle || post.title,
      description: post.seoDescription || post.excerpt || undefined,
      images: post.coverImage ? [post.coverImage] : [],
    },
  };
}

export default async function BlogDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const cookieStore = await cookies();
  const [settingsRaw, post, clinic] = await Promise.all([
    getCachedLandingSettings(),
    getBlogPostBySlug(slug),
    getCachedClinic(),
  ]);

  if (!post) notFound();

  const effectiveType = getEffectiveClinicType(clinic?.type, cookieStore.get(LANDING_CLINIC_DEMO_COOKIE)?.value);
  const settingsForType =
    effectiveType === "ophthalmology"
      ? await getCachedLandingSettings("ophthalmology")
      : effectiveType === "general"
        ? await getCachedLandingSettings("general")
        : settingsRaw;
  const settings = mergeWithLandingDefaults(settingsForType ?? {}, effectiveType);
  const isOphthalmology = effectiveType === "ophthalmology";
  const isGeneral = effectiveType === "general";
  const BlogDetail = isOphthalmology ? OphthalmologyBlogDetailContent : isGeneral ? GeneralBlogDetailContent : DentalBlogDetailContent;
  const themeColors =
    settings.colors ?? getDefaultLandingSettingsForClinicType(effectiveType).colors ?? undefined;

  return (
    <BlogDetail
      branding={settings.branding ?? undefined}
      colors={themeColors}
      dbPost={post ?? undefined}
      features={settings.content?.features}
      footer={settings.footer ?? undefined}
      contact={settings.contact ?? undefined}
      social={settings.social ?? undefined}
    />
  );
}
