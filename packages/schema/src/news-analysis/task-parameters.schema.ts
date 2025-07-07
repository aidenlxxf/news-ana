import * as v from "valibot";

export const NewsApiCountrySchema = v.picklist([
  "ae",
  "ar",
  "at",
  "au",
  "be",
  "bg",
  "br",
  "ca",
  "ch",
  "cn",
  "co",
  "cu",
  "cz",
  "de",
  "eg",
  "fr",
  "gb",
  "gr",
  "hk",
  "hu",
  "id",
  "ie",
  "il",
  "in",
  "it",
  "jp",
  "kr",
  "lt",
  "lv",
  "ma",
  "mx",
  "my",
  "ng",
  "nl",
  "no",
  "nz",
  "ph",
  "pl",
  "pt",
  "ro",
  "rs",
  "ru",
  "sa",
  "se",
  "sg",
  "si",
  "sk",
  "th",
  "tr",
  "tw",
  "ua",
  "us",
  "ve",
  "za",
]);

export const NewsApiCategorySchema = v.picklist([
  "business",
  "entertainment",
  "general",
  "health",
  "science",
  "sports",
  "technology",
]);

export type NewsApiCountry = v.InferOutput<typeof NewsApiCountrySchema>;
export type NewsApiCategory = v.InferOutput<typeof NewsApiCategorySchema>;

export const TaskParametersV1Schema = v.pipe(
  v.object({
    country: v.nullish(NewsApiCountrySchema),
    category: v.nullish(NewsApiCategorySchema),
    query: v.nullish(v.string()),
    version: v.literal("news-fetch:v1"),
  }),
  v.check(
    (params) =>
      !(
        params.category === undefined &&
        params.country === undefined &&
        params.query === undefined
      ),
    "at least one of country, category, or query must be provided",
  ),
  v.transform((params) => ({
    ...params,
    country: params.country ?? null,
    category: params.category ?? null,
    query: params.query ?? null,
  })),
  v.brand("TaskParametersV1Schema"),
);

export type TaskParametersV1 = v.InferOutput<typeof TaskParametersV1Schema>;

export type TaskParameters = TaskParametersV1;
