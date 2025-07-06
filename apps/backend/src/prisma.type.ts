import type { TaskParameters as TaskParametersType } from "./news-analysis/schema/task-parameters.schema";
import type { NewsAnalysisResult as NewsAnalysisResultType } from "./news-analysis/schema/news-analysis.schema";

declare global {
  namespace PrismaJson {
    type TaskParameters = TaskParametersType;
    type NewsAnalysisResult = NewsAnalysisResultType;
  }
}
