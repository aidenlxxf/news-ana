import type {
  GetLatestResultResponseDto,
  NewsAnalysisResult,
} from "@na/schema";
import { isAnalyzedResult, isFetchedResult } from "@na/schema";
import { AlertCircle, FileText, Loader2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import EntityList from "./entity-list";
import NewsArticlesList from "./news-articles-list";

interface AnalysisResultProps {
  latestResult: GetLatestResultResponseDto;
}

function SentimentBadge({
  sentiment,
}: {
  sentiment: "positive" | "negative" | "neutral";
}) {
  const colors = {
    positive: "bg-green-100 text-green-800",
    negative: "bg-red-100 text-red-800",
    neutral: "bg-gray-100 text-gray-800",
  };

  const labels = {
    positive: "Positive",
    negative: "Negative",
    neutral: "Neutral",
  };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colors[sentiment]}`}
    >
      {labels[sentiment]}
    </span>
  );
}

export default function AnalysisResult({ latestResult }: AnalysisResultProps) {
  // No result state
  if (!latestResult.hasResult || !latestResult.execution) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Analysis Result
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No Analysis Result
            </h3>
            <p className="text-gray-600">
              Task has not been completed or failed. Please check back later or
              manually refresh the task.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const result = latestResult.execution.result as NewsAnalysisResult;

  // Fetch only state (not analyzed)
  if (isFetchedResult(result)) {
    // Check if no articles were found
    if (result.articles.length === 0) {
      return (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Analysis Result
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8">
              <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No News Articles Found
              </h3>
              <p className="text-gray-600">
                No relevant news articles were found for your search criteria.
                Try adjusting your search parameters or check back later.
              </p>
            </div>
          </CardContent>
        </Card>
      );
    }

    // Articles found, analysis in progress
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Analysis Result
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <Alert>
            <Loader2 className="h-4 w-4 animate-spin" />
            <AlertDescription>
              News data has been fetched, AI analysis is in progress, please
              wait...
            </AlertDescription>
          </Alert>

          {/* Show fetched news articles */}
          <div>
            <h3 className="text-lg font-semibold mb-4">
              Fetched News Articles
            </h3>
            <NewsArticlesList
              articles={result.articles}
              executionId={latestResult.execution.id}
            />
          </div>

          {/* Fetch information */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="font-medium text-gray-900 mb-2">
              Fetch Information
            </h4>
            <div className="text-sm text-gray-600 space-y-1">
              <p>
                Fetch time: {new Date(result.fetchedAt).toLocaleString("en-US")}
              </p>
              <p>Article count: {result.articles.length}</p>
              <p>Data sources: {result.sources.join(", ")}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Complete analysis state
  if (isAnalyzedResult(result)) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Analysis Result
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Brief summary */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <h3 className="text-lg font-semibold">Brief Summary</h3>
              <SentimentBadge
                sentiment={result.analysis.briefSummary.sentiment}
              />
            </div>
            <p className="text-gray-700 leading-relaxed">
              {result.analysis.briefSummary.text}
            </p>
          </div>

          {/* Keywords */}
          <div>
            <h3 className="text-lg font-semibold mb-3">Keywords</h3>
            <div className="flex flex-wrap gap-2">
              {result.analysis.briefSummary.keywords.map((keyword, index) => (
                <span
                  // biome-ignore lint/suspicious/noArrayIndexKey: server component
                  key={`${keyword}-${index}`}
                  className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800"
                >
                  {keyword}
                </span>
              ))}
            </div>
          </div>

          {/* Detailed summary */}
          <div>
            <h3 className="text-lg font-semibold mb-3">Detailed Analysis</h3>
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                {result.analysis.detailedSummary}
              </p>
            </div>
          </div>

          {/* Entity recognition */}
          {result.analysis.entities.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold mb-3">
                Identified Entities
              </h3>
              <EntityList entities={result.analysis.entities} />
            </div>
          )}

          {/* News articles */}
          <div>
            <h3 className="text-lg font-semibold mb-3">Related News</h3>
            <NewsArticlesList
              articles={result.articles}
              executionId={latestResult.execution.id}
            />
          </div>

          {/* Analysis information */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="font-medium text-gray-900 mb-2">
              Analysis Information
            </h4>
            <div className="text-sm text-gray-600 space-y-1">
              <p>
                Fetch time: {new Date(result.fetchedAt).toLocaleString("en-US")}
              </p>
              <p>
                Analysis time:{" "}
                {new Date(result.analyzedAt).toLocaleString("en-US")}
              </p>
              <p>Article count: {result.articles.length}</p>
              <p>
                Overall sentiment:{" "}
                <SentimentBadge sentiment={result.analysis.sentiment} />
              </p>
              <p>Data sources: {result.sources.join(", ")}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Unknown state
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Analysis Result
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Result data format is abnormal, please contact the administrator.
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
}
