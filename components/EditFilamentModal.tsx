import React, { useState, useEffect } from 'react';
import { Filament, MaterialType } from '../types';
import { Save, X } from 'lucide-react';

interface EditFilamentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (filament: Filament) => void;
  initialData?: Filament;
}

const DEFAULT_FILAMENT: Filament = {
  id: '',
  name: '',
  brand: '',
  material: MaterialType.PLA,
  colorHex: '#3b82f6',
  totalWeight: 1000,
  currentWeight: 1000,
  createdAt: 0
};

const EditFilamentModal: React.FC<EditFilamentModalProps> = ({ isOpen, onClose, onSave, initialData }) => {
  const [formData, setFormData] = useState<Filament>(DEFAULT_FILAMENT);

  useEffect(() => {
    if (isOpen) {
      setFormData(initialData 
        ? { ...initialData } 
        : { ...DEFAULT_FILAMENT, id: crypto.randomUUID(), createdAt: Date.now() }
      );
    }
  }, [isOpen, initialData]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg">
        <div className="flex justify-between items-center p-6 border-b border-gray-100">
          <h2 className="text-xl font-bold text-gray-800">
            {initialData ? '编辑耗材' : '添加新耗材'}
          </h2>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-full transition-colors">
            <X className="w-6 h-6 text-gray-500" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">名称 / 颜色</label>
              <input 
                type="text" 
                value={formData.name}
                onChange={e => setFormData({...formData, name: e.target.value})}
                className="w-full border rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="例如：电光蓝"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">品牌</label>
              <input 
                type="text" 
                value={formData.brand}
                onChange={e => setFormData({...formData, brand: e.target.value})}
                className="w-full border rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="例如：eSun"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">材质</label>
              <select 
                value={formData.material}
                onChange={e => setFormData({...formData, material: e.target.value as MaterialType})}
                className="w-full border rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              >
                {Object.values(MaterialType).map(t => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">颜色代码 (Hex)</label>
              <div className="flex gap-2 items-center">
                <input 
                  type="color" 
                  value={formData.colorHex}
                  onChange={e => setFormData({...formData, colorHex: e.target.value})}
                  className="h-10 w-12 flex-shrink-0 rounded cursor-pointer border-none p-0 bg-transparent"
                />
                <input 
                  type="text" 
                  value={formData.colorHex}
                  onChange={e => setFormData({...formData, colorHex: e.target.value})}
                  className="flex-1 border rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm uppercase"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">总容量 (g)</label>
              <input 
                required
                type="number" 
                min="0"
                value={formData.totalWeight}
                onChange={e => setFormData({...formData, totalWeight: Number(e.target.value)})}
                className="w-full border rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">当前重量 (g)</label>
              <input 
                required
                type="number"
                min="0"
                max={formData.totalWeight}
                value={formData.currentWeight}
                onChange={e => setFormData({...formData, currentWeight: Number(e.target.value)})}
                className="w-full border rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="pt-4 flex justify-end gap-3">
             <button 
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 text-gray-600 font-medium hover:bg-gray-100 rounded-lg transition-colors"
            >
              取消
            </button>
            <button 
              type="submit"
              className="px-5 py-2.5 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 shadow-md flex items-center gap-2 transition-all"
            >
              <Save className="w-4 h-4" />
              保存耗材
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditFilamentModal;