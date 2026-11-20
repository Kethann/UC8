/* ==========================================================================
   CONTENT DATA — edit here.
   Everything marked placeholder: true is dummy content to swap for real assets.
   ========================================================================== */

/* ---------- CLIENT LOGOS (PLACEHOLDER) ----------
   Replace each entry with { name: 'Brand', img: 'assets/clients/brand.svg' }.
   When `img` is set, the image is used instead of the styled wordmark. */
window.UC8_CLIENTS = []; // empty = section stays hidden. Add { name, img } entries when real logos are ready.

/* ---------- PROJECTS ----------
   featured: true  → real client case study (wide card with an animated result)
   (add more objects to this list as new work is ready; filter tabs appear automatically)
   category must match a filter tab: 'Websites' | 'Social & Content' | 'Branding' | 'Video' | 'Campaigns'
   Optional: thumb: 'assets/work/xyz.jpg' (16:10) and link: 'https://…' */
window.UC8_PROJECTS = [
  {
    featured: true, art: 'growth', category: 'Social & Content',
    title: 'Radee Sarees', sub: 'Instagram page management',
    line: 'Grew a saree brand’s Instagram from **4K to 38K followers**, a **9.5× growth** in audience.',
    tags: ['Instagram management', 'Content & posting', 'Page growth'],
    metric: { from: 4, to: 38, unit: 'K', label: 'Instagram followers' }, badge: '9.5× growth',
    instagram: { url: 'https://www.instagram.com/radeesarees/?hl=en', handle: '@radeesarees' },
    story: 'We manage the Radee Sarees Instagram page: planning, posting and keeping it active every week. The page grew from 4K to 38K followers.',
    results: ['Followers: 4K → 38K', '9.5× audience growth', 'Ongoing page management'],
  },
  {
    featured: true, art: 'leads', category: 'Campaigns',
    title: 'Maguvaa Event Management', sub: 'Lead generation',
    line: 'Lead generation for an events company that brought in **100+ leads**.',
    tags: ['Lead generation', 'Campaigns', 'Events'],
    metric: { to: 100, unit: '+', label: 'leads generated' }, badge: 'Lead gen',
    story: 'We ran lead generation for Maguvaa Event Management and brought in 100+ leads for their events business.',
    results: ['100+ leads generated', 'Lead generation for an events brand'],
  },
];

/* ---------- SERVICES (UC8's 8 services) ---------- */
window.UC8_SERVICES = [
  { icon: 'u-marketing', title: 'Digital Marketing', line: 'Paid and organic campaigns that compound.',
    text: 'Full-funnel marketing across Meta, Google and the platforms your audience lives on. We plan, launch, test and scale — with reporting that tells you what actually moved.',
    list: ['Meta & Google Ads', 'Funnel & landing strategy', 'A/B creative testing', 'Monthly performance reports'] },
  { icon: 'u-web', title: 'Website Development', line: 'Fast, beautiful sites built to convert, not just to exist.',
    text: 'From one-page launches to full e-commerce. Designed in-house, built for speed, SEO-ready and easy for your team to update.',
    list: ['UI/UX design', 'Custom & CMS builds', 'E-commerce', 'Speed & SEO foundations'] },
  { icon: 'u-content', title: 'Content Creation', line: 'Scroll-stopping content, made on a rhythm.',
    text: 'Monthly content engines: concepts, scripts, shoots, edits and posting calendars — consistent quality without you chasing anyone.',
    list: ['Content calendars', 'Reels & short-form', 'Carousels & statics', 'Copywriting & captions'] },
  { icon: 'u-brand', title: 'Personal Branding', line: 'Turn founders and creators into recognisable voices.',
    text: 'Positioning, visual identity and a content system built around you — so your name opens doors before you do.',
    list: ['Positioning & narrative', 'Profile optimisation', 'Founder-led content', 'LinkedIn & Instagram growth'] },
  { icon: 'u-seo', title: 'SEO Optimization', line: 'Get found by people already searching for you.',
    text: 'Technical fixes, content strategy and local SEO that build compounding organic traffic — measured, not guessed.',
    list: ['Technical SEO audit', 'Keyword & content strategy', 'Local SEO / Google Business', 'Ranking reports'] },
  { icon: 'u-edit', title: 'Video Editing', line: 'Edits with rhythm, hooks and retention baked in.',
    text: 'Short-form, long-form, ads and brand films. Pacing, sound design, colour and captions that keep people watching.',
    list: ['Reels & shorts', 'YouTube long-form', 'Colour grading', 'Motion graphics & captions'] },
  { icon: 'u-design', title: 'Designing Services', line: 'Brand identities and visuals with a point of view.',
    text: 'Logos, brand systems, social templates, packaging and print — designed to look premium everywhere your brand shows up.',
    list: ['Logo & identity', 'Brand guidelines', 'Social templates', 'Print & packaging'] },
  { icon: 'u-shoot', title: 'Video Shooting', line: 'On-set production from concept to final frame.',
    text: 'Camera, lighting and direction for brand films, product shoots, interviews and content days — studio or on location.',
    list: ['Pre-production & storyboards', 'Cinema camera & lighting', 'Product & lifestyle shoots', 'Content days'] },
];
