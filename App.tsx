import React, { useState, useEffect, useCallback } from 'react';
import { 
  Sparkles, 
  Image as ImageIcon, 
  History, 
  FileText, 
  Settings2, 
  Copy, 
  Check, 
  Download,
  Trash2,
  AlertCircle,
  Wand2
} from 'lucide-react';
import { GlassCard } from './components/GlassCard';
import { Button } from './components/Button';
import { generateVisualPrompt, generateImage } from './services/geminiService';
import { AspectRatio, VisualStyle, HistoryItem, PromptResult } from './types';

const HISTORY_KEY = 'visual_soal_history_v1';

export default function App() {
  // --- State ---
  const [activeTab, setActiveTab] = useState<'generate' | 'history'>('generate');
  
  // Inputs
  const [inputText, setInputText] = useState('');
  const [style, setStyle] = useState<VisualStyle>(VisualStyle.THREE_D);
  const [ratio, setRatio] = useState<AspectRatio>(AspectRatio.LANDSCAPE);

  // Outputs
  const [analysis, setAnalysis] = useState('');
  const [generatedPrompt, setGeneratedPrompt] = useState('');
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);

  // Loading States
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);

  // System
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // --- Effects ---

  useEffect(() => {
    const saved = localStorage.getItem(HISTORY_KEY);
    if (saved) {
      try {
        setHistory(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse history", e);
      }
    }
  }, []);

  const saveToHistory = useCallback((newItem: HistoryItem) => {
    setHistory(prev => {
      const updated = [newItem, ...prev].slice(0, 50); // Keep last 50
      localStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
      return updated;
    });
  }, []);

  const deleteHistoryItem = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setHistory(prev => {
      const updated = prev.filter(item => item.id !== id);
      localStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
      return updated;
    });
  };

  // --- Handlers ---

  const handleAnalyze = async () => {
    if (!inputText.trim()) {
      setError("Mohon masukkan soal atau stimulus terlebih dahulu.");
      return;
    }
    setError(null);
    setIsAnalyzing(true);
    setAnalysis('');
    setGeneratedPrompt('');
    setGeneratedImage(null);

    try {
      const result: PromptResult = await generateVisualPrompt({ input: inputText, style, ratio });
      
      if (!result.visualPrompt) {
        throw new Error("Hasil analisis kosong. Silakan coba lagi.");
      }

      setAnalysis(result.analysis);
      setGeneratedPrompt(result.visualPrompt);
    } catch (err: any) {
      console.error("Analysis Error:", err);
      setError(err.message || "Gagal menganalisis teks. Coba lagi.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleGenerateImage = async () => {
    if (!generatedPrompt) return;
    setError(null);
    setIsGeneratingImage(true);

    try {
      const base64Image = await generateImage({ prompt: generatedPrompt, ratio });
      setGeneratedImage(base64Image);

      // Save complete workflow to history
      const newItem: HistoryItem = {
        id: crypto.randomUUID(),
        timestamp: Date.now(),
        input: inputText,
        style,
        ratio,
        analysis,
        visualPrompt: generatedPrompt,
        imageBase64: base64Image
      };
      saveToHistory(newItem);

    } catch (err: any) {
      console.error("Generation Error:", err);
      setError(err.message || "Gagal membuat gambar. Coba lagi nanti.");
    } finally {
      setIsGeneratingImage(false);
    }
  };

  const handleCopyPrompt = () => {
    navigator.clipboard.writeText(generatedPrompt);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRestore = (item: HistoryItem) => {
    setInputText(item.input);
    setStyle(item.style);
    setRatio(item.ratio);
    setAnalysis(item.analysis);
    setGeneratedPrompt(item.visualPrompt);
    setGeneratedImage(item.imageBase64 || null);
    setActiveTab('generate');
  };

  // --- Render ---

  return (
    <div className="min-h-screen pb-12">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-br from-red-600 to-orange-600 p-2 rounded-lg text-white shadow-lg shadow-red-200">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">Visual Soal <span className="text-red-600">Pro</span></h1>
              <p className="text-xs text-slate-500 font-medium">Powered by Gemini 3 Flash & 2.5 Image</p>
            </div>
          </div>
          <div className="flex bg-slate-100 p-1 rounded-lg">
            <button 
              onClick={() => setActiveTab('generate')}
              className={`px-4 py-2 rounded-md text-sm font-semibold transition-all ${activeTab === 'generate' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              Generator
            </button>
            <button 
              onClick={() => setActiveTab('history')}
              className={`px-4 py-2 rounded-md text-sm font-semibold transition-all flex items-center gap-2 ${activeTab === 'history' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              <History className="w-4 h-4" />
              Riwayat
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3 text-red-700 animate-in slide-in-from-top-2 shadow-sm">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <p className="text-sm font-medium">{error}</p>
            <button onClick={() => setError(null)} className="ml-auto text-red-500 hover:text-red-700 font-bold px-2">&times;</button>
          </div>
        )}

        {activeTab === 'generate' ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            
            {/* Left Column: Controls & Prompt */}
            <div className="lg:col-span-4 space-y-6">
              
              <GlassCard title="1. Input Stimulus" icon={<FileText className="w-5 h-5" />}>
                <textarea 
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  className="w-full h-32 p-4 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none resize-none text-sm text-slate-700 leading-relaxed placeholder:text-slate-400 transition-shadow"
                  placeholder="Contoh: Deskripsikan interaksi sosial di pasar tradisional yang menunjukkan akulturasi budaya..."
                />
                
                <div className="mt-4 grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">Gaya Visual</label>
                    <div className="relative">
                      <select 
                        value={style}
                        onChange={(e) => setStyle(e.target.value as VisualStyle)}
                        className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm appearance-none focus:ring-2 focus:ring-red-500 outline-none cursor-pointer hover:bg-slate-50 transition-colors"
                      >
                        {Object.values(VisualStyle).map((s) => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                      <Settings2 className="w-4 h-4 text-slate-400 absolute right-3 top-3 pointer-events-none" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">Rasio</label>
                    <div className="relative">
                      <select 
                        value={ratio}
                        onChange={(e) => setRatio(e.target.value as AspectRatio)}
                        className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm appearance-none focus:ring-2 focus:ring-red-500 outline-none cursor-pointer hover:bg-slate-50 transition-colors"
                      >
                        {Object.values(AspectRatio).map((r) => (
                          <option key={r} value={r}>{r}</option>
                        ))}
                      </select>
                      <Settings2 className="w-4 h-4 text-slate-400 absolute right-3 top-3 pointer-events-none" />
                    </div>
                  </div>
                </div>

                <Button 
                  onClick={handleAnalyze} 
                  isLoading={isAnalyzing} 
                  loadingText="Menganalisis..." 
                  className="w-full mt-6"
                  icon={<Wand2 className="w-4 h-4" />}
                >
                  Analisis & Buat Prompt
                </Button>
              </GlassCard>

              {/* Analysis & Prompt Output */}
              <GlassCard className={`transition-all duration-500 ${analysis ? 'opacity-100 translate-y-0' : 'opacity-60 translate-y-2'}`}>
                 <div className="flex items-center gap-2 mb-3">
                    <Sparkles className="w-4 h-4 text-indigo-500" />
                    <h3 className="text-sm font-bold text-slate-700">Hasil Analisis AI</h3>
                 </div>
                 
                 <div className="bg-indigo-50/50 border border-indigo-100 rounded-lg p-3 mb-4 min-h-[60px]">
                    <p className="text-xs text-indigo-900 leading-relaxed italic">
                      {analysis || "Analisis konsep sosiologi akan muncul di sini..."}
                    </p>
                 </div>

                 <div className="relative group">
                    <div className="absolute top-2 right-2 flex gap-1 z-10">
                      <button 
                        onClick={handleCopyPrompt}
                        disabled={!generatedPrompt}
                        className="p-1.5 bg-slate-800/80 hover:bg-slate-700 text-white rounded-md backdrop-blur transition-opacity opacity-0 group-hover:opacity-100 disabled:opacity-0"
                        title="Copy Prompt"
                      >
                        {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                      </button>
                    </div>
                    <textarea 
                      readOnly
                      value={generatedPrompt}
                      className="w-full h-28 p-3 bg-slate-900 text-slate-100 rounded-xl font-mono text-[11px] leading-relaxed outline-none border border-slate-700 resize-none focus:ring-1 focus:ring-slate-500"
                      placeholder="// Prompt visual (Bahasa Inggris) akan muncul di sini..."
                    />
                 </div>
              </GlassCard>

            </div>

            {/* Right Column: Image Generation */}
            <div className="lg:col-span-8">
              <GlassCard className="h-full flex flex-col min-h-[500px]" title="2. Generator Gambar" icon={<ImageIcon className="w-5 h-5" />}>
                
                <div className="flex-grow bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl flex items-center justify-center overflow-hidden relative group transition-all duration-300">
                  
                  {!generatedImage && !isGeneratingImage && (
                    <div className="text-center p-8">
                      <div className="bg-white p-4 rounded-full shadow-sm inline-block mb-4 border border-slate-100">
                        <ImageIcon className="w-8 h-8 text-slate-300" />
                      </div>
                      <p className="text-slate-400 text-sm font-medium">Area Visualisasi</p>
                      <p className="text-slate-300 text-xs mt-1">Gambar akan muncul di sini setelah proses generate.</p>
                    </div>
                  )}

                  {isGeneratingImage && (
                    <div className="text-center z-10 flex flex-col items-center">
                      <div className="relative w-20 h-20 mb-4">
                        <div className="absolute inset-0 border-4 border-slate-200 rounded-full"></div>
                        <div className="absolute inset-0 border-4 border-red-500 border-t-transparent rounded-full animate-spin"></div>
                      </div>
                      <p className="text-slate-700 font-bold animate-pulse">Sedang Menggambar...</p>
                      <p className="text-slate-400 text-xs mt-2">Menggunakan Gemini 2.5 Flash Image</p>
                    </div>
                  )}

                  {generatedImage && !isGeneratingImage && (
                    <div className="relative w-full h-full flex items-center justify-center bg-slate-900 group">
                      <img 
                        src={generatedImage} 
                        alt="Generated Result" 
                        className="max-w-full max-h-[600px] object-contain shadow-2xl transition-transform duration-500 group-hover:scale-[1.01]"
                      />
                      <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/90 via-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex justify-end">
                         <a 
                           href={generatedImage} 
                           download={`visual-soal-${Date.now()}.jpg`}
                           className="bg-white hover:bg-slate-100 text-slate-900 px-4 py-2 rounded-lg text-sm font-bold flex items-center shadow-lg transform transition-transform hover:scale-105"
                         >
                           <Download className="w-4 h-4 mr-2" />
                           Download HD
                         </a>
                      </div>
                    </div>
                  )}
                </div>

                <div className="mt-6 flex justify-end border-t border-slate-100 pt-6">
                   <Button 
                     onClick={handleGenerateImage} 
                     disabled={!generatedPrompt || isGeneratingImage}
                     isLoading={isGeneratingImage}
                     loadingText="Generating..."
                     className="w-full md:w-auto shadow-xl shadow-red-100"
                   >
                     Generate Image
                   </Button>
                </div>

              </GlassCard>
            </div>
          </div>
        ) : (
          // History Tab
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in duration-300">
            {history.length === 0 ? (
               <div className="col-span-full py-20 text-center">
                 <History className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                 <h3 className="text-lg font-medium text-slate-600">Belum ada riwayat</h3>
                 <p className="text-slate-400 text-sm">Buat visualisasi pertama Anda di tab Generator.</p>
               </div>
            ) : (
              history.map((item) => (
                <div 
                  key={item.id} 
                  onClick={() => handleRestore(item)}
                  className="bg-white rounded-2xl overflow-hidden border border-slate-200 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all cursor-pointer group"
                >
                  <div className="aspect-video bg-slate-100 relative overflow-hidden">
                    {item.imageBase64 ? (
                      <img src={item.imageBase64} alt="" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-300">
                        <ImageIcon className="w-8 h-8" />
                      </div>
                    )}
                    <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                       <button 
                         onClick={(e) => deleteHistoryItem(item.id, e)}
                         className="bg-white/90 p-2 rounded-full text-red-500 hover:text-red-600 shadow-sm hover:scale-110 transition-transform"
                       >
                         <Trash2 className="w-4 h-4" />
                       </button>
                    </div>
                    <div className="absolute bottom-2 left-2">
                       <span className="bg-black/60 backdrop-blur text-white text-[10px] px-2 py-1 rounded-full font-bold uppercase tracking-wide">
                         {item.style}
                       </span>
                    </div>
                  </div>
                  <div className="p-4">
                    <p className="text-xs text-slate-400 mb-1">{new Date(item.timestamp).toLocaleDateString()} • {new Date(item.timestamp).toLocaleTimeString()}</p>
                    <h4 className="font-medium text-slate-800 line-clamp-2 text-sm leading-relaxed group-hover:text-red-600 transition-colors">{item.input}</h4>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </main>
    </div>
  );
}