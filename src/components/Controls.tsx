import { useEffect } from 'react';
import { useUI } from '../state/ui';

export function Controls() {
  const { 
    hourOffset, 
    isPlaying, 
    showPoints, 
    playbackFps,
    setHourOffset, 
    setIsPlaying, 
    setShowPoints, 
    setPlaybackFps
  } = useUI();

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is typing in an input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      switch (e.key.toLowerCase()) {
        case ' ':
          e.preventDefault();
          setIsPlaying(!isPlaying);
          break;
        case 'n':
          e.preventDefault();
          setHourOffset(0);
          setIsPlaying(false);
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPlaying, setIsPlaying, setHourOffset]);

  const handleNow = () => {
    setHourOffset(0);
    setIsPlaying(false);
  };

  const handlePlayPause = () => {
    setIsPlaying(!isPlaying);
  };

  const handleShowPointsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setShowPoints(e.target.checked);
  };


  const handlePlaybackSpeedChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setPlaybackFps(parseFloat(e.target.value));
  };

  return (
    <div style={{
      position: 'absolute',
      top: '20px',
      left: '20px',
      background: 'rgba(255, 255, 255, 0.95)',
      padding: '12px',
      borderRadius: '8px',
      boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      fontSize: '14px',
      zIndex: 1000
    }}>
      {/* Now Button */}
      <button
        onClick={handleNow}
        style={{
          padding: '6px 12px',
          border: '1px solid #ddd',
          borderRadius: '4px',
          background: hourOffset === 0 ? '#e3f2fd' : '#fff',
          cursor: 'pointer',
          fontSize: '12px',
          fontWeight: 'bold'
        }}
        title="Jump to current time (N key)"
      >
        Now
      </button>

      {/* Play/Pause Button */}
      <button
        onClick={handlePlayPause}
        style={{
          padding: '6px 12px',
          border: '1px solid #ddd',
          borderRadius: '4px',
          background: isPlaying ? '#ffebee' : '#e8f5e8',
          cursor: 'pointer',
          fontSize: '12px',
          fontWeight: 'bold',
          color: isPlaying ? '#d32f2f' : '#2e7d32'
        }}
        title="Play/Pause animation (Space key)"
      >
        {isPlaying ? 'Pause' : 'Play'}
      </button>

      {/* Show Points Checkbox */}
      <label style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px' }}>
        <input
          type="checkbox"
          checked={showPoints}
          onChange={handleShowPointsChange}
          style={{ margin: 0 }}
        />
        Show points
      </label>


      {/* Playback Speed */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px' }}>
        <label>Speed:</label>
        <select
          value={playbackFps}
          onChange={handlePlaybackSpeedChange}
          style={{
            padding: '2px 4px',
            border: '1px solid #ddd',
            borderRadius: '2px',
            fontSize: '11px'
          }}
        >
          <option value={1}>0.5x (1 fps)</option>
          <option value={2}>1x (2 fps)</option>
          <option value={4}>2x (4 fps)</option>
        </select>
      </div>

      {/* Keyboard shortcuts tooltip */}
      <div style={{ 
        fontSize: '10px', 
        color: '#666', 
        marginLeft: '8px',
        borderLeft: '1px solid #ddd',
        paddingLeft: '8px'
      }}>
        <div>Space: Play/Pause</div>
        <div>N: Now</div>
      </div>
    </div>
  );
}
