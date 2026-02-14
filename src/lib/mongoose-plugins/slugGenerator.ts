import type { Schema, Model, Document } from "mongoose";

// ============================================
// Slug Generator Mongoose Plugin
// ============================================
// Production-level plugin that automatically generates
// unique, URL-safe slugs from a configurable source field.
//
// Features:
//  • Unicode transliteration (accented chars → ASCII)
//  • Automatic deduplication with incrementing suffixes (-2, -3, …)
//  • Retry on concurrent duplicate-key errors (E11000)
//  • Pre-save & pre-findOneAndUpdate hooks
//  • Configurable source field, slug field, separator, max length
//  • Static findBySlug() helper added to the model
// ============================================

// ── Options ──────────────────────────────────

export interface SlugGeneratorOptions {
  /** Field to derive the slug from (default: "title") */
  sourceField?: string;
  /** Field where the generated slug is stored (default: "slug") */
  slugField?: string;
  /** Separator between words (default: "-") */
  separator?: string;
  /** Maximum slug length – 0 means unlimited (default: 128) */
  maxLength?: number;
  /** Whether to regenerate the slug when the source field changes on update (default: true) */
  forceRegenerateOnUpdate?: boolean;
  /** Maximum retry attempts on duplicate key collision (default: 10) */
  maxRetries?: number;
}

const DEFAULTS: Required<SlugGeneratorOptions> = {
  sourceField: "title",
  slugField: "slug",
  separator: "-",
  maxLength: 128,
  forceRegenerateOnUpdate: true,
  maxRetries: 10,
};

// ── Unicode Transliteration Map ──────────────

const TRANSLITERATION_MAP: Record<string, string> = {
  // Latin accented
  À: "A",
  Á: "A",
  Â: "A",
  Ã: "A",
  Ä: "A",
  Å: "A",
  à: "a",
  á: "a",
  â: "a",
  ã: "a",
  ä: "a",
  å: "a",
  Æ: "AE",
  æ: "ae",
  Ç: "C",
  ç: "c",
  È: "E",
  É: "E",
  Ê: "E",
  Ë: "E",
  è: "e",
  é: "e",
  ê: "e",
  ë: "e",
  Ì: "I",
  Í: "I",
  Î: "I",
  Ï: "I",
  ì: "i",
  í: "i",
  î: "i",
  ï: "i",
  Ð: "D",
  ð: "d",
  Ñ: "N",
  ñ: "n",
  Ò: "O",
  Ó: "O",
  Ô: "O",
  Õ: "O",
  Ö: "O",
  Ø: "O",
  ò: "o",
  ó: "o",
  ô: "o",
  õ: "o",
  ö: "o",
  ø: "o",
  Ù: "U",
  Ú: "U",
  Û: "U",
  Ü: "U",
  ù: "u",
  ú: "u",
  û: "u",
  ü: "u",
  Ý: "Y",
  ý: "y",
  ÿ: "y",
  Þ: "Th",
  þ: "th",
  ß: "ss",
  // Polish
  Ł: "L",
  ł: "l",
  Ś: "S",
  ś: "s",
  Ź: "Z",
  ź: "z",
  Ż: "Z",
  ż: "z",
  Ć: "C",
  ć: "c",
  Ń: "N",
  ń: "n",
  // Czech / Slovak
  Č: "C",
  č: "c",
  Ď: "D",
  ď: "d",
  Ě: "E",
  ě: "e",
  Ň: "N",
  ň: "n",
  Ř: "R",
  ř: "r",
  Š: "S",
  š: "s",
  Ť: "T",
  ť: "t",
  Ů: "U",
  ů: "u",
  Ž: "Z",
  ž: "z",
  // Turkish
  Ğ: "G",
  ğ: "g",
  İ: "I",
  ı: "i",
  Ş: "S",
  ş: "s",
  // Romanian
  Ă: "A",
  ă: "a",
  Ș: "S",
  ș: "s",
  Ț: "T",
  ț: "t",
  // Vietnamese (common)
  Đ: "D",
  đ: "d",
  // Currency & symbols
  "€": "euro",
  "£": "pound",
  $: "dollar",
  "¢": "cent",
  "¥": "yen",
  "₹": "rupee",
  // Common
  "&": "and",
  "@": "at",
  "#": "hash",
};

// ── Slugify Engine ───────────────────────────

/**
 * Convert arbitrary text into a clean, URL-safe slug.
 *
 * 1. Transliterate known Unicode characters to ASCII
 * 2. Lowercase
 * 3. Replace non-alphanumeric characters with the separator
 * 4. Collapse consecutive separators
 * 5. Trim leading/trailing separators
 * 6. Enforce maxLength (never cuts mid-word when possible)
 */
export function slugify(
  text: string,
  separator = "-",
  maxLength = 128,
): string {
  if (!text || typeof text !== "string") return "";

  let slug = text;

  // Step 1 – Transliterate
  slug = slug
    .split("")
    .map((char) => TRANSLITERATION_MAP[char] ?? char)
    .join("");

  // Step 2 – Lowercase
  slug = slug.toLowerCase();

  // Step 3 – Replace non-alphanumeric with separator
  const escapedSep = separator.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  slug = slug.replace(new RegExp(`[^a-z0-9${escapedSep}]`, "g"), separator);

  // Step 4 – Collapse consecutive separators
  slug = slug.replace(new RegExp(`${escapedSep}{2,}`, "g"), separator);

  // Step 5 – Trim edges
  slug = slug.replace(new RegExp(`^${escapedSep}|${escapedSep}$`, "g"), "");

  // Step 6 – Enforce maxLength (word-boundary aware)
  if (maxLength > 0 && slug.length > maxLength) {
    slug = slug.slice(0, maxLength);
    // Avoid cutting mid-word: trim trailing partial word
    const lastSep = slug.lastIndexOf(separator);
    if (lastSep > 0 && lastSep > maxLength * 0.6) {
      slug = slug.slice(0, lastSep);
    }
    // Clean trailing separator
    slug = slug.replace(new RegExp(`${escapedSep}$`), "");
  }

  return slug;
}

// ── Unique Slug Helper ───────────────────────

/**
 * Generate a slug that is guaranteed unique within the collection.
 * If the base slug already exists, appends -2, -3, … until unique.
 */
async function generateUniqueSlug(
  model: Model<Document>,
  baseSlug: string,
  slugField: string,
  excludeId?: unknown,
): Promise<string> {
  // Build a regex to find existing slugs matching baseSlug or baseSlug-N
  const escapedBase = baseSlug.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const pattern = new RegExp(`^${escapedBase}(-\\d+)?$`);

  const query: Record<string, unknown> = { [slugField]: pattern };
  if (excludeId) {
    query._id = { $ne: excludeId };
  }

  const existing = await model
    .find(query)
    .select(slugField)
    .lean<Array<Record<string, string>>>()
    .exec();

  if (existing.length === 0) return baseSlug;

  // Extract numeric suffixes from existing slugs
  const existingSlugs = new Set(existing.map((doc) => doc[slugField]));

  if (!existingSlugs.has(baseSlug)) return baseSlug;

  // Find the next available suffix
  let counter = 2;
  while (existingSlugs.has(`${baseSlug}-${counter}`)) {
    counter++;
  }

  return `${baseSlug}-${counter}`;
}

// ── Mongoose Plugin ──────────────────────────

/**
 * Mongoose plugin that adds automatic slug generation to a schema.
 *
 * @example
 * ```ts
 * import { slugGeneratorPlugin } from "@/lib/mongoose-plugins/slugGenerator";
 *
 * const BlogPostSchema = new Schema({ title: String, ... });
 * BlogPostSchema.plugin(slugGeneratorPlugin, { sourceField: "title" });
 * ```
 */
export function slugGeneratorPlugin(
  schema: Schema,
  options?: SlugGeneratorOptions,
): void {
  const config = { ...DEFAULTS, ...options };
  const { sourceField, slugField, separator, maxLength, maxRetries } = config;

  // ── Add the slug field to the schema ────────
  schema.add({
    [slugField]: {
      type: String,
      unique: true,
      index: true,
      trim: true,
    },
  });

  // ── Pre-save hook ──────────────────────────
  schema.pre("save", async function () {
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const doc = this;
    const source = doc.get(sourceField) as string | undefined;

    // Only generate if:
    // 1. The slug is empty/missing, OR
    // 2. The source field has been modified (and slug was auto-generated before)
    const needsSlug =
      !doc.get(slugField) ||
      (doc.isModified(sourceField) && !doc.isModified(slugField));

    if (!needsSlug || !source) return;

    const baseSlug = slugify(source, separator, maxLength);
    if (!baseSlug) return;

    // Attempt to set a unique slug with retry on E11000
    let attempts = 0;

    const trySetSlug = async (): Promise<void> => {
      try {
        const uniqueSlug = await generateUniqueSlug(
          doc.constructor as Model<Document>,
          baseSlug,
          slugField,
          doc._id,
        );
        doc.set(slugField, uniqueSlug);
      } catch (err: unknown) {
        const error = err as { code?: number };
        if (error.code === 11000 && attempts < maxRetries) {
          attempts++;
          return trySetSlug();
        }
        throw err;
      }
    };

    await trySetSlug();
  });

  // ── Pre-findOneAndUpdate hook ──────────────
  if (config.forceRegenerateOnUpdate) {
    schema.pre("findOneAndUpdate", async function () {
      const update = this.getUpdate() as Record<string, unknown> | null;
      if (!update) return;

      // Handle both flat updates and $set updates
      const flatUpdate = update[sourceField] as string | undefined;
      const setUpdate = (update.$set as Record<string, unknown> | undefined)?.[
        sourceField
      ] as string | undefined;

      const newSourceValue = flatUpdate ?? setUpdate;

      // If the source field is being updated AND no explicit slug is provided
      const hasExplicitSlug =
        update[slugField] ||
        (update.$set as Record<string, unknown> | undefined)?.[slugField];

      if (!newSourceValue || hasExplicitSlug) return;

      const baseSlug = slugify(newSourceValue, separator, maxLength);
      if (!baseSlug) return;

      // Get the current document's _id to exclude it from uniqueness check
      const filter = this.getFilter();
      const model = this.model;

      const uniqueSlug = await generateUniqueSlug(
        model,
        baseSlug,
        slugField,
        filter._id,
      );

      // Inject the slug into the update
      if (update.$set) {
        (update.$set as Record<string, unknown>)[slugField] = uniqueSlug;
      } else {
        update[slugField] = uniqueSlug;
      }
    });
  }

  // ── Static: findBySlug ─────────────────────
  schema.statics.findBySlug = function (slug: string) {
    return this.findOne({ [slugField]: slug });
  };
}

// ── Type Helpers ─────────────────────────────

/**
 * Interface to extend your Model type with the findBySlug static.
 *
 * @example
 * ```ts
 * interface IBlogPostModel extends Model<IBlogPost>, SlugModel<IBlogPost> {}
 * ```
 */
export interface SlugModel<T> {
  findBySlug(slug: string): ReturnType<Model<T>["findOne"]>;
}
