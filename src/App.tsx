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
import { generateMemeData, generateCaptions, MemeAnalysis } from './services/gemini';

const MAX_IMAGE_DIMENSION = 800; // Limit image size for AI analysis speed

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

  const [imageError, setImageError] = useState<string | null>(null);
  const [isImageLoading, setIsImageLoading] = useState(false);
  const [isGlobalError, setIsGlobalError] = useState(false);

  const resetApp = () => {
    setImage(null);
    setAnalysis(null);
    setCaptions([]);
    setSelectedCaption('');
    setImageError(null);
    setIsImageLoading(false);
    setIsAnalyzing(false);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setIsImageLoading(true);
      setImageError(null);
      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result as string;
        setImage(result);
        setMimeType(file.type);
        setAnalysis(null);
        setCaptions([]);
        setSelectedCaption('');
        setIsImageLoading(false);
      };
      reader.onerror = () => {
        setImageError("Failed to read file");
        setIsImageLoading(false);
      };
      reader.readAsDataURL(file);
    }
  };

  const processImage = async () => {
    if (!image) return;
    setIsAnalyzing(true);
    setImageError(null);
    try {
      // Optimize image for AI processing
      const optimizedImage = await optimizeImageForAI(image);
      
      const result = await generateMemeData(optimizedImage, mimeType, tone);
      
      if (!result || !result.objects) {
        throw new Error("Invalid analysis result");
      }
      
      setAnalysis({
        objects: result.objects,
        emotion: result.emotion,
        scene: result.scene
      });
      
      setCaptions(result.captions);
      if (result.captions.length > 0) {
        setSelectedCaption(result.captions[0]);
      }
    } catch (error) {
      console.error("Error processing image:", error);
      setImageError("AI analysis failed. Please try again.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const optimizeImageForAI = (base64: string): Promise<string> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_IMAGE_DIMENSION) {
            height *= MAX_IMAGE_DIMENSION / width;
            width = MAX_IMAGE_DIMENSION;
          }
        } else {
          if (height > MAX_IMAGE_DIMENSION) {
            width *= MAX_IMAGE_DIMENSION / height;
            height = MAX_IMAGE_DIMENSION;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', 0.8)); // Use JPEG for smaller payload
      };
      img.src = base64;
    });
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
    let isMounted = true;
    if (!image || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = new Image();
    
    const render = () => {
      if (!isMounted) return;
      
      // Ensure we have natural dimensions
      if (img.naturalWidth === 0 || img.naturalHeight === 0) {
        requestAnimationFrame(render);
        return;
      }

      // Set internal dimensions to match image
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      
      // Clear and draw image
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);

      if (!selectedCaption) return;

      // Meme text styling - Dynamic scaling
      const fontSize = Math.floor(canvas.width / 12);
      ctx.font = `bold ${fontSize}px Impact, "Arial Black", sans-serif`;
      ctx.fillStyle = 'white';
      ctx.strokeStyle = 'black';
      ctx.lineWidth = Math.max(2, fontSize / 12);
      ctx.textAlign = 'center';

      const wrapText = (text: string) => {
        const words = text.toUpperCase().split(' ');
        let line = '';
        const lines = [];
        const maxWidth = canvas.width * 0.85; // More padding for safety

        for (let n = 0; n < words.length; n++) {
          const testLine = line + words[n] + ' ';
          const metrics = ctx.measureText(testLine);
          if (metrics.width > maxWidth && n > 0) {
            lines.push(line.trim());
            line = words[n] + ' ';
          } else {
            line = testLine;
          }
        }
        lines.push(line.trim());
        return lines;
      };

      const lines = wrapText(selectedCaption);
      const lineHeight = fontSize * 1.05;
      const verticalPadding = fontSize * 0.4; // Safety padding from edges

      if (textPosition === 'top' || textPosition === 'both') {
        ctx.textBaseline = 'top';
        lines.forEach((line, i) => {
          const y = verticalPadding + (i * lineHeight);
          ctx.strokeText(line, canvas.width / 2, y);
          ctx.fillText(line, canvas.width / 2, y);
        });
      }

      if (textPosition === 'bottom' || textPosition === 'both') {
        ctx.textBaseline = 'bottom';
        const totalHeight = lines.length * lineHeight;
        lines.forEach((line, i) => {
          // Calculate Y from bottom with safety padding
          const y = canvas.height - verticalPadding - (totalHeight - (i + 1) * lineHeight);
          ctx.strokeText(line, canvas.width / 2, y);
          ctx.fillText(line, canvas.width / 2, y);
        });
      }
    };

    img.onload = () => {
      requestAnimationFrame(render);
    };
    img.onerror = () => {
      if (isMounted) {
        setImageError("Failed to load image into editor");
      }
    };
    img.src = image;

    // Check if image is already loaded (can happen with base64)
    if (img.complete) {
      requestAnimationFrame(render);
    }

    return () => {
      isMounted = false;
    };
  }, [image, selectedCaption, textPosition]);

  if (isGlobalError) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center space-y-6">
        <div className="p-4 bg-zinc-900 rounded-3xl border border-zinc-800 flex flex-col items-center">
          <Heart className="w-12 h-12 text-zinc-500 mb-4 animate-pulse" />
          <h1 className="text-2xl font-bold mb-2">Thank you for your patience</h1>
          <p className="text-zinc-400 max-w-md mb-6 whitespace-pre-wrap">Something went wrong while processing your request. Most of the time, this is just a temporary glitch.</p>
          <button 
            onClick={() => window.location.reload()}
            className="py-3 px-8 bg-brand-primary rounded-xl font-bold hover:bg-brand-primary/90 transition-all flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" /> Refresh Page
          </button>
        </div>
      </div>
    );
  }

  const downloadMeme = () => {
    if (canvasRef.current) {
      const link = document.createElement('a');
      link.download = 'meme-genius.png';
      link.href = canvasRef.current.toDataURL();
      link.click();
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center p-4 md:p-8 max-w-6xl mx-auto overflow-x-hidden">
      {/* Header */}
      <header className="w-full flex flex-col items-center mb-10 md:mb-16 text-center">
        <motion.div 
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="flex items-center gap-3 md:gap-4 mb-4 md:mb-6"
        >
          <div className="p-3 md:p-4 bg-brand-primary rounded-2xl md:rounded-[2rem] shadow-2xl shadow-brand-primary/20 rotate-3 hover:rotate-0 transition-transform duration-500">
            <Sparkles className="w-6 h-6 md:w-10 md:h-10 text-white" />
          </div>
          <div className="text-left">
            <h1 className="text-3xl md:text-6xl font-display font-black tracking-tightest leading-none">
              Meme<span className="text-brand-primary italic">Genius</span>
            </h1>
            <p className="text-zinc-500 text-[10px] md:text-xs font-bold uppercase tracking-[0.2em] md:tracking-[0.3em] mt-0.5 md:mt-1 ml-0.5 md:ml-1">AI Powered Humor</p>
          </div>
        </motion.div>
        <p className="text-zinc-400 max-w-lg text-sm md:text-base leading-relaxed px-2">
          The ultimate engine for your chaotic creativity. Upload a vibe, 
          let our AI analyze the scene, and export a masterpiece in seconds.
        </p>
      </header>

      <main className="w-full grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-8 transition-all">
        {/* Left Column: Upload & Preview */}
        <div className="lg:col-span-7 space-y-6">
          {!image ? (
            <motion.div 
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              onClick={() => fileInputRef.current?.click()}
              className="aspect-square md:aspect-video w-full border-2 border-dashed border-zinc-800 rounded-3xl flex flex-col items-center justify-center cursor-pointer hover:border-brand-primary/50 hover:bg-zinc-900/50 transition-all group"
            >
              {isImageLoading ? (
                <RefreshCw className="w-10 h-10 text-brand-primary animate-spin" />
              ) : (
                <>
                  <div className="p-6 bg-zinc-900 rounded-full mb-4 group-hover:scale-110 transition-transform">
                    <Upload className="w-10 h-10 text-zinc-500 group-hover:text-brand-primary" />
                  </div>
                  <p className="text-lg font-medium text-zinc-300">Drop your image here</p>
                  <p className="text-sm text-zinc-500 mt-1 text-center px-4">Support JPG, PNG, WEBP. Max 10MB.</p>
                </>
              )}
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
              <div className="relative rounded-3xl overflow-hidden bg-zinc-900 border border-zinc-800 shadow-2xl min-h-[300px] flex items-center justify-center">
                <canvas 
                  ref={canvasRef} 
                  className="w-full h-auto block max-h-[70vh] object-contain z-10"
                />
                
                {isAnalyzing && (
                  <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center z-20">
                    <RefreshCw className="w-12 h-12 text-brand-primary animate-spin mb-4" />
                    <p className="text-xl font-display font-bold animate-pulse">
                      {analysis ? "Generating Humor..." : "Analyzing Vibe..."}
                    </p>
                    <p className="text-zinc-400 text-sm mt-2">Gemini is cooking something spicy...</p>
                  </div>
                )}

                {imageError && (
                  <div className="absolute inset-0 bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center z-30">
                    <Skull className="w-12 h-12 text-red-500 mb-4" />
                    <p className="text-xl font-bold text-white mb-2">Oops!</p>
                    <p className="text-zinc-400 text-sm mb-6">{imageError}</p>
                    <button 
                      onClick={() => setImage(null)}
                      className="py-2 px-6 bg-zinc-800 hover:bg-zinc-700 rounded-xl text-sm font-bold transition-colors"
                    >
                      Try Another Image
                    </button>
                  </div>
                )}
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <button 
                  onClick={resetApp}
                  className="w-full sm:flex-1 py-4 px-6 bg-zinc-900 hover:bg-zinc-800 rounded-xl font-medium flex items-center justify-center gap-2 transition-all border border-zinc-800 text-zinc-300 active:scale-95"
                >
                  <RefreshCw className="w-4 h-4" /> New Image
                </button>
                <button 
                  onClick={downloadMeme}
                  disabled={!selectedCaption}
                  className="w-full sm:flex-1 py-4 px-6 bg-brand-primary hover:bg-brand-primary/90 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl font-medium flex items-center justify-center gap-2 transition-all shadow-lg shadow-brand-primary/20 active:scale-95"
                >
                  <Download className="w-4 h-4" /> Export
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Controls */}
        <div className="lg:col-span-5 space-y-6">
          {image && !analysis && !isAnalyzing && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="p-6 md:p-8 bg-zinc-900 rounded-3xl border border-zinc-800 flex flex-col items-center text-center shadow-xl"
            >
              <div className="w-16 h-16 md:w-20 md:h-20 bg-brand-primary/10 rounded-full flex items-center justify-center mb-4 md:mb-6">
                <Sparkles className="w-8 h-8 md:w-10 md:h-10 text-brand-primary" />
              </div>
              <h3 className="text-xl md:text-2xl font-bold mb-2 md:mb-3 font-display">Ready for the magic?</h3>
              <p className="text-zinc-400 mb-6 md:mb-8 leading-relaxed max-w-xs text-sm">Our AI will detect the vibe and suggest hilariously relevant captions for your photo.</p>
              <button 
                onClick={processImage}
                className="w-full py-4 bg-brand-primary hover:bg-brand-primary/90 rounded-2xl font-bold text-base md:text-lg flex items-center justify-center gap-2 transition-all shadow-xl shadow-brand-primary/30 group active:scale-[0.98]"
              >
                Generate Memes <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
            </motion.div>
          )}

          {analysis && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-8"
            >
              {/* Tone Selection */}
              <section>
                <div className="flex items-center gap-2 mb-4">
                  <Zap className="w-4 h-4 text-amber-500" />
                  <h3 className="text-sm font-bold uppercase tracking-widest text-zinc-500">
                    Vibe Check
                  </h3>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {TONES.map((t) => (
                    <button
                      key={t.id}
                      onClick={() => setTone(t.id)}
                      className={`py-4 px-2 rounded-xl border flex flex-col items-center gap-1.5 transition-all outline-none active:scale-90 ${
                        tone === t.id 
                          ? 'bg-zinc-800 border-brand-primary ring-1 ring-brand-primary text-white shadow-lg' 
                          : 'bg-zinc-900 border-zinc-800 hover:border-zinc-700 text-zinc-500 hover:text-zinc-300'
                      }`}
                    >
                      <div className={`p-1.5 rounded-lg ${tone === t.id ? t.color : 'bg-zinc-800'} text-white transition-colors`}>
                        {t.icon}
                      </div>
                      <span className="text-[10px] font-bold uppercase tracking-tighter">{t.name}</span>
                    </button>
                  ))}
                </div>
              </section>

              {/* Captions */}
              <section>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <TypeIcon className="w-4 h-4 text-brand-primary" />
                    <h3 className="text-sm font-bold uppercase tracking-widest text-zinc-500">
                      Captions
                    </h3>
                  </div>
                  <button 
                    onClick={regenerateCaptions}
                    disabled={isAnalyzing}
                    className="text-xs font-bold text-brand-primary hover:text-brand-primary/80 flex items-center gap-1.5 disabled:opacity-50 transition-colors bg-brand-primary/5 py-1.5 px-3 rounded-full border border-brand-primary/10"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isAnalyzing ? 'animate-spin' : ''}`} /> Refresh
                  </button>
                </div>
                <div className="space-y-2.5">
                  <AnimatePresence mode="popLayout" initial={false}>
                    {captions.map((cap, idx) => (
                      <motion.button
                        key={cap}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ delay: idx * 0.05 }}
                        onClick={() => setSelectedCaption(cap)}
                        className={`w-full p-4 md:p-5 text-left rounded-2xl border transition-all relative overflow-hidden group active:scale-[0.98] ${
                          selectedCaption === cap
                            ? 'bg-brand-primary/5 border-brand-primary/50 text-white ring-1 ring-brand-primary/20'
                            : 'bg-zinc-900/50 border-zinc-800 hover:border-zinc-700 text-zinc-400 hover:text-zinc-200'
                        }`}
                      >
                        {selectedCaption === cap && (
                          <motion.div 
                            layoutId="active-bg"
                            className="absolute left-0 top-0 w-1 h-full bg-brand-primary"
                          />
                        )}
                        <p className="text-sm font-medium leading-relaxed">"{cap}"</p>
                      </motion.button>
                    ))}
                  </AnimatePresence>
                </div>
              </section>

              {/* Position */}
              <section>
                <div className="flex items-center gap-2 mb-4">
                  <ImageIcon className="w-4 h-4 text-brand-secondary" />
                  <h3 className="text-sm font-bold uppercase tracking-widest text-zinc-500">
                    Layout
                  </h3>
                </div>
                <div className="flex p-1 bg-zinc-950 border border-zinc-800 rounded-xl gap-1">
                  {(['top', 'bottom', 'both'] as const).map((pos) => (
                    <button
                      key={pos}
                      onClick={() => setTextPosition(pos)}
                      className={`flex-1 py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all ${
                        textPosition === pos
                          ? 'bg-zinc-800 text-white shadow-sm'
                          : 'bg-transparent text-zinc-500 hover:text-zinc-400'
                      }`}
                    >
                      {pos}
                    </button>
                  ))}
                </div>
              </section>
            </motion.div>
          )}

          {!image && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="p-8 bg-zinc-900/30 rounded-3xl border border-zinc-800/50 text-center backdrop-blur-sm shadow-inner"
            >
              <div className="flex justify-center -space-x-3 mb-8">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="w-12 h-12 rounded-full border-4 border-zinc-950 bg-zinc-800 overflow-hidden ring-1 ring-zinc-800 shadow-xl">
                    <img 
                      src={`https://picsum.photos/seed/meme${i}/120/120`} 
                      alt="User" 
                      className="w-full h-full object-cover opacity-60"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                ))}
                <div className="w-12 h-12 rounded-full border-4 border-zinc-950 bg-brand-primary flex items-center justify-center text-[10px] font-black text-white shadow-xl">
                  +5K
                </div>
              </div>
              <p className="text-sm text-zinc-400 italic font-medium leading-relaxed">
                "The only meme generator that actually understands my chaotic energy."
              </p>
              <div className="flex items-center justify-center gap-2 mt-4">
                <div className="h-0.5 w-4 bg-zinc-800" />
                <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Meme Enthusiast</p>
                <div className="h-0.5 w-4 bg-zinc-800" />
              </div>
            </motion.div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="mt-20 py-10 border-t border-zinc-900 w-full flex justify-center items-center text-zinc-500 text-sm">
        <div className="flex items-center gap-1.5 hover:text-zinc-300 transition-colors cursor-default">
          <span>Made with</span>
          <Heart className="w-4 h-4 text-brand-primary fill-brand-primary animate-pulse" />
          <span>by</span>
          <a 
            href="https://www.kumarharsh.in" 
            target="_blank" 
            rel="noopener noreferrer"
            className="font-bold text-zinc-300 hover:text-brand-primary transition-colors hover:underline decoration-brand-primary/30 underline-offset-4"
          >
            Harsh
          </a>
        </div>
      </footer>
    </div>
  );
}
