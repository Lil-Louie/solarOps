"use client";

export default function PrintButton() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="rounded-xl bg-black px-5 py-3 text-sm font-semibold text-white transition hover:bg-zinc-800 print:hidden"
    >
      Print / Save PDF
    </button>
  );
}