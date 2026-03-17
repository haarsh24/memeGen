/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Upload, 
  Sparkles, 
  Download, 
  RefreshCw, 
  Image as ImageIcon, 
  Type as TypeIcon,
  Smile,
  Zap,
  Skull,
  Heart,
  Briefcase,
  ChevronRight,
  Share2
} from 'lucide-react';
import { analyzeImage, generateCaptions, MemeAnalysis } from './services/gemini';

const TONES = [
  { id: 'sarcastic', name: 'Sarcastic', icon: <Zap className="w-4 h-4" />, color: 'bg-amber-500' },
  { id: 'savage', name: 'Savage', icon: <Skull className="w-4 h-4" />, color: 'bg-red-500' },
  { id: 'genz', name: 'Gen Z', icon: <Sparkles className="w-4 h-4" />, color: 'bg-purple-500' },
  { id: 'wholesome', name: 'Wholesome', icon: <Heart className="w-4 h-4" />, color: 'bg-pink-500' },
  { id: 'corporate', name: 'Corporate', icon: <Briefcase className="w-4 h-4" />, color: 'bg-blue-500' },
  { id: 'funny', name: 'Classic Funny', icon: <Smile className="w-4 h-4" />, color: 'bg-emerald-500' },
];

export default function App() {
  const [image, setImage] = useState<string | null>(null);
  const [mimeType, setMimeType] = useState<string>('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<MemeAnalysis | null>(null);
  const [captions, setCaptions] = useState<string[]>([]);
  const [selectedCaption, setSelectedCaption] = useState<string>('');
  const [tone, setTone] = useState('funny');
  const [textPosition, setTextPosition] = useState<'top' | 'bottom' | 'both'>('bottom');
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setImage(event.target?.result as string);
        setMimeType(file.type);
        setAnalysis(null);
        setCaptions([]);
        setSelectedCaption('');
      };
      reader.readAsDataURL(file);
    }
  };

  const processImage = async () => {
    if (!image) return;
    setIsAnalyzing(true);
    try {
      const result = await analyzeImage(image, mimeType);
      setAnalysis(result);
      const generatedCaptions = await generateCaptions(result, tone);
      setCaptions(generatedCaptions);
      if (generatedCaptions.length > 0) {
        setSelectedCaption(generatedCaptions[0]);
      }
    } catch (error) {
      console.error("Error processing image:", error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const regenerateCaptions = async () => {
    if (!analysis) return;
    setIsAnalyzing(true);
    try {
      const generatedCaptions = await generateCaptions(analysis, tone);
      setCaptions(generatedCaptions);
      if (generatedCaptions.length > 0) {
        setSelectedCaption(generatedCaptions[0]);
      }
    } catch (error) {
      console.error("Error regenerating captions:", error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  useEffect(() => {
    if (image && selectedCaption && canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const img = new Image();
      img.onload = () => {
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);

        // Meme text styling
        const fontSize = Math.floor(canvas.width / 12);
        ctx.font = `bold ${fontSize}px Impact, sans-serif`;
        ctx.fillStyle = 'white';
        ctx.strokeStyle = 'black';
        ctx.lineWidth = fontSize / 15;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';

        const drawText = (text: string, y: number) => {
          const words = text.toUpperCase().split(' ');
          let line = '';
          const lines = [];
          const maxWidth = canvas.width * 0.9;

          for (let n = 0; n < words.length; n++) {
            const testLine = line + words[n] + ' ';
            const metrics = ctx.measureText(testLine);
            if (metrics.width > maxWidth && n > 0) {
              lines.push(line);
              line = words[n] + ' ';
            } else {
              line = testLine;
            }
          }
          lines.push(line);

          lines.forEach((l, i) => {
            const lineY = y + (i * fontSize * 1.1);
            ctx.strokeText(l.trim(), canvas.width / 2, lineY);
            ctx.fillText(l.trim(), canvas.width / 2, lineY);
          });
        };

        if (textPosition === 'top' || textPosition === 'both') {
          drawText(selectedCaption, 20);
        }
        if (textPosition === 'bottom' || textPosition === 'both') {
          ctx.textBaseline = 'bottom';
          drawText(selectedCaption, canvas.height - 20 - (fontSize * 0.5));
        }
      };
      img.src = image;
    }
  }, [image, selectedCaption, textPosition]);

  const downloadMeme = () => {
    if (canvasRef.current) {
      const link = document.createElement('a');
      link.download = 'meme-genius.png';
      link.href = canvasRef.current.toDataURL();
      link.click();
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center p-4 md:p-8 max-w-6xl mx-auto">
      {/* Header */}
      <header className="w-full flex flex-col items-center mb-12 text-center">
        <motion.div 
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="flex items-center gap-3 mb-4"
        >
          <div className="p-3 bg-brand-primary rounded-2xl shadow-lg shadow-brand-primary/20">
            <Sparkles className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-4xl md:text-5xl font-display font-bold tracking-tight">
            Meme<span className="text-brand-primary">Genius</span> AI
          </h1>
        </motion.div>
        <p className="text-zinc-400 max-w-md">
          Turn any photo into a viral masterpiece. Our AI understands the vibe and brings the funny.
        </p>
      </header>

      <main className="w-full grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Upload & Preview */}
        <div className="lg:col-span-7 space-y-6">
          {!image ? (
            <motion.div 
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              onClick={() => fileInputRef.current?.click()}
              className="aspect-square md:aspect-video w-full border-2 border-dashed border-zinc-800 rounded-3xl flex flex-col items-center justify-center cursor-pointer hover:border-brand-primary/50 hover:bg-zinc-900/50 transition-all group"
            >
              <div className="p-6 bg-zinc-900 rounded-full mb-4 group-hover:scale-110 transition-transform">
                <Upload className="w-10 h-10 text-zinc-500 group-hover:text-brand-primary" />
              </div>
              <p className="text-lg font-medium text-zinc-300">Drop your image here</p>
              <p className="text-sm text-zinc-500 mt-1 text-center px-4">Support JPG, PNG, WEBP. Max 10MB.</p>
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleImageUpload} 
                className="hidden" 
                accept="image/*"
              />
            </motion.div>
          ) : (
            <div className="space-y-4">
              <div className="relative rounded-3xl overflow-hidden bg-zinc-900 border border-zinc-800 shadow-2xl">
                <canvas 
                  ref={canvasRef} 
                  className="w-full h-auto block max-h-[70vh] object-contain"
                />
                
                {isAnalyzing && (
                  <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center">
                    <RefreshCw className="w-12 h-12 text-brand-primary animate-spin mb-4" />
                    <p className="text-xl font-display font-bold animate-pulse">
                      {analysis ? "Generating Humor..." : "Analyzing Vibe..."}
                    </p>
                    <p className="text-zinc-400 text-sm mt-2">Gemini is cooking something spicy...</p>
                  </div>
                )}
              </div>

              <div className="flex flex-wrap gap-3">
                <button 
                  onClick={() => setImage(null)}
                  className="flex-1 py-3 px-6 bg-zinc-900 hover:bg-zinc-800 rounded-xl font-medium flex items-center justify-center gap-2 transition-colors border border-zinc-800"
                >
                  <RefreshCw className="w-4 h-4" /> New Image
                </button>
                <button 
                  onClick={downloadMeme}
                  disabled={!selectedCaption}
                  className="flex-1 py-3 px-6 bg-brand-primary hover:bg-brand-primary/90 disabled:opacity-50 rounded-xl font-medium flex items-center justify-center gap-2 transition-colors shadow-lg shadow-brand-primary/20"
                >
                  <Download className="w-4 h-4" /> Download
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Controls */}
        <div className="lg:col-span-5 space-y-8">
          {image && !analysis && !isAnalyzing && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-6 bg-zinc-900 rounded-3xl border border-zinc-800 flex flex-col items-center text-center"
            >
              <div className="w-16 h-16 bg-brand-primary/10 rounded-full flex items-center justify-center mb-4">
                <Sparkles className="w-8 h-8 text-brand-primary" />
              </div>
              <h3 className="text-xl font-bold mb-2">Ready to Meme?</h3>
              <p className="text-zinc-400 mb-6">Click the button below to let AI analyze your image and generate funny captions.</p>
              <button 
                onClick={processImage}
                className="w-full py-4 bg-brand-primary hover:bg-brand-primary/90 rounded-2xl font-bold text-lg flex items-center justify-center gap-2 transition-all shadow-xl shadow-brand-primary/20"
              >
                Analyze & Generate <ChevronRight className="w-5 h-5" />
              </button>
            </motion.div>
          )}

          {analysis && (
            <div className="space-y-8">
              {/* Tone Selection */}
              <section>
                <h3 className="text-sm font-bold uppercase tracking-widest text-zinc-500 mb-4 flex items-center gap-2">
                  <Zap className="w-4 h-4" /> Select Tone
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {TONES.map((t) => (
                    <button
                      key={t.id}
                      onClick={() => setTone(t.id)}
                      className={`p-3 rounded-xl border flex flex-col items-center gap-2 transition-all ${
                        tone === t.id 
                          ? 'bg-zinc-800 border-brand-primary ring-1 ring-brand-primary' 
                          : 'bg-zinc-900 border-zinc-800 hover:border-zinc-700'
                      }`}
                    >
                      <div className={`p-2 rounded-lg ${t.color} bg-opacity-20 text-white`}>
                        {t.icon}
                      </div>
                      <span className="text-xs font-medium">{t.name}</span>
                    </button>
                  ))}
                </div>
              </section>

              {/* Captions */}
              <section>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-bold uppercase tracking-widest text-zinc-500 flex items-center gap-2">
                    <TypeIcon className="w-4 h-4" /> AI Captions
                  </h3>
                  <button 
                    onClick={regenerateCaptions}
                    disabled={isAnalyzing}
                    className="text-xs font-bold text-brand-primary hover:text-brand-primary/80 flex items-center gap-1 disabled:opacity-50"
                  >
                    <RefreshCw className={`w-3 h-3 ${isAnalyzing ? 'animate-spin' : ''}`} /> Regenerate
                  </button>
                </div>
                <div className="space-y-2">
                  <AnimatePresence mode="popLayout">
                    {captions.map((cap, idx) => (
                      <motion.button
                        key={cap}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.05 }}
                        onClick={() => setSelectedCaption(cap)}
                        className={`w-full p-4 text-left rounded-xl border transition-all ${
                          selectedCaption === cap
                            ? 'bg-brand-primary/10 border-brand-primary text-white'
                            : 'bg-zinc-900 border-zinc-800 hover:border-zinc-700 text-zinc-400 hover:text-zinc-200'
                        }`}
                      >
                        <p className="text-sm font-medium leading-relaxed">"{cap}"</p>
                      </motion.button>
                    ))}
                  </AnimatePresence>
                </div>
              </section>

              {/* Position */}
              <section>
                <h3 className="text-sm font-bold uppercase tracking-widest text-zinc-500 mb-4 flex items-center gap-2">
                  <ImageIcon className="w-4 h-4" /> Text Position
                </h3>
                <div className="flex gap-2">
                  {(['top', 'bottom', 'both'] as const).map((pos) => (
                    <button
                      key={pos}
                      onClick={() => setTextPosition(pos)}
                      className={`flex-1 py-2 rounded-lg border text-xs font-bold uppercase tracking-wider transition-all ${
                        textPosition === pos
                          ? 'bg-zinc-100 text-zinc-900 border-zinc-100'
                          : 'bg-zinc-900 border-zinc-800 text-zinc-500'
                      }`}
                    >
                      {pos}
                    </button>
                  ))}
                </div>
              </section>
            </div>
          )}

          {!image && (
            <div className="p-8 bg-zinc-900/50 rounded-3xl border border-zinc-800/50 text-center">
              <div className="flex justify-center -space-x-2 mb-6">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="w-10 h-10 rounded-full border-2 border-zinc-950 bg-zinc-800 flex items-center justify-center overflow-hidden">
                    <img 
                      src={`https://picsum.photos/seed/meme${i}/100/100`} 
                      alt="User" 
                      className="w-full h-full object-cover opacity-50"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                ))}
                <div className="w-10 h-10 rounded-full border-2 border-zinc-950 bg-brand-primary flex items-center justify-center text-[10px] font-bold">
                  +2k
                </div>
              </div>
              <p className="text-sm text-zinc-500 italic">
                "Literally the best meme generator I've used. The AI actually gets my humor."
              </p>
              <p className="text-xs font-bold mt-2 text-zinc-400">— Probably a Gen Z</p>
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="mt-20 py-8 border-t border-zinc-900 w-full flex flex-col md:flex-row items-center justify-between gap-4 text-zinc-500 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-zinc-800 rounded flex items-center justify-center">
            <Sparkles className="w-3 h-3 text-zinc-400" />
          </div>
          <span>Powered by Gemini 3 Flash Vision</span>
        </div>
        <div className="flex items-center gap-6">
          <a href="#" className="hover:text-zinc-300 transition-colors">Privacy</a>
          <a href="#" className="hover:text-zinc-300 transition-colors">Terms</a>
          <a href="#" className="hover:text-zinc-300 transition-colors flex items-center gap-1">
            <Share2 className="w-3 h-3" /> Share App
          </a>
        </div>
      </footer>
    </div>
  );
}
