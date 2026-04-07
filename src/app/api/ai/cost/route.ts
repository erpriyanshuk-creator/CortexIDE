import { NextRequest, NextResponse } from 'next/server';
import { MODEL_REGISTRY, calculateCost } from '@/lib/ai/providers';

export async function GET() {
  // Mock cost data - in production this would come from a database
  const now = Date.now();
  const day = 86400000;

  const recentCosts = Array.from({ length: 7 }, (_, i) => {
    const daysAgo = 6 - i;
    const date = new Date(now - daysAgo * day);
    const baseCost = 0.02 + Math.random() * 0.05;
    return {
      date: date.toISOString().split('T')[0],
      inputTokens: Math.floor(5000 + Math.random() * 15000),
      outputTokens: Math.floor(2000 + Math.random() * 8000),
      totalCost: baseCost,
      requests: Math.floor(3 + Math.random() * 12),
    };
  });

  const costByModel: Record<string, { inputTokens: number; outputTokens: number; cost: number; requests: number }> = {};

  // Sample model usage data
  const modelUsage = [
    { model: 'nexus-4', requests: 15, inputTokens: 45000, outputTokens: 22000, cost: 0 },
    { model: 'gpt-4o', requests: 3, inputTokens: 12000, outputTokens: 8000, cost: 0.14 },
    { model: 'claude-4-sonnet', requests: 2, inputTokens: 8000, outputTokens: 5000, cost: 0.099 },
  ];

  for (const usage of modelUsage) {
    costByModel[usage.model] = {
      inputTokens: usage.inputTokens,
      outputTokens: usage.outputTokens,
      cost: usage.cost,
      requests: usage.requests,
    };
  }

  const totalCost = Object.values(costByModel).reduce((sum, m) => sum + m.cost, 0);
  const totalInput = Object.values(costByModel).reduce((sum, m) => sum + m.inputTokens, 0);
  const totalOutput = Object.values(costByModel).reduce((sum, m) => sum + m.outputTokens, 0);

  return NextResponse.json({
    summary: {
      totalCost,
      totalInputTokens: totalInput,
      totalOutputTokens: totalOutput,
      totalRequests: Object.values(costByModel).reduce((sum, m) => sum + m.requests, 0),
      avgCostPerRequest: totalCost / Math.max(Object.values(costByModel).reduce((sum, m) => sum + m.requests, 0), 1),
    },
    daily: recentCosts,
    byModel: costByModel,
    availableModels: MODEL_REGISTRY.slice(0, 10).map(m => ({
      id: m.id,
      name: m.name,
      provider: m.provider,
      inputCostPer1M: m.inputCostPer1M,
      outputCostPer1M: m.outputCostPer1M,
    })),
  });
}
