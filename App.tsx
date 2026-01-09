import React, { useState, useEffect } from 'react';
import { Filament, MaterialType } from './types';
import { fetchFilaments, addFilament, updateFilament, deleteFilament as deleteFilamentService } from './services/storageService';
import { isSupabaseConfigured } from './services/supabaseClient';
import ProgressBar from './components/ProgressBar';
import DeductModal from './components/DeductModal';
import EditFilamentModal from './components/EditFilamentModal';
import MaterialAdvisor from './components/MaterialAdvisor';
import DatabaseConfigModal from './components/DatabaseConfigModal';
import LowStockModal from './components/LowStockModal';
import CabinetCalculator from './components/CabinetCalculator';
import { Plus, Edit2, Trash2, Box, Search, Sparkles, Loader2, CloudOff, LayoutList, LayoutGrid, Package } from 'lucide-react';

function App() {
  // Config State
  const [isConfigured, setIsConfigured] = useState(true);

  // Data State
  const [filaments, setFilaments] = useState<Filament[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  // UI States
  const [viewMode, setViewMode] = useState<'list' | 'grid'>(() => {
    if (typeof window !== 'undefined') {
      return (localStorage.getItem('filamentViewMode') as 'list' | 'grid') || 'list';
    }
    return 'list';
  });
  const [isEditModalOpen, setEditModalOpen] = useState(false);
  const [editingFilament, setEditingFilament] = useState<Filament | undefined>(undefined);
  const [isDeductModalOpen, setDeductModalOpen] = useState(false);
  const [selectedFilamentId, setSelectedFilamentId] = useState<string | null>(null);
  const [prefilledWeight, setPrefilledWeight] = useState<number | undefined>(undefined);
  const [isAdvisorOpen, setAdvisorOpen] = useState(false);
  const [advisorMaterial, setAdvisorMaterial] = useState<MaterialType>(MaterialType.PLA);
  const [isLowStockModalOpen, setLowStockModalOpen] = useState(false);

  // --- Check Configuration & Load Data ---
  useEffect(() => {
    const configured = isSupabaseConfigured();
    setIsConfigured(configured);

    if (configured) {
      loadData();
    } else {
      setLoading(false);
    }
  }, []);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchFilaments();
      setFilaments(data);
    } catch (err) {
      console.error(err);
      setError("无法连接到云端数据库，请检查网络或配置。");
    } finally {
      setLoading(false);
    }
  };

  // --- Event Handlers ---

  const toggleViewMode = (mode: 'list' | 'grid') => {
    setViewMode(mode);
    localStorage.setItem('filamentViewMode', mode);
  };

  const handleAddClick = () => {
    setEditingFilament(undefined);
    setEditModalOpen(true);
  };

  const handleEditClick = (filament: Filament) => {
    setEditingFilament(filament);
    setEditModalOpen(true);
  };

  const handleDelete = async (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (window.confirm('确定要删除此耗材卷吗？此操作将同步删除云端数据。')) {
      const previousFilaments = [...filaments];
      setFilaments(prev => prev.filter(f => f.id !== id));
      try {
        await deleteFilamentService(id);
      } catch (err) {
        alert("删除失败，正在回滚...");
        setFilaments(previousFilaments);
      }
    }
  };

  const handleSaveFilament = async (filament: Filament) => {
    const previousFilaments = [...filaments];
    const isNew = !filaments.find(f => f.id === filament.id);
    let baseName = filament.name.trim() || "耗材";
    const isDuplicate = (name: string) => filaments.some(f => f.id !== filament.id && (f.name || "耗材") === name);
    let finalName = baseName;
    if (isDuplicate(finalName)) {
      let counter = 1;
      while (isDuplicate(`${baseName} (${counter})`)) counter++;
      finalName = `${baseName} (${counter})`;
    }
    const filamentToSave = { ...filament, name: finalName };

    if (isNew) {
      setFilaments(prev => [filamentToSave, ...prev]);
    } else {
      setFilaments(prev => prev.map(f => f.id === filamentToSave.id ? filamentToSave : f));
    }

    try {
      if (isNew) {
        await addFilament(filamentToSave);
      } else {
        await updateFilament(filamentToSave);
      }
    } catch (err) {
      console.error(err);
      alert("保存失败，请重试。");
      setFilaments(previousFilaments);
    }
  };

  const openDeductModal = (id: string, weight?: number, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setSelectedFilamentId(id);
    setPrefilledWeight(weight);
    setDeductModalOpen(true);
  };

  const handleCalculatorDeduct = (weight: number) => {
    setPrefilledWeight(weight);
    // 自动滑动到列表或提示用户选择
    const listElement = document.getElementById('filament-list-header');
    if (listElement) {
      listElement.scrollIntoView({ behavior: 'smooth' });
    }
    alert(`已记录 ${weight}g。请在下方的耗材列表中点击“确认打印”来从指定耗材中扣除。`);
  };

  const handleDeductConfirm = async (amount: number) => {
    if (!selectedFilamentId) return;
    const targetFilament = filaments.find(f => f.id === selectedFilamentId);
    if (!targetFilament) return;

    const updatedFilament = {
      ...targetFilament,
      currentWeight: targetFilament.currentWeight - amount,
      lastUsed: new Date().toISOString()
    };

    const previousFilaments = [...filaments];
    setFilaments(prev => prev.map(f => f.id === selectedFilamentId ? updatedFilament : f));

    try {
      await updateFilament(updatedFilament);
    } catch (err) {
      console.error(err);
      alert("更新失败。");
      setFilaments(previousFilaments);
    } finally {
      setPrefilledWeight(undefined); // 扣除完成后重置
    }
  };

  const openAdvisor = (material: MaterialType, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setAdvisorMaterial(material);
    setAdvisorOpen(true);
  };

  if (!isConfigured) {
    return <DatabaseConfigModal onConfigured={() => setIsConfigured(true)} />;
  }

  const filteredFilaments = filaments.filter(f => 
    f.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    f.brand.toLowerCase().includes(searchTerm.toLowerCase()) ||
    f.material.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalStock = filaments.reduce((acc, f) => acc + f.currentWeight, 0);
  const lowStockFilaments = filaments.filter(f => f.currentWeight < 200);
  const lowStockCount = lowStockFilaments.length;

  return (
    <div className="min-h-screen bg-gray-50 pb-24 relative">
      <header className="bg-white shadow-sm sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Box className="w-8 h-8 text-indigo-600" />
            <h1 className="text-xl font-bold text-gray-900 tracking-tight">SmartPrint <span className="text-indigo-600">云库存</span></h1>
          </div>
          <button onClick={handleAddClick} className="hidden sm:flex items-center gap-2 bg-gray-900 text-white px-4 py-2 rounded-lg hover:bg-gray-800 transition-colors text-sm font-medium">
            <Plus className="w-4 h-4" /> 添加耗材
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {!loading && !error && (
          <>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
              {/* Left Column: Stats Cards */}
              <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Total Weight Card */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-center">
                  <span className="text-gray-500 text-xs font-bold uppercase tracking-wider mb-1">可用总重量</span>
                  <span className="text-3xl font-black text-gray-900">{(totalStock / 1000).toFixed(1)} <span className="text-lg text-gray-400 font-normal">kg</span></span>
                </div>

                {/* Total Count Card - RESTORED */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-center">
                  <span className="text-gray-500 text-xs font-bold uppercase tracking-wider mb-1">耗材总数</span>
                  <div className="flex items-end gap-2">
                    <span className="text-3xl font-black text-gray-900">{filaments.length}</span>
                    <span className="text-lg text-gray-400 font-normal mb-1">卷</span>
                  </div>
                </div>
                
                {/* Low Stock Card */}
                <div 
                  onClick={() => setLowStockModalOpen(true)}
                  className={`p-6 rounded-2xl shadow-sm border flex flex-col cursor-pointer transition-all active:scale-95 hover:shadow-md select-none ${lowStockCount > 0 ? 'bg-red-50 border-red-100' : 'bg-white border-gray-100'}`}
                >
                  <div className="flex justify-between items-start">
                    <span className={`${lowStockCount > 0 ? 'text-red-600' : 'text-gray-500'} text-xs font-bold uppercase tracking-wider mb-1`}>低库存预警</span>
                    {lowStockCount > 0 && <span className="flex h-3 w-3 relative">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                    </span>}
                  </div>
                  <span className={`text-3xl font-black ${lowStockCount > 0 ? 'text-red-600' : 'text-gray-900'}`}>{lowStockCount}</span>
                  <span className="text-[10px] text-gray-400 mt-1 uppercase font-medium">点击查看详情</span>
                </div>
              </div>

              {/* Right Column: Calculator Card */}
              <div className="lg:col-span-1">
                <CabinetCalculator onDeduct={handleCalculatorDeduct} />
              </div>
            </div>

            {/* List Header & Controls */}
            <div id="filament-list-header" className="mb-6 flex flex-col md:flex-row gap-4 items-center justify-between">
              <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                库存列表 
                {prefilledWeight && <span className="text-xs bg-indigo-100 text-indigo-600 px-2 py-0.5 rounded-full animate-pulse">待扣除: {prefilledWeight}g</span>}
              </h2>
              
              <div className="flex gap-3 w-full md:w-auto">
                <div className="relative flex-1 md:w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input 
                    type="text"
                    placeholder="搜索耗材..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none shadow-sm text-sm"
                  />
                </div>
                
                <div className="bg-white border border-gray-200 rounded-xl p-1 flex items-center shadow-sm">
                  <button onClick={() => toggleViewMode('list')} className={`p-2 rounded-lg transition-all ${viewMode === 'list' ? 'bg-indigo-100 text-indigo-600' : 'text-gray-400'}`}>
                    <LayoutList className="w-5 h-5" />
                  </button>
                  <button onClick={() => toggleViewMode('grid')} className={`p-2 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-indigo-100 text-indigo-600' : 'text-gray-400'}`}>
                    <LayoutGrid className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>

            {/* Content Rendering (List/Grid) */}
            {viewMode === 'list' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {filteredFilaments.map(filament => (
                  <div key={filament.id} className="bg-white rounded-2xl shadow-sm hover:shadow-md transition-shadow border border-gray-100 overflow-hidden group">
                    <div className="p-5 flex justify-between items-start">
                      <div className="flex gap-4">
                        <div className="w-16 h-16 rounded-xl shadow-inner border border-black/5 shrink-0" style={{ backgroundColor: filament.colorHex }} />
                        <div>
                          <h3 className="font-bold text-lg text-gray-900 truncate max-w-[150px]">{filament.name}</h3>
                          <div className="flex items-center gap-2 text-sm text-gray-500 mt-1">
                            <span className="bg-gray-100 px-2 py-0.5 rounded text-[10px] font-bold uppercase">{filament.material}</span>
                            <span>{filament.brand}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={(e) => openAdvisor(filament.material, e)} className="p-2 text-indigo-400 hover:bg-indigo-50 rounded-lg"><Sparkles className="w-4 h-4" /></button>
                        <button onClick={() => handleEditClick(filament)} className="p-2 text-gray-400 hover:bg-gray-50 rounded-lg"><Edit2 className="w-4 h-4" /></button>
                        <button onClick={(e) => handleDelete(filament.id, e)} className="p-2 text-gray-400 hover:bg-red-50 hover:text-red-500 rounded-lg"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    </div>
                    <div className="px-5 pb-5">
                      <ProgressBar current={filament.currentWeight} total={filament.totalWeight} />
                      <button 
                        onClick={(e) => openDeductModal(filament.id, prefilledWeight, e)}
                        className={`w-full mt-5 py-2.5 rounded-xl font-bold transition-all active:scale-95 shadow-lg ${prefilledWeight ? 'bg-indigo-600 text-white animate-pulse shadow-indigo-200' : 'bg-gray-900 text-white shadow-gray-200'}`}
                      >
                        {prefilledWeight ? `应用并扣除 ${prefilledWeight}g` : '确认打印 (记录用量)'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-3">
                {filteredFilaments.map(filament => {
                  const isLow = filament.currentWeight < 200;
                  return (
                    <div 
                      key={filament.id} 
                      onClick={() => openDeductModal(filament.id, prefilledWeight)}
                      className={`bg-white rounded-xl shadow-sm border overflow-hidden cursor-pointer hover:shadow-md transition-all active:scale-95 flex flex-col aspect-[3/4] relative ${prefilledWeight ? 'ring-2 ring-indigo-500 ring-offset-2' : 'border-gray-100'}`}
                    >
                      <div className="flex-1 w-full" style={{ backgroundColor: filament.colorHex }}>
                         {isLow && <div className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full border border-white animate-pulse" />}
                      </div>
                      <div className="p-2 bg-white h-[35%] flex flex-col justify-between">
                        <p className="font-bold text-[10px] truncate">{filament.name}</p>
                        <div className="w-full bg-gray-100 h-1 rounded-full overflow-hidden">
                          <div className={`h-full ${isLow ? 'bg-red-500' : 'bg-emerald-500'}`} style={{ width: `${(filament.currentWeight/filament.totalWeight)*100}%` }} />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </main>

      <button onClick={handleAddClick} className="fixed bottom-6 right-6 w-14 h-14 bg-indigo-600 text-white rounded-full shadow-2xl flex items-center justify-center sm:hidden z-40"><Plus className="w-6 h-6" /></button>

      <EditFilamentModal isOpen={isEditModalOpen} onClose={() => setEditModalOpen(false)} onSave={handleSaveFilament} initialData={editingFilament} />
      {selectedFilamentId && <DeductModal isOpen={isDeductModalOpen} onClose={() => setDeductModalOpen(false)} onConfirm={handleDeductConfirm} filament={filaments.find(f => f.id === selectedFilamentId)!} initialAmount={prefilledWeight?.toString()} />}
      <MaterialAdvisor isOpen={isAdvisorOpen} onClose={() => setAdvisorOpen(false)} defaultMaterial={advisorMaterial} />
      <LowStockModal isOpen={isLowStockModalOpen} onClose={() => setLowStockModalOpen(false)} filaments={lowStockFilaments} />
    </div>
  );
}

export default App;