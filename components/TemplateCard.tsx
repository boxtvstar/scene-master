
import React, { useState } from 'react';
import { SequenceTemplate } from '../types';

interface TemplateCardProps {
  template: SequenceTemplate;
  isSelected: boolean;
  onSelect: (id: string) => void;
}

const TemplateCard: React.FC<TemplateCardProps> = ({ template, isSelected, onSelect }) => {
  const [showTooltip, setShowTooltip] = useState(false);

  return (
    <div 
      className="relative"
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      <button
        onClick={() => onSelect(template.id)}
        className={`w-full text-left px-4 py-3 rounded-lg border transition-all ${
          isSelected 
            ? 'bg-amber-500/10 border-amber-500 text-amber-500' 
            : 'bg-slate-800 border-slate-700 text-slate-300 hover:border-slate-500'
        }`}
      >
        <div className="text-sm font-semibold">{template.name}</div>
        <div className="text-xs opacity-60 truncate">{template.description}</div>
      </button>

      {showTooltip && (
        <div className="absolute left-full ml-4 top-0 z-50 w-64 p-2 bg-slate-900 border border-slate-700 rounded-lg shadow-2xl animate-in fade-in slide-in-from-left-2 duration-200">
          <img 
            src={template.previewUrl} 
            alt={template.name} 
            className="w-full h-32 object-cover rounded mb-2" 
          />
          <div className="text-xs text-slate-300">{template.description}</div>
        </div>
      )}
    </div>
  );
};

export default TemplateCard;
