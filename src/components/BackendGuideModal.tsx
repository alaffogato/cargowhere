import React, { useState } from 'react';
import { X, Code2, Copy, Check, Server, ExternalLink, Zap, Terminal } from 'lucide-react';
import { fetchLiveGovData } from '../services/carparkService';

interface BackendGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLiveGovDataLoaded?: (dataMap: Map<string, { total: number; available: number }>, timestamp: string) => void;
}

export const BackendGuideModal: React.FC<BackendGuideModalProps> = ({
  isOpen,
  onClose,
  onLiveGovDataLoaded
}) => {
  const [copiedSection, setCopiedSection] = useState<string | null>(null);
  const [testStatus, setTestStatus] = useState<{ loading: boolean; result?: string; success?: boolean }>({
    loading: false
  });

  if (!isOpen) return null;

  const copyToClipboard = (text: string, sectionId: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSection(sectionId);
    setTimeout(() => setCopiedSection(null), 2000);
  };

  const handleTestGovFetch = async () => {
    setTestStatus({ loading: true });
    const res = await fetchLiveGovData();
    if (res.success && res.data) {
      setTestStatus({
        loading: false,
        success: true,
        result: `Successfully fetched live snapshot at ${res.timestamp || 'now'} with ${res.data.size} active HDB carparks across Singapore!`
      });
      if (onLiveGovDataLoaded && res.timestamp) {
        onLiveGovDataLoaded(res.data, res.timestamp);
      }
    } else {
      setTestStatus({
        loading: false,
        success: false,
        result: `Data.gov.sg direct browser fetch note: ${res.error || 'CORS / Network restriction'}. A server-side proxy route (/api/carparks) resolves this.`
      });
    }
  };

  const expressProxyCode = `// server.ts - Real-Time Singapore Carpark Proxy Route
import express from 'express';
import axios from 'axios';

const app = express();
const PORT = process.env.PORT || 3000;

// 1. Data.gov.sg Carpark Availability Endpoint (HDB)
app.get('/api/carparks/hdb-live', async (req, res) => {
  try {
    const response = await axios.get(
      'https://api.data.gov.sg/v1/transport/car-park-availability'
    );
    res.json(response.data);
  } catch (error: any) {
    res.status(502).json({ error: 'Failed to fetch Data.gov.sg feed' });
  }
});

// 2. LTA DataMall CarPark Availability v2 Endpoint (URA + Malls + LTA)
app.get('/api/carparks/lta-live', async (req, res) => {
  try {
    const response = await axios.get(
      'http://datamall2.mytransport.sg/ltaodataservice/CarParkAvailabilityv2',
      {
        headers: {
          'AccountKey': process.env.LTA_DATAMALL_API_KEY || ''
        }
      }
    );
    res.json(response.data);
  } catch (error: any) {
    res.status(502).json({ error: 'Failed to fetch LTA DataMall feed' });
  }
});

app.listen(PORT, () => {
  console.log(\`Singapore Carpark Backend API listening on port \${PORT}\`);
});`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-3xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/80">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-indigo-600/20 text-indigo-400 rounded-lg border border-indigo-500/30">
              <Server className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white">Backend Integration Architecture Guide</h2>
              <p className="text-xs text-slate-400">Singapore Government & LTA DataMall Real-Time Specs</p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close backend guide modal"
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 overflow-y-auto space-y-6 text-xs text-slate-300">
          {/* Live Browser Test Action */}
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <div className="font-semibold text-white flex items-center gap-1.5">
                <Zap className="w-4 h-4 text-emerald-400" /> Test Live Data.gov.sg Connection
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Pulls live lot counts directly into your current session.
              </p>
            </div>
            <button
              onClick={handleTestGovFetch}
              disabled={testStatus.loading}
              className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-lg font-medium text-xs whitespace-nowrap shadow transition-colors"
            >
              {testStatus.loading ? 'Pinging Data.gov.sg...' : 'Fetch Live Gov Data Now'}
            </button>
          </div>

          {testStatus.result && (
            <div
              className={`p-3 rounded-lg border text-xs font-mono ${
                testStatus.success
                  ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-300'
                  : 'bg-amber-950/30 border-amber-500/40 text-amber-300'
              }`}
            >
              {testStatus.result}
            </div>
          )}

          {/* Official API Specs */}
          <div>
            <h3 className="text-xs font-bold text-slate-100 uppercase tracking-wider mb-2 flex items-center gap-2">
              <Terminal className="w-4 h-4 text-indigo-400" /> 1. Singapore Government Real-Time APIs
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800">
                <div className="font-semibold text-white mb-1">Data.gov.sg Carpark Feed</div>
                <div className="text-[11px] text-slate-400 mb-2">
                  Provides minute-by-minute live lot availability for all 2,000+ HDB multi-storey and surface carparks across Singapore.
                </div>
                <div className="bg-slate-900 p-2 rounded text-[10px] font-mono text-indigo-300 break-all select-all border border-slate-800">
                  GET https://api.data.gov.sg/v1/transport/car-park-availability
                </div>
              </div>

              <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800">
                <div className="font-semibold text-white mb-1">LTA DataMall v2 CarPark Availability</div>
                <div className="text-[11px] text-slate-400 mb-2">
                  Provides live lot availability for shopping malls (Suntec, Orchard, VivoCity) and URA commercial carparks.
                </div>
                <div className="bg-slate-900 p-2 rounded text-[10px] font-mono text-indigo-300 break-all select-all border border-slate-800">
                  GET http://datamall2.mytransport.sg/ltaodataservice/CarParkAvailabilityv2
                </div>
              </div>
            </div>
          </div>

          {/* Code Snippet */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-bold text-slate-100 uppercase tracking-wider flex items-center gap-2">
                <Code2 className="w-4 h-4 text-indigo-400" /> 2. Server Proxy Route (Drop into server.ts)
              </h3>
              <button
                onClick={() => copyToClipboard(expressProxyCode, 'code')}
                className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded text-[11px] border border-slate-700 transition-colors"
              >
                {copiedSection === 'code' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedSection === 'code' ? 'Copied!' : 'Copy Snippet'}</span>
              </button>
            </div>
            <pre className="bg-slate-950 p-4 rounded-xl border border-slate-800 overflow-x-auto text-[11px] font-mono text-slate-300 leading-relaxed">
              {expressProxyCode}
            </pre>
          </div>

          {/* Frontend Hand-off Note */}
          <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 text-[11px] text-slate-400 space-y-1">
            <span className="font-semibold text-slate-200 block">Frontend State Hook:</span>
            <p>
              The frontend is fully wired to consume data through <code className="text-indigo-400">src/services/carparkService.ts</code>.
              When your backend endpoints are live, point the fetch helper to <code className="text-indigo-400">/api/carparks/hdb-live</code> and <code className="text-indigo-400">/api/carparks/lta-live</code>.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/80 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
