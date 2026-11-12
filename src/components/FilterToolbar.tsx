import React from 'react';
import { FilterOptions, Agency, SingaporeRegion, VehicleCategory } from '../types/carpark';
import { Search, Zap, Shield, Bookmark, SlidersHorizontal, X, ArrowUpDown, Car, Bike, Truck } from 'lucide-react';

interface FilterToolbarProps {
  filters: FilterOptions;
  onFilterChange: (newFilters: FilterOptions) => void;
  onResetFilters: () => void;
  showOnlyBookmarked: boolean;
  onToggleShowOnlyBookmarked: () => void;
  bookmarkedCount: number;
  totalCarparksCount: number;
  filteredCount: number;
}

const REGION_LIST: Array<SingaporeRegion | 'ALL'> = [
  'ALL',
  'Central / CBD',
  'Orchard',
  'Marina Bay',
  'East (Tampines / Bedok / Changi)',
  'West (Jurong / Clementi)',
  'North (Woodlands / Yishun)',
  'Central (Bishan / Toa Payoh)'
];

const AGENCIES: Array<Agency | 'ALL'> = ['ALL', 'HDB', 'URA', 'Commercial', 'LTA'];

export const FilterToolbar: React.FC<FilterToolbarProps> = ({
  filters,
  onFilterChange,
  onResetFilters,
  showOnlyBookmarked,
  onToggleShowOnlyBookmarked,
  bookmarkedCount,
  totalCarparksCount,
  filteredCount
}) => {
  return (
    <div className="bg-slate-900/90 border border-slate-800/90 rounded-2xl p-4 space-y-3.5 shadow-xl backdrop-blur-md">
      {/* Top Search & Primary Filters Row */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
        {/* Search Bar */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by carpark name, address, 6-digit postal code (e.g. 038983), or code..."
            value={filters.searchQuery}
            onChange={(e) => onFilterChange({ ...filters, searchQuery: e.target.value })}
            className="w-full bg-slate-950 border border-slate-800 text-slate-100 placeholder-slate-500 rounded-xl pl-10 pr-9 py-2.5 text-xs focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
          />
          {filters.searchQuery && (
            <button
              onClick={() => onFilterChange({ ...filters, searchQuery: '' })}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Vehicle Category Segmented Control */}
        <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800 shrink-0">
          <button
            onClick={() => onFilterChange({ ...filters, vehicleType: 'cars' })}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              filters.vehicleType === 'cars'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Car className="w-3.5 h-3.5" />
            <span>Cars</span>
          </button>
          <button
            onClick={() => onFilterChange({ ...filters, vehicleType: 'motorcycles' })}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              filters.vehicleType === 'motorcycles'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Bike className="w-3.5 h-3.5" />
            <span>Bikes</span>
          </button>
          <button
            onClick={() => onFilterChange({ ...filters, vehicleType: 'heavy' })}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              filters.vehicleType === 'heavy'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Truck className="w-3.5 h-3.5" />
            <span>Heavy</span>
          </button>
        </div>

        {/* Sort Dropdown */}
        <div className="flex items-center gap-1.5 shrink-0">
          <div className="relative">
            <select
              value={filters.sortBy}
              onChange={(e) => onFilterChange({ ...filters, sortBy: e.target.value as FilterOptions['sortBy'] })}
              className="bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded-xl px-3 py-2.5 pr-8 appearance-none focus:outline-none focus:border-indigo-500 font-mono"
            >
              <option value="available_lots_desc">Sort: Most Lots Available</option>
              <option value="occupancy_asc">Sort: Lowest Occupancy %</option>
              <option value="rate_asc">Sort: Lowest Hourly Rate</option>
              <option value="name_asc">Sort: Name (A-Z)</option>
            </select>
            <ArrowUpDown className="w-3.5 h-3.5 text-slate-500 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Agency & Quick Toggle Strip */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 pt-1 border-t border-slate-800/70">
        {/* Agency Segmented Bar */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 md:pb-0">
          <span className="text-[11px] text-slate-500 mr-1 hidden sm:inline">Agency:</span>
          {AGENCIES.map((agency) => (
            <button
              key={agency}
              onClick={() => onFilterChange({ ...filters, agency })}
              className={`px-2.5 py-1 text-xs rounded-lg font-medium whitespace-nowrap transition-colors ${
                filters.agency === agency
                  ? 'bg-slate-800 text-white border border-slate-600'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
              }`}
            >
              {agency === 'ALL' ? 'All Agencies' : agency}
            </button>
          ))}
        </div>

        {/* Toggle Pills: EV, Sheltered, Saved */}
        <div className="flex items-center gap-2">
          {/* Only EV Available */}
          <button
            onClick={() => onFilterChange({ ...filters, onlyEvAvailable: !filters.onlyEvAvailable })}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors ${
              filters.onlyEvAvailable
                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50'
                : 'bg-slate-950/60 text-slate-400 border-slate-800 hover:text-slate-200'
            }`}
          >
            <Zap className="w-3.5 h-3.5" />
            <span>EV Charging</span>
          </button>

          {/* Sheltered */}
          <button
            onClick={() => onFilterChange({ ...filters, onlySheltered: !filters.onlySheltered })}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors ${
              filters.onlySheltered
                ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/50'
                : 'bg-slate-950/60 text-slate-400 border-slate-800 hover:text-slate-200'
            }`}
          >
            <Shield className="w-3.5 h-3.5" />
            <span>Sheltered (MSCP)</span>
          </button>

          {/* Bookmarked Filter */}
          <button
            onClick={onToggleShowOnlyBookmarked}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors ${
              showOnlyBookmarked
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/50'
                : 'bg-slate-950/60 text-slate-400 border-slate-800 hover:text-slate-200'
            }`}
          >
            <Bookmark className="w-3.5 h-3.5" />
            <span>Saved Lots ({bookmarkedCount})</span>
          </button>
        </div>
      </div>

      {/* Regional Filters Pills */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
        <span className="text-[11px] text-slate-500 mr-1 shrink-0">Region:</span>
        {REGION_LIST.map((region) => {
          const isSelected = filters.region === region;
          return (
            <button
              key={region}
              onClick={() => onFilterChange({ ...filters, region })}
              className={`px-2.5 py-1 rounded-md text-[11px] font-medium whitespace-nowrap transition-colors ${
                isSelected
                  ? 'bg-indigo-900/60 text-indigo-200 border border-indigo-500/50 font-semibold'
                  : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800/80'
              }`}
            >
              {region === 'ALL' ? 'All Island' : region.split(' ')[0]}
            </button>
          );
        })}

        {/* Counter readout */}
        <div className="ml-auto text-[11px] text-slate-400 font-mono shrink-0 pl-3">
          Showing <span className="text-white font-semibold">{filteredCount}</span> of {totalCarparksCount} carparks
        </div>
      </div>
    </div>
  );
};
