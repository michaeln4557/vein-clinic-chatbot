import { v4 as uuid } from 'uuid';
import {
  User,
  Role,
  Permission,
  DEFAULT_ROLE_PERMISSIONS,
} from '../../shared/src/types/auth';
import { AuditService } from './audit.service';
import { logger } from '../index';

/** Credentials for authentication */
export interface AuthCredentials {
  email: string;
  password: string;
}

/** Token pair returned on successful authentication */
export interface AuthToken {
  accessToken: string;
  refreshToken: string;
  expiresAt: string;
  user: { id: string; email: string; display_name: string; role: Role };
}

/**
 * AuthService handles authentication and authorization for the admin
 * panel and API. Validates credentials, manages session tokens, and
 * enforces role-based access control (RBAC).
 */
export class AuthService {
  // In-memory stores - TODO: Replace with Prisma + Redis
  private users: Map<string, User & { password_hash: string }> = new Map();
  private activeTokens: Map<string, { userId: string; expiresAt: string }> = new Map();

  constructor(
    private readonly auditService: AuditService,
  ) {
    this.seedUsers();
  }

  /**
   * Authenticates a user with email and password.
   */
  async authenticate(credentials: AuthCredentials): Promise<AuthToken> {
    const user = this.findUserByEmail(credentials.email);
    if (!user) {
      logger.warn('Auth failed: user not found', { email: credentials.email });
      throw new Error('Invalid credentials');
    }

    // TODO: Replace with bcrypt.compare()
    const passwordValid = credentials.password === user.password_hash;
    if (!passwordValid) {
      logger.warn('Auth failed: invalid password', { email: credentials.email });
      await this.auditService.log({
        entityType: 'user',
        entityId: user.id,
        action: 'login_failed',
        who: credentials.email,
        details: { reason: 'invalid_password' },
      });
      throw new Error('Invalid credentials');
    }

    if (!user.active) throw new Error('Account is deactivated');

    const accessToken = uuid();
    const refreshToken = uuid();
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 8);
    const expiresAtStr = expiresAt.toISOString();

    this.activeTokens.set(accessToken, { userId: user.id, expiresAt: expiresAtStr });

    await this.auditService.log({
      entityType: 'user',
      entityId: user.id,
      action: 'login_success',
      who: user.id,
      details: { email: credentials.email },
    });

    logger.info('User authenticated', { userId: user.id, email: credentials.email });

    return {
      accessToken,
      refreshToken,
      expiresAt: expiresAtStr,
      user: {
        id: user.id,
        email: user.email,
        display_name: user.display_name,
        role: user.role,
      },
    };
  }

  /**
   * Authorizes a user for a specific permission string (e.g., "playbooks:edit").
   */
  async authorize(userId: string, permission: Permission): Promise<boolean> {
    return this.hasPermission(userId, permission);
  }

  /**
   * Returns the role of a user.
   */
  async getUserRole(userId: string): Promise<Role | null> {
    const user = this.users.get(userId);
    return user?.role || null;
  }

  /**
   * Checks if a user has a specific permission. Considers role defaults,
   * additional grants, and explicit denials.
   */
  async hasPermission(userId: string, permission: Permission): Promise<boolean> {
    const user = this.users.get(userId);
    if (!user || !user.active) return false;

    // Check explicit denials first (highest priority)
    if (user.denied_permissions.includes(permission)) {
      logger.debug('Permission denied (explicit denial)', { userId, permission });
      return false;
    }

    // Check explicit additional grants
    if (user.additional_permissions.includes(permission)) return true;

    // Check role-based permissions
    const rolePermissions = DEFAULT_ROLE_PERMISSIONS[user.role] || [];
    if (rolePermissions.includes(permission)) return true;

    logger.debug('Permission denied', { userId, role: user.role, permission });
    return false;
  }

  // ─── Private ────────────────────────────────────────────────────────────────

  private findUserByEmail(email: string): (User & { password_hash: string }) | null {
    for (const user of this.users.values()) {
      if (user.email === email) return user;
    }
    return null;
  }

  private seedUsers(): void {
    const now = new Date().toISOString();

    const users: Array<User & { password_hash: string }> = [
      {
        id: 'user-admin-001',
        email: 'admin@veinclinic.com',
        display_name: 'System Admin',
        role: Role.Admin,
        additional_permissions: [],
        denied_permissions: [],
        active: true,
        last_login_at: null,
        created_at: now,
        updated_at: now,
        password_hash: 'admin-dev-password', // TODO: bcrypt hash
      },
      {
        id: 'user-mgr-001',
        email: 'manager@veinclinic.com',
        display_name: 'Clinic Manager',
        role: Role.Manager,
        additional_permissions: [],
        denied_permissions: [],
        active: true,
        last_login_at: null,
        created_at: now,
        updated_at: now,
        password_hash: 'manager-dev-password',
      },
      {
        id: 'user-op-001',
        email: 'operator@veinclinic.com',
        display_name: 'Care Coordinator',
        role: Role.FrontlineOperator,
        additional_permissions: [],
        denied_permissions: [],
        active: true,
        last_login_at: null,
        created_at: now,
        updated_at: now,
        password_hash: 'operator-dev-password',
      },
      {
        id: 'user-compliance-001',
        email: 'compliance@veinclinic.com',
        display_name: 'Compliance Reviewer',
        role: Role.ComplianceReviewer,
        additional_permissions: [],
        denied_permissions: [],
        active: true,
        last_login_at: null,
        created_at: now,
        updated_at: now,
        password_hash: 'compliance-dev-password',
      },
    ];

    for (const user of users) {
      this.users.set(user.id, user);
    }
  }
}
