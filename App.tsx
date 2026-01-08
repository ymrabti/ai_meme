
import React, { useState, useCallback, useRef } from 'react';
import { AppStatus, MemeState, Suggestion, Template } from './types';
import { TRENDING_TEMPLATES } from './constants';
import MemeCanvas from './components/MemeCanvas';
import { analyzeAndSuggestCaptions, editImageWithAI, describeImage } from './services/geminiService';

const App: React.FC = () => {
  const [memeState, setMemeState] = useState<MemeState>({
    imageUrl: null,
    topText: '',
    bottomText: '',
    fontSize: 10,
    textColor: 'white',
  });
  const [status, setStatus] = useState<AppStatus>(AppStatus.IDLE);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [aiPrompt, setAiPrompt] = useState('');
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (readerEvent) => {
        const url = readerEvent.target?.result as string;
        setMemeState(prev => ({ ...prev, imageUrl: url }));
        setSuggestions([]);
        setAnalysis(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const selectTemplate = (template: Template) => {
    setMemeState(prev => ({ ...prev, imageUrl: template.url }));
    setSuggestions([]);
    setAnalysis(null);
  };

  const handleMagicCaption = async () => {
    if (!memeState.imageUrl) return;
    setStatus(AppStatus.ANALYZING);
    try {
      const results = await analyzeAndSuggestCaptions(memeState.imageUrl);
      setSuggestions(results);
    } catch (err) {
      console.error(err);
      setStatus(AppStatus.ERROR);
    } finally {
      setStatus(AppStatus.IDLE);
    }
  };

  const handleAnalyze = async () => {
    if (!memeState.imageUrl) return;
    setStatus(AppStatus.ANALYZING);
    try {
      const desc = await describeImage(memeState.imageUrl);
      setAnalysis(desc);
    } catch (err) {
      console.error(err);
      setStatus(AppStatus.ERROR);
    } finally {
      setStatus(AppStatus.IDLE);
    }
  };

  const handleAIEdit = async () => {
    if (!memeState.imageUrl || !aiPrompt) return;
    setStatus(AppStatus.EDITING);
    try {
      const editedUrl = await editImageWithAI(memeState.imageUrl, aiPrompt);
      if (editedUrl) {
        setMemeState(prev => ({ ...prev, imageUrl: editedUrl }));
        setAiPrompt('');
      }
    } catch (err) {
      console.error(err);
      setStatus(AppStatus.ERROR);
    } finally {
      setStatus(AppStatus.IDLE);
    }
  };

  const downloadMeme = () => {
    if (!canvasRef.current) return;
    const link = document.createElement('a');
    link.download = 'meme-genius.png';
    link.href = canvasRef.current.toDataURL('image/png');
    link.click();
  };

  const applySuggestion = (s: Suggestion) => {
    setMemeState(prev => ({
      ...prev,
      topText: s.top,
      bottomText: s.bottom
    }));
  };

  return (
    <div className="min-h-screen pb-20">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-slate-900/80 backdrop-blur-md border-b border-slate-800 p-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <i className="fa-solid fa-face-grin-tongue-wink text-white text-xl"></i>
            </div>
            <h1 className="text-2xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-purple-400">
              MemeGenius AI
            </h1>
          </div>
          <div className="flex items-center space-x-4">
            <label className="cursor-pointer bg-slate-800 hover:bg-slate-700 px-4 py-2 rounded-lg font-semibold transition-all border border-slate-700">
              <i className="fa-solid fa-upload mr-2"></i>
              Upload
              <input type="file" className="hidden" accept="image/*" onChange={handleFileUpload} />
            </label>
            <button 
              onClick={downloadMeme}
              disabled={!memeState.imageUrl}
              className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed px-4 py-2 rounded-lg font-semibold transition-all shadow-lg shadow-indigo-600/20"
            >
              <i className="fa-solid fa-download mr-2"></i>
              Export
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto p-4 md:p-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Canvas & Suggestions */}
        <div className="lg:col-span-7 space-y-6">
          <MemeCanvas 
            state={memeState} 
            onCanvasReady={(canvas) => canvasRef.current = canvas} 
          />

          {/* AI Magic Suggestions */}
          {memeState.imageUrl && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold flex items-center">
                  <i className="fa-solid fa-wand-magic-sparkles mr-2 text-indigo-400"></i>
                  Magic Captions
                </h2>
                <button 
                  onClick={handleMagicCaption}
                  disabled={status === AppStatus.ANALYZING}
                  className="text-sm bg-indigo-600/20 text-indigo-400 hover:bg-indigo-600/30 px-3 py-1 rounded-full font-medium transition-colors"
                >
                  {status === AppStatus.ANALYZING ? 'Thinking...' : 'Regenerate'}
                </button>
              </div>

              {suggestions.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {suggestions.map((s, i) => (
                    <button
                      key={i}
                      onClick={() => applySuggestion(s)}
                      className="text-left p-3 bg-slate-800/50 hover:bg-slate-700 border border-slate-700 rounded-xl transition-all group"
                    >
                      <div className="text-xs uppercase font-bold text-slate-500 mb-1 group-hover:text-indigo-400">Option {i + 1}</div>
                      <div className="text-sm font-semibold text-slate-200 line-clamp-1 italic">"{s.top}"</div>
                      <div className="text-sm font-semibold text-slate-200 line-clamp-1 italic">"{s.bottom}"</div>
                    </button>
                  ))}
                </div>
              ) : (
                <button 
                  onClick={handleMagicCaption}
                  disabled={status === AppStatus.ANALYZING}
                  className="w-full py-8 border-2 border-dashed border-slate-700 rounded-2xl flex flex-col items-center justify-center text-slate-500 hover:text-indigo-400 hover:border-indigo-400/50 transition-all bg-slate-800/20"
                >
                  {status === AppStatus.ANALYZING ? (
                    <i className="fa-solid fa-circle-notch fa-spin text-3xl mb-3"></i>
                  ) : (
                    <i className="fa-solid fa-wand-magic-sparkles text-3xl mb-3"></i>
                  )}
                  <p className="font-semibold">Click to generate Magic Captions</p>
                  <p className="text-xs">AI will analyze context and suggest jokes</p>
                </button>
              )}
            </div>
          )}

          {/* AI Analysis View */}
          {analysis && (
            <div className="bg-slate-800/50 border border-indigo-500/30 p-4 rounded-xl">
              <h3 className="text-indigo-400 font-bold mb-2 flex items-center">
                <i className="fa-solid fa-magnifying-glass-chart mr-2"></i>
                AI Analysis
              </h3>
              <p className="text-slate-300 text-sm leading-relaxed">{analysis}</p>
            </div>
          )}
        </div>

        {/* Right Column: Controls & Templates */}
        <div className="lg:col-span-5 space-y-8">
          {/* Text Controls */}
          <div className="bg-slate-800 rounded-2xl border border-slate-700 p-6 space-y-6 shadow-xl">
            <h2 className="text-xl font-bold border-b border-slate-700 pb-4">Editor</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Top Text</label>
                <textarea 
                  value={memeState.topText}
                  onChange={(e) => setMemeState(prev => ({ ...prev, topText: e.target.value }))}
                  placeholder="Enter top text..."
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all resize-none"
                  rows={2}
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Bottom Text</label>
                <textarea 
                  value={memeState.bottomText}
                  onChange={(e) => setMemeState(prev => ({ ...prev, bottomText: e.target.value }))}
                  placeholder="Enter bottom text..."
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all resize-none"
                  rows={2}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Font Size</label>
                <input 
                  type="range" 
                  min="5" max="25" 
                  value={memeState.fontSize} 
                  onChange={(e) => setMemeState(prev => ({ ...prev, fontSize: parseInt(e.target.value) }))}
                  className="w-full accent-indigo-500"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Text Color</label>
                <div className="flex space-x-2">
                  {['white', 'yellow', 'red', 'cyan'].map(color => (
                    <button
                      key={color}
                      onClick={() => setMemeState(prev => ({ ...prev, textColor: color }))}
                      className={`w-6 h-6 rounded-full border-2 ${memeState.textColor === color ? 'border-indigo-500 scale-110' : 'border-transparent'}`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>
            </div>

            <div className="flex space-x-2 pt-4 border-t border-slate-700">
              <button 
                onClick={handleAnalyze}
                disabled={!memeState.imageUrl || status === AppStatus.ANALYZING}
                className="flex-1 bg-slate-700 hover:bg-slate-600 disabled:opacity-50 py-2 rounded-lg font-bold text-sm transition-all"
              >
                Analyze Image
              </button>
            </div>
          </div>

          {/* AI Image Edit */}
          <div className="bg-indigo-900/20 rounded-2xl border border-indigo-500/20 p-6 space-y-4 shadow-xl">
             <h2 className="text-lg font-bold flex items-center text-indigo-400">
               <i className="fa-solid fa-wand-magic mr-2"></i>
               Smart Edit
             </h2>
             <p className="text-xs text-indigo-300/70">Use natural language to transform the image</p>
             <div className="relative">
                <input 
                  type="text"
                  value={aiPrompt}
                  onChange={(e) => setAiPrompt(e.target.value)}
                  placeholder="e.g. 'Add a retro filter' or 'Make it spooky'..."
                  className="w-full bg-slate-900/50 border border-indigo-500/30 rounded-lg pl-3 pr-10 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                />
                <button 
                  onClick={handleAIEdit}
                  disabled={!memeState.imageUrl || !aiPrompt || status === AppStatus.EDITING}
                  className="absolute right-2 top-1.5 text-indigo-400 hover:text-indigo-300 disabled:opacity-50"
                >
                  {status === AppStatus.EDITING ? (
                    <i className="fa-solid fa-spinner fa-spin"></i>
                  ) : (
                    <i className="fa-solid fa-paper-plane"></i>
                  )}
                </button>
             </div>
          </div>

          {/* Template Gallery */}
          <div className="space-y-4">
            <h2 className="text-lg font-bold">Trending Templates</h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-2 gap-3 overflow-y-auto max-h-[300px] pr-2 scrollbar-thin scrollbar-thumb-slate-700">
              {TRENDING_TEMPLATES.map(template => (
                <button
                  key={template.id}
                  onClick={() => selectTemplate(template)}
                  className={`group relative aspect-square rounded-xl overflow-hidden border-2 transition-all ${memeState.imageUrl === template.url ? 'border-indigo-500 scale-95 shadow-lg shadow-indigo-500/20' : 'border-slate-700 hover:border-slate-500'}`}
                >
                  <img src={template.url} alt={template.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-2">
                    <span className="text-[10px] font-bold text-white truncate">{template.name}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </main>

      {/* Global Status Banner */}
      {status !== AppStatus.IDLE && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[60] flex items-center bg-indigo-600 text-white px-6 py-3 rounded-full shadow-2xl animate-bounce">
          <i className="fa-solid fa-circle-notch fa-spin mr-3"></i>
          <span className="font-bold">
            {status === AppStatus.ANALYZING ? 'Gemini is thinking...' : 'Transforming image...'}
          </span>
        </div>
      )}
    </div>
  );
};

export default App;
