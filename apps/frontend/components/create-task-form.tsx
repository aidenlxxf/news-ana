import { Plus } from "lucide-react";
import { createTaskAction } from "@/app/actions";
import CategorySelect from "@/components/category-select";
import CountrySelect from "@/components/country-select";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function CreateTaskForm() {
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Plus className="h-5 w-5" />
          Create New News Analysis Task
        </CardTitle>
      </CardHeader>

      <CardContent>
        <form action={createTaskAction} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Country Selection */}
            <CountrySelect />

            {/* Category Selection */}
            <CategorySelect />
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
            />
          </div>

          {/* Help Text */}
          <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded-md">
            <p className="font-medium mb-1">Note:</p>
            <p>
              At least one field (Country, Category, or Query) must be provided
              to create a task.
            </p>
          </div>

          {/* Submit Button */}
          <Button type="submit" className="w-full">
            <Plus className="h-4 w-4 mr-2" />
            Create Task
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
