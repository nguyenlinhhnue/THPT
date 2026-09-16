import React from 'react';
import { ClassroomInfo } from '../../types/class';

interface ReportHeaderA4Props {
  classroom: ClassroomInfo | null;
  teacherName: string;
  reportTitle: string;
  periodDescription: string;
  subTitle?: string;
}

export function ReportHeaderA4({
  classroom,
  teacherName,
  reportTitle,
  periodDescription,
  subTitle,
}: ReportHeaderA4Props) {
  const schoolName = classroom?.schoolName || 'TRƯỜNG THPT';
  const className = classroom?.className || '12A1';
  const schoolYear = classroom?.schoolYear || '2025 - 2026';

  return (
    <div className="report-header pb-4 mb-6 border-b-2 border-slate-900">
      {/* 2 cột đầu đề văn bản hành chính nhà trường */}
      <div className="flex justify-between items-start text-xs sm:text-sm">
        {/* Bên trái: Tên trường và lớp */}
        <div className="text-center font-bold tracking-tight">
          <p className="uppercase text-slate-800 text-[11px] sm:text-xs">
            SỞ GD&ĐT TỈNH / THÀNH PHỐ
          </p>
          <p className="uppercase font-black text-slate-950 text-xs sm:text-sm">
            {schoolName.toUpperCase()}
          </p>
          <div className="w-16 h-[1.5px] bg-slate-900 mx-auto my-1" />
          <p className="font-semibold text-slate-700 text-xs">
            Lớp: <span className="font-bold text-slate-900">{className}</span>
          </p>
        </div>

        {/* Bên phải: Quốc hiệu & Tiêu ngữ */}
        <div className="text-center">
          <p className="font-bold uppercase tracking-wider text-slate-950 text-[11px] sm:text-xs">
            CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM
          </p>
          <p className="font-bold text-slate-900 text-xs sm:text-sm">
            Độc lập - Tự do - Hạnh phúc
          </p>
          <div className="w-24 h-[1.5px] bg-slate-900 mx-auto my-1" />
        </div>
      </div>

      {/* Tiêu đề chính của báo cáo */}
      <div className="text-center mt-5 mb-2">
        <h1 className="text-lg sm:text-xl md:text-2xl font-black uppercase text-slate-950 tracking-tight">
          {reportTitle}
        </h1>
        <p className="text-xs sm:text-sm font-semibold text-slate-700 mt-1">
          {periodDescription} • Năm học {schoolYear}
        </p>
        {subTitle && (
          <p className="text-xs italic text-slate-600 mt-0.5">
            {subTitle}
          </p>
        )}
      </div>

      {/* Thông tin nhanh lớp & GVCN */}
      <div className="flex justify-between items-center text-xs text-slate-600 pt-2 border-t border-dashed border-slate-300">
        <div>
          <span>Giáo viên chủ nhiệm: </span>
          <strong className="text-slate-900 font-bold">{teacherName}</strong>
        </div>
        <div>
          <span>Ngày in báo cáo: </span>
          <strong className="text-slate-900">
            {new Date().toLocaleDateString('vi-VN', {
              day: '2-digit',
              month: '2-digit',
              year: 'numeric',
            })}
          </strong>
        </div>
      </div>
    </div>
  );
}
