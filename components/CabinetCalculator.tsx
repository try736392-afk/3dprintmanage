
import React, { useState, useEffect } from 'react';
import { Calculator, Weight, Layers, ChevronRight, Box, Percent, Ruler, Disc, ToggleLeft, ToggleRight, Archive } from 'lucide-react';

interface CabinetCalculatorProps {
  onDeduct: (weight: number) => void;
}

const MATERIAL_DENSITIES: Record<string, number> = {
  'PLA': 1.24,
  'PETG': 1.27,
  'ABS': 1.04,
  'TPU': 1.21
};

const LINE_WIDTH = 0.42;

const CabinetCalculator: React.FC<CabinetCalculatorProps> = ({ onDeduct }) => {
  // helper to parse string to number safely, moved to component scope for JSX access
  const parse = (val: string) => parseFloat(val) || 0;

  // 基础参数
  const [params, setParams] = useState({
    width: '100',
    depth: '100',
    height: '150',
    shelves: '2',         
    wallThickness: '2.4', 
    wallLoops: '3',       
    infill: '15',         
    material: 'PLA',
    compensation: '1.15'  
  });

  // 抽屉参数
  const [hasDrawers, setHasDrawers] = useState(false);
  const [drawerParams, setDrawerParams] = useState({
    quantity: '2',
    thickness: '2.0',
    height: '' // 初始为空，由逻辑自动计算默认值
  });

  const [weightBreakdown, setWeightBreakdown] = useState({
    cabinet: 0,
    drawers: 0,
    total: 0
  });

  // 工具函数：计算单块板材的重量
  const calculatePanelWeight = (
    w: number, d: number, t: number, 
    wallLoops: number, infillRate: number, 
    density: number, compensation: number
  ) => {
    if (w <= 0 || d <= 0 || t <= 0) return 0;
    
    const volumeMm3 = w * d * t;
    const volumeCm3 = volumeMm3 / 1000;
    
    const solidThickness = wallLoops * LINE_WIDTH * 2;
    let effectiveDensityFactor = 1.0;

    if (t > solidThickness) {
      const solidRatio = solidThickness / t;
      const infillRatio = (t - solidThickness) / t;
      effectiveDensityFactor = (solidRatio * 1.0) + (infillRatio * infillRate);
    }

    return volumeCm3 * density * effectiveDensityFactor * compensation;
  };

  useEffect(() => {
    // 柜体原始参数
    const W = parse(params.width);
    const D = parse(params.depth);
    const H = parse(params.height);
    const T = parse(params.wallThickness);
    const L = parse(params.shelves);
    const wallLoops = parse(params.wallLoops);
    const infillRate = parse(params.infill) / 100;
    const density = MATERIAL_DENSITIES[params.material] || 1.24;
    const F = parse(params.compensation);

    // 1. 计算柜体重量
    const cabinetPanels = [
      { w: W, d: H, t: T }, // 背板
      { w: D, d: H, t: T * 2 }, // 双侧板 (简化计算)
      { w: W, d: D, t: T * L } // 横板 (底板+隔板)
    ];

    const cabinetWeight = cabinetPanels.reduce((acc, p) => 
      acc + calculatePanelWeight(p.w, p.d, p.t, wallLoops, infillRate, density, F), 0
    );

    // 2. 抽屉逻辑处理
    let drawersWeight = 0;
    if (hasDrawers) {
      // 默认高度估算：(柜子高度 - (层数+1)*柜壁厚) / 层数
      const defaultDrawerH = L > 0 ? (H - (L + 1) * T) / L : 0;
      const currentDrawerH = drawerParams.height === '' ? defaultDrawerH : parse(drawerParams.height);
      
      const drawerQty = parse(drawerParams.quantity);
      const dT = parse(drawerParams.thickness);

      // 抽屉外径尺寸推导 (Clearance 2mm width, 1mm depth)
      const dW = Math.max(0, W - (2 * T) - 2);
      const dD = Math.max(0, D - T - 1);
      const dH = currentDrawerH;

      if (dW > 0 && dD > 0 && dH > 0) {
        // 单个抽屉体积分解: 1底 + 2前/后 + 2侧
        const singleDrawerWeight = 
          calculatePanelWeight(dW, dD, dT, wallLoops, infillRate, density, F) + // 底
          calculatePanelWeight(dW, dH, dT * 2, wallLoops, infillRate, density, F) + // 前后
          calculatePanelWeight(dD - 2 * dT, dH, dT * 2, wallLoops, infillRate, density, F); // 左右
        
        drawersWeight = singleDrawerWeight * drawerQty;
      }

      // 如果高度输入为空，回填默认显示
      if (drawerParams.height === '' && defaultDrawerH > 0) {
        setDrawerParams(prev => ({ ...prev, height: defaultDrawerH.toFixed(1) }));
      }
    }

    setWeightBreakdown({
      cabinet: Math.round(cabinetWeight),
      drawers: Math.round(drawersWeight),
      total: Math.round(cabinetWeight + drawersWeight)
    });

  }, [params, hasDrawers, drawerParams]);

  const handleChange = (key: keyof typeof params, value: string) => {
    if (value === '' || /^\d*\.?\d*$/.test(value)) {
      setParams(prev => ({ ...prev, [key]: value }));
    }
  };

  const handleDrawerChange = (key: keyof typeof drawerParams, value: string) => {
    if (value === '' || /^\d*\.?\d*$/.test(value)) {
      setDrawerParams(prev => ({ ...prev, [key]: value }));
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      {/* Header */}
      <div className="bg-indigo-50 p-4 border-b border-indigo-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-indigo-600 rounded-lg">
            <Calculator className="w-4 h-4 text-white" />
          </div>
          <h3 className="font-bold text-indigo-900">组合柜耗材智能估算</h3>
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
      
      <div className="p-5 space-y-5">
        {/* 1. Cabinet Geometry */}
        <div className="space-y-2">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1">
            <Ruler className="w-3 h-3" /> 柜体几何 (Cabinet)
          </p>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[9px] text-gray-500 font-medium ml-1">宽度 (W)</label>
              <input type="text" inputMode="decimal" value={params.width} onChange={e => handleChange('width', e.target.value)} className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5 text-sm font-medium outline-none" />
            </div>
            <div className="space-y-1">
              <label className="text-[9px] text-gray-500 font-medium ml-1">深度 (D)</label>
              <input type="text" inputMode="decimal" value={params.depth} onChange={e => handleChange('depth', e.target.value)} className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5 text-sm font-medium outline-none" />
            </div>
            <div className="space-y-1">
              <label className="text-[9px] text-gray-500 font-medium ml-1">高度 (H)</label>
              <input type="text" inputMode="decimal" value={params.height} onChange={e => handleChange('height', e.target.value)} className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5 text-sm font-medium outline-none" />
            </div>
            <div className="space-y-1">
              <label className="text-[9px] text-gray-500 font-medium ml-1">柜子层数 (L)</label>
              <input type="text" inputMode="numeric" value={params.shelves} onChange={e => handleChange('shelves', e.target.value)} className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5 text-sm font-medium outline-none" />
            </div>
          </div>
        </div>

        {/* 2. Drawer Configuration */}
        <div className="pt-2 border-t border-gray-50 space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1">
              <Archive className="w-3 h-3" /> 抽屉配置 (Drawers)
            </p>
            <button 
              onClick={() => setHasDrawers(!hasDrawers)}
              className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold transition-all ${hasDrawers ? 'bg-indigo-600 text-white shadow-sm' : 'bg-gray-100 text-gray-400'}`}
            >
              {hasDrawers ? <ToggleRight className="w-4 h-4" /> : <ToggleLeft className="w-4 h-4" />}
              {hasDrawers ? '已启用' : '未启用'}
            </button>
          </div>

          {hasDrawers && (
            <div className="grid grid-cols-3 gap-3 animate-in fade-in slide-in-from-top-2">
              <div className="space-y-1">
                <label className="text-[9px] text-gray-500 font-medium ml-1">抽屉数</label>
                <input type="text" inputMode="numeric" value={drawerParams.quantity} onChange={e => handleDrawerChange('quantity', e.target.value)} className="w-full bg-indigo-50/50 border border-indigo-100 rounded-lg px-2 py-1.5 text-sm font-bold text-indigo-700 outline-none" />
              </div>
              <div className="space-y-1">
                <label className="text-[9px] text-gray-500 font-medium ml-1">抽屉壁厚</label>
                <input type="text" inputMode="decimal" value={drawerParams.thickness} onChange={e => handleDrawerChange('thickness', e.target.value)} className="w-full bg-indigo-50/50 border border-indigo-100 rounded-lg px-2 py-1.5 text-sm font-bold text-indigo-700 outline-none" />
              </div>
              <div className="space-y-1">
                <label className="text-[9px] text-gray-500 font-medium ml-1">抽屉高度</label>
                <input type="text" inputMode="decimal" value={drawerParams.height} onChange={e => handleDrawerChange('height', e.target.value)} className="w-full bg-indigo-50/50 border border-indigo-100 rounded-lg px-2 py-1.5 text-sm font-bold text-indigo-700 outline-none" />
              </div>
            </div>
          )}
        </div>

        {/* 3. Slicer Settings */}
        <div className="space-y-2 pt-2 border-t border-gray-50">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1">
            <Disc className="w-3 h-3" /> 切片设置 (Slicer)
          </p>
          <div className="grid grid-cols-4 gap-2">
            <div className="space-y-1 col-span-1">
              <label className="text-[8px] text-gray-500 font-medium ml-1">柜壁厚</label>
              <input type="text" inputMode="decimal" value={params.wallThickness} onChange={e => handleChange('wallThickness', e.target.value)} className="w-full bg-gray-50 border border-gray-200 rounded-lg px-2 py-1.5 text-xs outline-none" />
            </div>
            <div className="space-y-1 col-span-1">
              <label className="text-[8px] text-gray-500 font-medium ml-1">墙层数</label>
              <input type="text" inputMode="numeric" value={params.wallLoops} onChange={e => handleChange('wallLoops', e.target.value)} className="w-full bg-gray-50 border border-gray-200 rounded-lg px-2 py-1.5 text-xs outline-none" />
            </div>
            <div className="space-y-1 col-span-1">
              <label className="text-[8px] text-gray-500 font-medium ml-1">填充%</label>
              <input type="text" inputMode="numeric" value={params.infill} onChange={e => handleChange('infill', e.target.value)} className="w-full bg-gray-50 border border-gray-200 rounded-lg px-2 py-1.5 text-xs outline-none" />
            </div>
            <div className="space-y-1 col-span-1">
              <label className="text-[8px] text-gray-500 font-medium ml-1">补偿 F</label>
              <input type="text" inputMode="decimal" value={params.compensation} onChange={e => handleChange('compensation', e.target.value)} className="w-full bg-gray-50 border border-gray-200 rounded-lg px-2 py-1.5 text-xs outline-none" />
            </div>
          </div>
        </div>

        {/* Result Breakdown */}
        <div className="space-y-2">
           <div className="flex justify-between text-[10px] font-bold text-gray-400 px-1 uppercase tracking-tighter">
              <span>柜体: {weightBreakdown.cabinet}g</span>
              {hasDrawers && <span>抽屉: {weightBreakdown.drawers}g</span>}
           </div>
           
           <div className="p-4 bg-indigo-600 rounded-xl text-white shadow-lg shadow-indigo-100 flex items-center justify-between group">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/20 rounded-lg group-hover:bg-white/30 transition-colors">
                <Weight className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[10px] text-indigo-100 uppercase font-bold tracking-widest">最终总估算量</p>
                <p className="text-2xl font-black leading-none mt-1">{weightBreakdown.total} <span className="text-sm font-normal">g</span></p>
              </div>
            </div>
            <button 
              onClick={() => onDeduct(weightBreakdown.total)}
              className="bg-white text-indigo-600 px-4 py-2 rounded-lg font-bold text-sm hover:bg-indigo-50 transition-all active:scale-95 flex items-center gap-1 shadow-sm"
            >
              一键扣除 <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
        
        <p className="text-[9px] text-indigo-400 text-center leading-relaxed">
          抽屉外宽推导: W-{2*parse(params.wallThickness)}-2mm | 抽屉深度推导: D-{parse(params.wallThickness)}-1mm
        </p>
      </div>
    </div>
  );
};

export default CabinetCalculator;
