'use client';

import * as React from 'react';

/**
 * Hook for reading and updating a workflow node's config.
 * Dispatches the 'workflow-node-config' CustomEvent consumed by use-workflow.ts.
 * Uses an internal ref to always reference the latest config,
 * eliminating stale closure issues in callbacks.
 */
export function useNodeConfig(
  nodeId: string,
  config: Record<string, unknown>,
): [
  config: Record<string, unknown>,
  update: (key: string, value: unknown) => void,
  updateMultiple: (updates: Record<string, unknown>) => void,
  replaceConfig: (newConfig: Record<string, unknown>) => void,
] {
  const configRef = React.useRef(config);
  configRef.current = config;

  const dispatch = React.useCallback(
    (newConfig: Record<string, unknown>) => {
      window.dispatchEvent(
        new CustomEvent('workflow-node-config', {
          detail: { nodeId, config: newConfig },
        }),
      );
    },
    [nodeId],
  );

  const update = React.useCallback(
    (key: string, value: unknown) => {
      dispatch({ ...configRef.current, [key]: value });
    },
    [dispatch],
  );

  const updateMultiple = React.useCallback(
    (updates: Record<string, unknown>) => {
      dispatch({ ...configRef.current, ...updates });
    },
    [dispatch],
  );

  const replaceConfig = React.useCallback(
    (newConfig: Record<string, unknown>) => {
      dispatch(newConfig);
    },
    [dispatch],
  );

  return [config, update, updateMultiple, replaceConfig];
}
