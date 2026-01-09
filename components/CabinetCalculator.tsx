import React, { useState, useEffect } from 'react';
import { Calculator, Weight, Layers, ChevronRight, Box } from 'lucide-react';

interface CabinetCalculatorProps {
  onDeduct: (weight: number) => void;
}

const MATERIAL_DENSITIES: Record<string, number> = {
  'PLA': 1.24,
  'PETG': 1.27,
  'ABS': 1.04,
  'TPU': 1.21
};

const CabinetCalculator: React.FC<CabinetCalculatorProps> = ({ onDeduct }) => {
  // 使用字符串存储输入值，彻底解决前导零和无法删除到空位的问题
  const [params, setParams] = useState({
    width: '100',
    depth: '100',
    height: '150',
    shelves: '2',
    wallThickness: '2',
    infill: '15',
    material: 'PLA'
  });

  const [estimatedWeight, setEstimatedWeight] = useState(0);

  useEffect(() => {
    // 转换函数：空字符串视为 0
    const parse = (val: string) => parseFloat(val) || 0;

    // 转换为 cm 进行计算 (10mm = 1cm)
    const w = parse(params.width) / 10;
    const d = parse(params.depth) / 10;
    const h = parse(params.height) / 10;
    const t = parse(params.wallThickness) / 10;
    const s = parse(params.shelves);
    const infillRate = parse(params.infill) / 100;
    const density = MATERIAL_DENSITIES[params.material] || 1.24;

    // 1. 计算总表面积 (外壳 + 层板)
    // 外壳: 2*(wd + wh + dh)
    // 层板: shelves * wd
    const surfaceArea = 2 * (w * d + w * h + d * h) + (s * w * d);
    
    // 2. 实体部分体积 (壁厚部分)
    const shellVolume = surfaceArea * t;
    
    // 3. 内部填充部分体积
    const totalVolume = w * d * h;
    const internalVolume = Math.max(0, totalVolume - shellVolume);
    
    // 4. 总估算体积 (cm³)
    const estimatedVolume = shellVolume + (internalVolume * infillRate);
    
    // 5. 重量 (g)
    const weight = estimatedVolume * density;
    setEstimatedWeight(Math.round(weight));
  }, [params]);

  const handleChange = (key: keyof typeof params, value: string) => {
    // 允许空字符串，允许数字和小数点
    if (value === '' || /^\d*\.?\d*$/.test(value)) {
      setParams(prev => ({ ...prev, [key]: value }));
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="bg-indigo-50 p-4 border-b border-indigo-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Calculator className="w-5 h-5 text-indigo-600" />
          <h3 className="font-bold text-indigo-900">柜体模型耗材估算</h3>
        </div>
        <div className="flex items-center gap-1.5 bg-white/50 px-2 py-1 rounded-lg border border-indigo-100">
           <Box className="w-3.5 h-3.5 text-indigo-400" />
           <select 
             value={params.material}
             onChange={(e) => setParams(prev => ({ ...prev, material: e.target.value }))}
             className="bg-transparent text-xs font-bold text-indigo-600 outline-none cursor-pointer"
           >
             {Object.keys(MATERIAL_DENSITIES).map(m => (
               <option key={m} value={m}>{m}</option>
             ))}
           </select>
        </div>
      </div>
      
      <div className="p-5 space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">宽度 (Width, mm)</label>
            <input 
              type="text" 
              inputMode="decimal"
              value={params.width}
              onChange={e => handleChange('width', e.target.value)}
              className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm font-medium focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none transition-all"
            />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">深度 (Depth, mm)</label>
            <input 
              type="text" 
              inputMode="decimal"
              value={params.depth}
              onChange={e => handleChange('depth', e.target.value)}
              className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm font-medium focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none transition-all"
            />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">高度 (Height, mm)</label>
            <input 
              type="text" 
              inputMode="decimal"
              value={params.height}
              onChange={e => handleChange('height', e.target.value)}
              className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm font-medium focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none transition-all"
            />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">层数 (Shelves)</label>
            <div className="relative">
              <Layers className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-gray-400" />
              <input 
                type="text" 
                inputMode="numeric"
                value={params.shelves}
                onChange={e => handleChange('shelves', e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 rounded-lg pl-8 pr-3 py-2 text-sm font-medium focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none transition-all"
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 pt-2 border-t border-gray-50">
           <div className="space-y-1">
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">壁厚 (Shell, mm)</label>
            <input 
              type="text" 
              inputMode="decimal"
              value={params.wallThickness}
              onChange={e => handleChange('wallThickness', e.target.value)}
              className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm font-medium focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none transition-all"
            />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">填充率 (Infill, %)</label>
            <input 
              type="text" 
              inputMode="numeric"
              value={params.infill}
              onChange={e => handleChange('infill', e.target.value)}
              className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm font-medium focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none transition-all"
            />
          </div>
        </div>

        <div className="mt-4 p-4 bg-indigo-600 rounded-xl text-white shadow-lg shadow-indigo-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-lg">
              <Weight className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] text-indigo-100 uppercase font-bold tracking-widest">预计消耗 ({params.material})</p>
              <p className="text-2xl font-black leading-none mt-1">{estimatedWeight} <span className="text-sm font-normal">g</span></p>
            </div>
          </div>
          <button 
            onClick={() => onDeduct(estimatedWeight)}
            className="bg-white text-indigo-600 px-4 py-2 rounded-lg font-bold text-sm hover:bg-indigo-50 transition-all active:scale-95 flex items-center gap-1 shadow-sm"
          >
            一键扣除 <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default CabinetCalculator;