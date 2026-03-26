import { Routes, Route, Navigate } from 'react-router-dom';
import Sidebar from './components/shared/Sidebar';
import DashboardPage from './pages/DashboardPage';
import FunnelAnalyticsPage from './pages/FunnelAnalyticsPage';
import ConversationReviewPage from './pages/ConversationReviewPage';
import SourcePerformancePage from './pages/SourcePerformancePage';
import PlaybooksPage from './pages/PlaybooksPage';
import SlidersPage from './pages/SlidersPage';
import LocationsPage from './pages/LocationsPage';
import SmsTemplatesPage from './pages/SmsTemplatesPage';
import ReviewQueuePage from './pages/ReviewQueuePage';
import TestQAPage from './pages/TestQAPage';
import AuditLogPage from './pages/AuditLogPage';
import CrmMappingPage from './pages/CrmMappingPage';
import AnalyticsPage from './pages/AnalyticsPage';
import PermissionsPage from './pages/PermissionsPage';
import PhrasesPage from './pages/PhrasesPage';

export default function App() {
  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        <div className="p-8">
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/funnel" element={<FunnelAnalyticsPage />} />
            <Route path="/conversations" element={<ConversationReviewPage />} />
            <Route path="/sources" element={<SourcePerformancePage />} />
            <Route path="/playbooks" element={<PlaybooksPage />} />
            <Route path="/phrases" element={<PhrasesPage />} />
            <Route path="/sliders" element={<SlidersPage />} />
            <Route path="/locations" element={<LocationsPage />} />
            <Route path="/sms-templates" element={<SmsTemplatesPage />} />
            <Route path="/review-queue" element={<ReviewQueuePage />} />
            <Route path="/test-qa" element={<TestQAPage />} />
            <Route path="/audit-log" element={<AuditLogPage />} />
            <Route path="/crm-mapping" element={<CrmMappingPage />} />
            <Route path="/analytics" element={<AnalyticsPage />} />
            <Route path="/permissions" element={<PermissionsPage />} />
          </Routes>
        </div>
      </main>
    </div>
  );
}
