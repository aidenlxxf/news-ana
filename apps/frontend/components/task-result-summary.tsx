import type { NewsAnalysisResult } from "@na/schema";
import { isAnalyzedResult, isFetchedResult } from "@na/schema";
import { FileText, Loader2, AlertCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { getLatestResult } from "@/lib/api";

interface TaskResultSummaryProps {
  taskId: string;
}

function getSentimentColor(sentiment: string): string {
  switch (sentiment) {
    case "positive":
      return "bg-green-100 text-green-800";
    case "negative":
      return "bg-red-100 text-red-800";
    case "neutral":
      return "bg-gray-100 text-gray-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
}

export default async function TaskResultSummary({
  taskId,
}: TaskResultSummaryProps) {
  try {
    const data = await getLatestResult(taskId);

    if (!data || !data.hasResult || !data.execution) {
      return (
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <FileText className="h-3 w-3" />
          <span>No results yet</span>
        </div>
      );
    }

    const result = data.execution.result as NewsAnalysisResult;

    if (isFetchedResult(result)) {
      return (
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <FileText className="h-3 w-3" />
            <span>{result.articles.length} articles fetched</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-blue-600">
            <Loader2 className="h-3 w-3 animate-spin" />
            <span>AI analysis in progress...</span>
          </div>
        </div>
      );
    }

    if (isAnalyzedResult(result)) {
      return (
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <FileText className="h-3 w-3" />
            <span>{result.articles.length} articles analyzed</span>
            <Badge
              variant="secondary"
              className={`text-xs ${getSentimentColor(result.analysis.sentiment)}`}
            >
              {result.analysis.sentiment}
            </Badge>
          </div>
          <div className="text-xs text-gray-700 line-clamp-2">
            {result.analysis.briefSummary.text}
          </div>
        </div>
      );
    }

    return (
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <AlertCircle className="h-3 w-3" />
        <span>Unknown result format</span>
      </div>
    );
  } catch (error) {
    console.error(`Failed to load task result summary:${taskId}`, error);
    return (
      <div className="flex items-center gap-2 text-sm text-red-500">
        <AlertCircle className="h-3 w-3" />
        <span>Failed to load result</span>
      </div>
    );
  }
}

export async function TaskResultSummarySkeleton() {
  return (
    <div className="flex items-center gap-2 text-sm text-gray-500">
      <Loader2 className="h-3 w-3 animate-spin" />
      <span>Loading result...</span>
    </div>
  );
}
