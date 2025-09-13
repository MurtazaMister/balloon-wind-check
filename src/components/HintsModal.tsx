import React, { useState } from 'react';

const hints = [
  {
    id: 1,
    title: "Compare Winds",
    content: "Select any balloon and click play to compare observed winds and forecasted winds"
  },
  {
    id: 2,
    title: "View All Balloons",
    content: "Click play without selecting any balloon to see every balloon's movement through the sky"
  },
  {
    id: 3,
    title: "Customize View",
    content: "Uncheck boxes in the legend (bottom left) to customize what balloons you are viewing"
  }
];

interface HintsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HintsModal: React.FC<HintsModalProps> = ({ isOpen, onClose }) => {
  const [currentHint, setCurrentHint] = useState(0);

  if (!isOpen) return null;

  const nextHint = () => {
    setCurrentHint((prev) => (prev + 1) % hints.length);
  };

  const prevHint = () => {
    setCurrentHint((prev) => (prev - 1 + hints.length) % hints.length);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowLeft') prevHint();
    if (e.key === 'ArrowRight') nextHint();
    if (e.key === 'Escape') onClose();
  };

  return (
    <div 
      className="hints-modal-overlay"
      onClick={onClose}
      onKeyDown={handleKeyDown}
      tabIndex={0}
    >
      <div 
        className="hints-modal"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="hints-modal-header">
          <h3>Quick Tips</h3>
          <button className="hints-modal-close" onClick={onClose}>
            ×
          </button>
        </div>
        
        <div className="hints-modal-content">
          <div className="hints-modal-hint">
            <h4>{hints[currentHint].title}</h4>
            <p>{hints[currentHint].content}</p>
          </div>
          
          <div className="hints-modal-navigation">
            <button 
              className="hints-nav-btn"
              onClick={prevHint}
              disabled={hints.length <= 1}
            >
              ←
            </button>
            
            <div className="hints-dots">
              {hints.map((_, index) => (
                <button
                  key={index}
                  className={`hints-dot ${index === currentHint ? 'active' : ''}`}
                  onClick={() => setCurrentHint(index)}
                />
              ))}
            </div>
            
            <button 
              className="hints-nav-btn"
              onClick={nextHint}
              disabled={hints.length <= 1}
            >
              →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
