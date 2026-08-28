"use client";

import { useState } from "react";

export default function JobSection({
  title,
  count,
  defaultOpen = true,
  children,
}: {
  title: string;
  count: number;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="border-t border-zinc-800 first:border-t-0">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between px-5 py-4 text-left transition hover:bg-zinc-800/40"
      >
        <div className="flex items-center gap-3">
          <h3 className="font-semibold text-white">
            {title}
          </h3>

          <span className="text-sm text-zinc-500">
            {count}
          </span>
        </div>

        <span
          className={`text-xl text-zinc-500 transition-transform duration-200 ${
            open ? "rotate-90" : ""
          }`}
        >
          ›
        </span>
      </button>

      {open && children}
    </div>
  );
}