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
  // helper to parse string to number safely
  const parse = (val: string) => parseFloat(val) || 0;

  // 基础参数 - 升级默认补偿值和材质状态
  const [params, setParams] = useState({
    width: '100',
    depth: '100',
    height: '150',
    shelves: '5',         
    wallThickness: '2.9', 
    wallLoops: '2',       
    infill: '15',         
    cabinetMaterial: 'PLA',    // 柜体默认 PLA
    drawerMaterial: 'PETG',     // 抽屉默认 PETG
    cabinetCompensation: '1.67', // 更新默认值
    drawerCompensation: '1.34'   // 更新默认值
  });

  // 抽屉几何参数
  const [hasDrawers, setHasDrawers] = useState(false);
  const [drawerParams, setDrawerParams] = useState({
    quantity: '5',
    thickness: '2.0',
    height: '' 
  });

  const [weightBreakdown, setWeightBreakdown] = useState({
    cabinet: 0,
    drawers: 0,
    total: 0
  });

  // 1. 自动同步抽屉高度
  useEffect(() => {
    const H = parse(params.height);
    const T = parse(params.wallThickness);
    const L = parse(params.shelves);
    
    if (L > 0) {
      const calculatedH = (H - (L + 1) * T) / L;
      setDrawerParams(prev => ({ 
        ...prev, 
        height: calculatedH > 0 ? calculatedH.toFixed(1) : '0' 
      }));
    }
  }, [params.height, params.shelves, params.wallThickness]);

  // 核心工具函数：计算单块板材的物理重量 (不含补偿)
  const calculatePanelRawWeight = (
    w: number, d: number, t: number, 
    wallLoops: number, infillRate: number, 
    density: number
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

    return volumeCm3 * density * effectiveDensityFactor;
  };

  useEffect(() => {
    const W = parse(params.width);
    const D = parse(params.depth);
    const H = parse(params.height);
    const T = parse(params.wallThickness);
    const L = parse(params.shelves);
    const wallLoops = parse(params.wallLoops);
    const infillRate = parse(params.infill) / 100;
    
    // 密度解耦
    const cabDensity = MATERIAL_DENSITIES[params.cabinetMaterial] || 1.24;
    const draDensity = MATERIAL_DENSITIES[params.drawerMaterial] || 1.27;
    
    // 补偿解耦
    const FCab = parse(params.cabinetCompensation);
    const FDra = parse(params.drawerCompensation);

    // 2. 计算柜体总重 (Shell Material + FCab)
    const cabinetPanels = [
      { w: W, d: H, t: T }, // 背板
      { w: D, d: H, t: T * 2 }, // 双侧板
      { w: W, d: D, t: T * L } // 横板
    ];

    const rawCabinetWeight = cabinetPanels.reduce((acc, p) => 
      acc + calculatePanelRawWeight(p.w, p.d, p.t, wallLoops, infillRate, cabDensity), 0
    );
    const finalCabinetWeight = rawCabinetWeight * FCab;

    // 3. 抽屉重量逻辑 (Drawer Material + FDra)
    let finalDrawersWeight = 0;
    if (hasDrawers) {
      const dH = parse(drawerParams.height);
      const drawerQty = parse(drawerParams.quantity);
      const dT = parse(drawerParams.thickness);

      const dW = Math.max(0, W - (2 * T) - 2);
      const dD = Math.max(0, D - T - 1);

      if (dW > 0 && dD > 0 && dH > 0) {
        const rawSingleDrawerWeight = 
          calculatePanelRawWeight(dW, dD, dT, wallLoops, infillRate, draDensity) + // 底
          calculatePanelRawWeight(dW, dH, dT * 2, wallLoops, infillRate, draDensity) + // 前后
          calculatePanelRawWeight(dD - 2 * dT, dH, dT * 2, wallLoops, infillRate, draDensity); // 左右
        
        finalDrawersWeight = rawSingleDrawerWeight * drawerQty * FDra;
      }
    }

    setWeightBreakdown({
      cabinet: Math.round(finalCabinetWeight),
      drawers: Math.round(finalDrawersWeight),
      total: Math.round(finalCabinetWeight + finalDrawersWeight)
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
          <h3 className="font-bold text-indigo-900">组合柜混合材质估算</h3>
        </div>
        <div className="flex items-center gap-1.5 bg-white/80 px-2 py-1 rounded-lg border border-indigo-100 shadow-sm">
           <span className="text-[9px] font-bold text-indigo-400 uppercase">柜体材质</span>
           <select 
             value={params.cabinetMaterial}
             onChange={(e) => setParams(prev => ({ ...prev, cabinetMaterial: e.target.value }))}
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
            <Ruler className="w-3 h-3" /> 柜体几何 (Shell)
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
            <div className="flex items-center gap-2">
               <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1">
                <Archive className="w-3 h-3" /> 抽屉配置 (Drawers)
              </p>
              {hasDrawers && (
                <div className="flex items-center gap-1.5 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-100">
                  <span className="text-[9px] font-bold text-indigo-400">材质</span>
                  <select 
                    value={params.drawerMaterial}
                    onChange={(e) => setParams(prev => ({ ...prev, drawerMaterial: e.target.value }))}
                    className="bg-transparent text-[10px] font-bold text-indigo-600 outline-none cursor-pointer"
                  >
                    {Object.keys(MATERIAL_DENSITIES).map(m => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>
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
          <div className="space-y-3">
            <div className="grid grid-cols-3 gap-2">
              <div className="space-y-1">
                <label className="text-[8px] text-gray-500 font-medium ml-1">柜壁厚 (mm)</label>
                <input type="text" inputMode="decimal" value={params.wallThickness} onChange={e => handleChange('wallThickness', e.target.value)} className="w-full bg-gray-50 border border-gray-200 rounded-lg px-2 py-1.5 text-xs outline-none" />
              </div>
              <div className="space-y-1">
                <label className="text-[8px] text-gray-500 font-medium ml-1">墙层数</label>
                <input type="text" inputMode="numeric" value={params.wallLoops} onChange={e => handleChange('wallLoops', e.target.value)} className="w-full bg-gray-50 border border-gray-200 rounded-lg px-2 py-1.5 text-xs outline-none" />
              </div>
              <div className="space-y-1">
                <label className="text-[8px] text-gray-500 font-medium ml-1">填充率 (%)</label>
                <input type="text" inputMode="numeric" value={params.infill} onChange={e => handleChange('infill', e.target.value)} className="w-full bg-gray-50 border border-gray-200 rounded-lg px-2 py-1.5 text-xs outline-none" />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[8px] text-indigo-500 font-bold ml-1">柜体补偿 (FCab)</label>
                <input 
                  type="text" inputMode="decimal" 
                  value={params.cabinetCompensation} 
                  onChange={e => handleChange('cabinetCompensation', e.target.value)} 
                  className="w-full bg-indigo-50/30 border border-indigo-100 rounded-lg px-3 py-1.5 text-xs font-bold text-indigo-600 outline-none" 
                />
              </div>
              <div className="space-y-1">
                <label className="text-[8px] text-emerald-500 font-bold ml-1">抽屉补偿 (FDra)</label>
                <input 
                  type="text" inputMode="decimal" 
                  value={params.drawerCompensation} 
                  onChange={e => handleChange('drawerCompensation', e.target.value)} 
                  className="w-full bg-emerald-50/30 border border-emerald-100 rounded-lg px-3 py-1.5 text-xs font-bold text-emerald-600 outline-none" 
                />
              </div>
            </div>
          </div>
        </div>

        {/* Result & Actions */}
        <div className="space-y-3">
           <div className="flex justify-between text-[10px] font-bold text-gray-400 px-1 uppercase tracking-tighter">
              <span>总估算: <b className="text-gray-900">{weightBreakdown.total}g</b></span>
              <span>材质: {params.cabinetMaterial}{hasDrawers ? ` + ${params.drawerMaterial}` : ''}</span>
           </div>
           
           <div className={`grid gap-2 ${hasDrawers ? 'grid-cols-2' : 'grid-cols-1'}`}>
              <button 
                onClick={() => onDeduct(weightBreakdown.cabinet)}
                className="bg-indigo-600 text-white p-3 rounded-xl shadow-lg shadow-indigo-100 transition-all active:scale-95 group flex flex-col items-center justify-center relative overflow-hidden"
              >
                <span className="text-[9px] text-indigo-200 uppercase font-bold mb-1 group-hover:translate-y-[-2px] transition-transform">扣除柜体重量</span>
                <div className="flex items-center gap-1 font-black text-lg">
                  {weightBreakdown.cabinet}<span className="text-[10px] font-normal">g</span>
                </div>
                <div className="absolute right-1 bottom-1 opacity-20"><Box className="w-8 h-8" /></div>
              </button>

              {hasDrawers && (
                <button 
                  onClick={() => onDeduct(weightBreakdown.drawers)}
                  className="bg-emerald-600 text-white p-3 rounded-xl shadow-lg shadow-emerald-100 transition-all active:scale-95 group flex flex-col items-center justify-center relative overflow-hidden"
                >
                  <span className="text-[9px] text-emerald-200 uppercase font-bold mb-1 group-hover:translate-y-[-2px] transition-transform">扣除抽屉重量</span>
                  <div className="flex items-center gap-1 font-black text-lg">
                    {weightBreakdown.drawers}<span className="text-[10px] font-normal">g</span>
                  </div>
                  <div className="absolute right-1 bottom-1 opacity-20"><Archive className="w-8 h-8" /></div>
                </button>
              )}
           </div>
        </div>
        
        <p className="text-[9px] text-indigo-400 text-center leading-relaxed italic">
          混合材质模式：柜体({params.cabinetMaterial})与抽屉({params.drawerMaterial})密度已自动分离。
        </p>
      </div>
    </div>
  );
};

export default CabinetCalculator;