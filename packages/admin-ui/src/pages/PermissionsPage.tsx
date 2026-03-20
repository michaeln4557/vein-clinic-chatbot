import { useState } from 'react';
import { Shield, Search, Edit, Check, X, UserPlus, ChevronDown } from 'lucide-react';
import StatusBadge from '../components/shared/StatusBadge';

type Role = 'frontline_operator' | 'manager' | 'admin' | 'engineering' | 'compliance_reviewer';

interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  status: 'active' | 'inactive';
  lastActive: string;
}

const mockUsers: User[] = [
  { id: 'u-1', name: 'Dr. J. Garcia', email: 'jgarcia@veinclinic.com', role: 'admin', status: 'active', lastActive: '2 min ago' },
  { id: 'u-2', name: 'Sarah Martinez', email: 'smartinez@veinclinic.com', role: 'manager', status: 'active', lastActive: '15 min ago' },
  { id: 'u-3', name: 'Mike Rodriguez', email: 'mrodriguez@veinclinic.com', role: 'frontline_operator', status: 'active', lastActive: '1 hr ago' },
  { id: 'u-4', name: 'Dr. Lisa Chen', email: 'lchen@veinclinic.com', role: 'compliance_reviewer', status: 'active', lastActive: '3 hrs ago' },
  { id: 'u-5', name: 'Tom Wilson', email: 'twilson@veinclinic.com', role: 'engineering', status: 'active', lastActive: '30 min ago' },
  { id: 'u-6', name: 'Amanda Foster', email: 'afoster@veinclinic.com', role: 'frontline_operator', status: 'active', lastActive: '2 hrs ago' },
  { id: 'u-7', name: 'David Park', email: 'dpark@veinclinic.com', role: 'frontline_operator', status: 'inactive', lastActive: '2 weeks ago' },
];

const roleLabels: Record<Role, string> = {
  frontline_operator: 'Frontline Operator',
  manager: 'Manager',
  admin: 'Admin',
  engineering: 'Engineering',
  compliance_reviewer: 'Compliance Reviewer',
};

const roleColors: Record<Role, string> = {
  frontline_operator: 'info',
  manager: 'warning',
  admin: 'error',
  engineering: 'success',
  compliance_reviewer: 'review',
};

type Permission = 'view' | 'edit' | 'approve' | 'none';

const permissionMatrix: Record<string, Record<Role, Permission>> = {
  'Dashboard': { frontline_operator: 'view', manager: 'view', admin: 'view', engineering: 'view', compliance_reviewer: 'view' },
  'Playbooks': { frontline_operator: 'view', manager: 'edit', admin: 'approve', engineering: 'edit', compliance_reviewer: 'approve' },
  'Approved Language': { frontline_operator: 'view', manager: 'edit', admin: 'approve', engineering: 'none', compliance_reviewer: 'approve' },
  'Behavior Controls': { frontline_operator: 'none', manager: 'edit', admin: 'approve', engineering: 'edit', compliance_reviewer: 'view' },
  'Locations': { frontline_operator: 'view', manager: 'edit', admin: 'approve', engineering: 'edit', compliance_reviewer: 'view' },
  'SMS Templates': { frontline_operator: 'view', manager: 'edit', admin: 'approve', engineering: 'edit', compliance_reviewer: 'approve' },
  'Review Queue': { frontline_operator: 'edit', manager: 'approve', admin: 'approve', engineering: 'view', compliance_reviewer: 'approve' },
  'Test / QA': { frontline_operator: 'view', manager: 'edit', admin: 'edit', engineering: 'edit', compliance_reviewer: 'view' },
  'Audit Log': { frontline_operator: 'none', manager: 'view', admin: 'view', engineering: 'view', compliance_reviewer: 'view' },
  'CRM Mapping': { frontline_operator: 'none', manager: 'view', admin: 'edit', engineering: 'edit', compliance_reviewer: 'view' },
  'Analytics': { frontline_operator: 'view', manager: 'view', admin: 'view', engineering: 'view', compliance_reviewer: 'view' },
  'Permissions': { frontline_operator: 'none', manager: 'none', admin: 'approve', engineering: 'none', compliance_reviewer: 'none' },
};

const permissionBadge: Record<Permission, { class: string; label: string }> = {
  view: { class: 'bg-blue-50 text-blue-700', label: 'View' },
  edit: { class: 'bg-amber-50 text-amber-700', label: 'Edit' },
  approve: { class: 'bg-emerald-50 text-emerald-700', label: 'Full' },
  none: { class: 'bg-gray-100 text-gray-400', label: '--' },
};

export default function PermissionsPage() {
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<'users' | 'matrix'>('users');
  const [users, setUsers] = useState(mockUsers);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newUser, setNewUser] = useState({ name: '', email: '', role: 'frontline_operator' as Role });

  const filteredUsers = users.filter(
    (u) =>
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase()),
  );

  const roles: Role[] = ['frontline_operator', 'manager', 'admin', 'engineering', 'compliance_reviewer'];

  const handleRoleChange = (userId: string, newRole: Role) => {
    setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, role: newRole } : u)));
  };

  const handleAddUser = () => {
    if (!newUser.name || !newUser.email) return;
    const user: User = {
      id: `u-${users.length + 1}`,
      name: newUser.name,
      email: newUser.email,
      role: newUser.role,
      status: 'active',
      lastActive: 'Just now',
    };
    setUsers((prev) => [...prev, user]);
    setNewUser({ name: '', email: '', role: 'frontline_operator' });
    setShowAddForm(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1>Permissions</h1>
          <p className="text-healthcare-muted mt-1">
            Manage user roles and access controls
          </p>
        </div>
        <button onClick={() => setShowAddForm(true)} className="btn-primary">
          <UserPlus className="w-4 h-4" />
          Add User
        </button>
      </div>

      {/* Add User Form */}
      {showAddForm && (
        <div className="card card-body space-y-4">
          <h3 className="text-sm font-semibold">Add New User</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-healthcare-muted mb-1">Full Name</label>
              <input
                type="text"
                value={newUser.name}
                onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                placeholder="e.g., Dr. Jane Smith"
                className="input"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-healthcare-muted mb-1">Email Address</label>
              <input
                type="email"
                value={newUser.email}
                onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                placeholder="e.g., jsmith@veinclinic.com"
                className="input"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-healthcare-muted mb-1">Role</label>
              <select
                value={newUser.role}
                onChange={(e) => setNewUser({ ...newUser, role: e.target.value as Role })}
                className="select w-full"
              >
                {roles.map((r) => (
                  <option key={r} value={r}>{roleLabels[r]}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <button onClick={() => setShowAddForm(false)} className="btn-secondary">
              <X className="w-4 h-4" />
              Cancel
            </button>
            <button onClick={handleAddUser} className="btn-primary">
              <Check className="w-4 h-4" />
              Add User
            </button>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-lg p-0.5 w-fit">
        <button
          onClick={() => setActiveTab('users')}
          className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'users' ? 'bg-white shadow-sm' : 'text-healthcare-muted'
          }`}
        >
          Users ({users.length})
        </button>
        <button
          onClick={() => setActiveTab('matrix')}
          className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'matrix' ? 'bg-white shadow-sm' : 'text-healthcare-muted'
          }`}
        >
          Permission Matrix
        </button>
      </div>

      {activeTab === 'users' && (
        <>
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-healthcare-muted" />
            <input
              type="text"
              placeholder="Search users..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input pl-10"
            />
          </div>

          <div className="card overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-healthcare-border">
                <tr>
                  <th className="table-header">Name</th>
                  <th className="table-header">Email</th>
                  <th className="table-header">Role</th>
                  <th className="table-header">Status</th>
                  <th className="table-header">Last Active</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-healthcare-border">
                {filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="table-cell">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-brand-100 flex items-center justify-center shrink-0">
                          <span className="text-xs font-medium text-brand-700">
                            {user.name.split(' ').map((n) => n[0]).join('').slice(0, 2)}
                          </span>
                        </div>
                        <span className="text-sm font-medium">{user.name}</span>
                      </div>
                    </td>
                    <td className="table-cell text-sm text-healthcare-muted">{user.email}</td>
                    <td className="table-cell">
                      <select
                        value={user.role}
                        onChange={(e) => handleRoleChange(user.id, e.target.value as Role)}
                        className="select text-xs w-44 py-1"
                      >
                        {roles.map((r) => (
                          <option key={r} value={r}>{roleLabels[r]}</option>
                        ))}
                      </select>
                    </td>
                    <td className="table-cell">
                      <StatusBadge
                        variant={user.status === 'active' ? 'active' : 'inactive'}
                        label={user.status}
                      />
                    </td>
                    <td className="table-cell text-sm text-healthcare-muted">
                      {user.lastActive}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {activeTab === 'matrix' && (
        <div className="card overflow-hidden overflow-x-auto">
          <div className="card-header">
            <p className="text-xs text-healthcare-muted">
              Read-only view of role-based access. Contact an Admin to request permission changes.
            </p>
          </div>
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-healthcare-border">
              <tr>
                <th className="table-header w-40">Section</th>
                {roles.map((role) => (
                  <th key={role} className="table-header text-center">
                    <span className="text-[10px] leading-tight block">{roleLabels[role]}</span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-healthcare-border">
              {Object.entries(permissionMatrix).map(([section, perms]) => (
                <tr key={section} className="hover:bg-gray-50">
                  <td className="table-cell text-sm font-medium">{section}</td>
                  {roles.map((role) => {
                    const perm = perms[role];
                    return (
                      <td key={role} className="table-cell text-center">
                        <span className={`badge ${permissionBadge[perm].class}`}>
                          {permissionBadge[perm].label}
                        </span>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
          <div className="card-body border-t border-healthcare-border">
            <div className="flex items-center gap-4 text-xs text-healthcare-muted">
              <span className="font-medium">Legend:</span>
              {Object.entries(permissionBadge).filter(([k]) => k !== 'none').map(([key, val]) => (
                <span key={key} className="flex items-center gap-1">
                  <span className={`badge ${val.class}`}>{val.label}</span>
                  <span>= {key === 'approve' ? 'Full access (view, edit, approve)' : key === 'edit' ? 'View and edit' : 'View only'}</span>
                </span>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
