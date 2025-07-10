"use client";

import { useEffect, useState } from "react";
import { useChat } from "@ai-sdk/react";
import { MessageCircle, Send, RotateCcw, Settings, Plus } from "lucide-react";
import type { TaskSummary, ListTasksResponseDto } from "@na/schema";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import TaskSelector from "./task-selector";
import { useRouter } from "next/navigation";

type ChatMode = "create" | "modify";

interface TaskConfigurationChatProps {
  tasksPromise: Promise<ListTasksResponseDto>;
}

export default function TaskConfigurationChat({
  tasksPromise,
}: TaskConfigurationChatProps) {
  const [mode, setMode] = useState<ChatMode>("create");
  const [selectedTask, setSelectedTask] = useState<TaskSummary | null>(null);
  const router = useRouter();

  const {
    messages,
    input,
    handleInputChange,
    handleSubmit,
    error,
    status,
    setMessages,
  } = useChat({
    api: "/api/task-chat",
    onFinish: () => {
      router.refresh();
    },
    body: {
      mode,
      selectedTask,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC",
    },
  });
  useEffect(() => {
    if (error) {
      console.error(error);
    }
  }, [error]);

  const handleModeChange = (newMode: ChatMode) => {
    setMode(newMode);
    setSelectedTask(null);
    setMessages([]); // Reset conversation when changing modes
  };

  const handleTaskSelect = (task: TaskSummary) => {
    setSelectedTask(task);
    setMessages([]); // Reset conversation when selecting a different task
  };

  const handleReset = () => {
    setMessages([]);
    if (mode === "modify") {
      setSelectedTask(null);
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    // For modify mode, ensure a task is selected
    if (mode === "modify" && !selectedTask) {
      alert("Please select a task to modify first.");
      return;
    }

    handleSubmit(e);
  };

  return (
    <Card className="w-full mb-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageCircle className="h-5 w-5" />
          AI Task Configuration Assistant
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Mode Selection */}
        <Tabs
          value={mode}
          onValueChange={(value) => handleModeChange(value as ChatMode)}
        >
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="create" className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Create Task
            </TabsTrigger>
            <TabsTrigger value="modify" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Modify Task
            </TabsTrigger>
          </TabsList>

          <TabsContent value="create" className="space-y-4">
            <div className="text-sm text-gray-600">
              Describe the news analysis task you want to create. I can help you
              set up the country, category, search query, and schedule.
            </div>
          </TabsContent>

          <TabsContent value="modify" className="space-y-4">
            <div className="text-sm text-gray-600">
              Select an existing task to modify its configuration. I can help
              you update the country, category, search query, or schedule.
            </div>
          </TabsContent>
        </Tabs>

        {/* Separator */}
        <div className="border-t border-gray-200 mt-2" />

        {mode === "modify" && (
          <TaskSelector
            onTaskSelect={handleTaskSelect}
            selectedTask={selectedTask}
            tasksPromise={tasksPromise}
          />
        )}

        {/* Chat Messages */}
        <div className="space-y-3 min-h-[200px] max-h-[400px] overflow-y-auto border rounded-md p-4 bg-gray-50">
          {messages.length === 0 ? (
            <div className="text-center text-gray-500 py-8">
              <MessageCircle className="h-8 w-8 mx-auto mb-2 text-gray-400" />
              <p className="text-balance">
                {mode === "create"
                  ? "Start a conversation to create a new task. For example: 'Create a task to monitor tech news in the US every hour'"
                  : selectedTask
                    ? "Ask me to modify the selected task. For example: 'Change the schedule to run daily at 9 AM'"
                    : "Please select a task to modify first."}
              </p>
            </div>
          ) : (
            messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[80%] rounded-lg px-3 py-2 ${
                    message.role === "user"
                      ? "bg-blue-500 text-white"
                      : "bg-white border shadow-sm"
                  }`}
                >
                  <div className="text-sm">{message.content}</div>

                  {/* Display tool calls */}
                  {message.parts
                    ?.filter((part) => part.type === "tool-invocation")
                    .map((part) => (
                      <div
                        key={part.toolInvocation.toolCallId}
                        className="mt-2 p-2 bg-gray-100 rounded text-xs"
                      >
                        <div className="font-medium">
                          {part.toolInvocation.toolName === "createTask"
                            ? "🔧 Creating task..."
                            : "🔧 Updating task..."}
                        </div>
                        {part.toolInvocation.state === "result" && (
                          <div className="mt-1">
                            {part.toolInvocation.result.success ? (
                              <Badge variant="default" className="text-xs">
                                ✅ {part.toolInvocation.result.message}
                              </Badge>
                            ) : (
                              <Badge variant="destructive" className="text-xs">
                                ❌ {part.toolInvocation.result.error}
                              </Badge>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                </div>
              </div>
            ))
          )}

          {(status === "submitted" || status === "streaming") && (
            <div className="flex justify-start">
              <div className="bg-white border shadow-sm rounded-lg px-3 py-2 max-w-[80%]">
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <div className="animate-spin h-4 w-4 border-2 border-gray-300 border-t-blue-500 rounded-full" />
                  Thinking...
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Input Form */}
        <form onSubmit={handleFormSubmit} className="flex gap-2">
          <Input
            value={input}
            onChange={handleInputChange}
            placeholder={
              mode === "create"
                ? "Describe the task you want to create..."
                : selectedTask
                  ? "What changes would you like to make?"
                  : "Please select a task first..."
            }
            disabled={
              status !== "ready" || (mode === "modify" && !selectedTask)
            }
            className="flex-1"
          />
          <Button
            type="submit"
            disabled={
              status !== "ready" ||
              !input.trim() ||
              (mode === "modify" && !selectedTask)
            }
            size="sm"
          >
            <Send className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={handleReset}
            size="sm"
          >
            <RotateCcw className="h-4 w-4" />
          </Button>
        </form>

        {/* Help Text */}
        <div className="text-xs text-gray-500 bg-gray-50 p-3 rounded-md">
          <p className="font-medium mb-1">Tips:</p>
          <ul className="space-y-1">
            <li>
              • Be specific about your requirements (country, category,
              keywords, schedule)
            </li>
            <li>
              • Example: "Monitor business news in the US every day at 9 AM"
            </li>
            <li>• Use the reset button to start a new conversation</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
