
import React, { useState, useEffect } from 'react';
import { Calculator, Box, Ruler, Archive, Clock, Zap, Coins, Wallet } from 'lucide-react';

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

// 获取材质推荐功率
const getPowerForMaterial = (material: string): number => {
  if (material.includes('PLA')) return 150;
  if (material.includes('PETG')) return 170;
  if (material.includes('ABS') || material.includes('ASA')) return 280;
  if (material.includes('TPU')) return 150;
  return 150;
};

const LINE_WIDTH = 0.42;

const CabinetCalculator: React.FC<CabinetCalculatorProps> = ({ onDeduct }) => {
  const parse = (val: string) => parseFloat(val) || 0;

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
    cabinetPower: '150',
    cabinetPrice: '50',      // 柜体单价 ¥/kg
    drawerMaterial: 'PETG Basic',
    drawerDensity: '1.27',   
    drawerPower: '170',
    drawerPrice: '50',       // 抽屉单价 ¥/kg
    cabinetCompensation: '1.67',
    drawerCompensation: '1.34',
    printEfficiency: '44',
    elecRate: '0.6'
  });

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
    elecCost: 0,
    matCost: 0,
    totalCost: 0
  });

  useEffect(() => {
    setDrawerParams(prev => ({ ...prev, quantity: params.shelves }));
  }, [params.shelves]);

  useEffect(() => {
    const H = parse(params.height);
    const T = parse(params.wallThickness);
    const L = parse(params.shelves);
    if (L > 0) {
      const calculatedH = (H - (L + 1) * T) / L;
      setDrawerParams(prev => ({ ...prev, height: calculatedH > 0 ? calculatedH.toFixed(1) : '0' }));
    }
  }, [params.height, params.shelves, params.wallThickness]);

  const calculatePanelRawWeight = (w: number, d: number, t: number, wallLoops: number, infillRate: number, density: number) => {
    if (w <= 0 || d <= 0 || t <= 0) return 0;
    const volumeCm3 = (w * d * t) / 1000;
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
    const cabPrice = parse(params.cabinetPrice);
    const draPrice = parse(params.drawerPrice);
    
    const FCab = parse(params.cabinetCompensation);
    const FDra = parse(params.drawerCompensation);

    const cabinetPanels = [
      { w: W, d: H, t: T }, 
      { w: D, d: H, t: T * 2 }, 
      { w: W, d: D, t: T * L } 
    ];
    const rawCabinetWeight = cabinetPanels.reduce((acc, p) => acc + calculatePanelRawWeight(p.w, p.d, p.t, wallLoops, infillRate, cabDensity), 0);
    const finalCabinetWeight = rawCabinetWeight * FCab;

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

    const efficiency = parse(params.printEfficiency);
    const rate = parse(params.elecRate);
    const cabPower = parse(params.cabinetPower);
    const draPower = parse(params.drawerPower);

    if (efficiency > 0 && totalWeight > 0) {
      const cabHours = finalCabinetWeight / efficiency;
      const draHours = hasDrawers ? (finalDrawersWeight / efficiency) : 0;
      const totalHours = cabHours + draHours;
      const cabKwh = (cabHours * cabPower) / 1000;
      const draKwh = (draHours * draPower) / 1000;
      const totalKwh = cabKwh + draKwh;
      const elecCost = totalKwh * rate;

      // 耗材成本计算
      const cabMatCost = (finalCabinetWeight / 1000) * cabPrice;
      const draMatCost = (finalDrawersWeight / 1000) * draPrice;
      const totalMatCost = cabMatCost + draMatCost;

      setEstimates({ 
        hours: totalHours, 
        kwh: totalKwh, 
        elecCost: elecCost,
        matCost: totalMatCost,
        totalCost: elecCost + totalMatCost
      });
    } else {
      setEstimates({ hours: 0, kwh: 0, elecCost: 0, matCost: 0, totalCost: 0 });
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

  const formatTime = (hours: number) => {
    const h = Math.floor(hours);
    const m = Math.round((hours - h) * 60);
    return h > 0 ? `${h}h ${m}m` : `${m}m`;
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="bg-indigo-50 p-4 border-b border-indigo-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-indigo-600 rounded-lg"><Calculator className="w-4 h-4 text-white" /></div>
          <h3 className="font-bold text-indigo-900">生产级成本估算引擎</h3>
        </div>
      </div>
      
      <div className="p-5 space-y-4">
        {/* Cabinet Material & Price */}
        <div className="space-y-2">
          <p className="text-[10px] font-bold text-gray-400 uppercase flex items-center gap-1"><Ruler className="w-3 h-3" /> 柜体耗材</p>
          <div className="grid grid-cols-1 gap-2 p-3 bg-gray-50/50 rounded-xl border border-gray-100">
             <select value={params.cabinetMaterial} onChange={(e) => handleMaterialChange('cabinet', e.target.value)} className="w-full bg-white border border-gray-200 rounded-lg px-2 py-1.5 text-[11px] font-bold text-indigo-600 outline-none">
                {Object.keys(MATERIAL_PRESETS).map(m => (<option key={m} value={m}>{m}</option>))}
             </select>
             <div className="grid grid-cols-3 gap-2">
                <div className="space-y-1">
                    <label className="text-[8px] text-gray-400 font-bold ml-1">密度</label>
                    <input type="text" value={params.cabinetDensity} onChange={e => handleChange('cabinetDensity', e.target.value)} className="w-full bg-white border border-gray-200 rounded-lg px-2 py-1.5 text-[11px] font-mono outline-none" />
                </div>
                <div className="space-y-1">
                    <label className="text-[8px] text-gray-400 font-bold ml-1">功率(W)</label>
                    <input type="text" value={params.cabinetPower} onChange={e => handleChange('cabinetPower', e.target.value)} className="w-full bg-white border border-gray-200 rounded-lg px-2 py-1.5 text-[11px] font-mono outline-none" />
                </div>
                <div className="space-y-1">
                    <label className="text-[8px] text-amber-600 font-bold ml-1">单价¥/kg</label>
                    <input type="text" value={params.cabinetPrice} onChange={e => handleChange('cabinetPrice', e.target.value)} className="w-full bg-amber-50 border border-amber-100 rounded-lg px-2 py-1.5 text-[11px] font-bold text-amber-700 outline-none" />
                </div>
             </div>
          </div>
        </div>

        {/* Geometry Settings - Simplified View */}
        <div className="grid grid-cols-4 gap-2">
           {['width', 'depth', 'height', 'shelves'].map(k => (
             <div key={k} className="space-y-1">
                <label className="text-[8px] text-gray-400 uppercase ml-1 font-bold">{k.charAt(0)}</label>
                <input type="text" value={(params as any)[k]} onChange={e => handleChange(k as any, e.target.value)} className="w-full bg-gray-50 border border-gray-100 rounded-lg px-2 py-1.5 text-xs font-bold outline-none" />
             </div>
           ))}
        </div>

        {/* Drawer Settings */}
        <div className="pt-2 border-t border-gray-50 space-y-2">
          <div className="flex justify-between items-center">
            <p className="text-[10px] font-bold text-gray-400 uppercase flex items-center gap-1"><Archive className="w-3 h-3" /> 抽屉配置</p>
            <button onClick={() => setHasDrawers(!hasDrawers)} className={`px-2 py-0.5 rounded-full text-[9px] font-bold transition-all ${hasDrawers ? 'bg-emerald-600 text-white shadow-sm' : 'bg-gray-100 text-gray-400'}`}>
              {hasDrawers ? 'ON' : 'OFF'}
            </button>
          </div>
          {hasDrawers && (
            <div className="grid grid-cols-1 gap-2 p-3 bg-emerald-50/30 rounded-xl border border-emerald-100/50">
               <select value={params.drawerMaterial} onChange={(e) => handleMaterialChange('drawer', e.target.value)} className="w-full bg-white border border-emerald-100 rounded-lg px-2 py-1.5 text-[11px] font-bold text-emerald-700 outline-none">
                  {Object.keys(MATERIAL_PRESETS).map(m => (<option key={m} value={m}>{m}</option>))}
               </select>
               <div className="grid grid-cols-3 gap-2">
                  <div className="space-y-1">
                      <label className="text-[8px] text-emerald-600 font-bold ml-1">功率(W)</label>
                      <input type="text" value={params.drawerPower} onChange={e => handleChange('drawerPower', e.target.value)} className="w-full bg-white border border-emerald-100 rounded-lg px-2 py-1.5 text-[11px] font-mono outline-none" />
                  </div>
                  <div className="space-y-1">
                      <label className="text-[8px] text-emerald-600 font-bold ml-1">单价¥/kg</label>
                      <input type="text" value={params.drawerPrice} onChange={e => handleChange('drawerPrice', e.target.value)} className="w-full bg-emerald-50 border border-emerald-100 rounded-lg px-2 py-1.5 text-[11px] font-bold text-emerald-700 outline-none" />
                  </div>
                  <div className="space-y-1">
                      <label className="text-[8px] text-gray-400 font-bold ml-1">数量</label>
                      <input type="text" value={drawerParams.quantity} disabled className="w-full bg-gray-50 border border-gray-200 rounded-lg px-2 py-1.5 text-[11px] font-bold outline-none" />
                  </div>
               </div>
            </div>
          )}
        </div>

        {/* Global Config */}
        <div className="grid grid-cols-2 gap-3 pt-2 border-t border-gray-50">
           <div className="space-y-1">
              <label className="text-[8px] text-gray-500 font-bold ml-1">效率 (g/h)</label>
              <input type="text" value={params.printEfficiency} onChange={e => handleChange('printEfficiency', e.target.value)} className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5 text-xs font-bold text-gray-600 outline-none" />
           </div>
           <div className="space-y-1">
              <label className="text-[8px] text-gray-500 font-bold ml-1">电价 (元/度)</label>
              <input type="text" value={params.elecRate} onChange={e => handleChange('elecRate', e.target.value)} className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5 text-xs font-bold text-gray-600 outline-none" />
           </div>
        </div>

        {/* Results Dashboard */}
        <div className="space-y-3 pt-2">
           <div className="grid grid-cols-2 gap-2">
              <div className="bg-amber-50/50 border border-amber-100 rounded-xl p-2.5 flex items-center gap-3">
                <div className="p-1.5 bg-amber-100 rounded-lg text-amber-600"><Clock className="w-4 h-4" /></div>
                <div>
                  <p className="text-[8px] text-amber-600 font-bold uppercase">用时</p>
                  <p className="text-[11px] font-bold text-amber-900">{formatTime(estimates.hours)}</p>
                </div>
              </div>
              <div className="bg-blue-50/50 border border-blue-100 rounded-xl p-2.5 flex items-center gap-3">
                <div className="p-1.5 bg-blue-100 rounded-lg text-blue-600"><Coins className="w-4 h-4" /></div>
                <div>
                  <p className="text-[8px] text-blue-600 font-bold uppercase">重量</p>
                  <p className="text-[11px] font-bold text-blue-900">{weightBreakdown.total}g</p>
                </div>
              </div>
           </div>

           {/* Total Cost Breakdown */}
           <div className="bg-indigo-600 rounded-2xl p-4 shadow-lg shadow-indigo-100 relative overflow-hidden group">
              <div className="absolute -right-4 -top-4 opacity-10 group-hover:rotate-12 transition-transform duration-500"><Wallet className="w-24 h-24 text-white" /></div>
              <div className="flex items-end justify-between relative z-10">
                <div>
                  <div className="flex items-center gap-1.5 text-indigo-100 font-bold text-[10px] mb-1 uppercase tracking-wider">
                    <Coins className="w-3 h-3" /> 预计总成本
                  </div>
                  <div className="text-2xl font-black text-white leading-none">
                    ¥{estimates.totalCost.toFixed(2)}
                  </div>
                </div>
                <div className="text-right text-[10px] font-medium text-indigo-100 leading-tight">
                  <p>耗材: ¥{estimates.matCost.toFixed(2)}</p>
                  <p>电费: ¥{estimates.elecCost.toFixed(2)}</p>
                </div>
              </div>
           </div>
           
           <div className={`grid gap-2 ${hasDrawers ? 'grid-cols-2' : 'grid-cols-1'}`}>
              <button onClick={() => onDeduct(weightBreakdown.cabinet)} className="bg-gray-900 text-white p-2.5 rounded-xl text-[11px] font-bold flex flex-col items-center">
                <span>扣柜体: {weightBreakdown.cabinet}g</span>
              </button>
              {hasDrawers && (
                <button onClick={() => onDeduct(weightBreakdown.drawers)} className="bg-emerald-600 text-white p-2.5 rounded-xl text-[11px] font-bold flex flex-col items-center">
                  <span>扣抽屉: {weightBreakdown.drawers}g</span>
                </button>
              )}
           </div>
        </div>
      </div>
    </div>
  );
};

export default CabinetCalculator;
