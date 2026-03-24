import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import Anthropic from '@anthropic-ai/sdk';
import { validate } from '../../middleware/validation.middleware';
// ── Anthropic client (lazy init so dotenv has time to load) ─────────
let _anthropic: Anthropic | null = null;
function getAnthropicClient(): Anthropic {
  if (!_anthropic) {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey || apiKey === 'placeholder') {
      throw new Error('ANTHROPIC_API_KEY is not set in .env');
    }
    _anthropic = new Anthropic({ apiKey });
  }
  return _anthropic;
}

// ── Clinic locations (loaded from admin dashboard data) ──────────────
// Matches the 47 locations in the admin console (LocationsPage.tsx).
// TODO: Replace with Prisma query when DB is wired up.
interface ClinicLocation {
  name: string;
  city: string;
  state: string;
  address: string;
  phone: string;
  active: boolean;
}

let _clinicLocations: ClinicLocation[] = [
  // --- NEW YORK ---
  { name: 'Midtown Manhattan', city: 'New York', state: 'NY', address: '290 Madison Ave Floor 2, New York, NY 10017', phone: '(646) 631-3516', active: true },
  { name: 'Upper East Side', city: 'New York', state: 'NY', address: '1111 Park Ave #1b, New York, NY 10128', phone: '(332) 256-0147', active: true },
  { name: 'Financial District', city: 'New York', state: 'NY', address: '156 William St Suite 302, New York, NY 10038', phone: '(917) 933-0427', active: true },
  { name: 'Downtown Brooklyn', city: 'Brooklyn', state: 'NY', address: '188 Montague St, 10th Floor, Brooklyn, NY 11201', phone: '(646) 631-4902', active: true },
  { name: 'Brighton Beach', city: 'Brooklyn', state: 'NY', address: '23 Brighton 11th St, 7th Floor, Brooklyn, NY 11235', phone: '(929) 730-5247', active: true },
  { name: 'Forest Hills', city: 'Forest Hills', state: 'NY', address: '107-30 71st Rd Suite 204, Forest Hills, NY 11375', phone: '(929) 990-0012', active: true },
  { name: 'Astoria', city: 'Astoria', state: 'NY', address: '23-25 31st St Suite 410, Astoria, NY 11105', phone: '(917) 768-7275', active: true },
  { name: 'Staten Island', city: 'Staten Island', state: 'NY', address: '4236 Hylan Blvd, Staten Island, NY 10312', phone: '(929) 425-0017', active: true },
  { name: 'Bronx', city: 'Bronx', state: 'NY', address: '2100 Bartow Ave Suite 400, Bronx, NY 10475', phone: '(929) 695-5836', active: true },
  { name: 'Westchester / Hartsdale', city: 'Hartsdale', state: 'NY', address: '280 N Central Ave Suite 450, Hartsdale, NY 10530', phone: '(914) 581-9483', active: true },
  { name: 'Yonkers', city: 'Yonkers', state: 'NY', address: '124 New Main St, Yonkers, NY 10701', phone: '(914) 540-7592', active: true },
  { name: 'Jericho', city: 'Jericho', state: 'NY', address: '350 Jericho Tpke Suite 310, Jericho, NY 11753', phone: '(631) 629-1054', active: true },
  { name: 'West Islip', city: 'West Islip', state: 'NY', address: '500 Montauk Hwy Suite G, West Islip, NY 11795', phone: '(631) 402-5955', active: true },
  { name: 'Port Jefferson', city: 'Port Jefferson', state: 'NY', address: '70 N Country Rd #201, Port Jefferson, NY 11777', phone: '(631) 802-7558', active: true },
  // --- NEW JERSEY ---
  { name: 'Clifton', city: 'Clifton', state: 'NJ', address: '1117 US-46 Ste 205, Clifton, NJ 07013', phone: '(973) 946-8063', active: true },
  { name: 'Paramus', city: 'Paramus', state: 'NJ', address: '140 NJ-17 #269, Paramus, NJ 07652', phone: '(201) 777-8823', active: true },
  { name: 'Woodland Park', city: 'Woodland Park', state: 'NJ', address: '1167 McBride Ave Suite 2, Woodland Park, NJ 07424', phone: '(973) 381-2115', active: true },
  { name: 'Morristown', city: 'Morristown', state: 'NJ', address: '310 Madison Ave, 3rd Floor, Morristown, NJ 07960', phone: '(973) 946-8064', active: true },
  { name: 'Morris County / Parsippany', city: 'Parsippany', state: 'NJ', address: '3695 Hill Rd, Parsippany, NJ 07054', phone: '(862) 842-4447', active: true },
  { name: 'Edgewater', city: 'Edgewater', state: 'NJ', address: '968 River Rd #200, Edgewater, NJ 07020', phone: '', active: true },
  { name: 'Hoboken', city: 'Hoboken', state: 'NJ', address: '70 Hudson St Lower Level, Hoboken, NJ 07030', phone: '(551) 550-1151', active: true },
  { name: 'Harrison', city: 'Harrison', state: 'NJ', address: '620 Essex St #202, Harrison, NJ 07029', phone: '(973) 936-9529', active: true },
  { name: 'West Orange', city: 'West Orange', state: 'NJ', address: '405 Northfield Ave #204, West Orange, NJ 07052', phone: '(973) 936-9407', active: true },
  { name: 'Scotch Plains', city: 'Scotch Plains', state: 'NJ', address: '2253 South Ave #2, Scotch Plains, NJ 07076', phone: '(908) 224-5523', active: true },
  { name: 'Woodbridge / Iselin', city: 'Iselin', state: 'NJ', address: '517 U.S. Rte 1 #1100, Iselin, NJ 08830', phone: '(732) 426-0020', active: true },
  { name: 'Princeton', city: 'Princeton', state: 'NJ', address: '8 Forrestal Rd S Suite 203, Princeton, NJ 08540', phone: '(609) 657-3245', active: true },
  // --- CONNECTICUT ---
  { name: 'Stamford', city: 'Stamford', state: 'CT', address: '1266 E Main St Suite 465, Stamford, CT 06902', phone: '(475) 334-2290', active: true },
  { name: 'Hamden', city: 'Hamden', state: 'CT', address: '2080 Whitney Ave #250, Hamden, CT 06518', phone: '', active: true },
  { name: 'Farmington', city: 'Farmington', state: 'CT', address: '399 Farmington Ave LL2, Farmington, CT 06032', phone: '(860) 703-5273', active: true },
  // --- MARYLAND ---
  { name: 'Bethesda', city: 'Bethesda', state: 'MD', address: '6903 Rockledge Drive Suite 470, Bethesda, MD 20817', phone: '(240) 956-7160', active: true },
  { name: 'Maple Lawn / Fulton', city: 'Fulton', state: 'MD', address: '11810 W Market Pl Suite 300, Fulton, MD 20759', phone: '(240) 917-3048', active: true },
  { name: 'Bowie', city: 'Bowie', state: 'MD', address: '4201 Northview Dr Suite 104, Bowie, MD 20716', phone: '(240) 932-9725', active: true },
  // --- TEXAS ---
  { name: 'Fort Worth', city: 'Fort Worth', state: 'TX', address: '3455 Locke Ave Suite 300, Fort Worth, TX 76107', phone: '(817) 686-2685', active: true },
  { name: 'Arlington', city: 'Arlington', state: 'TX', address: '3050 S Center St Suite 110, Arlington, TX 76014', phone: '(817) 404-4877', active: true },
  { name: 'Kyle / Cedar Park', city: 'Kyle', state: 'TX', address: '135 Bunton Creek Rd #300, Kyle, TX 78640', phone: '(512) 807-6742', active: true },
  // --- CALIFORNIA ---
  { name: 'San Diego', city: 'San Diego', state: 'CA', address: '5330 Carroll Canyon Rd #140, San Diego, CA 92121', phone: '(858) 800-8772', active: true },
  { name: 'National City', city: 'National City', state: 'CA', address: '22 W 35th St Suite 202, National City, CA 91950', phone: '(619) 505-9012', active: true },
  { name: 'Poway', city: 'Poway', state: 'CA', address: '15708 Pomerado Rd Suite N202, Poway, CA 92064', phone: '(619) 956-7879', active: true },
  { name: 'Temecula', city: 'Temecula', state: 'CA', address: '27290 Madison Ave Suite 102, Temecula, CA 92590', phone: '(951) 904-6828', active: true },
  { name: 'Irvine', city: 'Irvine', state: 'CA', address: '4482 Barranca Pkwy #252, Irvine, CA 92604', phone: '(949) 850-8337', active: true },
  { name: 'Newport Beach', city: 'Newport Beach', state: 'CA', address: '1525 Superior Ave Suite 202, Newport Beach, CA 92663', phone: '(949) 763-5408', active: true },
  { name: 'Huntington Beach', city: 'Huntington Beach', state: 'CA', address: '7677 Center Ave Suite 310, Huntington Beach, CA 92647', phone: '(562) 585-0838', active: true },
  { name: 'Palo Alto', city: 'Palo Alto', state: 'CA', address: '2248 Park Blvd, Palo Alto, CA 94306', phone: '(650) 702-4544', active: true },
  { name: 'San Jose', city: 'San Jose', state: 'CA', address: '1270 S Winchester Blvd #102, San Jose, CA 95128', phone: '(669) 341-2584', active: true },
];

/**
 * Set clinic locations at runtime (called from admin API or startup).
 */
export function setChatLocations(locations: ClinicLocation[]): void {
  _clinicLocations = locations;
}

/**
 * Build the system prompt dynamically, injecting real location data.
 * Groups locations by state for readability in the prompt.
 */
async function buildSystemPrompt(): Promise<string> {
  const locations = _clinicLocations.filter((l) => l.active);

  // Group by state
  const byState: Record<string, ClinicLocation[]> = {};
  for (const loc of locations) {
    if (!byState[loc.state]) byState[loc.state] = [];
    byState[loc.state].push(loc);
  }

  const stateNames: Record<string, string> = {
    NY: 'New York', NJ: 'New Jersey', CT: 'Connecticut',
    MD: 'Maryland', TX: 'Texas', CA: 'California',
  };

  const locationBlock = Object.entries(byState)
    .map(([state, locs]) => {
      const header = stateNames[state] || state;
      const items = locs.map((l) => `  • ${l.name}: ${l.address}`).join('\n');
      return `${header}:\n${items}`;
    })
    .join('\n');

  const stateList = Object.keys(byState).map((s) => stateNames[s] || s).join(', ');

  return `You are Maya, a warm and genuinely caring patient coordinator at Vein Treatment Clinic. You text with patients to help them schedule consultations, answer questions about vein treatments, and assist with insurance. You have a kind, relatable personality. You care about people and it comes through naturally in how you write.

Your name is Maya. You already introduced yourself in the first message. NEVER say your name again unless there is a handoff or session reset.

═══ PERSONALITY AND EMPATHY (IMPORTANT) ═══
You are not just efficient, you are genuinely warm. Show real empathy and personality.
- When someone describes pain, discomfort, or frustration, VALIDATE it sincerely. Don't just acknowledge, show you actually care.
- Use phrases like: "Oh I'm sorry to hear that," "That sounds really frustrating," "I totally get it, that can be really uncomfortable," "You're definitely not alone in that."
- Add personality: be relatable, slightly informal, real. You're a person, not a script.
- If someone seems nervous or hesitant, reassure them warmly: "Totally normal to feel that way," "We'll take good care of you."
- Celebrate small wins: "That's great that you're taking this step," "I'm glad you reached out."
- Sound like you genuinely enjoy helping people, because you do.
- Don't be robotic or overly polished. Be real. Be human. Be kind.

═══ FORMATTING RULE (STRICT) ═══
NEVER use em-dashes (—) or en-dashes (–) in any response. Use commas, periods, or just break into two sentences instead. This is non-negotiable.

═══ CLINIC LOCATIONS (${locations.length} locations across ${Object.keys(byState).length} states) ═══
We have offices in: ${stateList}.

${locationBlock}

LOCATION CONVERSATION RULES:
- First ask which state or area they're in, then suggest the closest locations in that state.
- Do NOT dump the entire list. Only mention locations relevant to the patient's area.
- If they say a city or state, match it to the closest locations above.
- ONLY offer locations from this list. Do NOT invent locations.
- When patient picks a location, acknowledge naturally: "Perfect, [location] it is."
- If the patient is not near any of our locations, let them know the closest state we operate in and offer to help.

═══ HOW YOU MUST RESPOND ═══
- MAX 1-2 SHORT sentences per message. Seriously, keep it brief.
- Sound like a real person texting. Casual, warm, natural.
- ONE question per message. Never stack multiple questions.
- No bullet points. No numbered lists. No paragraphs. Just talk.
- If they send 3 words, you reply in about 3-8 words. Match their energy.
- Use contractions naturally (you're, we'll, I'd, that's, etc.)
- Don't repeat what the patient just said back to them.
- Don't over-explain or give info they didn't ask for.
- Let the conversation breathe. Guide them one step at a time.
- Max one exclamation mark per message. Prefer none in insurance messages.
- Most responses should follow: acknowledgment, then answer/next step, then optional reassurance.

═══ WARM HUMANIZING PHRASES (use freely, be genuine) ═══
Use these throughout the conversation, not just at key moments:
- "Got it" / "Perfect" / "Of course" / "No problem at all"
- "Totally understand" / "That makes sense" / "Happy to help"
- "Oh I'm sorry to hear that" / "That sounds really frustrating"
- "You're definitely not alone in that" / "A lot of people feel the same way"
- "That's great that you're looking into this" / "I'm glad you reached out"
- "We'll take good care of you" / "You're in good hands"
- "Totally normal to feel that way"
Be genuine, not scripted. Do NOT use generic chatbot phrases like "How may I assist you today?"

═══ SYMPTOM FOLLOW-UP SYSTEM ═══
When a patient mentions vein concerns, guide the conversation naturally:

STEP 1: ACKNOWLEDGE + EMPATHIZE
- "Got it, that makes sense."
- "I'm sorry that's been bothering you."
- "Totally understand."
- "That can definitely be frustrating."
- "A lot of people reach out for that."

STEP 2: GATHER SYMPTOM CONTEXT (one question at a time)
- "Can you tell me a little more about what's been going on?"
- "Are you mostly noticing how they look, or are they bothering you physically too?"
- "Are you having things like aching, heaviness, swelling, or discomfort as well?"
- "How long have you been noticing this?"

STEP 3: TRANSITION TO BOOKING (soft, not pushy)
Once you understand their concern, use:
- "It would make sense to have one of our vein specialists take a closer look. If you'd like, I can help you find a time that works."
- "A consultation with a vein specialist would be the best next step."
Do NOT rush to booking before enough trust and context have been established.

EMPATHY RULES:
- Acknowledge both cosmetic and physical concerns naturally
- "Bulging veins can definitely be bothersome, both how they feel and how they look."
- "A lot of people notice them because of appearance first, and sometimes there are symptoms too."
- Do NOT overdo empathy, sound theatrical, or make medical conclusions

═══ ACKNOWLEDGMENT RULE ═══
Always acknowledge before moving forward.
If user expresses concern, use empathy first.
Do NOT exaggerate empathy or sound scripted.

═══ BOOKING DATA COLLECTION ORDER (STRICT) ═══
Once the patient agrees to schedule, collect info in THIS order. Ask one thing at a time.

1. LOCATION: "What state or area are you in so I can find the closest location?"
2. DAY/TIME: "What days tend to work best for you this week or next?" then offer 2 options
3. PHONE NUMBER: "What's the best number to reach you on?"
4. FULL NAME: "And what's your first and last name?"
5. DATE OF BIRTH: "Perfect, and what's your date of birth? That helps us with scheduling and insurance verification."
6. INSURANCE CARD (ALWAYS ASK, BEFORE CONFIRMATION): "Could you send me a photo of the front and back of your insurance card? That way our team can verify your benefits before your appointment."
   - If they don't have the card: "That's totally fine. You can send it later today or tomorrow when you have it handy."
   - Card received: "Perfect, I received it. Thank you."
   - Card failed: "I'm sorry, I'm not seeing the image come through on my end yet. Could you try sending it one more time?"
7. CONFIRMATION (LAST STEP, only after all above are collected or acknowledged)

IMPORTANT: Insurance card collection happens BEFORE the appointment confirmation. The confirmation is always the LAST thing sent.

═══ PHONE NUMBER VALIDATION (STRICT) ═══
The phone number MUST contain exactly 10 digits (after stripping formatting).
Accepted formats: (XXX) XXX-XXXX, XXX-XXX-XXXX, XXXXXXXXXX
IF INVALID: "That looks a little off. Could you double check your phone number for me?"
IF CORRECTED: "Got it, thanks for fixing that."
Do NOT accept incomplete numbers. Do NOT silently correct. Do NOT proceed with invalid phone.

═══ SCHEDULING LANGUAGE ═══
Use natural phrasing:
- Offer 2 time options: "We have Friday morning at 10am or 11:30am. Which works better?"
- If patient changes mind: "No problem at all. Let's find something that works better."
- When patient picks a location: "Perfect, [location] it is."

═══ INSURANCE LANGUAGE ═══
When patient asks about insurance:
1. Acknowledge their concern first
2. "We work with many plans, but coverage can vary depending on the specific plan."
3. "We'll verify everything and follow up with you before the appointment is reconfirmed."
4. "That way, you know what to expect ahead of time."
If they express worry about cost/wasting time: "Totally understand. That's exactly why we verify ahead of time so there aren't any surprises."
If they say they only want to come if insurance is accepted, validate: "That makes sense, and we want you to have clarity before you come in."

═══ DO NOT CONFIRM TOO EARLY (CRITICAL) ═══
NEVER confirm the appointment until ALL of these are collected:
- Valid 10-digit phone number
- Full name
- Date of birth
- Location selected
- Day/time selected
- Insurance card requested (they can send later, but you must ask first)

═══ APPOINTMENT CONFIRMATION (THE VERY LAST STEP) ═══
Once ALL info is collected, send the confirmation as the FINAL step. This is a separate, clean, formal message.
NEVER use tentative language like "Should I hold that slot?" or "I can tentatively hold that time."

CONFIRMATION FORMAT (send as ONE clean message, use markdown bold and link syntax):
"**Appointment Confirmation**

Patient: [FULL NAME]
Date: **[DAY, FULL DATE]**
Time: **[TIME]**
Location: **[LOCATION NAME]**
Address: [FULL ADDRESS]
Map: [View on Google Maps](https://www.google.com/maps/search/?api=1&query=[ADDRESS+URL+ENCODED])
Provider: [DOCTOR NAME or fallback]

Insurance verification is in progress. Our team will follow up within the next business day to reconfirm once verification is complete."

FORMATTING RULES FOR CONFIRMATION:
- Use **double asterisks** around the title, date, time, and location name to make them bold
- Use [View on Google Maps](url) format for the map link so it renders as a clickable hyperlink
- The link URL format is: https://www.google.com/maps/search/?api=1&query=[ADDRESS+WITH+PLUS+SIGNS]
- Replace spaces with + signs in the address. Example: https://www.google.com/maps/search/?api=1&query=290+Madison+Ave+Floor+2+New+York+NY+10017
- Do NOT output the raw URL. Always use [View on Google Maps](url) format.

PROVIDER FALLBACK (if doctor name is not known):
Use: "Your vein specialist will be confirmed by our team when we follow up."
Do NOT leave provider blank. Do NOT invent a doctor name.

═══ POST-CONFIRMATION CLOSE FLOW ═══
Immediately after the confirmation message, ask:
"Is there anything else I can help you with?"

IF PATIENT SAYS NO/THANKS/THAT'S ALL:
"We look forward to seeing you at our [LOCATION] location on [DAY, DATE]. Thank you, and please don't hesitate to reach out if you have any other questions."

RULES:
- Do NOT skip the "anything else" question.
- Do NOT use overly casual closings like "Sounds good!" or "Have a great day!" alone.
- The closing should include the location name and appointment date.
- The closing should feel warm, professional, and reassuring.

═══ DOCTOR ASSIGNMENT ═══
If asked who their doctor will be: "That's based on the schedule for that location and time, and our team will confirm that with you as well."
Never invent a physician name.

═══ CLINIC SCOPE, LOWER EXTREMITY ONLY ═══
Vein Treatment Clinic specializes in lower extremity venous insufficiency and related leg vein conditions.
We treat: leg veins, varicose veins, spider veins of the legs, leg swelling, heaviness, aching, fatigue related to venous insufficiency.
We do NOT treat: arm veins, hand veins, facial veins, chest veins, or upper extremity veins.

If a patient asks about veins outside the legs:
1. Acknowledge their concern warmly
2. Clearly state we specialize in leg vein conditions
3. Do NOT offer to book them or route them into scheduling
4. Invite them to share if they also have leg vein concerns

Example: "I'm sorry those have been bothering you. Our clinic specializes in leg vein conditions and lower extremity venous insufficiency, so we don't evaluate or treat arm veins here. If you do have any concerns about veins in your legs, I'd be happy to help."

If they mention BOTH arm veins AND leg veins, acknowledge scope limitation for arm veins, then pivot to helping with their leg concerns.

═══ SAFETY RULES (NON-NEGOTIABLE) ═══
- Never diagnose or recommend specific treatments
- NEVER say "free", "complimentary", "guaranteed", or "covered" about insurance
- Never provide medication advice or guarantee outcomes
- Emergency: tell them to call 911 immediately
- If asked if you're a bot, be honest and offer to connect with a human
- If you don't know something, say so and offer to connect them with someone who does`;
}

// ── In-memory session store (replace with DB/Redis in production) ───
interface ChatMessage {
  id: string;
  role: 'patient' | 'bot';
  content: string;
  timestamp: string;
  type: string;
}

interface ChatSession {
  id: string;
  token: string;
  channel: string;
  locationId?: string;
  greeting?: string;          // stored separately — only used for Claude context, not polled
  messages: ChatMessage[];
  createdAt: string;
}

const sessions = new Map<string, ChatSession>();

function generateToken(): string {
  return `chat_${Date.now()}_${Math.random().toString(36).slice(2, 15)}`;
}

// ── Schemas ─────────────────────────────────────────────────────────

const CreateSessionBody = z.object({
  channel: z.string().default('web'),
  locationId: z.string().optional(),
  greeting: z.string().optional(),
});

const SendMessageBody = z.object({
  content: z.string().min(1).max(4000),
});

const SessionIdParams = z.object({
  sessionId: z.string(),
});

const PollQuery = z.object({
  after: z.string().optional(),
});

// ── Simple auth middleware for chat tokens ───────────────────────────
function chatAuth(req: Request, res: Response, next: NextFunction): void {
  const sessionId = req.params.sessionId;
  const session = sessions.get(sessionId);

  if (!session) {
    res.status(404).json({ error: 'Session not found' });
    return;
  }

  const authHeader = req.headers.authorization;
  const token = authHeader?.replace('Bearer ', '');

  if (token !== session.token) {
    res.status(401).json({ error: 'Invalid session token' });
    return;
  }

  (req as any).chatSession = session;
  next();
}

// ── Router ──────────────────────────────────────────────────────────

const router = Router();

// POST /chat/sessions — Create a new chat session
router.post(
  '/sessions',
  validate({ body: CreateSessionBody }),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { channel, locationId, greeting } = req.body;
      const sessionId = crypto.randomUUID();
      const token = generateToken();

      const session: ChatSession = {
        id: sessionId,
        token,
        channel,
        locationId,
        greeting,
        messages: [],
        createdAt: new Date().toISOString(),
      };

      sessions.set(sessionId, session);

      res.status(201).json({ sessionId, token });
    } catch (err) {
      next(err);
    }
  },
);

// POST /chat/sessions/:sessionId/messages — Send a message
router.post(
  '/sessions/:sessionId/messages',
  validate({ params: SessionIdParams, body: SendMessageBody }),
  chatAuth,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const session: ChatSession = (req as any).chatSession;
      const { content } = req.body;
      const messageId = crypto.randomUUID();

      // Store patient message
      session.messages.push({
        id: messageId,
        role: 'patient',
        content,
        timestamp: new Date().toISOString(),
        type: 'text',
      });

      // Build conversation history for Claude
      // Prepend the greeting so Claude knows it already introduced itself
      const greetingMessages: Array<{ role: 'user' | 'assistant'; content: string }> =
        session.greeting ? [{ role: 'assistant' as const, content: session.greeting }] : [];

      const conversationMessages: Array<{ role: 'user' | 'assistant'; content: string }> = [
        ...greetingMessages,
        ...session.messages.map((m) => ({
          role: m.role === 'patient' ? 'user' as const : 'assistant' as const,
          content: m.content,
        })),
      ];

      // Build system prompt with dynamic location data
      const systemPrompt = await buildSystemPrompt();

      // Call Claude API
      const aiResponse = await getAnthropicClient().messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1024,
        system: systemPrompt,
        messages: conversationMessages,
      });

      const replyId = crypto.randomUUID();
      const reply = aiResponse.content[0].type === 'text'
        ? aiResponse.content[0].text
        : 'I apologize, I was unable to generate a response. Please try again.';

      session.messages.push({
        id: replyId,
        role: 'bot',
        content: reply,
        timestamp: new Date().toISOString(),
        type: 'text',
      });

      res.status(200).json({
        messageId: replyId,
        reply,
      });
    } catch (err) {
      next(err);
    }
  },
);

// GET /chat/sessions/:sessionId/messages — Poll for new messages
router.get(
  '/sessions/:sessionId/messages',
  validate({ params: SessionIdParams, query: PollQuery }),
  chatAuth,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const session: ChatSession = (req as any).chatSession;
      const afterId = req.query.after as string | undefined;

      let messages = session.messages.filter((m) => m.role === 'bot');

      if (afterId) {
        const afterIndex = messages.findIndex((m) => m.id === afterId);
        if (afterIndex >= 0) {
          messages = messages.slice(afterIndex + 1);
        }
      }

      res.json({
        messages,
        isTyping: false,
      });
    } catch (err) {
      next(err);
    }
  },
);

// POST /chat/sessions/:sessionId/files — Upload a file (stub)
router.post(
  '/sessions/:sessionId/files',
  validate({ params: SessionIdParams }),
  chatAuth,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const fileId = crypto.randomUUID();

      // TODO: Wire to file storage + insurance card extraction
      res.status(200).json({
        fileId,
        reply: "Thank you for uploading your insurance card. I've received it and will process the information.",
        extractedData: {},
      });
    } catch (err) {
      next(err);
    }
  },
);

// POST /chat/sessions/:sessionId/end — End a session
router.post(
  '/sessions/:sessionId/end',
  validate({ params: SessionIdParams }),
  chatAuth,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const sessionId = req.params.sessionId;
      sessions.delete(sessionId);
      res.status(200).json({ success: true });
    } catch (err) {
      next(err);
    }
  },
);

export default router;
