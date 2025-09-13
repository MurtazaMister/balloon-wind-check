import { useMemo } from 'react';
import { useUI } from '../state/ui';
import { useBalloons } from '../hooks/useBalloons';

export function InfoBadge() {
  const { hourOffset, showPoints } = useUI();
  const { data: samples, isLoading, error } = useBalloons();

  const info = useMemo(() => {
    const now = new Date();
    const lastRefresh = now.toLocaleTimeString('en-US', { 
      hour12: false, 
      hour: '2-digit', 
      minute: '2-digit' 
    });

    // Count visible points for current hour
    const visiblePoints = samples?.filter(sample => {
      if (!showPoints) return false;
      return sample.h === hourOffset;
    }).length || 0;

    return {
      timeDisplay: hourOffset === 0 ? 'Now' : `${hourOffset}h ago`,
      visiblePoints,
      lastRefresh
    };
  }, [hourOffset, showPoints, samples]);

  return (
    <div style={{
      position: 'absolute',
      top: '20px',
      right: '20px',
      background: 'rgba(255, 255, 255, 0.95)',
      padding: '12px',
      borderRadius: '8px',
      boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
      fontSize: '12px',
      lineHeight: '1.4',
      zIndex: 1000,
      minWidth: '200px'
    }}>
      <div style={{ fontWeight: 'bold', marginBottom: '6px' }}>Status</div>
      
      <div style={{ marginBottom: '2px' }}>
        <strong>Time:</strong> {info.timeDisplay}
      </div>
      
      {showPoints && (
        <div style={{ marginBottom: '2px' }}>
          <strong>Points shown:</strong> {info.visiblePoints}
        </div>
      )}
      
      <div style={{ marginBottom: '2px' }}>
        <strong>Last refresh:</strong> {info.lastRefresh}
      </div>
      
      {isLoading && (
        <div style={{ color: '#666', fontSize: '11px' }}>
          Loading...
        </div>
      )}
      
      {error ? (
        <div style={{ color: '#d32f2f', fontSize: '11px' }}>
          Error loading data
        </div>
      ) : null}
    </div>
  );
}
