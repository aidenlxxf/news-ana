import type {
  NewsAnalysisResult as NewsAnalysisResultType,
  TaskParameters as TaskParametersType,
} from "@na/schema";

declare global {
  namespace PrismaJson {
    type TaskParameters = TaskParametersType;
    type NewsAnalysisResult = NewsAnalysisResultType;
  }
}
