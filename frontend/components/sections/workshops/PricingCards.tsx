import { connection } from "next/server";
import { Card } from "@/components/ui/Card";
import { tarifs } from "@/content/tarifs";
import { getPricingTypes } from "@/lib/api/client";
import { formatPrice } from "@/lib/format";
import { Notice } from "./Notice";

/**
 * The tariff cards, fetched from the backend.
 *
 * Separate from the agenda beside it so one feed failing does not take the other down —
 * and so the section's heading, which the nav links to, renders either way.
 */
export async function PricingCards() {
  // Request-time render, for the same reason as AgendaList — see the comment there.
  await connection();

  const pricingTypes = await getPricingTypes().catch((error: unknown) => {
    console.error("[PricingCards] backend unreachable:", error);
    return null;
  });

  // An empty tariff list is not a meaningful state the way an empty agenda is — the site
  // always has prices — so it reads as a failure rather than getting its own copy.
  if (pricingTypes === null || pricingTypes.length === 0) {
    return <Notice>{tarifs.unavailable}</Notice>;
  }

  return (
    <div className="mt-8 grid gap-6 md:grid-cols-2">
      {pricingTypes.map((pricingType, index) => (
        <Card key={pricingType.id} delayMs={index * 80} className="gap-5 bg-white">
          <h4 className="font-display text-xl text-rose-sombre">{pricingType.name}</h4>
          <ul className="flex flex-col gap-3">
            {pricingType.prices.map((price) => (
              <li
                key={price.id}
                className="flex items-baseline justify-between gap-4 border-rose-sombre/10 border-b pb-3 last:border-b-0 last:pb-0"
              >
                <span className="text-base text-charbon/80">{price.description}</span>
                <span className="font-display text-xl text-rose-sombre">
                  {formatPrice(price.amount, price.on_demand)}
                </span>
              </li>
            ))}
          </ul>
          {pricingType.description && (
            <p className="text-sm leading-relaxed text-charbon/60">{pricingType.description}</p>
          )}
        </Card>
      ))}
    </div>
  );
}
