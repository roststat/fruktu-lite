export interface Category {
  id: string;
  name: string;
  icon: string;
  subcategories?: Category[];
}

export interface Product {
  id: string;
  name: string;
  categoryId: string;
  price: number;
  unit: string;
  icon: string;
  seasonal?: boolean;
  relatedIds?: string[];
  clearance?: {
    price: number;
    reason: string;
  };
}

export const categories: Category[] = [
  { id: "veg", name: "Овощи, фрукты, ягоды, зелень", icon: "🍅" },
  { id: "dairy", name: "Молочные продукты, масло, яйцо", icon: "🥛" },
  { id: "cheese", name: "Сыры", icon: "🧀" },
  { id: "meat", name: "Мясо, птица", icon: "🍗" },
  { id: "fish", name: "Рыба и морепродукты", icon: "🐟" },
  { id: "bread", name: "Хлеб", icon: "🍞" },
  { id: "frozen", name: "Замороженные продукты", icon: "🧊" },
  { id: "canned", name: "Консервы", icon: "🥫" },
  { id: "tea", name: "Чай и кофе", icon: "☕" },
  { id: "grains", name: "Крупы, макароны, мука", icon: "🌾" },
  { id: "sauces", name: "Масла, соусы, сахар", icon: "🍯" },
];

export const products: Product[] = [
  // Овощи, фрукты, ягоды, зелень
  {
    id: "cucumber",
    name: "Огурцы грунтовые",
    categoryId: "veg",
    price: 145,
    unit: "кг",
    icon: "🥒",
    seasonal: true,
    relatedIds: ["tomato", "dill", "smetana"],
    clearance: {
      price: 90,
      reason: "Помятые, но свежие — берём сегодня",
    },
  },
  {
    id: "tomato",
    name: "Помидоры розовые",
    categoryId: "veg",
    price: 189,
    unit: "кг",
    icon: "🍅",
    seasonal: true,
    relatedIds: ["cucumber", "basil", "cheese-feta"],
  },
  {
    id: "cherry",
    name: "Черешня",
    categoryId: "veg",
    price: 420,
    unit: "кг",
    icon: "🍒",
    seasonal: true,
    relatedIds: ["apricot", "strawberry"],
  },
  {
    id: "apricot",
    name: "Абрикосы",
    categoryId: "veg",
    price: 280,
    unit: "кг",
    icon: "🍑",
    seasonal: true,
    relatedIds: ["cherry", "peach"],
  },
  {
    id: "peach",
    name: "Персики",
    categoryId: "veg",
    price: 320,
    unit: "кг",
    icon: "🍑",
    seasonal: true,
    relatedIds: ["apricot", "cherry"],
  },
  {
    id: "strawberry",
    name: "Клубника",
    categoryId: "veg",
    price: 350,
    unit: "кг",
    icon: "🍓",
    seasonal: true,
    relatedIds: ["cherry", "smetana"],
  },
  {
    id: "young-potato",
    name: "Картофель молодой",
    categoryId: "veg",
    price: 95,
    unit: "кг",
    icon: "🥔",
    seasonal: true,
    relatedIds: ["dill", "butter"],
  },
  {
    id: "dill",
    name: "Укроп",
    categoryId: "veg",
    price: 60,
    unit: "пучок",
    icon: "🌿",
    relatedIds: ["cucumber", "tomato"],
  },
  {
    id: "basil",
    name: "Базилик",
    categoryId: "veg",
    price: 70,
    unit: "пучок",
    icon: "🌱",
    relatedIds: ["tomato", "cheese-feta"],
  },

  // Молочные продукты, масло, яйцо
  {
    id: "milk",
    name: "Молоко фермерское",
    categoryId: "dairy",
    price: 110,
    unit: "л",
    icon: "🥛",
    relatedIds: ["smetana", "eggs"],
  },
  {
    id: "smetana",
    name: "Сметана 20%",
    categoryId: "dairy",
    price: 130,
    unit: "400 г",
    icon: "🥣",
    relatedIds: ["cucumber", "strawberry"],
  },
  {
    id: "eggs",
    name: "Яйца куриные С1",
    categoryId: "dairy",
    price: 140,
    unit: "10 шт",
    icon: "🥚",
    relatedIds: ["butter", "milk"],
  },
  {
    id: "butter",
    name: "Масло сливочное 82.5%",
    categoryId: "dairy",
    price: 220,
    unit: "180 г",
    icon: "🧈",
    relatedIds: ["young-potato", "bread-white"],
  },

  // Сыры
  {
    id: "cheese-feta",
    name: "Сыр фермерский (брынза)",
    categoryId: "cheese",
    price: 480,
    unit: "кг",
    icon: "🧀",
    relatedIds: ["tomato", "basil"],
  },
  {
    id: "cheese-hard",
    name: "Сыр твёрдый выдержанный",
    categoryId: "cheese",
    price: 690,
    unit: "кг",
    icon: "🧀",
    relatedIds: ["bread-white", "wine-sauce"],
  },

  // Мясо, птица
  {
    id: "chicken",
    name: "Курица домашняя",
    categoryId: "meat",
    price: 360,
    unit: "кг",
    icon: "🍗",
    relatedIds: ["young-potato", "spices"],
  },
  {
    id: "pork",
    name: "Свинина (шея)",
    categoryId: "meat",
    price: 520,
    unit: "кг",
    icon: "🥩",
    relatedIds: ["spices", "young-potato"],
  },
  {
    id: "minced-meat",
    name: "Фарш домашний",
    categoryId: "meat",
    price: 480,
    unit: "кг",
    icon: "🥩",
    relatedIds: ["spices", "pasta"],
  },

  // Рыба и морепродукты
  {
    id: "trout",
    name: "Форель свежая",
    categoryId: "fish",
    price: 750,
    unit: "кг",
    icon: "🐟",
    relatedIds: ["dill", "olive-oil"],
  },
  {
    id: "mussels",
    name: "Мидии черноморские",
    categoryId: "fish",
    price: 390,
    unit: "кг",
    icon: "🦪",
    relatedIds: ["wine-sauce", "dill"],
  },

  // Хлеб
  {
    id: "bread-white",
    name: "Хлеб белый подовый",
    categoryId: "bread",
    price: 75,
    unit: "шт",
    icon: "🍞",
    relatedIds: ["butter", "cheese-hard"],
    clearance: {
      price: 40,
      reason: "Срок годности — сегодня",
    },
  },
  {
    id: "lavash",
    name: "Лаваш тонкий",
    categoryId: "bread",
    price: 60,
    unit: "шт",
    icon: "🫓",
    relatedIds: ["cheese-feta", "chicken"],
  },

  // Замороженные продукты
  {
    id: "frozen-berries",
    name: "Ягодная смесь",
    categoryId: "frozen",
    price: 320,
    unit: "400 г",
    icon: "🧊",
    relatedIds: ["smetana"],
  },
  {
    id: "frozen-dumplings",
    name: "Пельмени домашние",
    categoryId: "frozen",
    price: 380,
    unit: "кг",
    icon: "🥟",
    relatedIds: ["smetana"],
  },

  // Консервы
  {
    id: "canned-tomatoes",
    name: "Томаты в собственном соку",
    categoryId: "canned",
    price: 150,
    unit: "0.5 л",
    icon: "🥫",
    relatedIds: ["pasta"],
  },
  {
    id: "canned-beans",
    name: "Фасоль консервированная",
    categoryId: "canned",
    price: 110,
    unit: "0.4 кг",
    icon: "🥫",
  },

  // Чай и кофе
  {
    id: "coffee",
    name: "Кофе в зёрнах",
    categoryId: "tea",
    price: 650,
    unit: "250 г",
    icon: "☕",
  },
  {
    id: "tea-herbal",
    name: "Крымский травяной чай",
    categoryId: "tea",
    price: 240,
    unit: "100 г",
    icon: "🍵",
  },

  // Крупы, макароны, мука
  {
    id: "pasta",
    name: "Макароны твёрдых сортов",
    categoryId: "grains",
    price: 95,
    unit: "450 г",
    icon: "🍝",
    relatedIds: ["canned-tomatoes", "minced-meat"],
  },
  {
    id: "rice",
    name: "Рис длиннозёрный",
    categoryId: "grains",
    price: 130,
    unit: "кг",
    icon: "🍚",
    relatedIds: ["mussels", "chicken"],
  },
  {
    id: "flour",
    name: "Мука пшеничная",
    categoryId: "grains",
    price: 80,
    unit: "кг",
    icon: "🌾",
  },

  // Масла, соусы, сахар
  {
    id: "olive-oil",
    name: "Оливковое масло extra virgin",
    categoryId: "sauces",
    price: 590,
    unit: "0.5 л",
    icon: "🫒",
    relatedIds: ["trout", "tomato"],
  },
  {
    id: "wine-sauce",
    name: "Соус винный для мидий",
    categoryId: "sauces",
    price: 210,
    unit: "0.2 л",
    icon: "🍷",
    relatedIds: ["mussels"],
  },
  {
    id: "sugar",
    name: "Сахар",
    categoryId: "sauces",
    price: 75,
    unit: "кг",
    icon: "🧂",
  },
  {
    id: "spices",
    name: "Специи для мяса",
    categoryId: "sauces",
    price: 140,
    unit: "набор",
    icon: "🧂",
    relatedIds: ["chicken", "pork"],
  },
];

function levenshteinDistance(a: string, b: string): number {
  const dp: number[][] = Array.from({ length: a.length + 1 }, () =>
    new Array(b.length + 1).fill(0)
  );
  for (let i = 0; i <= a.length; i++) dp[i][0] = i;
  for (let j = 0; j <= b.length; j++) dp[0][j] = j;
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      dp[i][j] =
        a[i - 1] === b[j - 1]
          ? dp[i - 1][j - 1]
          : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
    }
  }
  return dp[a.length][b.length];
}

/** Matches text against a query, tolerating typos (e.g. "марковь" → "морковь"). */
export function textMatchesQuery(text: string, query: string): boolean {
  const t = text.toLowerCase();
  const q = query.trim().toLowerCase();
  if (!q) return false;
  if (t.includes(q)) return true;
  if (q.length < 3) return false;

  const threshold = q.length <= 4 ? 1 : q.length <= 8 ? 2 : 3;
  return t.split(/\s+/).some((word) => levenshteinDistance(word, q) <= threshold);
}

export function getProductById(id: string): Product | undefined {
  return products.find((p) => p.id === id);
}

/** Cart items for clearance ("зелёный ценник") products use this id suffix
 * so they're tracked as a separate position from the regular product. */
export const CLEARANCE_SUFFIX = "-clearance";

export function getClearanceCartId(productId: string): string {
  return `${productId}${CLEARANCE_SUFFIX}`;
}

export interface CartProduct {
  product: Product;
  price: number;
  isClearance: boolean;
}

export function getCartProductById(id: string): CartProduct | undefined {
  if (id.endsWith(CLEARANCE_SUFFIX)) {
    const product = getProductById(id.slice(0, -CLEARANCE_SUFFIX.length));
    if (!product?.clearance) return undefined;
    return { product, price: product.clearance.price, isClearance: true };
  }
  const product = getProductById(id);
  if (!product) return undefined;
  return { product, price: product.price, isClearance: false };
}

export const ALL_CATEGORY_ID = "all";
export const SEASONAL_CATEGORY_ID = "seasonal";
export const CLEARANCE_CATEGORY_ID = "clearance";

export const virtualCategories: Category[] = [
  { id: ALL_CATEGORY_ID, name: "Все товары", icon: "🛒" },
  { id: SEASONAL_CATEGORY_ID, name: "Самый сезон", icon: "🌱" },
  { id: CLEARANCE_CATEGORY_ID, name: "Зелёный каталог (Уценка)", icon: "🏷️" },
];

export function getCategoryById(id: string): Category | undefined {
  for (const c of [...categories, ...virtualCategories]) {
    if (c.id === id) return c;
    const sub = c.subcategories?.find((s) => s.id === id);
    if (sub) return sub;
  }
  return undefined;
}

export function getCategoryDescendantIds(category: Category): string[] {
  return [
    category.id,
    ...(category.subcategories?.map((s) => s.id) ?? []),
  ];
}

export function productMatchesCategory(
  product: Product,
  categoryId: string
): boolean {
  if (categoryId === ALL_CATEGORY_ID) return true;
  if (categoryId === SEASONAL_CATEGORY_ID) return Boolean(product.seasonal);
  if (categoryId === CLEARANCE_CATEGORY_ID) return Boolean(product.clearance);
  const category = getCategoryById(categoryId);
  if (!category) return product.categoryId === categoryId;
  return getCategoryDescendantIds(category).includes(product.categoryId);
}

export function getRelatedProducts(product: Product): Product[] {
  if (!product.relatedIds) return [];
  return product.relatedIds
    .map((id) => getProductById(id))
    .filter((p): p is Product => Boolean(p));
}

export function getSeasonalProducts(): Product[] {
  return products.filter((p) => p.seasonal);
}

export function getClearanceProducts(): Product[] {
  return products.filter((p) => p.clearance);
}

export function isWeightProduct(product: Product): boolean {
  return product.unit === "кг";
}

export function getDefaultQuantity(product: Product): number {
  return isWeightProduct(product) ? 0.6 : 1;
}

export function getQuantityStep(product: Product): number {
  return isWeightProduct(product) ? 0.2 : 1;
}

export function formatQuantity(product: Product, quantity: number): string {
  return isWeightProduct(product) ? `${quantity.toFixed(1)} кг` : `${quantity}`;
}

const DEFAULT_ITEM_WEIGHT_KG = 0.3;

export function getItemWeightKg(product: Product, quantity: number): number {
  if (product.unit === "кг") return quantity;

  const match = product.unit.match(/^([\d.]+)\s*(кг|г|л|мл)$/);
  if (!match) return quantity * DEFAULT_ITEM_WEIGHT_KG;

  const value = parseFloat(match[1]);
  const unit = match[2];
  const kgPerUnit =
    unit === "кг" ? value : unit === "г" || unit === "мл" ? value / 1000 : value;

  return quantity * kgPerUnit;
}
