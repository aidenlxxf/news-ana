import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { generateObject } from "ai";
import { createOpenAI } from "@ai-sdk/openai";
import { valibotSchema } from "@ai-sdk/valibot";
import {
  NewsAIAnalysisOutput,
  newsAIAnalysisOutputSchema,
} from "../schema/news-ai-analysis.schema";
import { TaskParametersV1 } from "../schema/task-parameters.schema";
import {
  NewsAnalysisResultV1Fetched,
  NewsAnalysisResultV1Analyzed,
  NewsArticle,
  NewsAnalysisResultV1,
} from "../schema/news-analysis.schema";

const SYSTEM_PROMPT = `You are a professional news analyst. Your task is to analyze a collection of news articles and provide a structured analysis in JSON format.

Based on the provided articles, you must provide:
1. A brief summary: A single sentence summarizing the main points, suitable for push notifications (100-150 characters).
2. A detailed summary: A comprehensive analysis including background information, main viewpoints, trend analysis, and impact assessment.
3. An overall sentiment analysis: 'positive', 'negative', or 'neutral'.
4. Key entity extraction: Including PERSON, ORGANIZATION, LOCATION, PRODUCT, EVENT.

Ensure your analysis is objective and based strictly on the content of the provided articles.`;


const USER_PROMPT_TEMPLATE = (
  params: TaskParametersV1,
  articles: NewsArticle[],
) => `Please analyze the following news articles about ${JSON.stringify(params)}:

${articles
  .map((article, index) =>
    `
Article ${index + 1}:
Title: ${article.title}
Description: ${article.description || "No description"}
Content: ${article.content || "No content"}
Source: ${article.source.name || "Unknown source"}
Published At: ${article.publishedAt}
---`.trim(),
  )
  .join("\n\n")}`;

@Injectable()
export class NewsAnalysisService {
  private readonly logger = new Logger(NewsAnalysisService.name);
  private readonly openai;

  constructor(private readonly configService: ConfigService) {
    this.openai = createOpenAI({
      compatibility: "strict",
      apiKey: this.configService.get<string>("OPENAI_API_KEY"),
    });
  }

  async analyzeNews(
    fetchedResult: NewsAnalysisResultV1Fetched,
    params: TaskParametersV1,
  ): Promise<NewsAnalysisResultV1> {
    this.logger.log(`Starting AI analysis for ${fetchedResult.articles.length} articles.`);

    try {
      if (fetchedResult.articles.length === 0) {
        this.logger.log(
          "No articles found, skipping AI analysis and using default result.",
        );

        this.logger.log("AI analysis finished with no articles.");
        return fetchedResult;
      }

      const aiAnalysis = await this.performAIAnalysis(fetchedResult.articles, params);
      this.logger.log("AI analysis complete.");

      const result = this.createAnalyzedResult(fetchedResult, aiAnalysis);
      this.logger.log("AI analysis finished.");
      return result;
    } catch (error) {
      this.logger.error("AI analysis failed.", error);
      throw error;
    }
  }

  private async performAIAnalysis(
    articles: NewsArticle[],
    params: TaskParametersV1,
  ): Promise<NewsAIAnalysisOutput> {
    try {
      const { object: result } = await generateObject({
        model: this.openai("gpt-4o-mini"),
        schema: valibotSchema(newsAIAnalysisOutputSchema),
        messages: [
          {
            role: "system",
            content: SYSTEM_PROMPT,
          },
          {
            role: "user",
            content: USER_PROMPT_TEMPLATE(params, articles),
          },
        ],
        temperature: 0.3, // Lower temperature for more consistent results
      });

      if (!result) {
        throw new Error("OpenAI returned an empty result.");
      }

      return result;
    } catch (error) {
      this.logger.error("OpenAI analysis failed.", error);
      throw new Error(`AI analysis failed: ${error.message}`);
    }
  }

  private createAnalyzedResult(
    fetchedResult: NewsAnalysisResultV1Fetched,
    aiAnalysis: NewsAIAnalysisOutput,
  ): NewsAnalysisResultV1Analyzed {
    const now = new Date().toISOString();

    return {
      articles: fetchedResult.articles,
      sources: fetchedResult.sources,
      fetchedAt: fetchedResult.fetchedAt,
      analysis: {
        briefSummary: aiAnalysis.briefSummary,
        detailedSummary: aiAnalysis.detailedSummary,
        sentiment: aiAnalysis.sentiment,
        entities: aiAnalysis.entities,
      },
      analyzedAt: now,
      version: "news-analysis:v1",
    };
  }
}
