import type { Base64ContentBlock } from "@langchain/core/messages";
import { toast } from "sonner";

// Content block that can be either a file/image or text
export type ContentBlock = Base64ContentBlock | { type: "text"; text: string };

// Returns a Promise of a typed multimodal block for images, PDFs, or text files
export async function fileToContentBlock(
  file: File,
): Promise<ContentBlock> {
  const supportedImageTypes = [
    "image/jpeg",
    "image/png",
    "image/gif",
    "image/webp",
  ];
  const supportedPdfTypes = ["application/pdf"];
  const supportedTextTypes = [
    "text/plain",
    "application/json",
    "text/x-python",
    "text/x-c++src",
    "text/x-csrc",
    "text/x-java-source",
    "text/markdown",
    "text/x-julia",
    "",                     // Empty MIME type for unknown text files
    "application/octet-stream", // Generic binary type often used for text files
    // Add more as needed
  ];
  const supportedTextExtensions = [
    '.txt', '.py', '.js', '.ts', '.jsx', '.tsx', '.json', '.md', '.markdown',
    '.html', '.css', '.scss', '.sass', '.less', '.xml', '.yaml', '.yml',
    '.c', '.cpp', '.cc', '.cxx', '.h', '.hpp', '.java', '.go', '.rs', '.rb',
    '.php', '.sh', '.bash', '.zsh', '.fish', '.sql', '.r', '.jl', '.swift',
    '.kt', '.scala', '.clj', '.hs', '.elm', '.dart', '.lua', '.perl', '.pl',
    '.dockerfile', '.gitignore', '.env', '.log', '.cfg', '.conf', '.ini',
  ];
  const supportedFileTypes = [
    ...supportedImageTypes,
    ...supportedPdfTypes,
    ...supportedTextTypes,
  ];

  // Check if file is supported by MIME type or extension
  const isFileSupported = () => {
    // Check MIME type first
    if (supportedFileTypes.includes(file.type)) {
      return true;
    }

    // Check file extension for text files
    const fileName = file.name.toLowerCase();
    return supportedTextExtensions.some(ext => fileName.endsWith(ext));
  };

  if (!isFileSupported()) {
    toast.error(
      `Unsupported file type: ${file.type}. Supported types are: images, PDFs, and text/code files.`,
    );
    return Promise.reject(new Error(`Unsupported file type: ${file.type}`));
  }

  // Images
  if (supportedImageTypes.includes(file.type)) {
    const data = await fileToBase64(file);
    return {
      type: "image",
      source_type: "base64",
      mime_type: file.type,
      data,
      metadata: { name: file.name },
    };
  }

  // PDFs
  if (supportedPdfTypes.includes(file.type)) {
    const data = await fileToBase64(file);
    return {
      type: "file",
      source_type: "base64",
      mime_type: "application/pdf",
      data,
      metadata: { filename: file.name },
    };
  }

  // Text/code files (including files with empty or generic MIME types)
  if (supportedTextTypes.includes(file.type) || supportedTextExtensions.some(ext => file.name.toLowerCase().endsWith(ext))) {
    // Read as text content, not base64
    const text = await file.text();
    return {
      type: "text",
      text: `File: ${file.name}\n\n${text}`,
    };
  }

  // fallback (should not reach here)
  toast.error(`Unsupported file type: ${file.type}`);
  return Promise.reject(new Error(`Unsupported file type: ${file.type}`));
}

// Helper to convert File to base64 string
export async function fileToBase64(file: File): Promise<string> {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      // Remove the data:...;base64, prefix
      resolve(result.split(",")[1]);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// Type guard for Base64ContentBlock
export function isBase64ContentBlock(
  block: unknown,
): block is Base64ContentBlock {
  if (typeof block !== "object" || block === null || !("type" in block))
    return false;
  // file type (legacy)
  if (
    (block as { type: unknown }).type === "file" &&
    "source_type" in block &&
    (block as { source_type: unknown }).source_type === "base64" &&
    "mime_type" in block &&
    typeof (block as { mime_type?: unknown }).mime_type === "string" &&
    ((block as { mime_type: string }).mime_type.startsWith("image/") ||
      (block as { mime_type: string }).mime_type === "application/pdf")
  ) {
    return true;
  }
  // image type (new)
  if (
    (block as { type: unknown }).type === "image" &&
    "source_type" in block &&
    (block as { source_type: unknown }).source_type === "base64" &&
    "mime_type" in block &&
    typeof (block as { mime_type?: unknown }).mime_type === "string" &&
    (block as { mime_type: string }).mime_type.startsWith("image/")
  ) {
    return true;
  }
  return false;
}
