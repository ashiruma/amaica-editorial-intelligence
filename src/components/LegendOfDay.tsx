import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Crown } from "lucide-react";

type Feature = {
  id: string;
  feature_date: string;
  headline: string;
  tribute: string;
  hero_image_url: string | null;
  draft_id: string | null;
  legends: {
    name: string;
    country: string | null;
    era: string | null;
    field: string | null;
  } | null;
};

import { getTodaySeedLegend } from "@/lib/editorial/seedLegends";

export function LegendOfDay() {
  const [feature, setFeature] = useState<Feature | null>(() => {
    const seed = getTodaySeedLegend();
    return {
      id: seed.id,
      feature_date: seed.feature_date,
      headline: seed.headline,
      tribute: seed.tribute,
      hero_image_url: seed.hero_image_url,
      draft_id: null,
      legends: {
        name: seed.name,
        country: seed.country,
        era: seed.era,
        field: seed.field,
      },
    };
  });

  useEffect(() => {
    supabase
      .from("legend_features")
      .select("id, feature_date, headline, tribute, hero_image_url, draft_id, legends(name, country, era, field)")
      .order("feature_date", { ascending: false })
      .limit(1)
      .maybeSingle()
      .then(({ data }) => {
        if (data) {
          const lData = data as unknown as Feature;
          const country = lData.legends?.country?.toLowerCase();
          // Strictly enforce Kenyan legends doctrine
          if (!country || country === "kenya") {
            setFeature(lData);
          }
        }
      })
      .catch((err) => console.warn("Could not query legend_features:", err));
  }, []);

  if (!feature) return null;
  const l = feature.legends;

  return (
    <section className="mb-10 bg-primary text-primary-foreground rounded shadow-elevated overflow-hidden border-2 border-accent/30">
      <div className="grid md:grid-cols-[1fr_1.4fr]">
        <div className="aspect-[4/3] md:aspect-auto bg-primary-mid relative overflow-hidden">
          {feature.hero_image_url ? (
            <img src={feature.hero_image_url} alt={l?.name || feature.headline} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center font-display text-primary-foreground/30 text-7xl">
              {l?.name?.[0] ?? "L"}
            </div>
          )}
          <div className="absolute top-3 left-3 bg-accent text-accent-foreground text-[10px] font-bold tracking-widest uppercase px-2.5 py-1 flex items-center gap-1.5 shadow-sm rounded-sm">
            <Crown size={12} /> Kenyan Legend of the Day
          </div>
        </div>
        <div className="p-6 md:p-8">
          <div className="label-eyebrow text-accent mb-2 font-semibold">
            {l?.name} · Kenya{l?.era ? ` · ${l.era}` : ""}
          </div>
          <h2 className="font-display text-2xl md:text-3xl leading-tight mb-3">{feature.headline}</h2>
          <div
            className="text-primary-foreground/85 text-sm leading-relaxed line-clamp-4 prose-invert"
            dangerouslySetInnerHTML={{ __html: feature.tribute }}
          />
          <Link
            to={`/legends/${feature.id}`}
            className="inline-block mt-4 text-xs font-medium tracking-widest uppercase border-b border-accent text-accent hover:text-primary-foreground transition"
          >
            Read the tribute →
          </Link>
        </div>
      </div>
    </section>
  );
}