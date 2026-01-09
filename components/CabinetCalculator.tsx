import React, { useState, useEffect } from 'react';
import { Calculator, Weight, Layers, ChevronRight, Box, Percent, Ruler, Disc } from 'lucide-react';

interface CabinetCalculatorProps {
  onDeduct: (weight: number) => void;
}

const MATERIAL_DENSITIES: Record<string, number> = {
  'PLA': 1.24,
  'PETG': 1.27,
  'ABS': 1.04,
  'TPU': 1.21
};

// 3D 打印常量
const LINE_WIDTH = 0.42; // Bambu Studio 默认 0.4 喷嘴的线宽通常为 0.42mm

const CabinetCalculator: React.FC<CabinetCalculatorProps> = ({ onDeduct }) => {
  // 状态管理：使用字符串以解决输入框“前导零”和“无法删除为空”的问题
  const [params, setParams] = useState({
    width: '100',
    depth: '100',
    height: '150',
    shelves: '2',         // 柜子层数 (横板数量)
    wallThickness: '2.4', // 面板厚度 (mm)
    wallLoops: '3',       // 墙层数 (Wall Loops) - 新增
    infill: '15',         // 填充率 (%) - 对应切片软件设置
    material: 'PLA',
    compensation: '1.15'  // 最终补偿系数 (裙边、擦嘴、损耗等)
  });

  const [estimatedWeight, setEstimatedWeight] = useState(0);

  useEffect(() => {
    // 转换函数
    const parse = (val: string) => parseFloat(val) || 0;

    // 获取输入数值 (mm)
    const W = parse(params.width);
    const D = parse(params.depth);
    const H = parse(params.height);
    const T = parse(params.wallThickness);
    const L = parse(params.shelves);
    const wallLoops = parse(params.wallLoops);
    const infillRate = parse(params.infill) / 100;
    const density = MATERIAL_DENSITIES[params.material] || 1.24;
    const F = parse(params.compensation);

    /**
     * 1. 计算总几何体积 (mm³)
     * 基于板材拼接逻辑：[背板 + 双侧板 + 横板]
     */
    const vol_back = W * H * T;
    const vol_sides = D * H * T * 2;
    const vol_shelves = W * D * T * L;
    const totalGeometricVolumeMm3 = vol_back + vol_sides + vol_shelves;
    
    // 转换为 cm³ (1000 mm³ = 1 cm³)
    const totalVolumeCm3 = totalGeometricVolumeMm3 / 1000;

    /**
     * 2. 核心算法：Smart Density (皮肉分离算法)
     * 计算面板的“有效填充系数”
     * 假设面板两面都有墙 (Wall Loops)
     */
    const solidThickness = wallLoops * LINE_WIDTH * 2;
    let effectiveDensityFactor = 1.0;

    if (T > solidThickness && T > 0) {
      // 如果面板厚度大于总墙厚，则内部有填充空间
      const solidRatio = solidThickness / T;
      const infillRatio = (T - solidThickness) / T;
      // 有效密度系数 = (实心部分比例 * 100%) + (填充部分比例 * 设定填充率)
      effectiveDensityFactor = (solidRatio * 1.0) + (infillRatio * infillRate);
    } else {
      // 这里的 T 太薄，切片后会是纯实心
      effectiveDensityFactor = 1.0;
    }

    /**
     * 3. 最终重量计算 (g)
     * 重量 = 几何体积 * 材质密度 * 有效密度系数 * 损耗补偿
     */
    const weight = totalVolumeCm3 * density * effectiveDensityFactor * F;
    
    setEstimatedWeight(Math.round(weight));
  }, [params]);

  const handleChange = (key: keyof typeof params, value: string) => {
    if (value === '' || /^\d*\.?\d*$/.test(value)) {
      setParams(prev => ({ ...prev, [key]: value }));
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      {/* 头部：标题与材质选择 */}
      <div className="bg-indigo-50 p-4 border-b border-indigo-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-indigo-600 rounded-lg">
            <Calculator className="w-4 h-4 text-white" />
          </div>
          <h3 className="font-bold text-indigo-900">柜体耗材智能估算</h3>
        </div>
        <div className="flex items-center gap-1.5 bg-white/80 px-2 py-1 rounded-lg border border-indigo-100 shadow-sm">
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
        {/* 1. 几何结构参数 */}
        <div className="space-y-2">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1">
            <Ruler className="w-3 h-3" /> 几何尺寸 (MM)
          </p>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[9px] text-gray-500 font-medium ml-1">总宽度 (W)</label>
              <input 
                type="text" inputMode="decimal"
                value={params.width}
                onChange={e => handleChange('width', e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm font-medium focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none transition-all"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[9px] text-gray-500 font-medium ml-1">总深度 (D)</label>
              <input 
                type="text" inputMode="decimal"
                value={params.depth}
                onChange={e => handleChange('depth', e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm font-medium focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none transition-all"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[9px] text-gray-500 font-medium ml-1">总高度 (H)</label>
              <input 
                type="text" inputMode="decimal"
                value={params.height}
                onChange={e => handleChange('height', e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm font-medium focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none transition-all"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[9px] text-gray-500 font-medium ml-1">柜子层数 (横板)</label>
              <div className="relative">
                <Layers className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-gray-400" />
                <input 
                  type="text" inputMode="numeric"
                  value={params.shelves}
                  onChange={e => handleChange('shelves', e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-lg pl-8 pr-3 py-2 text-sm font-medium focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none transition-all"
                />
              </div>
            </div>
          </div>
        </div>

        {/* 2. 切片参数 (Smart Density 核心) */}
        <div className="space-y-2 pt-2 border-t border-gray-50">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1">
            <Disc className="w-3 h-3" /> 切片设置 (Slicer Settings)
          </p>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[9px] text-gray-500 font-medium ml-1">面板厚度 (T, mm)</label>
              <input 
                type="text" inputMode="decimal"
                value={params.wallThickness}
                onChange={e => handleChange('wallThickness', e.target.value)}
                className="w-full bg-gray-100 border border-gray-200 rounded-lg px-3 py-2 text-sm font-bold text-indigo-700 outline-none"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[9px] text-gray-500 font-medium ml-1">墙层数 (Loops)</label>
              <input 
                type="text" inputMode="numeric"
                value={params.wallLoops}
                onChange={e => handleChange('wallLoops', e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm font-medium outline-none"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[9px] text-gray-500 font-medium ml-1">填充率 (Infill, %)</label>
              <div className="relative">
                <Percent className="absolute right-3 top-2.5 w-3 h-3 text-gray-300" />
                <input 
                  type="text" inputMode="numeric"
                  value={params.infill}
                  onChange={e => handleChange('infill', e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm font-medium outline-none"
                />
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-[9px] text-gray-500 font-medium ml-1">补偿系数 (F)</label>
              <input 
                type="text" inputMode="decimal"
                value={params.compensation}
                onChange={e => handleChange('compensation', e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm font-medium outline-none"
                placeholder="1.15"
              />
            </div>
          </div>
        </div>

        {/* 结果显示 */}
        <div className="mt-4 p-4 bg-indigo-600 rounded-xl text-white shadow-lg shadow-indigo-100 flex items-center justify-between group">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-lg group-hover:bg-white/30 transition-colors">
              <Weight className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] text-indigo-100 uppercase font-bold tracking-widest">最终估算用量</p>
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
        
        <div className="bg-indigo-50/50 p-2 rounded-lg border border-indigo-100/50">
          <p className="text-[9px] text-indigo-400 text-center leading-relaxed">
            算法已根据 {params.wallLoops} 圈墙 ({params.wallLoops}x{LINE_WIDTH}mm x 2面) 自动补偿实心占比。<br/>
            无需根据实心程度手动调整填充率。
          </p>
        </div>
      </div>
    </div>
  );
};

export default CabinetCalculator;