import { useState } from 'react';
import {
  Database,
  RefreshCw,
  ArrowRight,
  Eye,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
  Loader2,
} from 'lucide-react';
import StatusBadge from '../components/shared/StatusBadge';
import CrmReadyBadge from '../components/shared/CrmReadyBadge';

interface FieldMapping {
  id: string;
  chatbotField: string;
  crmField: string;
  crmObject: string;
  dataType: string;
  required: boolean;
  autoSync: boolean;
  transformRule: string;
  status: 'mapped' | 'unmapped' | 'error';
  lastSynced?: string;
}

interface SyncLogEntry {
  id: string;
  timestamp: string;
  type: 'success' | 'error' | 'warning';
  recordCount: number;
  message: string;
  duration: string;
}

const mockMappings: FieldMapping[] = [
  { id: 'fm-1', chatbotField: 'patient.first_name', crmField: 'Contact.FirstName', crmObject: 'Contact', dataType: 'string', required: true, autoSync: true, transformRule: 'title_case', status: 'mapped', lastSynced: '2 min ago' },
  { id: 'fm-2', chatbotField: 'patient.last_name', crmField: 'Contact.LastName', crmObject: 'Contact', dataType: 'string', required: true, autoSync: true, transformRule: 'title_case', status: 'mapped', lastSynced: '2 min ago' },
  { id: 'fm-3', chatbotField: 'patient.phone', crmField: 'Contact.Phone', crmObject: 'Contact', dataType: 'phone', required: true, autoSync: true, transformRule: 'e164_format', status: 'mapped', lastSynced: '2 min ago' },
  { id: 'fm-4', chatbotField: 'patient.email', crmField: 'Contact.Email', crmObject: 'Contact', dataType: 'email', required: false, autoSync: true, transformRule: 'lowercase', status: 'mapped', lastSynced: '5 min ago' },
  { id: 'fm-5', chatbotField: 'patient.dob', crmField: 'Contact.DateOfBirth', crmObject: 'Contact', dataType: 'date', required: false, autoSync: true, transformRule: 'iso_date', status: 'mapped', lastSynced: '5 min ago' },
  { id: 'fm-6', chatbotField: 'insurance.provider', crmField: 'Insurance__c.Provider__c', crmObject: 'Insurance__c', dataType: 'picklist', required: true, autoSync: true, transformRule: 'match_picklist', status: 'mapped', lastSynced: '2 min ago' },
  { id: 'fm-7', chatbotField: 'insurance.member_id', crmField: 'Insurance__c.MemberId__c', crmObject: 'Insurance__c', dataType: 'string', required: true, autoSync: true, transformRule: 'uppercase', status: 'mapped', lastSynced: '10 min ago' },
  { id: 'fm-8', chatbotField: 'insurance.group_number', crmField: 'Insurance__c.GroupNumber__c', crmObject: 'Insurance__c', dataType: 'string', required: false, autoSync: false, transformRule: 'none', status: 'unmapped' },
  { id: 'fm-9', chatbotField: 'case.symptoms', crmField: 'Case.Symptoms__c', crmObject: 'Case', dataType: 'multi_select', required: false, autoSync: true, transformRule: 'symptom_taxonomy', status: 'mapped', lastSynced: '2 min ago' },
  { id: 'fm-10', chatbotField: 'case.affected_area', crmField: 'Case.AffectedArea__c', crmObject: 'Case', dataType: 'string', required: false, autoSync: true, transformRule: 'anatomical_normalize', status: 'mapped', lastSynced: '2 min ago' },
  { id: 'fm-11', chatbotField: 'case.severity', crmField: 'Case.SeverityRating__c', crmObject: 'Case', dataType: 'number', required: false, autoSync: true, transformRule: 'severity_scale', status: 'mapped', lastSynced: '15 min ago' },
  { id: 'fm-12', chatbotField: 'appointment.location_id', crmField: 'Appointment.LocationId', crmObject: 'Appointment', dataType: 'lookup', required: true, autoSync: true, transformRule: 'location_lookup', status: 'mapped', lastSynced: '2 min ago' },
  { id: 'fm-13', chatbotField: 'appointment.preferred_date', crmField: 'Appointment.PreferredDate__c', crmObject: 'Appointment', dataType: 'date', required: false, autoSync: true, transformRule: 'iso_date', status: 'mapped', lastSynced: '2 min ago' },
  { id: 'fm-14', chatbotField: 'appointment.provider', crmField: 'Appointment.ProviderId', crmObject: 'Appointment', dataType: 'lookup', required: false, autoSync: true, transformRule: 'provider_lookup', status: 'error', lastSynced: 'Failed' },
  { id: 'fm-15', chatbotField: 'source.channel', crmField: 'Lead.LeadSource', crmObject: 'Lead', dataType: 'picklist', required: true, autoSync: true, transformRule: 'channel_map', status: 'mapped', lastSynced: '2 min ago' },
  { id: 'fm-16', chatbotField: 'source.campaign', crmField: 'Lead.CampaignId', crmObject: 'Lead', dataType: 'lookup', required: false, autoSync: false, transformRule: 'campaign_lookup', status: 'unmapped' },
];

const syncStats = {
  totalLeads: 1247,
  synced: 1192,
  pending: 52,
  failed: 3,
  lastSync: '2026-03-20 10:42:00',
  avgSyncTime: '1.2s',
  uptime: '99.8%',
};

const mockSyncLog: SyncLogEntry[] = [
  { id: 'sl-1', timestamp: '2026-03-20 10:42:00', type: 'success', recordCount: 8, message: 'Batch sync completed - 8 records processed', duration: '1.1s' },
  { id: 'sl-2', timestamp: '2026-03-20 10:30:00', type: 'success', recordCount: 3, message: 'Real-time sync - 3 new leads pushed', duration: '0.8s' },
  { id: 'sl-3', timestamp: '2026-03-20 10:15:00', type: 'error', recordCount: 1, message: 'Provider lookup failed for Appointment.ProviderId - invalid provider reference', duration: '2.3s' },
  { id: 'sl-4', timestamp: '2026-03-20 09:00:00', type: 'success', recordCount: 14, message: 'Scheduled batch sync - 14 records synced, 0 conflicts', duration: '1.5s' },
  { id: 'sl-5', timestamp: '2026-03-20 06:00:00', type: 'warning', recordCount: 12, message: 'Batch sync with warnings - 2 records had stale insurance data, auto-resolved', duration: '1.8s' },
  { id: 'sl-6', timestamp: '2026-03-19 18:00:00', type: 'success', recordCount: 6, message: 'End-of-day sync - 6 records processed', duration: '0.9s' },
  { id: 'sl-7', timestamp: '2026-03-19 12:00:00', type: 'success', recordCount: 22, message: 'Midday batch sync - 22 records, highest volume this week', duration: '2.1s' },
];

const samplePayload = {
  Contact: {
    FirstName: 'Sarah',
    LastName: 'Thompson',
    Phone: '+15125550847',
    Email: 'sarah.t@email.com',
    DateOfBirth: '1985-03-15',
  },
  'Insurance__c': {
    'Provider__c': 'BlueCross BlueShield',
    'MemberId__c': 'BC-4412897',
    'GroupNumber__c': null,
  },
  Case: {
    'Symptoms__c': ['aching', 'visible_bulging_veins'],
    'AffectedArea__c': 'Left leg, posterior knee',
    'SeverityRating__c': 6,
  },
  Appointment: {
    LocationId: 'loc-001',
    'PreferredDate__c': '2026-03-26',
    ProviderId: 'dr-martinez',
  },
  Lead: {
    LeadSource: 'SMS - Missed Call Recovery',
    CampaignId: null,
  },
};

export default function CrmMappingPage() {
  const [objectFilter, setObjectFilter] = useState('all');
  const [mappings, setMappings] = useState(mockMappings);
  const [syncing, setSyncing] = useState(false);
  const [selectedLead, setSelectedLead] = useState<string | null>('lead-847');

  const mappedCount = mappings.filter((m) => m.status === 'mapped').length;
  const errorCount = mappings.filter((m) => m.status === 'error').length;

  const filtered = mappings.filter(
    (m) => objectFilter === 'all' || m.crmObject === objectFilter,
  );

  const crmObjects = [...new Set(mappings.map((m) => m.crmObject))];

  const toggleAutoSync = (id: string) => {
    setMappings((prev) =>
      prev.map((m) => (m.id === id ? { ...m, autoSync: !m.autoSync } : m)),
    );
  };

  const handleManualSync = () => {
    setSyncing(true);
    setTimeout(() => setSyncing(false), 2000);
  };

  const dataTypeColors: Record<string, string> = {
    string: 'bg-gray-100 text-gray-600',
    phone: 'bg-blue-50 text-blue-600',
    email: 'bg-purple-50 text-purple-600',
    date: 'bg-teal-50 text-teal-600',
    number: 'bg-amber-50 text-amber-600',
    picklist: 'bg-indigo-50 text-indigo-600',
    multi_select: 'bg-pink-50 text-pink-600',
    lookup: 'bg-brand-50 text-brand-600',
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1>CRM Mapping</h1>
          <p className="text-healthcare-muted mt-1">
            Field mapping configuration and sync monitoring
          </p>
        </div>
        <div className="flex items-center gap-2">
          <CrmReadyBadge state={syncing ? 'syncing' : 'partial'} fieldsComplete={mappedCount} fieldsTotal={mappings.length} />
          <button onClick={handleManualSync} className="btn-primary" disabled={syncing}>
            {syncing ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4" />
            )}
            {syncing ? 'Syncing...' : 'Manual Sync'}
          </button>
        </div>
      </div>

      {/* Sync Status Dashboard */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="card card-body">
          <p className="text-xs text-healthcare-muted">Total Leads</p>
          <p className="text-2xl font-bold mt-1">{syncStats.totalLeads.toLocaleString()}</p>
        </div>
        <div className="card card-body">
          <p className="text-xs text-healthcare-muted">Synced</p>
          <p className="text-2xl font-bold mt-1 text-emerald-600">{syncStats.synced.toLocaleString()}</p>
          <p className="text-xs text-healthcare-muted mt-1">{Math.round(syncStats.synced / syncStats.totalLeads * 100)}% of total</p>
        </div>
        <div className="card card-body">
          <p className="text-xs text-healthcare-muted">Pending</p>
          <p className="text-2xl font-bold mt-1 text-amber-600">{syncStats.pending}</p>
        </div>
        <div className="card card-body">
          <p className="text-xs text-healthcare-muted">Failed</p>
          <p className="text-2xl font-bold mt-1 text-red-600">{syncStats.failed}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Mapping Table */}
        <div className="xl:col-span-2 space-y-6">
          <div className="card overflow-hidden">
            <div className="card-header flex items-center justify-between">
              <h3 className="text-sm font-semibold">Field Mappings</h3>
              <div className="flex items-center gap-2">
                <span className="text-xs text-healthcare-muted">
                  {mappedCount} mapped, {errorCount} errors
                </span>
                <select
                  value={objectFilter}
                  onChange={(e) => setObjectFilter(e.target.value)}
                  className="select w-40"
                >
                  <option value="all">All Objects</option>
                  {crmObjects.map((obj) => (
                    <option key={obj} value={obj}>{obj}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-healthcare-border">
                  <tr>
                    <th className="table-header">Chatbot Field</th>
                    <th className="table-header w-8"></th>
                    <th className="table-header">CRM Field</th>
                    <th className="table-header">Data Type</th>
                    <th className="table-header w-16">Req.</th>
                    <th className="table-header">Transform</th>
                    <th className="table-header w-20">Auto-Sync</th>
                    <th className="table-header">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-healthcare-border">
                  {filtered.map((mapping) => (
                    <tr key={mapping.id} className="hover:bg-gray-50">
                      <td className="table-cell">
                        <code className="text-xs bg-gray-100 px-2 py-0.5 rounded">
                          {mapping.chatbotField}
                        </code>
                      </td>
                      <td className="table-cell">
                        <ArrowRight className="w-4 h-4 text-healthcare-muted" />
                      </td>
                      <td className="table-cell">
                        <code className="text-xs bg-brand-50 text-brand-700 px-2 py-0.5 rounded">
                          {mapping.crmField}
                        </code>
                      </td>
                      <td className="table-cell">
                        <span className={`badge text-[10px] ${dataTypeColors[mapping.dataType] || 'bg-gray-100 text-gray-600'}`}>
                          {mapping.dataType}
                        </span>
                      </td>
                      <td className="table-cell text-center">
                        {mapping.required ? (
                          <span className="text-red-500 font-bold">*</span>
                        ) : (
                          <span className="text-healthcare-muted">-</span>
                        )}
                      </td>
                      <td className="table-cell">
                        <span className="text-xs text-healthcare-muted">
                          {mapping.transformRule.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td className="table-cell">
                        <button
                          onClick={(e) => { e.stopPropagation(); toggleAutoSync(mapping.id); }}
                          className={`relative w-9 h-5 rounded-full transition-colors ${
                            mapping.autoSync ? 'bg-brand-600' : 'bg-gray-300'
                          }`}
                        >
                          <span
                            className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${
                              mapping.autoSync ? 'translate-x-4' : 'translate-x-0.5'
                            }`}
                          />
                        </button>
                      </td>
                      <td className="table-cell">
                        <div className="flex items-center gap-2">
                          <StatusBadge
                            variant={
                              mapping.status === 'mapped'
                                ? 'success'
                                : mapping.status === 'error'
                                ? 'error'
                                : 'warning'
                            }
                            label={mapping.status}
                          />
                          {mapping.lastSynced && (
                            <span className="text-[10px] text-healthcare-muted whitespace-nowrap">
                              {mapping.lastSynced}
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Recent Sync Log */}
          <div className="card overflow-hidden">
            <div className="card-header flex items-center gap-2">
              <Clock className="w-4 h-4 text-healthcare-muted" />
              <h3 className="text-sm font-semibold">Recent Sync Log</h3>
            </div>
            <div className="divide-y divide-healthcare-border">
              {mockSyncLog.map((entry) => (
                <div key={entry.id} className="px-6 py-3 flex items-center gap-4">
                  <div className="shrink-0">
                    {entry.type === 'success' ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    ) : entry.type === 'error' ? (
                      <XCircle className="w-4 h-4 text-red-500" />
                    ) : (
                      <AlertTriangle className="w-4 h-4 text-amber-500" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-healthcare-text">{entry.message}</p>
                    <p className="text-xs text-healthcare-muted mt-0.5">
                      {entry.timestamp} &middot; {entry.recordCount} records &middot; {entry.duration}
                    </p>
                  </div>
                  <StatusBadge
                    variant={entry.type === 'success' ? 'success' : entry.type === 'error' ? 'error' : 'warning'}
                    label={entry.type}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right column: Payload Preview */}
        <div className="space-y-6">
          <div className="card">
            <div className="card-header flex items-center gap-2">
              <Eye className="w-4 h-4 text-healthcare-muted" />
              <h3 className="text-sm font-semibold">Payload Preview</h3>
            </div>
            <div className="card-body space-y-3">
              <div>
                <p className="text-xs text-healthcare-muted mb-2">Select lead:</p>
                <select
                  value={selectedLead || ''}
                  onChange={(e) => setSelectedLead(e.target.value)}
                  className="select w-full"
                >
                  <option value="lead-847">Lead #847 - Sarah Thompson</option>
                  <option value="lead-846">Lead #846 - James Wilson</option>
                  <option value="lead-845">Lead #845 - Maria Garcia</option>
                </select>
              </div>
              <p className="text-xs text-healthcare-muted">
                CRM payload for selected lead:
              </p>
              <pre className="bg-gray-900 text-emerald-400 rounded-lg p-4 text-xs overflow-x-auto font-mono max-h-[500px] overflow-y-auto">
                {JSON.stringify(samplePayload, null, 2)}
              </pre>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="card card-body space-y-3">
            <h3 className="text-sm font-semibold">Sync Health</h3>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-healthcare-muted">Last sync</span>
                <span className="font-mono text-xs">{syncStats.lastSync.split(' ')[1]}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-healthcare-muted">Avg sync time</span>
                <span>{syncStats.avgSyncTime}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-healthcare-muted">Uptime</span>
                <span className="text-emerald-600 font-medium">{syncStats.uptime}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-healthcare-muted">Success rate</span>
                <span className="text-emerald-600 font-medium">
                  {Math.round((syncStats.synced / (syncStats.synced + syncStats.failed)) * 100)}%
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
