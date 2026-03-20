import { useState } from 'react';
import {
  MessageCircle,
  Plus,
  Search,
  Edit,
  Copy,
  Eye,
  Beaker,
  Check,
  X,
} from 'lucide-react';
import StatusBadge from '../components/shared/StatusBadge';

interface SmsTemplate {
  id: string;
  name: string;
  category: string;
  body: string;
  variants: { id: string; label: string; body: string; conversionRate?: number }[];
  status: 'active' | 'draft' | 'archived';
  lastModified: string;
  characterCount: number;
}

const mockTemplates: SmsTemplate[] = [
  {
    id: 'sms-1',
    name: 'Missed Call Follow-Up',
    category: 'Recovery',
    body: 'Hi {{first_name}}, we noticed we missed your call at {{location_name}}. We would love to help! Reply YES to schedule a callback or visit {{booking_link}}.',
    variants: [
      { id: 'v1a', label: 'Control', body: 'Hi {{first_name}}, we noticed we missed your call at {{location_name}}. We would love to help! Reply YES to schedule a callback or visit {{booking_link}}.', conversionRate: 18.4 },
      { id: 'v1b', label: 'Variant B - Empathetic', body: 'Hi {{first_name}}, sorry we missed you! Our team at {{location_name}} wants to make sure your concerns are addressed. Reply YES and we will call you back at a time that works.', conversionRate: 22.1 },
    ],
    status: 'active',
    lastModified: '2026-03-18',
    characterCount: 148,
  },
  {
    id: 'sms-2',
    name: 'Appointment Confirmation',
    category: 'Scheduling',
    body: 'Your appointment at {{location_name}} is confirmed for {{appointment_date}} at {{appointment_time}}. Please bring your insurance card and photo ID. Reply CANCEL to reschedule.',
    variants: [],
    status: 'active',
    lastModified: '2026-03-15',
    characterCount: 162,
  },
  {
    id: 'sms-3',
    name: 'Appointment Reminder (24hr)',
    category: 'Scheduling',
    body: 'Reminder: Your vein consultation is tomorrow, {{appointment_date}} at {{appointment_time}} with {{provider_name}}. Location: {{location_address}}. Reply CONFIRM or RESCHEDULE.',
    variants: [],
    status: 'active',
    lastModified: '2026-03-14',
    characterCount: 170,
  },
  {
    id: 'sms-4',
    name: 'Post-Procedure Check-In',
    category: 'Follow-Up',
    body: 'Hi {{first_name}}, checking in after your procedure yesterday. How are you feeling? If you have any concerns, reply here or call us at {{location_phone}}.',
    variants: [
      { id: 'v4a', label: 'Control', body: 'Hi {{first_name}}, checking in after your procedure yesterday. How are you feeling? If you have any concerns, reply here or call us at {{location_phone}}.', conversionRate: 34.2 },
      { id: 'v4b', label: 'Variant B - Specific', body: 'Hi {{first_name}}, Dr. {{provider_name}} wanted to check: how is your {{treatment_area}} feeling today? Any swelling or discomfort? We are here to help.', conversionRate: 41.8 },
    ],
    status: 'active',
    lastModified: '2026-03-12',
    characterCount: 155,
  },
  {
    id: 'sms-5',
    name: 'Insurance Verification Needed',
    category: 'Insurance',
    body: 'Hi {{first_name}}, to move forward with your vein consultation, we need to verify your insurance. Please reply with your insurance provider and member ID, or call {{location_phone}}.',
    variants: [],
    status: 'draft',
    lastModified: '2026-03-20',
    characterCount: 178,
  },
  {
    id: 'sms-6',
    name: 'Patient Reactivation',
    category: 'Recovery',
    body: 'Hi {{first_name}}, it has been a while since your last visit to {{location_name}}. We have new treatment options that might interest you. Reply INFO to learn more or BOOK to schedule.',
    variants: [],
    status: 'draft',
    lastModified: '2026-03-19',
    characterCount: 176,
  },
];

export default function SmsTemplatesPage() {
  const [search, setSearch] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editBody, setEditBody] = useState('');
  const [previewTemplate, setPreviewTemplate] = useState<SmsTemplate | null>(null);

  const filtered = mockTemplates.filter(
    (t) =>
      t.name.toLowerCase().includes(search.toLowerCase()) ||
      t.category.toLowerCase().includes(search.toLowerCase()),
  );

  const startEdit = (template: SmsTemplate) => {
    setEditingId(template.id);
    setEditBody(template.body);
  };

  const previewText = (body: string) =>
    body
      .replace('{{first_name}}', 'Sarah')
      .replace('{{location_name}}', 'Downtown Vein Center')
      .replace('{{location_phone}}', '(512) 555-0101')
      .replace('{{location_address}}', '450 Medical Park Dr')
      .replace('{{appointment_date}}', 'March 22')
      .replace('{{appointment_time}}', '2:00 PM')
      .replace('{{provider_name}}', 'Dr. Martinez')
      .replace('{{booking_link}}', 'veinclinic.com/book')
      .replace('{{treatment_area}}', 'left leg')
      .replace('{{insurance_provider}}', 'BlueCross');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1>SMS Templates</h1>
          <p className="text-healthcare-muted mt-1">
            Manage message templates and A/B test variants
          </p>
        </div>
        <button className="btn-primary">
          <Plus className="w-4 h-4" />
          New Template
        </button>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-healthcare-muted" />
        <input
          type="text"
          placeholder="Search templates..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="input pl-10"
        />
      </div>

      <div className="space-y-4">
        {filtered.map((template) => (
          <div key={template.id} className="card">
            <div className="card-header flex items-center justify-between">
              <div className="flex items-center gap-3">
                <MessageCircle className="w-4 h-4 text-brand-600" />
                <h3 className="text-sm font-semibold">{template.name}</h3>
                <StatusBadge
                  variant={template.status === 'active' ? 'published' : template.status === 'draft' ? 'draft' : 'archived'}
                  label={template.status}
                />
                <span className="badge bg-gray-100 text-gray-600">{template.category}</span>
              </div>
              <div className="flex items-center gap-1">
                <button onClick={() => setPreviewTemplate(template)} className="btn-ghost" title="Preview">
                  <Eye className="w-4 h-4" />
                </button>
                <button onClick={() => startEdit(template)} className="btn-ghost" title="Edit">
                  <Edit className="w-4 h-4" />
                </button>
                <button className="btn-ghost" title="Duplicate">
                  <Copy className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="card-body">
              {editingId === template.id ? (
                <div className="space-y-3">
                  <textarea
                    value={editBody}
                    onChange={(e) => setEditBody(e.target.value)}
                    rows={3}
                    className="input resize-none font-mono text-sm"
                  />
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-healthcare-muted">
                      {editBody.length} characters ({editBody.length > 160 ? Math.ceil(editBody.length / 153) + ' segments' : '1 segment'})
                    </span>
                    <div className="flex gap-2">
                      <button onClick={() => setEditingId(null)} className="btn-secondary text-xs">
                        <X className="w-3.5 h-3.5" />
                        Cancel
                      </button>
                      <button onClick={() => setEditingId(null)} className="btn-primary text-xs">
                        <Check className="w-3.5 h-3.5" />
                        Save
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-sm font-mono text-healthcare-muted bg-gray-50 rounded-lg p-3">
                  {template.body}
                </p>
              )}

              {/* A/B Variants */}
              {template.variants.length > 0 && (
                <div className="mt-4 pt-4 border-t border-healthcare-border">
                  <div className="flex items-center gap-2 mb-3">
                    <Beaker className="w-4 h-4 text-purple-600" />
                    <span className="text-xs font-medium text-purple-700">
                      A/B Test ({template.variants.length} variants)
                    </span>
                  </div>
                  <div className="space-y-2">
                    {template.variants.map((v) => (
                      <div key={v.id} className="flex items-start gap-3 bg-gray-50 rounded-lg p-3">
                        <span className="badge bg-purple-50 text-purple-700 shrink-0">
                          {v.label}
                        </span>
                        <p className="text-xs font-mono text-healthcare-muted flex-1">
                          {v.body}
                        </p>
                        {v.conversionRate !== undefined && (
                          <span className="text-xs font-medium text-emerald-600 shrink-0">
                            {v.conversionRate}%
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Preview Modal */}
      {previewTemplate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl shadow-2xl w-80 overflow-hidden">
            <div className="bg-gray-900 text-white px-4 py-3 flex items-center justify-between">
              <span className="text-sm font-medium">SMS Preview</span>
              <button onClick={() => setPreviewTemplate(null)}>
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-4 bg-gray-100 min-h-[200px]">
              <div className="bg-brand-600 text-white rounded-2xl rounded-br-sm px-4 py-2 text-sm max-w-[85%] ml-auto">
                {previewText(previewTemplate.body)}
              </div>
            </div>
            <div className="px-4 py-3 border-t text-xs text-healthcare-muted text-center">
              {previewText(previewTemplate.body).length} characters
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
