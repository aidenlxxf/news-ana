"use client";

import type { NewsApiCategory } from "@na/schema";
import { X } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Category options for the select
const categoryOptions: { value: NewsApiCategory; label: string }[] = [
  { value: "business", label: "Business" },
  { value: "entertainment", label: "Entertainment" },
  { value: "general", label: "General" },
  { value: "health", label: "Health" },
  { value: "science", label: "Science" },
  { value: "sports", label: "Sports" },
  { value: "technology", label: "Technology" },
];

export default function CategorySelect() {
  const [selectedCategory, setSelectedCategory] = useState<
    string | undefined
  >();

  const clearCategorySelection = () => {
    setSelectedCategory(void 0);
  };

  return (
    <div className="space-y-2">
      <Label htmlFor="category">Category</Label>
      <div className="flex gap-2">
        <Select
          name="category"
          value={selectedCategory}
          onValueChange={setSelectedCategory}
        >
          <SelectTrigger className="w-60">
            <SelectValue placeholder="Select a category..." />
          </SelectTrigger>
          <SelectContent>
            {categoryOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button
          type="reset"
          variant="ghost"
          size="icon"
          onClick={clearCategorySelection}
          disabled={!selectedCategory}
          className="disabled:opacity-0 shrink-0"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
