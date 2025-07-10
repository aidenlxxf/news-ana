import * as v from "valibot";
import { TaskBaseParametersSchema } from "../news-analysis/task-parameters.schema.js";
import { formInteger } from "../utils/form-helpers.js";

// Create Task Schema
export const CreateTaskSchema = TaskBaseParametersSchema;

// Update Task Schema
export const UpdateTaskSchema = v.pipe(
  v.object({
    ...TaskBaseParametersSchema.entries,
    immediately: v.optional(v.boolean()),
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

// List Tasks Query Schema
export const ListTasksQuerySchema = v.object({
  limit: v.pipe(formInteger(20), v.minValue(1)),
  offset: v.pipe(formInteger(0), v.minValue(0)),
});

// List Task Executions Query Schema
export const ListTaskExecutionsQuerySchema = v.object({
  limit: v.pipe(formInteger(20), v.minValue(1)),
  offset: v.pipe(formInteger(0), v.minValue(0)),
});

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
