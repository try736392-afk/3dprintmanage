import React, { useState, useEffect } from 'react';
import { Settings, X, Save, Key, ExternalLink } from 'lucide-react';
import { loadApiKey, saveApiKey } from '../services/storageService';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  const [apiKey, setApiKey] = useState('');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setApiKey(loadApiKey() || '');
      setSaved(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSave = () => {
    saveApiKey(apiKey);
    setSaved(true);
    setTimeout(() => {
      setSaved(false);
      onClose();
    }, 800);
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        <div className="bg-gray-900 p-4 flex justify-between items-center">
          <h3 className="font-bold text-lg text-white flex items-center gap-2">
            <Settings className="w-5 h-5" />
            设置
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6">
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
              <Key className="w-4 h-4 text-indigo-600" />
              Gemini API Key
            </label>
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="输入以 AI..."
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-shadow"
            />
            <p className="mt-2 text-xs text-gray-500 leading-relaxed">
              您的 API Key 仅存储在浏览器的本地缓存中 (LocalStorage)，不会发送到我们的服务器。
              <a 
                href="https://aistudio.google.com/app/apikey" 
                target="_blank" 
                rel="noreferrer"
                className="text-indigo-600 hover:underline inline-flex items-center gap-1 ml-1"
              >
                获取 Key <ExternalLink className="w-3 h-3" />
              </a>
            </p>
          </div>

          <button 
            onClick={handleSave}
            className={`w-full py-2.5 rounded-xl font-medium flex items-center justify-center gap-2 transition-all ${
              saved 
                ? 'bg-green-600 text-white shadow-lg' 
                : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-md hover:shadow-lg'
            }`}
          >
            {saved ? '已保存！' : (
              <>
                <Save className="w-4 h-4" /> 保存设置
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;