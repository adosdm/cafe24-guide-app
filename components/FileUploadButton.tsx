"use client";

import { useRef } from "react";

type Props = {
  label?: string;
  onFileSelect?: (file: File) => void;
  onFilesSelect?: (files: File[]) => void;
  accept?: string;
  multiple?: boolean;
};

export default function FileUploadButton({ label = "파일 선택", onFileSelect, onFilesSelect, accept = "image/*", multiple = false }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <>
      <button type="button" className="btn btn-sm btn-soft" onClick={() => inputRef.current?.click()}>
        {label}
      </button>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        multiple={multiple}
        style={{ display: "none" }}
        onChange={(e) => {
          const files = Array.from(e.target.files || []);
          if (files.length === 0) return;
          if (multiple && onFilesSelect) onFilesSelect(files);
          else if (onFileSelect) onFileSelect(files[0]);
          e.target.value = "";
        }}
      />
    </>
  );
}
