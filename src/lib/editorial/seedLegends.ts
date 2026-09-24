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
  {
    id: "legend-e-sir",
    name: "E-Sir (Issah Mmari)",
    country: "Kenya",
    era: "1999 – 2003",
    field: "Kapuka & Urban Rap Icon",
    short_bio: "South C lyrical prodigy who transformed Kenyan pop music with infectious Swahili rhyme schemes and street poetry.",
    impact: "Proved that local Sheng cadence could dominate mainstream commercial radio, inspiring generations of modern urban musicians.",
    active: true,
    feature_date: "2026-09-18",
    headline: "E-Sir: The Immortal Voice of Kenya's Urban Renaissance",
    hero_image_url: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=1200&auto=format&fit=crop&q=80",
    tribute: `
<p>Few recording artists in East African history captured the youthful spirit and swagger of urban Nairobi with greater brilliance than Issah Mmari, known universally as E-Sir. Rising from South C estate in the early 2000s under Ogopa Deejays, E-Sir transformed Kenyan radio with an effortless flow, clever Sheng wordplay, and undeniable charisma.</p>

<p>Anthems such as "Mos Mos", "Boomba Train", "Hamunitishi", and "Leo ni Leo" bridged generational divides. His lyrical cadence proved that contemporary African hip-hop did not need to imitate foreign sounds to command mass appeal. He spoke the authentic language of Nairobi streets with charm and lyrical dexterity.</p>

<p>Though his life was tragically cut short in March 2003, his artistic imprint remains permanent. Amaica Media celebrates E-Sir as an immortal Kenyan legend whose rhymes set the gold standard for East African urban music.</p>
    `.trim(),
  },
  {
    id: "legend-queen-jane",
    name: "Queen Jane (Jane Nyambura)",
    country: "Kenya",
    era: "1980s – 2010",
    field: "Central Kenya Benga Pioneer",
    short_bio: "Trailblazing benga vocalist and bandleader whose emotive storytelling and sweet melodies captured millions of hearts.",
    impact: "Broke through male-dominated traditional benga to lead Queenja Les Les, opening doors for female bandleaders across Kenya.",
    active: true,
    feature_date: "2026-09-17",
    headline: "Queen Jane: The Unrivaled Songstress of Central Kenya Benga",
    hero_image_url: "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=1200&auto=format&fit=crop&q=80",
    tribute: `
<p>In a benga music industry historically dominated by male guitarists, Jane Nyambura rose with unmatched vocal elegance, emotional honesty, and fierce independence. Performing as Queen Jane alongside her outfit Queenja Les Les, she captivated audiences with timeless hits including "Nduththe", "Mukuwe", and "Gakondo".</p>

<p>Her songs chronicled the everyday joys, romantic dilemmas, and social realities of ordinary Kenyan families. With soaring lead vocals and tight, danceable benga guitar licks, she packed concert halls across Nairobi, Central Kenya, and the diaspora for over two decades.</p>

<p>Amaica Media pays homage to Queen Jane: a courageous cultural pioneer whose voice remains an enduring treasure of Kenyan musical heritage.</p>
    `.trim(),
  },
  {
    id: "legend-mzee-ojwang",
    name: "Mzee Ojwang (Benson Wanjau)",
    country: "Kenya",
    era: "1960s – 2015",
    field: "Television & Comedy Pioneer",
    short_bio: "The beloved father of Kenyan comedy whose hilarious television patriarch role on Vitimbi entertained the nation for decades.",
    impact: "United households across ethnic and linguistic divides through clean family humor and masterclass character acting.",
    active: true,
    feature_date: "2026-09-16",
    headline: "Mzee Ojwang: The Immortal Patriarch of Kenyan Comedy",
    hero_image_url: "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=1200&auto=format&fit=crop&q=80",
    tribute: `
<p>For more than thirty years on the Kenya Broadcasting Corporation (KBC), television sets across the country fell silent with anticipation whenever Benson Wanjau, universally known as Mzee Ojwang Hatari, appeared on screen. Sporting his iconic feather-adorned hat and humorous Luo-accented Swahili, Mzee Ojwang became the quintessential national father figure.</p>

<p>Alongside Mama Kayai (Mary Khavere), he anchored long-running family dramas <em>Darubini</em> and <em>Vitimbi</em>. His comedic timing defused national tensions, exposed marital foibles, and offered moral guidance with gentle hilarity. At a time when national unity was paramount, Mzee Ojwang proved that humor transcends all ethnic boundaries.</p>

<p>Amaica Media honors Mzee Ojwang as the supreme pioneer of Kenyan television acting, whose laughter illuminated living rooms across the Republic for generations.</p>
    `.trim(),
  },
  {
    id: "legend-do-misiani",
    name: "D.O. Misiani",
    country: "Kenya",
    era: "1960s – 2006",
    field: "Benga Patriarch & Shirati Jazz Leader",
    short_bio: "Fierce bandleader of Shirati Jazz who fused lakeside folk philosophy with blistering electric benga guitar arrangements.",
    impact: "Elevated Kenyan benga into an internationally celebrated dance music genre across Europe, America, and the African continent.",
    active: true,
    feature_date: "2026-09-15",
    headline: "D.O. Misiani: The Undisputed King of Benga",
    hero_image_url: "https://images.unsplash.com/photo-1465847899084-d164df4dedc6?w=1200&auto=format&fit=crop&q=80",
    tribute: `
<p>Daniel Owino Misiani was widely recognized as the grandfather of benga music. Leading the legendary Shirati Jazz Band, Misiani revolutionized Kenyan dance halls with rapid, interlocking lead guitars that mimicked traditional eight-stringed nyatiti finger-picking.</p>

<p>His compositions—spanning hits like "Lala Salama", "Piny Ose Mer", and "Kisero"—were renowned for their incisive political commentary, philosophical reflections on human mortality, and blistering rhythmic endurance. He toured international music festivals, putting Kenya's indigenous guitar craftsmanship on global stages.</p>

<p>Amaica Media immortalizes D.O. Misiani as a peerless giant whose electrifying fretwork laid the foundation for modern East African guitar music.</p>
    `.trim(),
  },
  {
    id: "legend-joseph-kamaru",
    name: "Joseph Kamaru",
    country: "Kenya",
    era: "1960s – 2018",
    field: "Folk Philosopher & Kikuyu Benga Titan",
    short_bio: "Prolific acoustic guitarist and folk bard whose poetic recordings documented Kenya's post-colonial history.",
    impact: "Recorded over a thousand seminal compositions, preserving cultural proverbs and speaking truth on national political stages.",
    active: true,
    feature_date: "2026-09-14",
    headline: "Joseph Kamaru: The Conscience and Memory of Kenyan Folk",
    hero_image_url: "https://images.unsplash.com/photo-1520523839898-507127027178?w=1200&auto=format&fit=crop&q=80",
    tribute: `
<p>Joseph Kamaru was much more than a musician; he was an oral historian and cultural custodian. Beginning his recording career in 1965, Kamaru penned deeply evocative songs that reflected the economic trials, political realignments, and moral debates of a changing Kenya.</p>

<p>With an acoustic guitar and deep command of traditional proverbs, his music transcended ethnic lines to command audiences from rural marketplaces to state banquets. Songs such as "Ndari ya Mwarimu", "Ke Ngwitikie", and "Chania River" tackled societal taboos with poetic courage and unmatched lyrical sophistication.</p>

<p>Amaica Media pays profound tribute to Joseph Kamaru: a titan of indigenous storytelling whose archive remains a sacred pillar of Kenyan cultural heritage.</p>
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
