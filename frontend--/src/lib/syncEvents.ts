import React from 'react';

/**
 * Global Sync Events System
 * Enables real-time synchronization across all pages when data changes
 */

export type SyncEventType = 
  | 'subjectCreated'
  | 'subjectUpdated'
  | 'subjectDeleted'
  | 'facultyCreated'
  | 'facultyUpdated'
  | 'facultyDeleted'
  | 'scheduleCreated'
  | 'scheduleUpdated'
  | 'scheduleDeleted'
  | 'studentCreated'
  | 'studentUpdated'
  | 'studentDeleted';

export interface SyncEventDetail {
  type: SyncEventType;
  data?: any;
  timestamp: number;
  source?: string;
}

/**
 * Emit a sync event that all pages can listen to
 */
export const emitSyncEvent = (type: SyncEventType, data?: any, source?: string) => {
  const detail: SyncEventDetail = {
    type,
    data,
    timestamp: Date.now(),
    source,
  };

  console.log(`[Sync] ${type}`, detail);

  const event = new CustomEvent('appSync', { detail });
  window.dispatchEvent(event);
};

/**
 * Listen for sync events
 */
export const onSyncEvent = (
  callback: (event: CustomEvent<SyncEventDetail>) => void,
  eventTypes?: SyncEventType[]
): (() => void) => {
  const handler = (event: Event) => {
    const customEvent = event as CustomEvent<SyncEventDetail>;
    if (!eventTypes || eventTypes.includes(customEvent.detail.type)) {
      callback(customEvent);
    }
  };

  window.addEventListener('appSync', handler);

  // Return unsubscribe function
  return () => {
    window.removeEventListener('appSync', handler);
  };
};

/**
 * Hook version for React components
 */
export const useSync = (
  callback: (event: CustomEvent<SyncEventDetail>) => void,
  eventTypes?: SyncEventType[]
) => {
  React.useEffect(() => {
    return onSyncEvent(callback, eventTypes);
  }, [callback, eventTypes]);
};
