export interface ProductMetadata {
  garmentType: string | null;
  color: string | null;
  fabric: string | null;
  embellishments: string[];
  currency: string;
}

// Priority-ordered: more specific types first to avoid "kurta" matching before "anarkali kurta"
const GARMENT_TYPES: [RegExp, string][] = [
  [/\blehenga\b/i, "lehenga"],
  [/\banarkali\b/i, "anarkali"],
  [/\bsaree\b|\bsari\b/i, "saree"],
  [/\bsharara\b/i, "sharara"],
  [/\bsalwar\b/i, "salwar"],
  [/\bpalazzo\b/i, "palazzo"],
  [/\bsherwani\b/i, "sherwani"],
  [/\bbandhgala\b/i, "bandhgala"],
  [/\bpathani\b/i, "pathani"],
  [/\bdupatta\b/i, "dupatta"],
  [/\bkurti\b/i, "kurti"],
  [/\bco[\s-]ord\b/i, "co-ord"],
  [/\bgown\b/i, "gown"],
  [/\bkurta\b/i, "kurta"],
  [/\bdress\b/i, "dress"],
  [/\bsuit\b/i, "suit"],
];

const COLORS: [RegExp, string][] = [
  // Multi-word / compound colors — must come before their single-word roots
  [/\bdusty\s+rose\b/i,    "dusty rose"],
  [/\brose\s+gold\b/i,     "rose gold"],
  [/\boff[\s-]white\b/i,   "off-white"],
  [/\bdark\s+fawn\b/i,     "dark fawn"],
  [/\bolive\s+green\b/i,   "olive green"],
  [/\bsage\s+green\b/i,    "sage green"],
  [/\bforest\s+green\b/i,  "forest green"],
  [/\bpowder\s+blue\b/i,   "powder blue"],
  [/\bsky\s+blue\b/i,      "sky blue"],
  [/\broyal\s+blue\b/i,    "royal blue"],
  // Single-word additions
  [/\bfawn\b/i,            "fawn"],
  [/\bchampagne\b/i,       "champagne"],
  [/\becru\b/i,            "ecru"],
  [/\blilac\b/i,           "lilac"],
  [/\bwine\b/i,            "wine"],
  [/\bburgundy\b/i,        "burgundy"],
  [/\bindigo\b/i,          "indigo"],
  [/\baqua\b/i,            "aqua"],
  [/\bturquoise\b/i,       "turquoise"],
  [/\bamber\b/i,           "amber"],
  [/\bsage\b/i,            "sage"],
  [/\bolive\b/i,           "olive"],
  [/\bterracotta\b/i,      "terracotta"],
  [/\bmarigold\b/i,        "marigold"],
  [/\bsaffron\b/i,         "saffron"],
  [/\bochre\b/i,           "ochre"],
  [/\bcopper\b/i,          "copper"],
  [/\bbronze\b/i,          "bronze"],
  [/\btaupe\b/i,           "taupe"],
  [/\bcamel\b/i,           "camel"],
  [/\bplum\b/i,            "plum"],
  [/\bmagenta\b/i,         "magenta"],
  [/\bfuchsia\b/i,         "fuchsia"],
  [/\bsalmon\b/i,          "salmon"],
  [/\bcharcoal\b/i,        "charcoal"],
  [/\bcobalt\b/i,          "cobalt"],
  [/\bcerulean\b/i,        "cerulean"],
  [/\bkhaki\b/i,           "khaki"],
  // Original entries
  [/\bivory\b/i, "ivory"],
  [/\bcream\b/i, "cream"],
  [/\bmauve\b/i, "mauve"],
  [/\bmaroon\b/i, "maroon"],
  [/\brust\b/i, "rust"],
  [/\bcoral\b/i, "coral"],
  [/\bblush\b/i, "blush"],
  [/\bpeach\b/i, "peach"],
  [/\bmustard\b/i, "mustard"],
  [/\blavender\b/i, "lavender"],
  [/\bviolet\b/i, "violet"],
  [/\bmint\b/i, "mint"],
  [/\bteal\b/i, "teal"],
  [/\bnavy\b/i, "navy"],
  [/\bbeige\b/i, "beige"],
  [/\bnude\b/i, "nude"],
  [/\bpink\b/i, "pink"],
  [/\bred\b/i, "red"],
  [/\byellow\b/i, "yellow"],
  [/\borange\b/i, "orange"],
  [/\bgreen\b/i, "green"],
  [/\bblue\b/i, "blue"],
  [/\bpurple\b/i, "purple"],
  [/\bblack\b/i, "black"],
  [/\bgrey\b|\bgray\b/i, "grey"],
  [/\bgold\b/i, "gold"],
  [/\bsilver\b/i, "silver"],
  [/\bwhite\b/i, "white"],
];

const FABRICS: [RegExp, string][] = [
  [/\bgeorgette\b/i, "georgette"],
  [/\bchiffon\b/i, "chiffon"],
  [/\bchanderi\b/i, "chanderi"],
  [/\borganza\b/i, "organza"],
  [/\bbrocade\b/i, "brocade"],
  [/\bvelvet\b/i, "velvet"],
  [/\bsatin\b/i, "satin"],
  [/\bkhadi\b/i, "khadi"],
  [/\brayon\b/i, "rayon"],
  [/\bcrepe\b/i, "crepe"],
  [/\blinen\b/i, "linen"],
  [/\bcotton\b/i, "cotton"],
  [/\bnet\b/i, "net"],
  [/\bsilk\b/i, "silk"],
];

const EMBELLISHMENTS: [RegExp, string][] = [
  [/\bzardozi\b/i, "zardozi"],
  [/\bgota\s+patti\b/i, "gota patti"],
  [/\bmirror\s+work\b/i, "mirror work"],
  [/\bthread\s+work\b/i, "thread work"],
  [/\bblock\s+print\b/i, "block print"],
  [/\bsequin/i, "sequins"],
  [/\bresham\b/i, "resham"],
  [/\bembroidery\b|\bembroidered\b/i, "embroidery"],
  [/\bcrystal\b/i, "crystals"],
  [/\bbeaded?\b/i, "beads"],
  [/\bstone\s+work\b/i, "stone work"],
  [/\bprinted\b/i, "printed"],
  [/\bfloral\b/i, "floral"],
  [/\bstriped\b/i, "striped"],
];

export function extractMetadata(title: string): ProductMetadata {
  const text = title;

  let garmentType: string | null = null;
  for (const [pattern, label] of GARMENT_TYPES) {
    if (pattern.test(text)) {
      garmentType = label;
      break;
    }
  }

  let color: string | null = null;
  for (const [pattern, label] of COLORS) {
    if (pattern.test(text)) {
      color = label;
      break;
    }
  }

  let fabric: string | null = null;
  for (const [pattern, label] of FABRICS) {
    if (pattern.test(text)) {
      fabric = label;
      break;
    }
  }

  const embellishments: string[] = [];
  for (const [pattern, label] of EMBELLISHMENTS) {
    if (pattern.test(text)) {
      embellishments.push(label);
    }
  }

  return { garmentType, color, fabric, embellishments, currency: "INR" };
}
