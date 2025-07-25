import { useState, useRef, useEffect, ChangeEvent } from "react";
import { toast } from "sonner";
import type { Base64ContentBlock } from "@langchain/core/messages";
import { fileToContentBlock, type ContentBlock } from "@/lib/multimodal-utils";

export const SUPPORTED_FILE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "application/pdf",
  "text/plain",           // For .txt files
  "application/json",     // For .json files
  "text/x-python",        // For .py files
  "text/x-c++src",        // For .cpp files
  "text/x-csrc",          // For .c files
  "text/x-java-source",   // For .java files
  "text/markdown",        // For .md files
  "text/x-julia",         // For .jl files
  "",                     // Empty MIME type for unknown text files
  "application/octet-stream", // Generic binary type often used for text files
  // Add more as needed
];

// Supported file extensions for text/code files
export const SUPPORTED_TEXT_EXTENSIONS = [
  '.txt', '.py', '.js', '.ts', '.jsx', '.tsx', '.json', '.md', '.markdown',
  '.html', '.css', '.scss', '.sass', '.less', '.xml', '.yaml', '.yml',
  '.c', '.cpp', '.cc', '.cxx', '.h', '.hpp', '.java', '.go', '.rs', '.rb',
  '.php', '.sh', '.bash', '.zsh', '.fish', '.sql', '.r', '.jl', '.swift',
  '.kt', '.scala', '.clj', '.hs', '.elm', '.dart', '.lua', '.perl', '.pl',
  '.dockerfile', '.gitignore', '.env', '.log', '.cfg', '.conf', '.ini',
];

// Check if file is supported by MIME type or extension
const isFileSupported = (file: File): boolean => {
  // Check MIME type first
  if (SUPPORTED_FILE_TYPES.includes(file.type)) {
    return true;
  }

  // Check file extension for text files
  const fileName = file.name.toLowerCase();
  return SUPPORTED_TEXT_EXTENSIONS.some(ext => fileName.endsWith(ext));
};

interface UseFileUploadOptions {
  initialBlocks?: ContentBlock[];
}

export function useFileUpload({
  initialBlocks = [],
}: UseFileUploadOptions = {}) {
  const [contentBlocks, setContentBlocks] =
    useState<ContentBlock[]>(initialBlocks);
  const dropRef = useRef<HTMLDivElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const dragCounter = useRef(0);

  const isDuplicate = (file: File, blocks: ContentBlock[]) => {
    // For text/code files, check if a text block with the same filename already exists
    const fileName = file.name.toLowerCase();
    if (SUPPORTED_TEXT_EXTENSIONS.some(ext => fileName.endsWith(ext))) {
      return blocks.some(
        (b) =>
          b.type === "text" &&
          b.text.startsWith(`File: ${file.name}\n\n`)
      );
    }

    // PDF files
    if (file.type === "application/pdf") {
      return blocks.some(
        (b) =>
          "mime_type" in b &&
          b.type === "file" &&
          b.mime_type === "application/pdf" &&
          "metadata" in b &&
          b.metadata?.filename === file.name,
      );
    }

    // Images
    if (file.type.startsWith("image/")) {
      return blocks.some(
        (b) =>
          "mime_type" in b &&
          b.type === "image" &&
          "metadata" in b &&
          b.metadata?.name === file.name &&
          b.mime_type === file.type,
      );
    }
    return false;
  };

  const handleFileUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    const fileArray = Array.from(files);
    const validFiles = fileArray.filter((file) =>
      isFileSupported(file),
    );
    const invalidFiles = fileArray.filter(
      (file) => !isFileSupported(file),
    );
    const duplicateFiles = validFiles.filter((file) =>
      isDuplicate(file, contentBlocks),
    );
    const uniqueFiles = validFiles.filter(
      (file) => !isDuplicate(file, contentBlocks),
    );

    if (invalidFiles.length > 0) {
      toast.error(
        "You have uploaded an invalid file type. Please upload an image, PDF, or supported text/code file (e.g. .txt, .json, .py, .md, etc.).",
      );
    }
    if (duplicateFiles.length > 0) {
      toast.error(
        `Duplicate file(s) detected: ${duplicateFiles.map((f) => f.name).join(", ")}. Each file can only be uploaded once per message.`,
      );
    }

    const newBlocks = uniqueFiles.length
      ? await Promise.all(uniqueFiles.map(fileToContentBlock))
      : [];
    setContentBlocks((prev) => [...prev, ...newBlocks]);
    e.target.value = "";
  };

  // Drag and drop handlers
  useEffect(() => {
    if (!dropRef.current) return;

    // Global drag events with counter for robust dragOver state
    const handleWindowDragEnter = (e: DragEvent) => {
      if (e.dataTransfer?.types?.includes("Files")) {
        dragCounter.current += 1;
        setDragOver(true);
      }
    };
    const handleWindowDragLeave = (e: DragEvent) => {
      if (e.dataTransfer?.types?.includes("Files")) {
        dragCounter.current -= 1;
        if (dragCounter.current <= 0) {
          setDragOver(false);
          dragCounter.current = 0;
        }
      }
    };
    const handleWindowDrop = async (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      dragCounter.current = 0;
      setDragOver(false);

      if (!e.dataTransfer) return;

      const files = Array.from(e.dataTransfer.files);
      const validFiles = files.filter((file) =>
        isFileSupported(file),
      );
      const invalidFiles = files.filter(
        (file) => !isFileSupported(file),
      );
      const duplicateFiles = validFiles.filter((file) =>
        isDuplicate(file, contentBlocks),
      );
      const uniqueFiles = validFiles.filter(
        (file) => !isDuplicate(file, contentBlocks),
      );

      if (invalidFiles.length > 0) {
        toast.error(
          "You have uploaded an invalid file type. Please upload an image, PDF, or supported text/code file (e.g. .txt, .json, .py, .md, etc.).",
        );
      }
      if (duplicateFiles.length > 0) {
        toast.error(
          `Duplicate file(s) detected: ${duplicateFiles.map((f) => f.name).join(", ")}. Each file can only be uploaded once per message.`,
        );
      }

      const newBlocks = uniqueFiles.length
        ? await Promise.all(uniqueFiles.map(fileToContentBlock))
        : [];
      setContentBlocks((prev) => [...prev, ...newBlocks]);
    };
    const handleWindowDragEnd = (e: DragEvent) => {
      dragCounter.current = 0;
      setDragOver(false);
    };
    window.addEventListener("dragenter", handleWindowDragEnter);
    window.addEventListener("dragleave", handleWindowDragLeave);
    window.addEventListener("drop", handleWindowDrop);
    window.addEventListener("dragend", handleWindowDragEnd);

    // Prevent default browser behavior for dragover globally
    const handleWindowDragOver = (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
    };
    window.addEventListener("dragover", handleWindowDragOver);

    // Remove element-specific drop event (handled globally)
    const handleDragOver = (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setDragOver(true);
    };
    const handleDragEnter = (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setDragOver(true);
    };
    const handleDragLeave = (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setDragOver(false);
    };
    const element = dropRef.current;
    element.addEventListener("dragover", handleDragOver);
    element.addEventListener("dragenter", handleDragEnter);
    element.addEventListener("dragleave", handleDragLeave);

    return () => {
      element.removeEventListener("dragover", handleDragOver);
      element.removeEventListener("dragenter", handleDragEnter);
      element.removeEventListener("dragleave", handleDragLeave);
      window.removeEventListener("dragenter", handleWindowDragEnter);
      window.removeEventListener("dragleave", handleWindowDragLeave);
      window.removeEventListener("drop", handleWindowDrop);
      window.removeEventListener("dragend", handleWindowDragEnd);
      window.removeEventListener("dragover", handleWindowDragOver);
      dragCounter.current = 0;
    };
  }, [contentBlocks]);

  const removeBlock = (idx: number) => {
    setContentBlocks((prev) => prev.filter((_, i) => i !== idx));
  };

  const resetBlocks = () => setContentBlocks([]);

  /**
   * Handle paste event for files (images, PDFs)
   * Can be used as onPaste={handlePaste} on a textarea or input
   */
  const handlePaste = async (
    e: React.ClipboardEvent<HTMLTextAreaElement | HTMLInputElement>,
  ) => {
    const items = e.clipboardData.items;
    if (!items) return;
    const files: File[] = [];
    for (let i = 0; i < items.length; i += 1) {
      const item = items[i];
      if (item.kind === "file") {
        const file = item.getAsFile();
        if (file) files.push(file);
      }
    }
    if (files.length === 0) {
      return;
    }
    e.preventDefault();
    const validFiles = files.filter((file) =>
      isFileSupported(file),
    );
    const invalidFiles = files.filter(
      (file) => !isFileSupported(file),
    );
    const isDuplicate = (file: File) => {
      // For text/code files, check if a text block with the same filename already exists
      const fileName = file.name.toLowerCase();
      if (SUPPORTED_TEXT_EXTENSIONS.some(ext => fileName.endsWith(ext))) {
        return contentBlocks.some(
          (b) =>
            b.type === "text" &&
            b.text.startsWith(`File: ${file.name}\n\n`)
        );
      }

      // PDF files
      if (file.type === "application/pdf") {
        return contentBlocks.some(
          (b) =>
            "mime_type" in b &&
            b.type === "file" &&
            b.mime_type === "application/pdf" &&
            "metadata" in b &&
            b.metadata?.filename === file.name,
        );
      }

      // Images
      if (file.type.startsWith("image/")) {
        return contentBlocks.some(
          (b) =>
            "mime_type" in b &&
            b.type === "image" &&
            "metadata" in b &&
            b.metadata?.name === file.name &&
            b.mime_type === file.type,
        );
      }
      return false;
    };
    const duplicateFiles = validFiles.filter(isDuplicate);
    const uniqueFiles = validFiles.filter((file) => !isDuplicate(file));
    if (invalidFiles.length > 0) {
      toast.error(
        "You have pasted an invalid file type. Please paste an image, PDF, or supported text/code file (e.g. .txt, .json, .py, .md, etc.).",
      );
    }
    if (duplicateFiles.length > 0) {
      toast.error(
        `Duplicate file(s) detected: ${duplicateFiles.map((f) => f.name).join(", ")}. Each file can only be uploaded once per message.`,
      );
    }
    if (uniqueFiles.length > 0) {
      const newBlocks = await Promise.all(uniqueFiles.map(fileToContentBlock));
      setContentBlocks((prev) => [...prev, ...newBlocks]);
    }
  };

  return {
    contentBlocks,
    setContentBlocks,
    handleFileUpload,
    dropRef,
    removeBlock,
    resetBlocks,
    dragOver,
    handlePaste,
  };
}
