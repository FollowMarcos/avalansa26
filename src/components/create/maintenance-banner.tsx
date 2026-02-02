'use client';

import { useEffect, useRef } from 'react';
import { AlertTriangle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useCreate } from './create-context';

export function MaintenanceBanner() {
  const { isMaintenanceMode, adminSettings } = useCreate();
  const containerRef = useRef<HTMLDivElement>(null);

  // Focus trap - keep focus within the dialog
  useEffect(() => {
    if (!isMaintenanceMode) return;

    // Focus the container when it mounts
    containerRef.current?.focus();

    // Trap focus within the dialog
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Tab') {
        // Since there are no focusable elements, just prevent tab from leaving
        e.preventDefault();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isMaintenanceMode]);

  if (!isMaintenanceMode) return null;

  return (
    <div
      ref={containerRef}
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="maintenance-title"
      aria-describedby="maintenance-description"
      tabIndex={-1}
      className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm focus:outline-none"
    >
      <Alert variant="destructive" className="max-w-md shadow-2xl border-2">
        <AlertTriangle className="h-5 w-5" aria-hidden="true" />
        <AlertTitle id="maintenance-title" className="text-lg font-semibold">
          Create Feature Unavailable
        </AlertTitle>
        <AlertDescription id="maintenance-description" className="mt-2 text-sm">
          {adminSettings?.maintenance_message ||
            'The image generation feature is temporarily unavailable for maintenance. Please check back later.'}
        </AlertDescription>
      </Alert>
    </div>
  );
}
