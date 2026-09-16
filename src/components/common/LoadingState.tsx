import React from 'react';

export function LoadingState({ message = 'Đang đồng bộ dữ liệu lớp học...' }: { message?: string }) {
  return (
    <div id="loading-state" className="flex flex-col items-center justify-center min-h-[360px] p-8 text-center">
      <div className="relative w-16 h-16">
        <div className="w-16 h-16 rounded-full border-4 border-indigo-100 border-t-indigo-600 animate-spin" />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-3 h-3 bg-indigo-600 rounded-full" />
        </div>
      </div>
      <p className="mt-4 text-sm font-medium text-slate-700">{message}</p>
      <p className="mt-1 text-xs text-slate-400">Kết nối cơ sở dữ liệu Firebase Realtime...</p>
    </div>
  );
}

export function SkeletonRow({ cols = 5 }: { cols?: number }) {
  return (
    <div className="flex items-center gap-4 py-3 px-4 border-b border-slate-100 animate-pulse">
      {Array.from({ length: cols }).map((_, i) => (
        <div 
          key={i} 
          className="h-4 bg-slate-200 rounded-md" 
          style={{ width: i === 0 ? '15%' : i === 1 ? '30%' : '18%' }}
        />
      ))}
    </div>
  );
}
