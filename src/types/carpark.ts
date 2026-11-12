export type Agency = 'HDB' | 'URA' | 'LTA' | 'Commercial';

export type CarparkStructureType = 'Multi-Storey (MSCP)' | 'Basement' | 'Surface' | 'Covered Deck';

export type SingaporeRegion = 
  | 'Central / CBD'
  | 'Orchard'
  | 'Marina Bay'
  | 'East (Tampines / Bedok / Changi)'
  | 'West (Jurong / Clementi)'
  | 'North (Woodlands / Yishun)'
  | 'North-East (Punggol / Sengkang)'
  | 'Central (Bishan / Toa Payoh)';

export type VehicleCategory = 'cars' | 'motorcycles' | 'heavy';

export interface LotData {
  total: number;
  available: number;
}

export interface EVChargerInfo {
  available: number;
  total: number;
  powerKw: number;
  plugTypes: string[];
  operator: string;
}

export interface CarparkRates {
  weekdayPeak: string;
  weekdayPeakRateNum: number; // for quick comparison ($/hr)
  weekdayOffPeak: string;
  weekdayOffPeakRateNum: number;
  saturday: string;
  sundayPh: string;
  nightParkingCap?: string;
  gracePeriodMins: number;
  centralAreaSurcharge?: boolean;
}

export interface Carpark {
  id: string;
  carparkNumber: string; // e.g. "ACB", "SUN1", "HE12"
  name: string;
  address: string;
  postalCode: string;
  agency: Agency;
  structureType: CarparkStructureType;
  region: SingaporeRegion;
  coordinates: {
    lat: number;
    lng: number;
  };
  // Lot Availability
  carLots: LotData;
  motorcycleLots: LotData;
  heavyLots?: LotData;
  evChargers?: EVChargerInfo;
  
  // Pricing & Rules
  rates: CarparkRates;
  heightLimitM: number;
  gantrySystem: string;
  isCentralArea: boolean;
  isSheltered: boolean;
  
  // Real-Time Telemetry
  lastUpdated: string;
  trend: 'filling' | 'emptying' | 'stable';
  hourlyOccupancyPct: number[]; // 24 values (00:00 to 23:00)
  
  // Imagery
  imageUrl?: string;
}

export interface FilterOptions {
  searchQuery: string;
  agency: Agency | 'ALL';
  region: SingaporeRegion | 'ALL';
  vehicleType: VehicleCategory;
  onlyEvAvailable: boolean;
  onlySheltered: boolean;
  minAvailableLots: number;
  maxHourlyRate: number; // 0 means no limit
  statusFilter: 'ALL' | 'AMPLE' | 'LIMITED' | 'FULL';
  sortBy: 'available_lots_desc' | 'occupancy_asc' | 'rate_asc' | 'name_asc';
}

export interface LiveFeedStatus {
  source: 'simulated_live' | 'datagov_live';
  lastPing: Date;
  statusText: string;
  activeCarparksCount: number;
  totalAvailableLots: number;
}
