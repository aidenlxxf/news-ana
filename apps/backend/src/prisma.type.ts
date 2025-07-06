import type { TaskParameters as TaskParametersType } from "./schema/task-parameters.schema";
import type { NewsAnalysisResult as NewsAnalysisResultType } from "./schema/news-analysis.schema";

declare global {
  namespace PrismaJson {
    type TaskParameters = TaskParametersType;
    type NewsAnalysisResult = NewsAnalysisResultType;
  }
}
