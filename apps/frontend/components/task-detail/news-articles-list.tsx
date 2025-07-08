import type { NewsArticle } from "@na/schema";
import { Building, Calendar, ExternalLink, User } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import NewsArticleImage from "./news-article-image";

interface NewsArticlesListProps {
  articles: NewsArticle[];
  executionId: string;
  maxItems?: number;
}

export default function NewsArticlesList({
  articles,
  executionId,
  maxItems = 10,
}: NewsArticlesListProps) {
  const displayArticles = articles.slice(0, maxItems);

  if (articles.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">No news articles</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {displayArticles.map((article, index) => (
        <Card key={article.url} className="hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <div className="flex gap-4">
              {/* Article image */}
              {article.urlToImage && (
                <div className="flex-shrink-0">
                  <NewsArticleImage
                    src={`/image/${executionId}/${index}`}
                    alt={article.title}
                  />
                </div>
              )}

              {/* Article content */}
              <div className="flex-1 min-w-0">
                {/* Title */}
                <h4 className="font-semibold text-gray-900 mb-2 line-clamp-2">
                  {article.title}
                </h4>

                {/* Description */}
                {article.description && (
                  <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                    {article.description}
                  </p>
                )}

                {/* Meta information */}
                <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500 mb-3">
                  {/* Source */}
                  <div className="flex items-center gap-1">
                    <Building className="h-3 w-3" />
                    <span>{article.source.name}</span>
                  </div>

                  {/* Author */}
                  {article.author && (
                    <div className="flex items-center gap-1">
                      <User className="h-3 w-3" />
                      <span className="truncate max-w-32">
                        {article.author}
                      </span>
                    </div>
                  )}

                  {/* Published time */}
                  <div className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    <span>
                      {new Date(article.publishedAt).toLocaleString("en-US", {
                        month: "2-digit",
                        day: "2-digit",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                </div>

                {/* Action buttons */}
                <div className="space-y-2">
                  <div>
                    <Button
                      asChild
                      variant="outline"
                      size="sm"
                      className="text-xs"
                    >
                      <a
                        href={article.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1"
                      >
                        <ExternalLink className="h-3 w-3" />
                        Read Original
                      </a>
                    </Button>
                  </div>

                  {/* Content preview (if available) */}
                  {article.content && (
                    <div className="text-xs text-gray-400 leading-relaxed">
                      {article.content.length > 100
                        ? `${article.content.substring(0, 100)}...`
                        : article.content}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}

      {/* Show more hint */}
      {articles.length > maxItems && (
        <div className="text-center py-4">
          <p className="text-sm text-gray-500">
            Showing {maxItems} / {articles.length} articles
          </p>
        </div>
      )}
    </div>
  );
}
