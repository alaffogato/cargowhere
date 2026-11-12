import { Carpark } from '../types/carpark';

export interface DataGovCarparkItem {
  carpark_number: string;
  update_datetime: string;
  carpark_info: Array<{
    total_lots: string;
    lot_type: string; // 'C' = Car, 'H' = Heavy, 'Y' = Motorcycle
    lots_available: string;
  }>;
}

export interface DataGovResponse {
  items: Array<{
    timestamp: string;
    carpark_data: DataGovCarparkItem[];
  }>;
}

export async function fetchLiveGovData(): Promise<{ success: boolean; data?: Map<string, { total: number; available: number }>; timestamp?: string; error?: string }> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);
    
    const response = await fetch('https://api.data.gov.sg/v1/transport/car-park-availability', {
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`Data.gov.sg responded with status ${response.status}`);
    }

    const json: DataGovResponse = await response.json();
    if (!json.items || json.items.length === 0) {
      throw new Error('Empty dataset from Data.gov.sg');
    }

    const carparkMap = new Map<string, { total: number; available: number }>();
    const carparkList = json.items[0].carpark_data;

    for (const item of carparkList) {
      // Find car lot ('C')
      const carInfo = item.carpark_info.find(i => i.lot_type === 'C') || item.carpark_info[0];
      if (carInfo) {
        carparkMap.set(item.carpark_number.toUpperCase(), {
          total: parseInt(carInfo.total_lots, 10) || 0,
          available: parseInt(carInfo.lots_available, 10) || 0
        });
      }
    }

    return {
      success: true,
      data: carparkMap,
      timestamp: json.items[0].timestamp
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown network error';
    return {
      success: false,
      error: message
    };
  }
}

/**
 * Calculates simulated lot fluctuation for live realism
 */
export function simulateLotPulse(carparks: Carpark[]): { updated: Carpark[]; changedId: string; delta: number } {
  // Pick 1 to 2 random carparks to adjust slightly
  const randomIndex = Math.floor(Math.random() * carparks.length);
  const target = carparks[randomIndex];
  
  // Delta between -3 and +3
  const possibleDeltas = [-3, -2, -1, 1, 2, 3];
  const delta = possibleDeltas[Math.floor(Math.random() * possibleDeltas.length)];
  
  const newAvailable = Math.max(0, Math.min(target.carLots.total, target.carLots.available + delta));
  const actualDelta = newAvailable - target.carLots.available;
  
  const updated = carparks.map((cp, idx) => {
    if (idx !== randomIndex) return cp;
    return {
      ...cp,
      carLots: {
        ...cp.carLots,
        available: newAvailable
      },
      trend: actualDelta > 0 ? ('emptying' as const) : actualDelta < 0 ? ('filling' as const) : cp.trend,
      lastUpdated: 'Just now'
    };
  });

  return {
    updated,
    changedId: target.id,
    delta: actualDelta
  };
}

/**
 * Calculates estimated parking fee in Singapore Dollars (S$)
 */
export function calculateParkingFee(
  carpark: Carpark,
  entryTime: string, // "HH:MM" e.g. "14:30"
  durationMinutes: number,
  isSundayOrPh: boolean = false
): {
  totalFee: number;
  breakdown: string;
  isGracePeriod: boolean;
} {
  if (durationMinutes <= carpark.rates.gracePeriodMins) {
    return {
      totalFee: 0,
      breakdown: `Free parking: Exited within ${carpark.rates.gracePeriodMins}-minute grace period`,
      isGracePeriod: true
    };
  }

  // Parse entry hour and minute
  const [hourStr, minStr] = entryTime.split(':');
  const entryHour = parseInt(hourStr, 10) || 12;
  const entryMin = parseInt(minStr, 10) || 0;
  const entryTotalMins = entryHour * 60 + entryMin;
  const exitTotalMins = entryTotalMins + durationMinutes;

  // Sunday / Public Holiday rule for HDB
  if (isSundayOrPh && carpark.agency === 'HDB') {
    // 07:00 to 22:30 is usually Free parking for HDB
    const isDayTime = entryTotalMins >= 7 * 60 && exitTotalMins <= 22 * 60 + 30;
    if (isDayTime) {
      return {
        totalFee: 0,
        breakdown: 'HDB Sunday/PH Free Parking Scheme (07:00 - 22:30)',
        isGracePeriod: false
      };
    }
  }

  // General rate computation
  const hours = durationMinutes / 60;
  const blocksOf30m = Math.ceil(durationMinutes / 30);
  
  let fee = 0;
  let breakdown = '';

  if (carpark.agency === 'HDB' || carpark.agency === 'URA' || carpark.agency === 'LTA') {
    const ratePer30 = carpark.isCentralArea ? 1.20 : 0.60;
    fee = blocksOf30m * ratePer30;
    // Check night cap if duration extends into 22:30 - 07:00
    if (durationMinutes >= 360 && carpark.rates.nightParkingCap) {
      fee = Math.min(fee, 12.00);
    }
    breakdown = `${blocksOf30m} x 30-min blocks @ S$${ratePer30.toFixed(2)}/block (${carpark.isCentralArea ? 'Central Area' : 'Standard Rate'})`;
  } else {
    // Commercial Mall
    if (entryHour >= 17 && carpark.rates.weekdayOffPeakRateNum) {
      fee = carpark.rates.weekdayOffPeakRateNum;
      breakdown = `Evening per-entry flat rate (After 5 PM)`;
    } else {
      fee = hours * carpark.rates.weekdayPeakRateNum;
      breakdown = `${hours.toFixed(1)} hrs estimated @ approx S$${carpark.rates.weekdayPeakRateNum.toFixed(2)}/hr`;
    }
  }

  return {
    totalFee: Math.round(fee * 100) / 100,
    breakdown,
    isGracePeriod: false
  };
}

/**
 * Get Status Category:
 * Ample: > 30 lots or > 25% vacancy
 * Limited: 5 - 30 lots
 * Nearly Full / Full: < 5 lots
 */
export function getAvailabilityStatus(available: number, total: number): {
  status: 'AMPLE' | 'LIMITED' | 'FULL';
  label: string;
  colorClass: string;
  badgeBg: string;
  textColor: string;
  ringColor: string;
} {
  const pct = total > 0 ? (available / total) * 100 : 0;
  if (available <= 5) {
    return {
      status: 'FULL',
      label: available === 0 ? 'Full' : 'Nearly Full',
      colorClass: 'text-rose-400',
      badgeBg: 'bg-rose-500/10 border-rose-500/30',
      textColor: 'text-rose-400',
      ringColor: '#f43f5e'
    };
  }
  if (available < 30 || pct < 15) {
    return {
      status: 'LIMITED',
      label: 'Limited Lots',
      colorClass: 'text-amber-400',
      badgeBg: 'bg-amber-500/10 border-amber-500/30',
      textColor: 'text-amber-400',
      ringColor: '#f59e0b'
    };
  }
  return {
    status: 'AMPLE',
    label: 'Lots Available',
    colorClass: 'text-emerald-400',
    badgeBg: 'bg-emerald-500/10 border-emerald-500/30',
    textColor: 'text-emerald-400',
    ringColor: '#10b981'
  };
}
