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

const initialLocations: Location[] = [
  // --- NEW YORK ---
  {
    id: 'loc-ny-midtown',
    name: 'Midtown Manhattan',
    address: '290 Madison Ave Floor 2',
    city: 'New York',
    state: 'NY',
    zip: '10017',
    phone: '(646) 631-3516',
    fax: '',
    email: 'midtown@veintreatmentclinic.com',
    hours: 'Mon-Fri 9am-7pm',
    timezone: 'America/New_York',
    providers: ['Dr. Juan Montoya', 'Dr. Jack Bulat'],
    services: ['Sclerotherapy', 'Radiofrequency Ablation', 'VenaSeal', 'Ultrasound Diagnosis'],
    acceptedInsurance: ['Aetna', 'BlueCross', 'Cigna', 'United', 'Medicare'],
    status: 'active',
    chatEnabled: true,
    smsEnabled: true,
    maxDailyAppointments: 24,
    nearestAlternative: 'Upper East Side',
  },
  {
    id: 'loc-ny-ues',
    name: 'Upper East Side',
    address: '1111 Park Ave #1b',
    city: 'New York',
    state: 'NY',
    zip: '10128',
    phone: '(332) 256-0147',
    fax: '',
    email: 'ues@veintreatmentclinic.com',
    hours: 'Mon-Fri 9am-7pm',
    timezone: 'America/New_York',
    providers: ['Dr. Jonathan Hemli'],
    services: ['Sclerotherapy', 'Radiofrequency Ablation', 'VenaSeal', 'Ultrasound Diagnosis'],
    acceptedInsurance: ['Aetna', 'BlueCross', 'Cigna', 'United', 'Medicare'],
    status: 'active',
    chatEnabled: true,
    smsEnabled: true,
    maxDailyAppointments: 18,
    nearestAlternative: 'Midtown Manhattan',
  },
  {
    id: 'loc-ny-fidi',
    name: 'Financial District',
    address: '156 William St Suite 302',
    city: 'New York',
    state: 'NY',
    zip: '10038',
    phone: '(917) 933-0427',
    fax: '',
    email: 'fidi@veintreatmentclinic.com',
    hours: 'Mon-Fri 9am-7pm',
    timezone: 'America/New_York',
    providers: ['Dr. Sareh Rajaee', 'Dr. Jonathan Hemli'],
    services: ['Sclerotherapy', 'Radiofrequency Ablation', 'VenaSeal', 'Ultrasound Diagnosis'],
    acceptedInsurance: ['Aetna', 'BlueCross', 'Cigna', 'United', 'Medicare'],
    status: 'active',
    chatEnabled: true,
    smsEnabled: true,
    maxDailyAppointments: 20,
    nearestAlternative: 'Downtown Brooklyn',
  },
  {
    id: 'loc-ny-downtown-brooklyn',
    name: 'Downtown Brooklyn',
    address: '188 Montague St, 10th Floor',
    city: 'Brooklyn',
    state: 'NY',
    zip: '11201',
    phone: '(646) 631-4902',
    fax: '',
    email: 'brooklyn@veintreatmentclinic.com',
    hours: 'Mon-Fri 9am-7pm',
    timezone: 'America/New_York',
    providers: ['Dr. Caroline Novak', 'Dr. Bonnie McKinley'],
    services: ['Sclerotherapy', 'Radiofrequency Ablation', 'VenaSeal', 'Ultrasound Diagnosis'],
    acceptedInsurance: ['Aetna', 'BlueCross', 'Cigna', 'United', 'Medicare'],
    status: 'active',
    chatEnabled: true,
    smsEnabled: true,
    maxDailyAppointments: 22,
    nearestAlternative: 'Financial District',
  },
  {
    id: 'loc-ny-brighton-beach',
    name: 'Brighton Beach',
    address: '23 Brighton 11th St, 7th Floor',
    city: 'Brooklyn',
    state: 'NY',
    zip: '11235',
    phone: '(929) 730-5247',
    fax: '',
    email: 'brightonbeach@veintreatmentclinic.com',
    hours: 'Mon-Fri 9am-7pm',
    timezone: 'America/New_York',
    providers: ['Dr. Jack Bulat'],
    services: ['Sclerotherapy', 'Radiofrequency Ablation', 'VenaSeal', 'Ultrasound Diagnosis'],
    acceptedInsurance: ['Aetna', 'BlueCross', 'Cigna', 'United', 'Medicare'],
    status: 'active',
    chatEnabled: true,
    smsEnabled: true,
    maxDailyAppointments: 16,
    nearestAlternative: 'Downtown Brooklyn',
  },
  {
    id: 'loc-ny-forest-hills',
    name: 'Forest Hills',
    address: '107-30 71st Rd Suite 204',
    city: 'Forest Hills',
    state: 'NY',
    zip: '11375',
    phone: '(929) 990-0012',
    fax: '',
    email: 'foresthills@veintreatmentclinic.com',
    hours: 'Mon-Fri 9am-7pm',
    timezone: 'America/New_York',
    providers: ['Dr. Jonathan Hemli'],
    services: ['Sclerotherapy', 'Radiofrequency Ablation', 'VenaSeal', 'Ultrasound Diagnosis'],
    acceptedInsurance: ['Aetna', 'BlueCross', 'Cigna', 'United', 'Medicare'],
    status: 'active',
    chatEnabled: true,
    smsEnabled: true,
    maxDailyAppointments: 16,
    nearestAlternative: 'Astoria',
  },
  {
    id: 'loc-ny-astoria',
    name: 'Astoria',
    address: '23-25 31st St Suite 410',
    city: 'Astoria',
    state: 'NY',
    zip: '11105',
    phone: '(917) 768-7275',
    fax: '',
    email: 'astoria@veintreatmentclinic.com',
    hours: 'Mon-Fri 9am-7pm',
    timezone: 'America/New_York',
    providers: ['Dr. Shaun Cole'],
    services: ['Sclerotherapy', 'Radiofrequency Ablation', 'VenaSeal', 'Ultrasound Diagnosis'],
    acceptedInsurance: ['Aetna', 'BlueCross', 'Cigna', 'United', 'Medicare'],
    status: 'active',
    chatEnabled: true,
    smsEnabled: true,
    maxDailyAppointments: 16,
    nearestAlternative: 'Forest Hills',
  },
  {
    id: 'loc-ny-staten-island',
    name: 'Staten Island',
    address: '4236 Hylan Blvd',
    city: 'Staten Island',
    state: 'NY',
    zip: '10312',
    phone: '(929) 425-0017',
    fax: '',
    email: 'statenisland@veintreatmentclinic.com',
    hours: 'Mon-Fri 9am-7pm',
    timezone: 'America/New_York',
    providers: ['Dr. Kyle Mele'],
    services: ['Sclerotherapy', 'Radiofrequency Ablation', 'VenaSeal', 'Ultrasound Diagnosis'],
    acceptedInsurance: ['Aetna', 'BlueCross', 'Cigna', 'United', 'Medicare'],
    status: 'active',
    chatEnabled: true,
    smsEnabled: true,
    maxDailyAppointments: 16,
    nearestAlternative: 'Downtown Brooklyn',
  },
  {
    id: 'loc-ny-bronx',
    name: 'Bronx',
    address: '2100 Bartow Ave Suite 400',
    city: 'Bronx',
    state: 'NY',
    zip: '10475',
    phone: '(929) 695-5836',
    fax: '',
    email: 'bronx@veintreatmentclinic.com',
    hours: 'Mon-Fri 9am-7pm',
    timezone: 'America/New_York',
    providers: ['Dr. Gulshan Sethi'],
    services: ['Sclerotherapy', 'Radiofrequency Ablation', 'VenaSeal', 'Ultrasound Diagnosis'],
    acceptedInsurance: ['Aetna', 'BlueCross', 'Cigna', 'United', 'Medicare'],
    status: 'active',
    chatEnabled: true,
    smsEnabled: true,
    maxDailyAppointments: 16,
    nearestAlternative: 'Midtown Manhattan',
  },
  {
    id: 'loc-ny-hartsdale',
    name: 'Westchester / Hartsdale',
    address: '280 N Central Ave Suite 450',
    city: 'Hartsdale',
    state: 'NY',
    zip: '10530',
    phone: '(914) 581-9483',
    fax: '',
    email: 'westchester@veintreatmentclinic.com',
    hours: 'Mon-Fri 9am-7pm',
    timezone: 'America/New_York',
    providers: ['Dr. Laura Lombardi'],
    services: ['Sclerotherapy', 'Radiofrequency Ablation', 'VenaSeal', 'Ultrasound Diagnosis'],
    acceptedInsurance: ['Aetna', 'BlueCross', 'Cigna', 'United', 'Medicare'],
    status: 'active',
    chatEnabled: true,
    smsEnabled: true,
    maxDailyAppointments: 16,
    nearestAlternative: 'Yonkers',
  },
  {
    id: 'loc-ny-yonkers',
    name: 'Yonkers',
    address: '124 New Main St',
    city: 'Yonkers',
    state: 'NY',
    zip: '10701',
    phone: '(914) 540-7592',
    fax: '',
    email: 'yonkers@veintreatmentclinic.com',
    hours: 'Mon-Fri 9am-7pm',
    timezone: 'America/New_York',
    providers: ['Dr. Shaun Cole'],
    services: ['Sclerotherapy', 'Radiofrequency Ablation', 'VenaSeal', 'Ultrasound Diagnosis'],
    acceptedInsurance: ['Aetna', 'BlueCross', 'Cigna', 'United', 'Medicare'],
    status: 'active',
    chatEnabled: true,
    smsEnabled: true,
    maxDailyAppointments: 16,
    nearestAlternative: 'Westchester / Hartsdale',
  },
  {
    id: 'loc-ny-jericho',
    name: 'Jericho',
    address: '350 Jericho Tpke Suite 310',
    city: 'Jericho',
    state: 'NY',
    zip: '11753',
    phone: '(631) 629-1054',
    fax: '',
    email: 'jericho@veintreatmentclinic.com',
    hours: 'Mon-Fri 9am-7pm',
    timezone: 'America/New_York',
    providers: ['Dr. Zalekha Shair'],
    services: ['Sclerotherapy', 'Radiofrequency Ablation', 'VenaSeal', 'Ultrasound Diagnosis'],
    acceptedInsurance: ['Aetna', 'BlueCross', 'Cigna', 'United', 'Medicare'],
    status: 'active',
    chatEnabled: true,
    smsEnabled: true,
    maxDailyAppointments: 16,
    nearestAlternative: 'West Islip',
  },
  {
    id: 'loc-ny-west-islip',
    name: 'West Islip',
    address: '500 Montauk Hwy Suite G',
    city: 'West Islip',
    state: 'NY',
    zip: '11795',
    phone: '(631) 402-5955',
    fax: '',
    email: 'westislip@veintreatmentclinic.com',
    hours: 'Mon-Fri 9am-7pm',
    timezone: 'America/New_York',
    providers: ['Dr. Gulshan Sethi'],
    services: ['Sclerotherapy', 'Radiofrequency Ablation', 'VenaSeal', 'Ultrasound Diagnosis'],
    acceptedInsurance: ['Aetna', 'BlueCross', 'Cigna', 'United', 'Medicare'],
    status: 'active',
    chatEnabled: true,
    smsEnabled: true,
    maxDailyAppointments: 16,
    nearestAlternative: 'Jericho',
  },
  {
    id: 'loc-ny-port-jefferson',
    name: 'Port Jefferson',
    address: '70 N Country Rd #201',
    city: 'Port Jefferson',
    state: 'NY',
    zip: '11777',
    phone: '(631) 802-7558',
    fax: '',
    email: 'portjefferson@veintreatmentclinic.com',
    hours: 'Mon-Fri 9am-7pm',
    timezone: 'America/New_York',
    providers: ['Dr. Thomas Arnold'],
    services: ['Sclerotherapy', 'Radiofrequency Ablation', 'VenaSeal', 'Ultrasound Diagnosis'],
    acceptedInsurance: ['Aetna', 'BlueCross', 'Cigna', 'United', 'Medicare'],
    status: 'active',
    chatEnabled: true,
    smsEnabled: true,
    maxDailyAppointments: 16,
    nearestAlternative: 'West Islip',
  },
  {
    id: 'loc-ny-williamsburg',
    name: 'Brooklyn Williamsburg',
    address: '',
    city: 'Brooklyn',
    state: 'NY',
    zip: '',
    phone: '',
    fax: '',
    email: 'williamsburg@veintreatmentclinic.com',
    hours: 'TBD',
    timezone: 'America/New_York',
    providers: [],
    services: [],
    acceptedInsurance: [],
    status: 'inactive',
    chatEnabled: false,
    smsEnabled: false,
    maxDailyAppointments: 0,
    nearestAlternative: 'Downtown Brooklyn',
  },
  // --- NEW JERSEY ---
  {
    id: 'loc-nj-clifton',
    name: 'Clifton',
    address: '1117 US-46 Ste 205',
    city: 'Clifton',
    state: 'NJ',
    zip: '07013',
    phone: '(973) 946-8063',
    fax: '',
    email: 'clifton@veintreatmentclinic.com',
    hours: 'Mon-Fri 9am-7pm',
    timezone: 'America/New_York',
    providers: ['Dr. Andrew Cortes'],
    services: ['Sclerotherapy', 'Radiofrequency Ablation', 'VenaSeal', 'Ultrasound Diagnosis'],
    acceptedInsurance: ['Aetna', 'BlueCross', 'Cigna', 'United', 'Medicare'],
    status: 'active',
    chatEnabled: true,
    smsEnabled: true,
    maxDailyAppointments: 18,
    nearestAlternative: 'Woodland Park',
  },
  {
    id: 'loc-nj-paramus',
    name: 'Paramus',
    address: '140 NJ-17 #269',
    city: 'Paramus',
    state: 'NJ',
    zip: '07652',
    phone: '(201) 777-8823',
    fax: '',
    email: 'paramus@veintreatmentclinic.com',
    hours: 'Mon-Fri 9am-7pm',
    timezone: 'America/New_York',
    providers: ['Dr. Todd Kobrinski'],
    services: ['Sclerotherapy', 'Radiofrequency Ablation', 'VenaSeal', 'Ultrasound Diagnosis'],
    acceptedInsurance: ['Aetna', 'BlueCross', 'Cigna', 'United', 'Medicare'],
    status: 'active',
    chatEnabled: true,
    smsEnabled: true,
    maxDailyAppointments: 18,
    nearestAlternative: 'Edgewater',
  },
  {
    id: 'loc-nj-woodland-park',
    name: 'Woodland Park',
    address: '1167 McBride Ave Suite 2',
    city: 'Woodland Park',
    state: 'NJ',
    zip: '07424',
    phone: '(973) 381-2115',
    fax: '',
    email: 'woodlandpark@veintreatmentclinic.com',
    hours: 'Mon-Fri 9am-7pm',
    timezone: 'America/New_York',
    providers: ['Dr. Andrew Cortes', 'Dr. Todd Kobrinski'],
    services: ['Sclerotherapy', 'Radiofrequency Ablation', 'VenaSeal', 'Ultrasound Diagnosis'],
    acceptedInsurance: ['Aetna', 'BlueCross', 'Cigna', 'United', 'Medicare'],
    status: 'active',
    chatEnabled: true,
    smsEnabled: true,
    maxDailyAppointments: 20,
    nearestAlternative: 'Clifton',
  },
  {
    id: 'loc-nj-morristown',
    name: 'Morristown',
    address: '310 Madison Ave, 3rd Floor',
    city: 'Morristown',
    state: 'NJ',
    zip: '07960',
    phone: '(973) 946-8064',
    fax: '',
    email: 'morristown@veintreatmentclinic.com',
    hours: 'Mon-Fri 9am-7pm',
    timezone: 'America/New_York',
    providers: ['Dr. Andrew Cortes'],
    services: ['Sclerotherapy', 'Radiofrequency Ablation', 'VenaSeal', 'Ultrasound Diagnosis'],
    acceptedInsurance: ['Aetna', 'BlueCross', 'Cigna', 'United', 'Medicare'],
    status: 'active',
    chatEnabled: true,
    smsEnabled: true,
    maxDailyAppointments: 18,
    nearestAlternative: 'Morris County',
  },
  {
    id: 'loc-nj-morris-county',
    name: 'Morris County / Parsippany',
    address: '3695 Hill Rd',
    city: 'Parsippany',
    state: 'NJ',
    zip: '07054',
    phone: '(862) 842-4447',
    fax: '',
    email: 'morriscounty@veintreatmentclinic.com',
    hours: 'Mon-Fri 9am-7pm',
    timezone: 'America/New_York',
    providers: ['Dr. Andrew Cortes'],
    services: ['Sclerotherapy', 'Radiofrequency Ablation', 'VenaSeal', 'Ultrasound Diagnosis'],
    acceptedInsurance: ['Aetna', 'BlueCross', 'Cigna', 'United', 'Medicare'],
    status: 'active',
    chatEnabled: true,
    smsEnabled: true,
    maxDailyAppointments: 16,
    nearestAlternative: 'Morristown',
  },
  {
    id: 'loc-nj-edgewater',
    name: 'Edgewater',
    address: '968 River Rd #200',
    city: 'Edgewater',
    state: 'NJ',
    zip: '07020',
    phone: '',
    fax: '',
    email: 'edgewater@veintreatmentclinic.com',
    hours: 'Mon-Fri 9am-7pm',
    timezone: 'America/New_York',
    providers: ['Dr. Todd Kobrinski'],
    services: ['Sclerotherapy', 'Radiofrequency Ablation', 'VenaSeal', 'Ultrasound Diagnosis'],
    acceptedInsurance: ['Aetna', 'BlueCross', 'Cigna', 'United', 'Medicare'],
    status: 'active',
    chatEnabled: true,
    smsEnabled: true,
    maxDailyAppointments: 16,
    nearestAlternative: 'Paramus',
  },
  {
    id: 'loc-nj-hoboken',
    name: 'Hoboken',
    address: '70 Hudson St Lower Level',
    city: 'Hoboken',
    state: 'NJ',
    zip: '07030',
    phone: '(551) 550-1151',
    fax: '',
    email: 'hoboken@veintreatmentclinic.com',
    hours: 'Mon-Fri 9am-7pm',
    timezone: 'America/New_York',
    providers: ['Dr. Jeffrey Deygoo'],
    services: ['Sclerotherapy', 'Radiofrequency Ablation', 'VenaSeal', 'Ultrasound Diagnosis'],
    acceptedInsurance: ['Aetna', 'BlueCross', 'Cigna', 'United', 'Medicare'],
    status: 'active',
    chatEnabled: true,
    smsEnabled: true,
    maxDailyAppointments: 18,
    nearestAlternative: 'Harrison',
  },
  {
    id: 'loc-nj-harrison',
    name: 'Harrison',
    address: '620 Essex St #202',
    city: 'Harrison',
    state: 'NJ',
    zip: '07029',
    phone: '(973) 936-9529',
    fax: '',
    email: 'harrison@veintreatmentclinic.com',
    hours: 'Mon-Fri 9am-7pm',
    timezone: 'America/New_York',
    providers: ['Dr. Jeffrey Deygoo'],
    services: ['Sclerotherapy', 'Radiofrequency Ablation', 'VenaSeal', 'Ultrasound Diagnosis'],
    acceptedInsurance: ['Aetna', 'BlueCross', 'Cigna', 'United', 'Medicare'],
    status: 'active',
    chatEnabled: true,
    smsEnabled: true,
    maxDailyAppointments: 16,
    nearestAlternative: 'Hoboken',
  },
  {
    id: 'loc-nj-west-orange',
    name: 'West Orange',
    address: '405 Northfield Ave #204',
    city: 'West Orange',
    state: 'NJ',
    zip: '07052',
    phone: '(973) 936-9407',
    fax: '',
    email: 'westorange@veintreatmentclinic.com',
    hours: 'Mon-Fri 9am-7pm',
    timezone: 'America/New_York',
    providers: ['Dr. Jeffrey Deygoo'],
    services: ['Sclerotherapy', 'Radiofrequency Ablation', 'VenaSeal', 'Ultrasound Diagnosis'],
    acceptedInsurance: ['Aetna', 'BlueCross', 'Cigna', 'United', 'Medicare'],
    status: 'active',
    chatEnabled: true,
    smsEnabled: true,
    maxDailyAppointments: 16,
    nearestAlternative: 'Woodland Park',
  },
  {
    id: 'loc-nj-scotch-plains',
    name: 'Scotch Plains',
    address: '2253 South Ave #2',
    city: 'Scotch Plains',
    state: 'NJ',
    zip: '07076',
    phone: '(908) 224-5523',
    fax: '',
    email: 'scotchplains@veintreatmentclinic.com',
    hours: 'Mon-Fri 9am-7pm',
    timezone: 'America/New_York',
    providers: [],
    services: ['Sclerotherapy', 'Radiofrequency Ablation', 'VenaSeal', 'Ultrasound Diagnosis'],
    acceptedInsurance: ['Aetna', 'BlueCross', 'Cigna', 'United', 'Medicare'],
    status: 'active',
    chatEnabled: true,
    smsEnabled: true,
    maxDailyAppointments: 16,
    nearestAlternative: 'Woodbridge',
  },
  {
    id: 'loc-nj-woodbridge',
    name: 'Woodbridge / Iselin',
    address: '517 U.S. Rte 1 #1100',
    city: 'Iselin',
    state: 'NJ',
    zip: '08830',
    phone: '(732) 426-0020',
    fax: '',
    email: 'woodbridge@veintreatmentclinic.com',
    hours: 'Mon-Fri 9am-7pm',
    timezone: 'America/New_York',
    providers: ['Dr. Sahil Patel'],
    services: ['Sclerotherapy', 'Radiofrequency Ablation', 'VenaSeal', 'Ultrasound Diagnosis'],
    acceptedInsurance: ['Aetna', 'BlueCross', 'Cigna', 'United', 'Medicare'],
    status: 'active',
    chatEnabled: true,
    smsEnabled: true,
    maxDailyAppointments: 18,
    nearestAlternative: 'Scotch Plains',
  },
  {
    id: 'loc-nj-princeton',
    name: 'Princeton',
    address: '8 Forrestal Rd S Suite 203',
    city: 'Princeton',
    state: 'NJ',
    zip: '08540',
    phone: '(609) 657-3245',
    fax: '',
    email: 'princeton@veintreatmentclinic.com',
    hours: 'Mon-Fri 9am-7pm',
    timezone: 'America/New_York',
    providers: ['Dr. Sahil Patel'],
    services: ['Sclerotherapy', 'Radiofrequency Ablation', 'VenaSeal', 'Ultrasound Diagnosis'],
    acceptedInsurance: ['Aetna', 'BlueCross', 'Cigna', 'United', 'Medicare'],
    status: 'active',
    chatEnabled: true,
    smsEnabled: true,
    maxDailyAppointments: 18,
    nearestAlternative: 'Woodbridge / Iselin',
  },
  // --- CONNECTICUT ---
  {
    id: 'loc-ct-stamford',
    name: 'Stamford',
    address: '1266 E Main St Suite 465',
    city: 'Stamford',
    state: 'CT',
    zip: '06902',
    phone: '(475) 334-2290',
    fax: '',
    email: 'stamford@veintreatmentclinic.com',
    hours: 'Mon-Fri 9am-7pm',
    timezone: 'America/New_York',
    providers: [],
    services: ['Sclerotherapy', 'Radiofrequency Ablation', 'VenaSeal', 'Ultrasound Diagnosis'],
    acceptedInsurance: ['Aetna', 'BlueCross', 'Cigna', 'United', 'Medicare'],
    status: 'active',
    chatEnabled: true,
    smsEnabled: true,
    maxDailyAppointments: 16,
    nearestAlternative: 'Hamden',
  },
  {
    id: 'loc-ct-hamden',
    name: 'Hamden',
    address: '2080 Whitney Ave #250',
    city: 'Hamden',
    state: 'CT',
    zip: '06518',
    phone: '',
    fax: '',
    email: 'hamden@veintreatmentclinic.com',
    hours: 'Mon-Fri 9am-7pm',
    timezone: 'America/New_York',
    providers: ['Dr. Martin Tyson'],
    services: ['Sclerotherapy', 'Radiofrequency Ablation', 'VenaSeal', 'Ultrasound Diagnosis'],
    acceptedInsurance: ['Aetna', 'BlueCross', 'Cigna', 'United', 'Medicare'],
    status: 'active',
    chatEnabled: true,
    smsEnabled: true,
    maxDailyAppointments: 16,
    nearestAlternative: 'Farmington',
  },
  {
    id: 'loc-ct-farmington',
    name: 'Farmington',
    address: '399 Farmington Ave LL2',
    city: 'Farmington',
    state: 'CT',
    zip: '06032',
    phone: '(860) 703-5273',
    fax: '',
    email: 'farmington@veintreatmentclinic.com',
    hours: 'Mon-Fri 9am-7pm',
    timezone: 'America/New_York',
    providers: ['Dr. Martin Tyson'],
    services: ['Sclerotherapy', 'Radiofrequency Ablation', 'VenaSeal', 'Ultrasound Diagnosis'],
    acceptedInsurance: ['Aetna', 'BlueCross', 'Cigna', 'United', 'Medicare'],
    status: 'active',
    chatEnabled: true,
    smsEnabled: true,
    maxDailyAppointments: 16,
    nearestAlternative: 'Hamden',
  },
  // --- MARYLAND ---
  {
    id: 'loc-md-bethesda',
    name: 'Bethesda',
    address: '6903 Rockledge Drive Suite 470',
    city: 'Bethesda',
    state: 'MD',
    zip: '20817',
    phone: '(240) 956-7160',
    fax: '',
    email: 'bethesda@veintreatmentclinic.com',
    hours: 'Mon-Fri 9am-7pm',
    timezone: 'America/New_York',
    providers: ['Dr. Kamran Saraf'],
    services: ['Sclerotherapy', 'Radiofrequency Ablation', 'VenaSeal', 'Ultrasound Diagnosis'],
    acceptedInsurance: ['Aetna', 'BlueCross', 'Cigna', 'United', 'Medicare'],
    status: 'active',
    chatEnabled: true,
    smsEnabled: true,
    maxDailyAppointments: 18,
    nearestAlternative: 'Maple Lawn',
  },
  {
    id: 'loc-md-maple-lawn',
    name: 'Maple Lawn / Fulton',
    address: '11810 W Market Pl Suite 300',
    city: 'Fulton',
    state: 'MD',
    zip: '20759',
    phone: '(240) 917-3048',
    fax: '',
    email: 'maplelawn@veintreatmentclinic.com',
    hours: 'Mon-Fri 9am-7pm',
    timezone: 'America/New_York',
    providers: ['Dr. Lisa Alford'],
    services: ['Sclerotherapy', 'Radiofrequency Ablation', 'VenaSeal', 'Ultrasound Diagnosis'],
    acceptedInsurance: ['Aetna', 'BlueCross', 'Cigna', 'United', 'Medicare'],
    status: 'active',
    chatEnabled: true,
    smsEnabled: true,
    maxDailyAppointments: 16,
    nearestAlternative: 'Bethesda',
  },
  {
    id: 'loc-md-bowie',
    name: 'Bowie',
    address: '4201 Northview Dr Suite 104',
    city: 'Bowie',
    state: 'MD',
    zip: '20716',
    phone: '(240) 932-9725',
    fax: '',
    email: 'bowie@veintreatmentclinic.com',
    hours: 'Mon-Fri 9am-7pm',
    timezone: 'America/New_York',
    providers: ['Dr. Lisa Alford'],
    services: ['Sclerotherapy', 'Radiofrequency Ablation', 'VenaSeal', 'Ultrasound Diagnosis'],
    acceptedInsurance: ['Aetna', 'BlueCross', 'Cigna', 'United', 'Medicare'],
    status: 'active',
    chatEnabled: true,
    smsEnabled: true,
    maxDailyAppointments: 16,
    nearestAlternative: 'Maple Lawn / Fulton',
  },
  // --- TEXAS ---
  {
    id: 'loc-tx-fort-worth',
    name: 'Fort Worth',
    address: '3455 Locke Ave Suite 300',
    city: 'Fort Worth',
    state: 'TX',
    zip: '76107',
    phone: '(817) 686-2685',
    fax: '',
    email: 'fortworth@veintreatmentclinic.com',
    hours: 'Mon-Fri 9am-5pm',
    timezone: 'America/Chicago',
    providers: ['Dr. James Chalk'],
    services: ['Sclerotherapy', 'Radiofrequency Ablation', 'VenaSeal', 'Ultrasound Diagnosis'],
    acceptedInsurance: ['Aetna', 'BlueCross', 'Cigna', 'United', 'Medicare'],
    status: 'active',
    chatEnabled: true,
    smsEnabled: true,
    maxDailyAppointments: 18,
    nearestAlternative: 'Arlington',
  },
  {
    id: 'loc-tx-arlington',
    name: 'Arlington',
    address: '3050 S Center St Suite 110',
    city: 'Arlington',
    state: 'TX',
    zip: '76014',
    phone: '(817) 404-4877',
    fax: '',
    email: 'arlington@veintreatmentclinic.com',
    hours: 'Mon-Fri 9am-5pm',
    timezone: 'America/Chicago',
    providers: ['Dr. James Chalk'],
    services: ['Sclerotherapy', 'Radiofrequency Ablation', 'VenaSeal', 'Ultrasound Diagnosis'],
    acceptedInsurance: ['Aetna', 'BlueCross', 'Cigna', 'United', 'Medicare'],
    status: 'active',
    chatEnabled: true,
    smsEnabled: true,
    maxDailyAppointments: 18,
    nearestAlternative: 'Fort Worth',
  },
  {
    id: 'loc-tx-kyle',
    name: 'Kyle / Cedar Park',
    address: '135 Bunton Creek Rd #300',
    city: 'Kyle',
    state: 'TX',
    zip: '78640',
    phone: '(512) 807-6742',
    fax: '',
    email: 'kyle@veintreatmentclinic.com',
    hours: 'Mon-Fri 9am-5pm',
    timezone: 'America/Chicago',
    providers: ['Dr. Shane Volney'],
    services: ['Sclerotherapy', 'Radiofrequency Ablation', 'VenaSeal', 'Ultrasound Diagnosis'],
    acceptedInsurance: ['Aetna', 'BlueCross', 'Cigna', 'United', 'Medicare'],
    status: 'active',
    chatEnabled: true,
    smsEnabled: true,
    maxDailyAppointments: 16,
    nearestAlternative: 'Arlington',
  },
  {
    id: 'loc-tx-addison',
    name: 'Addison (Coming Soon)',
    address: '',
    city: 'Addison',
    state: 'TX',
    zip: '75001',
    phone: '',
    fax: '',
    email: 'addison@veintreatmentclinic.com',
    hours: 'TBD',
    timezone: 'America/Chicago',
    providers: [],
    services: [],
    acceptedInsurance: [],
    status: 'inactive',
    chatEnabled: false,
    smsEnabled: false,
    maxDailyAppointments: 0,
    nearestAlternative: 'Fort Worth',
  },
  // --- CALIFORNIA ---
  {
    id: 'loc-ca-san-diego',
    name: 'San Diego',
    address: '5330 Carroll Canyon Rd #140',
    city: 'San Diego',
    state: 'CA',
    zip: '92121',
    phone: '(858) 800-8772',
    fax: '',
    email: 'sandiego@veintreatmentclinic.com',
    hours: 'Mon-Fri 9am-5pm',
    timezone: 'America/Los_Angeles',
    providers: ['Dr. Joshua Kindelan'],
    services: ['Sclerotherapy', 'Radiofrequency Ablation', 'VenaSeal', 'Ultrasound Diagnosis'],
    acceptedInsurance: ['Aetna', 'BlueCross', 'Cigna', 'United', 'Medicare'],
    status: 'active',
    chatEnabled: true,
    smsEnabled: true,
    maxDailyAppointments: 18,
    nearestAlternative: 'National City',
  },
  {
    id: 'loc-ca-national-city',
    name: 'National City',
    address: '22 W 35th St Suite 202',
    city: 'National City',
    state: 'CA',
    zip: '91950',
    phone: '(619) 505-9012',
    fax: '',
    email: 'nationalcity@veintreatmentclinic.com',
    hours: 'Mon-Fri 9am-5pm',
    timezone: 'America/Los_Angeles',
    providers: ['Dr. Joshua Kindelan'],
    services: ['Sclerotherapy', 'Radiofrequency Ablation', 'VenaSeal', 'Ultrasound Diagnosis'],
    acceptedInsurance: ['Aetna', 'BlueCross', 'Cigna', 'United', 'Medicare'],
    status: 'active',
    chatEnabled: true,
    smsEnabled: true,
    maxDailyAppointments: 16,
    nearestAlternative: 'San Diego',
  },
  {
    id: 'loc-ca-poway',
    name: 'Poway',
    address: '15708 Pomerado Rd Suite N202',
    city: 'Poway',
    state: 'CA',
    zip: '92064',
    phone: '(619) 956-7879',
    fax: '',
    email: 'poway@veintreatmentclinic.com',
    hours: 'Mon-Fri 9am-4pm',
    timezone: 'America/Los_Angeles',
    providers: ['Dr. Joshua Kindelan'],
    services: ['Sclerotherapy', 'Radiofrequency Ablation', 'VenaSeal', 'Ultrasound Diagnosis'],
    acceptedInsurance: ['Aetna', 'BlueCross', 'Cigna', 'United', 'Medicare'],
    status: 'active',
    chatEnabled: true,
    smsEnabled: true,
    maxDailyAppointments: 14,
    nearestAlternative: 'San Diego',
  },
  {
    id: 'loc-ca-temecula',
    name: 'Temecula',
    address: '27290 Madison Ave Suite 102',
    city: 'Temecula',
    state: 'CA',
    zip: '92590',
    phone: '(951) 904-6828',
    fax: '',
    email: 'temecula@veintreatmentclinic.com',
    hours: 'Mon-Fri 9am-5pm',
    timezone: 'America/Los_Angeles',
    providers: ['Dr. Kimberly McFarland'],
    services: ['Sclerotherapy', 'Radiofrequency Ablation', 'VenaSeal', 'Ultrasound Diagnosis'],
    acceptedInsurance: ['Aetna', 'BlueCross', 'Cigna', 'United', 'Medicare'],
    status: 'active',
    chatEnabled: true,
    smsEnabled: true,
    maxDailyAppointments: 16,
    nearestAlternative: 'San Diego',
  },
  {
    id: 'loc-ca-irvine',
    name: 'Irvine',
    address: '4482 Barranca Pkwy #252',
    city: 'Irvine',
    state: 'CA',
    zip: '92604',
    phone: '(949) 850-8337',
    fax: '',
    email: 'irvine@veintreatmentclinic.com',
    hours: 'Mon-Fri 9am-7pm',
    timezone: 'America/Los_Angeles',
    providers: ['Dr. Farshid Etaee'],
    services: ['Sclerotherapy', 'Radiofrequency Ablation', 'VenaSeal', 'Ultrasound Diagnosis'],
    acceptedInsurance: ['Aetna', 'BlueCross', 'Cigna', 'United', 'Medicare'],
    status: 'active',
    chatEnabled: true,
    smsEnabled: true,
    maxDailyAppointments: 18,
    nearestAlternative: 'Newport Beach',
  },
  {
    id: 'loc-ca-newport-beach',
    name: 'Newport Beach',
    address: '1525 Superior Ave Suite 202',
    city: 'Newport Beach',
    state: 'CA',
    zip: '92663',
    phone: '(949) 763-5408',
    fax: '',
    email: 'newportbeach@veintreatmentclinic.com',
    hours: 'Mon-Fri 9am-7pm',
    timezone: 'America/Los_Angeles',
    providers: ['Dr. Farshid Etaee'],
    services: ['Sclerotherapy', 'Radiofrequency Ablation', 'VenaSeal', 'Ultrasound Diagnosis'],
    acceptedInsurance: ['Aetna', 'BlueCross', 'Cigna', 'United', 'Medicare'],
    status: 'active',
    chatEnabled: true,
    smsEnabled: true,
    maxDailyAppointments: 18,
    nearestAlternative: 'Irvine',
  },
  {
    id: 'loc-ca-huntington-beach',
    name: 'Huntington Beach',
    address: '7677 Center Ave Suite 310',
    city: 'Huntington Beach',
    state: 'CA',
    zip: '92647',
    phone: '(562) 585-0838',
    fax: '',
    email: 'huntingtonbeach@veintreatmentclinic.com',
    hours: 'Mon-Fri 9am-7pm',
    timezone: 'America/Los_Angeles',
    providers: ['Dr. Farshid Etaee'],
    services: ['Sclerotherapy', 'Radiofrequency Ablation', 'VenaSeal', 'Ultrasound Diagnosis'],
    acceptedInsurance: ['Aetna', 'BlueCross', 'Cigna', 'United', 'Medicare'],
    status: 'active',
    chatEnabled: true,
    smsEnabled: true,
    maxDailyAppointments: 16,
    nearestAlternative: 'Newport Beach',
  },
  {
    id: 'loc-ca-palo-alto',
    name: 'Palo Alto',
    address: '2248 Park Blvd',
    city: 'Palo Alto',
    state: 'CA',
    zip: '94306',
    phone: '(650) 702-4544',
    fax: '',
    email: 'paloalto@veintreatmentclinic.com',
    hours: 'Mon-Fri 9am-5pm',
    timezone: 'America/Los_Angeles',
    providers: ['Dr. Walter Lech'],
    services: ['Sclerotherapy', 'Radiofrequency Ablation', 'VenaSeal', 'Ultrasound Diagnosis'],
    acceptedInsurance: ['Aetna', 'BlueCross', 'Cigna', 'United', 'Medicare'],
    status: 'active',
    chatEnabled: true,
    smsEnabled: true,
    maxDailyAppointments: 16,
    nearestAlternative: 'San Jose',
  },
  {
    id: 'loc-ca-san-jose',
    name: 'San Jose',
    address: '1270 S Winchester Blvd #102',
    city: 'San Jose',
    state: 'CA',
    zip: '95128',
    phone: '(669) 341-2584',
    fax: '',
    email: 'sanjose@veintreatmentclinic.com',
    hours: 'Mon-Fri 9am-5pm',
    timezone: 'America/Los_Angeles',
    providers: ['Dr. Walter Lech'],
    services: ['Sclerotherapy', 'Radiofrequency Ablation', 'VenaSeal', 'Ultrasound Diagnosis'],
    acceptedInsurance: ['Aetna', 'BlueCross', 'Cigna', 'United', 'Medicare'],
    status: 'active',
    chatEnabled: true,
    smsEnabled: true,
    maxDailyAppointments: 16,
    nearestAlternative: 'Palo Alto',
  },
  {
    id: 'loc-ca-sacramento',
    name: 'Sacramento (Coming Soon)',
    address: '',
    city: 'Sacramento',
    state: 'CA',
    zip: '',
    phone: '',
    fax: '',
    email: 'sacramento@veintreatmentclinic.com',
    hours: 'TBD',
    timezone: 'America/Los_Angeles',
    providers: [],
    services: [],
    acceptedInsurance: [],
    status: 'inactive',
    chatEnabled: false,
    smsEnabled: false,
    maxDailyAppointments: 0,
    nearestAlternative: 'San Jose',
  },
];

const emptyLocation: Omit<Location, 'id'> = {
  name: '',
  address: '',
  city: '',
  state: '',
  zip: '',
  phone: '',
  fax: '',
  email: '',
  hours: 'Mon-Fri 9am-7pm',
  timezone: 'America/New_York',
  providers: [],
  services: [],
  acceptedInsurance: [],
  status: 'active',
  chatEnabled: true,
  smsEnabled: true,
  maxDailyAppointments: 16,
  nearestAlternative: '',
};

export default function LocationsPage() {
  const [locations, setLocations] = useState<Location[]>(initialLocations);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState<Omit<Location, 'id'>>(emptyLocation);
  const [editingId, setEditingId] = useState<string | null>(null);

  const filtered = locations.filter(
    (loc) =>
      loc.name.toLowerCase().includes(search.toLowerCase()) ||
      loc.city.toLowerCase().includes(search.toLowerCase()) ||
      loc.state.toLowerCase().includes(search.toLowerCase()),
  );

  const handleOpenAdd = () => {
    setFormData(emptyLocation);
    setEditingId(null);
    setShowForm(true);
  };

  const handleOpenEdit = (loc: Location) => {
    const { id, ...rest } = loc;
    setFormData(rest);
    setEditingId(id);
    setShowForm(true);
  };

  const handleSave = () => {
    if (!formData.name.trim()) return;

    if (editingId) {
      setLocations((prev) =>
        prev.map((l) => (l.id === editingId ? { ...formData, id: editingId } : l)),
      );
    } else {
      const newId = `loc-${formData.state.toLowerCase()}-${formData.city.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}`;
      setLocations((prev) => [...prev, { ...formData, id: newId }]);
    }
    setShowForm(false);
    setFormData(emptyLocation);
    setEditingId(null);
  };

  const handleDelete = (id: string) => {
    setLocations((prev) => prev.filter((l) => l.id !== id));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1>Locations</h1>
          <p className="text-healthcare-muted mt-1">
            Manage clinic locations, hours, and service availability ({locations.length} locations)
          </p>
        </div>
        <button onClick={handleOpenAdd} className="btn-primary">
          <Plus className="w-4 h-4" />
          Add Location
        </button>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-healthcare-muted" />
        <input
          type="text"
          placeholder="Search locations by name, city, or state..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="input pl-10"
        />
      </div>

      {/* Add/Edit Location Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b border-healthcare-line">
              <h2 className="text-lg font-semibold">
                {editingId ? 'Edit Location' : 'Add New Location'}
              </h2>
              <button
                onClick={() => {
                  setShowForm(false);
                  setEditingId(null);
                }}
                className="btn-ghost"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-medium mb-1">Location Name *</label>
                  <input
                    type="text"
                    className="input w-full"
                    placeholder="e.g. Midtown Manhattan"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium mb-1">Street Address</label>
                  <input
                    type="text"
                    className="input w-full"
                    placeholder="e.g. 290 Madison Ave Floor 2"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">City</label>
                  <input
                    type="text"
                    className="input w-full"
                    placeholder="City"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-sm font-medium mb-1">State</label>
                    <input
                      type="text"
                      className="input w-full"
                      placeholder="NY"
                      maxLength={2}
                      value={formData.state}
                      onChange={(e) =>
                        setFormData({ ...formData, state: e.target.value.toUpperCase() })
                      }
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">ZIP</label>
                    <input
                      type="text"
                      className="input w-full"
                      placeholder="10017"
                      value={formData.zip}
                      onChange={(e) => setFormData({ ...formData, zip: e.target.value })}
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Phone</label>
                  <input
                    type="text"
                    className="input w-full"
                    placeholder="(555) 123-4567"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Email</label>
                  <input
                    type="text"
                    className="input w-full"
                    placeholder="location@veintreatmentclinic.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Hours</label>
                  <input
                    type="text"
                    className="input w-full"
                    placeholder="Mon-Fri 9am-7pm"
                    value={formData.hours}
                    onChange={(e) => setFormData({ ...formData, hours: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Timezone</label>
                  <select
                    className="input w-full"
                    value={formData.timezone}
                    onChange={(e) => setFormData({ ...formData, timezone: e.target.value })}
                  >
                    <option value="America/New_York">Eastern</option>
                    <option value="America/Chicago">Central</option>
                    <option value="America/Denver">Mountain</option>
                    <option value="America/Los_Angeles">Pacific</option>
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium mb-1">
                    Providers (comma-separated)
                  </label>
                  <input
                    type="text"
                    className="input w-full"
                    placeholder="Dr. Smith, Dr. Jones"
                    value={formData.providers.join(', ')}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        providers: e.target.value
                          .split(',')
                          .map((s) => s.trim())
                          .filter(Boolean),
                      })
                    }
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium mb-1">
                    Services (comma-separated)
                  </label>
                  <input
                    type="text"
                    className="input w-full"
                    placeholder="Sclerotherapy, Radiofrequency Ablation, VenaSeal"
                    value={formData.services.join(', ')}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        services: e.target.value
                          .split(',')
                          .map((s) => s.trim())
                          .filter(Boolean),
                      })
                    }
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium mb-1">
                    Accepted Insurance (comma-separated)
                  </label>
                  <input
                    type="text"
                    className="input w-full"
                    placeholder="Aetna, BlueCross, Cigna, United, Medicare"
                    value={formData.acceptedInsurance.join(', ')}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        acceptedInsurance: e.target.value
                          .split(',')
                          .map((s) => s.trim())
                          .filter(Boolean),
                      })
                    }
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Status</label>
                  <select
                    className="input w-full"
                    value={formData.status}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        status: e.target.value as 'active' | 'inactive',
                      })
                    }
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Max Daily Appointments</label>
                  <input
                    type="number"
                    className="input w-full"
                    value={formData.maxDailyAppointments}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        maxDailyAppointments: parseInt(e.target.value) || 0,
                      })
                    }
                  />
                </div>
                <div className="flex items-center gap-6 col-span-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.chatEnabled}
                      onChange={(e) =>
                        setFormData({ ...formData, chatEnabled: e.target.checked })
                      }
                    />
                    <span className="text-sm">Chat Enabled</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.smsEnabled}
                      onChange={(e) =>
                        setFormData({ ...formData, smsEnabled: e.target.checked })
                      }
                    />
                    <span className="text-sm">SMS Enabled</span>
                  </label>
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-3 p-4 border-t border-healthcare-line">
              <button
                onClick={() => {
                  setShowForm(false);
                  setEditingId(null);
                }}
                className="btn-ghost"
              >
                Cancel
              </button>
              <button onClick={handleSave} className="btn-primary">
                {editingId ? 'Save Changes' : 'Add Location'}
              </button>
            </div>
          </div>
        </div>
      )}

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
                <button className="btn-ghost" onClick={() => handleOpenEdit(loc)}>
                  <Edit className="w-4 h-4" />
                </button>
                <button
                  className="btn-ghost text-red-500 hover:text-red-700"
                  onClick={() => handleDelete(loc.id)}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="card-body space-y-3">
              {loc.address && (
                <p className="text-sm text-healthcare-muted">{loc.address}</p>
              )}

              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="flex items-center gap-2 text-healthcare-muted">
                  <Phone className="w-3.5 h-3.5" />
                  <span>{loc.phone || 'N/A'}</span>
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

              <div className="flex items-center gap-4 pt-2 border-t border-healthcare-line text-xs text-healthcare-muted">
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

      {filtered.length === 0 && (
        <div className="text-center py-12 text-healthcare-muted">
          <MapPin className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>No locations found matching &quot;{search}&quot;</p>
        </div>
      )}
    </div>
  );
}
