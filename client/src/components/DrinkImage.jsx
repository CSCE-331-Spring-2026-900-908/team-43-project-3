/**
 * Drink image resolver and display component for menu item cards.
 */
const DRINK_IMAGES = [
  { src: "/honey_milk_tea.webp", terms: ["honey milk tea"] },
  { src: "/jasmine_milk_tea.webp", terms: ["jasmine milk tea"] },
  { src: "/lemon_black_tea.png", terms: ["lemon black tea"] },
  { src: "/Lynchee_green.webp", terms: ["lychee green", "lynchee green", "lychee green tea"] },
  { src: "/mango_blend.webp", terms: ["mango blend"] },
  { src: "/mango_slush.webp", terms: ["mango slush"] },
  { src: "/okinawa_milktea.webp", terms: ["okinawa milk tea", "okinawa milktea"] },
  { src: "/oolong_tea.jpeg", terms: ["oolong tea"] },
  { src: "/passionfruit_green_tea.webp", terms: ["passionfruit green tea", "passion fruit green tea"] },
  { src: "/peach_green_tea.webp", terms: ["peach green tea"] },
  { src: "/strawberry_fruit_tea.webp", terms: ["strawberry fruit tea"] },
  { src: "/strawberry_slush.webp", terms: ["strawberry slush"] },
  { src: "/taro_milk_tea.webp", terms: ["taro milk tea"] },
  { src: "/taro_slush.webp", terms: ["taro slush"] },
  { src: "/thai_milk_tea.webp", terms: ["thai milk tea"] },
];

const CATEGORY_IMAGES = {
  "Milk Tea": "/Milk_tea.png",
  "Fruit Tea": "/strawberry_fruit_tea.webp",
  "Classic Tea": "/oolong_tea.jpeg",
  "Brewed Tea": "/oolong_tea.jpeg",
  Slush: "/mango_slush.webp",
  Coffee: "/Milk_tea.png",
  Seasonal: "/mango_blend.webp",
};

/**
 * Normalizes drink names and search terms for loose image matching.
 * @param {string} value - The text to normalize.
 * @returns {string} Lowercase alphanumeric text separated by single spaces.
 */
function normalize(value) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

/**
 * Finds the most specific image available for a drink name and category.
 * @param {string} name - The menu item name.
 * @param {string} category - The menu item category.
 * @returns {string} The resolved image path.
 */
function resolveDrinkImage(name, category) {
  const normalizedName = normalize(name);
  const exact = DRINK_IMAGES.find((image) =>
    image.terms.some((term) => normalize(term) === normalizedName)
  );
  if (exact) return exact.src;

  const partial = DRINK_IMAGES.find((image) =>
    image.terms.some((term) => normalizedName.includes(normalize(term)) || normalize(term).includes(normalizedName))
  );
  if (partial) return partial.src;

  return CATEGORY_IMAGES[category] || CATEGORY_IMAGES["Milk Tea"];
}

/**
 * Renders a drink image with a category fallback when the specific asset fails.
 * @param {{name?: string, category?: string, style?: object}} props - Drink image props.
 * @returns {import("react").ReactElement} The menu item image.
 */
export default function DrinkImage({ name = "Drink", category = "Milk Tea", style }) {
  const src = resolveDrinkImage(name, category);

  return (
    <img
      src={src}
      alt={name}
      loading="lazy"
      decoding="async"
      style={{ ...styles.image, ...style }}
      onError={(event) => {
        event.currentTarget.onerror = null;
        event.currentTarget.src = CATEGORY_IMAGES[category] || CATEGORY_IMAGES["Milk Tea"];
      }}
    />
  );
}

const styles = {
  image: {
    display: "block",
    width: "100%",
    aspectRatio: "1 / 1",
    objectFit: "cover",
    background: "var(--border)",
    flexShrink: 0,
  },
};
