/**
 * Duplicate Detection Tests
 *
 * Tests duplicate patient detection by phone, name+DOB, and email.
 */

// ---- Types ----

interface PatientRecord {
  id: string;
  name: string;
  phone: string;
  email?: string;
  dateOfBirth?: string;
  createdAt: Date;
}

interface DuplicateMatch {
  existingPatient: PatientRecord;
  matchType: 'phone' | 'name_dob' | 'email';
  confidence: number;
}

// ---- Mock patient store ----

const mockPatients: PatientRecord[] = [
  {
    id: 'pat_001',
    name: 'Jane Smith',
    phone: '(555) 123-4567',
    email: 'jane.smith@example.com',
    dateOfBirth: '1985-06-15',
    createdAt: new Date('2025-01-10'),
  },
  {
    id: 'pat_002',
    name: 'John Doe',
    phone: '(555) 987-6543',
    email: 'john.doe@example.com',
    dateOfBirth: '1978-11-22',
    createdAt: new Date('2025-02-14'),
  },
  {
    id: 'pat_003',
    name: 'Maria Garcia',
    phone: '(555) 456-7890',
    email: 'maria.garcia@example.com',
    dateOfBirth: '1992-03-08',
    createdAt: new Date('2025-03-01'),
  },
  {
    id: 'pat_004',
    name: 'Robert Johnson',
    phone: '(555) 111-2222',
    dateOfBirth: '1965-09-30',
    createdAt: new Date('2025-04-20'),
  },
];

// ---- Duplicate detection implementation ----

function normalizePhoneForComparison(phone: string): string {
  return phone.replace(/\D/g, '').replace(/^1(\d{10})$/, '$1');
}

function normalizeNameForComparison(name: string): string {
  return name.toLowerCase().trim().replace(/\s+/g, ' ');
}

function findDuplicateByPhone(phone: string, patients: PatientRecord[]): DuplicateMatch | null {
  const normalized = normalizePhoneForComparison(phone);
  for (const patient of patients) {
    if (normalizePhoneForComparison(patient.phone) === normalized) {
      return {
        existingPatient: patient,
        matchType: 'phone',
        confidence: 0.98,
      };
    }
  }
  return null;
}

function findDuplicateByNameDob(
  name: string,
  dob: string,
  patients: PatientRecord[]
): DuplicateMatch | null {
  const normalizedName = normalizeNameForComparison(name);
  for (const patient of patients) {
    if (
      normalizeNameForComparison(patient.name) === normalizedName &&
      patient.dateOfBirth === dob
    ) {
      return {
        existingPatient: patient,
        matchType: 'name_dob',
        confidence: 0.95,
      };
    }
  }
  return null;
}

function findDuplicateByEmail(
  email: string,
  patients: PatientRecord[]
): DuplicateMatch | null {
  const normalizedEmail = email.toLowerCase().trim();
  for (const patient of patients) {
    if (patient.email && patient.email.toLowerCase().trim() === normalizedEmail) {
      return {
        existingPatient: patient,
        matchType: 'email',
        confidence: 0.97,
      };
    }
  }
  return null;
}

function findDuplicates(
  incoming: { name?: string; phone?: string; email?: string; dateOfBirth?: string },
  patients: PatientRecord[]
): DuplicateMatch[] {
  const matches: DuplicateMatch[] = [];
  const seenIds = new Set<string>();

  // Phone match (highest confidence)
  if (incoming.phone) {
    const match = findDuplicateByPhone(incoming.phone, patients);
    if (match && !seenIds.has(match.existingPatient.id)) {
      matches.push(match);
      seenIds.add(match.existingPatient.id);
    }
  }

  // Email match
  if (incoming.email) {
    const match = findDuplicateByEmail(incoming.email, patients);
    if (match && !seenIds.has(match.existingPatient.id)) {
      matches.push(match);
      seenIds.add(match.existingPatient.id);
    }
  }

  // Name + DOB match
  if (incoming.name && incoming.dateOfBirth) {
    const match = findDuplicateByNameDob(incoming.name, incoming.dateOfBirth, patients);
    if (match && !seenIds.has(match.existingPatient.id)) {
      matches.push(match);
      seenIds.add(match.existingPatient.id);
    }
  }

  return matches;
}

// ---- Tests ----

describe('Duplicate Detection by Phone', () => {
  it('should detect exact phone match', () => {
    const result = findDuplicateByPhone('(555) 123-4567', mockPatients);
    expect(result).not.toBeNull();
    expect(result!.existingPatient.id).toBe('pat_001');
    expect(result!.matchType).toBe('phone');
    expect(result!.confidence).toBeGreaterThanOrEqual(0.95);
  });

  it('should detect match regardless of formatting', () => {
    const formats = ['5551234567', '555-123-4567', '555.123.4567', '+15551234567'];
    for (const phone of formats) {
      const result = findDuplicateByPhone(phone, mockPatients);
      expect(result).not.toBeNull();
      expect(result!.existingPatient.id).toBe('pat_001');
    }
  });

  it('should strip leading country code 1', () => {
    const result = findDuplicateByPhone('15551234567', mockPatients);
    expect(result).not.toBeNull();
    expect(result!.existingPatient.id).toBe('pat_001');
  });

  it('should return null for non-matching phone', () => {
    const result = findDuplicateByPhone('(555) 000-0000', mockPatients);
    expect(result).toBeNull();
  });

  it('should return null for empty phone', () => {
    const result = findDuplicateByPhone('', mockPatients);
    expect(result).toBeNull();
  });
});

describe('Duplicate Detection by Name + DOB', () => {
  it('should detect exact name + DOB match', () => {
    const result = findDuplicateByNameDob('Jane Smith', '1985-06-15', mockPatients);
    expect(result).not.toBeNull();
    expect(result!.existingPatient.id).toBe('pat_001');
    expect(result!.matchType).toBe('name_dob');
  });

  it('should match names case-insensitively', () => {
    const result = findDuplicateByNameDob('JANE SMITH', '1985-06-15', mockPatients);
    expect(result).not.toBeNull();
    expect(result!.existingPatient.id).toBe('pat_001');
  });

  it('should match names with extra whitespace', () => {
    const result = findDuplicateByNameDob('  Jane   Smith  ', '1985-06-15', mockPatients);
    expect(result).not.toBeNull();
  });

  it('should not match if name matches but DOB differs', () => {
    const result = findDuplicateByNameDob('Jane Smith', '1990-01-01', mockPatients);
    expect(result).toBeNull();
  });

  it('should not match if DOB matches but name differs', () => {
    const result = findDuplicateByNameDob('Janet Smith', '1985-06-15', mockPatients);
    expect(result).toBeNull();
  });
});

describe('Duplicate Detection by Email', () => {
  it('should detect exact email match', () => {
    const result = findDuplicateByEmail('jane.smith@example.com', mockPatients);
    expect(result).not.toBeNull();
    expect(result!.existingPatient.id).toBe('pat_001');
    expect(result!.matchType).toBe('email');
  });

  it('should match emails case-insensitively', () => {
    const result = findDuplicateByEmail('Jane.Smith@Example.COM', mockPatients);
    expect(result).not.toBeNull();
  });

  it('should return null for non-matching email', () => {
    const result = findDuplicateByEmail('unknown@example.com', mockPatients);
    expect(result).toBeNull();
  });

  it('should return null for patient without email', () => {
    // pat_004 has no email
    const result = findDuplicateByEmail('robert@example.com', mockPatients);
    expect(result).toBeNull();
  });
});

describe('Combined Duplicate Detection', () => {
  it('should find phone match only', () => {
    const matches = findDuplicates(
      { phone: '(555) 123-4567' },
      mockPatients
    );
    expect(matches).toHaveLength(1);
    expect(matches[0].matchType).toBe('phone');
  });

  it('should find both phone and email when they belong to same patient', () => {
    const matches = findDuplicates(
      { phone: '(555) 123-4567', email: 'jane.smith@example.com' },
      mockPatients
    );
    // Same patient matched by phone first, email should be deduplicated
    expect(matches).toHaveLength(1);
  });

  it('should find matches from different patients', () => {
    const matches = findDuplicates(
      { phone: '(555) 123-4567', email: 'john.doe@example.com' },
      mockPatients
    );
    expect(matches).toHaveLength(2);
    const ids = matches.map((m) => m.existingPatient.id);
    expect(ids).toContain('pat_001');
    expect(ids).toContain('pat_002');
  });

  it('should return empty array for new patient', () => {
    const matches = findDuplicates(
      { name: 'New Patient', phone: '(555) 000-0001', email: 'new@example.com' },
      mockPatients
    );
    expect(matches).toHaveLength(0);
  });

  it('should handle partial data gracefully', () => {
    const matches = findDuplicates({}, mockPatients);
    expect(matches).toHaveLength(0);
  });

  it('should find name+DOB match when phone and email are absent', () => {
    const matches = findDuplicates(
      { name: 'Maria Garcia', dateOfBirth: '1992-03-08' },
      mockPatients
    );
    expect(matches).toHaveLength(1);
    expect(matches[0].matchType).toBe('name_dob');
  });
});
