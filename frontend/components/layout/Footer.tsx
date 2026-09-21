import { BrainGymTrademark } from "@/components/brand/BrainGymTrademark";
import { Logo } from "@/components/brand/Logo";
import { footer } from "@/content/cta";
import { navLinks, site } from "@/content/site";

export function Footer() {
  return (
    <footer className="bg-rose-sombre text-creme">
      <div className="mx-auto grid max-w-6xl gap-12 px-6 py-16 md:grid-cols-[1.2fr_1fr_1fr] md:py-20">
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-3 text-creme">
            <Logo title="" className="h-12 w-auto" />
            <span className="font-display text-xl">
              Re-Source<span className="italic"> Et Moi</span>
            </span>
          </div>
          <p className="max-w-xs font-display text-lg text-creme/85 italic">{footer.tagline}</p>
        </div>

        <nav aria-label="Navigation du pied de page" className="flex flex-col gap-3">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-creme/60">
            Explorer
          </p>
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-sm text-creme/85 transition-colors hover:text-creme"
            >
              {link.label}
            </a>
          ))}
        </nav>

        <div className="flex flex-col gap-3">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-creme/60">
            Association
          </p>
          <a
            href={`mailto:${site.email}`}
            className="text-sm text-creme/85 transition-colors hover:text-creme"
          >
            {site.email}
          </a>
          {footer.legalLinks.map((link) => (
            <a
              key={link.label}
              href={link.href}
              className="text-sm text-creme/85 transition-colors hover:text-creme"
            >
              {link.label}
            </a>
          ))}
        </div>
      </div>

      <div className="border-creme/15 border-t">
        <div className="mx-auto flex max-w-6xl flex-col gap-2 px-6 py-6 text-xs text-creme/55 md:flex-row md:items-center md:justify-between">
          <p>
            © {site.name} · {footer.rights}
          </p>
          <BrainGymTrademark className="max-w-md md:text-right" />
        </div>
      </div>
    </footer>
  );
}
