/**
 * Application Configuration
 *
 * Loads environment variables and provides typed configuration.
 */

export interface AppConfig {
  port: number;
  nodeEnv: string;
  logLevel: string;

  database: {
    url: string;
  };

  redis: {
    url: string;
  };

  jwt: {
    secret: string;
    expiresIn: string;
  };

  twilio: {
    accountSid: string;
    authToken: string;
    phoneNumber: string;
  };

  ai: {
    anthropicApiKey?: string;
    openaiApiKey?: string;
    defaultProvider: 'anthropic' | 'openai';
    model: string;
    maxTokens: number;
    temperature: number;
  };

  s3: {
    bucket: string;
    region: string;
    accessKeyId: string;
    secretAccessKey: string;
  };

  crm: {
    apiUrl: string;
    apiKey: string;
  };

  scheduling: {
    apiUrl: string;
    apiKey: string;
  };

  cors: {
    allowedOrigins: string[];
  };

  rateLimit: {
    windowMs: number;
    maxRequests: number;
  };
}

export function loadConfig(): AppConfig {
  return {
    port: parseInt(process.env.PORT || '3001', 10),
    nodeEnv: process.env.NODE_ENV || 'development',
    logLevel: process.env.LOG_LEVEL || 'info',

    database: {
      url: process.env.DATABASE_URL || 'postgresql://vein_clinic:dev_password@localhost:5432/vein_clinic',
    },

    redis: {
      url: process.env.REDIS_URL || 'redis://localhost:6379',
    },

    jwt: {
      secret: process.env.JWT_SECRET || 'dev_jwt_secret_change_in_production',
      expiresIn: process.env.JWT_EXPIRES_IN || '24h',
    },

    twilio: {
      accountSid: process.env.TWILIO_ACCOUNT_SID || '',
      authToken: process.env.TWILIO_AUTH_TOKEN || '',
      phoneNumber: process.env.TWILIO_PHONE_NUMBER || '',
    },

    ai: {
      anthropicApiKey: process.env.ANTHROPIC_API_KEY,
      openaiApiKey: process.env.OPENAI_API_KEY,
      defaultProvider: (process.env.AI_PROVIDER as 'anthropic' | 'openai') || 'anthropic',
      model: process.env.AI_MODEL || 'claude-sonnet-4-6',
      maxTokens: parseInt(process.env.AI_MAX_TOKENS || '1024', 10),
      temperature: parseFloat(process.env.AI_TEMPERATURE || '0.3'),
    },

    s3: {
      bucket: process.env.S3_BUCKET || 'vein-clinic-uploads',
      region: process.env.S3_REGION || 'us-east-1',
      accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
    },

    crm: {
      apiUrl: process.env.CRM_API_URL || '',
      apiKey: process.env.CRM_API_KEY || '',
    },

    scheduling: {
      apiUrl: process.env.SCHEDULING_API_URL || '',
      apiKey: process.env.SCHEDULING_API_KEY || '',
    },

    cors: {
      allowedOrigins: (process.env.CORS_ORIGINS || 'http://localhost:3000').split(','),
    },

    rateLimit: {
      windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000', 10),
      maxRequests: parseInt(process.env.RATE_LIMIT_MAX || '100', 10),
    },
  };
}

export const config = loadConfig();
export default config;
