import type {
  ApiErrorResponse,
  CreatePushSubscriptionDtoType,
  CreateTaskDtoType,
  CreateTaskResponseDto,
  GetLatestResultResponseDto,
  GetTaskResponseDto,
  ListTasksResponseDto,
  RefreshTaskResponseDto,
  TaskExecution,
} from "@na/schema";

// Backend API base URL - assuming backend runs on port 3001
const API_BASE_URL = process.env.BACKEND_HOST || "http://localhost:3001";

// Test credentials
const AUTH_USERNAME = "test";
const AUTH_PASSWORD = "password";

// Create Basic Auth header
function createAuthHeader(): string {
  const credentials = Buffer.from(`${AUTH_USERNAME}:${AUTH_PASSWORD}`).toString(
    "base64",
  );
  return `Basic ${credentials}`;
}

// Generic API call function with error handling
async function apiCall<Res>(
  endpoint: string,
  options?: RequestInit,
): Promise<Res>;
async function apiCall<Res, Req>(
  endpoint: string,
  options: Omit<RequestInit, "body"> & { jsonBody: Req },
): Promise<Res>;
async function apiCall<Res, Req = undefined>(
  endpoint: string,
  options: RequestInit & { jsonBody?: Req } = {},
): Promise<Res> {
  const url = `${API_BASE_URL}${endpoint}`;
  const { jsonBody, body, ...rest } = options;
  const response = await fetch(url, {
    ...rest,
    headers: {
      Authorization: createAuthHeader(),
      "Content-Type": "application/json",
      ...options.headers,
    },
    body:
      "body" in options
        ? body
        : "jsonBody" in options
          ? JSON.stringify(jsonBody)
          : undefined,
  });

  if (!response.ok) {
    let errorMessage = `HTTP ${response.status}: ${response.statusText}`;

    try {
      const errorData: ApiErrorResponse = await response.json();
      errorMessage = errorData.message || errorMessage;
    } catch {
      // If JSON parsing fails, use the default error message
    }

    throw new Error(errorMessage);
  }

  return response.json() as Promise<Res>;
}

// API Functions
export async function listTasks(
  limit = 20,
  offset = 0,
): Promise<ListTasksResponseDto> {
  const params = new URLSearchParams({
    limit: limit.toString(),
    offset: offset.toString(),
  });

  return apiCall<ListTasksResponseDto>(`/news-analysis/tasks?${params}`);
}

export async function createTask(
  taskData: CreateTaskDtoType,
): Promise<CreateTaskResponseDto> {
  return apiCall<CreateTaskResponseDto, CreateTaskDtoType>(
    "/news-analysis/tasks",
    {
      method: "POST",
      jsonBody: taskData,
    },
  );
}

export async function getTask(taskId: string): Promise<GetTaskResponseDto> {
  return apiCall<GetTaskResponseDto>(`/news-analysis/tasks/${taskId}`);
}

export async function deleteTask(taskId: string): Promise<{ message: string }> {
  return apiCall<{ message: string }>(`/news-analysis/tasks/${taskId}`, {
    method: "DELETE",
  });
}

export async function refreshTask(
  taskId: string,
): Promise<RefreshTaskResponseDto> {
  return apiCall<RefreshTaskResponseDto>(
    `/news-analysis/tasks/${taskId}/refresh`,
    {
      method: "POST",
    },
  );
}

export async function getLatestResult(
  taskId: string,
): Promise<GetLatestResultResponseDto> {
  return apiCall<GetLatestResultResponseDto>(
    `/news-analysis/tasks/${taskId}/latest-result`,
  );
}

export async function getExecution(
  executionId: string,
): Promise<TaskExecution> {
  return apiCall<TaskExecution>(`/news-analysis/executions/${executionId}`);
}

// WebPush API Functions
export async function subscribeWebPush(
  subscription: CreatePushSubscriptionDtoType,
): Promise<{ success: boolean }> {
  return apiCall<{ success: boolean }, CreatePushSubscriptionDtoType>(
    "/webpush/subscriptions",
    {
      method: "POST",
      jsonBody: subscription,
    },
  );
}

export async function unsubscribeWebPush({
  endpointHash,
}: {
  endpointHash: string;
}): Promise<{ success: boolean }> {
  return apiCall<{ success: boolean }>(
    `/webpush/subscriptions/${endpointHash}`,
    {
      method: "DELETE",
    },
  );
}
