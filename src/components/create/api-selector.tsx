'use client';

import { cn } from '@/lib/utils';
import {
  Sparkles,
  Brain,
  MessageSquare,
  Image,
  Zap,
  Box,
  Settings,
  ChevronDown,
  Check,
  Server,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import type { ApiConfig } from '@/types/api-config';

// Provider icon mapping
const providerIcons: Record<string, React.ElementType> = {
  google: Sparkles,
  openai: Brain,
  anthropic: MessageSquare,
  stability: Image,
  fal: Zap,
  replicate: Box,
  custom: Settings,
};

interface ApiSelectorProps {
  apis: ApiConfig[];
  selectedApiId: string | null;
  onSelect: (apiId: string | null) => void;
  disabled?: boolean;
  className?: string;
}

export function ApiSelector({
  apis,
  selectedApiId,
  onSelect,
  disabled = false,
  className,
}: ApiSelectorProps) {
  const selectedApi = apis.find((api) => api.id === selectedApiId);
  const SelectedIcon = selectedApi
    ? providerIcons[selectedApi.provider] || Settings
    : Server;

  // Group APIs by provider
  const groupedApis = apis.reduce(
    (acc, api) => {
      if (!acc[api.provider]) {
        acc[api.provider] = [];
      }
      acc[api.provider].push(api);
      return acc;
    },
    {} as Record<string, ApiConfig[]>
  );

  const providerNames: Record<string, string> = {
    google: 'Google AI',
    openai: 'OpenAI',
    anthropic: 'Anthropic',
    stability: 'Stability AI',
    fal: 'Fal.ai',
    replicate: 'Replicate',
    custom: 'Custom',
  };

  if (apis.length === 0) {
    return (
      <Button
        variant="outline"
        size="sm"
        disabled
        className={cn(
          'gap-2 text-muted-foreground border-dashed',
          className
        )}
      >
        <Server className="w-4 h-4" aria-hidden="true" />
        <span className="truncate">No APIs available</span>
      </Button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          disabled={disabled}
          className={cn(
            'gap-2 min-w-[140px] justify-between',
            selectedApi && 'border-primary/50',
            className
          )}
        >
          <div className="flex items-center gap-2 truncate">
            <SelectedIcon className="w-4 h-4 shrink-0" aria-hidden="true" />
            <span className="truncate">
              {selectedApi?.name || 'Select API'}
            </span>
          </div>
          <ChevronDown className="w-3 h-3 shrink-0 opacity-50" aria-hidden="true" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-[220px]">
        <DropdownMenuLabel className="text-xs font-medium text-muted-foreground">
          Select API
        </DropdownMenuLabel>
        <DropdownMenuSeparator />

        {Object.entries(groupedApis).map(([provider, providerApis], index) => {
          const Icon = providerIcons[provider] || Settings;
          return (
            <div key={provider}>
              {index > 0 && <DropdownMenuSeparator />}
              <DropdownMenuLabel className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold flex items-center gap-2 py-1">
                <Icon className="w-3 h-3" aria-hidden="true" />
                {providerNames[provider] || provider}
              </DropdownMenuLabel>
              {providerApis.map((api) => {
                const isSelected = api.id === selectedApiId;
                return (
                  <DropdownMenuItem
                    key={api.id}
                    onClick={() => onSelect(api.id)}
                    className="gap-2 cursor-pointer"
                  >
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <span className="truncate">{api.name}</span>
                      {api.model_id && (
                        <span className="text-[10px] text-muted-foreground truncate">
                          {api.model_id}
                        </span>
                      )}
                    </div>
                    {isSelected && (
                      <Check className="w-4 h-4 text-primary shrink-0" aria-hidden="true" />
                    )}
                  </DropdownMenuItem>
                );
              })}
            </div>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
