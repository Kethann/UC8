/* ==========================================================================
   CONTENT DATA — edit here.
   Everything marked placeholder: true is dummy content to swap for real assets.
   ========================================================================== */

/* ---------- CLIENT LOGOS (PLACEHOLDER) ----------
   Replace each entry with { name: 'Brand', img: 'assets/clients/brand.svg' }.
   When `img` is set, the image is used instead of the styled wordmark. */
window.UC8_CLIENTS = []; // Add { name, img } entries to show this section.

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
  /* Lead-generation case template (art: 'leads'):
     metrics: up to 2 results, each { to, unit, label, icon } or a range { range: [from, to], label, icon }
     icon: 'team' | 'chat' | 'car'      tone: 'violet' | 'steel' | 'blue' (background colour of the result panel)
     pings: the small tags that pop in on the result panel
     social: { net: 'instagram' | 'facebook', url, handle } */
  {
    featured: true, art: 'leads', tone: 'violet', category: 'Campaigns',
    title: 'Maguvaa Event Management', sub: 'Lead generation',
    line: 'Lead generation for an events company: **250+ enquiries** and **100+ leads**.',
    tags: ['Lead generation', 'Campaigns', 'Events'],
    metrics: [{ to: 250, unit: '+', label: 'Enquiries', icon: 'chat' }, { to: 100, unit: '+', label: 'Leads generated', icon: 'team' }],
    pings: ['Enquiry', 'New lead', 'Enquiry'],
    story: 'We ran lead generation for Maguvaa Event Management. The campaigns brought in 250+ enquiries and 100+ leads for their events business.',
    results: ['250+ enquiries', '100+ leads generated', 'Lead generation for an events brand'],
  },
  {
    featured: true, art: 'leads', tone: 'steel', category: 'Campaigns',
    title: 'RS Verified Cars', sub: 'Instagram marketing & sales',
    line: 'Instagram marketing for a pre-owned car dealer: **10-12 cars sold every month** and **100+ enquiries**.',
    tags: ['Instagram marketing', 'Lead generation', 'Car sales'],
    metrics: [{ range: [10, 12], label: 'Cars sold / month', icon: 'car' }, { to: 100, unit: '+', label: 'Enquiries', icon: 'chat' }],
    pings: ['Enquiry', 'Test drive', 'Sold'],
    social: { net: 'instagram', url: 'https://www.instagram.com/raja_mallela/', handle: '@raja_mallela' },
    story: 'We run Instagram marketing for RS Verified Cars. The page now brings 100+ enquiries and helps close 10-12 car sales every month.',
    results: ['10-12 car sales every month', '100+ enquiries', 'Ongoing Instagram marketing'],
  },
  {
    featured: true, art: 'leads', tone: 'blue', category: 'Campaigns',
    title: 'Sesritha Technology', sub: 'Facebook lead generation · Nellore',
    line: 'Facebook lead generation for a Nellore tech company that brought in **200+ leads**.',
    tags: ['Facebook marketing', 'Lead generation', 'Campaigns'],
    metrics: [{ to: 200, unit: '+', label: 'Leads generated', icon: 'team' }],
    pings: ['New lead', 'New lead', 'New lead'],
    social: { net: 'facebook', url: 'https://www.facebook.com/sesrithat', handle: 'Sesritha Technology' },
    story: 'We ran Facebook lead generation for Sesritha Technology in Nellore and brought in 200+ leads.',
    results: ['200+ leads generated', 'Facebook lead generation'],
  },
];

/* ---------- VIDEO WORK ----------
   Shown in the Work section under the "Video" filter. Each card plays the video from Google Drive.
   id    = the Google Drive file id (the part after /file/d/ in the share link; the file must be "Anyone with the link")
   thumb = the chosen frame from the video (assets/work/videos/…)
   v     = true for vertical (9:16) videos, false for horizontal (16:9)
   pos   = optional focus point for the thumbnail crop (CSS object-position) */
window.UC8_VIDEOS = [
  { id: '1WuJ8ykohkQ-c2m3k_Y922iOH5MqNHYXl', title: 'Kalyani Bike Edit', cat: 'Bike Edit', thumb: 'assets/work/videos/kalyani-bike-edit.webp', v: false, dur: '0:20' },
  { id: '1lU_dygJm8C2CjkfrKdLJ_aMkuaiZ4bPZ', title: 'Bullet Edit', cat: 'Bike Edit', thumb: 'assets/work/videos/bullet-edit.webp', v: true, dur: '0:15' },
  { id: '1ChvtquDbMT4xk5fNYBU6gXD_cN07MEIi', title: 'Fortuner Car Delivery', cat: 'Car Delivery', thumb: 'assets/work/videos/fortuner-car-delivery.webp', v: true, dur: '0:42' },
  { id: '1SXeDlsbNC8cz7dxpwb2PZArUNahGTUHw', title: 'Vinayaka Chaturthi · Edit 1', cat: 'Festival', thumb: 'assets/work/videos/vinayaka-chaturthi-1.webp', v: true, dur: '0:18' },
  { id: '1cenDg7wpyX-KzK0ljY8cuz9Aauy4ul7h', title: 'Marriage Invitation', cat: 'Marriage Invitation', thumb: 'assets/work/videos/marriage-invitation.webp', v: false, dur: '0:50' },
  { id: '1X9OkBrLT2OTlwiCAKBbHRaiAmXLFyN9V', title: 'Fortuner (V) Edit', cat: 'Car Delivery', thumb: 'assets/work/videos/fortuner-v-edit.webp', v: true, dur: '0:44' },
  { id: '1w3aooa29RJL529KaCEmg_oiPohQpkLIL', title: 'Half Saree Function', cat: 'Half Saree', thumb: 'assets/work/videos/half-saree-function.webp', v: false, dur: '3:09', pos: '45% 50%' },
  { id: '1bD_uuiWrBNUUv6KEnrTkoCbEA0zTJ3se', title: 'Dead People · AI Video', cat: 'AI Video', thumb: 'assets/work/videos/dead-people-ai-1.webp', v: true },
  { id: '11mT_ljnodOZHrtubMsju-wJpekNLLWRW', title: 'Pooja Ceremony', cat: 'Ceremony', thumb: 'assets/work/videos/ceremony.webp', v: true, dur: '0:33' },
  { id: '11tDKFXxEfqTOxtaShIua2sM8LzhrUj3j', title: 'AA 22 Holic Bike', cat: 'Bike Edit', thumb: 'assets/work/videos/aa22-holic-bike.webp', v: false, dur: '0:35' },
  { id: '1ucqnGZu9h0xG_FCX218Br-rW34RjbrwJ', title: 'Vinayaka Chaturthi · Edit 2', cat: 'Festival', thumb: 'assets/work/videos/vinayaka-chaturthi-2.webp', v: false, dur: '0:23' },
  { id: '1yb8ISsTfXLZkoXpnOkc3Gbv5tqNunuiM', title: 'Caramel Krush', cat: 'Stall Edit', thumb: 'assets/work/videos/caramel-krush.webp', v: true },
  { id: '1wZEmONNT85e8Jos3lGMZeXa-IouYBoa6', title: 'Dead People · AI Video 2', cat: 'AI Video', thumb: 'assets/work/videos/dead-people-ai-2.webp', v: true },
  { id: '1nnEXIQn1Je3BPRF8js83PbN8ZMzr3_It', title: 'Rammohan Akula Gruhapravesham', cat: 'Gruhapravesham', thumb: 'assets/work/videos/rammohan-gruhapravesham.webp', v: false, dur: '3:17' },
  { id: '1vkPtCN_kFxQLaS6X2B51AZeSke5pDRQr', title: 'Gruhapravesham Glimpse', cat: 'Gruhapravesham', thumb: 'assets/work/videos/gruhapravesham-glimpse.webp', v: false },
];

/* ---------- SERVICES (UC8's 8 services) ---------- */
window.UC8_SERVICES = [
  { icon: 'u-marketing', title: 'Digital Marketing', line: 'Paid and organic campaigns that compound.',
    text: 'Full-funnel marketing across Meta, Google and the platforms your audience lives on. We plan, launch, test and scale, with reporting that tells you what actually moved.',
    list: ['Meta & Google Ads', 'Funnel & landing strategy', 'A/B creative testing', 'Monthly performance reports'] },
  { icon: 'u-web', title: 'Website Development', line: 'Fast, beautiful sites built to convert, not just to exist.',
    text: 'From one-page launches to full e-commerce. Designed in-house, built for speed, SEO-ready and easy for your team to update.',
    list: ['UI/UX design', 'Custom & CMS builds', 'E-commerce', 'Speed & SEO foundations'] },
  { icon: 'u-content', title: 'Content Creation', line: 'Scroll-stopping content, made on a rhythm.',
    text: 'Monthly content engines: concepts, scripts, shoots, edits and posting calendars. Consistent quality without you chasing anyone.',
    list: ['Content calendars', 'Reels & short-form', 'Carousels & statics', 'Copywriting & captions'] },
  { icon: 'u-brand', title: 'Personal Branding', line: 'Turn founders and creators into recognisable voices.',
    text: 'Positioning, visual identity and a content system built around you, so your name opens doors before you do.',
    list: ['Positioning & narrative', 'Profile optimisation', 'Founder-led content', 'LinkedIn & Instagram growth'] },
  { icon: 'u-seo', title: 'SEO Optimization', line: 'Get found by people already searching for you.',
    text: 'Technical fixes, content strategy and local SEO that build compounding organic traffic. Measured, not guessed.',
    list: ['Technical SEO audit', 'Keyword & content strategy', 'Local SEO / Google Business', 'Ranking reports'] },
  { icon: 'u-edit', title: 'Video Editing', line: 'Edits with rhythm, hooks and retention baked in.',
    text: 'Short-form, long-form, ads and brand films. Pacing, sound design, colour and captions that keep people watching.',
    list: ['Reels & shorts', 'YouTube long-form', 'Colour grading', 'Motion graphics & captions'] },
  { icon: 'u-design', title: 'Designing Services', line: 'Brand identities and visuals with a point of view.',
    text: 'Logos, brand systems, social templates, packaging and print, designed to look premium everywhere your brand shows up.',
    list: ['Logo & identity', 'Brand guidelines', 'Social templates', 'Print & packaging'] },
  { icon: 'u-shoot', title: 'Video Shooting', line: 'On-set production from concept to final frame.',
    text: 'Camera, lighting and direction for brand films, product shoots, interviews and content days, in studio or on location.',
    list: ['Pre-production & storyboards', 'Cinema camera & lighting', 'Product & lifestyle shoots', 'Content days'] },
];
