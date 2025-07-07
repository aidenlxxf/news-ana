import * as v from "valibot";
import { NewsApiCategorySchema, NewsApiCountrySchema } from "../news-analysis/task-parameters.schema.js";
import { formInteger } from "../utils/form-helpers.js";

// Create Task Schema
export const CreateTaskSchema = v.pipe(
  v.pick(
    v.object({
      country: v.nullish(NewsApiCountrySchema),
      category: v.nullish(NewsApiCategorySchema),
      query: v.nullish(v.string()),
    }),
    ["country", "category", "query"],
  ),
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
  v.brand("CreateTaskSchema"),
);

export type CreateTaskDtoType = v.InferOutput<typeof CreateTaskSchema>;

// List Tasks Query Schema
export const ListTasksQuerySchema = v.pick(
  v.object({
    limit: v.pipe(formInteger(20), v.minValue(1)),
    offset: v.pipe(formInteger(0), v.minValue(0)),
  }),
  ["limit", "offset"],
);

export type ListTasksQueryType = v.InferOutput<typeof ListTasksQuerySchema>;

// List Task Executions Query Schema
export const ListTaskExecutionsQuerySchema = v.pick(
  v.object({
    limit: v.pipe(formInteger(20), v.minValue(1)),
    offset: v.pipe(formInteger(0), v.minValue(0)),
  }),
  ["limit", "offset"],
);

export type ListTaskExecutionsQueryType = v.InferOutput<typeof ListTaskExecutionsQuerySchema>;

// Push Subscription Schema
export const PushSubscriptionSchema = v.object({
  endpoint: v.string(),
  keys: v.object({
    p256dh: v.string(),
    auth: v.string(),
  }),
});

export type PushSubscriptionType = v.InferOutput<typeof PushSubscriptionSchema>;
