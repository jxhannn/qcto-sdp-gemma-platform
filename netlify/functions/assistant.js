const fs = require("fs");
const path = require("path");

const DATA_CANDIDATE_PATHS = [
  path.join(__dirname, "data", "providers_compact.json"),
  path.join(process.cwd(), "netlify", "functions", "data", "providers_compact.json"),
  path.join(process.cwd(), "providers_compact.json")
];
let PROVIDERS_CACHE = null;

const DEFAULT_MODEL = "gemma-4-26b-a4b-it";
const DEFAULT_GEMMA_TIMEOUT_MS = 7000;
const DEFAULT_MAX_OUTPUT_TOKENS = 220;

const PROVINCES = [
  "Gauteng",
  "KwaZulu-Natal",
  "Limpopo",
  "Western Cape",
  "Eastern Cape",
  "Mpumalanga",
  "North West",
  "Free State",
  "Northern Cape"
];

const PROVINCE_ALIASES = [
  ["KwaZulu-Natal", ["kwazulu natal", "kwazulu-natal", "kzn", "natal"]],
  ["Gauteng", ["gauteng", "joburg", "johannesburg", "pretoria", "randburg", "sandton", "midrand", "centurion", "krugersdorp", "kempton park"]],
  ["Limpopo", ["limpopo", "polokwane", "giyani", "louis trichardt", "thohoyandou"]],
  ["Western Cape", ["western cape", "cape town", "bellville", "paarl", "george", "stellenbosch"]],
  ["Eastern Cape", ["eastern cape", "east london", "gqeberha", "port elizabeth", "mthatha", "butterworth", "king william"]],
  ["Mpumalanga", ["mpumalanga", "emalahleni", "witbank", "nelspruit", "mbombela", "secunda"]],
  ["North West", ["north west", "rustenburg", "mahikeng", "klerksdorp", "potchefstroom"]],
  ["Free State", ["free state", "bloemfontein", "welkom", "bethlehem"]],
  ["Northern Cape", ["northern cape", "kimberley", "upington"]]
];

let CITY_INDEX_CACHE = null;

const STOPWORDS = new Set([
  "the", "and", "for", "with", "that", "this", "from", "near", "what", "which", "where", "when", "about", "into", "have", "only", "like", "want", "work", "need", "help", "learnership", "learnerships", "provider", "providers", "qualification", "qualifications", "career", "careers", "study", "studies", "matric", "south", "africa", "african", "please", "show", "find", "looking", "interested", "live", "based", "around", "love", "something", "related", "current", "available", "i", "am", "in", "my", "me"
]);

const INTENT_KEYWORDS = {
  ict: ["computer", "computers", "digital", "ict", "information technology", "it support", "technical support", "help desk", "helpdesk", "computer support", "software", "developer", "programmer", "programming", "coding", "data science", "data analyst", "data", "analytics", "database", "cloud", "cyber", "cybersecurity", "network", "information systems", "systems development", "systems developer", "artificial intelligence", "ai"],
  business: ["business", "administration", "administrator", "office", "management", "project", "clerk", "public administration", "business administration"],
  project: ["project manager", "project coordinator", "project management"],
  hospitality: ["hospitality", "housekeeping", "housekeeper", "cleaning", "cleaner", "hotel", "cook", "cooking", "chef", "kitchen", "food", "tourism", "accommodation", "catering"],
  finance: ["finance", "financial", "financial management", "finance administrator", "accounting", "accountant", "bookkeeping", "bookkeeper", "payroll", "tax", "banking", "insurance", "audit", "auditing"],
  construction: ["construction", "building", "civil", "engineering", "mechanical", "quantity surveying", "quantity surveyor", "plumbing", "electrician", "welding", "welder", "carpentry", "bricklaying", "boilermaker", "artisan", "trade", "trades", "car", "cars", "vehicle", "automotive", "motor mechanic", "diesel mechanic", "mechanic"],
  energy: ["electrician", "electrical", "electricity", "solar", "renewable energy", "energy", "photovoltaic"],
  mining: ["mining", "mine", "plant operator", "surface blaster", "blaster", "earthmoving", "excavator", "dump truck", "crane operator", "rock", "quarry", "mineral"],
  health: ["health", "healthcare", "community health", "health promotion", "caregiver", "pharmacy", "medical", "nursing", "social work", "counselling", "counsellor", "community counsellor", "social counselling"],
  education: ["education", "teaching", "teacher", "children", "child", "childcare", "child care", "early childhood", "ecd", "youth care", "child and youth", "facilitator", "training facilitator", "learning and development"],
  beauty: ["beauty", "hair", "hairdresser", "nail", "nails", "cosmetology", "makeup", "make-up", "therapist"],
  creative: ["media", "photography", "photographer", "graphic", "design", "designer", "marketing", "web designer", "front-end", "journalist", "advertising", "film", "multimedia"],
  retail: ["retail", "sales", "cashier", "store", "customer service", "wholesale"],
  transport: ["transport", "logistics", "supply chain", "warehouse", "warehousing", "freight", "dispatch", "automotive", "driver", "driving"],
  agriculture: ["agriculture", "farming", "farm", "crop", "animal", "animals", "livestock", "poultry", "horticulture", "forestry", "nature", "environment", "environmental", "conservation", "wildlife", "eco ranger"],
  safety: ["safety", "security", "policing", "investigation", "investigator", "fire", "emergency", "occupational health and safety"],
  practical: ["office administrator", "retail sales", "sales assistant", "freight handler", "housekeeper", "cleaner", "food handler", "kitchen hand", "care worker", "plant operator", "beauty", "hairdresser", "assistant"],
  practicalHandsOn: ["plant operator", "construction plant operator", "freight handler", "warehouse", "housekeeper", "commercial cleaner", "food handler", "kitchen hand", "care worker", "social auxiliary worker", "beauty", "hairdresser", "welder", "plumbing hand", "assistant handyperson", "cleaner"],
  helping: ["health promotion", "community health", "community counsellor", "social counselling", "social auxiliary", "care worker", "child and youth care", "ecd", "early childhood", "home based care"]
};

const INTENT_REGEX = {
  ict: /\b(computer|computers|digital|ict|information technology|it support|technical support|help desk|helpdesk|computer support|software|developer|programmer|programming|coding|data science|data analyst|database|cloud|cyber|cybersecurity|network|information systems|systems development|systems developer|artificial intelligence|ai)\b/i,
  business: /\b(business|admin|administration|administrator|office|management assistant|project administrator|public administration|public management|secretary|secretarial|clerk|business management)\b/i,
  project: /\b(project manager|project coordinator|project management|project)\b/i,
  hospitality: /\b(hospitality|housekeeper|housekeeping|accommodation|hotel|cleaning|cleaner|cook|chef|kitchen|food|tourism|catering)\b/i,
  finance: /\b(finance|financial|financial management|finance administrator|accounting|bookkeeping|bookkeeper|payroll|tax|banking|insurance|audit|auditing|accountant)\b/i,
  construction: /\b(construction|building|civil|engineering|mechanical|quantity surveying|quantity surveyor|plumbing|plumber|electrician|electrical|welding|welder|carpentry|carpenter|bricklaying|bricklayer|boilermaker|artisan|trade|trades|plant operator|construction plant|car|cars|vehicle|automotive|motor mechanic|diesel mechanic|mechanic)\b/i,
  energy: /\b(electrician|electrical|electricity|solar|renewable|renewable energy|energy|photovoltaic|pv)\b/i,
  mining: /\b(mining|mine|plant operation|plant operator|surface blaster|blaster|earthmoving|excavator|dump truck|crane operator|rock|quarry|mineral)\b/i,
  health: /\b(health|healthcare|community health|health promotion|caregiver|pharmacy|medical|nursing|nurse|social work|counselling|counsellor|community counsellor|social counselling|care worker)\b/i,
  education: /\b(education|teaching|teacher|children|child|childcare|child care|early childhood|ecd|youth care|child and youth|facilitator|training facilitator|learning and development|assessor|moderator)\b/i,
  beauty: /\b(beauty|hair|hairdresser|nail|nails|cosmetology|makeup|make-up|therapist)\b/i,
  creative: /\b(media|photography|photographer|graphic|graphics|design|designer|marketing|web designer|front-end|front end|journalist|advertising|film|multimedia|content)\b/i,
  retail: /\b(retail|sales|cashier|store|customer service|wholesale|merchandising|shop|sales assistant)\b/i,
  transport: /\b(transport|logistics|supply chain|warehouse|warehousing|freight|dispatch|automotive|driver|driving|fleet)\b/i,
  agriculture: /\b(agriculture|farming|farm|crop|animal|animals|livestock|poultry|horticulture|forestry|nature|environment|environmental|conservation|wildlife|eco ranger|agri)\b/i,
  safety: /\b(safety|security guard|security officer|security|policing|police|investigation|investigator|fire|emergency|occupational health and safety|ohs)\b/i,
  practical: /\b(office administrator|business administrator|sales assistant|retail sales|cashier|freight handler|warehouse|housekeeper|commercial cleaner|cleaner|food handler|kitchen hand|care worker|social auxiliary worker|plant operator|assistant|beauty|hairdresser)\b/i,
  helping: /\b(helping people|help people|support people|work with people|community|counselling|counsellor|care worker|social auxiliary|health promotion|child and youth care)\b/i
};

function lower(value) {
  return String(value || "").toLowerCase();
}

function normalise(value) {
  return lower(value)
    .replace(/kwa\s*zulu/g, "kwazulu")
    .replace(/house\s*keeping/g, "housekeeping")
    .replace(/cyber\s*security/g, "cybersecurity")
    .replace(/data\s*analyses/g, "data analysis")
    .replace(/[^a-z0-9\s&-]/g, " ")
    .replace(/[-_]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}
function clampNumber(value, fallback, min, max) {
  const number = Number(value);
  if (!Number.isFinite(number)) return fallback;
  return Math.max(min, Math.min(max, number));
}

// ===========================================================================
// SECURITY: CORS origin allowlist + in-memory rate limiting
// Added by Kiro review (review/kiro-fixes-preview branch)
// ===========================================================================

// Allowed origins. Set ALLOWED_ORIGINS env var (comma-separated) to override.
// By default, we allow the production Netlify URL, its deploy-preview subdomains,
// and localhost for dev.
const DEFAULT_ALLOWED_ORIGINS = [
  "https://qcto-sdp-gemma-platform.netlify.app",
  "http://localhost:8888",
  "http://localhost:3000",
  "http://127.0.0.1:8888"
];

function getAllowedOrigins() {
  const fromEnv = String(process.env.ALLOWED_ORIGINS || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  return fromEnv.length ? fromEnv : DEFAULT_ALLOWED_ORIGINS;
}

function resolveCorsOrigin(requestOrigin) {
  if (!requestOrigin) return "";
  const allowed = getAllowedOrigins();
  if (allowed.includes(requestOrigin)) return requestOrigin;
  // Allow any Netlify deploy-preview subdomain of this site (e.g. deploy-preview-3--qcto-sdp-gemma-platform.netlify.app)
  try {
    const url = new URL(requestOrigin);
    if (/^(deploy-preview-\d+--|branch-preview--)?qcto-sdp-gemma-platform\.netlify\.app$/i.test(url.hostname)) {
      return requestOrigin;
    }
  } catch (e) { /* ignore */ }
  return "";
}

// Rate limiter: simple sliding window, per-IP, in-memory.
// Resets on cold start. Good enough for a portfolio site; not a replacement for a real WAF.
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute
const RATE_LIMIT_MAX_REQUESTS = clampNumber(process.env.RATE_LIMIT_MAX, 10, 1, 1000);
const rateLimitStore = new Map(); // ip -> [timestamps]

function getClientIp(event) {
  const headers = (event && event.headers) || {};
  const fwd = headers["x-forwarded-for"] || headers["X-Forwarded-For"] || "";
  const first = String(fwd).split(",")[0].trim();
  return first || headers["client-ip"] || headers["x-real-ip"] || "unknown";
}

function checkRateLimit(ip) {
  const now = Date.now();
  const windowStart = now - RATE_LIMIT_WINDOW_MS;
  const history = (rateLimitStore.get(ip) || []).filter((t) => t > windowStart);

  // Occasional cleanup so the Map does not grow unbounded on a warm instance
  if (rateLimitStore.size > 5000) {
    for (const [key, times] of rateLimitStore) {
      const kept = times.filter((t) => t > windowStart);
      if (kept.length) rateLimitStore.set(key, kept);
      else rateLimitStore.delete(key);
    }
  }

  if (history.length >= RATE_LIMIT_MAX_REQUESTS) {
    const retryAfterMs = Math.max(1000, (history[0] + RATE_LIMIT_WINDOW_MS) - now);
    return { allowed: false, retryAfterSec: Math.ceil(retryAfterMs / 1000), remaining: 0 };
  }

  history.push(now);
  rateLimitStore.set(ip, history);
  return { allowed: true, retryAfterSec: 0, remaining: RATE_LIMIT_MAX_REQUESTS - history.length };
}

function jsonResponse(statusCode, body, options = {}) {
  const origin = resolveCorsOrigin(options.requestOrigin || "");
  const corsHeaders = {};
  if (origin) {
    corsHeaders["Access-Control-Allow-Origin"] = origin;
    corsHeaders["Vary"] = "Origin";
  }
  // Note: if origin was not allowed, we still return the response body so that same-origin
  // (server-to-server) calls and health checks work. The browser simply cannot read it
  // cross-origin without the header, which is the desired behaviour.

  const rateHeaders = options.rateHeaders || {};

  return {
    statusCode,
    headers: {
      "Content-Type": "application/json",
      ...corsHeaders,
      "Access-Control-Allow-Headers": "Content-Type",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
      ...rateHeaders
    },
    body: JSON.stringify(body)
  };
}

function loadProviders() {
  if (PROVIDERS_CACHE) return PROVIDERS_CACHE;

  for (const candidatePath of DATA_CANDIDATE_PATHS) {
    try {
      if (!fs.existsSync(candidatePath)) continue;
      const raw = fs.readFileSync(candidatePath, "utf8");
      const data = JSON.parse(raw);
      PROVIDERS_CACHE = Array.isArray(data) ? data : [];
      console.log(`Loaded provider data: ${PROVIDERS_CACHE.length} records from ${candidatePath}`);
      return PROVIDERS_CACHE;
    } catch (error) {
      console.error(`Could not load provider data from ${candidatePath}`, error);
    }
  }

  console.error("Provider data file was not found. Make sure netlify/functions/data/providers_compact.json is uploaded and included in Netlify Functions.");
  PROVIDERS_CACHE = [];
  return PROVIDERS_CACHE;
}

function tokenize(message) {
  return normalise(message)
    .split(" ")
    .map((token) => token.trim())
    .filter((token) => (token.length >= 3 || token === "it" || token === "ai") && !STOPWORDS.has(token))
    .slice(0, 12);
}

function detectProvince(message) {
  const haystack = ` ${normalise(message)} `;
  for (const [province, aliases] of PROVINCE_ALIASES) {
    if (aliases.some((alias) => haystack.includes(` ${normalise(alias)} `))) return province;
  }
  return PROVINCES.find((province) => haystack.includes(` ${normalise(province)} `)) || "";
}

function buildCityIndex(providers) {
  if (CITY_INDEX_CACHE) return CITY_INDEX_CACHE;
  const byCity = new Map();
  providers.forEach((row) => {
    const city = String(row.cityTown || "").trim();
    const province = String(row.province || "").trim();
    const key = normalise(city);
    if (!key || key.length < 4 || city === "Not specified") return;
    if (!byCity.has(key)) byCity.set(key, { city, key, provinces: new Map() });
    const entry = byCity.get(key);
    if (province) entry.provinces.set(province, (entry.provinces.get(province) || 0) + 1);
  });
  CITY_INDEX_CACHE = Array.from(byCity.values()).map((entry) => {
    const province = Array.from(entry.provinces.entries()).sort((a, b) => b[1] - a[1])[0]?.[0] || "";
    return { ...entry, province };
  }).sort((a, b) => b.key.length - a.key.length);
  return CITY_INDEX_CACHE;
}

function detectCity(message, providers) {
  const haystack = ` ${normalise(message)} `;
  for (const entry of buildCityIndex(providers)) {
    if (haystack.includes(` ${entry.key} `)) return { cityTown: entry.city, province: entry.province };
  }
  return { cityTown: "", province: "" };
}

function detectLocation(message, providers) {
  const city = detectCity(message, providers);
  return {
    province: detectProvince(message) || city.province || "",
    cityTown: city.cityTown || ""
  };
}

function hasNegationBefore(q, termRegex) {
  const match = q.match(termRegex);
  if (!match || match.index === undefined) return false;
  const before = q.slice(Math.max(0, match.index - 18), match.index);
  return /\b(not|no|without|don t|don't|do not)\b/.test(before);
}

function detectPrimaryIntent(message) {
  const q = normalise(message);

  // Handle common natural-language cases before the broader regex checks.
  const practicalConstraint = /\b(failed maths|no maths|not good at maths|without maths|passed matric|only have matric|only matric|practical career|practical paths|hands on|hands-on)\b/.test(q);
  const rejectsOfficeWork = /\b(not office|no office|without office|not office work|not desk|no desk|without desk|not admin|no admin|not administration)\b/.test(q);
  const hasClearCareerInterest = /\b(business|admin|administration|office|computer|ict|technology|data|cloud|cyber|software|hospitality|hotel|housekeeping|cook|chef|finance|accounting|construction|engineering|health|care|teaching|children|beauty|hair|retail|sales|logistics|transport|farming|agriculture|safety|security|project management|project manager|media|design|marketing|mining|electricity|solar)\b/.test(q);
  if (practicalConstraint && rejectsOfficeWork) {
    return { key: "practical", label: "Practical / hands-on options", focusKey: "hands-on", focusLabel: "practical, hands-on options", keywords: INTENT_KEYWORDS.practicalHandsOn };
  }
  if (practicalConstraint && !hasClearCareerInterest) {
    return { key: "practical", label: "Practical / matric-friendly options", focusKey: "practical", focusLabel: "practical, matric-friendly options", keywords: INTENT_KEYWORDS.practical };
  }

  if (!rejectsOfficeWork && /\b(office based|office-based|office work|desk job|admin work)\b/.test(q) && (/\b(not accounting|no accounting|not it|no it|without accounting|without it)\b/.test(q) || !/\b(accounting|finance|financial|computer|it|ict)\b/.test(q))) {
    return { key: "business", label: "Office administration", focusKey: "office", focusLabel: "office-based administration", keywords: ["office administrator", "business administrator", "management assistant", "project coordinator", "reception", "administration", "secretarial", "customer service"] };
  }

  if (/\b(helping people|help people|support people|work with people|community work|community support)\b/.test(q)) {
    return { key: "helping", label: "Helping people / community support", focusKey: "helping", focusLabel: "helping people and community support", keywords: INTENT_KEYWORDS.helping };
  }

  if (/\b(project management|project manager|project coordinator|projects)\b/.test(q)) {
    return { key: "project", label: "Project management", focusKey: "project", focusLabel: "project management", keywords: INTENT_KEYWORDS.project };
  }

  if (/\b(mining|mine|plant operation|plant operator|earthmoving|surface blaster|blaster|excavator|dump truck|quarry|mineral)\b/.test(q)) {
    return { key: "mining", label: "Mining / plant operation", focusKey: "mining", focusLabel: "mining / plant operation", keywords: INTENT_KEYWORDS.mining };
  }

  if (/\b(electricity|electrical|electrician|solar|renewable|renewable energy|energy|photovoltaic|pv)\b/.test(q)) {
    return { key: "energy", label: "Electrical / solar", focusKey: "energy", focusLabel: "electrical / solar", keywords: INTENT_KEYWORDS.energy };
  }

  if (/\b(media|photography|photographer|graphic|graphics|design|designer|marketing|web designer|front end|front-end|journalist|advertising|film|multimedia|content creator)\b/.test(q)) {
    return { key: "creative", label: "Creative / media / marketing", focusKey: "creative", focusLabel: "creative, media and marketing", keywords: INTENT_KEYWORDS.creative };
  }

  if (/\b(beauty|hair|hairdresser|nail|nails|makeup|make-up|cosmetology)\b/.test(q)) {
    return { key: "beauty", label: "Beauty / hair", focusKey: "beauty", focusLabel: "beauty, hair and nails", keywords: INTENT_KEYWORDS.beauty };
  }

  if (/\b(children|child|childcare|child care|early childhood|ecd|teaching|teacher|daycare|day care|creche|crèche|youth care|child and youth)\b/.test(q)) {
    return { key: "education", label: "Education / child care", focusKey: "children", focusLabel: "child care, ECD and teaching support", keywords: ["early childhood", "ecd", "child and youth care", "childcare", "teacher", "teaching", "education"] };
  }

  if (/\b(animal|animals|livestock|poultry|nature|environment|environmental|conservation|wildlife|eco ranger|game ranger|horticulture|forestry|farming|farm|crop|agriculture|agri)\b/.test(q)) {
    return { key: "agriculture", label: "Agriculture / nature", focusKey: "nature", focusLabel: "animals, agriculture and nature", keywords: INTENT_KEYWORDS.agriculture };
  }

  const checks = [
    ["ict", "Computer / ICT", /\b(computer|computers|ict|technology|software|developer|coding|programming|data|analytics|cloud|cyber|cybersecurity|network|systems|digital|ai|artificial intelligence|it support|technical support|help desk|helpdesk|computer support)\b/],
    ["hospitality", "Hospitality / tourism", /\b(hospitality|housekeeping|housekeeper|cleaning|cleaner|hotel|cooking|cook|chef|kitchen|tourism|food|accommodation|catering)\b/],
    ["finance", "Finance / accounting", /\b(finance|financial|financial management|finance administrator|accounting|accountant|bookkeeping|bookkeeper|payroll|tax|banking|insurance|audit|auditing)\b/],
    ["construction", "Construction / trades", /\b(construction|building|civil|engineering|mechanical|quantity surveying|quantity surveyor|plumbing|plumber|electrician|electrical|welding|welder|carpentry|carpenter|bricklaying|bricklayer|boilermaker|artisan|trade|trades|plant operator|construction plant|car|cars|vehicle|automotive|motor mechanic|diesel mechanic|mechanic)\b/],
    ["health", "Health / care", /\b(health|healthcare|community health|health promotion|caregiver|pharmacy|medical|nursing|nurse|social work|counselling|counsellor|community counsellor|social counselling|care worker)\b/],
    ["education", "Education / training", /\b(education|teaching|teacher|facilitator|training facilitator|early childhood|ecd|learning and development|assessor|moderator)\b/],
    ["retail", "Retail / sales", /\b(retail|sales|cashier|store|customer service|wholesale|merchandising)\b/],
    ["transport", "Transport / logistics", /\b(transport|logistics|supply chain|warehouse|warehousing|freight|dispatch|automotive|driver|driving|fleet)\b/],
    ["business", "Business administration", /\b(business|admin|administration|administrator|office|management assistant|project administrator|clerk|public administration|public management|secretarial|secretary)\b/],
    ["safety", "Safety / security", /\b(safety|security guard|security officer|security|policing|investigation|investigator|fire|emergency|occupational health and safety|ohs)\b/]
  ];

  for (const [key, label, regex] of checks) {
    if (regex.test(q)) {
      if (key === "finance" && hasNegationBefore(q, /\b(accounting|finance|financial|it|ict|computer)\b/)) continue;
      if (key === "ict" && hasNegationBefore(q, /\b(it|ict|computer|computers|technology)\b/)) continue;
      const intent = { key, label, keywords: INTENT_KEYWORDS[key] || [] };
      if (key === "ict") {
        intent.focusKey = getIctFocusKey(q);
        intent.focusLabel = getIctFocus(q);
        if (intent.focusKey === "support") {
          intent.keywords = ["computer and digital support", "computer technician", "it support", "technical support", "computer support", "digital support", "information technology"];
        }
      } else if (key === "business") {
        intent.focusKey = /\b(admin|administration|administrator|office|public administration|public management|management assistant|secretarial|secretary|clerk)\b/.test(q) ? "admin" : "business";
        intent.focusLabel = intent.focusKey === "admin" ? "business administration" : "business";
        intent.keywords = intent.focusKey === "admin" ? ["office administrator", "business administrator", "administration", "public management", "public administration", "management assistant", "business management", "project administrator"] : intent.keywords;
      } else if (key === "hospitality") {
        intent.focusKey = /\b(housekeeping|housekeeper|cleaning|cleaner|hotel|accommodation)\b/.test(q) ? "housekeeping" : /\b(cook|cooking|chef|kitchen|food|catering)\b/.test(q) ? "cooking" : "hospitality";
        intent.focusLabel = intent.focusKey === "housekeeping" ? "housekeeping / accommodation" : intent.focusKey === "cooking" ? "cooking / food services" : "hospitality";
        if (intent.focusKey === "housekeeping") intent.keywords = ["housekeeper", "housekeeping", "accommodation", "hotel", "hospitality", "cleaning"];
      } else if (key === "construction") {
        intent.focusKey = /\b(car|cars|vehicle|automotive|motor mechanic|diesel mechanic|mechanic|mechanical)\b/.test(q) ? "automotive" : "construction";
        intent.focusLabel = intent.focusKey === "automotive" ? "automotive / engineering trades" : "construction / trades";
      } else if (key === "finance") {
        const specialistFinance = /\b(manager|municipal|audit|auditor|bank|banking|insurance|tax|payroll)\b/.test(q);
        intent.focusKey = specialistFinance ? "finance" : "entry-finance";
        intent.focusLabel = intent.focusKey === "entry-finance" ? "finance / accounting entry paths" : "finance / accounting";
        if (intent.focusKey === "entry-finance") intent.keywords = ["finance administrator", "financial management", "bookkeeper", "bookkeeping", "accounting", "accounting officer", "payroll administrator"];
      } else if (key === "health") {
        const counsellingFocus = /\b(community health|health promotion|counselling|counsellor|counselor|community counsellor|social counselling|not nursing|not nurse)\b/.test(q);
        intent.focusKey = counsellingFocus ? "community-health" : "health";
        intent.focusLabel = counsellingFocus ? "community health / counselling" : "health / care";
        if (counsellingFocus) intent.keywords = ["health promotion", "community health", "community counsellor", "social counselling", "counselling", "social work"];
      } else {
        intent.focusKey = key;
        intent.focusLabel = label.toLowerCase();
      }
      return intent;
    }
  }

  return { key: "general", label: "", focusKey: "general", focusLabel: "", keywords: [] };
}

function getIctFocusSignals(query) {
  const q = normalise(query);
  return {
    cloud: /\b(cloud|cloud computing)\b/.test(q),
    cyber: /\b(cyber|cybersecurity|information security)\b/.test(q),
    data: /\b(data|analytics|analyst|data science|database|analysis)\b/.test(q),
    software: /\b(software|developer|coding|programming|programmer|systems development|ai|artificial intelligence)\b/.test(q),
    network: /\b(network|networking|5g|cellular|telecom|telecommunications)\b/.test(q),
    support: /\b(it support|technical support|help desk|helpdesk|computer support|digital support|computer technician|support)\b/.test(q)
  };
}

function getIctFocusKey(query) {
  const q = normalise(query);
  const signals = getIctFocusSignals(q);
  const active = Object.entries(signals).filter(([, value]) => value).map(([key]) => key);
  const comparingOptions = /\b(choose|decide|which one|not sure|don t know|don't know|or|and)\b|\//.test(q);
  // If the user names two or more ICT interests, keep the answer inside those named interests.
  // Example: "cybersecurity or cloud" should not suddenly show every ICT field.
  if (active.length > 1 && comparingOptions) return "multi-ict";
  if (signals.cloud) return "cloud";
  if (signals.cyber) return "cyber";
  if (signals.data) return "data";
  if (signals.software) return "software";
  if (signals.network) return "network";
  if (signals.support) return "support";
  return "general-ict";
}

function getIctFocus(query) {
  const focus = getIctFocusKey(query);
  if (focus === "cloud") return "cloud computing";
  if (focus === "cyber") return "cybersecurity";
  if (focus === "data") return "data analytics";
  if (focus === "software") return "software development";
  if (focus === "network") return "networking";
  if (focus === "support") return "IT support / computer support";
  if (focus === "multi-ict") return "the ICT areas you mentioned";
  return "computer / ICT options";
}

function rowMatchesIctFocus(row, query) {
  const text = rowIntentText(row);
  const q = normalise(query);
  const focus = getIctFocusKey(q);

  const matchers = {
    cloud: () => /\b(cloud|cloud administrator)\b/i.test(text),
    cyber: () => /\b(cyber|cybersecurity|information security)\b/i.test(text),
    data: () => /\b(data science|data analyst|data analytics|database administrator)\b/i.test(text),
    software: () => /\b(software developer|software engineer|systems developer|systems development|programmer|programming|coding)\b/i.test(text) || (/\b(artificial intelligence|ai software)\b/i.test(text) && /\b(ai|artificial intelligence)\b/.test(q)),
    network: () => /\b(network|networking|5g|cellular|telecommunications)\b/i.test(text),
    support: () => /\b(computer and digital support|computer technician|it support|technical support|help desk|helpdesk|computer support|digital support)\b/i.test(text)
  };

  if (focus === "multi-ict") {
    const signals = getIctFocusSignals(q);
    return Object.entries(signals).some(([key, isActive]) => isActive && matchers[key] && matchers[key]());
  }

  if (matchers[focus]) return matchers[focus]();
  return true;
}

function getExploreKeywordsForIntent(intent, message) {
  if (!intent || !intent.key || intent.key === "general") return [];
  if (intent.key === "ict") {
    const focus = intent.focusKey || getIctFocusKey(message || "");
    if (focus === "cloud") return ["cloud", "cloud administrator"];
    if (focus === "cyber") return ["cybersecurity", "cyber", "information security"];
    if (focus === "data") return ["data analyst", "data science", "data analytics", "database"];
    if (focus === "software") return ["software developer", "software engineer", "systems developer", "systems development", "programmer", "programming", "coding"];
    if (focus === "network") return ["network", "networking", "5g", "cellular", "telecommunications"];
    if (focus === "support") return ["computer and digital support", "computer technician", "it support", "technical support", "digital support"];
    if (focus === "multi-ict") {
      const q = normalise(message || "");
      const signals = getIctFocusSignals(q);
      const keywords = [];
      if (signals.cloud) keywords.push("cloud", "cloud administrator");
      if (signals.cyber) keywords.push("cybersecurity", "cyber", "information security");
      if (signals.data) keywords.push("data analyst", "data science", "data analytics", "database");
      if (signals.software) keywords.push("software developer", "software engineer", "systems developer", "programming", "coding");
      if (signals.network) keywords.push("network", "networking", "5g", "telecommunications");
      if (signals.support) keywords.push("computer and digital support", "computer technician", "it support", "technical support");
      return uniqueCompact(keywords, 14);
    }
    return ["computer", "digital", "computer and digital support", "computer technician", "software", "developer", "data", "cloud", "cybersecurity", "network", "information technology", "artificial intelligence"];
  }
  if (intent.key === "practical" && intent.focusKey === "hands-on") return ["plant operator", "construction plant operator", "freight handler", "warehouse", "housekeeper", "commercial cleaner", "cleaner", "food handler", "kitchen hand", "care worker", "social auxiliary worker", "beauty", "hairdresser", "welder", "plumbing hand", "assistant handyperson"];
  if (intent.key === "practical") return ["office administrator", "sales assistant", "retail", "freight handler", "housekeeper", "commercial cleaner", "food handler", "kitchen hand", "care worker", "beauty", "hairdresser", "plant operator"];
  if (intent.key === "helping") return ["health promotion", "community counsellor", "social counselling", "social auxiliary", "care worker", "child and youth care", "early childhood", "ecd"];
  if (intent.key === "project") return ["project manager", "project coordinator", "project management"];
  if (intent.key === "creative") return ["graphic media designer", "media", "photography", "photographer", "marketing coordinator", "marketing management", "front-end web designer", "journalist", "design thinking"];
  if (intent.key === "beauty") return ["hairdresser", "beauty therapist", "beauty practitioner", "nail", "temporary hair removal", "hair and scalp", "makeup"];
  if (intent.key === "energy") return ["electrician", "electrical", "renewable energy", "solar", "energy", "photovoltaic"];
  if (intent.key === "mining") return ["mining", "mine", "plant operator", "surface blaster", "blaster", "crane operator", "earthmoving", "excavator", "dump truck", "mineral"];
  if (intent.key === "business" && intent.focusKey === "office") return ["office administrator", "business administrator", "management assistant", "project coordinator", "administration", "secretarial", "customer service"];
  if (intent.key === "business" && intent.focusKey === "admin") return ["office administrator", "business administrator", "administration", "public management", "public administration", "management assistant", "business management", "project administrator"];
  if (intent.key === "hospitality" && intent.focusKey === "housekeeping") return ["housekeeper", "housekeeping", "accommodation", "hotel", "hospitality", "cleaning", "commercial cleaner"];
  if (intent.key === "hospitality" && intent.focusKey === "cooking") return ["chef", "cook", "cooking", "kitchen", "food handler", "catering", "hospitality"];
  if (intent.key === "finance" && intent.focusKey === "entry-finance") return ["finance administrator", "financial management", "bookkeeper", "bookkeeping", "accounting", "accounting officer", "payroll administrator"];
  if (intent.key === "health" && intent.focusKey === "community-health") return ["health promotion", "community health", "community counsellor", "social counselling", "counselling", "social work"];
  if (intent.key === "construction" && intent.focusKey === "automotive") return ["automotive", "motor mechanic", "diesel mechanic", "vehicle", "mechanical", "mechanic", "welding", "welder", "engineering"];
  if (intent.key === "construction") return ["construction", "building", "civil", "construction plant", "plumbing", "electrician", "electrical", "welding", "welder", "boilermaker", "carpentry", "bricklaying", "engineering"];
  if (intent.key === "agriculture" && (intent.focusKey === "farming" || intent.focusKey === "nature")) return ["farming", "farm", "crop", "animal", "animals", "livestock", "poultry", "agriculture", "horticulture", "forestry", "environment", "conservation", "eco ranger"];
  return Array.isArray(intent.keywords) ? intent.keywords : [];
}

function rowIntentText(row) {
  return lower(`${row.career || ""} ${row.qualificationTitle || ""} ${row.qualificationType || ""}`);
}

function rowSearchText(row) {
  return lower(`${row.providerName || ""} ${row.province || ""} ${row.cityTown || ""} ${row.career || ""} ${row.qualificationType || ""} ${row.qualificationTitle || ""} ${row.setaPartner || ""} ${row.status || ""}`);
}

function rowMatchesIntent(row, intentKey) {
  if (!intentKey || intentKey === "general") return true;
  const regex = INTENT_REGEX[intentKey];
  return regex ? regex.test(rowIntentText(row)) : true;
}

function rowMatchesFocusedIntent(row, intent, query) {
  if (!intent || intent.key === "general") return true;
  if (!rowMatchesIntent(row, intent.key)) return false;
  const text = rowIntentText(row);
  const fullText = rowSearchText(row);
  const q = normalise(query);

  if (intent.key === "ict") return rowMatchesIctFocus(row, q);

  if (intent.key === "practical") {
    if (intent.focusKey === "hands-on") {
      if (/\b(office administrator|business administrator|management assistant|public administration|secretary|secretarial|bookkeeper|accounting|finance administrator|project coordinator|project manager)\b/i.test(text)) return false;
      if (/\b(manager|specialist|professional|analyst|auditor|engineer|developer)\b/i.test(text)) return false;
      return /\b(plant operator|construction plant operator|freight handler|warehouse|housekeeper|commercial cleaner|cleaner|food handler|kitchen hand|care worker|social auxiliary worker|assistant handyperson|plumbing hand|welder|beauty|hairdresser|sales assistant|retail sales|cashier)\b/i.test(text);
    }
    if (/\b(manager|specialist|professional|practitioner|analyst|auditor|engineer|developer)\b/i.test(text) && !/\b(practitioner|analyst|developer)\b/.test(q)) return false;
    return /\b(office administrator|business administrator|sales assistant|retail sales|cashier|freight handler|warehouse|housekeeper|commercial cleaner|food handler|kitchen hand|care worker|social auxiliary worker|plant operator|assistant|beauty|hairdresser)\b/i.test(text);
  }

  if (intent.key === "helping") {
    if (/\b(journalist|it support|end user computing|accounting|finance|project manager|business development|marketing|sales)\b/i.test(text)) return false;
    return /\b(health promotion officer|community health|community counsellor|social counselling|social auxiliary worker|care worker|child and youth care|early childhood development|ecd practitioner|home based personal care)\b/i.test(text);
  }

  if (intent.key === "project") {
    return /\b(project manager|project coordinator|project management)\b/i.test(text);
  }

  if (intent.key === "creative") {
    if (/\b(emergency|first aid|blaster|surface blaster|mining|fire|safety|occupational health)\b/i.test(text)) return false;
    return /\b(graphic media designer|media production|photography|photographer|marketing coordinator|marketing management|front[- ]?end web designer|web designer|journalist|design thinking|innovation practitioner|multimedia|advertising)\b/i.test(text);
  }

  if (intent.key === "beauty") {
    return /\b(hairdresser|beauty therapist|beauty practitioner|nail|temporary hair removal|hair and scalp|makeup|cosmetology|massage|spa)\b/i.test(text);
  }

  if (intent.key === "energy") {
    return /\b(electrician|electrical|electricity|renewable energy|solar|photovoltaic|energy workshop assistant|pv)\b/i.test(text);
  }

  if (intent.key === "mining") {
    if (/\b(cloud administrator|bus driver|automotive technician|office administrator|hr administrator)\b/i.test(text)) return false;
    return /\b(mining|mine|plant operator|surface blaster|blaster|crane operator|earthmoving|excavator|dump truck|rock|quarry|mineral|chemical plant operator|construction plant operator)\b/i.test(text);
  }

  if (intent.key === "business" && intent.focusKey === "office") {
    if (/\b(accounting|finance|financial|bookkeeper|it support|computer|digital|software|developer|network|cyber|cloud|banking|insurance|retail business owner|warehouse|freight|logistics)\b/i.test(text)) return false;
    return /\b(office administrator|business administrator|administration|management assistant|project coordinator|secretarial|secretary|reception|customer service)\b/i.test(text);
  }

  if (intent.key === "business" && intent.focusKey === "admin") {
    if (/\b(banking|banker|insurance|claims|retail business owner|small retail|sales|cashier|dispatching|receiving|logistics|transport clerk|freight handler|warehouse|human resource|hr administrator|skills development|learning and development)\b/i.test(text) && !/\b(banking|insurance|retail|sales|logistics|transport|warehouse|dispatch|hr|human resource|human resources)\b/.test(q)) return false;
    return /\b(office administrator|business administrator|administration|administrative|public management|public administration|management assistant|business management|project administrator|secretarial)\b/i.test(text);
  }

  if (intent.key === "hospitality" && intent.focusKey === "housekeeping") {
    if (/\b(beam house|hairdresser|counsellor|community counsellor|kitchen hand|cook|chef|healthcare|health care|care worker|health promotion)\b/i.test(text)) return false;
    return /\b(housekeeper|housekeeping|accommodation|hotel|hospitality|cleaning|cleaner)\b/i.test(text);
  }

  if (intent.key === "hospitality" && intent.focusKey === "cooking") {
    if (/\b(packaging operator|process machine operator|manufacturing|beverage packaging|beverage process)\b/i.test(text) && !/\b(packaging|process|manufacturing|factory|beverage production)\b/.test(q)) return false;
    return /\b(cook|cooking|chef|kitchen|food handler|food safety|food|catering|hospitality|baker|baking)\b/i.test(text);
  }

  if (intent.key === "finance" && intent.focusKey === "entry-finance") {
    if (/\b(municipal finance manager|internal audit manager|manager|specialist|practitioner)\b/i.test(text) && !/\b(manager|municipal|audit|specialist|advanced)\b/.test(q)) return false;
    return /\b(finance administrator|financial management|bookkeeper|bookkeeping|accounting officer|management accounting officer|payroll administrator|accounting)\b/i.test(text);
  }

  if (intent.key === "health" && intent.focusKey === "community-health") {
    if (/\b(healthcare cleaner|cleaner|nursing|nurse|home nursing|occupational health and safety|ohs)\b/i.test(fullText) && !/\b(cleaner|cleaning|nursing|nurse|safety|ohs|occupational health and safety)\b/.test(q)) return false;
    return /\b(health promotion officer|community health|community counsellor|social counselling|social counselling worker|social counselling support worker|counselling|counsellor|social work)\b/i.test(text);
  }

  if (intent.key === "construction") {
    const wantsVehicle = /\b(car|cars|vehicle|automotive|truck|motor mechanic|diesel mechanic|mechanic|mechanical)\b/.test(q);
    if (intent.focusKey === "automotive") {
      return /\b(automotive|motor mechanic|diesel mechanic|vehicle|mechanical|mechanic|fitter and turner|fitter|millwright|welding|welder|engineering)\b/i.test(text);
    }
    if (/\b(vehicle painter|vehicle body builder|panel beater|automotive|motor mechanic|diesel mechanic|truck bodies)\b/i.test(text) && !wantsVehicle) return false;
  }

  if (intent.key === "education" && intent.focusKey === "children") {
    if (/\b(adult literacy|occupational trainer|learning and development professional|learning and development facilitator|training facilitator|assessor|moderator|hr administrator|human resource)\b/i.test(text)) return false;
    return /\b(early childhood development|ecd practitioner|educare|child and youth care|childcare|child care|day care|daycare|children|youth care)\b/i.test(text);
  }

  if (intent.key === "agriculture" && (intent.focusKey === "farming" || intent.focusKey === "nature")) {
    return /\b(farming|farm|crop|animal|animals|livestock|poultry|agriculture|horticulture|forestry|eco ranger|wildlife|environment|environmental|conservation)\b/i.test(text);
  }

  return true;
}

function addPhraseScore(text, phrase, points) {
  return text.includes(phrase) ? points : 0;
}

function scoreRow(row, query, tokens, province, cityTown, intent) {
  let score = 0;
  const text = rowIntentText(row);
  const searchText = rowSearchText(row);
  const partner = lower(row.setaPartner);
  const status = lower(row.status);
  const sameProvince = Boolean(province && row.province === province);
  const sameCity = Boolean(cityTown && normalise(row.cityTown) === normalise(cityTown));

  if (sameCity) score += 150;
  if (sameProvince) score += 80;
  if (status === "active" || status.startsWith("active")) score += 35;
  if (status.includes("expired")) score -= 65;

  if (intent.key === "ict") {
    if (partner.includes("mict")) score += 12;

    const wantsGeneralComputers = /\b(computer|computers|ict|technology|digital|it)\b/.test(query);
    const wantsData = /\b(data|analytics|analyst|science)\b/.test(query);
    const wantsCyber = /\b(cyber|cybersecurity|security)\b/.test(query);
    const wantsCloud = /\b(cloud)\b/.test(query);
    const wantsSoftware = /\b(software|developer|coding|programming|programmer)\b/.test(query);

    if (wantsGeneralComputers) {
      score += addPhraseScore(text, "computer and digital support assistant", 75);
      score += addPhraseScore(text, "computer technician", 65);
      score += addPhraseScore(text, "computer", 35);
      score += addPhraseScore(text, "digital", 22);
      score += addPhraseScore(text, "software", 16);
      score += addPhraseScore(text, "data", 12);
      score += addPhraseScore(text, "cloud", 10);
      score += addPhraseScore(text, "cyber", 8);
      score += addPhraseScore(text, "network", 8);
    }

    if (wantsData) {
      score += addPhraseScore(text, "data science", 80);
      score += addPhraseScore(text, "data analyst", 75);
      score += addPhraseScore(text, "data", 55);
      score += addPhraseScore(text, "analytics", 40);
    }

    if (wantsCyber) {
      score += addPhraseScore(text, "cybersecurity", 85);
      score += addPhraseScore(text, "cyber", 70);
      score += addPhraseScore(text, "security", 35);
    }

    if (wantsCloud) {
      score += addPhraseScore(text, "cloud", 95);
      score += addPhraseScore(text, "network", 35);
      score += addPhraseScore(text, "computer", 18);
      score += addPhraseScore(text, "digital", 12);
      // Do not reward every generic administrator role. Only cloud/network/computer admin records should rise.
      if (/\b(cloud|network|computer|digital|information technology)\b/i.test(text)) {
        score += addPhraseScore(text, "administrator", 20);
      }
    }

    if (wantsSoftware) {
      score += addPhraseScore(text, "software developer", 85);
      score += addPhraseScore(text, "software", 65);
      score += addPhraseScore(text, "developer", 50);
      score += addPhraseScore(text, "programmer", 50);
    }
  }



  if (intent.key === "practical") {
    if (intent.focusKey === "hands-on") {
      score += addPhraseScore(text, "plant operator", 95);
      score += addPhraseScore(text, "construction plant operator", 95);
      score += addPhraseScore(text, "freight handler", 82);
      score += addPhraseScore(text, "warehouse", 78);
      score += addPhraseScore(text, "housekeeper", 76);
      score += addPhraseScore(text, "commercial cleaner", 70);
      score += addPhraseScore(text, "food handler", 66);
      score += addPhraseScore(text, "kitchen hand", 66);
      score += addPhraseScore(text, "care worker", 60);
      score += addPhraseScore(text, "social auxiliary worker", 58);
      score += addPhraseScore(text, "welder", 55);
      score += addPhraseScore(text, "plumbing hand", 50);
      score += addPhraseScore(text, "beauty", 45);
      score += addPhraseScore(text, "hairdresser", 45);
      if (/\b(office administrator|business administrator|management assistant|public administration|secretary|secretarial|bookkeeper|accounting|finance administrator|project coordinator|project manager)\b/i.test(text)) score -= 180;
      if (/\b(manager|specialist|analyst|auditor|engineer|developer|professional)\b/i.test(text)) score -= 60;
    } else {
      score += addPhraseScore(text, "office administrator", 80);
      score += addPhraseScore(text, "business administrator", 70);
      score += addPhraseScore(text, "sales assistant", 65);
      score += addPhraseScore(text, "freight handler", 60);
      score += addPhraseScore(text, "housekeeper", 58);
      score += addPhraseScore(text, "commercial cleaner", 48);
      score += addPhraseScore(text, "food handler", 55);
      score += addPhraseScore(text, "kitchen hand", 55);
      score += addPhraseScore(text, "care worker", 52);
      score += addPhraseScore(text, "social auxiliary worker", 50);
      score += addPhraseScore(text, "beauty", 42);
      score += addPhraseScore(text, "hairdresser", 42);
      score += addPhraseScore(text, "plant operator", 35);
      if (/\b(manager|specialist|analyst|auditor|engineer|developer|professional)\b/i.test(text)) score -= 45;
    }
  }

  if (intent.key === "helping") {
    score += addPhraseScore(text, "health promotion officer", 95);
    score += addPhraseScore(text, "community counsellor", 90);
    score += addPhraseScore(text, "social counselling worker", 88);
    score += addPhraseScore(text, "social counselling support worker", 84);
    score += addPhraseScore(text, "social auxiliary worker", 82);
    score += addPhraseScore(text, "care worker", 72);
    score += addPhraseScore(text, "child and youth care", 70);
    score += addPhraseScore(text, "early childhood development", 58);
    if (/\b(journalist|it support|end user computing|finance|accounting|project manager|business development)\b/i.test(text)) score -= 80;
  }

  if (intent.key === "project") {
    score += addPhraseScore(text, "project coordinator", 110);
    score += addPhraseScore(text, "project manager", 105);
    score += addPhraseScore(text, "project management", 95);
    if (!/\bproject\b/i.test(text)) score -= 100;
  }

  if (intent.key === "creative") {
    score += addPhraseScore(text, "graphic media designer", 105);
    score += addPhraseScore(text, "media production", 95);
    score += addPhraseScore(text, "photographer", 90);
    score += addPhraseScore(text, "photography", 90);
    score += addPhraseScore(text, "marketing coordinator", 82);
    score += addPhraseScore(text, "marketing management", 75);
    score += addPhraseScore(text, "front-end web designer", 80);
    score += addPhraseScore(text, "front end web designer", 80);
    score += addPhraseScore(text, "web designer", 76);
    score += addPhraseScore(text, "journalist", 65);
    score += addPhraseScore(text, "design thinking", 50);
    if (/\b(emergency|first aid|surface blaster|blaster|mining|safety)\b/i.test(text)) score -= 100;
  }

  if (intent.key === "beauty") {
    score += addPhraseScore(text, "hairdresser", 100);
    score += addPhraseScore(text, "beauty therapist", 95);
    score += addPhraseScore(text, "beauty practitioner", 90);
    score += addPhraseScore(text, "nail", 78);
    score += addPhraseScore(text, "temporary hair removal", 65);
    score += addPhraseScore(text, "hair and scalp", 60);
  }

  if (intent.key === "energy") {
    if (partner.includes("ewseta")) score += 20;
    score += addPhraseScore(text, "renewable energy workshop assistant", 115);
    score += addPhraseScore(text, "solar", 105);
    score += addPhraseScore(text, "electrician", 100);
    score += addPhraseScore(text, "electrical engineering", 80);
    score += addPhraseScore(text, "electrical", 70);
    score += addPhraseScore(text, "energy", 60);
    if (/\b(gardener|emergency|first aid|occupational trainer|it support|workplace essential skills|handyperson)\b/i.test(text)) score -= 100;
  }

  if (intent.key === "mining") {
    if (partner.includes("mqa")) score += 22;
    score += addPhraseScore(text, "surface blaster", 110);
    score += addPhraseScore(text, "mining", 105);
    score += addPhraseScore(text, "mine", 85);
    score += addPhraseScore(text, "plant operator", 78);
    score += addPhraseScore(text, "construction plant operator", 74);
    score += addPhraseScore(text, "chemical plant operator", 65);
    score += addPhraseScore(text, "crane", 62);
    score += addPhraseScore(text, "earthmoving", 60);
    score += addPhraseScore(text, "excavator", 60);
    score += addPhraseScore(text, "dump truck", 60);
    if (/\b(cloud administrator|bus driver|office administrator|hr administrator)\b/i.test(text)) score -= 100;
  }

  if (intent.key === "business" && intent.focusKey === "office") {
    score += addPhraseScore(text, "office administrator", 90);
    score += addPhraseScore(text, "business administrator", 80);
    score += addPhraseScore(text, "management assistant", 70);
    score += addPhraseScore(text, "project coordinator", 55);
    score += addPhraseScore(text, "secretarial", 45);
    score += addPhraseScore(text, "customer service", 40);
    if (/\b(accounting|financial|bookkeeper|it support|computer|digital|software|network|cloud|cyber|banking|insurance|retail business owner|warehouse|freight|logistics)\b/i.test(text)) score -= 90;
  }

  if (intent.key === "business" && intent.focusKey === "admin") {
    score += addPhraseScore(text, "office administrator", 80);
    score += addPhraseScore(text, "business administrator", 70);
    score += addPhraseScore(text, "management assistant", 60);
    score += addPhraseScore(text, "public administration", 45);
    score += addPhraseScore(text, "public management", 42);
    if (/\b(bank|banking|insurance|retail|sales|warehouse|dispatch|hr administrator|learning and development)\b/i.test(text)) score -= 60;
  }

  if (intent.key === "hospitality") {
    if (intent.focusKey === "housekeeping") {
      score += addPhraseScore(text, "housekeeper", 90);
      score += addPhraseScore(text, "housekeeping", 85);
      score += addPhraseScore(text, "hotel", 45);
      score += addPhraseScore(text, "accommodation", 45);
      score += addPhraseScore(text, "hospitality", 35);
      score += addPhraseScore(text, "commercial cleaner", 30);
      if (/\b(beam house|hairdresser|counsellor|healthcare cleaner|kitchen hand|chef|cook)\b/i.test(text)) score -= 70;
    }
    if (intent.focusKey === "cooking") {
      score += addPhraseScore(text, "chef", 95);
      score += addPhraseScore(text, "cook", 90);
      score += addPhraseScore(text, "kitchen hand", 75);
      score += addPhraseScore(text, "food handler", 65);
      score += addPhraseScore(text, "catering", 45);
      score += addPhraseScore(text, "hospitality", 30);
      if (/\b(packaging operator|process machine operator|beverage packaging|beverage process|manufacturing)\b/i.test(text)) score -= 55;
    }
  }

  if (intent.key === "finance") {
    const specialistFinanceQuery = /\b(manager|municipal|audit|auditor|banking|insurance|tax|payroll)\b/.test(query);
    score += addPhraseScore(text, "finance administrator", 85);
    score += addPhraseScore(text, "financial management", 75);
    score += addPhraseScore(text, "bookkeeper", 70);
    score += addPhraseScore(text, "bookkeeping", 65);
    score += addPhraseScore(text, "accounting officer", 55);
    score += addPhraseScore(text, "payroll administrator", 45);
    if (intent.focusKey === "entry-finance" && !specialistFinanceQuery && /\b(municipal finance manager|internal audit manager|manager|specialist|practitioner)\b/i.test(text)) score -= 75;
  }

  if (intent.key === "health") {
    if (intent.focusKey === "community-health") {
      score += addPhraseScore(text, "health promotion officer", 95);
      score += addPhraseScore(text, "community counsellor", 90);
      score += addPhraseScore(text, "social counselling worker", 85);
      score += addPhraseScore(text, "social counselling support worker", 78);
      score += addPhraseScore(text, "community health", 75);
      score += addPhraseScore(text, "counselling", 70);
      if (/\b(healthcare cleaner|cleaner|nursing|nurse|home nursing|occupational health and safety|ohs)\b/i.test(searchText)) score -= 80;
    } else {
      score += addPhraseScore(text, "health promotion officer", 55);
      score += addPhraseScore(text, "care worker", 35);
      score += addPhraseScore(text, "pharmacy", 35);
    }
  }

  if (intent.key === "construction") {
    const wantsVehicle = /\b(car|cars|vehicle|automotive|truck|motor mechanic|diesel mechanic|mechanic|mechanical)\b/.test(query);
    if (intent.focusKey === "automotive") {
      score += addPhraseScore(text, "automotive motor mechanic", 105);
      score += addPhraseScore(text, "diesel mechanic", 98);
      score += addPhraseScore(text, "automotive", 85);
      score += addPhraseScore(text, "mechanical engineering", 75);
      score += addPhraseScore(text, "mechanical fitter", 70);
      score += addPhraseScore(text, "fitter and turner", 65);
      score += addPhraseScore(text, "welding", 55);
      score += addPhraseScore(text, "welder", 55);
    } else {
      score += addPhraseScore(text, "construction plant operator", 90);
      score += addPhraseScore(text, "construction", 75);
      score += addPhraseScore(text, "civil engineering", 70);
      score += addPhraseScore(text, "electrician", 65);
      score += addPhraseScore(text, "plumbing", 60);
      score += addPhraseScore(text, "welder", 55);
      score += addPhraseScore(text, "boilermaker", 55);
      if (!wantsVehicle && /\b(vehicle painter|vehicle body builder|panel beater|automotive|motor mechanic|diesel mechanic|truck bodies)\b/i.test(text)) score -= 80;
    }
  }

  if (intent.key === "agriculture") {
    score += addPhraseScore(text, "livestock", 90);
    score += addPhraseScore(text, "poultry", 82);
    score += addPhraseScore(text, "aquaculture", 78);
    score += addPhraseScore(text, "environmental", 75);
    score += addPhraseScore(text, "eco ranger", 75);
    score += addPhraseScore(text, "conservation", 70);
    score += addPhraseScore(text, "farming", 80);
    score += addPhraseScore(text, "farm", 70);
    score += addPhraseScore(text, "crop", 70);
    score += addPhraseScore(text, "agricultural", 65);
    score += addPhraseScore(text, "agriculture", 60);
    score += addPhraseScore(text, "animal", 55);
    score += addPhraseScore(text, "horticulture", 50);
    score += addPhraseScore(text, "forestry", 42);
    score += addPhraseScore(text, "nursery", 35);
  }

  if (intent.key === "education" && intent.focusKey === "children") {
    score += addPhraseScore(text, "early childhood development", 110);
    score += addPhraseScore(text, "ecd practitioner", 105);
    score += addPhraseScore(text, "child and youth care", 95);
    score += addPhraseScore(text, "child", 60);
    score += addPhraseScore(text, "teacher", 55);
    score += addPhraseScore(text, "teaching", 50);
    score += addPhraseScore(text, "social auxiliary worker", 42);
    if (/\b(adult literacy|occupational trainer|learning and development professional|learning and development facilitator|training facilitator|assessor|moderator|hr administrator|human resource)\b/i.test(text)) score -= 95;
  }

  for (const token of tokens) {
    if (!token || token === "it") continue;
    if (searchText.includes(token)) score += 3;
    if (text.includes(token)) score += 10;
  }

  return { score, sameProvince, sameCity };
}

function balancedDedupe(scoredRows, max = 10) {
  const output = [];
  const seenRecord = new Set();
  const usedCareers = new Set();
  const usedProviders = new Set();

  function keyFor(row) {
    return normalise(`${row.uniqueOrgId || row.orgGroupId || row.orgId || row.providerName || ""}|${row.career || ""}|${row.qualificationTitle || ""}|${row.province || ""}|${row.cityTown || ""}`);
  }

  function add(item, balancedRound) {
    if (output.length >= max) return;
    const row = item.row;
    const recordKey = keyFor(row);
    const careerKey = normalise(row.career);
    const providerKey = normalise(row.providerName);
    if (seenRecord.has(recordKey)) return;
    if (balancedRound && (usedCareers.has(careerKey) || usedProviders.has(providerKey))) return;
    seenRecord.add(recordKey);
    usedCareers.add(careerKey);
    usedProviders.add(providerKey);
    output.push(row);
  }

  scoredRows.forEach((item) => add(item, true));
  scoredRows.forEach((item) => add(item, false));
  return output;
}

function findRelevantRecords(message) {
  const providers = loadProviders();
  const location = detectLocation(message, providers);
  const province = location.province;
  const cityTown = location.cityTown;
  const intent = detectPrimaryIntent(message);
  const query = normalise(message);
  const tokens = tokenize(message);
  const scored = [];

  for (const row of providers) {
    if (province && row.province !== province) continue;
    if (intent.key !== "general" && !rowMatchesFocusedIntent(row, intent, query)) continue;
    const item = scoreRow(row, query, tokens, province, cityTown, intent);
    if (item.score > (intent.key === "general" ? 12 : 30)) scored.push({ row, score: item.score, sameProvince: item.sameProvince, sameCity: item.sameCity });
  }

  if (scored.length < 6 && province) {
    for (const row of providers) {
      if (row.province === province) continue;
      if (intent.key !== "general" && !rowMatchesFocusedIntent(row, intent, query)) continue;
      const item = scoreRow(row, query, tokens, "", "", intent);
      if (item.score > (intent.key === "general" ? 12 : 30)) scored.push({ row, score: item.score, sameProvince: false, sameCity: false });
    }
  }

  scored.sort((a, b) => {
    const aActive = lower(a.row.status).startsWith("active");
    const bActive = lower(b.row.status).startsWith("active");
    if (aActive !== bActive) return aActive ? -1 : 1;
    if (a.sameCity !== b.sameCity) return a.sameCity ? -1 : 1;
    if (a.sameProvince !== b.sameProvince) return a.sameProvince ? -1 : 1;
    return b.score - a.score;
  });

  const localRows = scored.filter((item) => item.sameCity || item.sameProvince);
  const pool = localRows.length >= 4 ? localRows : scored;
  const activePool = pool.filter((item) => lower(item.row.status).startsWith("active"));
  const finalPool = activePool.length >= 4 ? activePool : pool;

  return {
    detectedProvince: province,
    detectedCityTown: cityTown,
    keywords: Array.from(new Set(tokens.concat(intent.keywords || []))).slice(0, 14),
    matches: balancedDedupe(finalPool, 10),
    intent,
    hasLocalMatches: localRows.length > 0
  };
}

function buildGeneralFallback(message, detectedProvince = "", detectedCityTown = "") {
  const q = normalise(message);
  const locationLine = detectedCityTown ? ` near ${detectedCityTown}` : detectedProvince ? ` in ${detectedProvince}` : "";

  if (/\b(computer|computers|technology|data|cloud|ict|digital|software|cyber|network|it)\b/.test(q)) {
    return `Because you are interested in computers${locationLine}, useful learnership paths to explore include computer and digital support, computer technician, software development, data analytics, cloud administration, cybersecurity and network-related ICT roles. Search the Explore page using the ICT filter results, then contact providers directly. Accreditation does not guarantee funding or a current learnership intake, so always confirm availability, requirements and application dates with the provider.`;
  }

  if (/\b(business|admin|administration|office)\b/.test(q)) {
    return `For business or administration${locationLine}, explore paths linked to office administration, business administration, management assistant, project support and public administration. Search for accredited providers in your province, then contact them directly to confirm current learnership availability. Accreditation does not guarantee funding or an open intake.`;
  }

  if (/\b(hospitality|cook|cooking|tourism)\b/.test(q)) {
    return `For hospitality or cooking${locationLine}, explore paths linked to hospitality services, food preparation, chef/cook training, accommodation and tourism. Use the platform to find accredited providers, then contact them directly to confirm whether they currently have learnership opportunities. Accreditation does not guarantee funding or an open intake.`;
  }

  if (/\b(finance|accounting|bookkeeping|payroll|banking)\b/.test(q)) {
    return `For finance or accounting${locationLine}, explore paths such as accounting, bookkeeping, payroll, financial administration, banking and insurance support. Contact accredited providers directly to confirm current learnership availability and requirements. Accreditation does not guarantee funding or an open intake.`;
  }

  if (/\b(construction|building|civil|plumbing|electrician|welding|carpentry)\b/.test(q)) {
    return `For construction or trades${locationLine}, explore paths such as building, civil construction, plumbing, electrical work, welding, carpentry and other artisan-related qualifications. Contact providers directly to confirm active learnership opportunities. Accreditation does not guarantee funding or an open intake.`;
  }

  return `Use the platform to search by province, career field, qualification or provider name. After finding accredited providers, contact them directly to confirm current learnership availability, requirements and application dates. Accreditation does not automatically mean funding or that a learnership intake is currently open.`;
}

function buildFallbackAnswer(message, matches, detectedProvince, intent, detectedCityTown = "", hasLocalMatches = true) {
  if (!matches.length) return buildGeneralFallback(message, detectedProvince, detectedCityTown);

  const locationLine = detectedProvince ? ` in ${detectedProvince}` : "";
  const careers = [...new Set(matches.map((row) => row.career).filter(Boolean))].slice(0, 6);
  const qualifications = [...new Set(matches.map((row) => row.qualificationTitle).filter(Boolean))].slice(0, 5);
  const providers = [...new Set(matches.map((row) => row.providerName).filter(Boolean))].slice(0, 4);

  const readableIntentLabel = intent && (intent.focusLabel || (intent.label ? intent.label.toLowerCase() : ""));
  let intro = readableIntentLabel
    ? `Based on your interest in ${readableIntentLabel}${locationLine}, I found possible pathways linked to: ${careers.join(", ") || "related training options"}.`
    : `Based on your question, I found possible pathways${locationLine} linked to: ${careers.join(", ") || "related training options"}.`;
  if (intent && intent.key === "ict") {
    const interestLabel = getIctFocus(message);
    intro = `Based on your interest in ${interestLabel}${locationLine}, the platform has ICT-related pathways such as: ${careers.join(", ") || "computer support, software, data, cloud and cybersecurity"}.`;
  }

  if ((detectedProvince || detectedCityTown) && !hasLocalMatches) intro += " I could not find enough exact local matches, so I included the closest relevant records from other areas.";

  return `${intro}\n\nRelated qualifications include:\n${qualifications.map((q) => `• ${q}`).join("\n")}\n\nPossible providers from the platform records:\n${providers.map((p) => `• ${p}`).join("\n")}\n\nNext steps:\n1. Explore more matching providers on the Explore page.\n2. Contact the provider directly to confirm whether they currently have a learnership intake.\n3. Ask about requirements, application dates and supporting documents.\n\nImportant: accreditation does not guarantee funding or that a provider currently has an open learnership.`;
}

function buildMessageTemplates(matches) {
  const first = matches[0] || {};
  const qualification = first.qualificationTitle || "the relevant qualification";

  return {
    confident: {
      label: "Confident & direct",
      body: `Good day,

I found your institution listed in the QCTO SDP records for ${qualification}. I understand that accreditation does not guarantee a current intake, so I would like to confirm whether you have any learnership, training intake or upcoming application window for this programme.

Please share the entry requirements, application dates, documents needed and the steps I should follow to apply.

Kind regards`
    },
    warm: {
      label: "Warm & enthusiastic",
      body: `Good day,

I hope you are well. I am interested in ${qualification} and saw that your institution is linked to this programme in the QCTO SDP records. I would appreciate your guidance on whether there are any current or upcoming learnership opportunities.

Please advise on the requirements, application dates, documents needed and how I can apply.

Kind regards`
    },
    brief: {
      label: "Brief & punchy",
      body: `Good day,

Please confirm whether your institution currently has a learnership or training intake for ${qualification}.

Kindly share the requirements, application dates, documents needed and next steps to apply.

Kind regards`
    }
  };
}

function buildMessageTemplate(matches) {
  return buildMessageTemplates(matches).confident.body;
}

function uniqueCompact(values, max = 14) {
  const output = [];
  const seen = new Set();
  for (const value of values) {
    const clean = String(value || "").trim();
    const key = normalise(clean);
    if (!clean || !key || seen.has(key)) continue;
    seen.add(key);
    output.push(clean);
    if (output.length >= max) break;
  }
  return output;
}

function detectExactQualificationRequest(message, matches = []) {
  const q = normalise(message);
  const explicitQualificationWords = /\b(occupational certificate|national certificate|higher occupational certificate|advanced occupational diploma|national occupational certificate|occupational skills programme|occupational skills programmes|skills programme|n4|n5|n6|diploma)\b/i.test(message || "");
  if (!explicitQualificationWords) return "";

  const candidateTitles = uniqueCompact([
    ...matches.map((row) => row.qualificationTitle),
    ...loadProviders().map((row) => row.qualificationTitle)
  ], 400).sort((a, b) => b.length - a.length);

  for (const title of candidateTitles) {
    const key = normalise(title);
    if (key && q.includes(key)) return title;
  }

  const quoted = String(message || "").match(/["“”']([^"“”']{6,80})["“”']/);
  return quoted ? quoted[1].trim() : "";
}

function simplifyQualificationForSearch(title) {
  return String(title || "")
    .replace(/^\s*(occupational certificate|national certificate|higher occupational certificate|advanced occupational diploma|national occupational certificate|intermediate occupational certificate|occupational skills programmes?|national occupational certificate)\s*:?\s*/i, "")
    .trim();
}

function buildExploreKeywordsFromMatches(matches, intentKeywords = []) {
  const rowPhrases = [];
  for (const row of Array.isArray(matches) ? matches : []) {
    if (row.career) rowPhrases.push(row.career);
    const simplifiedQualification = simplifyQualificationForSearch(row.qualificationTitle);
    if (simplifiedQualification) rowPhrases.push(simplifiedQualification);
  }
  return uniqueCompact([...(intentKeywords || []), ...rowPhrases], 18);
}

function buildExploreFilters(matches, detectedProvince, intent = null, message = "", detectedCityTown = "") {
  const first = matches[0] || {};
  const currentIntent = intent || detectPrimaryIntent(`${first.career || ""} ${first.qualificationTitle || ""}`);
  const exactQualification = detectExactQualificationRequest(message, matches);
  const intentKeywords = getExploreKeywordsForIntent(currentIntent, message || `${first.career || ""} ${first.qualificationTitle || ""}`);
  const broadKeywords = exactQualification
    ? []
    : buildExploreKeywordsFromMatches(matches, intentKeywords);

  return {
    province: detectedProvince || "",
    cityTown: detectedCityTown || "",
    career: "",
    partner: "",
    status: "Active",
    searchTerm: "",
    searchScope: "careerQualification",
    qualificationPrefix: exactQualification || "",
    broadSearchKeywords: broadKeywords,
    intentKey: currentIntent.key && currentIntent.key !== "general" ? currentIntent.key : "",
    focusKey: currentIntent.key && currentIntent.key !== "general" ? (currentIntent.focusKey || "") : ""
  };
}

// ===========================================================================
// SAFETY: Post-process Gemma answer to strip any hallucinated providers/emails
// Added by Kiro review (review/kiro-fixes-preview branch)
// The model is instructed not to invent - this is a belt-and-braces guard.
// ===========================================================================
function sanitiseGemmaAnswer(rawAnswer, matches, detectedProvince, detectedCityTown) {
  const answer = String(rawAnswer || "").trim();
  if (!answer) return { answer, stripped: 0, warning: "" };

  const safeMatches = Array.isArray(matches) ? matches : [];
  const allowedProviderKeys = new Set(
    safeMatches.map((row) => normalise(row.providerName)).filter(Boolean)
  );
  const allowedEmails = new Set(
    safeMatches
      .flatMap((row) => String(row.email || "").split(/[,;\s]+/))
      .map((e) => e.trim().toLowerCase())
      .filter((e) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e))
  );
  const allowedPhones = new Set(
    safeMatches
      .map((row) => String(row.contact || "").replace(/[^\d+]/g, ""))
      .filter((p) => p.length >= 8)
  );

  let stripped = 0;
  let output = answer;

  // 1. Strip any email that isn't in the matches
  output = output.replace(/[a-zA-Z0-9._+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/g, (match) => {
    if (allowedEmails.has(match.toLowerCase())) return match;
    stripped++;
    return "[email removed - please verify via Explore]";
  });

  // 2. Strip any phone-like number that isn't in the matches
  output = output.replace(/(?:\+?27|0)\s?\d(?:[\s\-]?\d){7,10}/g, (match) => {
    const digits = match.replace(/[^\d+]/g, "");
    if (allowedPhones.has(digits)) return match;
    stripped++;
    return "[phone removed - please verify via Explore]";
  });

  // 3. Soft check: flag if answer mentions "provider:" or "call X at" patterns pointing
  //    at a provider name not in matches. We do not rewrite the whole answer because
  //    the model often paraphrases names - we only add a warning so the UI can display it.
  let warning = "";
  if (allowedProviderKeys.size > 0) {
    // Look for "Provider: XYZ" or "SDP: XYZ" style patterns
    const providerMentions = output.match(/(?:provider|sdp|institution)[:\s]+"?([A-Z][A-Za-z0-9 &.,'\-]{3,60})"?/gi) || [];
    const hallucinatedCount = providerMentions.filter((mention) => {
      const name = mention.replace(/^(?:provider|sdp|institution)[:\s]+"?/i, "").replace(/"$/, "").trim();
      return name && !allowedProviderKeys.has(normalise(name));
    }).length;
    if (hallucinatedCount > 0) {
      warning = "Some provider names in the answer could not be verified. Please use the Explore page for confirmed records.";
    }
  }

  // 4. Strip out province names the user did not mention if we detected a specific province
  //    (light-touch - only if the answer name-drops a different province as a recommendation)
  if (detectedProvince) {
    const otherProvinces = PROVINCES.filter((p) => p !== detectedProvince);
    for (const otherP of otherProvinces) {
      // Only flag if the other province is mentioned as a recommendation ("try X", "in X")
      const pattern = new RegExp(`\\b(?:try|look in|in)\\s+${otherP.replace(/[-[\]/{}()*+?.\\^$|]/g, "\\$&")}\\b`, "i");
      if (pattern.test(output) && !warning) {
        warning = `The assistant suggested pathways outside ${detectedProvince}. Use the Explore filter to confirm options near you.`;
      }
    }
  }

  return { answer: output, stripped, warning };
}

async function fetchWithTimeout(url, options, timeoutMs) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

async function callGemma(message, matches, detectedProvince, intent, detectedCityTown = "", hasLocalMatches = true) {
  const apiKey = process.env.GEMINI_API_KEY;
  const model = process.env.GEMMA_MODEL || DEFAULT_MODEL;
  const timeoutMs = clampNumber(process.env.GEMMA_TIMEOUT_MS, DEFAULT_GEMMA_TIMEOUT_MS, 3000, 8000);
  const maxOutputTokens = clampNumber(process.env.GEMMA_MAX_OUTPUT_TOKENS, DEFAULT_MAX_OUTPUT_TOKENS, 120, 450);

  if (!apiKey || !matches.length) {
    return { usedGemma: false, answer: buildFallbackAnswer(message, matches, detectedProvince, intent, detectedCityTown, hasLocalMatches), warning: "" };
  }

  const contextRecords = matches.slice(0, 5).map((row, index) => (
    `${index + 1}. ${row.providerName || "Provider not listed"}; ${row.province || ""}; ${row.cityTown || ""}; Career: ${row.career || ""}; Qualification: ${row.qualificationTitle || ""}; Partner: ${row.setaPartner || ""}; Status: ${row.status || ""}`
  )).join("\n");

  const prompt = `You are Gemma Learnership Assistant for a South African QCTO SDP platform.
Use only these records. Do not invent providers, contact details, SETAs, provinces or qualifications.
Keep the answer under 130 words.
If the user asks for a specific career, qualification or focus area, stay inside that focus. Only suggest multiple pathways when the user asks broadly or mentions several interests.
Always say accreditation does not guarantee funding or a current learnership intake.

User question: ${message}
Province: ${detectedProvince || "Not detected"}
Records:
${contextRecords}

Answer with: suggested path, matching qualifications/providers, and next steps.`;

  try {
    const response = await fetchWithTimeout(
      `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contents: [{ role: "user", parts: [{ text: prompt }] }], generationConfig: { temperature: 0.2, maxOutputTokens } })
      },
      timeoutMs
    );

    if (!response.ok) {
      const errorText = await response.text().catch(() => "");
      console.error("Gemma API error", response.status, errorText.slice(0, 600));
      return { usedGemma: false, answer: buildFallbackAnswer(message, matches, detectedProvince, intent, detectedCityTown, hasLocalMatches), warning: "" };
    }

    const data = await response.json().catch(() => null);
    const parts = data && data.candidates && data.candidates[0] && data.candidates[0].content && data.candidates[0].content.parts;
    const rawAnswer = Array.isArray(parts) ? parts.map((part) => part.text || "").join("\n").trim() : "";
    if (!rawAnswer) {
      return { usedGemma: false, answer: buildFallbackAnswer(message, matches, detectedProvince, intent, detectedCityTown, hasLocalMatches), warning: "" };
    }

    // Strip any hallucinated providers/emails/phones before returning to the client
    const cleaned = sanitiseGemmaAnswer(rawAnswer, matches, detectedProvince, detectedCityTown);
    if (cleaned.stripped > 0) {
      console.warn("Sanitised Gemma answer: stripped", cleaned.stripped, "fragment(s)");
    }
    return { usedGemma: true, answer: cleaned.answer, warning: cleaned.warning };
  } catch (error) {
    console.error("Gemma request failed", error);
    return { usedGemma: false, answer: buildFallbackAnswer(message, matches, detectedProvince, intent, detectedCityTown, hasLocalMatches), warning: "" };
  }
}

async function buildAssistantResponse(message, responseOptions = {}) {
  const providersForLocation = loadProviders();
  const initialLocation = detectLocation(message, providersForLocation);
  let detectedProvince = initialLocation.province;
  let detectedCityTown = initialLocation.cityTown;
  let keywords = tokenize(message).slice(0, 12);
  let matches = [];
  let detectedIntent = detectPrimaryIntent(message);

  try {
    const found = findRelevantRecords(message);
    detectedProvince = found.detectedProvince || detectedProvince;
    detectedCityTown = found.detectedCityTown || detectedCityTown;
    keywords = found.keywords || keywords;
    matches = Array.isArray(found.matches) ? found.matches : [];
    detectedIntent = found.intent || detectedIntent;
  } catch (error) {
    console.error("Local provider search failed", error);
  }

  const hasLocalMatches = matches.some((row) => (detectedCityTown && normalise(row.cityTown) === normalise(detectedCityTown)) || (detectedProvince && row.province === detectedProvince));
  const gemma = await callGemma(message, matches, detectedProvince, detectedIntent, detectedCityTown, hasLocalMatches);

  return jsonResponse(200, {
    answer: gemma.answer,
    usedGemma: Boolean(gemma.usedGemma),
    warning: gemma.warning || "",
    providerDataLoaded: loadProviders().length,
    detectedProvince,
    detectedCityTown,
    intentKey: detectedIntent.key,
    focusKey: detectedIntent.focusKey || "",
    keywords,
    matches: matches.slice(0, 6),
    messageTemplate: buildMessageTemplate(matches),
    messageTemplates: buildMessageTemplates(matches),
    exploreFilters: buildExploreFilters(matches, detectedProvince, detectedIntent, message, detectedCityTown)
  }, responseOptions);
}

exports.handler = async function handler(event) {
  const requestOrigin = (event && event.headers && (event.headers.origin || event.headers.Origin)) || "";
  const responseOptions = { requestOrigin };

  if (event.httpMethod === "OPTIONS") return jsonResponse(200, { ok: true }, responseOptions);
  if (event.httpMethod !== "POST") return jsonResponse(405, { error: "Method not allowed. Use POST." }, responseOptions);

  // Rate limit BEFORE JSON parsing so hammering the endpoint is cheap
  const clientIp = getClientIp(event);
  const rl = checkRateLimit(clientIp);
  const rateHeaders = {
    "X-RateLimit-Limit": String(RATE_LIMIT_MAX_REQUESTS),
    "X-RateLimit-Remaining": String(rl.remaining)
  };
  if (!rl.allowed) {
    return jsonResponse(429, {
      error: "Too many requests. Please wait a moment and try again.",
      retryAfterSec: rl.retryAfterSec
    }, { ...responseOptions, rateHeaders: { ...rateHeaders, "Retry-After": String(rl.retryAfterSec) } });
  }
  responseOptions.rateHeaders = rateHeaders;

  let body;
  try {
    body = JSON.parse(event.body || "{}");
  } catch (error) {
    return jsonResponse(400, { error: "Invalid JSON request body." }, responseOptions);
  }

  const message = String(body.message || body.question || body.prompt || "").trim();
  if (!message || message.length < 3) return jsonResponse(400, { error: "Please type a clear question first." }, responseOptions);
  if (message.length > 800) return jsonResponse(400, { error: "Please keep your question under 800 characters." }, responseOptions);

  try {
    return await buildAssistantResponse(message, responseOptions);
  } catch (error) {
    console.error("Assistant function error", error);
    const providersForLocation = loadProviders();
    const location = detectLocation(message, providersForLocation);
    const detectedProvince = location.province;
    const detectedCityTown = location.cityTown;
    const intent = detectPrimaryIntent(message);
    return jsonResponse(200, {
      answer: buildGeneralFallback(message, detectedProvince, detectedCityTown),
      usedGemma: false,
      warning: "",
      detectedProvince,
      detectedCityTown,
      keywords: tokenize(message).slice(0, 12),
      matches: [],
      messageTemplate: buildMessageTemplate([]),
      messageTemplates: buildMessageTemplates([]),
      exploreFilters: buildExploreFilters([], detectedProvince, intent, message, detectedCityTown)
    }, responseOptions);
  }
};
