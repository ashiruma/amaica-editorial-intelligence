/**
 * Amaica Media / WireOps Desk
 * Contextual Expansion & Inverted Pyramid Depth Generator
 *
 * Generates context-rich, strictly on-topic inverted-pyramid expansion paragraphs
 * tailored specifically to the detected story beat so that stories NEVER drift
 * into unrelated subjects (such as concert logistics or stadium ticketing).
 * Strictly enforces Zero-Emoji Workplace Standard.
 */

import { StoryBeat, detectStoryBeat, extractSubjectFromTitle } from "./beatClassification";

export function generateContextualExpansionParagraphs(
  topicTitle: string,
  region: string,
  category: string,
  existingBody: string
): string[] {
  const beat = detectStoryBeat(topicTitle, existingBody, category);
  const subject = extractSubjectFromTitle(topicTitle);
  const subjectLabel = subject || "the subject";

  const candidatesByBeat: Record<StoryBeat, string[]> = {
    // ── 1. MATATU CULTURE, NGANYAS & URBAN TRANSPORT BEAT ────────────────────
    matatu_transport: [
      `Nairobi's custom matatus remain an essential urban economic powerhouse. Beyond everyday commuter transit, custom 'nganyas' support a bustling youth creative economy across city routes. Route 111 in Ngong, Route 125 in Rongai, and Route 58 in Buruburu operate as moving showcases of local airbrush artwork, custom upholstery, and sound engineering. Commuters actively track top builds on digital platforms. That loyal following translates into dependable daily returns for young fabrication crews.`,

      `Transport analysts in Nairobi point out that custom fleets support hundreds of direct jobs across regional corridors. Mechanics, sound technicians, conductors, and digital booking staff all depend on the transit ecosystem. Safety remains a top priority. Sacco administrators insist that mechanical reliability and strict brake testing must match flashy exterior builds before vehicles enter daily passenger service.`,

      `Regulators continue pushing for orderly compliance across major commuter arteries. Modern saccos now install certified speed governors and enforce crew uniforms to maintain passenger confidence. Moving toward disciplined operations protects transit livelihoods while keeping commuters safe. Clean operating records also help vehicle owners negotiate competitive financing terms with local credit unions.`,

      `Inter-county fleets connect Nairobi directly with commercial hubs across Western Kenya, including Kakamega, Kisumu, and Bungoma. Modern shuttles offer parcel delivery alongside scheduled passenger departures. Mobile booking platforms help commuters reserve seats ahead of time. WireOps Desk will continue tracking verified developments across Kenya's transit sector.`,

      `Fabrication workshops in Nairobi's Industrial Area and Kariobangi report steady demand for custom interior panels and sound dampening. Young welders and fiberglass artists spend weeks perfecting individual vehicle themes. Every new vehicle launch draws enthusiastic crowds of supporters. Industry veterans note that high-quality fabrications preserve vehicle durability over years of demanding road use.`,

      `Commuter welfare associations advocate for predictable fares and courteous passenger treatment during rush hours. Saccos that maintain fair rates build lasting relationships with daily travelers. Public transport remains the lifeblood of Nairobi commerce. Respecting passengers ensures sustainable business growth across competing transit routes.`,
    ],

    // ── 2. TRAGEDY, SEARCH & RESCUE, ACCIDENT BEAT ───────────────────────────
    tragedy_rescue: [
      `The emergency mobilized local divers, humanitarian volunteers, and administrative officers across the affected county. First responders worked under demanding weather conditions to scour the river corridor and surrounding terrain. Rapid coordination between emergency units and nearby residents proved critical throughout the search operation.`,

      `Community members gathered near the scene to offer comfort and practical assistance to the grieving family. Civic leaders urged county emergency departments to install sturdy safety barriers, warning markers, and certified life-saving gear at hazardous river crossings. Upgraded safety equipment saves lives during heavy seasonal rains.`,

      `Public safety advocates reiterated calls for visible caution signage and public education near known accident spots. Local administrators urged families and school children to steer clear of swollen rivers and fast-moving runoff. Mental health support teams have been mobilized to assist traumatized community members.`,

      `Disaster preparedness officials emphasize the need for regular county-level emergency drills and dedicated response funding. Equipping local stations with rapid rescue boats and trained personnel reduces response times during unexpected incidents. Proactive planning prevents avoidable tragedies.`,

      `Administrative officers confirmed that a formal assessment report will be submitted to regional disaster coordination authorities. WireOps Desk will provide verified updates as official statements from emergency agencies are issued.`,
    ],

    // ── 3. POLITICS, CIVIC LEADERSHIP & GOVERNANCE BEAT ──────────────────────
    politics_governance: [
      `The political move comes as regional leaders intensify public engagements across the constituency. Grassroots voters in local wards are demanding responsive leadership that addresses everyday community concerns directly. Practical progress on the ground carries far more weight with voters than remote press statements.`,

      `Civic discussions across local forums and community town halls reflected rising public scrutiny of county resource allocation. Grassroots constituents expect elected leaders to remain visible, accessible, and accountable. In an era of instant mobile communication, official pronouncements face immediate verification by citizens.`,

      `Local politics continues shifting toward verifiable service delivery and infrastructural development. Aspirants who demonstrate consistent track records earn enduring credibility with the electorate. Respectful public dialogue strengthens democratic institutions at both county and national levels.`,

      `Community elders and civic organizations encourage constructive leadership that unites diverse groups behind shared local priorities. Addressing youth employment, healthcare access, and water supply issues forms the core of grassroots expectations. Leaders who deliver practical solutions earn lasting public trust.`,

      `Civic observers in Nairobi and Western Kenya note that voters are paying closer attention to legislative debates and policy motions. Informed public participation holds institutions to higher governance benchmarks. WireOps Desk will maintain objective, verified coverage as regional political developments unfold.`,
    ],

    // ── 4. BUSINESS, HIGH-NET-WORTH & ENTREPRENEURSHIP BEAT ──────────────────
    business_wealth: [
      `The commercial announcement drew keen interest across Nairobi's corporate and investment communities. Market analysts noted that building lasting enterprises requires disciplined working capital management, prudent reinvestment, and transparent financial reporting. High-profile transactions naturally attract close scrutiny from regulators and industry peers.`,

      `Financial advisors in Nairobi emphasize that long-term commercial resilience depends on clear corporate shareholding structures and enforceable commercial contracts. While flashy announcements make headlines, enduring enterprises thrive on sound corporate governance, regulatory compliance, and consistent customer delivery.`,

      `Across the country, emerging entrepreneurs and small business operators track major commercial milestones with genuine interest. Successful founders who create local employment, pay suppliers promptly, and share hard-earned business lessons earn lasting respect within the business community.`,

      `Corporate governance consultants urge expanding businesses to establish independent advisory boards and maintain routine external audits. Professional oversight helps growing enterprises navigate tax requirements, contractual obligations, and partnership transitions smoothly.`,

      `Access to structured credit and patient equity capital remains a deciding factor for growing Kenyan businesses. Financial institutions that tailor lending products to local market realities help viable commercial ventures scale sustainably. WireOps Desk will continue tracking verified developments as corporate partnerships and regulatory filings progress.`,
    ],

    // ── 5. RELATIONSHIP & PERSONAL DISPUTE BEAT ──────────────────────────────
    relationship: [
      `The public fallout sparked widespread debate across Kenyan entertainment platforms and digital forums. Airing private breakups on live broadcasts or social media invites intense public scrutiny. When business partnerships and personal ties overlap, ending a relationship becomes complicated. Legal advisors urge public personalities to protect their peace of mind and address financial disputes through formal legal channels.`,

      `Radio call-in shows and online discussions drew mixed reactions from listeners across Nairobi. While followers dissected every claim, many urged both parties to resolve their disagreements privately away from microphones. Navigating a separation under the public glare is challenging. Close associates expressed hope that the two can resolve outstanding matters respectfully.`,

      `Family counselors and relationship mediators in Nairobi point out that public conflicts often stem from unspoken financial friction. When two creators build joint commercial brands, separating personal lives disrupts business operations. Experts advise taking time out from online commentary to address core grievances through private arbitration.`,

      `Talent managers stress that joint creator channels require formal legal contracts from the outset. Handshake arrangements frequently collapse when personal partnerships sour. Media agencies now advise influencers to maintain distinct bank accounts and documented revenue-sharing agreements to prevent painful public fallout.`,

      `Taking time away from public platforms often gives creators space to rebuild focus. Dedicated supporters hope both parties can eventually channel their energy back into creative work. WireOps Desk will continue monitoring verified details as formal statements or legal clarifications emerge.`,

      `Mental health advocates in Kenya emphasize that viral relationship controversies take a heavy emotional toll on everyone involved. Constant online scrutiny and speculative commentary can quickly overwhelm public personalities. Setting clear personal boundaries and seeking qualified guidance helps individuals navigate painful transitions with dignity.`,

      `Digital audience analysts observe that Kenyan social media users increasingly differentiate between genuine grievance and manufactured drama. Followers respect public figures who handle private matters with composure and restraint. Moving past bitter exchanges preserves personal credibility and protects long-term professional relationships.`,
    ],

    // ── 6. DIGITAL COMEDY & SATIRE BEAT ──────────────────────────────────────
    comedy: [
      `Kenya's digital comedy space continues expanding at a rapid pace across online video platforms. Independent comedians across Nairobi, Eldoret, and Western Kenya produce short-form skits that reflect everyday Kenyan life. Honest humor grounded in shared social experiences consistently draws enthusiastic audience engagement.`,

      `Talent managers note that sustained creative discipline separates top comedians from one-hit viral personalities. Creators who post regular content and invest in original scripts frequently secure profitable corporate endorsements and live hosting gigs. Direct connection with followers keeps the digital comedy sector growing.`,

      `Live stand-up shows and theatre nights in Nairobi draw packed houses of comedy enthusiasts. Quality humor provides welcome relief from daily economic pressures. Comedians who polish their delivery and test material before live crowds build enduring performance careers.`,

      `Production crews behind top digital creators are upgrading their camera work, lighting, and audio equipment. Viewers expect cinematic production standards even in brief social media sketches. Better production values help local comedy compete effectively on international platforms.`,

      `Industry advocates urge young comics to protect their intellectual property and register their creative trademarks. Understanding media contracts and usage rights prevents predatory commercial deals. Professional representation ensures creators retain fair shares of the commercial revenue generated by their viral sketches. WireOps Desk will track verified comedy updates and tour schedules.`,
    ],

    // ── 7. MUSIC & RECORDING ARTS BEAT ───────────────────────────────────────
    music: [
      `The announcement stirred excitement across the Kenyan music community and regional streaming channels. Radio broadcasters and club DJs noted that contemporary audiences appreciate live instrumentation paired with authentic African sounds. Blending traditional percussion with crisp studio production continues to win loyal supporters across Nairobi, Kisumu, and Eldoret.`,

      `Studio producers in Nairobi stress that consistent song releases and disciplined stage performances keep recording artists relevant over time. Live concerts in major towns draw dedicated music lovers who sing along to every lyric. Direct crowd connection matters far more than short-lived digital streaming metrics.`,

      `Radio programmers and music directors play a critical role in championing homegrown talent across the country. Consistent daytime airplay enables regional artists to tour widely, secure corporate endorsements, and build lasting sustainable careers in a competitive industry.`,

      `Live performance venues across Nairobi, Nakuru, and Mombasa report strong ticket sales for well-organized local showcases. Music fans appreciate punctual schedules, balanced sound engineering, and high-energy live bands. Artists who respect ticket buyers build enduring followings that span generations.`,

      `Independent record labels and artist managers emphasize the importance of copyright registration and transparent royalty tracking. Enforcing intellectual property rights ensures that musicians earn fair compensation from digital streaming, ringback tones, and broadcast licensing agreements.`,

      `Collaborations between established icons and emerging songwriters continue to push East African music into fresh territory. Studio sessions that blend seasoned experience with youthful energy produce memorable tracks that resonate with diverse audiences across the continent. WireOps Desk will provide updates as new tour dates and studio projects are confirmed.`,
    ],

    // ── 8. FILM, TELEVISION & CINEMA BEAT ────────────────────────────────────
    film: [
      `The production milestone signals promising growth for the Kenyan cinema and television landscape. Local screenwriters, cinematographers, and directors are developing authentic stories that reflect real-life experiences across the country. Audiences connect deeply with relatable characters, believable dialogue, and genuine local settings.`,

      `Cinema operators and streaming platforms report rising demand for Kenyan feature films and scripted series. Viewers actively seek out homegrown stories delivered with sharp visual cinematography and compelling acting performances. Production companies are answering that demand by raising technical benchmarks on local film sets.`,

      `Film industry advocates emphasize that fair crew compensation, structured call sheets, and transparent contracts remain essential to building an enduring screen sector. Practical production workshops help young camera operators, sound recordists, and lighting technicians sharpen their crafts.`,

      `Regional film festivals and community screenings across Nairobi, Kisumu, and Mombasa provide vital distribution avenues for independent filmmakers. Meeting audiences in person helps storytellers refine future projects. Direct feedback from local viewers strengthens the entire creative pipeline.`,

      `Financing models for Kenyan screen productions are gradually evolving beyond donor grants toward private equity and brand sponsorships. Investors who recognize the commercial viability of East African storytelling are funding ambitious local projects. WireOps Desk will maintain comprehensive coverage of Kenya's emerging screen industry.`,
    ],

    // ── 9. CRIME, COURTS & LEGAL PROCEEDINGS BEAT ────────────────────
    crime_legal: [
      `The legal developments have drawn close scrutiny from court observers, advocates, and civil society groups in Nairobi. Legal analysts stress that due process protects all citizens equally under the law. Disputed claims must be tested before formal tribunals with verified evidence rather than argued through uncorroborated online speculation.`,

      `Courtroom watchers noted that signed affidavits, sworn witness testimony, and verified financial audit records remain the bedrock of any judicial inquiry. Seasoned magistrates and advocates agree that procedural fairness and transparency must guide every court hearing to maintain public confidence.`,

      `High-profile disputes often establish crucial judicial precedents for related matters under Kenyan jurisprudence. Legal practitioners anticipate that forthcoming sessions will clarify contested statutory points. Transparent court records ensure that justice is seen to be done by the general public.`,

      `Judicial reporting requires strict factual discipline to prevent pre-judging matters that remain before open courts. Responsible newsrooms verify registry documents and official rulings before publishing claims. Accurate reporting safeguards both legal integrity and the public interest.`,

      `Formal proceedings are scheduled to resume in accordance with official court calendar dates. WireOps Desk will provide balanced, verified follow-up reporting as formal filings and judicial orders are placed on the public record.`,
    ],

    // ── 10. LIVE EVENTS & FESTIVALS BEAT ─────────────────────────────────────
    event: [
      `Event organizers and venue directors emphasize that attendee safety, thorough sound checks, and orderly gate procedures determine the success of major live events. Large festivals stimulate local economic activity, creating casual employment for security personnel, stage crews, ticket attendants, and food vendors.`,

      `Concert attendees in Nairobi, Kisumu, and Eldoret expect dependable sound amplification, clear sightlines, and secure parking. Promoters who respect ticket buyers, honor advertised artist lineups, and adhere to start times build strong brand loyalty among entertainment enthusiasts.`,

      `Live cultural festivals and music tours across counties celebrate heritage and bring communities together in celebration. Well-managed concert series showcase the vibrant appetite for live performance across East Africa while generating positive commercial returns for surrounding hospitality businesses.`,

      `Technical teams and audio engineers confirmed that venue preparations and equipment calibration are proceeding according to plan. Promoters are working alongside local law enforcement to ensure smooth traffic flow and crowd security around the venue perimeter.`,

      `Sustainable event management requires proactive waste disposal, adequate sanitation facilities, and clear emergency exit corridors. Promoters who invest in professional venue logistics earn regulatory approvals and repeat patrons. WireOps Desk will continue tracking verified concert schedules and ticketing details.`,
    ],

    // ── 11. GENERAL CELEBRITY & NOTABLE PERSONALITIES BEAT ───────────────────
    celebrity_general: [
      `The broadcast controversy quickly gained traction across Nairobi entertainment circles and regional digital platforms. Media commentators noted that modern audiences expect straightforward answers and verifiable facts from public personalities. Word spread rapidly across morning radio shows and video streams as fans discussed the claims in real time.`,

      `Digital communication platforms have transformed how Kenyans follow high-profile disputes. Followers no longer wait for polished corporate press statements. They expect direct, authentic clarification when misunderstandings arise. That shift makes prompt, documented communication essential whenever conflicting claims surface online.`,

      `Industry veterans advise younger creators and artists to safeguard their professional futures through formal written agreements. Informal understandings rarely hold up when business collaborations face strain. Retaining signed contracts and independent legal counsel prevents contentious disputes from spilling into the public domain.`,

      `Communication strategists in Nairobi emphasize that public controversies demand quick, factual engagement. Online commentary moves at high speed, and prolonged silence often fuels speculative rumors. Public figures who provide documented facts and composed responses preserve long-term credibility with audiences and commercial brand partners.`,

      `Experienced broadcasters point out that lasting media careers are built on consistent creative output and mutual respect. Sensational headlines may generate temporary viral attention, but enduring professional stature requires steady work and personal integrity. Kenyan audiences value authentic talent above manufactured controversy.`,

      `Talent managers across Nairobi urge public figures to maintain clear boundaries between personal relationships and commercial operations. Shared finances and informal ventures frequently lead to bitter fallouts. Independent accounting, clear ownership ledgers, and formal dispute resolution procedures keep creative projects on track.`,

      `Entertainment journalists continue monitoring the developing situation closely. Public interviews and social media statements have sparked lively debate among listeners and followers. WireOps Desk will provide balanced follow-up reporting as official statements or verified clarifications are made available.`,

      `Reputation advisors stress that public figures who acknowledge mistakes and communicate honestly recover faster from media storms. Audiences appreciate humility and direct accountability. Handling public friction with dignity demonstrates maturity and reassures commercial sponsors.`,
    ],
  };

  const pool = candidatesByBeat[beat] || candidatesByBeat.celebrity_general;

  // Return candidates not already substantively present in the text
  const filtered = pool.filter((cand) => {
    // CRITICAL: If the story beat is matatu_transport, NEVER allow concert/music text
    if (
      beat === "matatu_transport" &&
      /\b(concert|album|festival|theatre|cinema|tour dates|tickets? on sale|gate charges|music)\b/i.test(cand)
    ) {
      return false;
    }
    const snippet = cand.slice(0, 35).toLowerCase();
    return !existingBody.toLowerCase().includes(snippet);
  });

  if (filtered.length > 0) return filtered;

  // Specific fallbacks for matatu transport to avoid generic entertainment drift
  if (beat === "matatu_transport") {
    const transitFallbacks = [
      `Urban planning scholars and transit logistics analysts in Nairobi observe that custom matatus bridge essential gaps in city mobility. Commuter corridors continue expanding into neighboring counties. Professional fleet operations that balance passenger safety with urban design will shape the future of mass transit across Kenya.`,
      `Transport SACCO officials and road safety advocates emphasize that technical compliance remains the foundation of long-term commercial success. Passenger confidence depends on disciplined scheduling, transparent fare structures, and qualified driving crews. Upholding these professional standards protects both operators and passengers.`,
      `Fleet owners who invest in routine mechanical maintenance and fair driver compensation record significantly lower accident rates. Experienced operators recognize that cutting corners on vehicle maintenance costs far more in the long run. Professional management transforms informal transit into an enduring enterprise.`,
      `Digital payment integration continues gaining ground across commuter routes in Nairobi and surrounding metropolitan hubs. Cashless fare collection curbs revenue loss and improves financial accountability for vehicle owners. Modernization efforts reflect a broader shift toward formal, dependable public transit systems.`,
    ];
    const filteredTransit = transitFallbacks.filter((cand) => {
      const snippet = cand.slice(0, 35).toLowerCase();
      return !existingBody.toLowerCase().includes(snippet);
    });
    if (filteredTransit.length > 0) return filteredTransit;
  }

  // Fallback for inverted-pyramid depth without topic drift
  const universalFallbacks = [
    `Newsrooms in Nairobi and regional broadcast desks continue monitoring listener responses following the broadcast. Radio listeners and social media users engaged in spirited discussion throughout the morning, trading views on the competing accounts. Editorial desks have reached out to both parties for formal clarification and documented records.`,

    `In Kenya's fast-moving entertainment sector, business disagreements between collaborators frequently surface during live broadcasts. Broadcasters and talent representatives point out that formal agreements and documented receipts provide the clearest path to settling disputed claims. When financial friction spills onto public airwaves, both listeners and commercial partners look for verifiable facts.`,

    `Entertainment reporters in Nairobi noted that morning talk shows frequently serve as platforms for public disputes. Morning hosts often field direct calls from listeners who demand accountability from featured personalities. Station managers have reminded presenters to maintain balanced questioning and offer all mentioned parties an immediate opportunity to respond on air.`,

    `Digital discussions across local messaging channels and social video platforms showed keen public interest in the developing story. Fans and sector observers expressed hope that the individuals involved can resolve their differences constructively through formal arbitration. Verified documentation remains the deciding factor when resolving claims over shared projects or unpaid remuneration.`,

    `Experienced producers in Nairobi emphasize that clear operational records protect everyone involved in creative collaborations. Signing formal contracts, keeping transparent payment vouchers, and using recognized banking channels help prevent public disputes before they escalate. Industry veterans recommend that creative partners engage qualified advisors whenever negotiating contract terms or revenue splits.`,

    `Regional correspondents in Western Kenya and urban centers report that audiences value straight reporting over unverified speculation. Readers actively follow verified news updates to understand the practical details behind high-profile disputes. WireOps Desk will continue tracking verified developments and update the reporting as formal statements or official records are provided.`,

    `Local legal practitioners in Nairobi point out that contractual disputes should ideally be resolved through mediation rather than public exchanges. Resolving matters through accredited arbiters or written settlements saves both time and professional goodwill. When public statements are made, preserving documentary proof remains essential for all participants.`,

    `News desks across the country maintain strict verification standards when covering disputes between public figures. Every name, monetary claim, and attributed statement must align with verified records and direct testimony. Dedicated newsroom verification ensures readers receive accurate, balanced, and fair reporting on developing events.`,
  ];

  const filteredUniversal = universalFallbacks.filter((cand) => {
    if (
      beat === "matatu_transport" &&
      /\b(concert|album|festival|theatre|cinema|tour dates|tickets? on sale|gate charges|music)\b/i.test(cand)
    ) {
      return false;
    }
    const snippet = cand.slice(0, 35).toLowerCase();
    return !existingBody.toLowerCase().includes(snippet);
  });

  if (filteredUniversal.length > 0) return filteredUniversal;

  // Extended perspectives ensuring expansion never runs dry before 1200 words
  const extendedPerspectives = [
    `Editorial desks and reporters across Nairobi continue gathering verified facts regarding ${topicTitle}. Correspondents observe that audience interest remains high as listeners seek confirmed details rather than rumors. WireOps Desk will publish verified follow-up details as soon as primary records become available.`,
    `Reporters on the ground in Nairobi, Kisumu, and Eldoret report steady engagement from readers following this development. Local radio stations covered the topic during mid-morning commentary segments, inviting listener reactions and offering balanced perspectives. News desks will update this record as additional verifiable facts emerge.`,
    `Community members and sector observers across the region note that transparent resolution of public controversies strengthens mutual trust. Experienced industry participants advise those involved to address substantive issues directly and keep the public informed through verified updates.`,
  ];

  return extendedPerspectives.filter((cand) => {
    const snippet = cand.slice(0, 35).toLowerCase();
    return !existingBody.toLowerCase().includes(snippet);
  });
}
