import React from 'react';
import { isFirebaseConfigured } from './config/firebase';
import { AuthProvider, useAuth } from './context/AuthContext';
import { UIProvider, useUI } from './context/UIContext';
import { ClassProvider, useClass } from './context/ClassContext';
import { LoginView } from './components/auth/LoginView';
import { FirebaseNotConfigured } from './components/common/FirebaseNotConfigured';
import { Header } from './components/common/Header';
import { Sidebar } from './components/common/Sidebar';
import { ToastContainer } from './components/common/ToastContainer';
import { ConfirmDialog } from './components/common/ConfirmDialog';
import { LoadingState } from './components/common/LoadingState';
import { ErrorState } from './components/common/ErrorState';

import { DashboardView } from './components/dashboard/DashboardView';
import { WeeklyPointsView } from './components/weeklyPoints/WeeklyPointsView';
import { PointRulesManagementView } from './components/pointRules/PointRulesManagementView';
import { StudentListView } from './components/students/StudentListView';
import { ScoresView } from './components/scores/ScoresView';
import { ConductView } from './components/conduct/ConductView';
import { CompetitionView } from './components/competition/CompetitionView';
import { ReportsView } from './components/reports/ReportsView';
import { BackupView } from './components/backup/BackupView';
import { SettingsView } from './components/settings/SettingsView';
import { LearningTrackingView } from './components/learning/LearningTrackingView';
import { ClassificationView } from './components/classification/ClassificationView';
import { TimetableManagementView } from './components/timetable/TimetableManagementView';

function MainApp() {
  const { currentUser, loading: authLoading } = useAuth();
  const { activeTab } = useUI();
  const { loading: classLoading, error: classError } = useClass();

  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center p-6">
        <LoadingState message="Đang kiểm tra phiên đăng nhập Giáo viên Chủ nhiệm..." />
      </div>
    );
  }

  // Bắt buộc xác thực tài khoản GVCN qua Firebase Authentication
  if (!currentUser) {
    return <LoginView />;
  }

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 flex flex-col font-sans antialiased">
      {/* Top Header */}
      <Header />

      {/* Main Layout with Sidebar and Content Area */}
      <div className="flex-1 max-w-7xl w-full mx-auto flex flex-col md:flex-row overflow-hidden">
        {/* Left Sidebar Menu */}
        <Sidebar />

        {/* Dynamic Main Workspace */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
          {classLoading ? (
            <LoadingState message="Đang tải dữ liệu lớp học từ Firebase..." />
          ) : classError ? (
            <ErrorState
              title="Lỗi tải dữ liệu lớp"
              message={classError}
              onRetry={() => window.location.reload()}
            />
          ) : (
            <>
              {activeTab === 'dashboard' && <DashboardView />}
              {activeTab === 'classification' && <ClassificationView />}
              {activeTab === 'learning' && <LearningTrackingView />}
              {activeTab === 'weekly_points' && <WeeklyPointsView />}
              {activeTab === 'point_rules' && <PointRulesManagementView />}
              {activeTab === 'students' && <StudentListView />}
              {activeTab === 'scores' && <ScoresView />}
              {activeTab === 'conduct' && <ConductView />}
              {activeTab === 'competition' && <CompetitionView />}
              {activeTab === 'timetable' && <TimetableManagementView />}
              {activeTab === 'reports' && <ReportsView />}
              {activeTab === 'backup' && <BackupView />}
              {activeTab === 'settings' && <SettingsView />}
            </>
          )}
        </main>
      </div>

      {/* Global Modals & Notifications */}
      <ToastContainer />
      <ConfirmDialog />
    </div>
  );
}

export default function App() {
  // Kiểm tra cấu hình Firebase đầu tiên
  if (!isFirebaseConfigured) {
    return <FirebaseNotConfigured />;
  }

  return (
    <AuthProvider>
      <UIProvider>
        <ClassProvider>
          <MainApp />
        </ClassProvider>
      </UIProvider>
    </AuthProvider>
  );
}
