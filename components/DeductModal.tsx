import React, { useState } from 'react';
import { Filament } from '../types';
import { AlertTriangle, Printer, X } from 'lucide-react';

interface DeductModalProps {
  filament: Filament;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (amount: number) => void;
}

const DeductModal: React.FC<DeductModalProps> = ({ filament, isOpen, onClose, onConfirm }) => {
  const [amount, setAmount] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleConfirm = () => {
    const val = parseFloat(amount);
    if (isNaN(val) || val <= 0) {
      setError("Please enter a valid amount.");
      return;
    }
    
    if (val > filament.currentWeight) {
      setError(`Over-draft prevented! You only have ${filament.currentWeight}g left.`);
      return;
    }

    onConfirm(val);
    setAmount('');
    setError(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden transform transition-all scale-100">
        <div className="bg-gray-50 p-4 flex justify-between items-center border-b border-gray-100">
          <h3 className="font-bold text-lg text-gray-800 flex items-center gap-2">
            <Printer className="w-5 h-5 text-blue-600" />
            Record Print Job
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6">
          <div className="flex items-center gap-3 mb-6">
            <div 
              className="w-10 h-10 rounded-full shadow-inner border border-black/10" 
              style={{ backgroundColor: filament.colorHex }}
            />
            <div>
              <p className="font-semibold text-gray-900">{filament.name}</p>
              <p className="text-xs text-gray-500">Available: {filament.currentWeight}g</p>
            </div>
          </div>

          <label className="block text-sm font-medium text-gray-700 mb-2">
            Filament Used (grams)
          </label>
          <div className="relative">
            <input
              type="number"
              value={amount}
              onChange={(e) => {
                setAmount(e.target.value);
                setError(null);
              }}
              className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-lg focus:border-blue-500 focus:ring-0 outline-none transition-colors"
              placeholder="e.g. 45"
              autoFocus
            />
            <span className="absolute right-4 top-3.5 text-gray-400 font-medium">g</span>
          </div>

          {error && (
            <div className="mt-4 p-3 bg-red-50 border border-red-100 rounded-lg flex items-start gap-2 text-sm text-red-600 animate-in fade-in slide-in-from-top-1">
              <AlertTriangle className="w-5 h-5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="mt-8 flex gap-3">
            <button 
              onClick={onClose}
              className="flex-1 py-3 px-4 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
            <button 
              onClick={handleConfirm}
              className="flex-1 py-3 px-4 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 shadow-lg shadow-blue-600/20 transition-all active:scale-95"
            >
              Confirm Print
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeductModal;