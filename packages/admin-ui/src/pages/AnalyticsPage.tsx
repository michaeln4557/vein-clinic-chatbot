import { useState } from 'react';
import {
  TrendingUp,
  HeartPulse,
  PhoneCall,
  PhoneOff,
  Megaphone,
  MapPin,
  BookOpen,
  ClipboardCheck,
  Database,
} from 'lucide-react';
import FilterBar from '../components/dashboard/FilterBar';
import TabNav from '../components/dashboard/TabNav';
import ConversionFunnelTab from '../components/dashboard/ConversionFunnelTab';
import ConversationQualityTab from '../components/dashboard/ConversationQualityTab';
import CallbackOperationsTab from '../components/dashboard/CallbackOperationsTab';
import MissedCallRecoveryTab from '../components/dashboard/MissedCallRecoveryTab';
import ChannelPerformanceTab from '../components/dashboard/ChannelPerformanceTab';
import LocationPerformanceTab from '../components/dashboard/LocationPerformanceTab';
import PlaybookPerformanceTab from '../components/dashboard/PlaybookPerformanceTab';
import QaReviewTab from '../components/dashboard/QaReviewTab';
import CrmHealthTab from '../components/dashboard/CrmHealthTab';

const tabs = [
  { id: 'funnel', label: 'Funnel', icon: TrendingUp },
  { id: 'quality', label: 'Quality', icon: HeartPulse },
  { id: 'callbacks', label: 'Callbacks', icon: PhoneCall },
  { id: 'recovery', label: 'Recovery', icon: PhoneOff },
  { id: 'channels', label: 'Channels', icon: Megaphone },
  { id: 'locations', label: 'Locations', icon: MapPin },
  { id: 'playbooks', label: 'Playbooks', icon: BookOpen },
  { id: 'qa', label: 'QA Review', icon: ClipboardCheck },
  { id: 'crm', label: 'CRM Health', icon: Database },
];

export default function AnalyticsPage() {
  const [activeTab, setActiveTab] = useState('funnel');
  const [dateRange, setDateRange] = useState('14d');
  const [location, setLocation] = useState('all');
  const [channel, setChannel] = useState('all');
  const [source, setSource] = useState('all');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1>Analytics Console</h1>
          <p className="text-sm text-healthcare-muted mt-1">
            Deep-dive analytics across conversions, quality, operations, and data health
          </p>
        </div>
        <FilterBar
          dateRange={dateRange}
          onDateRangeChange={setDateRange}
          showLocation
          locationValue={location}
          onLocationChange={setLocation}
          showChannel
          channelValue={channel}
          onChannelChange={setChannel}
          showSource
          sourceValue={source}
          onSourceChange={setSource}
        />
      </div>

      {/* Tab Navigation */}
      <TabNav tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />

      {/* Tab Content */}
      <div>
        {activeTab === 'funnel' && <ConversionFunnelTab />}
        {activeTab === 'quality' && <ConversationQualityTab />}
        {activeTab === 'callbacks' && <CallbackOperationsTab />}
        {activeTab === 'recovery' && <MissedCallRecoveryTab />}
        {activeTab === 'channels' && <ChannelPerformanceTab />}
        {activeTab === 'locations' && <LocationPerformanceTab />}
        {activeTab === 'playbooks' && <PlaybookPerformanceTab />}
        {activeTab === 'qa' && <QaReviewTab />}
        {activeTab === 'crm' && <CrmHealthTab />}
      </div>
    </div>
  );
}
