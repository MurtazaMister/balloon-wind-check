import { useEffect } from 'react';
import { useUI } from '../state/ui';

export function Controls() {
  const { 
    hourOffset, 
    isPlaying, 
    loopVideo,
    playbackFps,
    selectedBalloons,
    viewMode,
    setHourOffset, 
    setIsPlaying, 
    setLoopVideo, 
    setPlaybackFps,
    setViewMode,
    clearSelectedBalloons,
    setEnabledColors
  } = useUI();

  // Debug: Track hourOffset changes
  useEffect(() => {
    console.log(`hourOffset changed to: ${hourOffset}`);
  }, [hourOffset]);

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

  const handleRestart = () => {
    setHourOffset(0);
    setIsPlaying(true);
  };

  const handlePlayPause = () => {
    console.log(`Play/Pause clicked: isPlaying=${isPlaying}, hourOffset=${hourOffset}`);
    if (!isPlaying) {
      // Starting playback
      if (hourOffset === 23) {
        // If at hour 23, restart from 0
        console.log('Restarting from hour 0 because at hour 23');
        setHourOffset(0);
      }
    } else {
      // Pausing - should maintain current hourOffset
      console.log(`Pausing at hour ${hourOffset}`);
    }
    setIsPlaying(!isPlaying);
  };

  const handleLoopVideoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLoopVideo(e.target.checked);
  };


  const handlePlaybackSpeedChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setPlaybackFps(parseFloat(e.target.value));
  };

  const handleViewModeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newViewMode = e.target.value as 'all' | 'selected';
    console.log(`View mode changing from ${viewMode} to ${newViewMode}, current hourOffset: ${hourOffset}`);
    setViewMode(newViewMode);
  };

  const handleReset = () => {
    console.log('Reset button clicked - resetting to hour 0');
    // Clear all selections
    clearSelectedBalloons();
    
    // Reset view mode to show all points
    setViewMode('all');
    
    // Enable all color filters (green, blue, orange, red)
    setEnabledColors(new Set(['green', 'blue', 'orange', 'red']));
    
    // Reset to current time and stop playback
    setHourOffset(0);
    setIsPlaying(false);
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

      {/* Restart Button */}
      <button
        onClick={handleRestart}
        style={{
          padding: '6px 12px',
          border: '1px solid #ddd',
          borderRadius: '4px',
          background: '#fff3e0',
          cursor: 'pointer',
          fontSize: '12px',
          fontWeight: 'bold',
          color: '#e65100'
        }}
        title="Restart animation from beginning"
      >
        Restart
      </button>

      {/* Loop Video Checkbox */}
      <label style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px' }}>
        <input
          type="checkbox"
          checked={loopVideo}
          onChange={handleLoopVideoChange}
          style={{ margin: 0 }}
        />
        Loop video
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

      {/* View Mode Dropdown - only enabled when selected > 0 && paused */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px' }}>
        <label>View:</label>
        <select
          value={viewMode}
          onChange={handleViewModeChange}
          disabled={selectedBalloons.size === 0 || isPlaying}
          style={{
            padding: '2px 4px',
            border: '1px solid #ddd',
            borderRadius: '2px',
            fontSize: '11px',
            opacity: (selectedBalloons.size === 0 || isPlaying) ? 0.5 : 1,
            cursor: (selectedBalloons.size === 0 || isPlaying) ? 'not-allowed' : 'pointer'
          }}
        >
          <option value="all">All Points</option>
          <option value="selected">Selected Only</option>
        </select>
      </div>

      {/* Reset Button - always enabled to restore all points */}
      <button
        onClick={handleReset}
        style={{
          padding: '6px 12px',
          border: '1px solid #ddd',
          borderRadius: '4px',
          background: '#fff3e0',
          cursor: 'pointer',
          fontSize: '12px',
          fontWeight: 'bold',
          color: '#e65100'
        }}
        title="Reset view: show all points, clear selections, enable all colors"
      >
        Reset View
      </button>

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
