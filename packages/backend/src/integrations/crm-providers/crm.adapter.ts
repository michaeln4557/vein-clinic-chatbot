/**
 * CRM Provider Adapter
 *
 * Abstraction layer for CRM integrations.
 * Maps extracted conversation fields to CRM-specific schemas.
 *
 * Supported CRM providers:
 * - Salesforce
 * - HubSpot
 * - Custom CRM APIs
 */

export interface CrmProvider {
  readonly name: string;
  syncLead(payload: CrmLeadPayload): Promise<CrmSyncResult>;
  syncBooking(payload: CrmBookingPayload): Promise<CrmSyncResult>;
  getLeadByPhone(phone: string): Promise<CrmLead | null>;
  updateLead(crmId: string, updates: Partial<CrmLeadPayload>): Promise<CrmSyncResult>;
}

export interface CrmLeadPayload {
  full_name: string;
  phone_number: string;
  email?: string;
  date_of_birth?: string;
  address?: string;
  insurance_provider?: string;
  insurance_member_id?: string;
  requested_location?: string;
  preferred_contact_method?: string;
  lead_source: string;
  lead_status: string;
  notes?: string;
  conversation_id: string;
  channel: string;
}

export interface CrmBookingPayload {
  lead_crm_id: string;
  location_id: string;
  location_name: string;
  appointment_date: string;
  appointment_time: string;
  appointment_type: string;
  booking_status: string;
  insurance_verified: boolean;
  confirmation_number?: string;
}

export interface CrmSyncResult {
  success: boolean;
  crm_id?: string;
  crm_url?: string;
  error?: string;
  synced_at: Date;
}

export interface CrmLead {
  crm_id: string;
  full_name: string;
  phone_number: string;
  email?: string;
  lead_status: string;
  last_activity: Date;
}

/**
 * Generic/Stub CRM Provider
 * Used during development or when no CRM is configured.
 */
export class GenericCrmProvider implements CrmProvider {
  readonly name = 'generic';

  async syncLead(payload: CrmLeadPayload): Promise<CrmSyncResult> {
    console.log('[CRM] Syncing lead:', payload.full_name, payload.phone_number);
    return {
      success: true,
      crm_id: `CRM_${Date.now()}`,
      synced_at: new Date(),
    };
  }

  async syncBooking(payload: CrmBookingPayload): Promise<CrmSyncResult> {
    console.log('[CRM] Syncing booking for lead:', payload.lead_crm_id);
    return {
      success: true,
      crm_id: `CRM_BK_${Date.now()}`,
      synced_at: new Date(),
    };
  }

  async getLeadByPhone(_phone: string): Promise<CrmLead | null> {
    // TODO: Implement CRM lookup
    return null;
  }

  async updateLead(crmId: string, _updates: Partial<CrmLeadPayload>): Promise<CrmSyncResult> {
    return {
      success: true,
      crm_id: crmId,
      synced_at: new Date(),
    };
  }
}

export class CrmProviderFactory {
  private providers: Map<string, CrmProvider> = new Map();

  constructor() {
    this.register(new GenericCrmProvider());
  }

  register(provider: CrmProvider): void {
    this.providers.set(provider.name, provider);
  }

  getProvider(name: string = 'generic'): CrmProvider {
    return this.providers.get(name) || this.providers.get('generic')!;
  }
}

export default CrmProviderFactory;
