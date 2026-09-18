import { contact } from "@/content/cta";
import { ContactLink } from "./ContactLink";

/**
 * The line shown in place of a list that is empty or could not be loaded. Every such case
 * ends the same way — get in touch — so the link to the contact form is always under it.
 */
export function Notice({ children }: { children: string }) {
  return (
    <div className="mt-8 flex flex-col items-start gap-4">
      <p className="max-w-2xl text-sm text-charbon/60">{children}</p>
      <ContactLink>{contact.cta}</ContactLink>
    </div>
  );
}
