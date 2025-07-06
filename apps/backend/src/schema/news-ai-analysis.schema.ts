import * as v from "valibot";

const EntityTypeSchema = v.picklist([
  "PERSON",
  "ORGANIZATION",
  "LOCATION",
  "PRODUCT",
  "EVENT",
]);

export type EntityType = v.InferOutput<typeof EntityTypeSchema>;

export const SentimentTypeSchema = v.picklist(["positive", "negative", "neutral"]);
export type SentimentType = v.InferOutput<typeof SentimentTypeSchema>;

export const NewsEntitySchema = v.object({
  name: v.string(),
  type: EntityTypeSchema,
});
export type NewsEntity = v.InferOutput<typeof NewsEntitySchema>;

export const BriefSummarySchema = v.object({
  text: v.string(),
  keywords: v.array(v.string()),
  sentiment: SentimentTypeSchema,
});
export type BriefSummary = v.InferOutput<typeof BriefSummarySchema>;

export const newsAIAnalysisOutputSchema = v.object({
  briefSummary: BriefSummarySchema,
  detailedSummary: v.string(),
  sentiment: SentimentTypeSchema,
  entities: v.array(NewsEntitySchema),
});
export type NewsAIAnalysisOutput = v.InferOutput<typeof newsAIAnalysisOutputSchema>;


