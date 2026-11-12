import React from 'react';
import { Carpark, VehicleCategory } from '../types/carpark';
import { getAvailabilityStatus } from '../services/carparkService';
import { 
  Car, 
  Zap, 
  MapPin, 
  Bookmark, 
  BookmarkCheck, 
  TrendingUp, 
  TrendingDown, 
  Minus,
  ChevronRight,
  Shield,
  Clock
} from 'lucide-react';

interface CarparkListViewProps {
  carparks: Carpark[];
  selectedCarpark: Carpark | null;
  onSelectCarpark: (carpark: Carpark) => void;
  bookmarkedIds: Set<string>;
  onToggleBookmark: (id: string) => void;
  vehicleType: VehicleCategory;
  onResetFilters: () => void;
}

export const CarparkListView: React.FC<CarparkListViewProps> = ({
  carparks,
  selectedCarpark,
  onSelectCarpark,
  bookmarkedIds,
  onToggleBookmark,
  vehicleType,
  onResetFilters
}) => {
  const getLotsForCategory = (cp: Carpark) => {
    if (vehicleType === 'motorcycles') return cp.motorcycleLots;
    if (vehicleType === 'heavy') return cp.heavyLots || { total: 0, available: 0 };
    return cp.carLots;
  };

  if (carparks.length === 0) {
    return (
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-10 text-center flex flex-col items-center justify-center">
        <Car className="w-12 h-12 text-slate-600 mb-3" />
        <h3 className="text-base font-semibold text-slate-200 mb-1">No carparks match your filter criteria</h3>
        <p className="text-xs text-slate-400 max-w-sm mb-4">
          Try adjusting your search query, agency filter, or minimum lot requirements.
        </p>
        <button
          onClick={onResetFilters}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg transition-colors"
        >
          Reset All Filters
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-2.5">
      {carparks.map((cp) => {
        const lots = getLotsForCategory(cp);
        const statusInfo = getAvailabilityStatus(lots.available, lots.total);
        const isSelected = selectedCarpark?.id === cp.id;
        const isBookmarked = bookmarkedIds.has(cp.id);
        const occupancyPct = lots.total > 0 ? Math.round(((lots.total - lots.available) / lots.total) * 100) : 0;

        return (
          <div
            key={cp.id}
            onClick={() => onSelectCarpark(cp)}
            className={`group relative bg-slate-900/80 hover:bg-slate-850 border rounded-xl p-3.5 transition-all duration-150 cursor-pointer shadow-sm ${
              isSelected
                ? 'border-indigo-500 ring-1 ring-indigo-500/50 bg-slate-850'
                : 'border-slate-800/90 hover:border-slate-700'
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              {/* Left Column: Details */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  {/* Agency Tag */}
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700 font-semibold">
                    {cp.carparkNumber}
                  </span>
                  <span className="text-xs text-slate-400">
                    {cp.agency}
                  </span>
                  <span className="text-slate-600 text-xs">·</span>
                  <span className="text-xs text-slate-400 truncate">
                    {cp.structureType}
                  </span>
                  {cp.isCentralArea && (
                    <span className="text-[10px] text-amber-300 font-medium px-1.5 py-0.5 rounded bg-amber-500/10 border border-amber-500/20">
                      CBD
                    </span>
                  )}
                </div>

                <h3 className="text-sm font-bold text-white group-hover:text-indigo-300 transition-colors truncate">
                  {cp.name}
                </h3>

                <div className="flex items-center gap-2 text-xs text-slate-400 mt-1">
                  <span className="truncate">{cp.address}</span>
                  <span className="text-slate-600">·</span>
                  <span className="font-mono text-slate-500">{cp.postalCode}</span>
                </div>

                {/* Key Features row */}
                <div className="flex flex-wrap items-center gap-2 mt-2.5 text-[11px]">
                  <span className="text-slate-300 font-mono bg-slate-950/60 px-2 py-0.5 rounded border border-slate-800">
                    {cp.rates.weekdayPeak}
                  </span>

                  {cp.evChargers && cp.evChargers.available > 0 && (
                    <span className="flex items-center gap-1 text-emerald-400 font-mono bg-emerald-950/30 px-2 py-0.5 rounded border border-emerald-500/20">
                      <Zap className="w-3 h-3" />
                      <span>{cp.evChargers.available} EV bays</span>
                    </span>
                  )}

                  <span className="text-slate-500 text-[10px]">
                    Grace: {cp.rates.gracePeriodMins}m
                  </span>
                </div>
              </div>

              {/* Right Column: Availability Gauge & Bookmark */}
              <div className="flex flex-col items-end shrink-0 pl-2">
                <div className="flex items-center gap-1 mb-1">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleBookmark(cp.id);
                    }}
                    title={isBookmarked ? 'Remove Bookmark' : 'Bookmark Carpark'}
                    className={`p-1.5 rounded-lg transition-colors ${
                      isBookmarked
                        ? 'text-emerald-400 bg-emerald-500/10'
                        : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    {isBookmarked ? <BookmarkCheck className="w-4 h-4" /> : <Bookmark className="w-4 h-4" />}
                  </button>
                  <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-slate-300 group-hover:translate-x-0.5 transition-transform" />
                </div>

                {/* Big Lot Count Number */}
                <div className="text-right">
                  <div className="flex items-baseline justify-end gap-1">
                    <span className={`text-2xl font-bold font-mono tabular-nums ${statusInfo.colorClass}`}>
                      {lots.available}
                    </span>
                    <span className="text-xs text-slate-500 font-mono">
                      / {lots.total}
                    </span>
                  </div>
                  <div className="text-[11px] font-medium text-slate-400">
                    {statusInfo.label}
                  </div>
                </div>

                {/* Trend indicator */}
                <div className="mt-1.5 flex items-center gap-1 text-[10px] text-slate-400 font-mono">
                  {cp.trend === 'filling' ? (
                    <span className="flex items-center gap-0.5 text-rose-400">
                      <TrendingUp className="w-3 h-3" /> Filling
                    </span>
                  ) : cp.trend === 'emptying' ? (
                    <span className="flex items-center gap-0.5 text-emerald-400">
                      <TrendingDown className="w-3 h-3" /> Emptying
                    </span>
                  ) : (
                    <span className="text-slate-500">
                      Stable
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Subtle bottom progress bar */}
            <div className="w-full bg-slate-800/80 h-1 rounded-full overflow-hidden mt-3">
              <div 
                className={`h-full transition-all duration-300 ${
                  occupancyPct > 90 ? 'bg-rose-500' : occupancyPct > 70 ? 'bg-amber-500' : 'bg-emerald-500'
                }`}
                style={{ width: `${occupancyPct}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
};
