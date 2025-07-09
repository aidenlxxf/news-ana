import * as v from "valibot";
import { ScheduleSchema } from "./task-schedule.schema.js";
import { formNullish } from "../utils/form-helpers.js";

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

export const TaskBaseParametersSchema = v.pipe(
  v.object({
    country: formNullish(NewsApiCountrySchema),
    category: formNullish(NewsApiCategorySchema),
    query: formNullish(v.string()),
    schedule: ScheduleSchema,
  }),
  v.check(
    (params) =>
      !(
        params.category === null &&
        params.country === null &&
        params.query === null
      ),
    "at least one of country, category, or query must be provided",
  ),
);

export const TaskParametersV1Schema = v.pipe(
  v.object({
    ...TaskBaseParametersSchema.entries,
    version: v.literal("news-fetch:v1"),
  }),
);

export type TaskParametersV1 = v.InferOutput<typeof TaskParametersV1Schema>;

export type TaskParameters = TaskParametersV1;
