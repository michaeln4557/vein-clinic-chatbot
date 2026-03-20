import { useState } from 'react';
import {
  MapPin,
  Plus,
  Search,
  Phone,
  Clock,
  Edit,
  Trash2,
  X,
  Users,
  Building2,
} from 'lucide-react';
import StatusBadge from '../components/shared/StatusBadge';

interface Location {
  id: string;
  name: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  phone: string;
  fax: string;
  email: string;
  hours: string;
  timezone: string;
  providers: string[];
  services: string[];
  acceptedInsurance: string[];
  status: 'active' | 'inactive';
  chatEnabled: boolean;
  smsEnabled: boolean;
  maxDailyAppointments: number;
  nearestAlternative: string;
}

const mockLocations: Location[] = [
  {
    id: 'loc-1',
    name: 'Downtown Vein Center',
    address: '450 Medical Park Dr, Suite 200',
    city: 'Austin',
    state: 'TX',
    zip: '78701',
    phone: '(512) 555-0101',
    fax: '(512) 555-0102',
    email: 'downtown@veinclinic.com',
    hours: 'Mon-Fri 8am-5pm, Sat 9am-1pm',
    timezone: 'America/Chicago',
    providers: ['Dr. Martinez', 'Dr. Chen'],
    services: ['Sclerotherapy', 'Endovenous Ablation', 'VenaSeal', 'Ultrasound'],
    acceptedInsurance: ['Aetna', 'BlueCross', 'Cigna', 'United', 'Medicare'],
    status: 'active',
    chatEnabled: true,
    smsEnabled: true,
    maxDailyAppointments: 24,
    nearestAlternative: 'Westlake Vein Clinic',
  },
  {
    id: 'loc-2',
    name: 'Westlake Vein Clinic',
    address: '1200 Walsh Tarlton Ln',
    city: 'Austin',
    state: 'TX',
    zip: '78746',
    phone: '(512) 555-0201',
    fax: '(512) 555-0202',
    email: 'westlake@veinclinic.com',
    hours: 'Mon-Fri 9am-6pm',
    timezone: 'America/Chicago',
    providers: ['Dr. Patel', 'Dr. Kim'],
    services: ['Sclerotherapy', 'Endovenous Ablation', 'Compression Therapy'],
    acceptedInsurance: ['Aetna', 'BlueCross', 'United', 'Humana'],
    status: 'active',
    chatEnabled: true,
    smsEnabled: true,
    maxDailyAppointments: 18,
    nearestAlternative: 'Downtown Vein Center',
  },
  {
    id: 'loc-3',
    name: 'Round Rock Vein Specialists',
    address: '2400 Round Rock Ave, Suite 110',
    city: 'Round Rock',
    state: 'TX',
    zip: '78681',
    phone: '(512) 555-0301',
    fax: '(512) 555-0302',
    email: 'roundrock@veinclinic.com',
    hours: 'Mon-Thu 8am-5pm, Fri 8am-12pm',
    timezone: 'America/Chicago',
    providers: ['Dr. Johnson'],
    services: ['Sclerotherapy', 'Ultrasound', 'Compression Therapy'],
    acceptedInsurance: ['BlueCross', 'Cigna', 'Medicare', 'Medicaid'],
    status: 'active',
    chatEnabled: true,
    smsEnabled: false,
    maxDailyAppointments: 12,
    nearestAlternative: 'Downtown Vein Center',
  },
  {
    id: 'loc-4',
    name: 'South Austin (Opening Soon)',
    address: '6800 Manchaca Rd',
    city: 'Austin',
    state: 'TX',
    zip: '78745',
    phone: '(512) 555-0401',
    fax: '',
    email: 'south@veinclinic.com',
    hours: 'TBD',
    timezone: 'America/Chicago',
    providers: [],
    services: [],
    acceptedInsurance: [],
    status: 'inactive',
    chatEnabled: false,
    smsEnabled: false,
    maxDailyAppointments: 0,
    nearestAlternative: 'Downtown Vein Center',
  },
];

export default function LocationsPage() {
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);

  const filtered = mockLocations.filter(
    (loc) =>
      loc.name.toLowerCase().includes(search.toLowerCase()) ||
      loc.city.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1>Locations</h1>
          <p className="text-healthcare-muted mt-1">
            Manage clinic locations, hours, and service availability
          </p>
        </div>
        <button onClick={() => setShowForm(true)} className="btn-primary">
          <Plus className="w-4 h-4" />
          Add Location
        </button>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-healthcare-muted" />
        <input
          type="text"
          placeholder="Search locations..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="input pl-10"
        />
      </div>

      {/* Location Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {filtered.map((loc) => (
          <div key={loc.id} className="card overflow-hidden">
            <div className="card-header flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-brand-50 text-brand-600">
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold">{loc.name}</h3>
                  <p className="text-xs text-healthcare-muted">
                    {loc.city}, {loc.state} {loc.zip}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <StatusBadge
                  variant={loc.status === 'active' ? 'active' : 'inactive'}
                  label={loc.status}
                />
                <button className="btn-ghost">
                  <Edit className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="card-body space-y-3">
              <p className="text-sm text-healthcare-muted">{loc.address}</p>

              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="flex items-center gap-2 text-healthcare-muted">
                  <Phone className="w-3.5 h-3.5" />
                  <span>{loc.phone}</span>
                </div>
                <div className="flex items-center gap-2 text-healthcare-muted">
                  <Clock className="w-3.5 h-3.5" />
                  <span className="truncate">{loc.hours}</span>
                </div>
              </div>

              {loc.providers.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-healthcare-muted mb-1">Providers</p>
                  <div className="flex flex-wrap gap-1">
                    {loc.providers.map((p) => (
                      <span key={p} className="badge bg-brand-50 text-brand-700">
                        {p}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {loc.services.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-healthcare-muted mb-1">Services</p>
                  <div className="flex flex-wrap gap-1">
                    {loc.services.map((s) => (
                      <span key={s} className="badge bg-teal-50 text-teal-700">
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {loc.acceptedInsurance.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-healthcare-muted mb-1">Insurance</p>
                  <div className="flex flex-wrap gap-1">
                    {loc.acceptedInsurance.map((ins) => (
                      <span key={ins} className="badge bg-gray-100 text-gray-600">
                        {ins}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex items-center gap-4 pt-2 border-t border-healthcare-border text-xs text-healthcare-muted">
                <span className={loc.chatEnabled ? 'text-emerald-600' : ''}>
                  Chat: {loc.chatEnabled ? 'On' : 'Off'}
                </span>
                <span className={loc.smsEnabled ? 'text-emerald-600' : ''}>
                  SMS: {loc.smsEnabled ? 'On' : 'Off'}
                </span>
                <span>Max appts: {loc.maxDailyAppointments}/day</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
