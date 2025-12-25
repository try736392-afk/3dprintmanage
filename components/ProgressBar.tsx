import React from 'react';

interface ProgressBarProps {
  current: number;
  total: number;
  lowStockThreshold?: number;
}

const ProgressBar: React.FC<ProgressBarProps> = ({ current, total, lowStockThreshold = 200 }) => {
  const percentage = Math.min(100, Math.max(0, (current / total) * 100));
  const isLowStock = current < lowStockThreshold;
  
  let colorClass = 'bg-emerald-500';
  if (percentage < 20 || isLowStock) {
    colorClass = 'bg-red-500';
  } else if (percentage < 50) {
    colorClass = 'bg-yellow-500';
  }

  return (
    <div className="w-full">
      <div className="flex justify-between text-xs mb-1 font-medium text-gray-600">
        <span>剩余 {Math.round(percentage)}%</span>
        <span className={isLowStock ? "text-red-600 font-bold animate-pulse" : ""}>
           {current}g / {total}g
        </span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
        <div 
          className={`h-2.5 rounded-full transition-all duration-500 ease-out ${colorClass}`} 
          style={{ width: `${percentage}%` }}
        ></div>
      </div>
      {isLowStock && (
        <p className="text-xs text-red-500 mt-1 font-semibold flex items-center">
          ⚠️ 库存不足：请补货
        </p>
      )}
    </div>
  );
};

export default ProgressBar;