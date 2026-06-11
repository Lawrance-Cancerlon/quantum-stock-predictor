'use client';

export default function Spinner({ text = 'Loading...' }: { text?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-6 sm:py-8">
      <div className="relative mb-4 h-12 w-12">
        <div className="absolute inset-0 border-4 border-slate-700 rounded-full"></div>
        <div className="absolute inset-0 border-4 border-transparent border-t-blue-400 rounded-full animate-spin"></div>
      </div>
      <p className="text-slate-400 text-sm">{text}</p>
    </div>
  );
}
