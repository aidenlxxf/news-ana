import type {
  ApiErrorResponse,
  AuthResponseDto,
  CreatePushSubscriptionDtoType,
  CreateTaskDtoType,
  CreateTaskResponseDto,
  GetLatestResultResponseDto,
  GetTaskResponseDto,
  ListTasksResponseDto,
  LoginDto,
  RefreshTaskResponseDto,
  RegisterDto,
  TaskExecution,
  UpdateTaskDtoType,
  UpdateTaskResponseDto,
  UserProfileDto,
} from "@na/schema";
import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";

// Backend API base URL
const API_BASE_URL = process.env.BACKEND_HOST || "http://localhost:3001";

// Generic API call function with error handling
async function apiCall<Res>(
  endpoint: string,
  options?: RequestInit & { no401Redirect?: boolean },
): Promise<Res>;
async function apiCall<Res, Req>(
  endpoint: string,
  options: Omit<RequestInit, "body"> & {
    jsonBody: Req;
    no401Redirect?: boolean;
  },
): Promise<Res>;
async function apiCall<Res, Req = undefined>(
  endpoint: string,
  options: RequestInit & { jsonBody?: Req; no401Redirect?: boolean } = {},
): Promise<Res> {
  const url = `${API_BASE_URL}${endpoint}`;
  const { jsonBody, body, no401Redirect, ...rest } = options;
  const authCookie = (await cookies()).get(
    process.env.AUTH_COOKIE_NAME || "auth_token",
  );
  const response = await fetch(url, {
    ...rest,
    credentials: "include", // Include cookies for JWT authentication
    headers: {
      ...(authCookie ? { Authorization: `Bearer ${authCookie.value}` } : {}),
      ...(jsonBody ? { "Content-Type": "application/json" } : {}),
      ...options.headers,
    },
    body:
      "body" in options
        ? body
        : "jsonBody" in options
          ? JSON.stringify(jsonBody)
          : undefined,
  });

  if (response.status === 401 && !no401Redirect) {
    redirect("/login");
  }
  if (response.status === 404) {
    notFound();
  }

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

export async function updateTask(
  taskId: string,
  taskData: UpdateTaskDtoType,
): Promise<UpdateTaskResponseDto> {
  return apiCall<UpdateTaskResponseDto, UpdateTaskDtoType>(
    `/news-analysis/tasks/${taskId}`,
    {
      method: "PUT",
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

// Notification API Functions
export async function subscribeWebPush(
  subscription: CreatePushSubscriptionDtoType,
): Promise<{ success: boolean }> {
  return apiCall<{ success: boolean }, CreatePushSubscriptionDtoType>(
    "/notifications/subscriptions",
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
    `/notifications/subscriptions/${endpointHash}`,
    {
      method: "DELETE",
    },
  );
}

export async function getUserProfile(token: string): Promise<UserProfileDto> {
  return apiCall<UserProfileDto>("/auth/profile", {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}

// Authentication API Functions
export async function login(
  username: string,
  password: string,
): Promise<AuthResponseDto> {
  const resp = await fetch(`${API_BASE_URL}/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ username, password } satisfies LoginDto),
  });
  if (!resp.ok) {
    const errorData: ApiErrorResponse = await resp.json();
    throw new Error(errorData.message);
  }
  return (await resp.json()) as AuthResponseDto;
}

export async function register(
  username: string,
  password: string,
): Promise<AuthResponseDto> {
  const resp = await fetch(`${API_BASE_URL}/auth/register`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ username, password } satisfies RegisterDto),
  });
  if (!resp.ok) {
    const errorData: ApiErrorResponse = await resp.json();
    throw new Error(errorData.message);
  }
  return (await resp.json()) as AuthResponseDto;
}
