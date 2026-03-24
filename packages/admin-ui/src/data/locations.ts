/**
 * Shared location data used by both the Dashboard dropdown and the Locations page.
 * Single source of truth — edit here and both pages update automatically.
 */

export interface LocationEntry {
  id: string;
  name: string;
  city: string;
  state: string;
  status: 'active' | 'inactive';
}

export const allLocations: LocationEntry[] = [
  // --- NEW YORK ---
  { id: 'loc-ny-midtown', name: 'Midtown Manhattan', city: 'New York', state: 'NY', status: 'active' },
  { id: 'loc-ny-ues', name: 'Upper East Side', city: 'New York', state: 'NY', status: 'active' },
  { id: 'loc-ny-fidi', name: 'Financial District', city: 'New York', state: 'NY', status: 'active' },
  { id: 'loc-ny-downtown-brooklyn', name: 'Downtown Brooklyn', city: 'Brooklyn', state: 'NY', status: 'active' },
  { id: 'loc-ny-brighton-beach', name: 'Brighton Beach', city: 'Brooklyn', state: 'NY', status: 'active' },
  { id: 'loc-ny-forest-hills', name: 'Forest Hills', city: 'Forest Hills', state: 'NY', status: 'active' },
  { id: 'loc-ny-astoria', name: 'Astoria', city: 'Astoria', state: 'NY', status: 'active' },
  { id: 'loc-ny-staten-island', name: 'Staten Island', city: 'Staten Island', state: 'NY', status: 'active' },
  { id: 'loc-ny-bronx', name: 'Bronx', city: 'Bronx', state: 'NY', status: 'active' },
  { id: 'loc-ny-hartsdale', name: 'Westchester / Hartsdale', city: 'Hartsdale', state: 'NY', status: 'active' },
  { id: 'loc-ny-yonkers', name: 'Yonkers', city: 'Yonkers', state: 'NY', status: 'active' },
  { id: 'loc-ny-jericho', name: 'Jericho', city: 'Jericho', state: 'NY', status: 'active' },
  { id: 'loc-ny-west-islip', name: 'West Islip', city: 'West Islip', state: 'NY', status: 'active' },
  { id: 'loc-ny-port-jefferson', name: 'Port Jefferson', city: 'Port Jefferson', state: 'NY', status: 'active' },
  { id: 'loc-ny-williamsburg', name: 'Brooklyn Williamsburg', city: 'Brooklyn', state: 'NY', status: 'inactive' },

  // --- NEW JERSEY ---
  { id: 'loc-nj-clifton', name: 'Clifton', city: 'Clifton', state: 'NJ', status: 'active' },
  { id: 'loc-nj-paramus', name: 'Paramus', city: 'Paramus', state: 'NJ', status: 'active' },
  { id: 'loc-nj-woodland-park', name: 'Woodland Park', city: 'Woodland Park', state: 'NJ', status: 'active' },
  { id: 'loc-nj-morristown', name: 'Morristown', city: 'Morristown', state: 'NJ', status: 'active' },
  { id: 'loc-nj-morris-county', name: 'Morris County / Parsippany', city: 'Parsippany', state: 'NJ', status: 'active' },
  { id: 'loc-nj-edgewater', name: 'Edgewater', city: 'Edgewater', state: 'NJ', status: 'active' },
  { id: 'loc-nj-hoboken', name: 'Hoboken', city: 'Hoboken', state: 'NJ', status: 'active' },
  { id: 'loc-nj-harrison', name: 'Harrison', city: 'Harrison', state: 'NJ', status: 'active' },
  { id: 'loc-nj-west-orange', name: 'West Orange', city: 'West Orange', state: 'NJ', status: 'active' },
  { id: 'loc-nj-scotch-plains', name: 'Scotch Plains', city: 'Scotch Plains', state: 'NJ', status: 'active' },
  { id: 'loc-nj-woodbridge', name: 'Woodbridge / Iselin', city: 'Iselin', state: 'NJ', status: 'active' },
  { id: 'loc-nj-princeton', name: 'Princeton', city: 'Princeton', state: 'NJ', status: 'active' },

  // --- CONNECTICUT ---
  { id: 'loc-ct-stamford', name: 'Stamford', city: 'Stamford', state: 'CT', status: 'active' },
  { id: 'loc-ct-hamden', name: 'Hamden', city: 'Hamden', state: 'CT', status: 'active' },
  { id: 'loc-ct-farmington', name: 'Farmington', city: 'Farmington', state: 'CT', status: 'active' },

  // --- MARYLAND ---
  { id: 'loc-md-bethesda', name: 'Bethesda', city: 'Bethesda', state: 'MD', status: 'active' },
  { id: 'loc-md-maple-lawn', name: 'Maple Lawn / Fulton', city: 'Fulton', state: 'MD', status: 'active' },
  { id: 'loc-md-bowie', name: 'Bowie', city: 'Bowie', state: 'MD', status: 'active' },

  // --- TEXAS ---
  { id: 'loc-tx-fort-worth', name: 'Fort Worth', city: 'Fort Worth', state: 'TX', status: 'active' },
  { id: 'loc-tx-arlington', name: 'Arlington', city: 'Arlington', state: 'TX', status: 'active' },
  { id: 'loc-tx-kyle', name: 'Kyle / Cedar Park', city: 'Kyle', state: 'TX', status: 'active' },
  { id: 'loc-tx-addison', name: 'Addison (Coming Soon)', city: 'Addison', state: 'TX', status: 'inactive' },

  // --- CALIFORNIA ---
  { id: 'loc-ca-san-diego', name: 'San Diego', city: 'San Diego', state: 'CA', status: 'active' },
  { id: 'loc-ca-national-city', name: 'National City', city: 'National City', state: 'CA', status: 'active' },
  { id: 'loc-ca-poway', name: 'Poway', city: 'Poway', state: 'CA', status: 'active' },
  { id: 'loc-ca-temecula', name: 'Temecula', city: 'Temecula', state: 'CA', status: 'active' },
  { id: 'loc-ca-irvine', name: 'Irvine', city: 'Irvine', state: 'CA', status: 'active' },
  { id: 'loc-ca-newport-beach', name: 'Newport Beach', city: 'Newport Beach', state: 'CA', status: 'active' },
  { id: 'loc-ca-huntington-beach', name: 'Huntington Beach', city: 'Huntington Beach', state: 'CA', status: 'active' },
  { id: 'loc-ca-palo-alto', name: 'Palo Alto', city: 'Palo Alto', state: 'CA', status: 'active' },
  { id: 'loc-ca-san-jose', name: 'San Jose', city: 'San Jose', state: 'CA', status: 'active' },
  { id: 'loc-ca-sacramento', name: 'Sacramento (Coming Soon)', city: 'Sacramento', state: 'CA', status: 'inactive' },
];

/** Only active locations — used for dashboard filters */
export const activeLocations = allLocations.filter((l) => l.status === 'active');

/** State full names for display grouping */
export const stateNames: Record<string, string> = {
  NY: 'New York',
  NJ: 'New Jersey',
  CT: 'Connecticut',
  MD: 'Maryland',
  TX: 'Texas',
  CA: 'California',
};

/** Group active locations by state */
export function getLocationsByState() {
  const grouped: Record<string, LocationEntry[]> = {};
  for (const loc of activeLocations) {
    if (!grouped[loc.state]) grouped[loc.state] = [];
    grouped[loc.state].push(loc);
  }
  return grouped;
}
