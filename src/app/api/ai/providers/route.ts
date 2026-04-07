import { NextRequest, NextResponse } from 'next/server';
import { DEFAULT_PROVIDER_CONFIGS, checkProviderHealth, detectProviderFromApiKey } from '@/lib/ai/providers';

export async function GET() {
  const healthChecks = await Promise.all(
    DEFAULT_PROVIDER_CONFIGS.filter(p => p.isConfigured).map(async (p) => {
      const health = await checkProviderHealth(p);
      return health;
    }),
  );

  return NextResponse.json({
    providers: DEFAULT_PROVIDER_CONFIGS.map(p => ({
      id: p.id,
      name: p.name,
      type: p.type,
      isConfigured: p.isConfigured,
      models: p.models.map(m => ({ id: m.id, name: m.name })),
    })),
    health: healthChecks,
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, provider: providerData } = body;

    switch (action) {
      case 'configure': {
        const { providerId, apiKey, baseUrl } = providerData || {};
        const existingProvider = DEFAULT_PROVIDER_CONFIGS.find(p => p.id === providerId);

        if (!existingProvider) {
          return NextResponse.json({ error: `Provider '${providerId}' not found` }, { status: 400 });
        }

        const updatedProvider = {
          ...existingProvider,
          apiKey: apiKey || undefined,
          baseUrl: baseUrl || existingProvider.baseUrl,
          isConfigured: !!apiKey || existingProvider.type === 'ollama' || existingProvider.type === 'custom',
        };

        return NextResponse.json({
          id: updatedProvider.id,
          status: 'configured',
          provider: {
            id: updatedProvider.id,
            name: updatedProvider.name,
            type: updatedProvider.type,
            isConfigured: updatedProvider.isConfigured,
            models: updatedProvider.models.map(m => ({ id: m.id, name: m.name })),
          },
        });
      }

      case 'test': {
        const { providerId, apiKey, baseUrl } = providerData || {};
        const providerToTest = DEFAULT_PROVIDER_CONFIGS.find(p => p.id === providerId);

        if (!providerToTest) {
          return NextResponse.json({ error: `Provider '${providerId}' not found` }, { status: 400 });
        }

        const testProvider = {
          ...providerToTest,
          apiKey: apiKey || providerToTest.apiKey,
          baseUrl: baseUrl || providerToTest.baseUrl,
          isConfigured: !!(apiKey || providerToTest.apiKey) || providerToTest.type === 'ollama' || providerToTest.type === 'custom',
        };

        const health = await checkProviderHealth(testProvider);

        return NextResponse.json({
          id: providerId,
          status: health.isHealthy ? 'healthy' : 'unhealthy',
          latency: health.latencyMs,
          error: health.error,
        });
      }

      case 'detect': {
        const { apiKey } = providerData || {};
        if (!apiKey) {
          return NextResponse.json({ error: 'API key is required for detection' }, { status: 400 });
        }
        const detected = detectProviderFromApiKey(apiKey);
        return NextResponse.json({ detectedProvider: detected });
      }

      default:
        return NextResponse.json({ error: 'Unknown action. Use: configure, test, detect' }, { status: 400 });
    }
  } catch (error) {
    console.error('Provider API Error:', error);
    return NextResponse.json({ error: 'Failed to process provider request' }, { status: 500 });
  }
}
