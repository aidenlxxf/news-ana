"use client";

import { Building } from "lucide-react";
import { useState } from "react";

interface NewsArticleImageProps {
  src: string;
  alt: string;
  className?: string;
}

export default function NewsArticleImage({
  src,
  alt,
  className = "w-24 h-24 object-cover rounded-lg",
}: NewsArticleImageProps) {
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  if (hasError) {
    return (
      <div
        className={`${className} bg-gray-100 flex items-center justify-center`}
      >
        <Building className="h-8 w-8 text-gray-400" />
      </div>
    );
  }

  return (
    <div className="relative">
      {isLoading && (
        <div
          className={`${className} bg-gray-100 animate-pulse flex items-center justify-center absolute inset-0`}
        >
          <Building className="h-8 w-8 text-gray-300" />
        </div>
      )}
      {/** biome-ignore lint/performance/noImgElement: External image */}
      <img
        src={src}
        alt={alt}
        className={`${className} ${isLoading ? "opacity-0" : "opacity-100"} transition-opacity duration-200`}
        loading="lazy"
        onLoad={() => setIsLoading(false)}
        onError={() => {
          setHasError(true);
          setIsLoading(false);
        }}
      />
    </div>
  );
}
