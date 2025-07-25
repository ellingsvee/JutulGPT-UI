import React from "react";
import type { Base64ContentBlock } from "@langchain/core/messages";
import { MultimodalPreview } from "./MultimodalPreview";
import { cn } from "@/lib/utils";
import { X as XIcon } from "lucide-react";

// Content block that can be either a file/image or text
type ContentBlock = Base64ContentBlock | { type: "text"; text: string };

interface ContentBlocksPreviewProps {
  blocks: ContentBlock[];
  onRemove: (idx: number) => void;
  size?: "sm" | "md" | "lg";
  className?: string;
}

/**
 * Renders a preview of content blocks with optional remove functionality.
 * Uses cn utility for robust class merging.
 */
export const ContentBlocksPreview: React.FC<ContentBlocksPreviewProps> = ({
  blocks,
  onRemove,
  size = "md",
  className,
}) => {
  if (!blocks.length) return null;
  return (
    <div className={cn("flex flex-wrap gap-2 p-3.5 pb-0", className)}>
      {blocks.map((block, idx) => {
        // Handle text blocks
        if (block.type === "text") {
          return (
            <div
              key={idx}
              className="relative inline-flex items-center gap-2 rounded-md bg-gray-100 px-3 py-2 text-sm"
            >
              <span className="max-w-32 truncate">
                {block.text.split('\n\n')[0].replace('File: ', '')}
              </span>
              <button
                type="button"
                onClick={() => onRemove(idx)}
                className="rounded-full p-1 hover:bg-gray-200"
              >
                <XIcon className="h-3 w-3" />
              </button>
            </div>
          );
        }

        // Handle file/image blocks
        return (
          <MultimodalPreview
            key={idx}
            block={block as Base64ContentBlock}
            removable
            onRemove={() => onRemove(idx)}
            size={size}
          />
        );
      })}
    </div>
  );
};
