"use client";

export default function Error({ reset }: { error: Error; reset: () => void }) {
  return (
    <div>
      <h1 className="text-2xl font-semibold">Something went wrong</h1>
      <button className="mt-3 underline" onClick={reset}>Try again</button>
    </div>
  );
}
