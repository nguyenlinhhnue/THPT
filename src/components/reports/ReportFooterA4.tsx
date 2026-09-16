import React from 'react';

interface ReportFooterA4Props {
  teacherName: string;
  isIndividual?: boolean;
}

export function ReportFooterA4({ teacherName, isIndividual }: ReportFooterA4Props) {
  const today = new Date();
  const day = String(today.getDate()).padStart(2, '0');
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const year = today.getFullYear();

  if (isIndividual) {
    return (
      <div className="report-footer mt-8 pt-4 break-inside-avoid text-xs sm:text-sm text-slate-800">
        <div className="flex justify-end text-xs italic mb-4">
          <span>..., ngày {day} tháng {month} năm {year}</span>
        </div>

        <div className="grid grid-cols-3 gap-4 text-center font-bold text-xs sm:text-sm">
          <div>
            <p className="uppercase text-slate-900">Ý KIẾN PHỤ HUYNH</p>
            <p className="text-[11px] font-normal italic text-slate-500">(Ký và ghi rõ họ tên)</p>
            <div className="h-20" />
            <div className="text-slate-400 text-xs italic">..................................</div>
          </div>

          <div>
            <p className="uppercase text-slate-900">HỌC SINH</p>
            <p className="text-[11px] font-normal italic text-slate-500">(Ký và ghi rõ họ tên)</p>
            <div className="h-20" />
            <div className="text-slate-400 text-xs italic">..................................</div>
          </div>

          <div>
            <p className="uppercase text-slate-900">GIÁO VIÊN CHỦ NHIỆM</p>
            <p className="text-[11px] font-normal italic text-slate-500">(Ký và ghi rõ họ tên)</p>
            <div className="h-20" />
            <p className="font-bold text-slate-950 uppercase">{teacherName}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="report-footer mt-8 pt-4 break-inside-avoid text-xs sm:text-sm text-slate-800">
      <div className="flex justify-end text-xs italic mb-4">
        <span>..., ngày {day} tháng {month} năm {year}</span>
      </div>

      <div className="grid grid-cols-3 gap-4 text-center font-bold text-xs sm:text-sm">
        <div>
          <p className="uppercase text-slate-900">NGƯỜI LẬP BÁO CÁO</p>
          <p className="text-[11px] font-normal italic text-slate-500">(Ký và ghi rõ họ tên)</p>
          <div className="h-20" />
          <div className="text-slate-400 text-xs italic">..................................</div>
        </div>

        <div>
          <p className="uppercase text-slate-900">GIÁO VIÊN CHỦ NHIỆM</p>
          <p className="text-[11px] font-normal italic text-slate-500">(Ký và ghi rõ họ tên)</p>
          <div className="h-20" />
          <p className="font-bold text-slate-950 uppercase">{teacherName}</p>
        </div>

        <div>
          <p className="uppercase text-slate-900">BAN GIÁM HIỆU DUYỆT</p>
          <p className="text-[11px] font-normal italic text-slate-500">(Ký tên và đóng dấu)</p>
          <div className="h-20" />
          <div className="text-slate-400 text-xs italic">..................................</div>
        </div>
      </div>
    </div>
  );
}
