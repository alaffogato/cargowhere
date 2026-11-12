import React, { useState } from 'react';
import { X, Code2, Copy, Check, Server, ExternalLink, Zap, Terminal, Activity, Key } from 'lucide-react';

interface BackendGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLiveGovDataLoaded?: (dataMap: Map<string, { total: number; available: number }>, timestamp: string) => void;
}

export const BackendGuideModal: React.FC<BackendGuideModalProps> = ({
  isOpen,
  onClose
}) => {
  const [copiedSection, setCopiedSection] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<{
    endpoint: string;
    loading: boolean;
    success?: boolean;
    statusCode?: number;
    data?: any;
    error?: string;
  } | null>(null);

  if (!isOpen) return null;

  const copyToClipboard = (text: string, sectionId: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSection(sectionId);
    setTimeout(() => setCopiedSection(null), 2000);
  };

  const handleTestEndpoint = async (endpoint: '/api/health' | '/api/carparkavailability') => {
    setTestResult({ endpoint, loading: true });
    try {
      const response = await fetch(endpoint);
      const json = await response.json();
      setTestResult({
        endpoint,
        loading: false,
        success: response.ok,
        statusCode: response.status,
        data: json
      });
    } catch (err: unknown) {
      setTestResult({
        endpoint,
        loading: false,
        success: false,
        error: err instanceof Error ? err.message : 'Network request failed'
      });
    }
  };

  const serverlessSnippet = `// /api/carparkavailability.ts
// Direct serverless connection pulling live data from LTA DataMall
// Endpoint: https://datamall2.mytransport.sg/ltaodataservice/CarParkAvailabilityv2
// Header: AccountKey: process.env.LTA_ACCOUNT_KEY

export default async function handler(req, res) {
  const accountKey = process.env.LTA_ACCOUNT_KEY;
  if (!accountKey) {
    return res.status(401).json({ error: 'Missing LTA_ACCOUNT_KEY' });
  }

  const response = await fetch(
    'https://datamall2.mytransport.sg/ltaodataservice/CarParkAvailabilityv2',
    {
      headers: {
        'AccountKey': accountKey,
        'accept': 'application/json'
      }
    }
  );

  const data = await response.json();
  res.setHeader('Cache-Control', 'public, max-age=30, s-maxage=60');
  res.status(200).json(data);
}`;

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
              <h2 className="text-sm font-bold text-white">LTA DataMall Serverless API Suite</h2>
              <p className="text-xs text-slate-400">Stored in /api folder at project root level</p>
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
        <div className="p-5 overflow-y-auto space-y-5 text-xs text-slate-300">
          {/* Quick Endpoint Tester Buttons */}
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <div className="font-semibold text-white flex items-center gap-1.5">
                <Activity className="w-4 h-4 text-emerald-400" /> Live Local Endpoints
              </div>
              <span className="text-[11px] font-mono text-slate-400">Server listening on :3000</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <button
                onClick={() => handleTestEndpoint('/api/health')}
                disabled={testResult?.loading}
                className="flex items-center justify-between p-2.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-left transition-colors"
              >
                <div>
                  <span className="font-mono text-xs font-semibold text-indigo-300 block">GET /api/health</span>
                  <span className="text-[11px] text-slate-400">System health & key configuration check</span>
                </div>
                <Zap className="w-4 h-4 text-indigo-400 shrink-0" />
              </button>

              <button
                onClick={() => handleTestEndpoint('/api/carparkavailability')}
                disabled={testResult?.loading}
                className="flex items-center justify-between p-2.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-left transition-colors"
              >
                <div>
                  <span className="font-mono text-xs font-semibold text-emerald-300 block">GET /api/carparkavailability</span>
                  <span className="text-[11px] text-slate-400">LTA DataMall CarParkAvailabilityv2</span>
                </div>
                <Zap className="w-4 h-4 text-emerald-400 shrink-0" />
              </button>
            </div>

            {testResult && (
              <div className="mt-3 p-3 rounded-lg bg-slate-900/90 border border-slate-800">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-mono text-[11px] text-slate-300">
                    Endpoint: <strong className="text-white">{testResult.endpoint}</strong>
                  </span>
                  {testResult.statusCode && (
                    <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                      testResult.statusCode === 200 ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                    }`}>
                      HTTP {testResult.statusCode}
                    </span>
                  )}
                </div>
                {testResult.loading ? (
                  <div className="text-[11px] text-slate-400 py-2">Executing request...</div>
                ) : (
                  <pre className="text-[10.5px] font-mono text-slate-300 bg-slate-950 p-2.5 rounded border border-slate-800/80 max-h-40 overflow-y-auto whitespace-pre-wrap">
                    {JSON.stringify(testResult.data || testResult.error, null, 2)}
                  </pre>
                )}
              </div>
            )}
          </div>

          {/* Installed Serverless Files Overview */}
          <div className="space-y-2">
            <h3 className="text-xs font-bold text-slate-100 uppercase tracking-wider flex items-center gap-2">
              <Terminal className="w-4 h-4 text-indigo-400" /> Files in /api folder
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-mono font-bold text-white text-xs">/api/health.ts</span>
                  <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">READY</span>
                </div>
                <p className="text-[11px] text-slate-400">
                  Returns service status, uptime, and whether <code className="text-indigo-300">LTA_ACCOUNT_KEY</code> is configured in the environment.
                </p>
              </div>

              <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-mono font-bold text-white text-xs">/api/carparkavailability.ts</span>
                  <span className="text-[10px] font-mono text-indigo-400 bg-indigo-500/10 px-1.5 py-0.5 rounded border border-indigo-500/20">SERVERLESS</span>
                </div>
                <p className="text-[11px] text-slate-400">
                  Connects to <code className="text-indigo-300">CarParkAvailabilityv2</code> with <code className="text-indigo-300">AccountKey</code> header. Includes pagination, caching, and CORS.
                </p>
              </div>
            </div>
          </div>

          {/* Environment Variable Setup Instructions */}
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <div className="font-semibold text-white flex items-center gap-1.5">
                <Key className="w-4 h-4 text-amber-400" /> Environment Variable (No Key Hardcoded)
              </div>
              <button
                onClick={() => copyToClipboard('LTA_ACCOUNT_KEY="YOUR_KEY_HERE"', 'env')}
                className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-white"
              >
                {copiedSection === 'env' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedSection === 'env' ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
            <p className="text-[11px] text-slate-400">
              When ready, add your key to your local <code className="text-slate-200">.env</code> file or deployment secrets:
            </p>
            <div className="bg-slate-900 p-2.5 rounded font-mono text-xs text-amber-300 border border-slate-800 select-all">
              LTA_ACCOUNT_KEY="YOUR_LTA_DATAMALL_KEY"
            </div>
            <p className="text-[10.5px] text-slate-500">
              Request a free key at: <a href="https://datamall.lta.gov.sg/content/datamall/en/request-api.html" target="_blank" rel="noopener noreferrer" className="text-indigo-400 hover:underline">datamall.lta.gov.sg</a>
            </p>
          </div>

          {/* Serverless Implementation Snippet */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <h3 className="text-xs font-bold text-slate-100 uppercase tracking-wider flex items-center gap-2">
                <Code2 className="w-4 h-4 text-indigo-400" /> Implementation Source
              </h3>
              <button
                onClick={() => copyToClipboard(serverlessSnippet, 'snippet')}
                className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded text-[11px] border border-slate-700 transition-colors"
              >
                {copiedSection === 'snippet' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedSection === 'snippet' ? 'Copied!' : 'Copy Code'}</span>
              </button>
            </div>
            <pre className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 overflow-x-auto text-[11px] font-mono text-slate-300 leading-relaxed">
              {serverlessSnippet}
            </pre>
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
