import { useState, useRef, useEffect, useCallback } from 'react';
import {
  Home as HomeIcon,
  LayoutGrid,
  Compass,
  Clock,
  Wallet,
  MoreHorizontal,
  ChevronDown,
  Paperclip,
  Mic,
  Send,
  Users,
  Menu,
  X,
  Cpu,
  ImageIcon,
  ShoppingBag,
  LogOut,
  Loader2,
} from 'lucide-react';
import { useLocation } from 'wouter';
import ParticleBackground from '../components/ParticleBackground';
import AetherixLogo from '../components/AethericLogo';

// --- Holographic Sphere Component ---
const HolographicSphere = () => {
  return (
    <div className="relative">
      {/* Outer white blinking glow */}
      <div className="absolute inset-0 rounded-full animate-sphere-glow"
        style={{
          boxShadow: '0 0 40px rgba(255,255,255,0.3), 0 0 80px rgba(255,255,255,0.15)',
        }}
      />
      <div className="absolute inset-0 rounded-full blur-3xl opacity-60 scale-110"
        style={{
          background: 'radial-gradient(circle, rgba(255,255,255,0.4) 0%, rgba(255,255,255,0.1) 50%, transparent 100%)',
        }}
      />
      <div className="relative w-48 h-48 md:w-64 md:h-64 rounded-full overflow-hidden border border-white/20 animate-sphere-border"
        style={{
          boxShadow: '0 0 60px rgba(255,255,255,0.3), inset 0 0 40px rgba(255,255,255,0.2)',
        }}
      >
        <div className="absolute inset-0"
          style={{
            background: 'linear-gradient(160deg, #e8f4ff 0%, #ffe8f0 30%, #f0e8ff 60%, #e0f8ff 100%)',
          }}
        />
        <div className="absolute inset-0 opacity-90">
          <div className="absolute w-[200%] h-[200%] -top-1/2 -left-1/2 animate-flow-slow"
            style={{ background: 'radial-gradient(ellipse at 30% 40%, rgba(255,150,220,0.8) 0%, rgba(200,150,255,0.5) 25%, transparent 50%)', filter: 'blur(20px)' }}
          />
          <div className="absolute w-[200%] h-[200%] -top-1/2 -left-1/2 animate-flow-medium"
            style={{ background: 'radial-gradient(ellipse at 70% 60%, rgba(100,220,255,0.7) 0%, rgba(150,200,255,0.4) 30%, transparent 55%)', filter: 'blur(25px)' }}
          />
          <div className="absolute w-[200%] h-[200%] -top-1/2 -left-1/2 animate-flow-fast"
            style={{ background: 'radial-gradient(ellipse at 50% 50%, rgba(255,255,255,0.9) 0%, rgba(240,250,255,0.5) 20%, transparent 45%)', filter: 'blur(15px)' }}
          />
        </div>
        <div className="absolute top-[15%] left-[20%] w-[30%] h-[20%] rounded-full"
          style={{ background: 'radial-gradient(ellipse at center, rgba(255,255,255,0.9) 0%, rgba(255,255,255,0.3) 40%, transparent 70%)', filter: 'blur(8px)' }}
        />
      </div>
      <style>{`
        @keyframes flow-slow { 0%, 100% { transform: translate(-10%, -5%) rotate(0deg) scale(1); } 50% { transform: translate(10%, 5%) rotate(5deg) scale(1.05); } }
        @keyframes flow-medium { 0%, 100% { transform: translate(5%, 5%) rotate(0deg) scale(1); } 50% { transform: translate(-10%, -5%) rotate(-8deg) scale(1.08); } }
        @keyframes flow-fast { 0%, 100% { transform: translate(0%, 0%) rotate(0deg) scale(1); } 50% { transform: translate(-15%, 5%) rotate(10deg) scale(1.1); } }
        .animate-flow-slow { animation: flow-slow 8s ease-in-out infinite; }
        .animate-flow-medium { animation: flow-medium 6s ease-in-out infinite; }
        .animate-flow-fast { animation: flow-fast 4s ease-in-out infinite; }

        @keyframes sphere-glow {
          0%, 100% { opacity: 0.4; transform: scale(1); }
          50% { opacity: 0.9; transform: scale(1.03); }
        }
        .animate-sphere-glow { animation: sphere-glow 2.5s ease-in-out infinite; }

        @keyframes sphere-border {
          0%, 100% { border-color: rgba(255,255,255,0.15); box-shadow: 0 0 30px rgba(255,255,255,0.15), inset 0 0 30px rgba(255,255,255,0.1); }
          50% { border-color: rgba(255,255,255,0.5); box-shadow: 0 0 60px rgba(255,255,255,0.4), inset 0 0 40px rgba(255,255,255,0.2); }
        }
        .animate-sphere-border { animation: sphere-border 2.5s ease-in-out infinite; }
      `}</style>
    </div>
  );
};

// --- Main Dashboard Component ---
const AethericDashboard = () => {
  const [, setLocation] = useLocation();
  const [activeNav, setActiveNav] = useState('Home');
  const [messageInput, setMessageInput] = useState('');
  const [messages, setMessages] = useState<{ role: string; content: string }[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [selectedModel, setSelectedModel] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('defaultModel') || 'opencode/big-pickle';
  });
  const [models, setModels] = useState<any[]>([]);
  const [modelDropdownOpen, setModelDropdownOpen] = useState(false);
  const [attachedImage, setAttachedImage] = useState<string | null>(null);
  const [imagePreviewName, setImagePreviewName] = useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // MCP Server State (Generic - like Claude Desktop)
  const [mcpServers, setMcpServers] = useState<any[]>([]);
  const [showMcpModal, setShowMcpModal] = useState(false);
  const [mcpLoading, setMcpLoading] = useState<string | null>(null);
  const [mcpError, setMcpError] = useState('');
  const [addServerForm, setAddServerForm] = useState({ id: '', name: '', url: '', icon: '🔌', description: '' });
  const [showAddServer, setShowAddServer] = useState(false);
  const [connectToken, setConnectToken] = useState('');

  // Desktop mode detection — supports both Electron URL params AND auto-detection
  const [isDesktopMode, setIsDesktopMode] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('desktop') === 'true';
  });
  const localPort = (() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('localPort') || '9876';
  })();

  // Auto-detect desktop app on mount — ping localhost:9876 to check if it's running
  useEffect(() => {
    if (isDesktopMode) return; // Already detected via URL param
    const detectDesktopApp = async () => {
      try {
        const res = await fetch(`http://localhost:${localPort}/health`, { signal: AbortSignal.timeout(2000) });
        const data = await res.json();
        if (data.status === 'ok' && data.app === 'aetherix-desktop') {
          console.log('[Auto-Detect] ✅ Aetherix Desktop app detected! Enabling local MCP mode.');
          setIsDesktopMode(true);
        }
      } catch {
        // Desktop app not running, that's fine
      }
    };
    detectDesktopApp();
  }, []);

  // Load MCP servers on mount (and re-fetch when desktop mode changes)
  useEffect(() => {
    fetchMcpServers();
  }, [isDesktopMode]);

  const fetchMcpServers = async () => {
    try {
      const res = await fetch('/api/mcp/servers');
      const data = await res.json();
      let servers = data.servers || [];

      // In desktop mode, also check localhost for Swiggy connection status
      if (isDesktopMode) {
        try {
          const localRes = await fetch(`http://localhost:${localPort}/auth/status`);
          const localStatus = await localRes.json();
          // Merge local connection status into server list
          servers = servers.map((s: any) => {
            const localInfo = localStatus[s.id];
            if (localInfo && localInfo.connected) {
              return { ...s, status: 'connected', tools: s.tools || [] };
            }
            return s;
          });
        } catch (e) {
          console.log('[Desktop] Local server not reachable, using web status');
        }
      }

      setMcpServers(servers);
    } catch {}
  };

  // Listen for OAuth callback postMessage from popup
  useEffect(() => {
    const handleOAuthMessage = async (event: MessageEvent) => {
      if (event.data?.type === 'mcp-auth-success') {
        console.log('[OAuth] Auth success for:', event.data.serverId);
        setMcpError('');
        // Small delay to let local server store the token
        setTimeout(async () => {
          await fetchMcpServers();
          setMcpLoading(null);
        }, 500);
      } else if (event.data?.type === 'mcp-auth-error') {
        console.error('[OAuth] Auth error:', event.data.error);
        setMcpError(event.data.error || 'Authentication failed');
        await fetchMcpServers();
        setMcpLoading(null);
      }
    };
    window.addEventListener('message', handleOAuthMessage);
    return () => window.removeEventListener('message', handleOAuthMessage);
  }, []);

  const handleMcpConnect = async (serverId: string) => {
    setMcpLoading(serverId); setMcpError('');
    try {
      // Check if running in desktop mode (Electron) — use local OAuth
      if (isDesktopMode && (serverId.startsWith('swiggy'))) {
        console.log('[Desktop] Using local OAuth for:', serverId);
        const authRes = await fetch(`http://localhost:${localPort}/auth/start?serverId=${serverId}`);
        const authData = await authRes.json();

        if (authData.authUrl) {
          const width = 500, height = 700;
          const left = window.screenX + (window.innerWidth - width) / 2;
          const top = window.screenY + (window.innerHeight - height) / 2;
          window.open(
            authData.authUrl,
            'swiggy-auth',
            `width=${width},height=${height},left=${left},top=${top},menubar=no,toolbar=no`
          );
          setMcpError('');
          return;
        } else {
          setMcpError(authData.error || 'Failed to start local OAuth');
        }
        setMcpLoading(null);
        return;
      }

      // Normal web flow — use AWS backend
      const res = await fetch('/api/mcp/connect', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ serverId, authToken: connectToken || undefined }),
      });
      const data = await res.json();

      if (data.authRequired) {
        // OAuth flow needed — get auth URL and open popup
        console.log('[OAuth] Auth required, starting OAuth flow...');
        const authRes = await fetch(`/api/mcp/auth/start?serverId=${serverId}`);
        const authData = await authRes.json();
        
        if (authData.authUrl) {
          // Open Swiggy auth page in popup
          const width = 500, height = 700;
          const left = window.screenX + (window.innerWidth - width) / 2;
          const top = window.screenY + (window.innerHeight - height) / 2;
          window.open(
            authData.authUrl,
            'swiggy-auth',
            `width=${width},height=${height},left=${left},top=${top},menubar=no,toolbar=no`
          );
          // Keep loading state — will be cleared by postMessage handler
          setMcpError('');
          return;
        } else {
          setMcpError(authData.error || 'Failed to start OAuth');
        }
      } else if (!data.success) {
        setMcpError(data.error || 'Connection failed');
      }

      setConnectToken('');
      await fetchMcpServers();
    } catch { setMcpError('Network error'); }
    setMcpLoading(null);
  };

  const handleMcpDisconnect = async (serverId: string) => {
    setMcpLoading(serverId);
    await fetch('/api/mcp/disconnect', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ serverId }),
    });
    await fetchMcpServers();
    setMcpLoading(null);
  };

  const handleAddServer = async () => {
    if (!addServerForm.id || !addServerForm.name || !addServerForm.url) {
      setMcpError('ID, Name, and URL are required'); return;
    }
    setMcpLoading('adding');
    await fetch('/api/mcp/add-server', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(addServerForm),
    });
    setAddServerForm({ id: '', name: '', url: '', icon: '🔌', description: '' });
    setShowAddServer(false);
    await fetchMcpServers();
    setMcpLoading(null);
  };

  const connectedCount = mcpServers.filter(s => s.status === 'connected').length;
  const totalTools = mcpServers.reduce((sum, s) => sum + (s.toolCount || 0), 0);

  // Handle image upload
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { alert('Image must be under 5MB'); return; }
    setImagePreviewName(file.name);
    const reader = new FileReader();
    reader.onload = () => {
      setAttachedImage(reader.result as string);
      // Auto-switch to vision model
      setSelectedModel('opencode/gpt-5-nano');
    };
    reader.readAsDataURL(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Fetch available models
  useEffect(() => {
    fetch('/api/models').then(r => r.json()).then(data => {
      if (data.models) setModels(data.models);
    }).catch(() => {});
  }, []);

  // --- Voice Input (Web Speech API) ---
  const toggleVoice = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) { alert('Voice input not supported in this browser. Use Chrome or Edge.'); return; }

    if (isListening && recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'hi-IN'; // Hindi + English mixed
    recognition.interimResults = true;
    recognition.continuous = false;
    recognitionRef.current = recognition;

    recognition.onresult = (event: any) => {
      const transcript = Array.from(event.results).map((r: any) => r[0].transcript).join('');
      setMessageInput(transcript);
    };
    recognition.onend = () => setIsListening(false);
    recognition.onerror = () => setIsListening(false);

    recognition.start();
    setIsListening(true);
  };

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleSend = async (text?: string) => {
    const userMsg = (text || messageInput).trim();
    if ((!userMsg && !attachedImage) || isLoading) return;
    setMessageInput('');
    const displayMsg = attachedImage
      ? `📸 ${imagePreviewName}${userMsg ? '\n' + userMsg : ''}`
      : userMsg;
    setMessages(prev => [...prev, { role: 'user', content: displayMsg }]);
    setIsLoading(true);

    try {
      const payload = {
        message: userMsg || 'Describe this image',
        sessionId,
        modelId: attachedImage ? (models.find(m => m.vision)?.id || selectedModel) : selectedModel,
        image: attachedImage || undefined,
        userId: 'web_user',
        useLocalMcp: isDesktopMode,
      };
      console.log('[Chat] Sending:', JSON.stringify(payload).slice(0, 200));
      
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      
      if (!res.ok) {
        const errText = await res.text();
        console.error('[Chat] Server error:', res.status, errText);
        setMessages(prev => [...prev, { role: 'assistant', content: `Server error (${res.status}). Please try again.` }]);
        return;
      }
      
      let data = await res.json();
      if (data.sessionId) setSessionId(data.sessionId);

      // Desktop mode: If AI wants to call a Swiggy tool, proxy it via localhost
      if (isDesktopMode && data.mcpData?.pendingLocalExecution) {
        const toolAction = data.mcpData.action; // { tool, params }
        try {
          const statusRes = await fetch(`http://localhost:${localPort}/auth/status`);
          const statusData = await statusRes.json();
          const serverId = data.intent === 'food' ? 'swiggy-food' : data.intent === 'instamart' ? 'swiggy-im' : 'swiggy-dineout';
          
          if (statusData[serverId]?.connected && toolAction?.tool) {
            // Map common tool names to Swiggy MCP tool names
            const toolMap: Record<string, string> = {
              'search_restaurants': 'search_restaurants',
              'get_menu': 'get_restaurant_menu',
              'place_order': 'place_food_order',
              'get_recommendations': 'search_restaurants',
            };
            
            const swiggyToolName = toolMap[toolAction.tool] || toolAction.tool;
            let swiggyArgs = { ...toolAction.params, latitude: '28.6139', longitude: '77.2090' }; // default location if missing
            
            // Map restaurantId to url for get_menu if necessary, but Swiggy MCP might take restaurant_id
            if (swiggyToolName === 'get_restaurant_menu' && swiggyArgs.restaurantId) {
              swiggyArgs.restaurant_id = swiggyArgs.restaurantId;
            }
            
            console.log(`[Desktop] Calling local MCP tool: ${swiggyToolName}`, swiggyArgs);
            const mcpToolCall = await fetch(`http://localhost:${localPort}/mcp/call`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                serverId,
                method: 'tools/call',
                params: {
                  name: swiggyToolName,
                  arguments: swiggyArgs
                }
              }),
            });
            const mcpResult = await mcpToolCall.json();
            console.log('[Desktop] Swiggy MCP result:', JSON.stringify(mcpResult).slice(0, 300));
            
            // Send result back to AI for a nice formatted reply
            const enrichRes = await fetch('/api/chat', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                message: "system_followup",
                sessionId: data.sessionId,
                modelId: selectedModel,
                isFollowUp: true,
                mcpResult: mcpResult?.result?.content ? mcpResult.result.content.map((c: any) => c.text || '').join('\n') : mcpResult
              }),
            });
            if (enrichRes.ok) {
              const enrichData = await enrichRes.json();
              if (enrichData.reply) {
                data.reply = '🟢 **Live Swiggy Data:**\n\n' + enrichData.reply;
              }
            }
          } else {
             data.reply = "⚠️ Cannot execute tool: Swiggy not connected locally.";
          }
        } catch (e: any) {
          console.log('[Desktop] Swiggy proxy not available:', e?.message);
          data.reply = "⚠️ Error reaching local Swiggy proxy.";
        }
      }

      if (data.reply) {
        setMessages(prev => [...prev, { role: 'assistant', content: data.reply }]);
      } else if (data.error) {
        setMessages(prev => [...prev, { role: 'assistant', content: `Error: ${data.error}` }]);
      } else {
        setMessages(prev => [...prev, { role: 'assistant', content: "Hmm, I got an empty response. Try again!" }]);
      }
    } catch (e: any) {
      console.error('[Chat] Fetch error:', e?.message || e);
      setMessages(prev => [...prev, { role: 'assistant', content: `Connection error: ${e?.message || 'Network issue'}. Please try again.` }]);
    } finally {
      setIsLoading(false);
      setAttachedImage(null);
      setImagePreviewName('');
    }
  };

  const navItems = [
    { name: 'Home', icon: HomeIcon },
    { name: 'Templates', icon: LayoutGrid },
    { name: 'Explore', icon: Compass },
    { name: 'History', icon: Clock },
    { name: 'Wallet', icon: Wallet },
  ];

  const recentChats = {
    'Today': ["Find me a plumber near...", "Order butter chicken from..."],
    'Yesterday': ["Book a ride to airport...", "Show nearby restaurants..."]
  };

  const featureCards = [
    { title: '🍕 Order Food', description: 'Search restaurants & order meals', prompt: 'I want to order food. Show me nearby restaurants.' },
    { title: '🚕 Book Rides', description: 'Get cabs, autos & bikes instantly', prompt: 'I need a ride. Show me available ride options.' },
    { title: '👷 Hire Workers', description: 'Find plumbers, electricians & more', prompt: 'I need to hire a worker. Show me available professionals.' },
  ];

  // --- Sidebar Content (reused for both desktop & mobile) ---
  const SidebarContent = () => (
    <>
      <div className="px-5 py-5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <AetherixLogo size="md" variant="dark" className="w-9 h-9 flex-shrink-0 mr-2" />
          <span className="text-xl font-semibold tracking-tight">Aetherix</span>
        </div>
        {/* Close button on mobile */}
        <button onClick={() => setSidebarOpen(false)} className="md:hidden text-gray-400 hover:text-white">
          <X className="w-5 h-5" />
        </button>
      </div>

      <nav className="px-3 mb-4">
        <ul className="space-y-0.5">
          {navItems.map((item) => (
            <li key={item.name}>
              <button
                onClick={() => { setActiveNav(item.name); setSidebarOpen(false); }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${activeNav === item.name ? 'bg-[#1a1a1a] text-white' : 'text-gray-400 hover:text-gray-200 hover:bg-[#151515]'
                  }`}
              >
                <item.icon className="w-4 h-4" />
                <span>{item.name}</span>
              </button>
            </li>
          ))}
        </ul>
      </nav>

      {/* Become a Worker Button */}
      <div className="px-3 mb-2">
        <button
          onClick={() => { setLocation('/become-worker'); setSidebarOpen(false); }}
          className="w-full flex items-center gap-3 px-3 py-3 rounded-xl bg-white/5 border border-white/15 text-sm font-medium text-white/70 hover:bg-white/10 hover:border-white/30 hover:text-white transition-all"
        >
          <Users className="w-4 h-4" />
          <span>Become a Worker</span>
        </button>
      </div>

      {/* MCP Servers Button (Like Claude Desktop) */}
      <div className="px-3 mb-4">
        <button
          onClick={() => { setShowMcpModal(true); setMcpError(''); fetchMcpServers(); }}
          className={`w-full flex items-center justify-between px-3 py-3 rounded-xl text-sm font-medium transition-all ${
            connectedCount > 0
              ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/20'
              : 'bg-violet-500/10 border border-violet-500/25 text-violet-300 hover:bg-violet-500/20 hover:border-violet-500/40'
          }`}
        >
          <div className="flex items-center gap-2.5">
            <Cpu className="w-4 h-4" />
            <span>MCP Servers</span>
          </div>
          {connectedCount > 0 && (
            <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded-full">
              {connectedCount} • {totalTools} tools
            </span>
          )}
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-2">
        {Object.entries(recentChats).map(([date, chats]) => (
          <div key={date} className="mb-5">
            <h4 className="text-xs font-medium text-gray-500 mb-2">{date}</h4>
            <ul className="space-y-0.5">
              {chats.map((chat, i) => (
                <li key={i} className="text-sm text-gray-400 hover:text-gray-200 cursor-pointer truncate py-1 px-1">{chat}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="p-4 border-t border-[#1a1a1a]">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-white/15 flex items-center justify-center text-xs font-bold text-white border border-white/20">AI</div>
          <div className="flex flex-col">
            <span className="text-sm font-medium">Aetherix User</span>
            <span className="text-xs text-gray-500">Free Plan</span>
          </div>
        </div>
      </div>
    </>
  );

  return (
    <div className="flex h-screen w-full bg-[#0a0a0a] text-white font-sans overflow-hidden">
      {/* Custom Scrollbar Styles */}
      <style>{`
        .chat-scroll::-webkit-scrollbar { width: 8px; }
        .chat-scroll::-webkit-scrollbar-track { background: #0a0a0a; }
        .chat-scroll::-webkit-scrollbar-thumb { background: #2a2a2a; border-radius: 4px; }
        .chat-scroll::-webkit-scrollbar-thumb:hover { background: #3a3a3a; }
        * { scrollbar-width: thin; scrollbar-color: #2a2a2a #0a0a0a; }

        /* ✨ AI Reply Glow Effect — remove this block to disable */
        @keyframes ai-glow {
          0%, 100% { box-shadow: 0 0 4px rgba(255,255,255,0.15), 0 0 10px rgba(255,255,255,0.05); border-color: #2a2a2a; }
          50% { box-shadow: 0 0 12px rgba(255,255,255,0.4), 0 0 25px rgba(255,255,255,0.15); border-color: rgba(255,255,255,0.3); }
        }
        .ai-reply-glow {
          animation: ai-glow 2.5s ease-in-out infinite;
        }

        /* ✨ Subtle border breathing for chat elements */
        @keyframes border-breathe {
          0%, 100% { border-color: #2a2a2a; }
          50% { border-color: rgba(255,255,255,0.2); }
        }
        .border-breathe {
          animation: border-breathe 3s ease-in-out infinite;
        }
      `}</style>

      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/60 z-40 md:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar — Desktop: always visible, Mobile: slide-in overlay */}
      <aside className={`
        fixed md:static z-50 h-full w-64 bg-[#0d0d0d] border-r border-[#1a1a1a] flex flex-col flex-shrink-0
        transition-transform duration-300 ease-in-out
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        <SidebarContent />
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-full overflow-hidden relative">
        <ParticleBackground />
        <header className="flex items-center justify-between px-4 md:px-6 py-4">
          <div className="flex items-center gap-3">
            {/* Hamburger for mobile */}
            <button onClick={() => setSidebarOpen(true)} className="md:hidden p-2 rounded-lg bg-[#1a1a1a] border border-[#2a2a2a] text-gray-300 hover:text-white hover:border-white/20 transition-all">
              <Menu className="w-5 h-5" />
            </button>
            {/* Model Selector Dropdown */}
            <div className="relative">
              <button
                onClick={() => setModelDropdownOpen(!modelDropdownOpen)}
                className="flex items-center gap-2 px-4 py-2 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg text-sm font-medium text-gray-300 hover:border-white/20 hover:text-white transition-all"
              >
                <Cpu className="w-4 h-4 text-gray-400" />
                <span>{models.find(m => m.id === selectedModel)?.name || 'Aetherix AI'}</span>
                <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform ${modelDropdownOpen ? 'rotate-180' : ''}`} />
              </button>
              {modelDropdownOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setModelDropdownOpen(false)} />
                  <div className="absolute top-full left-0 mt-2 w-72 bg-[#141414] border border-[#2a2a2a] rounded-xl shadow-2xl z-50 overflow-hidden">
                    <div className="p-2 border-b border-[#2a2a2a]">
                      <p className="text-xs text-gray-500 px-2 py-1">Select AI Model</p>
                    </div>
                    <div className="p-1 max-h-64 overflow-y-auto">
                      {models.map(m => (
                        <button
                          key={m.id}
                          onClick={() => { setSelectedModel(m.id); setModelDropdownOpen(false); }}
                          className={`w-full flex items-start gap-3 px-3 py-2.5 rounded-lg text-left transition-all ${
                            selectedModel === m.id
                              ? 'bg-white/10 border border-white/20'
                              : 'hover:bg-white/5 border border-transparent'
                          }`}
                        >
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium text-gray-200">{m.name}</span>
                              {m.vision && <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-medium">VISION</span>}
                              {m.provider === 'opencode' && <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-400 font-medium">FREE</span>}
                            </div>
                            <p className="text-xs text-gray-500 mt-0.5">{m.description}</p>
                          </div>
                          {selectedModel === m.id && <span className="text-white mt-1">✓</span>}
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
          <button className="p-2.5 rounded-lg bg-[#1a1a1a] border border-[#2a2a2a] text-gray-400 hover:text-white transition-colors">
            <MoreHorizontal className="w-5 h-5" />
          </button>
        </header>

        <div className="flex-1 flex flex-col items-center justify-center px-4 md:px-6 pb-6 overflow-y-auto chat-scroll">
          {messages.length === 0 ? (
            <>
              <div className="mb-12">
                <HolographicSphere />
              </div>
              <div className="text-center mb-10">
                <h1 className="text-3xl font-medium text-white mb-2">Welcome to Aetherix AI</h1>
                <p className="text-xl font-normal text-gray-400">How can I help you today?</p>
              </div>
            </>
          ) : (
            <div className="w-full max-w-3xl flex-1 overflow-y-auto mb-4 space-y-4 pt-4 flex flex-col chat-scroll">
              {messages.map((m, i) => (
                <div key={i} className={`p-4 rounded-2xl max-w-[85%] whitespace-pre-wrap ${m.role === 'user' ? 'bg-[#2a2a2a] text-white self-end border border-[#3a3a3a] border-breathe' : 'bg-transparent border border-[#2a2a2a] text-gray-300 self-start leading-relaxed ai-reply-glow'}`}>
                  {m.content}
                </div>
              ))}
              {isLoading && <div className="text-gray-500 self-start p-4 animate-pulse">Aetherix is thinking...</div>}
              <div ref={chatEndRef} />
            </div>
          )}

          {/* Input Box */}
          <div className="w-full max-w-3xl mb-4">
            <div className="bg-[#111111] border border-[#2a2a2a] rounded-2xl p-4 border-breathe">
              {/* Image Preview */}
              {attachedImage && (
                <div className="mb-3 relative inline-block">
                  <img src={attachedImage} alt="preview" className="max-h-24 rounded-lg border border-[#2a2a2a]" />
                  <button
                    onClick={() => { setAttachedImage(null); setImagePreviewName(''); }}
                    className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-white text-xs hover:bg-red-400"
                  >✕</button>
                  <p className="text-xs text-gray-500 mt-1">{imagePreviewName} • GPT-5 Nano (Vision)</p>
                </div>
              )}
              <div className="flex items-start gap-3 mb-4">
                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
                <button onClick={() => fileInputRef.current?.click()} className="mt-2 hover:text-white transition-colors">
                  {attachedImage
                    ? <ImageIcon className="w-5 h-5 text-emerald-400" />
                    : <Paperclip className="w-5 h-5 text-gray-500" />
                  }
                </button>
                <textarea
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSend();
                    }
                  }}
                  placeholder={attachedImage ? "Ask about this image..." : "Ask me to order food, book rides, or find workers..."}
                  className="flex-1 bg-transparent text-white outline-none resize-none py-2 placeholder:text-gray-600"
                  rows={1}
                />
              </div>
              <div className="flex items-center justify-end">
                <div className="flex gap-3 items-center">
                  <button onClick={toggleVoice} className={`p-1 rounded-md transition-all ${isListening ? 'text-white animate-pulse bg-white/10' : 'text-gray-500 hover:text-white'}`}>
                    <Mic className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleSend()}
                    disabled={(!messageInput.trim() && !attachedImage) || isLoading}
                    className="w-8 h-8 flex items-center justify-center rounded-lg bg-white hover:bg-white/80 text-black disabled:opacity-30 disabled:cursor-not-allowed transition-all active:scale-95"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Feature Cards — clickable instant prompts */}
          {messages.length === 0 && (
            <div className="w-full max-w-3xl grid grid-cols-1 md:grid-cols-3 gap-3">
              {featureCards.map((card, i) => (
                <button
                  key={i}
                  onClick={() => handleSend(card.prompt)}
                  className="bg-[#111111] border border-[#2a2a2a] rounded-xl p-4 hover:border-white/20 hover:bg-white/5 transition-all cursor-pointer hover:scale-[1.02] text-left border-breathe"
                >
                  <h3 className="text-sm font-medium text-gray-200 mb-1">{card.title}</h3>
                  <p className="text-xs text-gray-500">{card.description}</p>
                </button>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* MCP Servers Modal (Like Claude Desktop) */}
      {showMcpModal && (
        <>
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[60]" onClick={() => setShowMcpModal(false)} />
          <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
            <div className="bg-[#141414] border border-[#2a2a2a] rounded-2xl w-full max-w-md shadow-2xl max-h-[85vh] flex flex-col">
              {/* Header */}
              <div className="flex items-center justify-between p-5 border-b border-[#1e1e1e]">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-violet-500/20 flex items-center justify-center">
                    <Cpu className="w-5 h-5 text-violet-400" />
                  </div>
                  <div>
                    <h3 className="text-white font-semibold">MCP Servers</h3>
                    <p className="text-xs text-gray-500">{connectedCount} connected • {totalTools} tools available</p>
                  </div>
                </div>
                <button onClick={() => setShowMcpModal(false)} className="text-gray-500 hover:text-white transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Server List */}
              <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
                {mcpServers.map((server: any) => (
                  <div key={server.id} className={`rounded-xl border p-3.5 transition-all ${
                    server.status === 'connected' 
                      ? 'bg-emerald-500/5 border-emerald-500/20' 
                      : server.status === 'auth_required'
                        ? 'bg-amber-500/5 border-amber-500/20'
                        : 'bg-white/[0.02] border-[#2a2a2a] hover:border-[#3a3a3a]'
                  }`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <span className="text-xl flex-shrink-0">{server.icon}</span>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-white truncate">{server.name}</span>
                            {server.status === 'connected' && (
                              <span className="text-[9px] bg-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded-full flex-shrink-0">
                                {server.toolCount} tools
                              </span>
                            )}
                            {server.status === 'auth_required' && (
                              <span className="text-[9px] bg-amber-500/20 text-amber-400 px-1.5 py-0.5 rounded-full flex-shrink-0">
                                Login Required
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-gray-500 truncate">{server.description || server.url}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                        {mcpLoading === server.id ? (
                          <Loader2 className="w-4 h-4 text-violet-400 animate-spin" />
                        ) : server.status === 'connected' ? (
                          <button
                            onClick={() => handleMcpDisconnect(server.id)}
                            className="text-xs px-2.5 py-1.5 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/20 transition-all"
                          >
                            Disconnect
                          </button>
                        ) : (
                          <button
                            onClick={() => handleMcpConnect(server.id)}
                            className={`text-xs px-2.5 py-1.5 rounded-lg transition-all ${
                              server.status === 'auth_required'
                                ? 'bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 border border-amber-500/20'
                                : 'bg-violet-500/10 text-violet-400 hover:bg-violet-500/20 border border-violet-500/20'
                            }`}
                          >
                            {server.status === 'auth_required' ? '🔐 Login with Swiggy' : 'Connect'}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}

                {mcpServers.length === 0 && (
                  <div className="text-center py-8">
                    <Cpu className="w-10 h-10 text-gray-600 mx-auto mb-3" />
                    <p className="text-sm text-gray-400">No MCP servers registered</p>
                    <p className="text-xs text-gray-600 mt-1">Add a server to get started</p>
                  </div>
                )}
              </div>

              {/* Error */}
              {mcpError && (
                <div className="mx-4 mb-2 px-3 py-2 rounded-lg bg-red-500/10 border border-red-500/20">
                  <p className="text-xs text-red-400">{mcpError}</p>
                </div>
              )}

              {/* Add Custom Server */}
              <div className="p-4 border-t border-[#1e1e1e]">
                {showAddServer ? (
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        value={addServerForm.id} onChange={(e) => setAddServerForm(f => ({ ...f, id: e.target.value }))}
                        placeholder="server-id" className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg px-3 py-2 text-xs text-white outline-none placeholder:text-gray-600"
                      />
                      <input
                        value={addServerForm.name} onChange={(e) => setAddServerForm(f => ({ ...f, name: e.target.value }))}
                        placeholder="Server Name" className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg px-3 py-2 text-xs text-white outline-none placeholder:text-gray-600"
                      />
                    </div>
                    <input
                      value={addServerForm.url} onChange={(e) => setAddServerForm(f => ({ ...f, url: e.target.value }))}
                      placeholder="https://mcp-server.example.com/api" className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg px-3 py-2 text-xs text-white outline-none placeholder:text-gray-600"
                    />
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        value={addServerForm.icon} onChange={(e) => setAddServerForm(f => ({ ...f, icon: e.target.value }))}
                        placeholder="🔌 Icon" className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg px-3 py-2 text-xs text-white outline-none placeholder:text-gray-600"
                      />
                      <input
                        value={addServerForm.description} onChange={(e) => setAddServerForm(f => ({ ...f, description: e.target.value }))}
                        placeholder="Description" className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg px-3 py-2 text-xs text-white outline-none placeholder:text-gray-600"
                      />
                    </div>
                    <div className="flex gap-2">
                      <button onClick={handleAddServer} disabled={mcpLoading === 'adding'}
                        className="flex-1 py-2 rounded-lg bg-violet-500 hover:bg-violet-400 disabled:opacity-40 text-white text-xs font-semibold transition-all flex items-center justify-center gap-1.5">
                        {mcpLoading === 'adding' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                        Add Server
                      </button>
                      <button onClick={() => setShowAddServer(false)} className="px-4 py-2 rounded-lg bg-white/5 text-gray-400 text-xs hover:bg-white/10 transition-all">
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => setShowAddServer(true)}
                    className="w-full py-2.5 rounded-xl border border-dashed border-[#333] text-sm text-gray-400 hover:text-white hover:border-violet-500/40 hover:bg-violet-500/5 transition-all"
                  >
                    + Add Custom MCP Server
                  </button>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default function Home() {
  return <AethericDashboard />;
}
