// AI Agent core logic — calls Cloudflare Worker in prod, Agnes API directly in dev

import { PROFILE_EXTRACTION_PROMPT, DIAGNOSIS_PROMPT, APPEAL_PROMPT, SHORT_REPLY_PROMPT } from "./prompts";
import { cache } from "./store";
import { categoryComplianceData } from "../data/site";

// API proxy - frontend calls Cloudflare Worker (key hidden server-side)
// API key injected via Cloudflare Pages environment variable
// Dev mode: VITE_DIRECT_API=1 bypasses Worker and calls Agnes API directly
const AGNES_PROXY_URL = import.meta.env.VITE_WORKER_URL || "https://heguimao-api.senliri028.workers.dev/api/chat";
const AGNES_MODEL = import.meta.env.VITE_AGNES_MODEL || "agnes-2.0-flash";
const AGNES_API_KEY = import.meta.env.VITE_AGNES_API_KEY || "";
const USE_DIRECT_API = import.meta.env.VITE_DIRECT_API === "1";
// ============================================
// Product Feature Keyword Dictionary
// Optimized for accuracy and reduced redundancy
// ============================================

interface FeatureKeywordMap {
  [key: string]: { keywords: string[]; description: string };
}

export const FEATURE_KEYWORDS: FeatureKeywordMap = {
  has_battery: {
    keywords: [
      // Primary battery indicators
      "power bank", "portable charger", "battery", "battery-powered", "rechargeable",
      "lithium ion", "li-ion", "lithium polymer", "li-po", "lithium battery",
      "li-ion battery", "18650", "3.7v",
      // Devices that inherently contain batteries
      "drone", "drone camera", "quadcopter", "rc drone",
      "e-bike", "electric bike", "electric scooter", "hoverboard",
      "power tool", "cordless drill", "impact driver", "electric screwdriver",
      "electric toothbrush", "electric shaver", "foil shaver",
      "dash cam", "car recorder", "car DVR",
      "flashlight", "led flashlight", "headlamp", "portable light",
      "portable speaker", "bluetooth speaker", "mini speaker",
      "robot vacuum", "robot mop", "robot cleaner",
      // Charging accessories (may indicate battery-powered device)
      "wireless charger", "qi charger", "charging pad", "charging cable",
      "charging station", "battery charger", "battery pack",
      "usb hub", "usb adapter", "power adapter", "travel adapter",
    ],
    description: "Products with lithium/alkaline batteries or charging capability",
  },
  has_wireless: {
    keywords: [
      // RF / wireless comms
      "bluetooth", "bluetooth 5", "bluetooth 5.0", "bluetooth 5.3", "bt",
      "wifi", "wi-fi", "wireless", "802.11", "wireless n", "wireless ac", "wifi 6",
      "rf", "rfid", "rfid reader", "nfc", "near field",
      "zigbee", "thread", "z-wave", "thread",
      "gps", "gnss", "glonass", "galileo",
      "satellite", "satellite phone",
      "radio", "ham radio", "walkie talkie", "two-way radio",
      "fm transmitter", "fm modulator",
      "wireless mouse", "wireless keyboard", "wireless controller",
      "wireless camera", "wireless security", "wifi camera",
      // Smart features
      "smart", "smart home", "smart device", "iot", "iot device",
      "app control", "app-controlled", "remote control", "remote", "rc",
      "voice control", "alexa", "google assistant", "siri", "google home",
      "smart plug", "smart bulb", "smart switch", "smart lock",
      "smart speaker", "smart display",
      // Wireless audio/video
      "airplay", "airpod", "airpods pro", "airpods max",
      "wireless mic", "wireless microphone", "lavalier mic",
      "wireless headphones", "wireless earbuds", "wireless speaker",
      "streaming", "streaming device", "cast", "chromecast", "fire stick",
    ],
    description: "Products with bluetooth/WiFi/RF wireless communication",
  },
  is_children: {
    keywords: [
      // Direct child markers
      "baby", "babies", "infant", "newborn", "toddler", "child", "children", "kids", "kid",
      "preschool", "pre-school", "kindergarten",
      // Baby products
      "baby monitor", "baby carrier", "baby sling", "baby wrap", "baby carrier",
      "baby bottle", "feeding bottle", "nursing bottle", "sippy cup",
      "baby monitor", "baby thermometer", "baby scale", "baby bath", "baby tub",
      "baby swings", "baby bouncer", "high chair", "highchair",
      "baby wipe", "baby oil", "baby lotion", "baby powder", "baby shampoo",
      "diaper", "nappy", "diaper bag", "baby wipe",
      "pacifier", "teether", "nipple", "bib", "burp cloth",
      "stroller", "pushchair", "pram", "baby carriage", "jogger stroller",
      "car seat", "convertible car seat", "booster seat",
      "baby swing", "baby walker", "playpen", "pack n play",
      "crib", "cot", "toddler bed", "bed rail",
      "baby gates", "corner guard", "baby proof", "babyproof",
      // Toys
      "toy", "toys", "playset", "play set", "building block", "lego", "lego-like",
      "puzzle", "educational toy", "learning toy", "activity toy",
      "doll", "action figure", "stuffed animal", "plush toy", "teddy bear",
      "dollhouse", "play kitchen", "toy car", "toy truck", "rc car",
      "art set", "craft kit", "kid craft", "coloring book", "crayon",
      "science kit", "microscope for kids", "telescope for kids",
      "trampoline", "playground", "swing set", "slide", "sandbox",
      "bouncy house", "bounce house", "tunnel tent", "fort",
      "ride-on", "ride-on toy", "balance bike", "scooter", "tricycle",
      // Children-specific
      "kids watch", "children watch", "kid phone",
      "baby clothes", "kids clothing", "children clothing", "kids shoes", "toddler shoes",
      "kids backpack", "children backpack", "school bag",
      "child safety", "child lock", "child proof",
    ],
    description: "Products intended for children under 12 years old",
  },
  food_contact: {
    keywords: [
      // Tableware
      "plate", "bowl", "cup", "mug", "drinking glass", "wine glass", "champagne flute",
      "tray", "serving dish", "platter", "bento", "lunch box", "tiffin",
      "cutlery", "utensil", "fork", "knife", "spoon", "chopstick",
      "straw", "metal straw", "silicone straw", "paper straw", "stainless steel straw",
      "sippy cup", "kids cup", "training cup",
      // Kitchen tools
      "spatula", "ladle", "tongs", "whisk", "peeler", "grater", "can opener",
      "cutting board", "chopping board", "rolling pin", "mixing bowl",
      "colander", "strainer", "sieve", "mesh strainer",
      "kitchen scale", "kitchen timer", "measuring cup", "measuring spoon",
      "baking sheet", "muffin tin", "loaf pan", "pie dish", "cake pan",
      "cooling rack", "baking mat", "silicone mat", "parchment paper",
      // Appliances for food
      "blender", "juicer", "food processor", "mixer", "stand mixer", "hand mixer",
      "coffee maker", "espresso machine", "capsule machine", "pod machine",
      "toaster", "toaster oven", "air fryer", "deep fryer", "hot air fryer",
      "rice cooker", "instant pot", "pressure cooker", "slow cooker", "crockpot",
      "microwave", "oven", "convection oven", "induction cooker",
      "water dispenser", "water purifier", "water filter",
      "ice maker", "ice cube tray", "granite ice",
      "kettle", "electric kettle", "thermos", "vacuum flask", "travel mug",
      "thermos bottle", "vacuum bottle",
      // Food storage
      "food container", "food storage", "tupperware", "meal prep container",
      "food wrap", "cling wrap", "plastic wrap", "silicone lid", "silicone cover",
      "food jar", "glass jar", "mason jar",
      // Food-grade materials
      "food grade", "food safe", "bpa free", "bpa-free", "lead free",
      "silicone", "silicone spatula", "silicone mold", "silicone baking",
      "stainless steel", "stainless steel kitchen",
      // Baby feeding (overlaps with is_children)
      "breast pump", "nursing pump", "bottle warmer", "bottle sterilizer",
      "formula dispenser", "snack container",
      // Commercial food
      "deli", "delicatessen", "bakery", "patisserie", "pastry",
      "catering", "catering supply", "commercial kitchen",
    ],
    description: "Products that directly contact food or beverages",
  },
  wearable: {
    keywords: [
      // Jewelry & accessories
      "necklace", "chain", "pendant", "choker", "locket",
      "bracelet", "bangle", "charm bracelet", "anklet",
      "earring", "studs", "hoop", "drop earring",
      "ring", "signet ring", "cocktail ring", "promise ring",
      "brooch", "pin", "cufflink", "tie clip",
      "watch", "wristwatch", "digital watch", "analog watch",
      "cuff",
      "sunglasses", "eyeglasses", "spectacles", "reading glasses", "blue light glasses",
      "glasses case", "eyewear",
      // Footwear & clothing accessories
      "shoes", "sneakers", "boots", "heels", "loafers", "flats", "sandals",
      "slippers", "clogs", "moccasin", "work boot", "hiking boot",
      "belt", "leather belt", "fabric belt",
      "glove", "gloves", "mittens",
      "hat", "cap", "beanie", "fedora", "baseball cap", "sun hat", "winter hat",
      "scarf", "shawl", "muffler",
      // Wearable tech
      "smart ring", "smart glasses", "smart jewelry",
      "bluetooth earphone", "bone conduction", "bone conduction headphone",
      // Medical wearable
      "hearing aid", "insulin pump", "cpap mask", "cpap",
      "compression stocking", "compression sock",
      "knee brace", "ankle brace", "wrist brace", "elbow brace",
      "back brace", "lumbar support", "waist trainer", "shapewear",
    ],
    description: "Products worn on or around the body",
  },
  medical: {
    keywords: [
      // Diagnostics
      "blood pressure monitor", "bp monitor", "sphygmomanometer",
      "thermometer", "digital thermometer", "infrared thermometer", "forehead thermometer",
      "glucose meter", "blood glucose monitor", "hba1c test",
      "pulse oximeter", "oxygen saturation monitor", "spo2",
      "ecg", "ecg monitor", "eCG", "heartbeat monitor",
      "thermometer gun", "ear thermometer", "temp gun",
      "urine test strip", "pregnancy test", "ovulation test", "drug test kit",
      "cholesterol test", "lipid test", "ketone test",
      // Therapeutic
      "massager", "massage gun", "percussion massager", "shock wave massager",
      "tens unit", "tens machine", "tens device", "ems massager",
      "physical therapy", "physiotherapy", "rehabilitation",
      "cpap machine", "biLevel", "ventilator", "oxygen concentrator",
      "nebulizer", "inhaler", "breathing device",
      "heat pad", "heating pad", "hot water bottle", "ice pack",
      "tENS", "ultrasound therapy", "laser therapy", "light therapy", "red light therapy",
      // Mobility & equipment
      "wheelchair", "walker", "cane", "walking stick", "crutch", "crutches",
      "hospital bed", "medical bed", "adjustable bed",
      "commode", "shower chair", "grab bar", "ramp",
      "syringe", "needle", "surgical needle", "hypodermic",
      "stethoscope", "otoscope", "ophthalmoscope", "dental chair",
      "x-ray", "imaging", "ultrasound machine", "doppler",
      // Contraception & personal health
      "condom", "diaphragm", "copper iud",
      // Supplements & health
      "supplement", "vitamin", "protein powder", "prebiotic", "probiotic",
      "protein bar", "meal replacement", "weight loss", "fat burner",
      "collagen", "omega 3", "fish oil", "glucosamine",
      // OTC / personal care health
      "first aid kit", "bandage", "bandage roll", "gauze", "antiseptic",
      "eye drops", "ear drops", "nasal spray",
    ],
    description: "Medical devices, diagnostics, therapy, or health products",
  },
  electrical: {
    keywords: [
      // Lighting
      "led strip", "led light", "led bulb", "led panel", "led tape",
      "desk lamp", "table lamp", "floor lamp", "ceiling light", "pendant light",
      "spotlight", "track light", "wall sconce", "chandelier", "dimmable light",
      "solar light", "garden light", "path light", "string light",
      // Power accessories
      "power strip", "surge protector", "extension cord", "plug adapter",
      "usb charger", "usb adapter", "wall charger", "car charger", "car adapter",
      "power bank", "portable battery", "portable power station",
      // Home appliances
      "fan", "desk fan", "tower fan", "box fan", "oscillating fan",
      "air conditioner", "ac unit", "portable ac", "window ac",
      "heater", "space heater", "oil heater", "ceramic heater", "infrared heater",
      "humidifier", "cool mist", "warm mist", "evaporative cooler",
      "air purifier", "hepa filter", "dust remover",
      "vacuum cleaner", "stick vacuum", "canister vacuum", "wet dry vacuum",
      "robot vacuum", "robot mop", "steam mop", "carpet cleaner",
      "iron", "garment steamer", "clothes steamer",
      // Kitchen appliances
      "toaster", "blender", "juicer", "food processor", "mixer",
      "rice cooker", "instant pot", "pressure cooker", "slow cooker",
      "coffee maker", "espresso machine", "tea maker", "hot water dispenser",
      "dishwasher", "garbage disposal", "water heater", "water boiler",
      "microwave", "oven", "air fryer", "deep fryer",
      // Computers & phones
      "computer", "laptop", "desktop", "all-in-one", "mini pc",
      "tablet", "ipad", "android tablet",
      "smartphone", "cell phone", "mobile phone",
      "camera", "dslr", "mirrorless", "action camera", "webcam", "dash cam",
      // Office electronics
      "printer", "laser printer", "inkjet", "3d printer", "scanner",
      "projector", "video projector", "dvd player", "blu-ray player",
      // Networking
      "router", "wifi router", "mesh wifi", "repeater", "range extender",
      "switch", "network switch", "nas", "network storage",
      "hub", "usb hub", "display port", "hdmi cable", "vga cable",
      // Garden & outdoor electrical
      "lawn mower", "robot lawn mower", "leaf blower", "trimmer", "weed eater",
      "pressure washer", "car wash machine",
      "fence light", "outdoor light", "motion sensor light",
    ],
    description: "Products requiring electricity or power supply",
  },
  contains_chemicals: {
    keywords: [
      // Cosmetics & skincare
      "foundation", "concealer", "powder", "blush", "highlighter", "bronzer",
      "setting spray", "primer", "tint", "lip gloss", "lip balm",
      "eyeshadow", "mascara", "eyeliner", "eyebrow pencil", "eyebrow gel",
      "nail polish", "nail art", "nail gel", "nail dryer", "uv nail lamp",
      "hair dye", "hair color", "hair bleach", "hair lightener",
      // Hair care
      "shampoo", "conditioner", "hair mask", "hair oil", "hair serum",
      "hair spray", "hair gel", "hair mousse", "hair wax", "hair pomade",
      "dry shampoo", "leave-in conditioner", "curl cream", "detangler",
      // Body care
      "body wash", "body lotion", "body butter", "body oil",
      "hand cream", "hand sanitizer", "hand wash",
      "face wash", "face cleanser", "facial toner", "facial essence",
      "face cream", "night cream", "day cream", "anti-wrinkle cream",
      "eye cream", "serum", "face mask", "sheet mask", "clay mask",
      "peel", "exfoliator", "scrub", "body scrub", "face scrub",
      "deodorant", "antiperspirant", "body powder", "body spray",
      "perfume", "cologne", "eau de parfum", "eau de toilette", "fragrance",
      // Cleaning & household chemicals
      "disinfectant", "sanitizer", "bleach", "detergent", "laundry detergent",
      "dish soap", "dishwasher detergent", "surface cleaner", "glass cleaner",
      "floor cleaner", "toilet cleaner", "oven cleaner", "grill cleaner",
      "drain cleaner", "mold remover", "rust remover", "stain remover",
      "air freshener", "room spray", "candle", "reed diffuser",
      // Garden & outdoor chemicals
      "pesticide", "herbicide", "fertilizer", "plant food", "plant nutrient",
      "insect repellent", "mosquito repellent", "bug spray", "fly spray",
      "ant killer", "roach killer", "termite treatment", "mold killer",
      // Aromatherapy & essential oils
      "essential oil", "essential oils set", "diffuser", "aromatherapy",
      "scented candle", "incense", "incense stick", "sachet",
      // Personal protection chemicals
      "sunscreen", "sun cream", "sunblock", "tanning oil", "after sun lotion",
      "nail polish remover", "acetone", "nail polish remover",
      "eyelash glue", "nail glue", "adhesive", "superglue",
      // Paints & coatings
      "paint", "acrylic paint", "oil paint", "watercolor", "spray paint",
      "varnish", "stain", "sealant", "primer paint", "wood stain",
      "epoxy resin", "resin", "polyester resin",
      // Automotive chemicals
      "car wax", "car polish", "car cleaner", "tire shine", "windshield washer fluid",
      "antifreeze", "coolant", "brake fluid", "transmission fluid",
      // Pet chemicals
      "pet shampoo", "pet flea treatment", "pet conditioner",
      "pet dental care", "pet probiotic", "pet vitamin",
    ],
    description: "Products containing chemical substances (cosmetics, cleaners, pesticides, etc.)",
  },
  contains_magnets: {
    keywords: [
      "magnet", "magnetic", "magnets", "rare earth magnet", "neodymium",
      "mag.safe", "magsafe", "mag safe",
      "magnetic mount", "magnetic phone holder", "magnetic car mount",
      "magnetic lid", "magnetic lunch box", "magnetic tupperware",
      "magnetic seal", "magnetic door catch", "magnetic curtain",
      "magnetic bracelet", "magnetic therapy", "magnetic health",
      "magnetic toy", "magnetic toy", "magnetic builder",
      "magnetic knife holder", "magnetic spice rack", "magnetic board",
      "magnetic strip", "magnetic strip organizer",
      "magnetic cable", "magnetic charging cable", "magnetic charger",
      "magnetic clasp", "magnetic clasp purse",
      "magnetic speaker", "magnetic subwoofer",
      "maglock", "magnetic lock", "electric strike",
      "magnetic sensor", "reed switch", "magnetic reed switch",
      "compass", "magnetic compass",
    ],
    description: "Products containing magnets or magnetic components",
  },
  precision: {
    keywords: [
      "precision", "precision instrument", "measuring", "measurement",
      "caliper", "digital caliper", "vernier caliper",
      "micrometer", "laser measure", "laser distance meter", "laser ruler",
      "spectrometer", "microscope", "telescope", "binocular",
      "level", "laser level", "spirit level", "bubble level",
      "thermometer", "multimeter", "voltage tester", "amp meter",
      "scales", "scale", "balance", "jewelry scale", "pocket scale",
      "hour meter", "tachometer", "compass", "gyroscope",
      "anemometer", "weather station", "hygrometer", "lux meter",
      "sound level meter", "decibel meter", "noise meter",
      "uv meter", "uv index meter", "radiometer",
      "gps", "gps tracker", "gps receiver",
      "camera", "dslr", "mirrorless camera", "cctv camera", "security camera",
      "lens", "camera lens", "telephoto lens", "wide angle lens",
      "watch", "chronometer", "stopwatch",
      "sewing machine", "embroidery machine",
    ],
    description: "Precision instruments and optical/measurement devices",
  },
  has_flammable: {
    keywords: [
      // Aerosols & sprays
      "spray", "aerosol", "spray paint", "spray adhesive", "spray cleaner",
      "hairspray", "body spray", "deodorant spray", "mousse", "dry shampoo spray",
      "air freshener spray", "insecticide spray", "pest control spray",
      "spray gun", "paint sprayer", "spray can",
      // Flammable liquids
      "alcohol", "ethanol", "isopropyl alcohol", "rubbing alcohol", "hand sanitizer",
      "perfume", "cologne", "fragrance", "essential oil",
      "nail polish", "nail polish remover", "acetone", "paint thinner",
      "varnish", "stain", "turpentine", "mineral spirits",
      "glue", "adhesive", "super glue", "epoxy", "resin",
      // Candles & open flame
      "candle", "scented candle", "tea light", "pillar candle", "votive candle",
      "incense", "incense stick", "incense holder",
      "fireplace", "fire pit", "fire bowl", "bioethanol fireplace",
      "lighter", "windproof lighter", "butane lighter",
      "torch", "flame torch", "mini torch", "candy torch",
      // Compressed gases
      "co2 cartridge", "co2 cylinder", "air can", "dust off",
      "propane", "butane", "compressed air", "compressed gas",
      "fire extinguisher", "fire suppression",
      // Other flammable
      "flammable", "flammable liquid", "flashpoint", "fuel", "gasoline",
      "biofuel", "ethanol fuel", "alcohol fuel", "camping fuel",
      "hair dye", "bleach", "peroxide",
      // Paint & coating
      "oil paint", "enamel", "lacquer", "stain", "sealer",
    ],
    description: "Flammable, explosive, or compressed gas products",
  },
};

// Product type → default category mapping
export const PRODUCT_TYPE_CATEGORY_MAP: Record<string, string[]> = {
  electronics: ["electronics", "electronic", "electrical", "gadget", "device", "tech", "digital",
    "phone", "tablet", "laptop", "computer", "camera", "speaker", "headphone", "watch",
    "charger", "cable", "adapter", "hub", "router", "printer", "scanner", "monitor", "display",
    "tv", "television", "smart home", "iot", "appliance",
    "drone", "action camera", "dash cam", "webcam"],
  toys: ["toy", "toys", "playset", "puzzle", "building block", "doll", "plush", "stuffed animal",
    "rc car", "model kit", "board game", "card game", "outdoor play", "trampoline",
    "lego", "lego-compatible"],
  baby: ["baby", "infant", "toddler", "newborn", "kids", "children", "preschool",
    "stroller", "car seat", "high chair", "bottle", "diaper", "crib", "playpen",
    "baby monitor", "baby carrier", "pacifier", "teether", "bib", "baby wipe"],
  clothing: ["clothing", "clothes", "apparel", "fashion", "garment", "textile", "fabric",
    "shoes", "sneakers", "boots", "hat", "cap", "gloves", "scarf", "jewelry", "accessories"],
  beauty: ["beauty", "cosmetic", "cosmetics", "skincare", "makeup", "fragrance",
    "perfume", "hair care", "nail", "nail polish", "body care", "sunscreen",
    "shampoo", "conditioner", "hair dye", "facial", "cleanser", "toner", "serum", "cream", "lotion"],
  home: ["home", "household", "furniture", "decor", "kitchen", "bedroom", "bathroom",
    "garden", "outdoor", "lighting", "lamp", "curtain", "rug", "cushion", "pillow",
    "cookware", "bakeware", "storage", "organizer"],
  sports: ["sports", "fitness", "workout", "gym", "exercise", "outdoor", "camping", "hiking",
    "running", "jogging", "yoga", "pilates", "cycling", "swimming", "fishing",
    "golf", "tennis", "basketball", "football", "soccer", "baseball"],
  auto: ["auto", "automotive", "car", "vehicle", "motorcycle", "bike", "truck",
    "car accessory", "car part", "car care", "dashboard", "steering wheel", "seat cover"],
  office: ["office", "stationery", "writing", "paper", "desk", "chair", "organizer",
    "filing", "printer", "notebook", "pen", "pencil", "marker", "stapler", "tape"],
  pet: ["pet", "pet supplies", "dog", "cat", "fish", "bird", "hamster", "pet food",
    "pet toy", "pet bed", "pet collar", "pet leash", "pet shampoo", "aquarium", "fish tank"],
  food: ["food", "snack", "beverage", "drink", "supplement", "vitamin", "protein",
    "organic", "grocery", "health food", "diet", "tea", "coffee", "juice"],
  health: ["health", "wellness", "medical", "pharma", "pharmaceutical",
    "first aid", "supplement", "medical device", "diagnostic", "therapeutic"],
};

// ============================================
// Types
// ============================================

export interface ProductProfile {
  product_type: string;
  category: string;
  has_battery: boolean | null;
  battery_capacity: number | null;
  has_wireless: boolean | null;
  is_children: boolean | null;
  food_contact: boolean | null;
  wearable: boolean | null;
  medical: boolean | null;
  electrical: boolean | null;
  contains_chemicals: boolean | null;
  contains_magnets: boolean | null;
  precision: boolean | null;
  has_flammable: boolean | null;
  [key: string]: unknown;
}

export interface ProfileExtractionResult {
  profile: ProductProfile;
  market: string | null;
  informationSufficient: boolean;
  questions: string[];
  confidence: "high" | "medium" | "low";
}

export interface DiagnosisResult {
  summary: string;
  recommendations: Array<{
    name: string;
    required: boolean;
    desc: string;
    severity: "high" | "medium" | "low";
    reason: string;
    estimatedCost: string;
    estimatedTime: string;
    action: string;
    needsThirdParty: boolean;
    confidence: "high" | "medium" | "low";
    priorityLabel: string;
  }>;
  riskLevel: "high" | "medium" | "low";
  warnings: string[];
  [key: string]: unknown;
}

export interface AppealResult {
  rootCause: string;
  correctiveActions: string[];
  preventiveMeasures: string[];
  poaTemplate: string;
  checklist: string[];
  tips: string;
}

export interface ShortReplyResult {
  action: "diagnose" | "ask";
  questions?: string[];
  profile?: Partial<ProductProfile>;
  summary?: string;
}

// ============================================
// Core: call AI
// ============================================

async function callAI<T>(endpoint: string, params: Record<string, unknown>): Promise<T> {
  const MODEL = import.meta.env.VITE_AGNES_MODEL || 'agnes-2.0-flash';
  let reply: string;

  if (USE_DIRECT_API) {
    // Direct mode: call Agnes API via Vite proxy (/v1 -> apihub.agnes-ai.com)
    console.log('[Agent] Using direct API mode (Worker bypass)');
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (AGNES_API_KEY) {
      headers['Authorization'] = `Bearer ${AGNES_API_KEY}`;
    }
    const response = await fetch('/v1/chat/completions', {
      method: 'POST',
      headers,
      body: JSON.stringify({
        model: MODEL,
        messages: [
          { role: 'system', content: params.prompt as string || '' },
          { role: 'user', content: (params.message as string) || '' },
        ],
        temperature: 0.3,
      }),
      signal: AbortSignal.timeout(30000),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.warn('[Agent] Direct API call failed:', response.status, errorText);
      throw new Error('AI service temporarily unavailable');
    }

    const data = await response.json();
    reply = data.choices?.[0]?.message?.content || '';
  } else {
    // Worker proxy mode
    console.log('[Agent] Calling API via Worker proxy:', AGNES_PROXY_URL);
    const response = await fetch(AGNES_PROXY_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ action: endpoint, prompt: params.prompt as string || '', message: (params.message as string) || '', temperature: 0.3 }),
      signal: AbortSignal.timeout(30000),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.warn('[Agent] Worker proxy call failed:', response.status, errorText);
      throw new Error('AI service temporarily unavailable');
    }

    const data = await response.json();
    reply = data.reply || data.choices?.[0]?.message?.content || '';
  }

  return parseAIResponse<T>(reply);
}

function parseAIResponse<T>(text: string): T {
  const cleaned = text
    .replace(/```json\s*/gi, "")
    .replace(/```\s*/g, "")
    .trim();

  // Try to parse as-is first (might be pure JSON)
  try {
    const parsed = JSON.parse(cleaned);
    return sanitizeNested(parsed) as T;
  } catch {
    // Not pure JSON, try to extract from text
  }

  const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error("AI returned unexpected format");
  }

  const parsed = JSON.parse(jsonMatch[0]);
  
  // Normalize AI output to expected DiagnosisResult shape.
  // The AI may return various formats; we handle them all here.
  function normalizeDiagnosis(obj: any): any {
    if (!obj || typeof obj !== 'object') return obj;
    
    // Case 1: Already in the expected flat format
    if (obj.summary !== undefined && obj.recommendations !== undefined) {
      return sanitizeNested(obj);
    }
    
    // Case 2: Single-key wrapper (e.g. { compliance_diagnosis: {...} })
    const keys = Object.keys(obj);
    if (keys.length === 1) {
      const inner = obj[keys[0]];
      if (inner && typeof inner === 'object') {
        return normalizeDiagnosis(inner);
      }
    }
    
    // Case 3: Multi-key wrapper with structured sections
    // e.g. { product_category, target_market, critical_regulations: [...], ... }
    if (obj.critical_regulations || obj.sections || obj.regulations) {
      const regs = obj.critical_regulations || obj.sections || obj.regulations || [];
      return {
        summary: obj.summary_recommendation || obj.summary || obj.disclaimer || '',
        recommendations: regs.map((r: any) => {
          const cat = r.category || r.title || '';
          const riskStr = (r.risk_level || r.severity || 'medium').toString().toLowerCase();
          return {
            name: cat.split('(')[0]?.trim() || cat || 'Compliance Requirement',
            required: riskStr === 'high' || r.status === 'MANDATORY' || r.requirement?.includes('Mandatory'),
            desc: r.diagnosis || r.requirement || r.details || cat,
            severity: riskStr === 'high' ? 'high' : riskStr === 'low' ? 'low' : 'medium',
            reason: r.details || r.diagnosis || cat,
            estimatedCost: 'TBD',
            estimatedTime: 'TBD',
            action: (r.action_items || r.requirements || []).join('; '),
            needsThirdParty: true,
            confidence: 'high',
            priorityLabel: r.status === 'MANDATORY' ? '🔴 Mandatory' : riskStr === 'high' ? '🔴 Mandatory' : '🟡 Recommended',
          };
        }),
        riskLevel: regs.some((r: any) => (r.risk_level || '').toString().toLowerCase() === 'high') ? 'high' : 'medium',
        warnings: [],
      };
    }
    
    // Case 4: Generic multi-key object — try to extract recommendations from any array fields
    const arrayFields = keys.filter(k => Array.isArray(obj[k]));
    if (arrayFields.length > 0) {
      const firstArray = obj[arrayFields[0]];
      if (firstArray.length > 0 && typeof firstArray[0] === 'object') {
        return {
          summary: obj.summary_recommendation || obj.summary || obj.overview || '',
          recommendations: firstArray.map((r: any) => {
            const cat = r.category || r.title || r.name || '';
            const riskStr = (r.risk_level || r.severity || 'medium').toString().toLowerCase();
            return {
              name: cat.split('(')[0]?.trim() || cat || arrayFields[0],
              required: riskStr === 'high' || r.status === 'MANDATORY',
              desc: r.diagnosis || r.requirement || r.details || cat,
              severity: riskStr === 'high' ? 'high' : riskStr === 'low' ? 'low' : 'medium',
              reason: r.details || r.diagnosis || '',
              estimatedCost: 'TBD',
              estimatedTime: 'TBD',
              action: (r.action_items || r.requirements || []).join('; '),
              needsThirdParty: true,
              confidence: 'high',
              priorityLabel: '🟡 Recommended',
            };
          }),
          riskLevel: firstArray.some((r: any) => (r.risk_level || '').toString().toLowerCase() === 'high') ? 'high' : 'medium',
          warnings: [],
        };
      }
    }
    
    // Fallback: return sanitized as-is
    return sanitizeNested(parsed);
  }
  
  // Helper: deep-sanitize an object (remove non-serializable values)
  function sanitizeNested(obj: any): any {
    if (obj === null || obj === undefined) return obj;
    if (typeof obj !== 'object') return obj;
    if (Array.isArray(obj)) return obj.map(sanitizeNested);
    const result: any = {};
    for (const [key, value] of Object.entries(obj)) {
      if (typeof value === 'object' && value !== null) {
        result[key] = sanitizeNested(value);
      } else {
        result[key] = value;
      }
    }
    return result;
  }
  
  // Final safety check: ensure recommendations exists
  function ensureRecommendations(obj: any): any {
    if (!obj || typeof obj !== 'object') return obj;
    if (Array.isArray(obj)) return obj.map(ensureRecommendations);
    
    const result = { ...obj };
    if (result.recommendations === undefined) {
      // Try to find any array that looks like recommendations
      for (const [key, value] of Object.entries(result)) {
        if (Array.isArray(value) && value.length > 0 && typeof value[0] === 'object') {
          // Check if any item in the array has typical recommendation fields
          const sample = value[0];
          if (sample.name || sample.category || sample.title || sample.severity || sample.required) {
            result.recommendations = value;
            delete result[key];
            break;
          }
        }
      }
      // If still no recommendations, provide a safe default
      if (result.recommendations === undefined) {
        result.recommendations = [];
      }
    }
    return result;
  }
  
  return ensureRecommendations(normalizeDiagnosis(parsed)) as T;
}

// ============================================
// Public API
// ============================================

export async function extractProductProfile(userMessage: string): Promise<ProfileExtractionResult> {
  return callAI<ProfileExtractionResult>(
    "extract-profile",
    { prompt: PROFILE_EXTRACTION_PROMPT.replace("{userMessage}", userMessage), message: userMessage }
  );
}

export function inferFeaturesFromKeywords(description: string): Partial<ProductProfile> {
  const result: Partial<ProductProfile> = {};
  const lower = description.toLowerCase().trim();

  for (const [feature, map] of Object.entries(FEATURE_KEYWORDS)) {
    const matches: string[] = [];
    for (const kw of map.keywords) {
      if (lower.includes(kw.toLowerCase())) {
        matches.push(kw);
      }
    }
    (result as Record<string, unknown>)[feature] = matches.length > 0;
    if (matches.length > 0) {
      (result as Record<string, unknown>)[`${feature}_matches`] = matches.slice(0, 5);
    }
  }

  // SMART INFERENCES — Common sense rules for features that are unlikely
  // These override keyword detection to reduce false positives
  const smartInferences: Record<string, (desc: string) => boolean | null> = {
    has_battery: (desc) => {
      const d = desc.toLowerCase();
      // Phone case, laptop sleeve, keyboard cover → no battery
      if (/phone case|laptop sleeve|keyboard cover|screen protector|case for/i.test(d)) return false;
      return null; // Let keyword detection handle it
    },
    is_children: (desc) => {
      const d = desc.toLowerCase();
      // Adult products explicitly exclude children
      if (/adult|grown-up|mature/i.test(d)) return false;
      // Toys, kids, baby → definitely children
      if (/toy|kids?|children|baby|infant|toddler|preschool/i.test(d)) return true;
      return null;
    },
    food_contact: (desc) => {
      const d = desc.toLowerCase();
      // Tableware, kitchen tools → food contact
      if (/plate|bowl|cup|mug|cutlery|spatula|ladle|blender|food container|bento|lunch box/i.test(d)) return true;
      // Electronics, clothing → no food contact
      if (/phone|laptop|headphone|shirt|dress|shoe|bag|backpack/i.test(d)) return false;
      return null;
    },
    wearable: (desc) => {
      const d = desc.toLowerCase();
      // Jewelry, watches, sunglasses, headphones → wearable
      if (/necklace|bracelet|earring|ring|watch|sunglasses|eyeglass|belt|glove|hat|scarf|headphone|earbud|tws|wireless earbuds/i.test(d)) return true;
      return null;
    },
    medical: (desc) => {
      const d = desc.toLowerCase();
      // Clearly medical
      if (/blood pressure|thermometer|glucose|oximeter|ecg|massager|tens|wheelchair|walker|cane/i.test(d)) return true;
      // Supplements, vitamins → health but not medical device
      if (/supplement|vitamin|protein powder|gummy|capsule/i.test(d)) return false;
      return null;
    },
    contains_chemicals: (desc) => {
      const d = desc.toLowerCase();
      // Cosmetics, skincare, hair care → chemicals
      if (/foundation|concealer|mascara|shampoo|conditioner|body wash|face cream|serum|perfume|fragrance/i.test(d)) return true;
      // Electronics, furniture → no chemicals
      if (/charger|cable|phone|laptop|desk|chair|shelf|table/i.test(d)) return false;
      return null;
    },
    has_flammable: (desc) => {
      const d = desc.toLowerCase();
      // Sprays, candles, lighters → flammable
      if (/spray|aerosol|candle|lighter|torch|alcohol|perfume|nail polish remover/i.test(d)) return true;
      return null;
    },
  };

  // Apply smart inferences
  for (const [feature, inferFn] of Object.entries(smartInferences)) {
    const inferred = inferFn(lower);
    if (inferred !== null) {
      (result as Record<string, unknown>)[feature] = inferred;
      if (inferred) {
        (result as Record<string, unknown>)[`${feature}_inferred`] = `Smart inference: ${feature}`;
      }
    }
  }

  return result;
}

export function inferCategory(productType: string): string {
  const lower = productType.toLowerCase();
  for (const [category, keywords] of Object.entries(PRODUCT_TYPE_CATEGORY_MAP)) {
    if (keywords.some(kw => lower.includes(kw.toLowerCase()))) {
      return category;
    }
  }
  return "electronics";
}

export async function generateDiagnosis(
  profile: ProductProfile,
  market: string,
  category?: string
): Promise<DiagnosisResult> {
  const keywordFeatures = inferFeaturesFromKeywords(profile.product_type);
  const inferredCategory = inferCategory(profile.product_type);

  const mergedProfile: ProductProfile = {
    ...profile,
    category: inferredCategory,
    has_battery: profile.has_battery ?? (keywordFeatures.has_battery as boolean),
    has_wireless: profile.has_wireless ?? (keywordFeatures.has_wireless as boolean),
    is_children: profile.is_children ?? (keywordFeatures.is_children as boolean),
    food_contact: profile.food_contact ?? (keywordFeatures.food_contact as boolean),
    wearable: profile.wearable ?? (keywordFeatures.wearable as boolean),
    medical: profile.medical ?? (keywordFeatures.medical as boolean),
    electrical: profile.electrical ?? (keywordFeatures.electrical as boolean),
    contains_chemicals: profile.contains_chemicals ?? (keywordFeatures.contains_chemicals as boolean),
    contains_magnets: profile.contains_magnets ?? (keywordFeatures.contains_magnets as boolean),
    precision: profile.precision ?? (keywordFeatures.precision as boolean),
    has_flammable: profile.has_flammable ?? (keywordFeatures.has_flammable as boolean),
  };

  // Build feature list for prompt
  const featureList: string[] = [];
  featureList.push(`Product type: ${mergedProfile.product_type}`);
  featureList.push(`Category: ${mergedProfile.category}`);

  const featureLabels: Record<string, string> = {
    has_battery: "Battery", has_wireless: "Wireless",
    is_children: "Children's product", food_contact: "Food contact",
    wearable: "Wearable", medical: "Medical device",
    electrical: "Electrical", contains_chemicals: "Contains chemicals",
    contains_magnets: "Contains magnets", precision: "Precision instrument",
    has_flammable: "Flammable/gas",
  };

  for (const [key, value] of Object.entries(mergedProfile)) {
    if (value === true && featureLabels[key]) {
      featureList.push(featureLabels[key]);
    }
  }

  const marketName = (() => {
    const m = market.toLowerCase();
    const map: Record<string, string> = {
      us: "US", eu: "EU", uk: "UK", jp: "Japan", ca: "Canada", au: "Australia",
      sg: "Singapore", th: "Thailand", vn: "Vietnam", id: "Indonesia", my: "Malaysia",
      ph: "Philippines", sa: "Saudi Arabia", ae: "UAE", kr: "South Korea", in: "India",
      br: "Brazil", mx: "Mexico", tr: "Turkey", nz: "New Zealand", za: "South Africa",
    };
    return map[m] || "Australia";
  })();

  return callAI<DiagnosisResult>(
    "diagnose",
    {
      prompt: DIAGNOSIS_PROMPT
        .replace("{productType}", mergedProfile.product_type)
        .replace("{productFeatures}", featureList.join(", "))
        .replace("{market}", marketName)
        .replace("{category}", category || mergedProfile.category),
      message: `Generate a detailed compliance diagnosis for the following product:

Product type: ${mergedProfile.product_type}
Category: ${mergedProfile.category}
Detected features: ${featureList.join(", ")}
Target market: ${marketName}

Key risk factors to consider:
- If battery: UN38.3, MSDS, IATA transport rules
- If children's product: CPSIA/CPC (US), EN71/CE-UKCA (EU), PSE/JIS (Japan)
- If food contact: FDA 21 CFR (US), EU 10/2011 (EU), food hygiene standards
- If medical: FDA Class (US), EU MDR (EU), PMDA (Japan)
- If magnetic: 15 CFR 1309 magnet strength test
- If flammable: DOT transport certification, IATA packing instructions
- If wireless/radio: FCC ID (US), RED/CE (EU), TELEC (Japan), SRRC (China export)`
    }
  );
}

export async function generateAppeal(
  productType: string,
  reason: string,
  actions: string
): Promise<AppealResult> {
  return callAI<AppealResult>(
    "appeal",
    {
      prompt: APPEAL_PROMPT
        .replace("{productType}", productType)
        .replace("{reason}", reason)
        .replace("{actions}", actions),
      message: "Generate a complete appeal plan (POA) with root cause, corrective actions, and preventive measures."
    }
  );
}

export async function shortReply(
  profile: ProductProfile,
  status: string,
  userMessage: string
): Promise<ShortReplyResult> {
  const profileStr = JSON.stringify(profile, null, 2);
  return callAI<ShortReplyResult>(
    "short-reply",
    {
      prompt: SHORT_REPLY_PROMPT
        .replace("{profile}", profileStr)
        .replace("{status}", status),
      message: userMessage
    }
  );
}

export function isProfileComplete(profile: ProductProfile, market: string | null): boolean {
  if (!profile.product_type || !profile.product_type.trim()) {
    return false;
  }
  if (!market) {
    return false;
  }
  const featureKeys = ["has_battery", "has_wireless", "is_children", "food_contact",
    "wearable", "medical", "electrical", "contains_chemicals", "contains_magnets",
    "precision", "has_flammable"] as const;
  const hasAnyFeature = featureKeys.some(key => (profile as Record<string, unknown>)[key] !== null);
  if (!hasAnyFeature) {
    return false;
  }
  return true;
}

// ============================================
// Static data fallback — zero-cost diagnosis for common categories
// ============================================

/**
 * Try to return a pre-built compliance report from static data.
 * Returns null if no static data is available (falls back to AI).
 */
export function getStaticDiagnosis(
  productType: string,
  market: string
): CombinedDiagnosisResult | null {
  const lowerProduct = productType.toLowerCase();
  
  // Map product keywords to category IDs
  const categoryMap: Record<string, string[]> = {
    electronics: ["charger", "cable", "headphone", "speaker", "bluetooth", "power bank", "battery",
      "phone", "tablet", "laptop", "computer", "camera", "led", "light", "smart watch", "watch",
      "adapter", "charger", "plug", "usb", "wireless", "earbud", "earphone", "earbuds",
      "keyboard", "mouse", "monitor", "tv", "television", "drone", "robot"],
    toys: ["toy", "plush", "doll", "puzzle", "game", "block", "lego", "rc car", "remote control",
      "educational toy", "learning", "kids toy", "children toy", "stuffed animal"],
    baby: ["baby", "infant", "toddler", "pacifier", "bottle", "stroller", "car seat", "crib",
      "high chair", "diaper", "wipes", "bib", "onesie", "romper", "nursery"],
    beauty: ["cosmetic", "makeup", "skincare", "cream", "serum", "lotion", "shampoo", "conditioner",
      "perfume", "fragrance", "nail polish", "lipstick", "foundation", "mascara", "sunscreen",
      "moisturizer", "cleanser", "face mask", "hair dye", "hair gel"],
    home: ["kitchen", "cookware", "pot", "pan", "plate", "bowl", "cutlery", "utensil", "blender",
      "mixer", "toaster", "coffee maker", "tea kettle", "air fryer", "microwave", "vacuum cleaner",
      "fan", "heater", "humidifier", "air purifier", "lamp", "light bulb", "curtain", "pillow",
      "blanket", "towel", "storage", "shelf", "rack", "basket"],
    jewelry: ["necklace", "earring", "bracelet", "ring", "anklet", "brooch", "pendant", "chain",
      "silver", "gold", "jewelry", "jewellery", "watch", "wristband"],
    pet: ["pet", "dog", "cat", "fish", "bird", "hamster", "food", "treat", "toy", "bed", "collar",
      "leash", "carrier", "bowl", "shampoo", "grooming", "litter", "crate"],
    health: ["vitamin", "supplement", "protein", "omega", "fish oil", "probiotic", "medicine",
      "thermometer", "blood pressure", "massager", "health", "wellness", "tablet", "capsule",
      "gummy", "powder", "drops", "cream", "ointment", "salve"],
    auto: ["car", "auto", "automotive", "dashboard", "seat cover", "floor mat", "phone mount",
      "dash cam", "charger", "cleaner", "wax", "polish", "tire", "light", "bumper", "mirror"],
    sports: ["fitness", "exercise", "yoga", "dumbbell", "resistance band", "jump rope", "bike",
      "cycling", "running", "hiking", "camping", "tent", "sleeping bag", "backpack", "water bottle",
      "gym", "workout", "training", "protective gear", "helmet", "pad"],
    garden: ["garden", "plant", "pot", "planter", "soil", "fertilizer", "pesticide", "herbicide",
      "pruner", "shovel", "rake", "watering", "lawn", "grass", "tree", "flower", "seed"],
  };
  
  let category: string | null = null;
  for (const [cat, keywords] of Object.entries(categoryMap)) {
    if (keywords.some(kw => lowerProduct.includes(kw))) {
      category = cat;
      break;
    }
  }
  
  if (!category) return null;
  
  // Look up compliance data
  const marketLower = market.toLowerCase();
  const marketKey: Record<string, string> = {
    "us": "us", "usa": "us", "united states": "us", "america": "us",
    "eu": "eu", "europe": "eu", "uk": "uk", "united kingdom": "uk", "britain": "uk",
    "jp": "jp", "japan": "jp",
    "ca": "ca", "canada": "ca",
    "au": "au", "australia": "au", "nz": "au", "new zealand": "au",
    // Southeast Asia
    "sg": "sg", "singapore": "sg",
    "th": "th", "thailand": "th",
    "vn": "vn", "vietnam": "vn",
    "id": "id", "indonesia": "id",
    "my": "my", "malaysia": "my",
    "ph": "ph", "philippines": "ph",
    // Middle East
    "sa": "sa", "saudi": "sa", "saudi arabia": "sa",
    "ae": "ae", "uae": "ae", "dubai": "ae", "abu dhabi": "ae",
    "kw": "kw", "kuwait": "kw",
    // Other niches
    "kr": "kr", "korea": "kr", "south korea": "kr",
    "in": "in", "india": "in", "bharat": "in",
    "br": "br", "brazil": "br",
    "mx": "mx", "mexico": "mx",
    "tr": "tr", "turkey": "tr", "istanbul": "tr",
    "il": "il", "israel": "il",
    "za": "za", "south africa": "za", "jhb": "za", "capetown": "za",
  };
  const dataMarket = marketKey[marketLower] || "us";
  
  const items = categoryComplianceData[category]?.[dataMarket];
  if (!items || items.length === 0) return null;
  
  // Build diagnosis result from static data
  const recommendations = items.map(item => ({
    name: item.name,
    required: item.required,
    desc: item.desc,
    severity: item.severity,
    reason: `${item.name} is ${item.required ? "mandatory" : "recommended"} for ${category} products in ${market.toUpperCase()}. ${item.desc}`,
    estimatedCost: item.needsThirdParty ? "$500 - $5,000" : "$0 - $500",
    estimatedTime: item.estimatedTime,
    action: item.action,
    needsThirdParty: item.needsThirdParty,
    confidence: "high" as const,
    priorityLabel: item.required ? "🔴 Required — Mandatory compliance" : "🟡 Recommended — Improves compliance",
  }));
  
  // Calculate risk level
  const highCount = items.filter(i => i.severity === "high" && i.required).length;
  const riskLevel: "high" | "medium" | "low" = highCount >= 3 ? "high" : highCount >= 1 ? "medium" : "low";
  
  return {
    profile: {
      product_type: productType,
      category,
      has_battery: null,
      battery_capacity: null,
      has_wireless: null,
      is_children: null,
      food_contact: null,
      wearable: null,
      medical: null,
      electrical: null,
      contains_chemicals: null,
      contains_magnets: null,
      precision: null,
      has_flammable: null,
    },
    summary: `Based on your product category (${category}) and target market (${market.toUpperCase()}), here are the compliance requirements. This is a standard assessment — for complex products with special features (battery, wireless, children's), please use AI diagnosis for more accurate results.`,
    recommendations,
    riskLevel,
    warnings: [
      "This is a standard compliance checklist based on product category. For products with special features (battery, wireless, medical, children's), please use AI diagnosis for more accurate results.",
      "Cost estimates are approximate and may vary based on testing labs and product complexity.",
    ],
  } as CombinedDiagnosisResult;
}

// ============================================
// Combined: Extract features + Diagnose in one API call
// ============================================

export interface CombinedDiagnosisResult {
  profile: ProductProfile;
  summary: string;
  recommendations: Array<{
    name: string;
    required: boolean;
    desc: string;
    severity: "high" | "medium" | "low";
    reason: string;
    estimatedCost: string;
    estimatedTime: string;
    action: string;
    needsThirdParty: boolean;
    confidence: "high" | "medium" | "low";
    priorityLabel: string;
  }>;
  riskLevel: "high" | "medium" | "low";
  warnings: string[];
  questions?: string[];
  informationSufficient?: boolean;
  [key: string]: unknown;
}

export async function combinedDiagnose(
  userMessage: string,
  existingProfile?: Partial<ProductProfile>,
  market?: string
): Promise<CombinedDiagnosisResult> {
  const targetMarket = market || "US";
  // console.log("[Agent] combinedDiagnose called, market:", targetMarket);
  
  // Check cache first using original userMessage as key (matches Home.tsx)
  const cachedResult = cache.getDiagnosis(userMessage, targetMarket);
  if (cachedResult) {
    // console.log("[Agent] Cache hit for:", userMessage);
    return cachedResult as CombinedDiagnosisResult;
  }
  
  // Try static data — zero API cost for common categories
  const staticResult = getStaticDiagnosis(userMessage, targetMarket);
  // console.log("[Agent] getStaticDiagnosis result:", staticResult ? "found" : "null");
  if (staticResult) {
    // Cache static result too so future AI queries hit cache
    try {
      cache.setDiagnosis(userMessage, targetMarket, staticResult);
    } catch (e) {
      console.warn("[Agent] Static cache write failed:", e);
    }
    return staticResult;
  }
  
  // Fall back to AI diagnosis
  const profileResult = await extractProductProfile(userMessage);
  const inferredCategory = inferCategory(profileResult.profile.product_type);
  
  // If we have enough info, proceed to diagnosis
  if (profileResult.informationSufficient && profileResult.profile.product_type) {
    const diagnosisInput: ProductProfile = {
      product_type: profileResult.profile.product_type,
      category: inferredCategory,
      has_battery: profileResult.profile.has_battery ?? null,
      battery_capacity: profileResult.profile.battery_capacity,
      has_wireless: profileResult.profile.has_wireless ?? null,
      is_children: profileResult.profile.is_children ?? null,
      food_contact: profileResult.profile.food_contact ?? null,
      wearable: profileResult.profile.wearable ?? null,
      medical: profileResult.profile.medical ?? null,
      electrical: profileResult.profile.electrical ?? null,
      contains_chemicals: profileResult.profile.contains_chemicals ?? null,
      contains_magnets: profileResult.profile.contains_magnets ?? null,
      precision: profileResult.profile.precision ?? null,
      has_flammable: profileResult.profile.has_flammable ?? null,
    };
    
    // Build feature list
    const featureList: string[] = [];
    featureList.push(`Product type: ${diagnosisInput.product_type}`);
    featureList.push(`Category: ${diagnosisInput.category}`);
    
    const featureLabels: Record<string, string> = {
      has_battery: "Battery", has_wireless: "Wireless",
      is_children: "Children's product", food_contact: "Food contact",
      wearable: "Wearable", medical: "Medical device",
      electrical: "Electrical", contains_chemicals: "Contains chemicals",
      contains_magnets: "Contains magnets", precision: "Precision instrument",
      has_flammable: "Flammable/gas",
    };
    
    for (const [key, value] of Object.entries(diagnosisInput)) {
      if (value === true && featureLabels[key]) {
        featureList.push(featureLabels[key]);
      }
    }
    
    const marketName = (() => {
      const m = (market || "US").toLowerCase();
      const map: Record<string, string> = {
        us: "US", eu: "EU", uk: "UK", jp: "Japan", ca: "Canada", au: "Australia",
        sg: "Singapore", th: "Thailand", vn: "Vietnam", id: "Indonesia", my: "Malaysia",
        ph: "Philippines", sa: "Saudi Arabia", ae: "UAE", kr: "South Korea", in: "India",
        br: "Brazil", mx: "Mexico", tr: "Turkey", nz: "New Zealand", za: "South Africa",
      };
      return map[m] || "Australia";
    })();
    // Add feature inference to diagnosis prompt for smarter defaults
    const enhancedDiagnosisPrompt = DIAGNOSIS_PROMPT.replace(
      "[CRITICAL RULE]",
      `[SMART INFERENCE RULE]: Based on the product type "{productType}", automatically infer these features if the user didn't specify:\n` +
      `- If product contains battery/wireless/children/food-contact/medical/magnetic features, include relevant certifications\n` +
      `- Use common sense: e.g., "phone case" → no battery, no wireless, not children\n` +
      `- If product is electronics → include FCC/CE/RoHS\n` +
      `[CRITICAL RULE]`
    );
    
    const diagnosis = await callAI<DiagnosisResult>(
      "diagnose",
      {
        prompt: enhancedDiagnosisPrompt
          .replace("{productType}", diagnosisInput.product_type)
          .replace("{productFeatures}", featureList.join(", "))
          .replace("{market}", marketName)
          .replace("{category}", diagnosisInput.category),
        message: `Generate a detailed compliance diagnosis for the following product:

Product type: ${diagnosisInput.product_type}
Category: ${diagnosisInput.category}
Detected features: ${featureList.join(", ")}
Target market: ${marketName}

Key risk factors to consider:
- If battery: UN38.3, MSDS, IATA transport rules
- If children's product: CPSIA/CPC (US), EN71/CE-UKCA (EU), PSE/JIS (Japan)
- If food contact: FDA 21 CFR (US), EU 10/2011 (EU), food hygiene standards
- If medical: FDA Class (US), EU MDR (EU), PMDA (Japan)
- If magnetic: 15 CFR 1309 magnet strength test
- If flammable: DOT transport certification, IATA packing instructions
- If wireless/radio: FCC ID (US), RED/CE (EU), TELEC (Japan), SRRC (China export)`
      }
    );
    
    // Merge diagnosis into combined result and cache
    const finalResult = {
      profile: diagnosisInput,
      summary: diagnosis.summary,
      recommendations: (diagnosis.recommendations as unknown as CombinedDiagnosisResult["recommendations"]).map(r => ({
        ...r,
        desc: r.desc || r.reason || "",
        confidence: (r as any).confidence || "medium",
        priorityLabel: (r as any).priorityLabel || "Recommended — Improves compliance",
      })),
      riskLevel: diagnosis.riskLevel,
      warnings: diagnosis.warnings,
    } as CombinedDiagnosisResult;
    
    try {
      cache.setDiagnosis(userMessage, targetMarket, finalResult);
    } catch (e) {
      console.warn("[Agent] Cache write failed:", e);
    }
    
    return finalResult;
  }
  
  // Not enough info — return profile extraction result with questions
  return {
    profile: {
      product_type: profileResult.profile.product_type || userMessage,
      category: inferredCategory,
      has_battery: profileResult.profile.has_battery,
      battery_capacity: profileResult.profile.battery_capacity,
      has_wireless: profileResult.profile.has_wireless,
      is_children: profileResult.profile.is_children,
      food_contact: profileResult.profile.food_contact,
      wearable: profileResult.profile.wearable,
      medical: profileResult.profile.medical,
      electrical: profileResult.profile.electrical,
      contains_chemicals: profileResult.profile.contains_chemicals,
      contains_magnets: profileResult.profile.contains_magnets,
      precision: profileResult.profile.precision,
      has_flammable: profileResult.profile.has_flammable,
    },
    summary: "I need more information to give you an accurate compliance report.",
    recommendations: [],
    riskLevel: "low",
    warnings: [],
    questions: profileResult.questions || [],
    informationSufficient: false,
  } as CombinedDiagnosisResult;
}


