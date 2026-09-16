import React from 'react';
import { useUI } from '../../context/UIContext';
import { useClass } from '../../context/ClassContext';
import { NavTab } from '../../types/common';
import { 
  LayoutDashboard, 
  Users, 
  GraduationCap, 
  ShieldAlert, 
  Trophy, 
  BarChart3, 
  Settings,
  Database,
  Sparkles,
  Award,
  PlusCircle,
  Scale,
  BookOpen,
  Calendar
} from 'lucide-react';

interface NavItemConfig {
  id: NavTab;
  label: string;
  icon: React.ReactNode;
  badge?: string | number;
}

export function Sidebar() {
  const { activeTab, setActiveTab } = useUI();
  const { students, conductRecords, pointTransactions, pointRules, learningRecords, timetable, isDataLocked } = useClass();

  // Thống kê nhanh để hiển thị badge sinh động
  const totalStudents = students.length;
  const recentViolations = pointTransactions.filter(t => t.status === 'valid' && (t.score < 0 || t.type === 'minus')).length;
  const totalTransactions = pointTransactions.length;
  const activeRulesCount = pointRules.filter(r => r.isActive).length;
  const totalAssessments = learningRecords.length;
  const totalPeriods = timetable.length;

  const navItems: NavItemConfig[] = [
    {
      id: 'dashboard',
      label: 'Tổng quan',
      icon: <LayoutDashboard className="w-4 h-4 text-emerald-600" />,
    },
    {
      id: 'classification',
      label: 'Xếp loại Học sinh',
      icon: <Award className="w-4 h-4 text-amber-500" />,
      badge: 'Trọng tâm',
    },
    {
      id: 'learning',
      label: 'Theo dõi Học tập',
      icon: <BookOpen className="w-4 h-4 text-indigo-600" />,
      badge: totalAssessments > 0 ? `${totalAssessments} bài` : 'GVCN',
    },
    {
      id: 'weekly_points',
      label: 'Nhập Điểm Tuần',
      icon: <PlusCircle className="w-4 h-4 text-indigo-600" />,
      badge: totalTransactions > 0 ? `${totalTransactions} TX` : 'Mới',
    },
    {
      id: 'point_rules',
      label: 'Quy tắc Chấm điểm',
      icon: <Scale className="w-4 h-4 text-amber-600" />,
      badge: activeRulesCount > 0 ? activeRulesCount : undefined,
    },
    {
      id: 'students',
      label: 'Hồ sơ Học sinh',
      icon: <Users className="w-4 h-4" />,
      badge: totalStudents > 0 ? totalStudents : undefined,
    },
    {
      id: 'scores',
      label: 'Sổ điểm Bộ môn',
      icon: <GraduationCap className="w-4 h-4" />,
    },
    {
      id: 'conduct',
      label: 'Vi phạm Rèn luyện',
      icon: <ShieldAlert className="w-4 h-4 text-rose-600" />,
      badge: recentViolations > 0 ? `${recentViolations}` : undefined,
    },
    {
      id: 'competition',
      label: 'Thi đua theo Tổ',
      icon: <Trophy className="w-4 h-4 text-amber-500" />,
    },
    {
      id: 'timetable',
      label: 'Thời khóa biểu',
      icon: <Calendar className="w-4 h-4 text-purple-600" />,
      badge: totalPeriods > 0 ? `${totalPeriods} tiết` : undefined,
    },
    {
      id: 'reports',
      label: 'Báo cáo',
      icon: <BarChart3 className="w-4 h-4 text-teal-700" />,
      badge: '8 mẫu',
    },
    {
      id: 'backup',
      label: 'Xuất & Sao lưu',
      icon: <Database className="w-4 h-4" />,
    },
    {
      id: 'settings',
      label: 'Cài đặt Lớp học',
      icon: <Settings className="w-4 h-4" />,
    },
  ];

  return (
    <aside 
      id="app-sidebar" 
      className="w-full md:w-64 shrink-0 bg-slate-50/60 border-r border-slate-200 p-4 flex flex-col justify-between"
    >
      <div>
        {/* App Branding */}
        <div className="flex items-center gap-2.5 px-3 py-2 mb-4">
          <div className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center text-white shadow-xs">
            <Award className="w-4 h-4" />
          </div>
          <div>
            <span className="text-xs uppercase tracking-wider font-extrabold text-indigo-700 block">
              Hệ thống GVCN
            </span>
            <span className="text-[11px] text-slate-500 font-medium">
              Quản lý Lớp THPT
            </span>
          </div>
        </div>

        {/* Navigation List */}
        <nav className="space-y-1">
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                id={`sidebar-nav-${item.id}`}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-xs font-semibold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className={isActive ? 'text-white' : 'text-slate-400'}>
                    {item.icon}
                  </span>
                  <span>{item.label}</span>
                </div>
                {item.badge !== undefined && (
                  <span
                    className={`px-2 py-0.5 text-xs font-semibold rounded-full ${
                      isActive
                        ? 'bg-white/20 text-white'
                        : item.id === 'conduct'
                        ? 'bg-rose-100 text-rose-700'
                        : 'bg-slate-200 text-slate-700'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Footer Info Box */}
      <div className="mt-8 pt-4 border-t border-slate-200 text-xs">
        <div className="bg-white p-3 rounded-xl border border-slate-200/80 shadow-2xs space-y-2">
          <div className="flex items-center justify-between text-slate-500">
            <span>Sĩ số hiện tại:</span>
            <span className="font-bold text-slate-800">{totalStudents} HS</span>
          </div>
          <div className="flex items-center justify-between text-slate-500">
            <span>Chia tổ thi đua:</span>
            <span className="font-bold text-slate-800">4 Tổ</span>
          </div>
          <div className="flex items-center justify-between text-slate-500">
            <span>Trạng thái sổ:</span>
            <span className={`font-semibold ${isDataLocked ? 'text-amber-600' : 'text-emerald-600'}`}>
              {isDataLocked ? 'Đã khóa' : 'Đang mở'}
            </span>
          </div>
        </div>

        <div className="mt-3 px-2 flex items-center gap-1.5 text-[11px] text-slate-400">
          <Sparkles className="w-3 h-3 text-indigo-500" />
          <span>Phiên bản dành riêng cho GVCN</span>
        </div>
      </div>
    </aside>
  );
}
