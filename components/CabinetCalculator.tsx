import React, { useState, useEffect } from 'react';
import { Calculator, Weight, Layers, ChevronRight, Box, Percent, Ruler } from 'lucide-react';

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
  // 状态管理：使用字符串以解决输入框“前导零”和“无法删除为空”的问题
  const [params, setParams] = useState({
    width: '100',
    depth: '100',
    height: '150',
    shelves: '2',         // 这里的 shelves 指柜子层数（即横向隔板+底板的数量）
    wallThickness: '2',   // 板材厚度 (mm)
    infill: '100',        // 填充率，默认 100% 代表实心板材体积
    material: 'PLA',
    compensation: '1.15'  // 补偿系数
  });

  const [estimatedWeight, setEstimatedWeight] = useState(0);

  useEffect(() => {
    // 转换函数：处理空字符串为 0
    const parse = (val: string) => parseFloat(val) || 0;

    // 获取输入数值 (mm)
    const W = parse(params.width);
    const D = parse(params.depth);
    const H = parse(params.height);
    const T = parse(params.wallThickness);
    const L = parse(params.shelves);
    const infillRate = parse(params.infill) / 100;
    const density = MATERIAL_DENSITIES[params.material] || 1.24;
    const F = parse(params.compensation);

    /**
     * 新几何体积公式 (mm³):
     * 1. 背板: 宽度 * 高度 * 厚度
     * 2. 侧板: 深度 * 高度 * 厚度 * 2 (左右两块)
     * 3. 横板: 宽度 * 深度 * 厚度 * 层数 (底板 + 隔板总数)
     */
    const vol_back = W * H * T;
    const vol_sides = D * H * T * 2;
    const vol_shelves = W * D * T * L;

    const totalVolumeMm3 = vol_back + vol_sides + vol_shelves;
    
    // 转换为 cm³ (1000 mm³ = 1 cm³)
    const totalVolumeCm3 = totalVolumeMm3 / 1000;

    /**
     * 最终重量计算 (g):
     * 几何体积 * 材质密度 * 内部填充率 * 损耗补偿系数
     */
    const weight = totalVolumeCm3 * density * infillRate * F;
    
    setEstimatedWeight(Math.round(weight));
  }, [params]);

  const handleChange = (key: keyof typeof params, value: string) => {
    // 仅允许数字和小数点，且处理为空的情况
    if (value === '' || /^\d*\.?\d*$/.test(value)) {
      setParams(prev => ({ ...prev, [key]: value }));
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      {/* 头部：标题与材质选择 */}
      <div className="bg-indigo-50 p-4 border-b border-indigo-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Calculator className="w-5 h-5 text-indigo-600" />
          <h3 className="font-bold text-indigo-900">柜体耗材估算 (分板建模)</h3>
        </div>
        <div className="flex items-center gap-1.5 bg-white/50 px-2 py-1 rounded-lg border border-indigo-100 shadow-inner">
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
        {/* 基础外轮廓尺寸 */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">宽度 (W, mm)</label>
            <input 
              type="text" 
              inputMode="decimal"
              value={params.width}
              onChange={e => handleChange('width', e.target.value)}
              className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm font-medium focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none transition-all"
            />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">深度 (D, mm)</label>
            <input 
              type="text" 
              inputMode="decimal"
              value={params.depth}
              onChange={e => handleChange('depth', e.target.value)}
              className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm font-medium focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none transition-all"
            />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">高度 (H, mm)</label>
            <input 
              type="text" 
              inputMode="decimal"
              value={params.height}
              onChange={e => handleChange('height', e.target.value)}
              className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm font-medium focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none transition-all"
            />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">柜子层数 (横板数)</label>
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

        {/* 板材与打印参数 */}
        <div className="grid grid-cols-2 gap-3 pt-2 border-t border-gray-50">
           <div className="space-y-1">
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">板材厚度 (T, mm)</label>
            <div className="relative">
              <Ruler className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-gray-400" />
              <input 
                type="text" 
                inputMode="decimal"
                value={params.wallThickness}
                onChange={e => handleChange('wallThickness', e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 rounded-lg pl-8 pr-3 py-2 text-sm font-medium focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none transition-all"
              />
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">内部填充 (%)</label>
            <input 
              type="text" 
              inputMode="numeric"
              value={params.infill}
              onChange={e => handleChange('infill', e.target.value)}
              className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm font-medium focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none transition-all"
            />
          </div>
          
          <div className="space-y-1 col-span-2">
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1">
              补偿系数 (Compensation Factor) 
              <span className="text-[9px] font-normal lowercase bg-gray-100 px-1 rounded">用于对齐切片软件损耗</span>
            </label>
            <div className="relative">
              <Percent className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-gray-400" />
              <input 
                type="text" 
                inputMode="decimal"
                value={params.compensation}
                onChange={e => handleChange('compensation', e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 rounded-lg pl-8 pr-3 py-2 text-sm font-medium focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none transition-all"
                placeholder="例如 1.15"
              />
            </div>
          </div>
        </div>

        {/* 估算结果显示 */}
        <div className="mt-4 p-4 bg-indigo-600 rounded-xl text-white shadow-lg shadow-indigo-100 flex items-center justify-between transition-all">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-lg">
              <Weight className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] text-indigo-100 uppercase font-bold tracking-widest">预计总用量 ({params.material})</p>
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
        <p className="text-[9px] text-gray-400 text-center italic">注：体积基于 [背板 + 双侧板 + 层板] 几何求和计算</p>
      </div>
    </div>
  );
};

export default CabinetCalculator;