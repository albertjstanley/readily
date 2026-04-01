"use client";

import { useCallback, useRef, useState } from "react";
import { Upload, X, FileText } from "lucide-react";

interface FileUploaderProps {
  label: string;
  description: string;
  multiple?: boolean;
  files: File[];
  onFilesChange: (files: File[]) => void;
  disabled?: boolean;
}

export function FileUploader({
  label,
  description,
  multiple = false,
  files,
  onFilesChange,
  disabled = false,
}: FileUploaderProps) {
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFiles = useCallback(
    (incoming: FileList | null) => {
      if (!incoming) return;
      const pdfs = Array.from(incoming).filter(
        (f) => f.type === "application/pdf"
      );
      if (multiple) {
        onFilesChange([...files, ...pdfs]);
      } else {
        onFilesChange(pdfs.slice(0, 1));
      }
    },
    [files, multiple, onFilesChange]
  );

  const removeFile = useCallback(
    (index: number) => {
      onFilesChange(files.filter((_, i) => i !== index));
    },
    [files, onFilesChange]
  );

  return (
    <div className="flex flex-col gap-3">
      <label className="text-sm font-semibold text-zinc-700">{label}</label>
      <div
        className={`relative flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed p-8 transition-colors ${
          dragOver
            ? "border-blue-400 bg-blue-50"
            : "border-zinc-200 bg-zinc-50 hover:border-zinc-300"
        } ${disabled ? "pointer-events-none opacity-50" : "cursor-pointer"}`}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          handleFiles(e.dataTransfer.files);
        }}
        onClick={() => inputRef.current?.click()}
      >
        <Upload className="h-8 w-8 text-zinc-400" />
        <p className="text-sm text-zinc-500">{description}</p>
        <p className="text-xs text-zinc-400">PDF files only</p>
        <input
          ref={inputRef}
          type="file"
          accept=".pdf"
          multiple={multiple}
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
          disabled={disabled}
        />
      </div>

      {files.length > 0 && (
        <ul className="flex flex-col gap-2">
          {files.map((file, i) => (
            <li
              key={`${file.name}-${i}`}
              className="flex items-center gap-3 rounded-lg bg-white px-4 py-2 shadow-sm ring-1 ring-zinc-100"
            >
              <FileText className="h-4 w-4 shrink-0 text-blue-500" />
              <span className="flex-1 truncate text-sm text-zinc-700">
                {file.name}
              </span>
              <span className="text-xs text-zinc-400">
                {(file.size / 1024).toFixed(0)} KB
              </span>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  removeFile(i);
                }}
                className="rounded p-1 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600"
              >
                <X className="h-4 w-4" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
