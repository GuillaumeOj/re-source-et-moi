import { ExternalLink } from "@/components/ui/ExternalLink";
import { brainGymTrademark } from "@/content/marques";

/** The trademark sentence Brain Gym France requires, with its site linked. */
export function BrainGymTrademark({ className }: { className?: string }) {
  return (
    <p className={className}>
      {brainGymTrademark.lead}
      <ExternalLink href={brainGymTrademark.link.href}>{brainGymTrademark.link.label}</ExternalLink>
    </p>
  );
}
