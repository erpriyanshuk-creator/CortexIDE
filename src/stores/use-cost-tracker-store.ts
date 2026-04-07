import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { CostEntry } from '@/lib/types';

interface CostTrackerStore {
  entries: CostEntry[];
  sessionStartTime: number;
  sessionTotalCost: number;
  budgetLimit: number | null;

  addEntry: (entry: Omit<CostEntry, 'timestamp'>) => void;
  getTotalCost: () => number;
  getCostByModel: () => Record<string, number>;
  getCostByProvider: () => Record<string, number>;
  getTotalTokens: () => { input: number; output: number };
  getDailyCosts: () => Array<{ date: string; cost: number; input: number; output: number; requests: number }>;
  clearSession: () => void;
  setBudgetLimit: (limit: number | null) => void;
  isOverBudget: () => boolean;
}

export const useCostTrackerStore = create<CostTrackerStore>()(
  persist(
    (set, get) => ({
      entries: [],
      sessionStartTime: Date.now(),
      sessionTotalCost: 0,
      budgetLimit: null,

      addEntry: (entry) => {
        const fullEntry: CostEntry = {
          ...entry,
          timestamp: Date.now(),
        };
        set((state) => ({
          entries: [...state.entries, fullEntry],
          sessionTotalCost: state.sessionTotalCost + entry.totalCost,
        }));
      },

      getTotalCost: () => {
        return get().entries.reduce((sum, e) => sum + e.totalCost, 0);
      },

      getCostByModel: () => {
        const costs: Record<string, number> = {};
        get().entries.forEach((e) => {
          costs[e.model] = (costs[e.model] || 0) + e.totalCost;
        });
        return costs;
      },

      getCostByProvider: () => {
        const costs: Record<string, number> = {};
        get().entries.forEach((e) => {
          costs[e.provider] = (costs[e.provider] || 0) + e.totalCost;
        });
        return costs;
      },

      getTotalTokens: () => {
        return get().entries.reduce(
          (acc, e) => ({
            input: acc.input + e.inputTokens,
            output: acc.output + e.outputTokens,
          }),
          { input: 0, output: 0 }
        );
      },

      getDailyCosts: () => {
        const daily: Record<string, { cost: number; input: number; output: number; requests: number }> = {};
        get().entries.forEach((e) => {
          const date = new Date(e.timestamp).toISOString().split('T')[0];
          if (!daily[date]) daily[date] = { cost: 0, input: 0, output: 0, requests: 0 };
          daily[date].cost += e.totalCost;
          daily[date].input += e.inputTokens;
          daily[date].output += e.outputTokens;
          daily[date].requests += 1;
        });
        return Object.entries(daily)
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([date, data]) => ({ date, ...data }));
      },

      clearSession: () => {
        set({
          entries: [],
          sessionStartTime: Date.now(),
          sessionTotalCost: 0,
        });
      },

      setBudgetLimit: (limit) => set({ budgetLimit: limit }),

      isOverBudget: () => {
        const { budgetLimit, sessionTotalCost } = get();
        if (!budgetLimit) return false;
        return sessionTotalCost >= budgetLimit;
      },
    }),
    {
      name: 'nexus-cost-tracker',
    }
  )
);
