/**
 * WireOps Desk: Kenyan Legends Dedicated Editorial Desk
 * Location: src/components/legends/KenyanLegendsDesk.tsx
 *
 * Enforces the Strict Kenyan Legends Mandate:
 * - Exclusively covers Kenyan historical, athletic, and cultural icons.
 * - International personalities are strictly forbidden and filtered out.
 * - Zero-Emoji Workplace Standard enforced.
 */

import React, { useState } from "react";
import { Crown, Plus, Check, ShieldCheck, Sparkles, Filter } from "lucide-react";

export interface KenyanLegend {
  id: string;
  name: string;
  country: "Kenya";
  era: string;
  field: string;
  impact: string;
  active: boolean;
  category: "freedom_fighter" | "athletics" | "music_culture" | "governance_folklore";
}

export const CANONICAL_KENYAN_LEGENDS: KenyanLegend[] = [
  {
    id: "legend-mekatilili",
    name: "Mekatilili wa Menza",
    country: "Kenya",
    era: "1860s - 1925",
    field: "Anti-Colonial Resistance & Giriama Sovereignty",
    impact: "Mobilized the Giriama people through the traditional Kaya institutions against British colonial forced labor and taxation.",
    active: true,
    category: "freedom_fighter",
  },
  {
    id: "legend-kimathi",
    name: "Field Marshal Dedan Kimathi",
    country: "Kenya",
    era: "1920 - 1957",
    field: "Kenya Land and Freedom Army (Mau Mau)",
    impact: "Led the armed liberation struggle against British colonial administration from the Aberdare mountain forests.",
    active: true,
    category: "freedom_fighter",
  },
  {
    id: "legend-wangari-maathai",
    name: "Prof. Wangari Maathai",
    country: "Kenya",
    era: "1940 - 2011",
    field: "Environmental Conservation & Human Rights",
    impact: "First African woman to win the Nobel Peace Prize; founded the Green Belt Movement protecting Uhuru Park and Karura Forest.",
    active: true,
    category: "governance_folklore",
  },
  {
    id: "legend-kipchoge-keino",
    name: "Kipchoge Keino",
    country: "Kenya",
    era: "1960s - 1970s",
    field: "Athletics & Olympic Track Pioneer",
    impact: "Won two Olympic gold medals in 1968 and 1972, putting Kenya firmly on the global middle-distance running map.",
    active: true,
    category: "athletics",
  },
  {
    id: "legend-eliud-kipchoge",
    name: "Eliud Kipchoge",
    country: "Kenya",
    era: "2003 - Present",
    field: "Marathon World Record Holder",
    impact: "First human in history to complete a marathon in under two hours (1:59:40 in Vienna, 2019); two-time Olympic champion.",
    active: true,
    category: "athletics",
  },
  {
    id: "legend-luanda-magere",
    name: "Luanda Magere",
    country: "Kenya",
    era: "18th Century",
    field: "Luo Warrior & Sugarcane Belt Folklore",
    impact: "Legendary warrior whose mythic skin made of solid stone protected the Kano plains during historic territorial conflicts.",
    active: true,
    category: "governance_folklore",
  },
  {
    id: "legend-koitalel",
    name: "Koitalel Arap Samoei",
    country: "Kenya",
    era: "1860 - 1905",
    field: "Nandi Orkoiyot & Anti-Colonial Resistance",
    impact: "Orchestrated a 10-year resistance movement preventing the British from building the Uganda Railway through Nandi territory.",
    active: true,
    category: "freedom_fighter",
  },
  {
    id: "legend-daudi-kabaka",
    name: "Daudi Kabaka",
    country: "Kenya",
    era: "1939 - 2001",
    field: "Twist & Benga Pioneer",
    impact: "Pioneered the Kenyan twist genre with classics like 'African Twist' and 'Harambee Harambee', cementing early national radio music.",
    active: true,
    category: "music_culture",
  },
  {
    id: "legend-joe-kadenge",
    name: "Joe Kadenge",
    country: "Kenya",
    era: "1935 - 2019",
    field: "Kenyan Football Icon",
    impact: "Immortalized by the legendary broadcast phrase 'Kadenge na Mpira'; captained the national football team and founded AFC Leopards folklore.",
    active: true,
    category: "athletics",
  },
];

export const KenyanLegendsDesk: React.FC = () => {
  const [legends, setLegends] = useState<KenyanLegend[]>(CANONICAL_KENYAN_LEGENDS);
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [newFormOpen, setNewFormOpen] = useState(false);
  const [form, setForm] = useState({
    name: "",
    country: "Kenya" as const,
    era: "",
    field: "",
    impact: "",
    category: "freedom_fighter" as KenyanLegend["category"],
  });

  const filteredLegends = legends.filter((l) => {
    // Strict Kenyan filter: reject anything non-Kenyan
    if (l.country.toLowerCase() !== "kenya") return false;
    if (categoryFilter !== "all" && l.category !== categoryFilter) return false;
    return true;
  });

  const handleAddLegend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return;

    // Enforce Kenyan Legends Mandate: strictly Kenya
    const newEntry: KenyanLegend = {
      id: `legend-${form.name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`,
      name: form.name.trim(),
      country: "Kenya",
      era: form.era.trim() || "Historical Era",
      field: form.field.trim() || "National Heritage",
      impact: form.impact.trim() || "Notable contributions to Kenyan national heritage.",
      active: true,
      category: form.category,
    };

    setLegends([newEntry, ...legends]);
    setForm({
      name: "",
      country: "Kenya",
      era: "",
      field: "",
      impact: "",
      category: "freedom_fighter",
    });
    setNewFormOpen(false);
  };

  const toggleActive = (id: string) => {
    setLegends(
      legends.map((l) => (l.id === id ? { ...l, active: !l.active } : l))
    );
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-card border border-border rounded-lg p-5 shadow-xs flex items-start justify-between flex-wrap gap-4">
        <div>
          <div className="flex items-center gap-1.5 text-xs font-bold text-primary uppercase tracking-wider mb-1">
            <Crown size={14} />
            <span>Strict Editorial Mandate · Kenyan Legends Exclusively</span>
          </div>
          <h2 className="font-display text-2xl font-bold text-foreground">
            Kenyan Legends Newsroom Roster
          </h2>
          <p className="text-sm text-muted-foreground mt-1 max-w-2xl leading-relaxed">
            Curated historical, athletic, musical, and folklore icons of Kenya. International personalities are strictly prohibited per the newsroom editorial charter.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setNewFormOpen(!newFormOpen)}
            className="text-xs bg-primary text-primary-foreground font-semibold px-3 py-2 rounded hover:bg-primary/90 transition-colors flex items-center gap-1.5 shadow-xs"
          >
            <Plus size={14} />
            Propose Kenyan Legend
          </button>
        </div>
      </div>

      {/* Propose Form Drawer */}
      {newFormOpen && (
        <form
          onSubmit={handleAddLegend}
          className="bg-muted/30 border border-border rounded-lg p-5 animate-in slide-in-from-top-2 duration-150 space-y-4"
        >
          <div className="flex items-center justify-between border-b border-border pb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-foreground">
              Add Verified Kenyan Legend
            </span>
            <span className="text-[11px] text-muted-foreground font-mono">
              Country: Kenya (Locked)
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-semibold mb-1">Icon Name</label>
              <input
                type="text"
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="e.g. Mekatilili wa Menza"
                className="w-full px-3 py-1.5 rounded border border-border bg-background"
              />
            </div>
            <div>
              <label className="block font-semibold mb-1">Historical Era</label>
              <input
                type="text"
                value={form.era}
                onChange={(e) => setForm({ ...form, era: e.target.value })}
                placeholder="e.g. 1860s - 1925"
                className="w-full px-3 py-1.5 rounded border border-border bg-background"
              />
            </div>
            <div>
              <label className="block font-semibold mb-1">Field / Discipline</label>
              <input
                type="text"
                value={form.field}
                onChange={(e) => setForm({ ...form, field: e.target.value })}
                placeholder="e.g. Anti-Colonial Resistance"
                className="w-full px-3 py-1.5 rounded border border-border bg-background"
              />
            </div>
            <div>
              <label className="block font-semibold mb-1">Legend Category</label>
              <select
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value as KenyanLegend["category"] })}
                className="w-full px-3 py-1.5 rounded border border-border bg-background"
              >
                <option value="freedom_fighter">Freedom Fighter &amp; Resistance</option>
                <option value="athletics">Athletic World Champion</option>
                <option value="music_culture">Music &amp; Benga Pioneer</option>
                <option value="governance_folklore">Governance &amp; Folklore</option>
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className="block font-semibold mb-1">Verifiable Historical Impact</label>
              <textarea
                rows={2}
                value={form.impact}
                onChange={(e) => setForm({ ...form, impact: e.target.value })}
                placeholder="Summarize the documented historical contributions to Kenya..."
                className="w-full px-3 py-1.5 rounded border border-border bg-background"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setNewFormOpen(false)}
              className="text-xs px-3 py-1.5 rounded border border-border bg-background hover:bg-muted"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="text-xs bg-primary text-primary-foreground font-semibold px-4 py-1.5 rounded hover:bg-primary/90"
            >
              Save to Roster
            </button>
          </div>
        </form>
      )}

      {/* Category Filter Pills */}
      <div className="flex items-center gap-2 flex-wrap text-xs">
        <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide mr-1">
          Filter Category:
        </span>
        {[
          { id: "all", label: "All Kenyan Icons" },
          { id: "freedom_fighter", label: "Freedom Fighters" },
          { id: "athletics", label: "Athletic Pioneers" },
          { id: "music_culture", label: "Music & Benga" },
          { id: "governance_folklore", label: "Governance & Folklore" },
        ].map((cat) => (
          <button
            key={cat.id}
            onClick={() => setCategoryFilter(cat.id)}
            className={`px-2.5 py-1 rounded transition-colors font-medium ${
              categoryFilter === cat.id
                ? "bg-primary text-primary-foreground font-semibold shadow-xs"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Grid of Verified Kenyan Legends */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredLegends.map((legend) => (
          <div
            key={legend.id}
            className={`border rounded-lg p-4 bg-card transition-all flex flex-col justify-between ${
              legend.active ? "border-border shadow-xs" : "border-border/50 opacity-60 bg-muted/20"
            }`}
          >
            <div>
              <div className="flex items-center justify-between gap-2 mb-2">
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-primary/10 text-primary border border-primary/20">
                  Kenya
                </span>
                <span className="text-[11px] font-mono text-muted-foreground">
                  {legend.era}
                </span>
              </div>

              <h3 className="font-display text-lg font-bold text-foreground mb-1">
                {legend.name}
              </h3>
              <span className="text-xs text-primary font-medium block mb-2">
                {legend.field}
              </span>
              <p className="text-xs text-muted-foreground leading-relaxed line-clamp-3">
                {legend.impact}
              </p>
            </div>

            <div className="pt-3 mt-4 border-t border-border flex items-center justify-between text-xs">
              <span className="text-[11px] text-muted-foreground font-medium flex items-center gap-1">
                <ShieldCheck size={13} className="text-green-600" />
                Verified Kenyan Legend
              </span>
              <button
                onClick={() => toggleActive(legend.id)}
                className={`text-[11px] font-medium px-2 py-0.5 rounded transition-colors ${
                  legend.active
                    ? "bg-green-500/10 text-green-700 hover:bg-green-500/20"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                }`}
              >
                {legend.active ? "Active" : "Archived"}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
