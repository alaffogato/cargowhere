import type { IncomingMessage, ServerResponse } from 'http';

export type ServerlessRequest = IncomingMessage & {
  query?: any;
  body?: any;
  url?: string;
  headers: Record<string, string | string[] | undefined>;
};

export type ServerlessResponse = ServerResponse & {
  status?: (code: number) => any;
  json?: (data: any) => any;
  send?: (data: any) => any;
};

/**
 * Serverless Health Check Endpoint
 * Path: /api/health
 */
export default async function handler(req: ServerlessRequest, res: ServerlessResponse) {
  // Support CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, AccountKey');

  if (req.method === 'OPTIONS') {
    res.statusCode = 204;
    res.end();
    return;
  }

  const isLtaConfigured = Boolean(process.env.LTA_ACCOUNT_KEY || process.env.LTA_KEY);

  const payload = {
    status: 'ok',
    service: 'singapore-carpark-api',
    endpoint: '/api/health',
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.floor(process.uptime()),
    ltaKeyConfigured: isLtaConfigured,
    message: isLtaConfigured 
      ? 'LTA AccountKey is configured and ready.' 
      : 'LTA_ACCOUNT_KEY environment variable is not yet set. Set it in your environment or .env file.'
  };

  if (typeof res.json === 'function') {
    res.json(payload);
  } else {
    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.end(JSON.stringify(payload, null, 2));
  }
}
