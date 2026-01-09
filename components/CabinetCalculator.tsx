import React, { useState, useEffect } from 'react';
import { Calculator, Weight, Layers, ChevronRight } from 'lucide-react';

interface CabinetCalculatorProps {
  onDeduct: (weight: number) => void;
}

const CabinetCalculator: React.FC<CabinetCalculatorProps> = ({ onDeduct }) => {
  const [params, setParams] = useState({
    width: 100,
    depth: 100,
    height: 150,
    shelves: 2,
    wallThickness: 2,
    infill: 15,
    density: 1.24 // PLA default
  });

  const [estimatedWeight, setEstimatedWeight] = useState(0);

  useEffect(() => {
    // 转换为 cm 进行计算 (10mm = 1cm)
    const w = params.width / 10;
    const d = params.depth / 10;
    const h = params.height / 10;
    const t = params.wallThickness / 10;
    const infillRate = params.infill / 100;

    // 1. 计算总表面积 (外壳 + 层板)
    // 外壳: 2*(wd + wh + dh)
    // 层板: shelves * wd
    const surfaceArea = 2 * (w * d + w * h + d * h) + (params.shelves * w * d);
    
    // 2. 实体部分体积 (壁厚部分)
    const shellVolume = surfaceArea * t;
    
    // 3. 内部填充部分体积
    const totalVolume = w * d * h;
    const internalVolume = Math.max(0, totalVolume - shellVolume);
    
    // 4. 总估算体积 (cm³)
    const estimatedVolume = shellVolume + (internalVolume * infillRate);
    
    // 5. 重量 (g)
    const weight = estimatedVolume * params.density;
    setEstimatedWeight(Math.round(weight));
  }, [params]);

  const handleChange = (key: keyof typeof params, value: string) => {
    const num = parseFloat(value) || 0;
    setParams(prev => ({ ...prev, [key]: num }));
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="bg-indigo-50 p-4 border-b border-indigo-100 flex items-center gap-2">
        <Calculator className="w-5 h-5 text-indigo-600" />
        <h3 className="font-bold text-indigo-900">柜体模型耗材估算</h3>
      </div>
      
      <div className="p-5 space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-gray-400 uppercase">宽度 (mm)</label>
            <input 
              type="number" 
              value={params.width}
              onChange={e => handleChange('width', e.target.value)}
              className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
            />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-gray-400 uppercase">深度 (mm)</label>
            <input 
              type="number" 
              value={params.depth}
              onChange={e => handleChange('depth', e.target.value)}
              className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
            />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-gray-400 uppercase">高度 (mm)</label>
            <input 
              type="number" 
              value={params.height}
              onChange={e => handleChange('height', e.target.value)}
              className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
            />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-gray-400 uppercase">层数</label>
            <div className="relative">
              <Layers className="absolute left-2.5 top-2 w-4 h-4 text-gray-400" />
              <input 
                type="number" 
                value={params.shelves}
                onChange={e => handleChange('shelves', e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 rounded-lg pl-8 pr-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 pt-2 border-t border-gray-50">
           <div className="space-y-1">
            <label className="text-[10px] font-bold text-gray-400 uppercase">壁厚 (mm)</label>
            <input 
              type="number" 
              step="0.1"
              value={params.wallThickness}
              onChange={e => handleChange('wallThickness', e.target.value)}
              className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
            />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-gray-400 uppercase">填充率 (%)</label>
            <input 
              type="number" 
              value={params.infill}
              onChange={e => handleChange('infill', e.target.value)}
              className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
            />
          </div>
        </div>

        <div className="mt-4 p-4 bg-indigo-600 rounded-xl text-white shadow-lg shadow-indigo-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-lg">
              <Weight className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-indigo-100">预计消耗</p>
              <p className="text-2xl font-black">{estimatedWeight} <span className="text-sm font-normal">g</span></p>
            </div>
          </div>
          <button 
            onClick={() => onDeduct(estimatedWeight)}
            className="bg-white text-indigo-600 px-4 py-2 rounded-lg font-bold text-sm hover:bg-indigo-50 transition-colors flex items-center gap-1 active:scale-95"
          >
            一键扣除 <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default CabinetCalculator;