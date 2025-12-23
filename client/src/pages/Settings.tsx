import React, { useState } from 'react';
import { ToggleLeft, ToggleRight, Save, Cpu, Shield, Zap } from 'lucide-react';
import { motion } from 'framer-motion';

const Settings = () => {
  const [config, setConfig] = useState({
    aiProvider: 'openai',
    sentimentAnalysis: true,
    autoResponse: false,
    personality: 'professional'
  });

  const handleToggle = (key: keyof typeof config) => {
    setConfig(prev => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary">
          System Configuration
        </h1>
        <p className="text-gray-400">Manage AI parameters and neural protocols</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* AI Core Settings */}
        <section className="bg-glass border border-glass-border rounded-xl p-6">
            <div className="flex items-center gap-3 mb-6">
                <Cpu className="text-primary h-6 w-6" />
                <h2 className="text-xl font-bold">AI Core Processor</h2>
            </div>

            <div className="space-y-6">
                <div className="space-y-2">
                    <label className="text-sm text-gray-400">Active Provider</label>
                    <div className="grid grid-cols-2 gap-2 bg-black/40 p-1 rounded-lg border border-white/5">
                        <button
                            onClick={() => setConfig({...config, aiProvider: 'openai'})}
                            className={`py-2 rounded-md text-sm font-medium transition-all ${config.aiProvider === 'openai' ? 'bg-primary/20 text-primary shadow-[0_0_10px_rgba(0,243,255,0.2)]' : 'text-gray-500 hover:text-white'}`}
                        >
                            OpenAI GPT-4
                        </button>
                        <button
                             onClick={() => setConfig({...config, aiProvider: 'anthropic'})}
                             className={`py-2 rounded-md text-sm font-medium transition-all ${config.aiProvider === 'anthropic' ? 'bg-secondary/20 text-secondary shadow-[0_0_10px_rgba(188,19,254,0.2)]' : 'text-gray-500 hover:text-white'}`}
                        >
                            Anthropic Claude
                        </button>
                    </div>
                </div>

                <div className="space-y-2">
                    <label className="text-sm text-gray-400">Agent Personality</label>
                    <select
                        value={config.personality}
                        onChange={(e) => setConfig({...config, personality: e.target.value})}
                        className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-primary/50"
                    >
                        <option value="professional">Professional / Corporate</option>
                        <option value="friendly">Friendly / Casual</option>
                        <option value="futuristic">Futuristic / AI-Native</option>
                        <option value="pirate">Pirate (Experimental)</option>
                    </select>
                </div>
            </div>
        </section>

        {/* Neural Protocols */}
        <section className="bg-glass border border-glass-border rounded-xl p-6">
             <div className="flex items-center gap-3 mb-6">
                <Zap className="text-accent h-6 w-6" />
                <h2 className="text-xl font-bold">Neural Protocols</h2>
            </div>

            <div className="space-y-4">
                <div className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/5">
                    <div className="flex flex-col">
                        <span className="font-medium">Sentiment Analysis</span>
                        <span className="text-xs text-gray-500">Detect user emotion in real-time</span>
                    </div>
                    <button onClick={() => setConfig({...config, sentimentAnalysis: !config.sentimentAnalysis})} className="text-primary transition-transform active:scale-95">
                        {config.sentimentAnalysis ? <ToggleRight size={32} /> : <ToggleLeft size={32} className="text-gray-600" />}
                    </button>
                </div>

                 <div className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/5">
                    <div className="flex flex-col">
                        <span className="font-medium">Autonomous Mode</span>
                        <span className="text-xs text-gray-500">Allow AI to initiate conversations</span>
                    </div>
                    <button onClick={() => setConfig({...config, autoResponse: !config.autoResponse})} className="text-primary transition-transform active:scale-95">
                        {config.autoResponse ? <ToggleRight size={32} /> : <ToggleLeft size={32} className="text-gray-600" />}
                    </button>
                </div>

                <div className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/5 opacity-50 cursor-not-allowed">
                    <div className="flex flex-col">
                        <span className="font-medium">Voice Synthesis</span>
                        <span className="text-xs text-gray-500">Enable voice responses (Coming Soon)</span>
                    </div>
                    <ToggleLeft size={32} className="text-gray-600" />
                </div>
            </div>
        </section>
      </div>

      <div className="flex justify-end pt-4">
          <button className="flex items-center gap-2 bg-primary text-black font-bold px-6 py-3 rounded-lg hover:bg-primary/90 transition-all shadow-[0_0_20px_rgba(0,243,255,0.4)]">
              <Save size={18} />
              SAVE CONFIGURATION
          </button>
      </div>
    </div>
  );
};

export default Settings;
