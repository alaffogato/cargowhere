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

export interface LTACarparkItem {
  CarParkID: string;
  Area: string;
  Development: string;
  Location: string; // "lat lng" e.g. "1.29375 103.85718"
  AvailableLots: number;
  LotType: 'C' | 'H' | 'Y'; // C: Car, H: Heavy Vehicle, Y: Motorcycle
  Agency: 'HDB' | 'LTA' | 'URA';
}

export interface LTAResponse {
  'odata.metadata'?: string;
  value: LTACarparkItem[];
}

const LTA_ENDPOINT = 'https://datamall2.mytransport.sg/ltaodataservice/CarParkAvailabilityv2';

/**
 * Fetch a single page (up to 500 records) from LTA DataMall
 */
async function fetchLTAPage(accountKey: string, skip: number = 0): Promise<LTACarparkItem[]> {
  const url = skip > 0 ? `${LTA_ENDPOINT}?$skip=${skip}` : LTA_ENDPOINT;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000);

  try {
    const res = await fetch(url, {
      method: 'GET',
      headers: {
        'AccountKey': accountKey,
        'accept': 'application/json'
      },
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!res.ok) {
      if (res.status === 401 || res.status === 403) {
        throw new Error(`Invalid or unauthorized LTA AccountKey (HTTP ${res.status}). Verify your key at https://datamall.lta.gov.sg/`);
      }
      throw new Error(`LTA DataMall API responded with status ${res.status} ${res.statusText}`);
    }

    const json = (await res.json()) as LTAResponse;
    return json.value || [];
  } catch (err: unknown) {
    clearTimeout(timeoutId);
    throw err;
  }
}

/**
 * Serverless Carpark Availability Endpoint
 * Path: /api/carparkavailability
 */
export default async function handler(req: ServerlessRequest, res: ServerlessResponse) {
  // CORS Configuration
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, AccountKey');

  if (req.method === 'OPTIONS') {
    res.statusCode = 204;
    res.end();
    return;
  }

  const sendResponse = (statusCode: number, data: any) => {
    // Cache for 30 seconds to prevent hitting LTA rate limits on rapid client polling
    res.setHeader('Cache-Control', 'public, max-age=30, s-maxage=60, stale-while-revalidate=120');
    if (typeof res.status === 'function') {
      res.status(statusCode);
    } else {
      res.statusCode = statusCode;
    }

    if (typeof res.json === 'function') {
      res.json(data);
    } else {
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      res.end(JSON.stringify(data, null, 2));
    }
  };

  // Extract LTA AccountKey from environment variable (or request header if supplied dynamically)
  const headerKey = typeof req.headers['accountkey'] === 'string' ? req.headers['accountkey'] : undefined;
  const accountKey = process.env.LTA_ACCOUNT_KEY || process.env.LTA_KEY || headerKey;

  if (!accountKey || accountKey.trim() === '' || accountKey === 'YOUR_LTA_ACCOUNT_KEY') {
    return sendResponse(401, {
      status: 'error',
      code: 'MISSING_LTA_ACCOUNT_KEY',
      message: 'LTA AccountKey is not set. Please set the LTA_ACCOUNT_KEY environment variable.',
      instruction: 'Add LTA_ACCOUNT_KEY=<YOUR_KEY> to your .env file or environment variables, or pass an AccountKey header.',
      documentation: 'Request an API key from: https://datamall.lta.gov.sg/content/datamall/en/request-api.html',
      endpoint: LTA_ENDPOINT
    });
  }

  // Parse query parameters
  const parsedUrl = new URL(req.url || '/api/carparkavailability', 'http://localhost');
  const skipParam = parsedUrl.searchParams.get('skip');
  const agencyFilter = parsedUrl.searchParams.get('agency')?.toUpperCase();
  const lotTypeFilter = parsedUrl.searchParams.get('lotType')?.toUpperCase();
  const fetchAll = parsedUrl.searchParams.get('all') === 'true';

  try {
    let allRecords: LTACarparkItem[] = [];

    if (fetchAll) {
      // Loop through all 500-record pages
      let currentSkip = 0;
      let hasMore = true;

      while (hasMore) {
        const page = await fetchLTAPage(accountKey, currentSkip);
        allRecords.push(...page);
        if (page.length < 500 || currentSkip >= 2500) {
          hasMore = false;
        } else {
          currentSkip += 500;
        }
      }
    } else {
      const skip = skipParam ? parseInt(skipParam, 10) : 0;
      allRecords = await fetchLTAPage(accountKey, skip);
    }

    // Apply optional agency filter (HDB, LTA, URA)
    if (agencyFilter) {
      allRecords = allRecords.filter(item => item.Agency?.toUpperCase() === agencyFilter);
    }

    // Apply optional lotType filter (C, H, Y)
    if (lotTypeFilter) {
      allRecords = allRecords.filter(item => item.LotType?.toUpperCase() === lotTypeFilter);
    }

    return sendResponse(200, {
      status: 'success',
      source: 'LTA DataMall CarParkAvailabilityv2',
      timestamp: new Date().toISOString(),
      count: allRecords.length,
      data: allRecords
    });
  } catch (error: any) {
    return sendResponse(502, {
      status: 'error',
      code: 'LTA_API_REQUEST_FAILED',
      message: error?.message || 'Failed to fetch data from LTA DataMall',
      endpoint: LTA_ENDPOINT
    });
  }
}
