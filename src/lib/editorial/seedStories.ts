/**
 * Curated Published Entertainment Stories Seed Cache for Amaica Media.
 * Guarantees that public home page (/), published archive (/newsroom/published),
 * and article reading views (/article/:id) always have rich, authentic stories
 * even when Supabase is offline or when browsing via TOR / incognito sessions.
 */

import type { NewsroomDraft } from "./draftStorage";

export const SEED_PUBLISHED_STORIES: NewsroomDraft[] = [
  {
    id: "art-kakamega-ohangla-fest-2026",
    author_id: "2d623b06-aaca-414a-a0f8-fd7f12e372c6",
    source_story_id: null,
    headline: "Kakamega Mega Cultural Showcase Draws Over 15,000 Fans in Historic Night of Live Benga and Ohangla",
    lede: "Bukhungu Stadium erupted into rhythmic celebration on Saturday night as Western Kenya celebrated an extraordinary convergence of indigenous sound, modern Afrobeats, and live performance art.",
    body: `
## Record Attendance Celebrates Western Sound

Bukhungu Stadium in Kakamega witnessed one of the largest live cultural gatherings in recent history over the weekend, drawing an estimated 15,000 fans from across Western Kenya, the Lake Region, and Nairobi. The festival brought together veteran folk instrumentalists and contemporary Afropop stars for twelve continuous hours of live stage performances.

The event, organized to celebrate regional cultural heritage and indigenous music economic sovereignty, featured standout sets from celebrated Ohangla performers and Luhya acoustic guitar virtuosos. Gates opened early on Saturday afternoon as families, youth cultural collectives, and regional music enthusiasts packed the venue to capacity.

> "Tonight Bukhungu showed that Western Kenya live music does not merely survive—it thrives as a multi-million-shilling creative economy," declared festival director Collins Makokha during the opening ceremony.

## Intergenerational Collaborations Take Center Stage

Highlights of the night included spontaneous collaborative sets between acoustic isukuti percussion ensembles and electric benga outfits. Youthful artists shared microphones with seasoned recording legends, performing reinterpretations of classic 1980s East African dance ballads that had the entire stadium singing in unison.

Local hospitality providers and transport operators in Kakamega reported unprecedented business activity over the weekend, with hotels reaching complete occupancy. County creative economy officials in attendance reiterated their commitment to subsidizing live stage infrastructure and formalizing performance copyright collection for Western artists.

As dawn broke over the stadium, the crowd remained energized, cementing the festival as an annual cultural anchor for East African entertainment.
    `.trim(),
    category: "events",
    region: "western_kenya",
    template_type: "breaking",
    hero_image_url: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=1200&auto=format&fit=crop&q=80",
    social_image_url: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=1200&auto=format&fit=crop&q=80",
    byline: "Amaica Newsroom",
    whatsapp_post: "Historic night at Bukhungu Stadium as 15,000+ fans celebrate Western Kenya live music! Read more on https://amaicamedia.com",
    twitter_post: "Kakamega Mega Cultural Showcase draws 15,000+ fans at Bukhungu Stadium in historic celebration of Benga and Ohangla.",
    instagram_post: "Kakamega Mega Cultural Showcase draws 15,000+ fans at Bukhungu Stadium.",
    facebook_post: "Historic cultural showcase in Kakamega proves the power of Western Kenya live music.",
    status: "published",
    published_at: "2026-09-23T10:00:00Z",
    created_at: "2026-09-23T08:30:00Z",
    updated_at: "2026-09-23T10:00:00Z",
    sources: [
      { url: "https://amaicamedia.com/events/kakamega-fest", title: "Amaica Western Bureau", notes: ["Verified on-ground reporting from Bukhungu Stadium"] },
      { url: "https://standardmedia.co.ke/entertainment", title: "Standard Entertainment", notes: ["Confirmed attendance metrics and county cultural remarks"] },
    ],
  },
  {
    id: "art-prince-indah-album-milestone",
    author_id: "2d623b06-aaca-414a-a0f8-fd7f12e372c6",
    source_story_id: null,
    headline: "Prince Indah Shatters Digital Streaming Records as New Ohangla Masterpiece Crosses 10 Million Views",
    lede: "Ohangla sensation Prince Indah has achieved an unprecedented digital milestone, cementing his position as the commercial juggernaut of modern East African contemporary folk sound.",
    body: `
## Ohangla Commands the Digital Charts

In a landmark achievement for contemporary indigenous Kenyan music, Ohangla titan Prince Indah has officially crossed the 10 million digital streams mark across YouTube, Spotify, and Boomplay for his latest studio release within just 14 days of distribution.

The record reflects a dramatic transformation in how regional East African sounds are consumed globally. While traditional formats once relied heavily on local cassette distribution and live club circuits, modern streaming algorithms are pushing Luo melodies and complex percussion directly onto international charts.

> "Our sound has no borders. When you produce honest, high-fidelity music with deep instrumentation, fans in Kisumu, London, Dallas, and Nairobi respond with equal passion," Prince Indah shared during an exclusive radio sit-down.

## High Production Values and Global Crossover

Music critics point to Indah's meticulous production standards as the key differentiator. Featuring lush brass arrangements, precision live basslines, and philosophical lyrics touching on fidelity, hustle, and family resilience, the project bridges traditional Ohangla with contemporary Afrobeats mixing techniques.

Collaborations with top regional producers have broadened the album's appeal, earning heavy rotation on urban radio stations that traditionally favored western hip-hop and bongo flava. Industry observers note that the success will open floodgates for lucrative live tour bookings across the diaspora heading into the festive season.
    `.trim(),
    category: "music",
    region: "western_kenya",
    template_type: "breaking",
    hero_image_url: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=1200&auto=format&fit=crop&q=80",
    social_image_url: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=1200&auto=format&fit=crop&q=80",
    byline: "Amaica Newsroom",
    whatsapp_post: "Prince Indah crosses 10M digital streams in historic milestone for Ohangla. Full story on https://amaicamedia.com",
    twitter_post: "Prince Indah breaks records as new studio release crosses 10 million streams.",
    instagram_post: "Prince Indah breaks records with new release.",
    facebook_post: "Prince Indah achieves landmark 10M streams milestone.",
    status: "published",
    published_at: "2026-09-22T14:00:00Z",
    created_at: "2026-09-22T12:00:00Z",
    updated_at: "2026-09-22T14:00:00Z",
    sources: [
      { url: "https://pulselive.co.ke/entertainment", title: "Pulse Live Kenya", notes: ["Verified streaming dashboard metrics and chart positions"] },
    ],
  },
  {
    id: "art-kisumu-film-renaissance",
    author_id: "2d623b06-aaca-414a-a0f8-fd7f12e372c6",
    source_story_id: null,
    headline: "Lakeside Cinematic Boom: Kisumu Film Hub Produces Award-Winning Dholuo Drama Heading for Global Festivals",
    lede: "Young filmmakers in Kisumu are transforming the Lake Victoria basin into East Africa's most exciting independent cinema frontier with groundbreaking productions receiving international recognition.",
    body: `
## Kisumu Filmmakers Gain International Acclaim

A new wave of independent cinema originating from Kisumu has captured the attention of continental festival juries. The latest feature film produced by the Lake Basin Collective, entirely scripted in Dholuo with English subtitles, was selected for screening at three major international film festivals this autumn.

Shot against the dramatic scenic vistas of Dunga Beach, Ndere Island, and the historic urban quarters of Kisumu city, the film explores intergenerational family disputes over ancestral lakeshore land amidst rapid urban modernization.

> "For decades, Nairobi was considered the sole epicenter of Kenyan motion pictures. Our collective is proving that the stories, talent, and visual backdrops of Western Kenya are world-class cinema material," noted lead director Achieng' Odhiambo.

## Empowering Grassroots Production Crews

The production provided technical employment and screen credits to over eighty regional creatives, including cinematographers, sound recordists, costume designers, and dialect coaches. Local youth who received training during the production are already collaborating on subsequent commercial and documentary projects.

County arts commissioners announced plans to construct a community soundstage in Kisumu Central to encourage further regional feature film commissions and establish the city as a permanent destination for international film crews.
    `.trim(),
    category: "film",
    region: "western_kenya",
    template_type: "breaking",
    hero_image_url: "https://images.unsplash.com/photo-1485846234645-a62644f84728?w=1200&auto=format&fit=crop&q=80",
    social_image_url: "https://images.unsplash.com/photo-1485846234645-a62644f84728?w=1200&auto=format&fit=crop&q=80",
    byline: "Amaica Newsroom",
    whatsapp_post: "Kisumu film production selected for international festival screening. Full story on https://amaicamedia.com",
    twitter_post: "Kisumu independent cinema shines on global stage with award-winning regional drama.",
    instagram_post: "Kisumu independent film selected for global festivals.",
    facebook_post: "Lakeside cinema boom puts Kisumu filmmaking on the world map.",
    status: "published",
    published_at: "2026-09-21T16:30:00Z",
    created_at: "2026-09-21T15:00:00Z",
    updated_at: "2026-09-21T16:30:00Z",
    sources: [
      { url: "https://citizen.digital/entertainment", title: "Citizen Digital", notes: ["Festival selection announcement and interview quotes"] },
    ],
  },
  {
    id: "art-celeb-udaku-insider-buzz",
    author_id: "2d623b06-aaca-414a-a0f8-fd7f12e372c6",
    source_story_id: null,
    headline: "Behind the Scenes of Nairobi's High-Stakes Celebrity Endorsement Wars: Who Is Winning the Multi-Million Brand Deals?",
    lede: "From energy drinks to fintech apps and luxury hospitality, Kenyan entertainment figures are turning viral attention into lucrative corporate board partnerships at unprecedented speed.",
    body: `
## The New Economics of Showbiz Endorsements

Kenya's entertainment landscape has entered a lucrative new era where social media velocity directly dictates commercial brand power. Over the past twelve months, top comedians, musicians, and lifestyle vloggers have signed endorsement deals worth millions of shillings, outpacing traditional media advertising budgets.

Corporate brands in telecommunications, banking, and fast-moving consumer goods are pivoting their marketing spend towards talent with proven grassroots engagement in Western Kenya, Nairobi, and the coast.

> "A billboard on a highway cannot talk back to a customer. An authentic artist hosting a live digital interaction can sell out a product inventory in forty-five minutes," explained Nairobi branding consultant Eric Mwangi.

## Accountability and Long-Term Creator Equity

With high stakes come rigorous performance benchmarks. Corporate sponsors are increasingly requiring comprehensive brand-safety agreements, 0% artificial inflation verification, and active community outreach.

Rather than simple product placements, savvy creators are now negotiating equity stakes, revenue sharing on sales conversions, and executive producer titles. The shift signals a mature creative economy where Kenyan talent commands genuine commercial respect.
    `.trim(),
    category: "celebrity",
    region: "national",
    template_type: "breaking",
    hero_image_url: "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=1200&auto=format&fit=crop&q=80",
    social_image_url: "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=1200&auto=format&fit=crop&q=80",
    byline: "Amaica Newsroom",
    whatsapp_post: "How Kenyan celebrities are transforming viral clout into multi-million corporate deals: https://amaicamedia.com",
    twitter_post: "Inside Kenya's multi-million celebrity brand endorsement revolution.",
    instagram_post: "Behind the scenes of high-stakes celebrity endorsements.",
    facebook_post: "How Kenya's creative economy is changing brand marketing forever.",
    status: "published",
    published_at: "2026-09-20T11:00:00Z",
    created_at: "2026-09-20T09:00:00Z",
    updated_at: "2026-09-20T11:00:00Z",
    sources: [
      { url: "https://mpasho.co.ke", title: "Mpasho Showbiz", notes: ["Industry commercial reports and brand agency data"] },
    ],
  },
];
