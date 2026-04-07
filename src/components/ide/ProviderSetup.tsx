'use client';

import React, { useState, useCallback } from 'react';
import {
  Key,
  Globe,
  CheckCircle2,
  XCircle,
  Plus,
  Trash2,
  Eye,
  EyeOff,
  Loader2,
  RefreshCw,
  Zap,
  Shield,
  ArrowLeft,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { useAIAgentStore } from '@/stores/use-ai-agent-store';
import { cn } from '@/lib/utils';
import { DEFAULT_PROVIDER_CONFIGS, detectProviderFromApiKey, checkProviderHealth, getProviderColor, getProviderIcon, type ProviderConfig, type ProviderType } from '@/lib/ai/providers';

const PROVIDER_TEMPLATES = DEFAULT_PROVIDER_CONFIGS.filter(p => p.type !== 'custom');

const QUICK_PRESETS = [
  { name: 'Best for Coding', providers: ['anthropic', 'openai'], description: 'Claude 4 Sonnet + GPT-4o' },
  { name: 'Most Cost-Effective', providers: ['deepseek', 'groq'], description: 'DeepSeek V3 + Llama 3.3' },
  { name: 'Local First', providers: ['ollama'], description: 'Run models locally' },
  { name: 'Maximum Context', providers: ['gemini'], description: 'Gemini 2.5 Pro (1M tokens)' },
];

export function ProviderSetup() {
  const { providers, setProviders } = useAIAgentStore();
  const [showKeys, setShowKeys] = useState<Record<string, boolean>>({});
  const [activeStep, setActiveStep] = useState<'select' | 'configure' | 'verify'>('select');
  const [selectedProvider, setSelectedProvider] = useState<ProviderType | null>(null);
  const [apiKey, setApiKey] = useState('');
  const [baseUrl, setBaseUrl] = useState('');
  const [testResult, setTestResult] = useState<{ success: boolean; latency?: number; error?: string } | null>(null);
  const [isTesting, setIsTesting] = useState(false);

  const configuredProviders = providers.filter(p => p.isConfigured && p.type !== 'custom');
  const isConfigured = (type: ProviderType) => providers.some(p => p.type === type && p.isConfigured);

  const toggleShowKey = (id: string) => {
    setShowKeys(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleSelectProvider = useCallback((type: ProviderType) => {
    setSelectedProvider(type);
    const template = PROVIDER_TEMPLATES.find(p => p.type === type);
    setBaseUrl(template?.baseUrl || '');
    setActiveStep('configure');
    setTestResult(null);
  }, []);

  const handleAutoDetect = useCallback(() => {
    const detected = detectProviderFromApiKey(apiKey);
    if (detected) {
      const template = PROVIDER_TEMPLATES.find(p => p.type === detected);
      setSelectedProvider(detected);
      setBaseUrl(template?.baseUrl || '');
    }
  }, [apiKey]);

  const handleTestConnection = useCallback(async () => {
    if (!selectedProvider) return;
    setIsTesting(true);
    setTestResult(null);

    const template = PROVIDER_TEMPLATES.find(p => p.type === selectedProvider);
    if (!template) { setIsTesting(false); return; }

    try {
      const health = await checkProviderHealth({
        ...template,
        apiKey: apiKey || undefined,
        baseUrl: baseUrl || template.baseUrl,
        isConfigured: true,
      });
      setTestResult({ success: health.isHealthy, latency: health.latencyMs, error: health.error });
      if (health.isHealthy) setActiveStep('verify');
    } catch (error) {
      setTestResult({ success: false, error: error instanceof Error ? error.message : 'Connection failed' });
    } finally {
      setIsTesting(false);
    }
  }, [selectedProvider, apiKey, baseUrl]);

  const handleConnect = useCallback(() => {
    if (!selectedProvider) return;
    const template = PROVIDER_TEMPLATES.find(p => p.type === selectedProvider);
    if (!template) return;

    const newProv = {
      ...template,
      apiKey: apiKey || undefined,
      baseUrl: baseUrl || template.baseUrl,
      isConfigured: !!apiKey || selectedProvider === 'ollama',
    };

    setProviders([...providers.filter(p => p.type !== selectedProvider), newProv]);
    setActiveStep('select');
    setSelectedProvider(null);
    setApiKey('');
    setBaseUrl('');
    setTestResult(null);
  }, [selectedProvider, apiKey, baseUrl, providers, setProviders]);

  const removeProvider = useCallback((id: string) => {
    setProviders(providers.map(p => p.id === id ? { ...p, isConfigured: false, apiKey: undefined } : p));
  }, [providers, setProviders]);

  const handleBack = () => {
    setActiveStep('select');
    setSelectedProvider(null);
    setApiKey('');
    setTestResult(null);
  };

  return (
    <div className="p-3 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Shield className="w-4 h-4 text-[#89b4fa]" />
          <span className="text-sm font-medium text-[#cdd6f4]">Provider Setup</span>
        </div>
        <span className="text-[10px] text-[#6c7086]">{configuredProviders.length} configured</span>
      </div>

      {/* Quick presets */}
      {activeStep === 'select' && configuredProviders.length === 0 && (
        <div className="space-y-2">
          <div className="text-xs text-[#6c7086] uppercase tracking-wider">Quick Setup</div>
          <div className="grid grid-cols-1 gap-1.5">
            {QUICK_PRESETS.map(preset => (
              <div key={preset.name} className="bg-[#1e1e2e] border border-[#313244] rounded-lg p-2.5">
                <div className="flex items-center gap-1.5 mb-0.5">
                  <Zap className="w-3 h-3 text-[#f9e2af]" />
                  <span className="text-xs font-medium text-[#cdd6f4]">{preset.name}</span>
                </div>
                <span className="text-[10px] text-[#6c7086]">{preset.description}</span>
                <div className="flex gap-1 mt-1.5">
                  {preset.providers.map(pType => {
                    const template = PROVIDER_TEMPLATES.find(t => t.type === pType);
                    return template ? (
                      <button key={pType} onClick={() => handleSelectProvider(pType)} className="text-[10px] px-1.5 py-0.5 bg-[#313244] rounded text-[#a6adc8] hover:border-[#89b4fa] hover:text-[#cdd6f4] transition-colors flex items-center gap-0.5">
                        <span>{getProviderIcon(pType)}</span> {template.name}
                      </button>
                    ) : null;
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Existing providers */}
      {activeStep === 'select' && configuredProviders.length > 0 && (
        <div className="space-y-2">
          <div className="text-xs text-[#6c7086] uppercase tracking-wider">Configured Providers</div>
          {configuredProviders.map(provider => (
            <div key={provider.id} className="bg-[#1e1e2e] border border-[#313244] rounded-lg p-3 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-sm">{getProviderIcon(provider.type)}</span>
                  <span className="text-sm font-medium text-[#cdd6f4]">{provider.name}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="flex items-center gap-1 text-[10px] text-[#a6e3a1]">
                    <CheckCircle2 className="w-3 h-3" /> Connected
                  </span>
                  <button onClick={() => removeProvider(provider.id)} className="p-0.5 text-[#6c7086] hover:text-[#f38ba8] transition-colors">
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </div>
              <div className="flex flex-wrap gap-1">
                {provider.models.slice(0, 3).map(model => (
                  <span key={model.id} className="text-[10px] px-1.5 py-0.5 bg-[#313244] rounded text-[#a6adc8]">
                    {model.name}
                  </span>
                ))}
                {provider.models.length > 3 && (
                  <span className="text-[10px] px-1.5 py-0.5 bg-[#313244] rounded text-[#6c7086]">
                    +{provider.models.length - 3} more
                  </span>
                )}
              </div>
              {provider.apiKey && (
                <div className="flex items-center gap-1 text-[10px] text-[#6c7086]">
                  <Key className="w-2.5 h-2.5" />
                  <span>****{provider.apiKey.slice(-4)}</span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Add new provider grid */}
      {activeStep === 'select' && (
        <div className="space-y-2">
          <div className="text-xs text-[#6c7086] uppercase tracking-wider">Add Provider</div>
          <div className="grid grid-cols-2 gap-1.5">
            {PROVIDER_TEMPLATES.filter(t => !isConfigured(t.type)).map(template => (
              <button
                key={template.type}
                onClick={() => handleSelectProvider(template.type)}
                className="flex items-center gap-2 px-3 py-2 rounded-lg border border-[#313244] text-xs text-[#a6adc8] hover:border-[#89b4fa] hover:text-[#cdd6f4] transition-colors"
              >
                <Plus className="w-3 h-3" />
                <span>{getProviderIcon(template.type)}</span>
                {template.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Configuration step */}
      {activeStep === 'configure' && selectedProvider && (
        <div className="bg-[#1e1e2e] border border-[#313244] rounded-lg p-3 space-y-3">
          <div className="flex items-center gap-2">
            <button onClick={handleBack} className="p-0.5 rounded hover:bg-[#313244] text-[#6c7086] hover:text-[#cdd6f4] transition-colors">
              <ArrowLeft className="w-3.5 h-3.5" />
            </button>
            <span className="text-sm">{getProviderIcon(selectedProvider)}</span>
            <span className="text-sm font-medium text-[#cdd6f4]">
              {PROVIDER_TEMPLATES.find(p => p.type === selectedProvider)?.name}
            </span>
          </div>

          {/* Step indicator */}
          <div className="flex items-center gap-1">
            {['configure', 'verify'].map((step, i) => (
              <React.Fragment key={step}>
                <div className={cn('w-6 h-1.5 rounded-full transition-colors', activeStep === step ? 'bg-[#89b4fa]' : i === 0 ? 'bg-[#313244]' : 'bg-[#313244]')} />
              </React.Fragment>
            ))}
          </div>

          {selectedProvider !== 'ollama' && (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label className="text-xs text-[#a6adc8]">API Key</Label>
                <button onClick={handleAutoDetect} className="text-[9px] text-[#89b4fa] hover:text-[#b4d0fb]">Auto-detect</button>
              </div>
              <div className="relative">
                <Input
                  type={showKeys[selectedProvider] ? 'text' : 'password'}
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="sk-..."
                  className="bg-[#181825] border-[#313244] text-[#cdd6f4] text-sm pr-8"
                />
                <button onClick={() => toggleShowKey(selectedProvider)} className="absolute right-2 top-1/2 -translate-y-1/2 text-[#6c7086] hover:text-[#cdd6f4]">
                  {showKeys[selectedProvider] ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>
          )}

          <div className="space-y-1.5">
            <Label className="text-xs text-[#a6adc8]">Base URL</Label>
            <Input
              value={baseUrl}
              onChange={(e) => setBaseUrl(e.target.value)}
              className="bg-[#181825] border-[#313244] text-[#cdd6f4] text-sm"
            />
          </div>

          <div className="flex gap-2">
            <Button
              onClick={handleTestConnection}
              disabled={!apiKey && selectedProvider !== 'ollama'}
              variant="outline"
              size="sm"
              className="text-xs border-[#313244] text-[#a6adc8] hover:bg-[#313244] hover:text-[#cdd6f4]"
            >
              {isTesting ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <RefreshCw className="w-3 h-3 mr-1" />}
              Test
            </Button>
            <Button
              onClick={handleConnect}
              disabled={!apiKey && selectedProvider !== 'ollama'}
              size="sm"
              className="bg-[#89b4fa] text-[#1e1e2e] hover:bg-[#b4d0fb] text-xs"
            >
              <CheckCircle2 className="w-3 h-3 mr-1" />
              Connect
            </Button>
          </div>

          {testResult && (
            <div className={cn('flex items-center gap-2 text-xs p-2 rounded-lg', testResult.success ? 'bg-[#a6e3a1]/10 text-[#a6e3a1]' : 'bg-[#f38ba8]/10 text-[#f38ba8]')}>
              {testResult.success ? <CheckCircle2 className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
              <span>{testResult.success ? `Connected (${testResult.latency}ms)` : testResult.error}</span>
            </div>
          )}

          {/* Model discovery */}
          {apiKey && (
            <div className="space-y-1.5">
              <Label className="text-xs text-[#a6adc8]">Available Models</Label>
              <div className="flex flex-wrap gap-1">
                {PROVIDER_TEMPLATES.find(p => p.type === selectedProvider)?.models.map(model => (
                  <span key={model.id} className="text-[10px] px-1.5 py-0.5 bg-[#313244] rounded text-[#a6adc8] flex items-center gap-0.5">
                    {model.capabilities.vision && '👁️'}
                    {model.capabilities.functionCalling && '🔧'}
                    {model.name}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
