import { connection } from "next/server";
import { Card } from "@/components/ui/Card";
import { Reveal } from "@/components/ui/Reveal";
import { tarifs } from "@/content/tarifs";
import { getPricingTypes } from "@/lib/api/client";
import { formatPrice } from "@/lib/format";
import { Notice } from "./Notice";

/**
 * The "Tarifs" sub-section — its heading and one card per tariff group, fetched from the
 * backend.
 *
 * The heading lives here rather than in the synchronous section around it because whether
 * it renders at all depends on the data: with no tariffs set up, the sub-section is hidden
 * entirely instead of announcing prices it then cannot show. Separate from the agenda so
 * one feed failing does not take the other down.
 */
export async function PricingSection() {
  // Request-time render, for the same reason as AgendaList — see the comment there.
  await connection();

  const pricingTypes = await getPricingTypes().catch((error: unknown) => {
    console.error("[PricingSection] backend unreachable:", error);
    return null;
  });

  // A group whose lines are all unpublished still comes back from the API (the admin may be
  // mid-edit); an empty card says nothing, so it is dropped here.
  const failed = pricingTypes === null;
  const groups = (pricingTypes ?? []).filter((pricingType) => pricingType.prices.length > 0);

  // Nothing set up: hide the sub-section. An outage is different — the tariffs exist, so the
  // heading stays and the notice says they cannot be shown right now.
  if (!failed && groups.length === 0) {
    return null;
  }

  return (
    <>
      <Reveal className="mt-16 flex flex-col gap-2">
        <h3 className="font-display text-2xl text-rose-vif">{tarifs.title}</h3>
        <p className="max-w-2xl text-base leading-relaxed text-charbon/80">{tarifs.intro}</p>
      </Reveal>

      {failed ? (
        <Notice>{tarifs.unavailable}</Notice>
      ) : (
        <div className="mt-8 grid gap-6 md:grid-cols-2">
          {groups.map((pricingType, index) => (
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
      )}
    </>
  );
}
