import * as v from "valibot";
import {
  BriefSummarySchema,
  NewsEntitySchema,
  SentimentTypeSchema,
} from "./news-ai-analysis.schema.js";

export const NewsArticleSchema = v.object({
  source: v.object({
    id: v.nullable(v.string()),
    name: v.string(),
  }),
  author: v.nullable(v.string()),
  title: v.string(),
  description: v.nullable(v.string()),
  url: v.string(),
  urlToImage: v.nullable(v.string()),
  /** ISO timestamp */
  publishedAt: v.string(),
  content: v.nullable(v.string()),
});
export type NewsArticle = v.InferOutput<typeof NewsArticleSchema>;

// Fetched state - news data retrieved but not yet analyzed
export const NewsAnalysisResultV1FetchedSchema = v.object({
  articles: v.array(NewsArticleSchema),
  sources: v.array(v.string()),
  /** ISO timestamp */
  fetchedAt: v.string(),
  analysis: v.null(),
  analyzedAt: v.null(),
  version: v.literal("news-analysis:v1"),
  articleCount: v.number(),
  hasArticles: v.boolean(),
});

// Analyzed state - complete with AI analysis
export const NewsAnalysisResultV1AnalyzedSchema = v.object({
  articles: v.array(NewsArticleSchema),
  sources: v.array(v.string()),
  /** ISO timestamp */
  fetchedAt: v.string(),
  analysis: v.object({
    briefSummary: BriefSummarySchema,
    detailedSummary: v.string(),
    sentiment: SentimentTypeSchema,
    entities: v.array(NewsEntitySchema),
  }),
  analyzedAt: v.string(),
  version: v.literal("news-analysis:v1"),
});

// Union type supporting both states
export const NewsAnalysisResultV1Schema = v.union([
  NewsAnalysisResultV1FetchedSchema,
  NewsAnalysisResultV1AnalyzedSchema,
]);

export type NewsAnalysisResultV1Fetched = v.InferOutput<
  typeof NewsAnalysisResultV1FetchedSchema
>;
export type NewsAnalysisResultV1Analyzed = v.InferOutput<
  typeof NewsAnalysisResultV1AnalyzedSchema
>;
export type NewsAnalysisResultV1 = v.InferOutput<
  typeof NewsAnalysisResultV1Schema
>;

export type NewsAnalysisResult = NewsAnalysisResultV1;

// Type guard functions
export function isFetchedResult(
  result: NewsAnalysisResultV1,
): result is NewsAnalysisResultV1Fetched {
  return result.analysis === null;
}

export function isAnalyzedResult(
  result: NewsAnalysisResultV1,
): result is NewsAnalysisResultV1Analyzed {
  return result.analysis !== null;
}
