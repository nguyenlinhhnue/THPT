import React from 'react';
import { firebaseConfigStatus } from '../../config/firebase';
import { AlertOctagon, FileCode, CheckCircle, ExternalLink } from 'lucide-react';

export function FirebaseNotConfigured() {
  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
      <div className="bg-white max-w-xl w-full rounded-2xl p-8 border border-slate-200 shadow-xl text-center">
        <div className="w-16 h-16 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto mb-4 border border-amber-200">
          <AlertOctagon className="w-8 h-8" />
        </div>

        <h1 className="text-2xl font-black text-slate-900">
          Firebase Chưa Được Cấu Hình
        </h1>

        <p className="text-sm text-slate-600 mt-2 leading-relaxed">
          Ứng dụng <strong>QUẢN LÝ LỚP CHỦ NHIỆM</strong> yêu cầu kết nối với Firebase Authentication và Firestore để lưu trữ dữ liệu lớp học thời gian thực, không sử dụng dữ liệu giả lập.
        </p>

        {firebaseConfigStatus.missingFields.length > 0 && (
          <div className="mt-5 p-4 rounded-xl bg-amber-50/80 border border-amber-200 text-left">
            <span className="text-xs font-bold text-amber-900 block mb-1">
              Các thông số cấu hình còn thiếu:
            </span>
            <ul className="list-disc list-inside text-xs text-amber-800 space-y-0.5">
              {firebaseConfigStatus.missingFields.map((field) => (
                <li key={field} className="font-mono">{field}</li>
              ))}
            </ul>
          </div>
        )}

        <div className="mt-6 p-5 rounded-xl bg-slate-50 border border-slate-200 text-left space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-800 uppercase tracking-wider">
            <FileCode className="w-4 h-4 text-indigo-600" />
            <span>Hướng dẫn vị trí cấu hình</span>
          </div>

          <div className="text-xs text-slate-600 space-y-2">
            <p>
              1. Mở tệp <code className="px-2 py-0.5 bg-slate-200 text-slate-900 rounded font-mono text-[11px]">/firebase-applet-config.json</code> ở thư mục gốc của dự án.
            </p>
            <p>
              2. Điền đầy đủ thông tin Firebase Web App của bạn:
            </p>
            <pre className="p-3 bg-slate-900 text-slate-100 rounded-lg text-[11px] font-mono overflow-x-auto">
{`{
  "projectId": "your-firebase-project",
  "appId": "1:...:web:...",
  "apiKey": "AIzaSy...",
  "authDomain": "your-project.firebaseapp.com",
  "firestoreDatabaseId": "(default)"
}`}
            </pre>
            <p>
              3. Lưu tệp và làm mới (Refresh) lại trang để hệ thống tự động kết nối với cơ sở dữ liệu.
            </p>
          </div>
        </div>

        <div className="mt-6">
          <button
            onClick={() => window.location.reload()}
            className="w-full py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all shadow-xs"
          >
            Đã cấu hình xong, Tải lại trang
          </button>
        </div>
      </div>
    </div>
  );
}
