import { LazyEight } from "@/components/brand/LazyEight";
import { Section } from "@/components/ui/Section";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { objet } from "@/content/objet";

export function Objet() {
  return (
    <Section
      id="objet"
      background="rose-sombre"
      contained={false}
      aria-labelledby="objet-title"
      className="relative overflow-hidden"
    >
      <LazyEight
        durationMs={36000}
        strokeWidth={1.25}
        className="pointer-events-none absolute top-1/2 left-1/2 h-[110%] w-[110%] -translate-x-1/2 -translate-y-1/2 text-rose-sombre"
      />

      <div className="relative z-10 mx-auto flex max-w-3xl flex-col items-center gap-8 px-6 text-center">
        <SectionHeading
          id="objet-title"
          eyebrow={objet.eyebrow}
          title={objet.title}
          tone="light"
          align="center"
        />

        <div className="flex max-w-2xl flex-col gap-4">
          {objet.body.map((paragraph) => (
            <p key={paragraph} className="text-lg leading-relaxed text-creme/85">
              {paragraph}
            </p>
          ))}
        </div>

        <ul className="flex flex-wrap justify-center gap-3">
          {objet.activities.map((activity) => (
            <li
              key={activity}
              className="rounded-full border border-creme/25 bg-creme/5 px-4 py-2 text-sm font-semibold text-creme/90"
            >
              {activity}
            </li>
          ))}
        </ul>
      </div>
    </Section>
  );
}
