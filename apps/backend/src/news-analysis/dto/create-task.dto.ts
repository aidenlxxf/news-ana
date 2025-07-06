import { NewsApiCategorySchema, NewsApiCountrySchema } from "@/news-analysis/schema/task-parameters.schema";
import { ValibotDto } from "../../validators/valibot.dto";
import * as v from "valibot";

const CreateTaskSchema = v.pipe(
  v.strictObject({
    country: v.optional(NewsApiCountrySchema),
    category: v.optional(NewsApiCategorySchema),
    query: v.optional(v.string()),
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
  v.brand("CreateTaskSchema"),
);

export type CreateTaskDtoType = v.InferOutput<typeof CreateTaskSchema>;

export class CreateTaskDto extends ValibotDto(CreateTaskSchema) {}

export type CreateTaskResponseDto = {
  taskId: string;
  message: string;
};
