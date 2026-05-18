// =============================================================================
// generate-onboarding-doc.mjs
//
// Produces the client-facing onboarding doc:
//   C:\Users\markm\Desktop\Halo-Air-Project-Overview-Questionnaire.docx
//
// Reflects the actual Halo Air build state as of mid-2026:
//   - Astro static site (deploying to SiteGround) — Phase 1
//   - Web3Forms for booking + contact forms — Phase 1
//   - Anthropic Claude + Google Calendar + Resend — Phase 2 (AI dispatcher)
//
// Run with:  node scripts/generate-onboarding-doc.mjs
// =============================================================================
import {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  ImageRun, AlignmentType, HeadingLevel, LevelFormat, BorderStyle,
  WidthType, ShadingType, PageBreak, PageOrientation,
} from 'docx';
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const OUT = 'C:/Users/markm/Desktop/Halo-Air-Project-Overview-Questionnaire.docx';
const LOGO = join(process.cwd(), 'public', 'images', 'logo.png');

// ---------- Brand colors (no leading #) ----------
const BRAND_BLUE = '0858AC';
const BRAND_ORANGE = 'E03A00';
const INK = '0E1320';
const SLATE = '3A4256';
const CREAM = 'FAF7F2';
const LINE = 'E6E1D8';
const BLUE_TINT = 'EAF5FF';
const ORANGE_TINT = 'FFF1EB';

// ---------- Helper builders ----------
const fontDefault = { font: 'Arial' };

function p(text, opts = {}) {
  const runs = Array.isArray(text)
    ? text
    : [new TextRun({ text, ...fontDefault, ...opts.run })];
  return new Paragraph({
    children: runs,
    spacing: { before: opts.before ?? 0, after: opts.after ?? 120 },
    alignment: opts.align,
    ...opts.paragraph,
  });
}

function h1(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_1,
    children: [new TextRun({ text, font: 'Arial', bold: true, size: 36, color: BRAND_BLUE })],
    spacing: { before: 360, after: 200 },
  });
}

function h2(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_2,
    children: [new TextRun({ text, font: 'Arial', bold: true, size: 26, color: INK })],
    spacing: { before: 280, after: 140 },
  });
}

function h3(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_3,
    children: [new TextRun({ text, font: 'Arial', bold: true, size: 22, color: BRAND_ORANGE })],
    spacing: { before: 200, after: 100 },
  });
}

function body(text, opts = {}) {
  return p(text, { run: { size: 22, color: SLATE, ...opts.run }, after: opts.after ?? 120, ...opts });
}

function bullet(text) {
  return new Paragraph({
    numbering: { reference: 'bullets', level: 0 },
    children: [new TextRun({ text, font: 'Arial', size: 22, color: SLATE })],
    spacing: { after: 80 },
  });
}

function checkbox(text, hint) {
  // Visual: ☐  Question (bold)  ← hint italic small
  const runs = [
    new TextRun({ text: '☐  ', font: 'Arial', size: 22, color: INK }),
    new TextRun({ text, font: 'Arial', size: 22, bold: true, color: INK }),
  ];
  const headerPara = new Paragraph({
    children: runs,
    spacing: { before: 160, after: 40 },
  });
  if (!hint) return [headerPara, blankAnswerBox()];
  const hintPara = new Paragraph({
    children: [new TextRun({ text: hint, font: 'Arial', size: 18, italics: true, color: SLATE })],
    spacing: { after: 40 },
    indent: { left: 400 },
  });
  return [headerPara, hintPara, blankAnswerBox()];
}

// Blank answer box = small empty table cell with a bottom border, gives client
// somewhere to handwrite or type their answer.
function blankAnswerBox() {
  const blank = new Paragraph({
    children: [new TextRun({ text: ' ', font: 'Arial', size: 20 })],
    spacing: { before: 40, after: 40 },
  });
  return new Table({
    width: { size: 9360, type: WidthType.DXA },
    columnWidths: [9360],
    rows: [
      new TableRow({
        children: [
          new TableCell({
            borders: {
              top: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
              left: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
              right: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
              bottom: { style: BorderStyle.SINGLE, size: 6, color: LINE },
            },
            width: { size: 9360, type: WidthType.DXA },
            margins: { top: 100, bottom: 100, left: 120, right: 120 },
            children: [blank, blank, blank],
          }),
        ],
      }),
    ],
  });
}

// Callout box (one-row table with tinted background) — used for "what's new"
// alerts and recommendation tips throughout.
function callout(label, message, tone = 'blue') {
  const fill = tone === 'orange' ? ORANGE_TINT : BLUE_TINT;
  const stripe = tone === 'orange' ? BRAND_ORANGE : BRAND_BLUE;
  return new Table({
    width: { size: 9360, type: WidthType.DXA },
    columnWidths: [9360],
    rows: [
      new TableRow({
        children: [
          new TableCell({
            shading: { fill, type: ShadingType.CLEAR },
            borders: {
              top: { style: BorderStyle.SINGLE, size: 4, color: stripe },
              bottom: { style: BorderStyle.SINGLE, size: 4, color: stripe },
              left: { style: BorderStyle.SINGLE, size: 24, color: stripe },
              right: { style: BorderStyle.SINGLE, size: 4, color: stripe },
            },
            width: { size: 9360, type: WidthType.DXA },
            margins: { top: 160, bottom: 160, left: 240, right: 200 },
            children: [
              new Paragraph({
                children: [new TextRun({ text: label, font: 'Arial', size: 18, bold: true, color: stripe, allCaps: true })],
                spacing: { after: 80 },
              }),
              new Paragraph({
                children: [new TextRun({ text: message, font: 'Arial', size: 22, color: INK })],
              }),
            ],
          }),
        ],
      }),
    ],
  });
}

// Standard 2-col info table (e.g., phase rows, cost rows)
function infoTable(headers, rows, colWidths = [3120, 6240]) {
  const totalWidth = colWidths.reduce((a, b) => a + b, 0);
  const cellBorders = {
    top: { style: BorderStyle.SINGLE, size: 4, color: LINE },
    bottom: { style: BorderStyle.SINGLE, size: 4, color: LINE },
    left: { style: BorderStyle.SINGLE, size: 4, color: LINE },
    right: { style: BorderStyle.SINGLE, size: 4, color: LINE },
  };

  const headerRow = new TableRow({
    tableHeader: true,
    children: headers.map((label, i) => new TableCell({
      borders: cellBorders,
      shading: { fill: BRAND_BLUE, type: ShadingType.CLEAR },
      width: { size: colWidths[i], type: WidthType.DXA },
      margins: { top: 120, bottom: 120, left: 160, right: 160 },
      children: [new Paragraph({
        children: [new TextRun({ text: label, font: 'Arial', size: 22, bold: true, color: 'FFFFFF' })],
      })],
    })),
  });

  const dataRows = rows.map((row, rIdx) => new TableRow({
    children: row.map((cell, i) => new TableCell({
      borders: cellBorders,
      shading: rIdx % 2 === 0
        ? { fill: 'FFFFFF', type: ShadingType.CLEAR }
        : { fill: CREAM, type: ShadingType.CLEAR },
      width: { size: colWidths[i], type: WidthType.DXA },
      margins: { top: 120, bottom: 120, left: 160, right: 160 },
      children: Array.isArray(cell)
        ? cell.map((line, k) => new Paragraph({
            children: [new TextRun({ text: line, font: 'Arial', size: 22, color: INK, bold: k === 0 && row.length === 2 && i === 0 })],
            spacing: { after: 60 },
          }))
        : [new Paragraph({
            children: [new TextRun({ text: cell, font: 'Arial', size: 22, color: INK, bold: i === 0 && headers[0].toLowerCase().includes('phase') })],
          })],
    })),
  }));

  return new Table({
    width: { size: totalWidth, type: WidthType.DXA },
    columnWidths: colWidths,
    rows: [headerRow, ...dataRows],
  });
}

function divider() {
  return new Paragraph({
    children: [new TextRun({ text: '', size: 2 })],
    border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: BRAND_BLUE, space: 1 } },
    spacing: { before: 80, after: 240 },
  });
}

function pageBreak() {
  return new Paragraph({ children: [new PageBreak()] });
}

// ---------- COVER ----------
const logoBuffer = readFileSync(LOGO);
const cover = [
  // Logo centered
  new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { before: 1200, after: 480 },
    children: [new ImageRun({
      type: 'png',
      data: logoBuffer,
      transformation: { width: 240, height: 240 },
      altText: { title: 'Halo Air logo', description: 'Halo Air Heating & Cooling Ltd. logo', name: 'logo' },
    })],
  }),
  new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { after: 120 },
    children: [new TextRun({
      text: 'HALO AIR HEATING & COOLING LTD.',
      font: 'Arial', bold: true, size: 26, color: BRAND_BLUE, characterSpacing: 60,
    })],
  }),
  new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { after: 80 },
    children: [new TextRun({
      text: 'Project Overview & Onboarding',
      font: 'Arial', bold: true, size: 48, color: INK,
    })],
  }),
  new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { after: 600 },
    children: [new TextRun({
      text: 'Website + AI Smart Dispatcher  —  Two phases, one team.',
      font: 'Arial', italics: true, size: 24, color: SLATE,
    })],
  }),
  // Subtle separator
  new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { after: 80 },
    border: { bottom: { style: BorderStyle.SINGLE, size: 8, color: BRAND_ORANGE, space: 1 } },
    children: [new TextRun({ text: '', size: 2 })],
  }),
  new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { before: 200, after: 60 },
    children: [new TextRun({
      text: 'Prepared for John Capicio',
      font: 'Arial', size: 22, color: SLATE,
    })],
  }),
  new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { after: 800 },
    children: [new TextRun({
      text: 'May 2026',
      font: 'Arial', size: 22, color: SLATE,
    })],
  }),
  // Bottom banner
  callout(
    'What this document is',
    "A plain-English overview of what we're building for Halo Air, where the project stands today, and the short list of things we need from you to launch. Section 4 is the only part where you'll need to fill anything in.",
    'blue',
  ),
];

// ---------- SECTION 1: Where we are right now ----------
const sec1 = [
  pageBreak(),
  h1('1. Where We Are Right Now'),
  divider(),
  body([
    new TextRun({ text: 'Good news: the website is already largely built.', font: 'Arial', bold: true, size: 24, color: INK }),
    new TextRun({ text: ' We took your brand assets, your phone number, and the four trades you carry, and turned it into a fully working modern website with all the SEO infrastructure baked in from day one.', font: 'Arial', size: 22, color: SLATE }),
  ]),
  body("Here's a snapshot of what's already in place:", { after: 200 }),

  h3('Pages built'),
  bullet('Homepage — hero, services overview, trust signals, Google review CTA, service area map'),
  bullet('5 dedicated service pages — AC Repair, Furnace Installation, Heat Pumps, Maintenance, 24/7 Emergency'),
  bullet('8 service-area pages — Edmonton, Sherwood Park, St. Albert, Spruce Grove, Stony Plain, Leduc, Beaumont, Fort Saskatchewan'),
  bullet('8 expert blog articles — cost guides, rebate info, decision frameworks, seasonal checklists'),
  bullet('About, Contact, Book a Visit, Privacy, Terms, and a branded 404 page'),
  bullet('Total: 31 pages, all written specifically for your business — no generic filler'),

  h3('Brand integration'),
  bullet('Your actual logo embedded across the site (header, hero, footer, share previews)'),
  bullet("Brand colors derived from your logo: electric blue + orange, light cream background"),
  bullet('Custom Open Graph share image generated from your logo for when the site is shared on Facebook, X, SMS, etc.'),
  bullet('Custom favicon (the little icon in browser tabs)'),

  h3('SEO foundation (the engine that makes Google find you)'),
  bullet('Structured data markup that tells Google you\'re an HVAC business, where you serve, what you charge, your hours, and what services you offer'),
  bullet('Every page individually optimized for a specific search term ("AC repair Edmonton", "furnace installation Sherwood Park", etc.)'),
  bullet('XML sitemap automatically generated for Google Search Console'),
  bullet('AI-search optimization — explicit allow rules for ChatGPT, Claude, Perplexity, and Google AI Overviews so your business is cited in AI answers'),
  bullet('llms.txt file — a special discovery file that AI search engines read to understand your business at a glance'),

  h3('Booking system'),
  bullet('Full booking form with all the fields the future AI dispatcher will need — ready for Phase 2 with no rebuild'),
  bullet('Lighter contact form for general questions'),
  bullet('Phase 1: form submissions email straight to you'),
  bullet('Phase 2: same form, but routed to the AI dispatcher (no design change for customers)'),
];

// ---------- SECTION 2: What's coming ----------
const sec2 = [
  pageBreak(),
  h1('2. The Two Phases'),
  divider(),
  body("We're building Halo Air's online presence in two phases that work together seamlessly. Phase 1 launches first; Phase 2 plugs in once your foundation is live."),

  h2('Phase 1 — Your SEO-Powerful Website'),
  body('This is the site that brings customers to you. It runs 24/7 with no monthly fees beyond hosting and your domain. Customers can:'),
  bullet('Find you on Google when they search "AC repair Edmonton" or any local HVAC term'),
  bullet('Read about your services in plain English'),
  bullet('Submit a booking request through the website form'),
  bullet('Call you directly with one tap on any page'),
  bullet('Leave Google reviews via the prominent CTA on the homepage'),
  callout(
    'Phase 1 status: ~95% complete',
    "The build itself is done. We're waiting on a few details from you (Section 4) before we can flip the switch and go live.",
    'blue',
  ),

  h2('Phase 2 — Your AI Smart Dispatcher'),
  body("This is the part that sets Halo Air apart. When a customer fills out a booking request, an AI system reads it, checks your Google Calendar for availability, and proposes a time — all without you lifting a finger."),
  body("Here's exactly what happens:", { after: 120 }),
  bullet('Customer submits a booking request on your website'),
  bullet("The AI reads the request and matches it against your Google Calendar's free slots"),
  bullet('You get a notification with the proposed booking — approve it with one tap on your phone'),
  bullet('Customer gets a confirmation email with the booking details'),
  bullet('Booking is added to your Google Calendar automatically'),
  callout(
    'You stay in control',
    "Every booking comes to you for approval first. The AI doesn't auto-confirm anything you haven't seen. Once you trust the system, you can switch to fully automatic.",
    'orange',
  ),
  body('Phase 2 status: planned for next sprint. The Phase 1 build was deliberately structured so Phase 2 is a clean plug-in — no rebuild, no redesign.', { run: { italics: true, color: SLATE } }),
];

// ---------- SECTION 3: How it all works ----------
const sec3 = [
  pageBreak(),
  h1('3. How It All Works Together'),
  divider(),
  body("You don't need to follow the technical details — that's our job. But here's a plain-English overview of what's running where, and why."),

  h2('The Halo Air technology stack'),
  infoTable(
    ['Layer', 'What it is and why we picked it'],
    [
      ['Website framework', 'Astro — a modern site generator that produces ultra-fast pages with no monthly software fees. The same technology used by Netflix, Porsche, and other major brands.'],
      ['Hosting', 'SiteGround — reliable Canadian-accessible hosting with strong customer support, fast page loads, and free SSL security.'],
      ['Forms (Phase 1)', 'Web3Forms — a free service that takes your booking and contact form submissions and emails them straight to you. No monthly cost on the volume you\'ll see.'],
      ['AI Dispatcher (Phase 2)', 'Anthropic Claude — the most capable AI for understanding natural-language booking requests. Pay only for what you use; typical HVAC volume runs $5–15/month.'],
      ['Calendar (Phase 2)', 'Google Calendar — the AI reads from and writes to your existing calendar. No new system to learn.'],
      ['Confirmation email (Phase 2)', 'Resend — sends customers a professional confirmation email when a booking is approved. Free tier covers the first 3,000 emails/month.'],
    ],
    [2640, 6720],
  ),

  h2('The customer journey'),
  body("From the customer's point of view, everything is simple:", { after: 120 }),
  bullet('Searches "AC repair Edmonton" on Google'),
  bullet('Finds your site, which ranks because of the SEO foundation we built'),
  bullet('Reads about the service, sees the trust signals, decides to book'),
  bullet('Fills out a 60-second form'),
  bullet('Gets a confirmation email within minutes'),
  bullet('Sees you on the doorstep at the agreed time'),
  body("From your point of view (Phase 2):", { after: 120 }),
  bullet('Your phone buzzes with a notification of a new booking request'),
  bullet('You tap approve, or reschedule, or call the customer if you have questions'),
  bullet("That's it. The calendar update, the customer confirmation, and the record-keeping happen automatically."),
];

// ---------- SECTION 4: Costs ----------
const sec4 = [
  pageBreak(),
  h1('4. Your Monthly Running Costs'),
  divider(),
  body("One of the biggest reasons we built it this way: your monthly costs are a fraction of what most HVAC marketing companies charge — with none of the lock-in. You own every account from day one."),

  h2('Cost breakdown'),
  infoTable(
    ['Service', 'What it does', 'Estimated cost'],
    [
      ['SiteGround hosting', 'Hosts the website files. Fast, reliable, Canadian-friendly.', '~$5–10 / month'],
      ['Domain name', 'Your web address (e.g. haloair.ca). Paid once per year.', '~$15–20 / year'],
      ['Google Workspace', 'Professional business email (you@haloair.ca) and Google Calendar.', '~$7 / month'],
      ['Web3Forms (Phase 1)', 'Routes booking + contact form submissions to your email.', 'Free'],
      ['Anthropic Claude (Phase 2)', 'Powers the AI dispatcher. Pay per booking processed.', '~$5–15 / month'],
      ['Resend (Phase 2)', 'Sends customer booking confirmation emails.', 'Free up to 3,000 / mo'],
    ],
    [2400, 4560, 2400],
  ),
  body('Total: roughly $20–40 per month for everything once Phase 2 is live, plus your domain renewal each year.', {
    run: { bold: true, color: INK, size: 22 },
    after: 80,
  }),
  callout(
    'You own everything',
    "Every account is in your name. If we ever part ways, your site, your domain, your customer data, and your calendar continue to work without interruption. Nothing is tied to our accounts or servers.",
    'orange',
  ),
];

// ---------- SECTION 5: What we need from you ----------
const sec5Intro = [
  pageBreak(),
  h1('5. What We Need From You'),
  divider(),
  body("This is the only section where you have something to do. Most of your business info is already in the build — below is the short list of items we still need to lock in before launch (and to enable Phase 2 later)."),
  callout(
    'How to fill this in',
    "Tick the boxes as you go, fill in the lines, and either send the doc back via email or just answer the questions in a reply. Don't worry about getting everything perfect — anything you're unsure about, we'll cover on a quick call.",
    'blue',
  ),
];

// Question groups
const groupA = [
  h2('A.  Domain & Launch'),
  ...checkbox('What domain name do you want for the site?', 'e.g. haloair.ca, haloairhvac.ca, halaairheating.com. Tell us your first choice and a backup in case it\'s taken.'),
  ...checkbox('Do you already own a domain name?', 'If yes, where is it registered (GoDaddy, Namecheap, etc.) and what\'s the login email?'),
  ...checkbox('Do you have hosting already, or do you want us to set up SiteGround for you?', 'Either is fine. SiteGround is what we recommend and have configured the site for.'),
];

const groupB = [
  h2('B.  Business Details to Confirm'),
  body("We pulled most of this from your logo, business card, and Google Business listing — just confirm what we have is right.", { run: { italics: true, color: SLATE, size: 20 } }),
  ...checkbox('Confirm: business legal name is Halo Air Heating & Cooling Ltd.', 'Tick if correct, or write the correct legal name below.'),
  ...checkbox('Confirm: main phone number is 780-224-0024', 'Tick if correct, or write the correct number below.'),
  ...checkbox('What is your business email address?', "e.g. info@haloair.ca — if you don't have one yet, we'll set up Google Workspace for you."),
  ...checkbox('What is your business mailing address?', "Even if you don't want it shown on the site, Google needs it for the local SEO listing. This affects your ranking."),
  ...checkbox('Confirm: tagline is "Next-level Comfort"', 'Tick if correct, or suggest an alternative.'),
];

const groupC = [
  h2('C.  Google Business Profile (the biggest SEO lever)'),
  body("Google Business Profile is the single most important thing for local HVAC ranking. We need access to verify your business, link the website properly, and let customers find you in Google Maps.", { run: { color: SLATE, size: 20 } }),
  ...checkbox('Do you already have a Google Business Profile?', "If yes, what's the Google account email it's under? If no, we'll create one with you."),
  ...checkbox('Are you the verified owner of the listing?', "If unsure, we'll check together — the listing exists, but ownership status matters."),
  ...checkbox('Can you add us as a manager to your Google Business Profile?', "This lets us update photos, services, hours, and posts on your behalf. Takes 30 seconds once you're in the dashboard."),
];

const groupD = [
  h2('D.  Booking Form Setup (Phase 1)'),
  ...checkbox('Create a free Web3Forms account at web3forms.com', "Use info@haloair.ca or your preferred email. Once created, send us the access key — we'll plug it into the booking form."),
  ...checkbox('Which email address should booking requests arrive at?', "This is where every customer booking lands as an email. You can change it later."),
  ...checkbox('Which email address should contact form messages arrive at?', "Can be the same as above, or different."),
];

const groupE = [
  h2('E.  Scheduling Rules (for Phase 2 AI Dispatcher)'),
  body("These shape how the AI dispatcher works when Phase 2 goes live. Best estimates are fine — we can refine later.", { run: { italics: true, color: SLATE, size: 20 } }),
  ...checkbox('How many service calls can you typically handle in one day?', 'e.g. 4 jobs/day if it\'s mostly you, more if you have crew.'),
  ...checkbox('Do you have employees or technicians, or is it just you right now?', "Helps us know if the AI is dispatching to one calendar or several."),
  ...checkbox('How long does each job type usually take?', "e.g. AC repair ≈ 2 hrs, furnace install ≈ 5 hrs, maintenance visit ≈ 1 hr, heat pump install ≈ 1 day."),
  ...checkbox('Are there days or times you never want bookings?', "e.g. no Sundays, no bookings after 4pm, family time blocked Tuesday evenings."),
  ...checkbox('Do you want every AI booking to require your approval, or auto-confirm?', "We recommend approval mode at first — you can flip to auto later once you trust the system."),
  ...checkbox('How much travel buffer do you want between jobs?', "e.g. 30 minutes between calls so you\'re not always rushing."),
];

const groupF = [
  h2('F.  Reviews & Social Proof'),
  ...checkbox('Are there any existing Google reviews you\'re especially proud of?', "Once Phase 1 launches we can highlight a few directly on the site."),
  ...checkbox('Do you have a Facebook page for Halo Air?', 'If yes, share the link. We\'ll add it to the footer + structured data.'),
  ...checkbox('Do you have an Instagram?', 'Same as above.'),
  ...checkbox('Do you have any customer testimonials we can use?', "Even one or two sentences from happy customers, with first names + neighbourhoods, goes a long way."),
];

const groupG = [
  h2('G.  Anything Else'),
  ...checkbox('What makes Halo Air different from other Edmonton HVAC contractors?', "In your own words. Whatever you say here becomes the heart of your site copy."),
  ...checkbox('Are there any specific competitors you want to stand apart from?', "Helps us understand the positioning."),
  ...checkbox('Is there anything you\'re worried about or want to make sure we get right?', "Tell us before launch — way easier to fix now than later."),
  ...checkbox('Any other questions for us?', "Anything goes."),
];

// ---------- CLOSING ----------
const closing = [
  pageBreak(),
  h1('Next Steps'),
  divider(),
  body("Once you've filled in Section 4:", { after: 120 }),
  bullet('Send the doc back (or just reply with the answers).'),
  bullet("We'll spend 15 minutes on a kickoff call to lock in domain choice and Google Business access."),
  bullet("We'll launch Phase 1 (the website goes live on your domain)."),
  bullet("We'll book the Phase 2 sprint to switch on the AI dispatcher."),
  body('From the date you send the answers back, Phase 1 launch is typically within 5–7 business days.', { run: { bold: true, color: INK }, after: 240 }),

  callout(
    'Questions before kickoff?',
    "Just reach out anytime — email or text is fine. There’s no such thing as a dumb question on this kind of project.",
    'orange',
  ),

  new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { before: 600, after: 80 },
    children: [new TextRun({ text: 'Thank you for trusting us with this build.', font: 'Arial', italics: true, size: 22, color: SLATE })],
  }),
  new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { after: 80 },
    children: [new TextRun({ text: "We’re looking forward to launching Halo Air online.", font: 'Arial', italics: true, size: 22, color: SLATE })],
  }),
];

// ---------- DOCUMENT ASSEMBLY ----------
const doc = new Document({
  creator: 'Halo Air project team',
  title: 'Halo Air — Project Overview & Onboarding',
  styles: {
    default: { document: { run: { font: 'Arial', size: 22 } } },
    paragraphStyles: [
      { id: 'Heading1', name: 'Heading 1', basedOn: 'Normal', next: 'Normal', quickFormat: true,
        run: { size: 36, bold: true, font: 'Arial', color: BRAND_BLUE },
        paragraph: { spacing: { before: 360, after: 200 }, outlineLevel: 0 } },
      { id: 'Heading2', name: 'Heading 2', basedOn: 'Normal', next: 'Normal', quickFormat: true,
        run: { size: 26, bold: true, font: 'Arial', color: INK },
        paragraph: { spacing: { before: 280, after: 140 }, outlineLevel: 1 } },
      { id: 'Heading3', name: 'Heading 3', basedOn: 'Normal', next: 'Normal', quickFormat: true,
        run: { size: 22, bold: true, font: 'Arial', color: BRAND_ORANGE },
        paragraph: { spacing: { before: 200, after: 100 }, outlineLevel: 2 } },
    ],
  },
  numbering: {
    config: [{
      reference: 'bullets',
      levels: [{
        level: 0,
        format: LevelFormat.BULLET,
        text: '•',
        alignment: AlignmentType.LEFT,
        style: { paragraph: { indent: { left: 720, hanging: 360 } } },
      }],
    }],
  },
  sections: [{
    properties: {
      page: {
        size: { width: 12240, height: 15840 },             // US Letter
        margin: { top: 1080, right: 1440, bottom: 1080, left: 1440 },
      },
    },
    children: [
      ...cover,
      ...sec1,
      ...sec2,
      ...sec3,
      ...sec4,
      ...sec5Intro,
      ...groupA, ...groupB, ...groupC, ...groupD, ...groupE, ...groupF, ...groupG,
      ...closing,
    ],
  }],
});

const buffer = await Packer.toBuffer(doc);
writeFileSync(OUT, buffer);
console.log(`Wrote ${OUT}`);
console.log(`Size: ${(buffer.length / 1024).toFixed(0)} KB`);
