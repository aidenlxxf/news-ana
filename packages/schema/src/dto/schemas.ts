import * as v from "valibot";
import {
  NewsApiCategorySchema,
  NewsApiCountrySchema,
} from "../news-analysis/task-parameters.schema.js";
import { formNullish, formInteger } from "../utils/form-helpers.js";

// Create Task Schema
export const CreateTaskSchema = v.pipe(
  v.object({
    country: formNullish(NewsApiCountrySchema),
    category: formNullish(NewsApiCategorySchema),
    query: formNullish(v.string()),
  }),
  v.check(
    (params) => !!(params.category || params.country || params.query),
    "at least one of country, category, or query must be provided",
  ),
  v.brand("CreateTaskSchema"),
);

export type CreateTaskDtoType = v.InferOutput<typeof CreateTaskSchema>;

// List Tasks Query Schema
export const ListTasksQuerySchema = v.object({
  limit: v.pipe(formInteger(20), v.minValue(1)),
  offset: v.pipe(formInteger(0), v.minValue(0)),
});

export type ListTasksQueryType = v.InferOutput<typeof ListTasksQuerySchema>;

// List Task Executions Query Schema
export const ListTaskExecutionsQuerySchema = v.object({
  limit: v.pipe(formInteger(20), v.minValue(1)),
  offset: v.pipe(formInteger(0), v.minValue(0)),
});

export type ListTaskExecutionsQueryType = v.InferOutput<
  typeof ListTaskExecutionsQuerySchema
>;

/**
 * DOM API PushSubscriptionJSON
 * [MDN Reference](https://developer.mozilla.org/docs/Web/API/PushSubscription/toJSON)
 */
export const CreatePushSubscriptionSchema = v.object({
  endpoint: v.string(),
  expirationTime: v.nullish(
    v.pipe(
      v.string(),
      v.isoTimestamp(),
      v.transform((s) => new Date(s)),
    ),
  ),
  keys: v.object({
    p256dh: v.string(),
    auth: v.string(),
  }),
});

export type CreatePushSubscriptionDtoType = v.InferInput<
  typeof CreatePushSubscriptionSchema
>;
