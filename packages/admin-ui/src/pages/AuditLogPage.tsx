import { useState, Fragment } from 'react';
import {
  ScrollText,
  Search,
  Download,
  Eye,
  ChevronDown,
  ChevronRight,
} from 'lucide-react';
import StatusBadge from '../components/shared/StatusBadge';
import DiffViewer from '../components/shared/DiffViewer';

interface AuditEntry {
  id: string;
  actor: string;
  actorRole: string;
  action: string;
  entityType: string;
  entityName: string;
  entityId: string;
  timestamp: string;
  reason?: string;
  diff?: { before: string; after: string };
}

const mockEntries: AuditEntry[] = [
  {
    id: 'audit-1',
    actor: 'Sarah M.',
    actorRole: 'manager',
    action: 'published',
    entityType: 'playbook',
    entityName: 'Insurance Pre-Authorization',
    entityId: 'pb-3',
    timestamp: '2026-03-20 09:45:12',
    reason: 'Completed compliance review, approved by Dr. Garcia',
    diff: {
      before: 'status: review\nversion: v1.3\napproved_by: pending',
      after: 'status: published\nversion: v1.4\napproved_by: Dr. Garcia',
    },
  },
  {
    id: 'audit-2',
    actor: 'Dr. Garcia',
    actorRole: 'admin',
    action: 'updated',
    entityType: 'slider',
    entityName: 'Empathy Dial',
    entityId: 'slider-empathy',
    timestamp: '2026-03-20 08:30:00',
    reason: 'Increasing warmth for SMS recovery messages',
    diff: {
      before: 'value: 6\nscope: sms_channel',
      after: 'value: 8\nscope: sms_channel',
    },
  },
  {
    id: 'audit-3',
    actor: 'System',
    actorRole: 'system',
    action: 'escalated',
    entityType: 'conversation',
    entityName: 'Conversation #2847',
    entityId: 'conv-2847',
    timestamp: '2026-03-20 07:15:33',
    reason: 'Patient expressed frustration, confidence dropped below threshold',
  },
  {
    id: 'audit-4',
    actor: 'Mike R.',
    actorRole: 'frontline_operator',
    action: 'submitted_feedback',
    entityType: 'message',
    entityName: 'Bot response in conv #2830',
    entityId: 'msg-4521',
    timestamp: '2026-03-19 16:45:00',
    reason: 'Parking info incorrect for Downtown location',
  },
  {
    id: 'audit-5',
    actor: 'Sarah M.',
    actorRole: 'manager',
    action: 'created',
    entityType: 'sms_template',
    entityName: 'Insurance Verification Needed',
    entityId: 'sms-5',
    timestamp: '2026-03-19 14:20:00',
  },
  {
    id: 'audit-6',
    actor: 'Dr. Garcia',
    actorRole: 'admin',
    action: 'updated',
    entityType: 'location',
    entityName: 'Downtown Vein Center',
    entityId: 'loc-1',
    timestamp: '2026-03-19 11:00:00',
    reason: 'Updated Saturday hours',
    diff: {
      before: 'hours: Mon-Fri 8am-5pm',
      after: 'hours: Mon-Fri 8am-5pm, Sat 9am-1pm',
    },
  },
  {
    id: 'audit-7',
    actor: 'System',
    actorRole: 'system',
    action: 'synced',
    entityType: 'crm',
    entityName: 'CRM Sync Batch #412',
    entityId: 'sync-412',
    timestamp: '2026-03-19 06:00:00',
    reason: '14 records synced, 2 conflicts resolved',
  },
  {
    id: 'audit-8',
    actor: 'Dr. Garcia',
    actorRole: 'admin',
    action: 'added_phrase',
    entityType: 'phrase',
    entityName: '"guaranteed results"',
    entityId: 'phrase-new-1',
    timestamp: '2026-03-18 15:30:00',
    reason: 'Added to prohibited list - compliance requirement',
  },
  {
    id: 'audit-9',
    actor: 'Sarah M.',
    actorRole: 'manager',
    action: 'applied_preset',
    entityType: 'slider',
    entityName: 'Recovery Mode preset',
    entityId: 'preset-recovery',
    timestamp: '2026-03-18 10:00:00',
    reason: 'Switching to recovery mode for weekend campaign',
    diff: {
      before: 'preset: balanced\nempathy: 6\nurgency: 5',
      after: 'preset: recovery\nempathy: 8\nurgency: 7',
    },
  },
  {
    id: 'audit-10',
    actor: 'Mike R.',
    actorRole: 'frontline_operator',
    action: 'dismissed_feedback',
    entityType: 'feedback',
    entityName: 'Feedback #fb-6',
    entityId: 'fb-6',
    timestamp: '2026-03-17 16:00:00',
    reason: 'After discussion, response length was appropriate for the context',
  },
  {
    id: 'audit-11',
    actor: 'Sarah M.',
    actorRole: 'manager',
    action: 'deleted',
    entityType: 'sms_template',
    entityName: 'Old Welcome Message',
    entityId: 'sms-old-1',
    timestamp: '2026-03-17 10:15:00',
    reason: 'Deprecated template replaced by v2',
  },
  {
    id: 'audit-12',
    actor: 'System',
    actorRole: 'system',
    action: 'created',
    entityType: 'user',
    entityName: 'Dr. Kim',
    entityId: 'user-kim',
    timestamp: '2026-03-16 09:00:00',
    reason: 'New provider added to Westlake location',
  },
];

const actionColors: Record<string, string> = {
  published: 'success',
  updated: 'info',
  created: 'info',
  escalated: 'warning',
  submitted_feedback: 'review',
  synced: 'success',
  added_phrase: 'info',
  applied_preset: 'info',
  dismissed_feedback: 'archived',
  deleted: 'error',
};

const uniqueActors = [...new Set(mockEntries.map((e) => e.actor))];
const uniqueActions = [...new Set(mockEntries.map((e) => e.action))];

export default function AuditLogPage() {
  const [search, setSearch] = useState('');
  const [entityFilter, setEntityFilter] = useState('all');
  const [userFilter, setUserFilter] = useState('all');
  const [actionFilter, setActionFilter] = useState('all');
  const [dateFrom, setDateFrom] = useState('2026-03-16');
  const [dateTo, setDateTo] = useState('2026-03-20');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filtered = mockEntries.filter((entry) => {
    const matchesSearch =
      search === '' ||
      entry.actor.toLowerCase().includes(search.toLowerCase()) ||
      entry.entityName.toLowerCase().includes(search.toLowerCase()) ||
      entry.action.toLowerCase().includes(search.toLowerCase()) ||
      entry.reason?.toLowerCase().includes(search.toLowerCase());
    const matchesEntity = entityFilter === 'all' || entry.entityType === entityFilter;
    const matchesUser = userFilter === 'all' || entry.actor === userFilter;
    const matchesAction = actionFilter === 'all' || entry.action === actionFilter;
    const entryDate = entry.timestamp.split(' ')[0];
    const matchesDate = entryDate >= dateFrom && entryDate <= dateTo;
    return matchesSearch && matchesEntity && matchesUser && matchesAction && matchesDate;
  });

  const handleExport = () => {
    const headers = ['Timestamp', 'User', 'Role', 'Action', 'Entity Type', 'Entity', 'Entity ID', 'Reason'];
    const rows = filtered.map((e) => [
      e.timestamp, e.actor, e.actorRole, e.action, e.entityType, e.entityName, e.entityId, e.reason || '',
    ]);
    const csv = [headers, ...rows].map((r) => r.map((c) => `"${c}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `audit-log-${dateFrom}-to-${dateTo}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1>Audit Log</h1>
          <p className="text-healthcare-muted mt-1">
            Complete history of all system changes and actions
          </p>
        </div>
        <button onClick={handleExport} className="btn-secondary">
          <Download className="w-4 h-4" />
          Export CSV
        </button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-healthcare-muted" />
          <input
            type="text"
            placeholder="Search by actor, entity, or action..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input pl-10"
          />
        </div>

        <select
          value={userFilter}
          onChange={(e) => setUserFilter(e.target.value)}
          className="select w-36"
        >
          <option value="all">All Users</option>
          {uniqueActors.map((a) => (
            <option key={a} value={a}>{a}</option>
          ))}
        </select>

        <select
          value={entityFilter}
          onChange={(e) => setEntityFilter(e.target.value)}
          className="select w-40"
        >
          <option value="all">All Entities</option>
          <option value="playbook">Playbooks</option>
          <option value="slider">Sliders</option>
          <option value="conversation">Conversations</option>
          <option value="sms_template">SMS Templates</option>
          <option value="location">Locations</option>
          <option value="phrase">Phrases</option>
          <option value="crm">CRM</option>
          <option value="feedback">Feedback</option>
          <option value="user">Users</option>
        </select>

        <select
          value={actionFilter}
          onChange={(e) => setActionFilter(e.target.value)}
          className="select w-44"
        >
          <option value="all">All Actions</option>
          {uniqueActions.map((a) => (
            <option key={a} value={a}>{a.replace(/_/g, ' ')}</option>
          ))}
        </select>

        <div className="flex items-center gap-2">
          <input
            type="date"
            className="input w-40"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
          />
          <span className="text-healthcare-muted text-sm">to</span>
          <input
            type="date"
            className="input w-40"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
          />
        </div>
      </div>

      <p className="text-xs text-healthcare-muted">{filtered.length} entries found</p>

      {/* Table */}
      <div className="card overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-healthcare-line">
            <tr>
              <th className="table-header w-44">Timestamp</th>
              <th className="table-header w-32">User</th>
              <th className="table-header w-36">Action</th>
              <th className="table-header w-28">Entity Type</th>
              <th className="table-header">Entity</th>
              <th className="table-header w-16">ID</th>
              <th className="table-header">Reason</th>
              <th className="table-header w-12"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-healthcare-line">
            {filtered.map((entry) => (
              <Fragment key={entry.id}>
                <tr
                  className="hover:bg-gray-50 cursor-pointer"
                  onClick={() =>
                    setExpandedId(expandedId === entry.id ? null : entry.id)
                  }
                >
                  <td className="table-cell text-xs text-healthcare-muted font-mono">
                    {entry.timestamp}
                  </td>
                  <td className="table-cell">
                    <div>
                      <p className="text-sm font-medium">{entry.actor}</p>
                      <p className="text-xs text-healthcare-muted">{entry.actorRole}</p>
                    </div>
                  </td>
                  <td className="table-cell">
                    <StatusBadge
                      variant={(actionColors[entry.action] as any) || 'info'}
                      label={entry.action.replace(/_/g, ' ')}
                    />
                  </td>
                  <td className="table-cell text-xs text-healthcare-muted">
                    {entry.entityType.replace(/_/g, ' ')}
                  </td>
                  <td className="table-cell">
                    <p className="text-sm truncate max-w-xs">{entry.entityName}</p>
                  </td>
                  <td className="table-cell">
                    <code className="text-xs text-healthcare-muted">{entry.entityId}</code>
                  </td>
                  <td className="table-cell text-sm text-healthcare-muted truncate max-w-xs">
                    {entry.reason || '-'}
                  </td>
                  <td className="table-cell">
                    <div className="flex items-center gap-1">
                      {entry.diff && (
                        <Eye className="w-3.5 h-3.5 text-healthcare-muted" />
                      )}
                      {expandedId === entry.id ? (
                        <ChevronDown className="w-3.5 h-3.5 text-healthcare-muted" />
                      ) : (
                        <ChevronRight className="w-3.5 h-3.5 text-healthcare-muted" />
                      )}
                    </div>
                  </td>
                </tr>
                {expandedId === entry.id && (
                  <tr>
                    <td colSpan={8} className="p-4 bg-gray-50">
                      {entry.diff ? (
                        <DiffViewer
                          before={entry.diff.before}
                          after={entry.diff.after}
                          title={`Changes to ${entry.entityName}`}
                        />
                      ) : (
                        <div className="text-sm text-healthcare-muted">
                          <p className="font-medium mb-2">Details</p>
                          <div className="grid grid-cols-2 gap-4 text-xs">
                            <div>
                              <span className="font-medium">Actor:</span> {entry.actor} ({entry.actorRole})
                            </div>
                            <div>
                              <span className="font-medium">Entity ID:</span>{' '}
                              <code className="bg-gray-100 px-1.5 py-0.5 rounded">{entry.entityId}</code>
                            </div>
                            <div>
                              <span className="font-medium">Timestamp:</span> {entry.timestamp}
                            </div>
                            {entry.reason && (
                              <div>
                                <span className="font-medium">Reason:</span> {entry.reason}
                              </div>
                            )}
                          </div>
                          <p className="text-xs text-healthcare-muted mt-3 italic">
                            No value changes recorded for this action.
                          </p>
                        </div>
                      )}
                    </td>
                  </tr>
                )}
              </Fragment>
            ))}
          </tbody>
        </table>
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-12 text-healthcare-muted">
          <ScrollText className="w-10 h-10 mx-auto mb-3 opacity-40" />
          <p className="text-sm">No audit entries match your criteria</p>
        </div>
      )}
    </div>
  );
}
