import React, { useState } from 'react';
import { Database, Save, AlertCircle } from 'lucide-react';
import { saveSupabaseConfig } from '../services/supabaseClient';

interface Props {
  onConfigured: () => void;
}

const DatabaseConfigModal: React.FC<Props> = ({ onConfigured }) => {
  const [url, setUrl] = useState('');
  const [key, setKey] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleSave = () => {
    if (!url.startsWith('https://')) {
      setError('Supabase URL 必须以 https:// 开头');
      return;
    }
    if (key.length < 20) {
      setError('Supabase Key 似乎太短了');
      return;
    }
    
    saveSupabaseConfig(url, key);
    onConfigured();
    // Reload to ensure fresh state
    window.location.reload();
  };

  return (
    <div className="fixed inset-0 bg-gray-900 flex items-center justify-center z-[100] p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        <div className="bg-indigo-600 p-6 text-center">
          <Database className="w-12 h-12 text-white mx-auto mb-3" />
          <h2 className="text-2xl font-bold text-white">配置云数据库</h2>
          <p className="text-indigo-100 mt-2 text-sm">
            请连接您的 Supabase 项目以存储数据
          </p>
        </div>

        <div className="p-8 space-y-6">
          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-lg flex items-center gap-2 text-sm">
              <AlertCircle className="w-4 h-4 shrink-0" />
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Project URL
            </label>
            <input
              type="text"
              value={url}
              onChange={(e) => {
                setUrl(e.target.value);
                setError(null);
              }}
              placeholder="https://xyz.supabase.co"
              className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-indigo-500 outline-none font-mono text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Anon / Public Key
            </label>
            <input
              type="password"
              value={key}
              onChange={(e) => {
                setKey(e.target.value);
                setError(null);
              }}
              placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI..."
              className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-indigo-500 outline-none font-mono text-sm"
            />
          </div>

          <div className="pt-2">
            <button
              onClick={handleSave}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3.5 rounded-xl transition-all active:scale-95 flex items-center justify-center gap-2 shadow-lg shadow-indigo-200"
            >
              <Save className="w-5 h-5" />
              保存并连接
            </button>
          </div>
          
          <div className="text-center text-xs text-gray-400">
            您的密钥将仅保存在本地浏览器中
          </div>
        </div>
      </div>
    </div>
  );
};

export default DatabaseConfigModal;