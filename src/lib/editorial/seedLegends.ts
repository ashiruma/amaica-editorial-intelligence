/**
 * Curated African & Western Kenya Entertainment Legends Seed Data.
 * Resiliently guarantees that "Our Legends" feature on the homepage,
 * public tribute view (/legends/:id), and newsroom roster (/newsroom/legends)
 * are always populated with rich tributes even when offline or in clean browser sessions.
 */

export interface LegendItem {
  id: string;
  name: string;
  country: string;
  era: string;
  field: string;
  short_bio: string;
  impact: string;
  active: boolean;
  feature_date: string;
  headline: string;
  hero_image_url: string;
  tribute: string;
}

export const SEED_LEGENDS: LegendItem[] = [
  {
    id: "legend-daudi-kabaka",
    name: "Daudi Kabaka",
    country: "Kenya",
    era: "1960s – 1980s",
    field: "Twist & Benga Pioneer",
    short_bio: "The indisputable King of African Twist whose pulsating guitars defined post-independence Kenyan dance music.",
    impact: "Revolutionized East African guitar styling, bridging Western Kenya Luhya rhythms with modern urban highlife.",
    active: true,
    feature_date: "2026-09-23",
    headline: "The Electric Legacy of Daudi Kabaka: Father of Kenyan Twist",
    hero_image_url: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=1200&auto=format&fit=crop&q=80",
    tribute: `
<p>In the vibrant dawn of post-independence Kenya, no sound animated dancehalls and wireless sets across East Africa with greater fervor than the rhythmic guitar of Daudi Kabaka. Born in Kakamega County in 1939, Kabaka transformed Western Kenya traditional Luhya celebratory folk cadence into an electrifying national phenomenon known simply as <em>African Twist</em>.</p>

<p>Recorded with the legendary Equator Sound Studios alongside peers like Fadhili William and Charles Mwamba, his seminal anthems—including "Helida", "African Twist", and "Bachelor Boy"—became the definitive soundtrack of a generation celebrating sovereign identity. His distinctive acoustic pick-up styling, paired with playful social commentary, created a bridge between rural cultural roots and the burgeoning urban optimism of Nairobi.</p>

<p>Kabaka's artistry went beyond mere entertainment; it codified a genre. By weaving traditional percussive isukuti tempos into contemporary electric compositions, he proved that indigenous Kenyan music possessed the vitality to conquer international stages. Today, Amaica Media honors Daudi Kabaka as an immortal giant whose fretboard wizardry forever altered the sonic geography of Western Kenya and the African continent.</p>
    `.trim(),
  },
  {
    id: "legend-fadhili-william",
    name: "Fadhili William",
    country: "Kenya",
    era: "1950s – 1990s",
    field: "Songwriter & Guitarist",
    short_bio: "Composer of 'Malaika', the most internationally recognized Swahili love ballad in world history.",
    impact: "Carried Swahili poetry and East African acoustic romance across continents, covered by Miriam Makeba, Boney M, and Harry Belafonte.",
    active: true,
    feature_date: "2026-09-22",
    headline: "Fadhili William: The Soul Behind 'Malaika'",
    hero_image_url: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=1200&auto=format&fit=crop&q=80",
    tribute: `
<p>Few compositions in global music hold the evocative power and universal resonance of "Malaika". Composed and first recorded by Kenyan virtuoso Fadhili William in 1963, the ballad transcended regional borders to become the international calling card for Swahili musical lyricism.</p>

<p>Fadhili was a master of restraint and melody. His delicate picking on the acoustic guitar and gentle tenor delivered love stories steeped in honest vulnerability. Though covered by global icons ranging from Miriam Makeba to Boney M and Harry Belafonte, it was Fadhili William's original recording that contained the authentic heartbeat of Kenyan urban romance.</p>

<p>His enduring legacy reminds contemporary Kenyan musicians that heartfelt melody and poetic authenticity possess timeless, universal currency. Amaica Media salutes Fadhili William as an everlasting ambassador of African songcraft.</p>
    `.trim(),
  },
  {
    id: "legend-sukuma-bin-ongaro",
    name: "Sukuma Bin Ongaro",
    country: "Kenya",
    era: "1970s – Present",
    field: "Luhya Folk & Omubila Icon",
    short_bio: "The philosophical voice of Kakamega whose accordion and acoustic guitar compositions capture Luhya wisdom.",
    impact: "Preserved community history, proverb lore, and cultural philosophy across five decades of prolific recordings.",
    active: true,
    feature_date: "2026-09-21",
    headline: "Sukuma Bin Ongaro: The Philosophical Bard of Western Kenya",
    hero_image_url: "https://images.unsplash.com/photo-1465847899084-d164df4dedc6?w=1200&auto=format&fit=crop&q=80",
    tribute: `
<p>Among the rolling hills and sugarcane plains of Kakamega County, the name Sukuma Bin Ongaro commands reverent awe. Armed with an acoustic guitar, percussion, and an unmatched treasury of cultural proverbs, Sukuma elevated folk storytelling into high literature for the common people.</p>

<p>His songs, sung in deep dialect with biting wit and moral clarity, addressed everything from community leadership, marital dynamics, and land heritage to modern economic struggles. Rather than chasing fleeting pop trends, Sukuma stayed grounded in the cultural soil of Western Kenya, building an unparalleled archive of social memory.</p>

<p>To listen to Sukuma Bin Ongaro is to sit beneath an elders' council under the sacred fig tree. Amaica Media celebrates this living legend whose songs continue to teach, entertain, and preserve the spirit of Mulembe nation.</p>
    `.trim(),
  },
  {
    id: "legend-ayub-ogada",
    name: "Ayub Ogada",
    country: "Kenya",
    era: "1970s – 2019",
    field: "Nyatiti Master & Composer",
    short_bio: "Pioneering multi-instrumentalist who brought the sacred Luo eight-stringed nyatiti to global film scores and concert halls.",
    impact: "Featured on Peter Gabriel's Real World Records and Hollywood soundtracks including 'The Constant Gardener'.",
    active: true,
    feature_date: "2026-09-20",
    headline: "Ayub Ogada: The Heavenly Strings of the Nyatiti",
    hero_image_url: "https://images.unsplash.com/photo-1520523839898-507127027178?w=1200&auto=format&fit=crop&q=80",
    tribute: `
<p>Ayub Ogada (Job Seda) was not merely a musician; he was a sonic shaman who transformed the ancient eight-stringed Luo lyre, the <em>nyatiti</em>, into a transcendent global instrument. His haunting masterpiece "Kothbiro" (The Rain is Coming) has drifted across millions of ears worldwide through radio airwaves, global festivals, and major Hollywood films.</p>

<p>Born in Mombasa to musical parents and deeply steeped in the lakeside traditions of Nyanza, Ayub combined vocal chanting, ankle bells, and rhythmic finger-plucking with celestial simplicity. Co-founding the African Heritage Band before joining Peter Gabriel's Real World roster, he championed authentic African instrumentation without compromise.</p>

<p>Ogada's vision proved that traditional African instruments carry an emotional depth capable of moving anyone, anywhere on Earth. Amaica Media immortalizes Ayub Ogada as a titan of heritage and global acoustic majesty.</p>
    `.trim(),
  },
  {
    id: "legend-fundi-konde",
    name: "Fundi Konde",
    country: "Kenya",
    era: "1940s – 1990s",
    field: "Electric Guitar Pioneer",
    short_bio: "One of Kenya's earliest acoustic and electric guitar recording artists and broadcast radio engineers.",
    impact: "Taught and mentored generation after generation of East African guitarists at the Kenya Broadcasting Corporation.",
    active: true,
    feature_date: "2026-09-19",
    headline: "Fundi Konde: The Master Craftsman of Kenya's First Electric Chords",
    hero_image_url: "https://images.unsplash.com/photo-1510915361894-db8b60106cb1?w=1200&auto=format&fit=crop&q=80",
    tribute: `
<p>The honorary title "Fundi" (Master Craftsman) was not given lightly to Fundi Konde. Born in Kilifi in 1924, he was among the first Africans to master the electric guitar during World War II while serving in the Entertainment Corps in Burma.</p>

<p>Upon returning to Kenya, Konde pioneered commercial studio recording in Nairobi, laying down iconic cuts such as "Jambo Sigara" and "Mama Sowera". His elegant rhythm work and brass arrangements laid the technical groundwork for all modern Kenyan recorded music.</p>

<p>Amaica Media pays homage to Fundi Konde: the visionary engineer, acoustic pioneer, and mentor whose strings ignited the Kenyan soundscape.</p>
    `.trim(),
  },
];

export function getTodaySeedLegend(): LegendItem {
  const dayOfYear = Math.floor(
    (Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 1000 / 60 / 60 / 24
  );
  const index = Math.abs(dayOfYear) % SEED_LEGENDS.length;
  return SEED_LEGENDS[index];
}

export function getSeedLegendById(id: string): LegendItem | undefined {
  return SEED_LEGENDS.find((l) => l.id === id || l.id.includes(id) || id.includes(l.id));
}
