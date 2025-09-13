import React from 'react';

export function Legend() {
  const heightRanges = [
    { min: 0, max: 5, color: '#4CAF50', label: '0-5km' },
    { min: 5, max: 10, color: '#2196F3', label: '5-10km' },
    { min: 10, max: 20, color: '#FF9800', label: '10-20km' },
    { min: 20, max: Infinity, color: '#F44336', label: '>20km' }
  ];

  return (
    <div style={{
      position: 'absolute',
      bottom: '20px',
      left: '20px',
      background: 'rgba(255, 255, 255, 0.95)',
      padding: '12px',
      borderRadius: '8px',
      boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
      fontSize: '12px',
      zIndex: 1000,
      minWidth: '120px'
    }}>
      <div style={{
        fontWeight: 'bold',
        marginBottom: '8px',
        fontSize: '13px',
        color: '#333'
      }}>
        Altitude Legend
      </div>
      
      {heightRanges.map((range, index) => (
        <div key={index} style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          marginBottom: '4px'
        }}>
          <div style={{
            width: '12px',
            height: '12px',
            borderRadius: '50%',
            backgroundColor: range.color,
            border: '1px solid #ffffff',
            boxShadow: '0 1px 2px rgba(0,0,0,0.2)'
          }} />
          <span style={{ color: '#555' }}>
            {range.label}
          </span>
        </div>
      ))}
      
      <div style={{
        marginTop: '8px',
        paddingTop: '8px',
        borderTop: '1px solid #ddd',
        fontSize: '10px',
        color: '#666',
        fontStyle: 'italic'
      }}>
        Click dots to select balloons
      </div>
    </div>
  );
}
