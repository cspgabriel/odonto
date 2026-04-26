/**
 * LocalBusiness / medical schema for landing pages (SEO JSON-LD).
 */

interface LocalBusinessSchemaProps {
  name: string;
  description: string;
  phone?: string | null;
  address?: string | null;
  url: string;
  clinicType: "dental" | "general" | "ophthalmology";
}

export function LocalBusinessSchema({
  name,
  description,
  phone,
  address,
  url,
  clinicType,
}: LocalBusinessSchemaProps) {
  const schemaType =
    clinicType === "dental"
      ? "Dentist"
      : clinicType === "ophthalmology"
        ? "Physician"
        : "MedicalClinic";

  const medicalSpecialty =
    clinicType === "dental"
      ? "Dentistry"
      : clinicType === "ophthalmology"
        ? "Ophthalmology"
        : "General Practice";

  const schema = {
    "@context": "https://schema.org",
    "@type": schemaType,
    name,
    description,
    url,
    ...(phone && { telephone: phone }),
    ...(address && {
      address: {
        "@type": "PostalAddress",
        streetAddress: address,
      },
    }),
    medicalSpecialty,
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}
