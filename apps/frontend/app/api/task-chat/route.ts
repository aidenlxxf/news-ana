import { openai } from "@ai-sdk/openai";
import { jsonSchema, streamText, tool } from "ai";
import type { CreateTaskSchema, UpdateTaskSchema } from "@na/schema";
import type * as v from "valibot";
import { createTaskForAI, updateTaskForAI } from "@/actions/task";
import type { JSONSchema7 } from "json-schema";
const createSchemaRaw: JSONSchema7 = {
  $schema: "http://json-schema.org/draft-07/schema#",
  title: "CreateTaskSchema",
  type: "object",
  properties: {
    country: {
      type: "string",
      enum: [
        "ae",
        "ar",
        "at",
        "au",
        "be",
        "bg",
        "br",
        "ca",
        "ch",
        "cn",
        "co",
        "cu",
        "cz",
        "de",
        "eg",
        "fr",
        "gb",
        "gr",
        "hk",
        "hu",
        "id",
        "ie",
        "il",
        "in",
        "it",
        "jp",
        "kr",
        "lt",
        "lv",
        "ma",
        "mx",
        "my",
        "ng",
        "nl",
        "no",
        "nz",
        "ph",
        "pl",
        "pt",
        "ro",
        "rs",
        "ru",
        "sa",
        "se",
        "sg",
        "si",
        "sk",
        "th",
        "tr",
        "tw",
        "ua",
        "us",
        "ve",
        "za",
      ],
    },
    category: {
      type: "string",
      enum: [
        "business",
        "entertainment",
        "general",
        "health",
        "science",
        "sports",
        "technology",
      ],
    },
    query: {
      type: "string",
    },
    schedule: {
      oneOf: [
        {
          type: "object",
          properties: {
            type: {
              type: "string",
              const: "hourly",
            },
          },
          required: ["type"],
          additionalProperties: false,
        },
        {
          type: "object",
          properties: {
            type: {
              type: "string",
              const: "daily",
            },
            runAt: {
              type: "string",
              pattern: "^([01]?[0-9]|2[0-3]):[0-5][0-9]$",
            },
          },
          required: ["type", "runAt"],
          additionalProperties: false,
        },
      ],
    },
  },
  required: ["schedule"],
  additionalProperties: false,
};

const updateSchemaRaw: JSONSchema7 = {
  ...createSchemaRaw,
  title: "UpdateTaskSchema",
  properties: {
    ...createSchemaRaw.properties,
    immediately: {
      type: "boolean",
    },
  },
};

const createSchema =
  jsonSchema<v.InferInput<typeof CreateTaskSchema>>(createSchemaRaw);
const updateSchema =
  jsonSchema<v.InferInput<typeof UpdateTaskSchema>>(updateSchemaRaw);

export async function POST(req: Request) {
  try {
    const { messages, mode, selectedTask, timezone } = await req.json();
    if (mode !== "create" && mode !== "modify") {
      return new Response(JSON.stringify({ error: "Invalid mode" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }
    if (mode === "modify" && !selectedTask) {
      return new Response(JSON.stringify({ error: "No task selected" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }
    if (!timezone) {
      return new Response(JSON.stringify({ error: "No timezone provided" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // System prompt based on mode
    const systemPrompt =
      mode === "create"
        ? `You are a helpful assistant for creating news analysis tasks. 

You can help users create news analysis tasks by understanding their requirements and calling the appropriate tools.

Available parameters for tasks:
- country: Optional country code (e.g., 'us', 'gb', 'fr', etc.)
- category: Optional news category ('business', 'entertainment', 'general', 'health', 'science', 'sports', 'technology')
- query: Optional search keywords
- schedule: Required schedule configuration
  - type: 'hourly' or 'daily'
  - runAt: For daily, specify time like '09:00' (24-hour format)

At least one of country, category, or query must be provided.

When the user describes what they want, extract the relevant information and call the createTask tool.`
        : `You are a helpful assistant for modifying existing news analysis tasks.

The user has selected a task to modify with the following current configuration:
${
  selectedTask
    ? `
Current Task Configuration:
${JSON.stringify(selectedTask, null, 2)}
`
    : "No task selected"
}

You can help users modify this task by understanding what changes they want to make and calling the updateTask tool.

IMPORTANT: updateTask is using replace semantics. When providing updated parameters, include parameters that should remain unchanged. You should ensure that at least one of country, category, or query is provided.

Available parameters for updates:
- country: Optional country code (e.g., 'us', 'gb', 'fr', etc.)
- category: Optional news category ('business', 'entertainment', 'general', 'health', 'science', 'sports', 'technology')
- query: Optional search keywords
- schedule: Schedule configuration
  - type: 'hourly' or 'daily'
  - runAt: For daily, specify time like '09:00' (24-hour format)
- immediately: Optional boolean to run the task immediately after update


`;

    const result = streamText({
      model: openai("gpt-4o-mini"),
      system: systemPrompt,
      messages,
      tools: {
        createTask: tool({
          description: "Create a new news analysis task",
          parameters: createSchema,
          execute: async (params) => {
            try {
              const result = await createTaskForAI({
                category: params.category,
                country: params.country,
                query: params.query,
                schedule:
                  params.schedule.type === "daily"
                    ? {
                        type: "daily",
                        runAt: params.schedule.runAt,
                        timezone,
                      }
                    : { type: "hourly", timezone },
              });
              return {
                success: true,
                message: result.message,
                taskId: result.taskId,
              };
            } catch (error) {
              return {
                success: false,
                error:
                  error instanceof Error
                    ? error.message
                    : "Unknown error occurred",
              };
            }
          },
        }),
        updateTask: tool({
          description: "Update an existing news analysis task",
          parameters: updateSchema,
          execute: async (params) => {
            try {
              const result = await updateTaskForAI(selectedTask.id, {
                category: params.category,
                country: params.country,
                query: params.query,
                schedule:
                  params.schedule.type === "daily"
                    ? {
                        type: "daily",
                        runAt: params.schedule.runAt,
                        timezone,
                      }
                    : { type: "hourly", timezone },
                immediately: params.immediately,
              });
              return {
                success: true,
                message: result.message,
                taskId: result.taskId,
              };
            } catch (error) {
              return {
                success: false,
                error:
                  error instanceof Error
                    ? error.message
                    : "Unknown error occurred",
              };
            }
          },
        }),
      },
      maxSteps: 3,
    });

    return result.toDataStreamResponse();
  } catch (error) {
    console.error("Error in task-chat API:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Internal server error",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    );
  }
}
