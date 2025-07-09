"use client";

import { Edit } from "lucide-react";
import { useActionState, useEffect } from "react";
import { toast } from "sonner";
import type { ScheduleDto } from "@na/schema";
import { updateTaskAction } from "@/actions/task";
import CategorySelect from "@/components/category-select";
import CountrySelect from "@/components/country-select";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import ScheduleSelect from "@/components/schedule-select";
import Form from "next/form";

interface EditTaskFormProps {
  taskId: string;
  defaultValues: {
    country?: string | null;
    category?: string | null;
    query?: string | null;
    schedule?: ScheduleDto;
  };
}

export default function EditTaskForm({
  taskId,
  defaultValues,
}: EditTaskFormProps) {
  const [state, formAction, isPending] = useActionState(
    updateTaskAction,
    undefined,
  );

  // Handle successful task update
  useEffect(() => {
    if (state?.success) {
      toast.success(state.data?.message || "Task updated successfully!");
    }
    if (state?.error) {
      toast.error(state.error);
    }
  }, [state]);

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Edit className="h-5 w-5" />
          Edit News Analysis Task
        </CardTitle>
      </CardHeader>

      <CardContent>
        <Form action={formAction} className="space-y-4">
          <input type="hidden" name="task-id" value={taskId} />
          <input type="hidden" name="next" value={`/tasks/${taskId}`} />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Country Selection */}
            <CountrySelect defaultValue={defaultValues.country || undefined} />

            {/* Category Selection */}
            <CategorySelect
              defaultValue={defaultValues.category || undefined}
            />
          </div>

          {/* Query Input */}
          <div className="space-y-2">
            <Label htmlFor="query">Search Query</Label>
            <Input
              id="query"
              name="query"
              type="text"
              placeholder="Enter keywords to search for..."
              className="w-full"
              defaultValue={defaultValues.query || ""}
              disabled={isPending}
            />
          </div>

          {/* Schedule Selection */}
          <ScheduleSelect defaultSchedule={defaultValues.schedule} />

          {/* Execute Immediately Option */}
          <div className="flex items-center space-x-2">
            <Checkbox
              id="immediately"
              name="immediately"
              defaultChecked={true}
              disabled={isPending}
            />
            <Label
              htmlFor="immediately"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              Execute new task immediately
            </Label>
          </div>
          <p className="text-sm text-gray-600">
            When enabled, the task will run immediately after being updated in
            addition to its scheduled runs.
          </p>

          {/* Help Text */}
          <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded-md">
            <p className="font-medium mb-1">Note:</p>
            <p>
              At least one field (Country, Category, or Query) must be provided
              to update the task.
            </p>
          </div>

          {/* Submit Button */}
          <Button type="submit" className="w-full" disabled={isPending}>
            <Edit className="h-4 w-4 mr-2" />
            {isPending ? "Updating Task..." : "Update Task"}
          </Button>
        </Form>
      </CardContent>
    </Card>
  );
}
