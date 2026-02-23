"use client";

import { useRef } from "react";
import Image from "next/image";

interface UploadZoneProps {
  label: string;
  sublabel: string;
  file: File | null;
  onFileChange: (file: File | null) => void;
}

export default function UploadZone({
  label,
  sublabel,
  file,
  onFileChange,
}: UploadZoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const preview = file ? URL.createObjectURL(file) : null;

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    const dropped = e.dataTransfer.files[0];
    if (dropped && dropped.type.startsWith("image/")) {
      onFileChange(dropped);
    }
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = e.target.files?.[0] ?? null;
    onFileChange(selected);
  }

  return (
    <div
      className={`upload-card min-h-[160px] w-full relative overflow-hidden ${file ? "has-file" : ""}`}
      onClick={() => inputRef.current?.click()}
      onDrop={handleDrop}
      onDragOver={(e) => e.preventDefault()}
      onDragEnter={(e) => e.preventDefault()}
    >
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleChange}
      />

      {preview ? (
        <>
          <Image
            src={preview}
            alt={label}
            fill
            className="object-cover rounded-xl opacity-80"
            unoptimized
          />
          <div className="absolute inset-0 bg-white/40 rounded-xl" />
          <div className="relative z-10 flex flex-col items-center gap-1">
            <CheckIcon />
            <span className="text-xs font-medium text-zinc-700">{file!.name}</span>
            <span className="text-[10px] text-zinc-500">Click to replace</span>
          </div>
        </>
      ) : (
        <>
          <UploadIcon />
          <div className="text-center">
            <p className="text-sm font-semibold text-zinc-700">{label}</p>
            <p className="text-xs text-zinc-400 mt-0.5">{sublabel}</p>
          </div>
          <p className="text-[10px] text-zinc-300 mt-1">Drop or click to upload</p>
        </>
      )}
    </div>
  );
}

function UploadIcon() {
  return (
    <svg
      className="w-7 h-7 text-zinc-300"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
        d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5"
      />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg
      className="w-6 h-6 text-zinc-700"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    </svg>
  );
}
