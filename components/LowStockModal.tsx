import React from 'react';
import { Filament } from '../types';
import { AlertTriangle, X, CheckCircle, Package } from 'lucide-react';

interface LowStockModalProps {
  isOpen: boolean;
  onClose: () => void;
  filaments: Filament[];
}

const LowStockModal: React.FC<LowStockModalProps> = ({ isOpen, onClose, filaments }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden flex flex-col max-h-[80vh]">
        <div className="flex justify-between items-center p-5 border-b border-gray-100">
          <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <AlertTriangle className="w-6 h-6 text-red-500" />
            低库存预警
          </h2>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-full transition-colors">
            <X className="w-6 h-6 text-gray-500" />
          </button>
        </div>
        
        <div className="p-2 overflow-y-auto flex-1">
          {filaments.length === 0 ? (
            <div className="py-10 text-center flex flex-col items-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">库存充足</h3>
              <p className="text-gray-500 mt-1">目前没有需要补货的耗材。</p>
            </div>
          ) : (
            <div className="space-y-2 p-3">
              {filaments.map(item => (
                <div key={item.id} className="flex items-center justify-between p-3 bg-red-50/50 rounded-xl border border-red-100">
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-10 h-10 rounded-full shadow-sm border border-black/10 shrink-0" 
                      style={{ backgroundColor: item.colorHex }}
                    />
                    <div>
                      <p className="font-semibold text-gray-900 line-clamp-1">{item.name}</p>
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <span className="bg-white/50 px-1.5 py-0.5 rounded border border-red-100">{item.material}</span>
                        <span>{item.brand}</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right shrink-0 ml-2">
                    <span className="block font-bold text-red-600">{item.currentWeight}g</span>
                    <span className="text-xs text-red-400">剩余</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="p-4 bg-gray-50 border-t border-gray-100 text-center">
            {filaments.length > 0 && (
                <p className="text-xs text-gray-500 mb-3">建议及时补充以上 {filaments.length} 卷耗材</p>
            )}
          <button 
            onClick={onClose}
            className="w-full py-2.5 bg-gray-900 text-white rounded-xl font-medium hover:bg-gray-800 transition-colors"
          >
            知道了
          </button>
        </div>
      </div>
    </div>
  );
};

export default LowStockModal;