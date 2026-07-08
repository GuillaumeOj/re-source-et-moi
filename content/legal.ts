// Shared shape for the standalone legal pages (mentions légales, politique de
// confidentialité). The copy lives in the per-page content files; this module
// only describes their structure, so neither page depends on its sibling.

export type LegalSection = { heading: string; body: string[] };

export type LegalPage = {
  eyebrow: string;
  title: string;
  updatedAt: string;
  intro: string;
  sections: LegalSection[];
};
