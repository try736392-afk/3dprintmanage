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
import { Plus, Edit2, Trash2, Box, Search, Sparkles, Loader2, CloudOff } from 'lucide-react';

function App() {
  // Config State
  const [isConfigured, setIsConfigured] = useState(true);

  // Data State
  const [filaments, setFilaments] = useState<Filament[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  // UI States
  const [isEditModalOpen, setEditModalOpen] = useState(false);
  const [editingFilament, setEditingFilament] = useState<Filament | undefined>(undefined);
  const [isDeductModalOpen, setDeductModalOpen] = useState(false);
  const [selectedFilamentId, setSelectedFilamentId] = useState<string | null>(null);
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

  const handleAddClick = () => {
    setEditingFilament(undefined);
    setEditModalOpen(true);
  };

  const handleEditClick = (filament: Filament) => {
    setEditingFilament(filament);
    setEditModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('确定要删除此耗材卷吗？此操作将同步删除云端数据。')) {
      // Optimistic update
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
    // Optimistic Update Setup
    const previousFilaments = [...filaments];
    
    // Check if it's new or existing
    const isNew = !filaments.find(f => f.id === filament.id);
    
    // Logic to handle duplicate names (Client side check)
    let baseName = filament.name.trim() || "耗材";
    const isDuplicate = (name: string) => filaments.some(f => f.id !== filament.id && (f.name || "耗材") === name);
    let finalName = baseName;
    if (isDuplicate(finalName)) {
      let counter = 1;
      while (isDuplicate(`${baseName} (${counter})`)) counter++;
      finalName = `${baseName} (${counter})`;
    }
    const filamentToSave = { ...filament, name: finalName };

    // Update UI immediately
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

  const openDeductModal = (id: string) => {
    setSelectedFilamentId(id);
    setDeductModalOpen(true);
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

    // Optimistic UI update
    const previousFilaments = [...filaments];
    setFilaments(prev => prev.map(f => f.id === selectedFilamentId ? updatedFilament : f));

    try {
      await updateFilament(updatedFilament);
    } catch (err) {
      console.error(err);
      alert("更新失败。");
      setFilaments(previousFilaments);
    }
  };

  const openAdvisor = (material: MaterialType) => {
    setAdvisorMaterial(material);
    setAdvisorOpen(true);
  };

  // --- Render Helpers ---

  if (!isConfigured) {
    return <DatabaseConfigModal onConfigured={() => setIsConfigured(true)} />;
  }

  const filteredFilaments = filaments.filter(f => 
    f.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    f.brand.toLowerCase().includes(searchTerm.toLowerCase()) ||
    f.material.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalStock = filaments.reduce((acc, f) => acc + f.currentWeight, 0);
  
  // Calculate low stock filaments (less than 200g)
  const lowStockFilaments = filaments.filter(f => f.currentWeight < 200);
  const lowStockCount = lowStockFilaments.length;

  return (
    <div className="min-h-screen bg-gray-50 pb-20 relative">
      {/* DEBUG BANNER */}
      <div className="w-full bg-red-100 border-b border-red-300 p-2 text-center text-red-600 font-bold font-mono z-50">
        Debug: App is running
      </div>

      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Box className="w-8 h-8 text-indigo-600" />
            <h1 className="text-xl font-bold text-gray-900 tracking-tight">SmartPrint <span className="text-indigo-600">云库存</span></h1>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={handleAddClick} className="hidden sm:flex items-center gap-2 bg-gray-900 text-white px-4 py-2 rounded-lg hover:bg-gray-800 transition-colors text-sm font-medium">
              <Plus className="w-4 h-4" /> 添加耗材
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Loading / Error States */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-20 text-gray-500">
            <Loader2 className="w-10 h-10 animate-spin text-indigo-600 mb-4" />
            <p>正在同步云端数据...</p>
          </div>
        )}

        {error && !loading && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center text-red-800 mb-8">
            <CloudOff className="w-10 h-10 mx-auto mb-2 text-red-400" />
            <p className="font-bold">{error}</p>
            <button onClick={loadData} className="mt-4 text-sm underline hover:text-red-900">重试连接</button>
          </div>
        )}

        {!loading && !error && (
          <>
            {/* Dashboard Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col">
                <span className="text-gray-500 text-sm font-medium mb-1">耗材总数</span>
                <span className="text-3xl font-bold text-gray-900">{filaments.length}</span>
              </div>
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col">
                <span className="text-gray-500 text-sm font-medium mb-1">总可用重量</span>
                <span className="text-3xl font-bold text-gray-900">{(totalStock / 1000).toFixed(1)} <span className="text-lg text-gray-400 font-normal">kg</span></span>
              </div>
              
              {/* Interactive Low Stock Card */}
              <div 
                onClick={() => setLowStockModalOpen(true)}
                className={`p-6 rounded-2xl shadow-sm border flex flex-col cursor-pointer transition-all active:scale-95 hover:shadow-md select-none ${lowStockCount > 0 ? 'bg-red-50 border-red-100' : 'bg-white border-gray-100 hover:border-gray-300'}`}
              >
                <div className="flex justify-between items-start">
                  <span className={`${lowStockCount > 0 ? 'text-red-600' : 'text-gray-500'} text-sm font-medium mb-1`}>低库存预警</span>
                  {lowStockCount > 0 && <span className="flex h-3 w-3 relative">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                  </span>}
                </div>
                <span className={`text-3xl font-bold ${lowStockCount > 0 ? 'text-red-600' : 'text-gray-900'}`}>{lowStockCount}</span>
                <span className="text-xs text-gray-400 mt-1">点击查看详情</span>
              </div>
            </div>

            {/* Search & Filter */}
            <div className="mb-6 flex gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input 
                  type="text"
                  placeholder="搜索耗材..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-shadow shadow-sm"
                />
              </div>
            </div>

            {/* Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {filteredFilaments.map(filament => (
                <div key={filament.id} className="bg-white rounded-2xl shadow-sm hover:shadow-md transition-shadow border border-gray-100 overflow-hidden group">
                  {/* Card Header */}
                  <div className="p-5 flex justify-between items-start">
                    <div className="flex gap-4">
                      <div 
                        className="w-16 h-16 rounded-xl shadow-inner border border-black/5 shrink-0" 
                        style={{ backgroundColor: filament.colorHex }}
                      />
                      <div>
                        <h3 className="font-bold text-lg text-gray-900 group-hover:text-indigo-600 transition-colors">{filament.name}</h3>
                        <div className="flex items-center gap-2 text-sm text-gray-500 mt-1">
                          <span className="bg-gray-100 px-2 py-0.5 rounded text-xs font-semibold uppercase tracking-wide">{filament.material}</span>
                          <span>•</span>
                          <span>{filament.brand}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => openAdvisor(filament.material)} className="p-2 text-indigo-400 hover:bg-indigo-50 rounded-lg" title="AI 顾问">
                        <Sparkles className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleEditClick(filament)} className="p-2 text-gray-400 hover:bg-gray-50 rounded-lg">
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDelete(filament.id)} className="p-2 text-gray-400 hover:bg-red-50 hover:text-red-500 rounded-lg">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Card Body */}
                  <div className="px-5 pb-5">
                    <ProgressBar current={filament.currentWeight} total={filament.totalWeight} />
                    
                    <div className="mt-5">
                      <button 
                        onClick={() => openDeductModal(filament.id)}
                        className="w-full bg-gray-900 hover:bg-indigo-600 text-white font-medium py-2.5 rounded-xl transition-all active:scale-95 shadow-lg shadow-gray-200"
                      >
                        确认打印 (扣除耗材)
                      </button>
                    </div>
                  </div>
                </div>
              ))}

              {/* Empty State */}
              {filteredFilaments.length === 0 && (
                <div className="col-span-full py-20 text-center text-gray-400">
                  <Box className="w-16 h-16 mx-auto mb-4 opacity-20" />
                  <p>云端暂无数据。添加一个开始使用！</p>
                </div>
              )}
            </div>
          </>
        )}
      </main>

      {/* Floating Action Button (Mobile) */}
      <button 
        onClick={handleAddClick}
        className="fixed bottom-6 right-6 w-14 h-14 bg-indigo-600 text-white rounded-full shadow-2xl flex items-center justify-center sm:hidden z-40 hover:bg-indigo-700 transition-colors"
      >
        <Plus className="w-6 h-6" />
      </button>

      {/* Modals */}
      <EditFilamentModal 
        isOpen={isEditModalOpen} 
        onClose={() => setEditModalOpen(false)} 
        onSave={handleSaveFilament}
        initialData={editingFilament}
      />

      {selectedFilamentId && (
        <DeductModal 
          isOpen={isDeductModalOpen}
          onClose={() => setDeductModalOpen(false)}
          onConfirm={handleDeductConfirm}
          filament={filaments.find(f => f.id === selectedFilamentId)!}
        />
      )}

      <MaterialAdvisor 
        isOpen={isAdvisorOpen}
        onClose={() => setAdvisorOpen(false)}
        defaultMaterial={advisorMaterial}
      />

      <LowStockModal
        isOpen={isLowStockModalOpen}
        onClose={() => setLowStockModalOpen(false)}
        filaments={lowStockFilaments}
      />
    </div>
  );
}

export default App;