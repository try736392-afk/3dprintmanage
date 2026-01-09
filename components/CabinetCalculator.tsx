import React, { useState, useEffect } from 'react';
import { Calculator, Weight, Layers, ChevronRight, Box, Percent, Ruler, Disc, ToggleLeft, ToggleRight, Archive, Droplets, Clock, Zap, Coins } from 'lucide-react';

interface CabinetCalculatorProps {
  onDeduct: (weight: number) => void;
}

// 材质预设数据库 (密度)
const MATERIAL_PRESETS: Record<string, number> = {
  'PLA Basic/Matte': 1.24,
  'PLA Silk/Metal': 1.31,
  'PLA-CF': 1.22,
  'PETG Basic': 1.27,
  'PETG-CF': 1.29,
  'ABS': 1.05,
  'TPU': 1.21
};

// 获取材质推荐功率 (基于打印温度与热床负荷)
const getPowerForMaterial = (material: string): number => {
  if (material.includes('PLA')) return 150;
  if (material.includes('PETG')) return 170;
  if (material.includes('ABS') || material.includes('ASA')) return 280;
  if (material.includes('TPU')) return 150;
  return 150; // 默认值
};

const LINE_WIDTH = 0.42;

const CabinetCalculator: React.FC<CabinetCalculatorProps> = ({ onDeduct }) => {
  // helper to parse string to number safely
  const parse = (val: string) => parseFloat(val) || 0;

  // 基础参数状态
  const [params, setParams] = useState({
    width: '100',
    depth: '100',
    height: '150',
    shelves: '5',         
    wallThickness: '2.9', 
    wallLoops: '2',       
    infill: '15',         
    cabinetMaterial: 'PLA Basic/Matte',
    cabinetDensity: '1.24',  
    cabinetPower: '150',     // 柜体打印功率
    drawerMaterial: 'PETG Basic',
    drawerDensity: '1.27',   
    drawerPower: '170',      // 抽屉打印功率
    cabinetCompensation: '1.67',
    drawerCompensation: '1.34',
    printEfficiency: '44',   // 克/小时 (默认值已更新为 44)
    elecRate: '0.6'          // 元/度
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

  const [estimates, setEstimates] = useState({
    hours: 0,
    kwh: 0,
    cost: 0
  });

  // 1. 抽屉数量与柜子层数自动同步
  useEffect(() => {
    setDrawerParams(prev => ({ 
      ...prev, 
      quantity: params.shelves 
    }));
  }, [params.shelves]);

  // 2. 自动同步抽屉高度
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

  // 核心工具函数：计算单块板材的物理重量
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
    
    const cabDensity = parse(params.cabinetDensity);
    const draDensity = parse(params.drawerDensity);
    
    const FCab = parse(params.cabinetCompensation);
    const FDra = parse(params.drawerCompensation);

    // 计算柜体重量
    const cabinetPanels = [
      { w: W, d: H, t: T }, 
      { w: D, d: H, t: T * 2 }, 
      { w: W, d: D, t: T * L } 
    ];

    const rawCabinetWeight = cabinetPanels.reduce((acc, p) => 
      acc + calculatePanelRawWeight(p.w, p.d, p.t, wallLoops, infillRate, cabDensity), 0
    );
    const finalCabinetWeight = rawCabinetWeight * FCab;

    // 计算抽屉重量
    let finalDrawersWeight = 0;
    if (hasDrawers) {
      const dH = parse(drawerParams.height);
      const drawerQty = parse(drawerParams.quantity);
      const dT = parse(drawerParams.thickness);

      const dW = Math.max(0, W - (2 * T) - 2);
      const dD = Math.max(0, D - T - 1);

      if (dW > 0 && dD > 0 && dH > 0) {
        const rawSingleDrawerWeight = 
          calculatePanelRawWeight(dW, dD, dT, wallLoops, infillRate, draDensity) + 
          calculatePanelRawWeight(dW, dH, dT * 2, wallLoops, infillRate, draDensity) + 
          calculatePanelRawWeight(dD - 2 * dT, dH, dT * 2, wallLoops, infillRate, draDensity); 
        
        finalDrawersWeight = rawSingleDrawerWeight * drawerQty * FDra;
      }
    }

    const totalWeight = finalCabinetWeight + finalDrawersWeight;
    setWeightBreakdown({
      cabinet: Math.round(finalCabinetWeight),
      drawers: Math.round(finalDrawersWeight),
      total: Math.round(totalWeight)
    });

    // 智能分材质耗能估算
    const efficiency = parse(params.printEfficiency);
    const rate = parse(params.elecRate);
    const cabPower = parse(params.cabinetPower);
    const draPower = parse(params.drawerPower);

    if (efficiency > 0 && totalWeight > 0) {
      // 分别计算柜体和抽屉的耗时
      const cabHours = finalCabinetWeight / efficiency;
      const draHours = hasDrawers ? (finalDrawersWeight / efficiency) : 0;
      
      const totalHours = cabHours + draHours;
      
      // 分别计算能耗并求和
      const cabKwh = (cabHours * cabPower) / 1000;
      const draKwh = (draHours * draPower) / 1000;
      
      const totalKwh = cabKwh + draKwh;
      const totalCost = totalKwh * rate;
      
      setEstimates({ 
        hours: totalHours, 
        kwh: totalKwh, 
        cost: totalCost 
      });
    } else {
      setEstimates({ hours: 0, kwh: 0, cost: 0 });
    }

  }, [params, hasDrawers, drawerParams]);

  const handleChange = (key: keyof typeof params, value: string) => {
    if (value === '' || /^\d*\.?\d*$/.test(value)) {
      setParams(prev => ({ ...prev, [key]: value }));
    }
  };

  const handleMaterialChange = (type: 'cabinet' | 'drawer', material: string) => {
    const density = MATERIAL_PRESETS[material] || 1.24;
    const power = getPowerForMaterial(material);
    
    setParams(prev => ({
      ...prev,
      [`${type}Material`]: material,
      [`${type}Density`]: density.toString(),
      [`${type}Power`]: power.toString()
    }));
  };

  const handleDrawerChange = (key: keyof typeof drawerParams, value: string) => {
    if (value === '' || /^\d*\.?\d*$/.test(value)) {
      setDrawerParams(prev => ({ ...prev, [key]: value }));
    }
  };

  const formatTime = (hours: number) => {
    const h = Math.floor(hours);
    const m = Math.round((hours - h) * 60);
    return h > 0 ? `${h} 小时 ${m} 分` : `${m} 分钟`;
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      {/* Header */}
      <div className="bg-indigo-50 p-4 border-b border-indigo-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-indigo-600 rounded-lg">
            <Calculator className="w-4 h-4 text-white" />
          </div>
          <h3 className="font-bold text-indigo-900">组合柜高精度材质估算</h3>
        </div>
      </div>
      
      <div className="p-5 space-y-5">
        {/* 1. Cabinet Geometry & Material */}
        <div className="space-y-3">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1">
            <Ruler className="w-3 h-3" /> 柜体材质与功率 (Cabinet)
          </p>
          
          <div className="grid grid-cols-1 gap-2 p-3 bg-gray-50/50 rounded-xl border border-gray-100">
             <div className="space-y-1">
                <label className="text-[9px] text-gray-500 font-bold ml-1">柜体材质预设</label>
                <select 
                  value={params.cabinetMaterial}
                  onChange={(e) => handleMaterialChange('cabinet', e.target.value)}
                  className="w-full bg-white border border-gray-200 rounded-lg px-2 py-1.5 text-[11px] font-bold text-indigo-600 outline-none"
                >
                  {Object.keys(MATERIAL_PRESETS).map(m => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
             </div>
             <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                    <label className="text-[9px] text-gray-500 font-bold ml-1">密度 (g/cm³)</label>
                    <input 
                      type="text" inputMode="decimal"
                      value={params.cabinetDensity}
                      onChange={e => handleChange('cabinetDensity', e.target.value)}
                      className="w-full bg-white border border-gray-200 rounded-lg px-2 py-1.5 text-[11px] font-mono font-bold text-gray-700 outline-none"
                    />
                </div>
                <div className="space-y-1">
                    <label className="text-[9px] text-gray-500 font-bold ml-1">打印功率 (W)</label>
                    <input 
                      type="text" inputMode="numeric"
                      value={params.cabinetPower}
                      onChange={e => handleChange('cabinetPower', e.target.value)}
                      className="w-full bg-white border border-indigo-200 rounded-lg px-2 py-1.5 text-[11px] font-mono font-bold text-indigo-700 outline-none"
                    />
                </div>
             </div>
          </div>

          <div className="grid grid-cols-2 gap-3 px-1">
            <div className="space-y-1">
              <label className="text-[9px] text-gray-400 font-medium ml-1">宽度 (W)</label>
              <input type="text" inputMode="decimal" value={params.width} onChange={e => handleChange('width', e.target.value)} className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5 text-sm font-medium outline-none" />
            </div>
            <div className="space-y-1">
              <label className="text-[9px] text-gray-400 font-medium ml-1">深度 (D)</label>
              <input type="text" inputMode="decimal" value={params.depth} onChange={e => handleChange('depth', e.target.value)} className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5 text-sm font-medium outline-none" />
            </div>
            <div className="space-y-1">
              <label className="text-[9px] text-gray-400 font-medium ml-1">高度 (H)</label>
              <input type="text" inputMode="decimal" value={params.height} onChange={e => handleChange('height', e.target.value)} className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5 text-sm font-medium outline-none" />
            </div>
            <div className="space-y-1">
              <label className="text-[9px] text-gray-400 font-medium ml-1">柜子层数 (L)</label>
              <input type="text" inputMode="numeric" value={params.shelves} onChange={e => handleChange('shelves', e.target.value)} className="w-full bg-indigo-50 border border-indigo-200 rounded-lg px-3 py-1.5 text-sm font-bold text-indigo-700 outline-none" />
            </div>
          </div>
        </div>

        {/* 2. Drawer Configuration */}
        <div className="pt-2 border-t border-gray-50 space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1">
              <Archive className="w-3 h-3" /> 抽屉配置与功率 (Drawers)
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
            <div className="space-y-3 animate-in fade-in slide-in-from-top-2">
              <div className="grid grid-cols-1 gap-2 p-3 bg-emerald-50/30 rounded-xl border border-emerald-100/50">
                <div className="space-y-1">
                    <label className="text-[9px] text-emerald-600 font-bold ml-1">抽屉材质预设</label>
                    <select 
                      value={params.drawerMaterial}
                      onChange={(e) => handleMaterialChange('drawer', e.target.value)}
                      className="w-full bg-white border border-emerald-100 rounded-lg px-2 py-1.5 text-[11px] font-bold text-emerald-700 outline-none"
                    >
                      {Object.keys(MATERIAL_PRESETS).map(m => (
                        <option key={m} value={m}>{m}</option>
                      ))}
                    </select>
                </div>
                <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                        <label className="text-[9px] text-emerald-600 font-bold ml-1">密度</label>
                        <input 
                          type="text" inputMode="decimal"
                          value={params.drawerDensity}
                          onChange={e => handleChange('drawerDensity', e.target.value)}
                          className="w-full bg-white border border-emerald-100 rounded-lg px-2 py-1.5 text-[11px] font-mono font-bold text-gray-700 outline-none"
                        />
                    </div>
                    <div className="space-y-1">
                        <label className="text-[9px] text-emerald-600 font-bold ml-1">打印功率 (W)</label>
                        <input 
                          type="text" inputMode="numeric"
                          value={params.drawerPower}
                          onChange={e => handleChange('drawerPower', e.target.value)}
                          className="w-full bg-white border border-emerald-100 rounded-lg px-2 py-1.5 text-[11px] font-mono font-bold text-emerald-700 outline-none"
                        />
                    </div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="text-[9px] text-gray-400 font-medium ml-1">抽屉数</label>
                  <input type="text" inputMode="numeric" value={drawerParams.quantity} onChange={e => handleDrawerChange('quantity', e.target.value)} className="w-full bg-emerald-50 border border-emerald-200 rounded-lg px-2 py-1.5 text-sm font-bold text-emerald-700 outline-none" />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] text-gray-400 font-medium ml-1">板材厚度</label>
                  <input type="text" inputMode="decimal" value={drawerParams.thickness} onChange={e => handleDrawerChange('thickness', e.target.value)} className="w-full bg-white border border-gray-200 rounded-lg px-2 py-1.5 text-sm font-medium outline-none" />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] text-gray-400 font-medium ml-1">计算高度</label>
                  <input type="text" disabled value={drawerParams.height} className="w-full bg-gray-50 border border-gray-200 rounded-lg px-2 py-1.5 text-sm font-bold text-gray-400 outline-none" />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 3. Estimator Global Settings */}
        <div className="space-y-2 pt-2 border-t border-gray-50">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1">
            <Zap className="w-3 h-3" /> 生产效率与电价
          </p>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[8px] text-gray-500 font-medium ml-1">打印效率 (g/h)</label>
              <input type="text" inputMode="numeric" value={params.printEfficiency} onChange={e => handleChange('printEfficiency', e.target.value)} className="w-full bg-amber-50/30 border border-amber-100 rounded-lg px-3 py-1.5 text-xs font-bold text-amber-600 outline-none" />
            </div>
            <div className="space-y-1">
              <label className="text-[8px] text-gray-500 font-medium ml-1">电费 (元/度)</label>
              <input type="text" inputMode="decimal" value={params.elecRate} onChange={e => handleChange('elecRate', e.target.value)} className="w-full bg-blue-50/30 border border-blue-100 rounded-lg px-3 py-1.5 text-xs font-bold text-blue-600 outline-none" />
            </div>
          </div>
        </div>

        {/* Result Dashboards */}
        <div className="space-y-3">
           {/* Time & Energy Card */}
           <div className="grid grid-cols-2 gap-2">
              <div className="bg-amber-50/50 border border-amber-100 rounded-xl p-2.5 flex items-center gap-3">
                <div className="p-1.5 bg-amber-100 rounded-lg text-amber-600">
                  <Clock className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-[8px] text-amber-600 font-bold uppercase tracking-tighter">预计用时</p>
                  <p className="text-[11px] font-bold text-amber-900">{formatTime(estimates.hours)}</p>
                </div>
              </div>
              <div className="bg-blue-50/50 border border-blue-100 rounded-xl p-2.5 flex items-center gap-3">
                <div className="p-1.5 bg-blue-100 rounded-lg text-blue-600">
                  <Zap className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-[8px] text-blue-600 font-bold uppercase tracking-tighter">分材质能耗</p>
                  <p className="text-[11px] font-bold text-blue-900">¥{estimates.cost.toFixed(2)} <span className="text-[9px] font-normal opacity-60">({estimates.kwh.toFixed(2)} 度)</span></p>
                </div>
              </div>
           </div>

           <div className="flex justify-between text-[10px] font-bold text-gray-400 px-1 uppercase tracking-tighter">
              <span>预估总重: <b className="text-gray-900">{weightBreakdown.total}g</b></span>
              <span className="flex items-center gap-1"><Coins className="w-2 h-2" /> 生产级精算模型 v2.0</span>
           </div>
           
           <div className={`grid gap-2 ${hasDrawers ? 'grid-cols-2' : 'grid-cols-1'}`}>
              <button 
                onClick={() => onDeduct(weightBreakdown.cabinet)}
                className="bg-indigo-600 text-white p-3 rounded-xl shadow-lg shadow-indigo-100 transition-all active:scale-95 group flex flex-col items-center justify-center relative overflow-hidden"
              >
                <span className="text-[9px] text-indigo-200 uppercase font-bold mb-1">扣除柜体 (Shell)</span>
                <div className="flex items-center gap-1 font-black text-lg leading-none">
                  {weightBreakdown.cabinet}<span className="text-[10px] font-normal">g</span>
                </div>
                <div className="absolute right-1 bottom-1 opacity-20"><Box className="w-8 h-8" /></div>
              </button>

              {hasDrawers && (
                <button 
                  onClick={() => onDeduct(weightBreakdown.drawers)}
                  className="bg-emerald-600 text-white p-3 rounded-xl shadow-lg shadow-emerald-100 transition-all active:scale-95 group flex flex-col items-center justify-center relative overflow-hidden"
                >
                  <span className="text-[9px] text-emerald-200 uppercase font-bold mb-1">扣除抽屉 (Drawers)</span>
                  <div className="flex items-center gap-1 font-black text-lg leading-none">
                    {weightBreakdown.drawers}<span className="text-[10px] font-normal">g</span>
                  </div>
                  <div className="absolute right-1 bottom-1 opacity-20"><Archive className="w-8 h-8" /></div>
                </button>
              )}
           </div>
        </div>
        
        <p className="text-[9px] text-indigo-400 text-center leading-relaxed italic px-2">
          能耗引擎 2.0：已根据柜体与抽屉材质分别核算功率。ABS 等高温材质的电费占比已自动加权。
        </p>
      </div>
    </div>
  );
};

export default CabinetCalculator;