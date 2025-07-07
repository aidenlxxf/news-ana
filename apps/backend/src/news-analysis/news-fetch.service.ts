import {
  NewsAnalysisResultV1Fetched,
  NewsArticle,
  TaskParametersV1,
} from "@na/schema";
import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { distinct } from "@std/collections/distinct";
import { GetTopHeadlinesData, getTopHeadlines } from "@/clients/newsapi";
import { client as newsApiClient } from "@/clients/newsapi/client.gen";

@Injectable()
export class NewsFetchService {
  private readonly logger = new Logger(NewsFetchService.name);

  constructor(private readonly configService: ConfigService) {
    newsApiClient.setConfig({
      headers: {
        "X-Api-Key": this.configService.get<string>("NEWSAPI_API_KEY"),
      },
    });
  }

  async fetchNews(
    params: TaskParametersV1,
  ): Promise<NewsAnalysisResultV1Fetched> {
    this.logger.log(`Starting news fetch for: ${JSON.stringify(params)}`);

    try {
      const articles = await this.fetchNewsArticles(params);
      this.logger.log(`Fetched ${articles.length} articles.`);

      const result = this.createFetchedResult(articles);
      this.logger.log("News fetch finished.");
      return result;
    } catch (error) {
      this.logger.error("News fetch failed.", error);
      throw error;
    }
  }

  private async fetchNewsArticles(
    params: TaskParametersV1,
    {
      pageSize = 50,
    }: {
      pageSize?: number;
    } = {},
  ): Promise<NewsArticle[]> {
    try {
      const queryParams: GetTopHeadlinesData["query"] = { pageSize };

      if (params.country) queryParams.country = params.country;
      if (params.category) queryParams.category = params.category;
      if (params.query) queryParams.q = params.query;

      const response = await getTopHeadlines({ query: queryParams });

      this.logger.debug("NewsAPI response:", response.data);

      if (response.error) {
        throw new Error(`NewsAPI error: ${response.error.message}`);
      }

      return (
        response.data?.articles.map((article) => ({
          author: article.author || null,
          title: article.title,
          description: article.description || null,
          url: article.url,
          urlToImage: article.urlToImage || null,
          publishedAt: article.publishedAt,
          content: article.content || null,
          source: {
            id: article.source.id || null,
            name: article.source.name || "",
          },
        })) || []
      );
    } catch (error) {
      this.logger.error("Failed to fetch news data.", error);
      throw new Error(`Failed to fetch news data: ${error.message}`);
    }
  }

  private createFetchedResult(
    articles: NewsArticle[],
  ): NewsAnalysisResultV1Fetched {
    const now = new Date().toISOString();

    const sources = distinct(
      articles
        .map((article) => article.source.name)
        .filter((name) => name !== undefined && name !== null),
    );

    return {
      articles,
      sources,
      fetchedAt: now,
      analysis: null,
      analyzedAt: null,
      version: "news-analysis:v1",
    };
  }
}
