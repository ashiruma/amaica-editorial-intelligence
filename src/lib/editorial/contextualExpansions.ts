/**
 * Amaica Media / WireOps Desk
 * Contextual Expansion & Inverted Pyramid Depth Generator
 *
 * Generates context-rich, strictly on-topic inverted-pyramid expansion paragraphs
 * tailored specifically to the detected story beat so that stories NEVER drift
 * into unrelated subjects (such as concert logistics or stadium ticketing).
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
      `The development underscores the economic vitality and cultural significance of Kenya's matatu industry. Far from being merely a public transit mechanism, Nairobi's custom 'nganyas' represent a vibrant multi-million-shilling urban creative economy. Specialized fabricators, airbrush artists, and interior sound technicians collaborate to turn standard commercial vehicles into mobile cultural landmarks. Commuters actively seek out headline matatus on major city routes, creating sustained brand loyalty and steady route revenues for youth operating crews.`,

      `Urban transport observers in Nairobi note that investments in high-specification fleets create hundreds of direct and indirect employment opportunities for young people. From route conductors and digital ticketing crews to detailing specialists and sound engineers, the matatu ecosystem remains one of East Africa's largest youth employers. Industry stakeholders emphasize that maintaining high mechanical safety standards alongside eye-catching street aesthetics is essential for building sustainable fleet logistics brands.`,

      `Regulators and transport SACCO executives continue to emphasize orderly route operations, passenger comfort, and strict road safety compliance. Modern fleet managers are investing in speed governance telematics, verified crew uniforms, and organized terminus scheduling to ensure passenger safety matches the visual appeal of custom vehicles. This focus on operational discipline is transforming informal transit into structured transport enterprises.`,

      `Looking ahead, regional fleet operators plan to expand custom transport services across surrounding commuter corridors, linking Nairobi's central business district with growing satellite residential towns. Industry analysts view the continued professionalization of matatu branding as a positive evolution for urban transit culture. WireOps Desk will continue tracking developments across Kenya's urban transport sector.`,

      `From a statutory compliance standpoint, transit operators must navigate rigorous licensing protocols administered by the National Transport and Safety Authority and relevant county government directorates. Vehicle inspection guidelines require thorough mechanical roadworthiness certifications, verified fire suppression equipment, and operational speed limitation devices before commercial transit permits are granted. Transport advocacy groups point out that operators who proactively integrate these statutory mandates foster long-term commuter confidence while mitigating route enforcement penalties.`,

      `Beyond Nairobi's metropolitan routes, the growth of organized commuter fleets provides vital inter-county logistical links connecting the capital with commercial hubs across Western Kenya, including Kakamega, Kisumu, and Bungoma. Long-distance transit saccos are increasingly adopting modernized scheduling models, parcel distribution services, and structured driver rotation schedules to optimize safety across inter-county corridors. Sector analysts conclude that structured capital investments in high-capacity fleets will continue driving regional commerce throughout East Africa.`,
    ],

    // ── 2. TRAGEDY, SEARCH & RESCUE, ACCIDENT BEAT ───────────────────────────
    tragedy_rescue: [
      `The incident has drawn urgent attention to emergency response preparedness and water safety protocols across the county. Local authorities and community leaders commended the bravery of volunteer divers and first responders who mobilized swiftly under challenging river conditions. Regional disaster management teams noted that swift coordination between administrative security officers and local residents remains vital during critical search and recovery missions.`,

      `Community members and local leaders gathered near the site to offer support and solidarity to the affected family members during the recovery operation. Civic organizations in the region have urged county emergency management agencies to establish dedicated rescue stations equipped with modern diving apparatus, safety ropes, and certified life jackets along hazardous river stretches. Enhanced equipment access ensures local rescue teams can operate with greater safety during rapid-current emergencies.`,

      `Public safety advocates called on county authorities to erect clear warning markers, secure footbridge crossings, and conduct public awareness campaigns along accident-prone riverbanks. Local administrators emphasized that community vigilance and early reporting to emergency lines save lives during seasonal flooding periods. Counseling support teams have also been mobilized to assist family members and first responders coping with emotional distress following the incident.`,

      `Administrative officers confirmed that a detailed incident report will be submitted to regional disaster monitoring authorities to guide future emergency planning. Local leaders reiterated their commitment to improving rural emergency infrastructure and strengthening community-based first-response capabilities. WireOps Desk will provide verified follow-up reports as formal administrative updates are released.`,
    ],

    // ── 3. POLITICS, CIVIC LEADERSHIP & GOVERNANCE BEAT ──────────────────────
    politics_governance: [
      `The political development comes at a critical juncture as regional leaders and grassroots mobilization groups intensify their engagements across the county. Political commentators observe that direct public action and community presence increasingly define voter perceptions in local constituencies. Grassroots voters across Kenya are demanding accessible, hands-on leadership that addresses practical community challenges rather than remote political pronouncements.`,

      `Discussions across local civic forums and constituency groups highlighted the growing importance of community-level service delivery and public accountability. Observers noted that aspirants who demonstrate personal courage, civic empathy, and practical solidarity during moments of community distress build enduring goodwill among local electorates. In the era of widespread social media reporting, public actions by political figures are scrutinized in real time by voters across the country.`,

      `Regional governance analysts point out that county leadership races are increasingly shaped by track records of direct community support and tangible public initiatives. With county assemblies and national parliamentarians facing elevated voter scrutiny, grassroots constituents are prioritizing leaders with proven records of responsiveness, transparent communication, and community empowerment.`,

      `Looking forward, political observers anticipate intensified constituency tours, civic barazas, and grassroots consultations as leaders prepare for upcoming electoral cycles. WireOps Desk will continue providing balanced, fact-based political reporting as regional dynamics unfold.`,
    ],

    // ── 4. BUSINESS, HIGH-NET-WORTH & ENTREPRENEURSHIP BEAT ──────────────────
    business_wealth: [
      `The high-profile development highlights the growing intersections of social media visibility, entrepreneurship, and wealth displays across contemporary African commerce. Business commentators observe that viral demonstrations of personal generosity and luxury asset acquisition frequently spark spirited public debate regarding economic priorities, commercial branding, and financial transparency in the digital era.`,

      `Financial advisors and enterprise mentors emphasize that sustainable wealth building requires disciplined asset management, strategic capital reinvestment, and resilient commercial diversification. While high-visibility gifts and luxury fleets draw massive digital engagement, long-term business sustainability depends on robust commercial operations, intellectual property control, and structured corporate governance.`,

      `Across regional digital networks, audiences continue to follow the milestones of prominent commercial figures with intense curiosity. Economic analysts noted that public curiosity often centers on understanding the entrepreneurial pathways that enable high-value investments. As youth unemployment remains a pressing concern across the continent, commercial figures who share practical enterprise lessons and support local job creation earn lasting respect from communities.`,

      `Looking ahead, industry analysts expect ${subjectLabel} to pursue further commercial ventures and strategic brand partnerships. WireOps Desk will continue tracking verified developments across regional enterprise and creator commerce.`,
    ],

    // ── 5. RELATIONSHIP & PERSONAL DISPUTE BEAT ──────────────────────────────
    relationship: [
      `The disclosures have ignited broader public dialogue regarding the delicate balance between high-profile personal relationships and intense social media scrutiny in Kenya's entertainment scene. In an era where digital creators and public personalities frequently share intimate glimpses of their personal journeys, audience engagement can quickly evolve into overwhelming scrutiny when relationships experience strain. Media commentators note that public curiosity often intensifies emotional pressure. This highlights the necessity for clear boundaries between personal privacy and public commentary. Personal well-being and psychological peace must always remain the foremost priority for all parties involved.`,

      `Across Kenyan social platforms and discussion forums, followers and entertainment peers have engaged in thoughtful conversations following the announcement. While digital audiences naturally dissect public statements and timelines, the prevailing sentiment has centered on empathy, maturity, and mutual respect. Cultural observers emphasize that navigating personal transitions under the public eye requires remarkable emotional strength, and commentators have commended individuals who prioritize long-term emotional well-being, clear communication, and personal safety over performative social media expectations.`,

      `Family counselors and relationship wellness practitioners in Nairobi observe that candid public discussions regarding personal milestones reflect an evolving cultural maturity among young adults. Mental health advocates stress that acknowledging relational challenges, seeking trusted counsel, and making decisive life adjustments are essential components of personal growth. Experts encourage individuals navigating complex relationships to maintain open communication, protect their personal peace, and seek supportive community networks during periods of major life change. Emotional wellness and personal safety remain vital priorities.`,

      `Industry analysts point out that digital collaboration models in Kenya are evolving rapidly, with many creators establishing formal business structures that clearly delineate creative work from personal dynamics. In past years, shared content channels frequently blurred commercial contracts with domestic partnerships, leading to abrupt disruptions when relationships ended. Modern entertainment management firms are now advising talent to protect individual intellectual property, maintain separate financial accounts, and establish dispute protocols from the outset to avoid public fallout.`,

      `Civic educators and peer mentors have also highlighted the responsibility that influential personalities hold when sharing personal experiences with youthful audiences. Open discussions about setting healthy boundaries, identifying toxic behaviors, and taking courageous steps toward self-preservation provide valuable life lessons for followers facing similar challenges in their private lives. Healthy dialogue fosters emotional resilience across the wider creative community.`,

      `Looking forward, industry observers expect ${subjectLabel} to redirect creative energies toward independent projects, fresh collaborations, and solo professional formats. Loyal supporters have expressed enthusiasm for content that reflects authentic individual growth, resilience, and personal evolution. Fresh starts bring renewed artistic focus. As Kenya's digital entertainment space continues to mature, audiences are demonstrating a clear preference for transparency, genuine personal fortitude, and dedication to creative excellence. WireOps Desk will continue providing fair, balanced, and verified reporting on developments surrounding ${subjectLabel} and related creative projects.`,
    ],

    // ── 6. DIGITAL COMEDY & SATIRE BEAT ──────────────────────────────────────
    comedy: [
      `The viral momentum demonstrates how contemporary Kenyan comedy creators leverage short-form digital platforms to build passionate online followings. Humorists and content producers across Nairobi and Western Kenya are redefining digital entertainment through spontaneous audience engagement, relatable social commentary, and character-driven sketches that mirror everyday societal quirks.`,

      `Talent managers and digital monetization specialists note that sustainable comedic branding requires steady production discipline, continuous script development, and audience trust. By cultivating interactive livestreams and recurring skit formats, content creators have established direct relationships with viewers, transforming casual digital impressions into loyal community followings that sustain commercial partnerships.`,

      `Social commentators point out that satire and comedic livestreams often serve as important cathartic spaces for Kenyan audiences navigating economic and personal pressures. The spontaneous humor and candid peer exchanges offer lighthearted respite while reflecting shared cultural realities across generation cohorts.`,

      `As East Africa's creator economy continues to mature, independent comics are increasingly treating digital production as a structured enterprise. Industry stakeholders anticipate further original programming and collaborative showcases from emerging humorists in the coming months. WireOps Desk will provide ongoing updates across the regional comedy landscape.`,
    ],

    // ── 7. MUSIC & RECORDING ARTS BEAT ───────────────────────────────────────
    music: [
      `The announcement has generated notable enthusiasm among music critics and followers across the region's dynamic recording sector. Broadcasters and streaming editors highlighted how contemporary Kenyan musicians are successfully blending authentic indigenous rhythms with contemporary urban production, asserting cultural pride while expanding international streaming reach.`,

      `Producers and sound engineers throughout Nairobi note that sustained commercial momentum hinges on meticulous sonic discipline, regular studio output, and active listener engagement. As streaming access widens across East Africa, recording artists who maintain creative authenticity while delivering high-grade audio experiences are earning dedicated followings across diverse demographics.`,

      `Industry analysts emphasize the vital role of radio programmers, live curators, and playlist editors in championing homegrown musical projects. Collective advocacy from broadcasting outlets and digital platforms ensures that authentic Kenyan recordings receive the sustained airplay necessary to establish enduring cultural relevance.`,

      `Looking ahead, regional music enthusiasts eagerly anticipate accompanying audiovisual releases, collaborative singles, and forthcoming live appearances. WireOps Desk will continue providing timely coverage as additional production milestones are unveiled.`,
    ],

    // ── 8. FILM, TELEVISION & CINEMA BEAT ────────────────────────────────────
    film: [
      `The production milestone signals another promising stride for Kenya's screen and dramatic arts landscape. Industry commentators observe that East African screenwriters, directors, and actors are steadily crafting compelling visual narratives that resonate with local audiences while commanding attention across regional and international festival circuits.`,

      `Film distributors and cinema programmers note that audience demand for locally produced feature films and episodic dramas has surged significantly. Viewers increasingly gravitate toward stories featuring relatable characters, authentic colloquial dialogue, and nuanced portrayals of contemporary East African life, encouraging production companies to invest in higher production values and broader casting calls.`,

      `Industry advocates also highlight the ongoing necessity for institutional support, structured production funding, and comprehensive intellectual property protection. Stakeholders throughout the film ecosystem continue to champion favorable filming policies and collaborative training workshops designed to elevate crew expertise and technical execution.`,

      `With production milestones advancing across multiple regional projects, cinema enthusiasts look forward to theatrical screenings and streaming releases in the upcoming season. WireOps Desk will maintain comprehensive coverage of Kenya's burgeoning screen industry.`,
    ],

    // ── 9. CRIME, COURTS & LEGAL PROCEEDINGS BEAT ────────────────────────────
    crime_legal: [
      `The legal developments have drawn close scrutiny from civil society observers and legal analysts monitoring procedural fairness and institutional accountability. Legal commentators emphasize that adherence to constitutional due process safeguards public faith in administrative justice mechanisms, ensuring that contested matters are adjudicated through established statutory channels rather than unverified public speculation.`,

      `Courtroom observers noted that transparent documentation, formal witness testimony, and verified factual records remain indispensable foundations of administrative proceedings. Judicial officers and investigative authorities continue to underline that due process protections must be scrupulously observed across all stages of public inquiries and dispute resolutions.`,

      `Legal analysts in Nairobi point out that public cases involving notable personalities frequently serve as important touchstones for wider statutory interpretations. Observers anticipate that subsequent hearings will clarify the statutory thresholds governing the contested issues, providing valuable judicial precedent for comparable matters in the future.`,

      `Formal proceedings are scheduled to resume in accordance with standard registry calendars, with legal representatives preparing subsequent filings for judicial review. WireOps Desk will provide verified follow-up reporting as official court filings and administrative rulings are placed on the formal record.`,
    ],

    // ── 10. LIVE EVENTS & FESTIVALS BEAT ─────────────────────────────────────
    event: [
      `Event organizers and venue managers emphasize that meticulous logistical coordination, comprehensive security protocols, and prompt attendee communication remain critical benchmarks for staging successful live gatherings. Large-scale public events serve as vital economic catalysts for host communities, stimulating local transport services, hospitality venues, and youth technical crews throughout the surrounding area.`,

      `Production coordinators in Nairobi and Western Kenya note that audience expectations for live performances have evolved considerably. Modern attendees prioritize seamless ticketing systems, dependable sound reinforcement, clear sightlines, and orderly crowd management, prompting event promoters to partner with seasoned staging specialists to ensure safe and memorable experiences.`,

      `Regional tourism and cultural commentators point out that prominent festivals play a significant role in showcasing local talent and celebrating community identity. Successful events strengthen inter-county cultural exchanges and draw visitors from across the country, highlighting the enduring appeal of vibrant live gatherings across East Africa.`,

      `Organizers confirmed that planning for subsequent calendar events is advancing smoothly, with technical teams conducting final site surveys and logistical briefings. WireOps Desk will continue tracking verified event schedules and administrative announcements.`,
    ],

    // ── 11. GENERAL CELEBRITY & NOTABLE PERSONALITIES BEAT ───────────────────
    celebrity_general: [
      `The public milestone reflects the dynamic nature of East Africa's media and creative sectors. Professionals throughout the region noted that adaptability, authentic audience engagement, and disciplined public communications remain essential factors in sustaining a meaningful public profile across modern multimedia channels.`,

      `Media commentators in Nairobi point out that digital platforms have fundamentally transformed how regional audiences interact with public figures. Audiences now expect consistent engagement, transparent communication, and genuine professionalism, making reputation resilience more critical than short-lived viral exposure.`,

      `Cultural observers also emphasize the importance of community solidarity and professional mentorship within Kenya's creative arts. Established practitioners and emerging talents frequently collaborate to navigate industry transitions, exchange technical expertise, and champion ethical production standards that benefit the broader creative fraternity.`,

      `Public relations strategists in Nairobi emphasize that public controversies or viral rumors necessitate disciplined factual communication. In an era where digital commentary accelerates uncorroborated narratives, public figures who address speculation through verified statements and structured media interviews preserve their professional integrity while discouraging sensationalism.`,

      `Broadcast and entertainment analysts across Kenya observe that enduring artist careers are built on consistent creative output and mutual respect with media partners. Industry veterans point out that professional boundaries and transparent collaboration between recording artists, radio presenters, and event promoters foster a healthy creative ecosystem that elevates East African talent nationally.`,

      `Legal and talent management consultants note that reputation management has become a sophisticated component of contemporary celebrity careers. Experienced managers advise public figures to maintain formal documentation, structured communication protocols, and clear stakeholder agreements to mitigate misunderstandings before they escalate into public disputes.`,

      `Regional culture commentators highlight that veteran performers serve as critical anchors for Kenya's contemporary entertainment landscape. Their insights and industry longevity offer valuable guidance for the next generation of creative talents working across music, broadcast media, and digital production.`,

      `Looking to the future, industry advisors anticipate focused progression across upcoming creative and professional commitments. WireOps Desk will provide timely coverage as further verified details emerge.`,
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
      `Urban planning experts and transit logistics analysts in Nairobi observe that the sustained growth of custom matatus illustrates the intersection of urban mobility and youth entrepreneurship. As commuter corridors continue to expand across Nairobi and surrounding counties, professional fleet operations that prioritize passenger safety alongside distinctive visual aesthetics will define the future of Kenya's public transport sector.`,
      `Transport SACCO leaders and road safety advocates emphasize that technical compliance with National Transport and Safety Authority guidelines remains the cornerstone of lasting commercial success. Commuter confidence depends on disciplined route scheduling, transparent fare structures, and qualified driving personnel, ensuring the matatu culture continues to thrive responsibly.`,
    ];
    return transitFallbacks.filter((cand) => {
      const snippet = cand.slice(0, 35).toLowerCase();
      return !existingBody.toLowerCase().includes(snippet);
    });
  }

  // Fallback for inverted-pyramid depth without topic drift
  const universalFallbacks = [
    `Media ethics scholars and senior editors in Nairobi emphasize that responsible reporting requires balancing public curiosity with verification rigor. As information circulates rapidly across messaging apps and online discussion spaces, independent newsrooms play a crucial role in providing measured, fact-checked context that separates verified developments from uncorroborated commentary.`,
    `Audiences in Kenya and across the East African diaspora continue to seek comprehensive coverage that respects the complexities of contemporary public life. As digital media channels expand, the demand for verified facts, respectful discourse, and journalistic fairness remains essential for building lasting reader trust. WireOps Desk remains committed to upholding these foundational principles across all published dispatches.`,
    `Communications strategists across East Africa observe that verified public engagement and transparent media briefings serve as vital tools for defusing digital misinformation. When high-profile public matters enter digital discussion spaces, stakeholders who communicate with speed, clarity, and factual discipline protect their long-term institutional reputations.`,
    `Digital content analysts in Nairobi highlight that contemporary audiences have developed a heightened awareness of editorial accuracy. Readers actively cross-reference breaking dispatches against verified primary records, penalizing speculative commentary while rewarding news organizations that uphold disciplined verification practices.`,
    `Sector analysts emphasize that sustainable creative and commercial initiatives depend on structured governance frameworks. Organizations that invest in documented operational policies, professional dispute resolution mechanisms, and transparent stakeholder communication establish enduring credibility across Kenya and the wider continent.`,
    `Economic analysts in Western Kenya and Nairobi point out that creative and commercial enterprises generate significant ripple effects throughout local supply chains. From production logistics and hospitality services to digital marketing and youth employment, organized industry initiatives continue to play an expanding role in Kenya's economic trajectory.`,
  ];

  return universalFallbacks.filter((cand) => {
    const snippet = cand.slice(0, 35).toLowerCase();
    return !existingBody.toLowerCase().includes(snippet);
  });
}
