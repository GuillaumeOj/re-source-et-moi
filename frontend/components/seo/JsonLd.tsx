/** One structured-data block. Every JSON-LD <script> on the site goes through here. */
export function JsonLd({ data }: { data: object }) {
  return (
    <script
      type="application/ld+json"
      // biome-ignore lint/security/noDangerouslySetInnerHtml: JSON-LD is static, server-generated
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
