import React, { useState } from 'react';
import { MaterialType } from '../types';
import { getMaterialAdvice } from '../services/geminiService';
import { Sparkles, Send, Loader2, X } from 'lucide-react';

interface MaterialAdvisorProps {
  isOpen: boolean;
  onClose: () => void;
  defaultMaterial: MaterialType;
}

const MaterialAdvisor: React.FC<MaterialAdvisorProps> = ({ isOpen, onClose, defaultMaterial }) => {
  const [query, setQuery] = useState('');
  const [response, setResponse] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleAsk = async () => {
    if (!query.trim()) return;
    setLoading(true);
    setResponse(null);
    try {
      const result = await getMaterialAdvice(defaultMaterial, query);
      setResponse(result);
    } catch (e) {
      setResponse("Failed to get advice.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col max-h-[90vh]">
        <div className="bg-gradient-to-r from-violet-600 to-indigo-600 p-4 flex justify-between items-center text-white">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5" />
            <h3 className="font-bold">AI Material Advisor</h3>
          </div>
          <button onClick={onClose} className="hover:bg-white/20 p-1 rounded-full transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-6 flex-1 overflow-y-auto">
          <p className="text-gray-600 text-sm mb-4">
            Ask Gemini about settings, troubleshooting, or tips for <span className="font-bold text-indigo-600">{defaultMaterial}</span>.
          </p>

          <div className="space-y-4">
            <div className="flex gap-2">
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={`e.g., Best bed temp for ${defaultMaterial}?`}
                className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                onKeyDown={(e) => e.key === 'Enter' && handleAsk()}
              />
              <button 
                onClick={handleAsk}
                disabled={loading || !query}
                className="bg-indigo-600 text-white p-2 rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
              </button>
            </div>

            {response && (
              <div className="bg-indigo-50 p-4 rounded-lg border border-indigo-100">
                <h4 className="text-xs font-bold text-indigo-800 uppercase mb-2">Gemini Response</h4>
                <div className="text-sm text-gray-800 leading-relaxed whitespace-pre-wrap">
                  {response}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MaterialAdvisor;