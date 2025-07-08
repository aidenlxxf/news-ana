"use client";

import { AlertCircle, ArrowLeft, RefreshCw } from "lucide-react";
import Link from "next/link";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface ErrorPageProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function TaskDetailError({ error, reset }: ErrorPageProps) {
  useEffect(() => {
    console.error("Task detail page error:", error);
  }, [error]);

  const isNetworkError = error.message.includes("fetch");
  const isNotFoundError = error.message.includes("404");
  const isAuthError =
    error.message.includes("401") || error.message.includes("403");

  let errorTitle = "Load failed";
  let errorMessage = "Error loading task details";
  let suggestion = "Please try again later";

  if (isNotFoundError) {
    errorTitle = "Task not found";
    errorMessage =
      "The specified task may have been deleted or you do not have access to it";
    suggestion = "Please check the task ID or return to the task list";
  } else if (isAuthError) {
    errorTitle = "Permission denied";
    errorMessage = "You do not have permission to access this task";
    suggestion = "Please check your login status";
  } else if (isNetworkError) {
    errorTitle = "Network error";
    errorMessage = "Cannot connect to server";
    suggestion = "Please check your network connection and try again";
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Navigation */}
        <div className="mb-6">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to task list
          </Link>
        </div>

        {/* Error content */}
        <div className="flex items-center justify-center min-h-[400px]">
          <Card className="w-full max-w-md">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
                <AlertCircle className="h-6 w-6 text-red-600" />
              </div>
              <CardTitle className="text-xl font-semibold text-gray-900">
                {errorTitle}
              </CardTitle>
            </CardHeader>

            <CardContent className="text-center space-y-4">
              <p className="text-gray-600">{errorMessage}</p>

              <p className="text-sm text-gray-500">{suggestion}</p>

              {/* Error details (development environment) */}
              {process.env.NODE_ENV === "development" && (
                <details className="text-left">
                  <summary className="text-sm text-gray-400 cursor-pointer hover:text-gray-600">
                    Error details
                  </summary>
                  <pre className="mt-2 text-xs text-gray-500 bg-gray-50 p-2 rounded overflow-auto">
                    {error.message}
                    {error.digest && `\nDigest: ${error.digest}`}
                  </pre>
                </details>
              )}

              {/* Action buttons */}
              <div className="flex flex-col sm:flex-row gap-3 pt-4">
                <Button
                  className="flex items-center gap-2"
                  onClick={reset}
                  variant="default"
                >
                  <RefreshCw className="h-4 w-4" />
                  Retry
                </Button>
                <Button asChild variant="outline">
                  <Link href="/">Back to home</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
