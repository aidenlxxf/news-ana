"use client";

import type { NewsApiCountry } from "@na/schema";
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

// Country options for the select
const countryOptions: { value: NewsApiCountry; label: string }[] = [
  { value: "us", label: "United States" },
  { value: "gb", label: "United Kingdom" },
  { value: "ca", label: "Canada" },
  { value: "au", label: "Australia" },
  { value: "de", label: "Germany" },
  { value: "fr", label: "France" },
  { value: "jp", label: "Japan" },
  { value: "cn", label: "China" },
  { value: "in", label: "India" },
  { value: "br", label: "Brazil" },
  { value: "ru", label: "Russia" },
  { value: "kr", label: "South Korea" },
  { value: "it", label: "Italy" },
  { value: "mx", label: "Mexico" },
];

export default function CountrySelect() {
  const [selectedCountry, setSelectedCountry] = useState<string | undefined>();

  const clearCountrySelection = () => {
    setSelectedCountry(void 0);
  };

  return (
    <div className="space-y-2">
      <Label htmlFor="country">Country</Label>
      <div className="flex gap-2">
        <Select
          name="country"
          value={selectedCountry}
          onValueChange={setSelectedCountry}
        >
          <SelectTrigger className="w-60">
            <SelectValue placeholder="Select a country..." />
          </SelectTrigger>
          <SelectContent>
            {countryOptions.map((option) => (
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
          onClick={clearCountrySelection}
          disabled={!selectedCountry}
          className="disabled:opacity-0 shrink-0"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
