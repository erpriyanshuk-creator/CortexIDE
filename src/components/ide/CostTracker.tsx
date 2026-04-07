'use client';

import React, { useState, useEffect } from 'react';
import {
  DollarSign,
  TrendingUp,
  Zap,
  Clock,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  BarChart3,
} from 'lucide-react';
import { useCostTrackerStore } from '@/stores/use-cost-tracker-store';
import { cn } from '@/lib/utils';
import { DEFAULT_PROVIDER_CONFIGS } from '@/lib/ai/providers';

export function CostTracker() {
  const {
    entries,
    getTotalCost,
    getCostByModel,
    getCostByProvider,
    getTotalTokens,
    getDailyCosts,
    sessionStartTime,
    isOverBudget,
    budgetLimit,
    setBudgetLimit,
    clearSession,
  } = useCostTrackerStore();

  const [expanded, setExpanded] = useState(false);
  const [showBudgetInput, setShowBudgetInput] = useState(false);
  const [budgetInput, setBudgetInput] = useState('');
  const [costData, setCostData] = useState<{ summary: Record<string, unknown>; daily: Array<{ date: string; cost: number }>; byModel: Record<string, { cost: number; requests: number }> } | null>(null);

  const totalCost = getTotalCost();
  const costByModel = getCostByModel();
  const costByProvider = getCostByProvider();
  const tokens = getTotalTokens();
  const dailyCosts = getDailyCosts();
  const sessionDuration = Date.now() - sessionStartTime;
  const overBudget = isOverBudget();
  const budgetPercent = budgetLimit ? (totalCost / budgetLimit) * 100 : 0;

  // Fetch cost data from API
  useEffect(() => {
    fetch('/api/ai/cost')
      .then(res => res.json())
      .then(data => setCostData(data))
      .catch(() => {});
  }, [entries.length]);

  return (
    <div className="p-3 space-y-3">
      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-2">
        <div className="bg-[#1e1e2e] border border-[#313244] rounded-lg p-3">
          <div className="flex items-center gap-1.5 text-[#6c7086] mb-1">
            <DollarSign className="w-3 h-3" />
            <span className="text-[10px] uppercase tracking-wider">Total Cost</span>
          </div>
          <div className={cn('text-lg font-semibold', overBudget ? 'text-[#f38ba8]' : 'text-[#a6e3a1]')}>
            ${totalCost.toFixed(4)}
          </div>
          {budgetLimit && (
            <div className="mt-1">
              <div className="h-1 bg-[#313244] rounded-full overflow-hidden">
                <div
                  className={cn('h-full rounded-full transition-all', overBudget ? 'bg-[#f38ba8]' : budgetPercent > 80 ? 'bg-[#f9e2af]' : 'bg-[#a6e3a1]')}
                  style={{ width: `${Math.min(budgetPercent, 100)}%` }}
                />
              </div>
              <span className="text-[9px] text-[#6c7086]">${budgetLimit} budget</span>
            </div>
          )}
        </div>
        <div className="bg-[#1e1e2e] border border-[#313244] rounded-lg p-3">
          <div className="flex items-center gap-1.5 text-[#6c7086] mb-1">
            <Zap className="w-3 h-3" />
            <span className="text-[10px] uppercase tracking-wider">Tokens</span>
          </div>
          <div className="text-lg font-semibold text-[#89b4fa]">
            {((tokens.input + tokens.output) / 1000).toFixed(1)}k
          </div>
          <span className="text-[9px] text-[#6c7086]">{tokens.input.toLocaleString()} in / {tokens.output.toLocaleString()} out</span>
        </div>
      </div>

      {/* Budget alert */}
      {overBudget && (
        <div className="bg-[#f38ba8]/10 border border-[#f38ba8]/30 rounded-lg p-2 flex items-center gap-2">
          <AlertTriangle className="w-3.5 h-3.5 text-[#f38ba8] flex-shrink-0" />
          <span className="text-[10px] text-[#f38ba8]">Budget exceeded! ${totalCost.toFixed(4)} of ${budgetLimit}</span>
        </div>
      )}

      {/* Mini spending chart (last 7 days) */}
      {dailyCosts.length > 0 && (
        <div className="bg-[#1e1e2e] border border-[#313244] rounded-lg p-3 space-y-2">
          <div className="flex items-center justify-between">
            <div className="text-xs text-[#6c7086] uppercase tracking-wider">Daily Spending</div>
            <BarChart3 className="w-3 h-3 text-[#6c7086]" />
          </div>
          <div className="flex items-end gap-1 h-12">
            {dailyCosts.slice(-7).map((d, i) => {
              const maxCost = Math.max(...dailyCosts.slice(-7).map(dd => dd.cost), 0.01);
              const height = Math.max((d.cost / maxCost) * 100, 4);
              return (
                <div key={d.date} className="flex-1 flex flex-col items-center gap-0.5">
                  <div className="w-full bg-[#89b4fa]/60 rounded-sm transition-all hover:bg-[#89b4fa]" style={{ height: `${height}%`, minHeight: '2px' }} title={`${d.date}: $${d.cost.toFixed(4)}`} />
                  <span className="text-[8px] text-[#6c7086]">{d.date.slice(-2)}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Token breakdown */}
      <div className="bg-[#1e1e2e] border border-[#313244] rounded-lg p-3 space-y-2">
        <div className="text-xs text-[#6c7086] uppercase tracking-wider">Token Usage</div>
        <div className="flex justify-between text-sm">
          <span className="text-[#a6adc8]">Input</span>
          <span className="text-[#cdd6f4] font-mono">{tokens.input.toLocaleString()}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-[#a6adc8]">Output</span>
          <span className="text-[#cdd6f4] font-mono">{tokens.output.toLocaleString()}</span>
        </div>
        <div className="h-2 bg-[#313244] rounded-full overflow-hidden flex">
          {tokens.input + tokens.output > 0 && (
            <>
              <div className="h-full bg-[#89b4fa] transition-all" style={{ width: `${(tokens.input / (tokens.input + tokens.output)) * 100}%` }} />
              <div className="h-full bg-[#cba6f7] transition-all" style={{ width: `${(tokens.output / (tokens.input + tokens.output)) * 100}%` }} />
            </>
          )}
        </div>
        <div className="flex justify-between text-[10px] text-[#6c7086]">
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#89b4fa]" /> Input</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#cba6f7]" /> Output</span>
        </div>
      </div>

      {/* Cost by model */}
      {Object.keys(costByModel).length > 0 && (
        <div className="bg-[#1e1e2e] border border-[#313244] rounded-lg p-3 space-y-2">
          <button onClick={() => setExpanded(!expanded)} className="flex items-center justify-between w-full text-xs text-[#6c7086] uppercase tracking-wider">
            <span>Cost by Model</span>
            {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>
          {expanded && Object.entries(costByModel).map(([model, cost]) => {
            const providerConfig = DEFAULT_PROVIDER_CONFIGS.find(p => p.models.some(m => m.id === model));
            return (
              <div key={model} className="flex justify-between items-center text-sm">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs">{providerConfig ? getProviderIcon(providerConfig.type) : '⚙️'}</span>
                  <span className="text-[#a6adc8] text-xs">{model}</span>
                </div>
                <span className="text-[#f9e2af] font-mono text-xs">${cost.toFixed(4)}</span>
              </div>
            );
          })}
        </div>
      )}

      {/* Budget setting */}
      <div className="bg-[#1e1e2e] border border-[#313244] rounded-lg p-3 space-y-2">
        {showBudgetInput ? (
          <div className="flex items-center gap-2">
            <span className="text-xs text-[#a6adc8]">$</span>
            <input
              type="number"
              value={budgetInput}
              onChange={(e) => setBudgetInput(e.target.value)}
              placeholder="Budget limit"
              className="flex-1 bg-[#181825] border border-[#313244] rounded px-2 py-1 text-xs text-[#cdd6f4] focus:outline-none focus:border-[#89b4fa]"
            />
            <button onClick={() => { setBudgetLimit(budgetInput ? parseFloat(budgetInput) : null); setShowBudgetInput(false); }} className="text-[10px] text-[#a6e3a1] hover:text-[#cdd6f4]">Set</button>
            <button onClick={() => setShowBudgetInput(false)} className="text-[10px] text-[#6c7086] hover:text-[#cdd6f4]">Cancel</button>
          </div>
        ) : (
          <button onClick={() => { setBudgetInput(budgetLimit?.toString() || ''); setShowBudgetInput(true); }} className="w-full text-left text-[10px] text-[#6c7086] hover:text-[#cdd6f4] transition-colors">
            {budgetLimit ? `Budget: $${budgetLimit}` : 'Set budget limit'}
          </button>
        )}
      </div>

      {/* Session info */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-[10px] text-[#6c7086]">
          <Clock className="w-3 h-3" />
          <span>{Math.floor(sessionDuration / 60000)}m</span>
          <span>·</span>
          <span>{entries.length} requests</span>
        </div>
        <button onClick={clearSession} className="text-[10px] text-[#6c7086] hover:text-[#f38ba8] transition-colors">
          Reset
        </button>
      </div>
    </div>
  );
}

function getProviderIcon(type: string): string {
  const icons: Record<string, string> = { openai: '🤖', anthropic: '🧠', gemini: '💎', deepseek: '🔮', ollama: '🦙', groq: '⚡', mistral: '🌬️', openrouter: '🛤️', custom: '⚙️' };
  return icons[type] || '⚙️';
}
