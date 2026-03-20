import { useState } from 'react';
import {
  MessageSquareText,
  Plus,
  Search,
  ShieldCheck,
  ShieldAlert,
  Edit,
  Ban,
  Check,
  X,
  ToggleLeft,
  ToggleRight,
} from 'lucide-react';
import StatusBadge from '../components/shared/StatusBadge';

type PhraseType = 'approved' | 'prohibited';

interface Phrase {
  id: string;
  text: string;
  type: PhraseType;
  category: string;
  status: 'active' | 'inactive';
  addedBy: string;
  addedAt: string;
  reason?: string;
}

const categories = ['Empathy', 'Reassurance', 'Scheduling', 'Insurance', 'Credibility', 'Compliance', 'Pressure', 'Medical Claims'];

const initialPhrases: Phrase[] = [
  // Approved phrases
  { id: 'p-1', text: 'I understand your concern and want to help', type: 'approved', category: 'Empathy', status: 'active', addedBy: 'Dr. Garcia', addedAt: '2026-02-15', reason: 'Standard empathetic opening' },
  { id: 'p-2', text: 'Many of our patients have experienced similar symptoms', type: 'approved', category: 'Reassurance', status: 'active', addedBy: 'Sarah M.', addedAt: '2026-02-20', reason: 'Normalizes patient experience' },
  { id: 'p-3', text: 'I would recommend scheduling a consultation so our specialists can properly evaluate your condition', type: 'approved', category: 'Scheduling', status: 'active', addedBy: 'Dr. Garcia', addedAt: '2026-02-10', reason: 'Non-pressuring CTA' },
  { id: 'p-4', text: 'Coverage varies by plan, and we will verify your specific benefits before your appointment', type: 'approved', category: 'Insurance', status: 'active', addedBy: 'Dr. Chen', addedAt: '2026-03-01', reason: 'Safe insurance language, avoids guarantees' },
  { id: 'p-5', text: 'Our team has extensive experience with minimally invasive vein treatments', type: 'approved', category: 'Credibility', status: 'active', addedBy: 'Dr. Garcia', addedAt: '2026-02-12', reason: 'Builds trust without overclaiming' },
  { id: 'p-6', text: 'Is there a particular day or time that works best for your schedule?', type: 'approved', category: 'Scheduling', status: 'active', addedBy: 'Sarah M.', addedAt: '2026-02-25', reason: 'Patient-first scheduling approach' },
  { id: 'p-7', text: 'We accept most major insurance plans and can verify your coverage', type: 'approved', category: 'Insurance', status: 'active', addedBy: 'Dr. Chen', addedAt: '2026-03-01', reason: 'Accurate general statement' },
  { id: 'p-8', text: 'Thank you for sharing that information, it helps us prepare for your visit', type: 'approved', category: 'Empathy', status: 'active', addedBy: 'Sarah M.', addedAt: '2026-03-08', reason: 'Acknowledges patient effort' },

  // Prohibited phrases
  { id: 'p-9', text: 'guaranteed results', type: 'prohibited', category: 'Compliance', status: 'active', addedBy: 'Dr. Garcia', addedAt: '2026-03-18', reason: 'Cannot guarantee medical outcomes' },
  { id: 'p-10', text: 'you need this treatment immediately', type: 'prohibited', category: 'Pressure', status: 'active', addedBy: 'Dr. Chen', addedAt: '2026-03-05', reason: 'Creates undue urgency, could be considered coercive' },
  { id: 'p-11', text: 'your insurance will definitely cover this', type: 'prohibited', category: 'Insurance', status: 'active', addedBy: 'Dr. Chen', addedAt: '2026-03-01', reason: 'Cannot make definitive insurance coverage claims' },
  { id: 'p-12', text: 'this is a painless procedure', type: 'prohibited', category: 'Medical Claims', status: 'active', addedBy: 'Dr. Garcia', addedAt: '2026-02-28', reason: 'Pain experience varies; cannot claim zero pain' },
  { id: 'p-13', text: 'better than competitors', type: 'prohibited', category: 'Compliance', status: 'active', addedBy: 'Dr. Garcia', addedAt: '2026-02-20', reason: 'Comparative advertising compliance issue' },
  { id: 'p-14', text: 'cure your varicose veins', type: 'prohibited', category: 'Medical Claims', status: 'active', addedBy: 'Dr. Chen', addedAt: '2026-03-10', reason: 'Treatment manages/improves, not "cures"' },
  { id: 'p-15', text: 'limited time offer', type: 'prohibited', category: 'Pressure', status: 'active', addedBy: 'Sarah M.', addedAt: '2026-03-15', reason: 'Artificial urgency is off-brand for healthcare' },
  { id: 'p-16', text: 'act now before it gets worse', type: 'prohibited', category: 'Pressure', status: 'inactive', addedBy: 'Dr. Garcia', addedAt: '2026-02-10', reason: 'Deactivated; replaced with more nuanced guidance' },
  { id: 'p-17', text: '100% success rate', type: 'prohibited', category: 'Medical Claims', status: 'active', addedBy: 'Dr. Chen', addedAt: '2026-03-12', reason: 'No medical procedure has 100% success rate' },
];

export default function PhrasesPage() {
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<PhraseType>('approved');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [phrases, setPhrases] = useState(initialPhrases);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newPhrase, setNewPhrase] = useState({ text: '', type: 'approved' as PhraseType, category: '', reason: '' });

  const tabPhrases = phrases.filter((p) => p.type === activeTab);

  const filtered = tabPhrases.filter((p) => {
    const matchesSearch =
      search === '' ||
      p.text.toLowerCase().includes(search.toLowerCase()) ||
      p.reason?.toLowerCase().includes(search.toLowerCase());
    const matchesCat = categoryFilter === 'all' || p.category === categoryFilter;
    return matchesSearch && matchesCat;
  });

  const approvedCount = phrases.filter((p) => p.type === 'approved' && p.status === 'active').length;
  const prohibitedCount = phrases.filter((p) => p.type === 'prohibited' && p.status === 'active').length;

  const toggleStatus = (id: string) => {
    setPhrases((prev) =>
      prev.map((p) =>
        p.id === id ? { ...p, status: p.status === 'active' ? 'inactive' : 'active' } : p,
      ),
    );
  };

  const handleAddPhrase = () => {
    if (!newPhrase.text || !newPhrase.category) return;
    const phrase: Phrase = {
      id: `p-${phrases.length + 1}`,
      text: newPhrase.text,
      type: newPhrase.type,
      category: newPhrase.category,
      status: 'active',
      addedBy: 'Dr. J. Garcia',
      addedAt: new Date().toISOString().split('T')[0],
      reason: newPhrase.reason || undefined,
    };
    setPhrases((prev) => [...prev, phrase]);
    setNewPhrase({ text: '', type: activeTab, category: '', reason: '' });
    setShowAddForm(false);
  };

  const tabCategories = [...new Set(tabPhrases.map((p) => p.category))];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1>Phrase Library</h1>
          <p className="text-healthcare-muted mt-1">
            Manage approved and prohibited phrases for bot responses
          </p>
        </div>
        <button onClick={() => { setNewPhrase({ ...newPhrase, type: activeTab }); setShowAddForm(true); }} className="btn-primary">
          <Plus className="w-4 h-4" />
          Add Phrase
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-4 max-w-md">
        <div className="card card-body flex items-center gap-3">
          <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <p className="text-2xl font-bold">{approvedCount}</p>
            <p className="text-xs text-healthcare-muted">Approved Phrases</p>
          </div>
        </div>
        <div className="card card-body flex items-center gap-3">
          <div className="p-2 rounded-lg bg-red-50 text-red-600">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <p className="text-2xl font-bold">{prohibitedCount}</p>
            <p className="text-xs text-healthcare-muted">Prohibited Phrases</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-lg p-0.5 w-fit">
        <button
          onClick={() => { setActiveTab('approved'); setCategoryFilter('all'); }}
          className={`flex items-center gap-1.5 px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'approved' ? 'bg-white shadow-sm text-healthcare-text' : 'text-healthcare-muted'
          }`}
        >
          <ShieldCheck className="w-3.5 h-3.5" />
          Approved Phrases
        </button>
        <button
          onClick={() => { setActiveTab('prohibited'); setCategoryFilter('all'); }}
          className={`flex items-center gap-1.5 px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'prohibited' ? 'bg-white shadow-sm text-healthcare-text' : 'text-healthcare-muted'
          }`}
        >
          <ShieldAlert className="w-3.5 h-3.5" />
          Prohibited Phrases
        </button>
      </div>

      {/* Add Form */}
      {showAddForm && (
        <div className="card card-body space-y-3">
          <h3 className="text-sm font-semibold">
            Add New {newPhrase.type === 'approved' ? 'Approved' : 'Prohibited'} Phrase
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-healthcare-muted mb-1">Phrase Text</label>
              <input
                type="text"
                value={newPhrase.text}
                onChange={(e) => setNewPhrase({ ...newPhrase, text: e.target.value })}
                placeholder="Enter the phrase..."
                className="input"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-healthcare-muted mb-1">Type</label>
                <select
                  value={newPhrase.type}
                  onChange={(e) => setNewPhrase({ ...newPhrase, type: e.target.value as PhraseType })}
                  className="select w-full"
                >
                  <option value="approved">Approved</option>
                  <option value="prohibited">Prohibited</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-healthcare-muted mb-1">Category</label>
                <select
                  value={newPhrase.category}
                  onChange={(e) => setNewPhrase({ ...newPhrase, category: e.target.value })}
                  className="select w-full"
                >
                  <option value="">Select category...</option>
                  {categories.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-healthcare-muted mb-1">Context / Reason</label>
            <input
              type="text"
              value={newPhrase.reason}
              onChange={(e) => setNewPhrase({ ...newPhrase, reason: e.target.value })}
              placeholder="Why is this phrase approved or prohibited?"
              className="input"
            />
          </div>
          <div className="flex justify-end gap-2">
            <button onClick={() => setShowAddForm(false)} className="btn-secondary">
              <X className="w-4 h-4" />
              Cancel
            </button>
            <button onClick={handleAddPhrase} className="btn-primary">
              <Check className="w-4 h-4" />
              Add Phrase
            </button>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-healthcare-muted" />
          <input
            type="text"
            placeholder="Search phrases..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input pl-10"
          />
        </div>

        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="select w-40"
        >
          <option value="all">All Categories</option>
          {tabCategories.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>

        <span className="text-xs text-healthcare-muted">
          {filtered.length} phrases
        </span>
      </div>

      {/* Phrase List */}
      <div className="space-y-2">
        {filtered.map((phrase) => (
          <div
            key={phrase.id}
            className={`card px-5 py-3 ${phrase.status === 'inactive' ? 'opacity-50' : ''}`}
          >
            <div className="flex items-start gap-4">
              <div
                className={`p-1.5 rounded mt-0.5 shrink-0 ${
                  phrase.type === 'approved'
                    ? 'bg-emerald-50 text-emerald-600'
                    : 'bg-red-50 text-red-600'
                }`}
              >
                {phrase.type === 'approved' ? (
                  <ShieldCheck className="w-4 h-4" />
                ) : (
                  <ShieldAlert className="w-4 h-4" />
                )}
              </div>

              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">
                  {phrase.type === 'prohibited' ? (
                    <span className="line-through text-red-600">&ldquo;{phrase.text}&rdquo;</span>
                  ) : (
                    <span className="text-emerald-700">&ldquo;{phrase.text}&rdquo;</span>
                  )}
                </p>
                {phrase.reason && (
                  <p className="text-xs text-healthcare-muted mt-1">{phrase.reason}</p>
                )}
                <div className="flex items-center gap-3 mt-2 text-xs text-healthcare-muted">
                  <span>Added by <span className="font-medium text-healthcare-text">{phrase.addedBy}</span></span>
                  <span>{phrase.addedAt}</span>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <span className="badge bg-gray-100 text-gray-600">{phrase.category}</span>
                <StatusBadge
                  variant={phrase.status === 'active' ? 'active' : 'inactive'}
                  label={phrase.status}
                />
              </div>

              <div className="flex items-center gap-1 shrink-0">
                <button
                  onClick={() => toggleStatus(phrase.id)}
                  className="btn-ghost"
                  title={phrase.status === 'active' ? 'Deactivate' : 'Activate'}
                >
                  {phrase.status === 'active' ? (
                    <ToggleRight className="w-5 h-5 text-emerald-600" />
                  ) : (
                    <ToggleLeft className="w-5 h-5 text-gray-400" />
                  )}
                </button>
                <button className="btn-ghost" title="Edit">
                  <Edit className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-12 text-healthcare-muted">
          <MessageSquareText className="w-10 h-10 mx-auto mb-3 opacity-40" />
          <p className="text-sm">No phrases match your criteria</p>
        </div>
      )}
    </div>
  );
}
