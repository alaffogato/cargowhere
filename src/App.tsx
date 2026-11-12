import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Carpark, FilterOptions, VehicleCategory, SingaporeRegion, Agency } from './types/carpark';
import { INITIAL_CARPARKS } from './data/mockCarparks';
import { simulateLotPulse, fetchLiveGovData } from './services/carparkService';
import { SingaporeMap } from './components/SingaporeMap';
import { CarparkListView } from './components/CarparkListView';
import { CarparkDetail } from './components/CarparkDetail';
import { FilterToolbar } from './components/FilterToolbar';
import { BackendGuideModal } from './components/BackendGuideModal';
import { 
  Radio, 
  Map as MapIcon, 
  ListFilter, 
  Server, 
  Sparkles, 
  Zap, 
  Pause, 
  Play, 
  RefreshCw, 
  Layers, 
  BellRing,
  Car,
  ChevronRight,
  ExternalLink
} from 'lucide-react';

const DEFAULT_FILTERS: FilterOptions = {
  searchQuery: '',
  agency: 'ALL',
  region: 'ALL',
  vehicleType: 'cars',
  onlyEvAvailable: false,
  onlySheltered: false,
  minAvailableLots: 0,
  maxHourlyRate: 0,
  statusFilter: 'ALL',
  sortBy: 'available_lots_desc'
};

export default function App() {
  const [carparks, setCarparks] = useState<Carpark[]>(INITIAL_CARPARKS);
  const [selectedCarparkId, setSelectedCarparkId] = useState<string | null>(INITIAL_CARPARKS[0].id);
  const [filters, setFilters] = useState<FilterOptions>(DEFAULT_FILTERS);
  
  // UI views: 'split' | 'map' | 'list'
  const [activeTab, setActiveTab] = useState<'split' | 'map' | 'list'>('split');
  
  // Bookmarks & Alerts persisted in state (and localStorage)
  const [bookmarkedIds, setBookmarkedIds] = useState<Set<string>>(() => {
    try {
      const saved = localStorage.getItem('sg_saved_carparks');
      return saved ? new Set(JSON.parse(saved)) : new Set(['suntec-city', 'hdb-toa-payoh-lor1']);
    } catch {
      return new Set(['suntec-city', 'hdb-toa-payoh-lor1']);
    }
  });

  const [alertIds, setAlertIds] = useState<Set<string>>(new Set(['ura-chinatown-complex']));
  const [showOnlyBookmarked, setShowOnlyBookmarked] = useState<boolean>(false);
  
  // Real-time pulse simulation
  const [isSimulating, setIsSimulating] = useState<boolean>(true);
  const [lastFeedUpdate, setLastFeedUpdate] = useState<string>('Live Stream Active');
  const [pulseCount, setPulseCount] = useState<number>(0);
  const [activeAlertToast, setActiveAlertToast] = useState<string | null>(null);

  // Backend guide modal
  const [isBackendModalOpen, setIsBackendModalOpen] = useState<boolean>(false);

  // Singapore Clock (SGT = UTC+8)
  const [sgtTime, setSgtTime] = useState<string>('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setSgtTime(
        new Intl.DateTimeFormat('en-SG', {
          timeZone: 'Asia/Singapore',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: false
        }).format(now)
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Save bookmarks to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('sg_saved_carparks', JSON.stringify(Array.from(bookmarkedIds)));
    } catch (e) {
      console.warn('Could not save to localStorage', e);
    }
  }, [bookmarkedIds]);

  // Real-time Lot Fluctuation Simulation every 8 seconds
  useEffect(() => {
    if (!isSimulating) return;

    const interval = setInterval(() => {
      setCarparks((prev) => {
        const { updated, changedId, delta } = simulateLotPulse(prev);
        setPulseCount((c) => c + 1);
        
        // Check if an alert was triggered
        const affected = updated.find((c) => c.id === changedId);
        if (affected && alertIds.has(changedId) && affected.carLots.available < 15 && delta < 0) {
          setActiveAlertToast(`Low vacancy alert: ${affected.name} is down to ${affected.carLots.available} car lots!`);
          setTimeout(() => setActiveAlertToast(null), 5000);
        }

        return updated;
      });
    }, 8000);

    return () => clearInterval(interval);
  }, [isSimulating, alertIds]);

  const handleToggleBookmark = useCallback((id: string) => {
    setBookmarkedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const handleToggleAlert = useCallback((id: string) => {
    setAlertIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
        setActiveAlertToast(`Low vacancy alert enabled for this carpark`);
        setTimeout(() => setActiveAlertToast(null), 3000);
      }
      return next;
    });
  }, []);

  // Filtered and sorted carparks
  const filteredCarparks = useMemo(() => {
    return carparks.filter((cp) => {
      // Bookmark filter
      if (showOnlyBookmarked && !bookmarkedIds.has(cp.id)) {
        return false;
      }

      // Agency filter
      if (filters.agency !== 'ALL' && cp.agency !== filters.agency) {
        return false;
      }

      // Region filter
      if (filters.region !== 'ALL' && cp.region !== filters.region) {
        return false;
      }

      // Only EV available
      if (filters.onlyEvAvailable && (!cp.evChargers || cp.evChargers.available <= 0)) {
        return false;
      }

      // Only Sheltered
      if (filters.onlySheltered && !cp.isSheltered) {
        return false;
      }

      // Search query (name, address, postal code, carpark number)
      if (filters.searchQuery.trim()) {
        const query = filters.searchQuery.toLowerCase().trim();
        const matchesName = cp.name.toLowerCase().includes(query);
        const matchesAddress = cp.address.toLowerCase().includes(query);
        const matchesPostal = cp.postalCode.includes(query);
        const matchesCode = cp.carparkNumber.toLowerCase().includes(query);
        if (!matchesName && !matchesAddress && !matchesPostal && !matchesCode) {
          return false;
        }
      }

      return true;
    }).sort((a, b) => {
      const getLots = (cp: Carpark) => {
        if (filters.vehicleType === 'motorcycles') return cp.motorcycleLots;
        if (filters.vehicleType === 'heavy') return cp.heavyLots || { total: 0, available: 0 };
        return cp.carLots;
      };

      if (filters.sortBy === 'available_lots_desc') {
        return getLots(b).available - getLots(a).available;
      }
      if (filters.sortBy === 'occupancy_asc') {
        const occA = (getLots(a).total - getLots(a).available) / (getLots(a).total || 1);
        const occB = (getLots(b).total - getLots(b).available) / (getLots(b).total || 1);
        return occA - occB;
      }
      if (filters.sortBy === 'rate_asc') {
        return a.rates.weekdayPeakRateNum - b.rates.weekdayPeakRateNum;
      }
      if (filters.sortBy === 'name_asc') {
        return a.name.localeCompare(b.name);
      }
      return 0;
    });
  }, [carparks, filters, showOnlyBookmarked, bookmarkedIds]);

  const selectedCarpark = useMemo(() => {
    return carparks.find((c) => c.id === selectedCarparkId) || null;
  }, [carparks, selectedCarparkId]);

  // Overall Statistics
  const totalAvailableLots = useMemo(() => {
    return carparks.reduce((acc, c) => acc + c.carLots.available, 0);
  }, [carparks]);

  const totalEvAvailable = useMemo(() => {
    return carparks.reduce((acc, c) => acc + (c.evChargers?.available || 0), 0);
  }, [carparks]);

  const handleLiveGovDataLoaded = (dataMap: Map<string, { total: number; available: number }>, timestamp: string) => {
    setCarparks((prev) => {
      return prev.map((cp) => {
        const liveInfo = dataMap.get(cp.carparkNumber.toUpperCase());
        if (liveInfo && liveInfo.total > 0) {
          return {
            ...cp,
            carLots: {
              total: liveInfo.total,
              available: liveInfo.available
            },
            lastUpdated: 'Live from Data.gov.sg'
          };
        }
        return cp;
      });
    });
    setLastFeedUpdate(`Synced Data.gov.sg (${new Date(timestamp).toLocaleTimeString()})`);
  };

  return (
    <div className="min-h-screen bg-[#090d16] text-slate-100 flex flex-col font-sans selection:bg-indigo-500/30">
      {/* 
        TOP BAR CONTRACT:
        Zone 1: Single text wordmark [SG Carpark Live]
        Zone 2: 4 single-line nav links with hover underlines
        Zone 3: 1 primary action button
      */}
      <header className="flex items-center justify-between gap-8 px-6 py-3.5 bg-slate-950/90 border-b border-slate-800/80 backdrop-blur-md sticky top-0 z-40">
        {/* Zone 1: Brand Wordmark */}
        <div className="flex items-center gap-2 shrink-0">
          <a href="/" className="text-base font-extrabold tracking-tight text-white whitespace-nowrap shrink-0 flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
            <span>SG Carpark Live</span>
          </a>
        </div>

        {/* Zone 2: Nav Links */}
        <nav className="hidden md:flex items-center gap-7 text-xs font-medium text-slate-400">
          <button
            onClick={() => { setActiveTab('split'); setShowOnlyBookmarked(false); }}
            className={`transition-colors whitespace-nowrap shrink-0 hover:text-white ${
              activeTab === 'split' && !showOnlyBookmarked ? 'text-indigo-400 font-semibold underline underline-offset-8' : ''
            }`}
          >
            Spatial Map
          </button>
          <button
            onClick={() => { setActiveTab('list'); setShowOnlyBookmarked(false); }}
            className={`transition-colors whitespace-nowrap shrink-0 hover:text-white ${
              activeTab === 'list' && !showOnlyBookmarked ? 'text-indigo-400 font-semibold underline underline-offset-8' : ''
            }`}
          >
            All Carparks
          </button>
          <button
            onClick={() => {
              setFilters((f) => ({ ...f, onlyEvAvailable: true }));
              setShowOnlyBookmarked(false);
            }}
            className={`transition-colors whitespace-nowrap shrink-0 hover:text-white ${
              filters.onlyEvAvailable ? 'text-indigo-400 font-semibold underline underline-offset-8' : ''
            }`}
          >
            EV Charging
          </button>
          <button
            onClick={() => setShowOnlyBookmarked(true)}
            className={`transition-colors whitespace-nowrap shrink-0 hover:text-white ${
              showOnlyBookmarked ? 'text-indigo-400 font-semibold underline underline-offset-8' : ''
            }`}
          >
            My Saved Lots ({bookmarkedIds.size})
          </button>
        </nav>

        {/* Zone 3: 1 Primary Action */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={() => setIsBackendModalOpen(true)}
            className="flex items-center gap-2 px-3.5 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg shadow-sm transition-colors whitespace-nowrap shrink-0"
          >
            <Server className="w-3.5 h-3.5" />
            <span>Backend API</span>
          </button>
        </div>
      </header>

      {/* Subheader / Real-time Status Ribbon */}
      <div className="bg-slate-950 border-b border-slate-800/70 px-6 py-2 flex flex-wrap items-center justify-between gap-3 text-xs">
        {/* Left: Stream Status & Pulse indicator */}
        <div className="flex items-center gap-3 text-slate-400">
          <div className="flex items-center gap-1.5">
            <Radio className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
            <span className="text-slate-200 font-medium">{lastFeedUpdate}</span>
          </div>
          <span className="text-slate-700">·</span>
          <div className="font-mono text-slate-400 text-[11px]">
            SGT: <span className="text-white font-medium">{sgtTime || '12:00:00'}</span> (UTC+8)
          </div>
          <span className="text-slate-700">·</span>
          <button
            onClick={() => setIsSimulating(!isSimulating)}
            className="flex items-center gap-1 text-[11px] hover:text-slate-200 transition-colors text-slate-400"
          >
            {isSimulating ? <Pause className="w-3 h-3 text-amber-400" /> : <Play className="w-3 h-3 text-emerald-400" />}
            <span>{isSimulating ? 'Pause Live Pulse' : 'Resume Pulse'}</span>
          </button>
        </div>

        {/* Right: Aggregate Island Stats */}
        <div className="flex items-center gap-4 text-[11px] font-mono text-slate-400">
          <div>
            Car Lots: <span className="text-emerald-400 font-bold">{totalAvailableLots.toLocaleString()} free</span>
          </div>
          <span className="text-slate-700">·</span>
          <div className="flex items-center gap-1 text-emerald-400">
            <Zap className="w-3 h-3" />
            <span>{totalEvAvailable} EV bays free</span>
          </div>
        </div>
      </div>

      {/* Toast Alert Banner */}
      {activeAlertToast && (
        <div className="bg-amber-950/80 border-b border-amber-500/50 px-6 py-2.5 flex items-center justify-between text-xs text-amber-200 animate-in fade-in duration-200">
          <div className="flex items-center gap-2">
            <BellRing className="w-4 h-4 text-amber-400 animate-bounce" />
            <span className="font-medium">{activeAlertToast}</span>
          </div>
          <button
            onClick={() => setActiveAlertToast(null)}
            className="text-amber-400 hover:text-white text-xs font-mono"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Main Workspace */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 space-y-5">
        {/* Workspace Toolbar & View Switcher */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold text-white tracking-tight">
              Singapore Carpark Availability & Rates
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
              Real-time lot counts for HDB, URA, and Shopping Malls across Singapore.
            </p>
          </div>

          {/* View Mode Toggle */}
          <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800 self-start sm:self-auto">
            <button
              onClick={() => setActiveTab('split')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                activeTab === 'split' ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Split View</span>
            </button>
            <button
              onClick={() => setActiveTab('map')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                activeTab === 'map' ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <MapIcon className="w-3.5 h-3.5" />
              <span>Map Focus</span>
            </button>
            <button
              onClick={() => setActiveTab('list')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                activeTab === 'list' ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <ListFilter className="w-3.5 h-3.5" />
              <span>List Only</span>
            </button>
          </div>
        </div>

        {/* Filter & Search Toolbar */}
        <FilterToolbar
          filters={filters}
          onFilterChange={setFilters}
          onResetFilters={() => {
            setFilters(DEFAULT_FILTERS);
            setShowOnlyBookmarked(false);
          }}
          showOnlyBookmarked={showOnlyBookmarked}
          onToggleShowOnlyBookmarked={() => setShowOnlyBookmarked(!showOnlyBookmarked)}
          bookmarkedCount={bookmarkedIds.size}
          totalCarparksCount={carparks.length}
          filteredCount={filteredCarparks.length}
        />

        {/* Split / Map / List Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          {/* Main Visual Column (Map or List depending on view) */}
          <div className={`${selectedCarpark ? 'lg:col-span-7' : 'lg:col-span-12'} space-y-5`}>
            {/* Map Section (Shown in split and map views) */}
            {(activeTab === 'split' || activeTab === 'map') && (
              <SingaporeMap
                carparks={filteredCarparks}
                selectedCarpark={selectedCarpark}
                onSelectCarpark={(cp) => setSelectedCarparkId(cp.id)}
                vehicleType={filters.vehicleType}
              />
            )}

            {/* List Section (Shown in split and list views) */}
            {(activeTab === 'split' || activeTab === 'list') && (
              <div>
                <div className="flex items-center justify-between mb-3 px-1">
                  <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    {showOnlyBookmarked ? 'Saved Favorite Lots' : 'Carpark Directory'} ({filteredCarparks.length})
                  </h2>
                  <span className="text-[11px] text-slate-500 font-mono">
                    Click any carpark for live rate calculator
                  </span>
                </div>
                <CarparkListView
                  carparks={filteredCarparks}
                  selectedCarpark={selectedCarpark}
                  onSelectCarpark={(cp) => setSelectedCarparkId(cp.id)}
                  bookmarkedIds={bookmarkedIds}
                  onToggleBookmark={handleToggleBookmark}
                  vehicleType={filters.vehicleType}
                  onResetFilters={() => {
                    setFilters(DEFAULT_FILTERS);
                    setShowOnlyBookmarked(false);
                  }}
                />
              </div>
            )}
          </div>

          {/* Right Column: Carpark Detail Drawer / Panel */}
          {selectedCarpark && (
            <div className="lg:col-span-5 sticky top-20">
              <CarparkDetail
                carpark={selectedCarpark}
                onClose={() => setSelectedCarparkId(null)}
                isBookmarked={bookmarkedIds.has(selectedCarpark.id)}
                onToggleBookmark={handleToggleBookmark}
                isAlertSet={alertIds.has(selectedCarpark.id)}
                onToggleAlert={handleToggleAlert}
                vehicleType={filters.vehicleType}
              />
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="mt-auto border-t border-slate-900 bg-slate-950/80 px-6 py-6 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-400">SG Carpark Live</span>
            <span>·</span>
            <span>Real-time Electronic Parking System (EPS) & Availability Tracker</span>
          </div>
          <div className="flex items-center gap-4 text-[11px]">
            <span>Compatible with Data.gov.sg & LTA DataMall v2 APIs</span>
            <span>·</span>
            <button
              onClick={() => setIsBackendModalOpen(true)}
              className="text-indigo-400 hover:text-indigo-300 underline"
            >
              Developer Integration Specs
            </button>
          </div>
        </div>
      </footer>

      {/* Backend Integration Modal */}
      <BackendGuideModal
        isOpen={isBackendModalOpen}
        onClose={() => setIsBackendModalOpen(false)}
        onLiveGovDataLoaded={handleLiveGovDataLoaded}
      />
    </div>
  );
}
