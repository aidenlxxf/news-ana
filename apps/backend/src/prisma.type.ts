import type { TaskParameters as TaskParametersType } from "@na/schema";
import type { NewsAnalysisResult as NewsAnalysisResultType } from "@na/schema";

declare global {
  namespace PrismaJson {
    type TaskParameters = TaskParametersType;
    type NewsAnalysisResult = NewsAnalysisResultType;
  }
}
