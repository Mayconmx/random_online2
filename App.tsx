import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Page, ChatState, FilterType } from './types';
import * as authService from './services/authService';
import * as matchService from './services/matchService';

const VIDEO_FILTERS = [
  { id: FilterType.NORMAL, name: 'Natural', icon: 'fa-face-smile' },
  { id: FilterType.NOIR, name: 'Noir', icon: 'fa-film' },
  { id: FilterType.SEPIA, name: 'Clássico', icon: 'fa-coffee' },
  { id: FilterType.CYBER, name: 'Cyber', icon: 'fa-robot' },
  { id: FilterType.INVERT, name: 'Inverter', icon: 'fa-bolt' },
  { id: FilterType.BLUR, name: 'Privado', icon: 'fa-eye-slash' },
];

const REPORT_REASONS = [
  { id: 'nudity', label: 'Conteúdo Sexual', icon: 'fa-user-slash' },
  { id: 'violence', label: 'Agressividade', icon: 'fa-fist-raised' },
  { id: 'hate', label: 'Discurso de Ódio', icon: 'fa-skull' },
  { id: 'fake', label: 'Bot / Fake', icon: 'fa-robot' },
];

// Componente de Vídeo Isolado para evitar re-render loops e congelamentos
const VideoPeer = ({ stream, isLocal = false, filter = 'normal' }: { stream: MediaStream | null, isLocal?: boolean, filter?: string }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [debugInfo, setDebugInfo] = useState<string>('');

  useEffect(() => {
    const el = videoRef.current;
    if (!el || !stream) return;

    if (el.srcObject !== stream) {
      console.log(`[VideoPeer] Assigning stream ${stream.id} to video element (Local: ${isLocal})`);
      el.srcObject = stream;

      const playPromise = el.play();
      if (playPromise !== undefined) {
        playPromise.catch(error => {
          console.error(`[VideoPeer] Auto-play failed: ${error}`);
          setDebugInfo('Autoplay bloqueado. Clique para iniciar.');
        });
      }
    }

    // Monitoramento de trilhas
    const interval = setInterval(() => {
      if (!stream.active) setDebugInfo('Stream inativo');
      else if (stream.getVideoTracks().length === 0) setDebugInfo('Sem vídeo');
      else if (el.videoWidth === 0) setDebugInfo('Carregando vídeo...');
      else setDebugInfo('');
    }, 1000);

    return () => clearInterval(interval);
  }, [stream]);

  return (
    <div className="video-cell">
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted={isLocal} // Local sempre mutado para evitar feedback
        style={isLocal ? { transform: 'scaleX(-1)' } : {}}
        className={`filter-${filter}`}
        onClick={() => {
          if (videoRef.current?.paused) videoRef.current.play();
        }}
      />
      {debugInfo && (
        <div style={{ position: 'absolute', top: 10, left: 10, background: 'rgba(255,0,0,0.7)', padding: '5px', fontSize: '10px', borderRadius: '4px' }}>
          {debugInfo}
        </div>
      )}
    </div>
  );
};


function App() {
  const [currentPage, setCurrentPage] = useState<Page>(Page.LOGIN);
  const [activeFilter, setActiveFilter] = useState<FilterType>(FilterType.NORMAL);
  const [showEffects, setShowEffects] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [isGrid4x, setIsGrid4x] = useState(false);

  // Auth State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  const [chatState, setChatState] = useState<ChatState & { status: string }>({
    status: 'idle',
    partnerLocation: '',
    isAudioEnabled: true,
    isVideoEnabled: true,
    errorMessage: null,
  });

  const [remotePeers, setRemotePeers] = useState<any[]>([]);
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const peerRef = useRef<any>(null);
  const activeCallsRef = useRef<Map<string, any>>(new Map());

  useEffect(() => {
    authService.getCurrentUser().then(user => {
      if (user) {
        setCurrentPage(Page.CHAT);
        initializeHardware();
      }
    });
    return () => shutdown();
  }, []);

  const shutdown = () => {
    matchService.removePresence();
    activeCallsRef.current.forEach(call => {
      try { call.close(); } catch (e) { }
    });
    activeCallsRef.current.clear();
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(t => t.stop());
    }
    if (peerRef.current) {
      peerRef.current.destroy();
      peerRef.current = null;
    }
  };

  const initializeHardware = async () => {
    setChatState(p => ({ ...p, status: 'searching', errorMessage: null }));
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: "user"
        },
        audio: true
      });
      localStreamRef.current = stream;
      if (localVideoRef.current) localVideoRef.current.srcObject = stream;

      initPeer();
    } catch (err: any) {
      let msg = "Erro ao acessar dispositivos de mídia.";
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        msg = "Permissão de câmera/microfone negada. Ative-as nas configurações do seu navegador.";
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        msg = "Nenhuma câmera ou microfone detectado.";
      }
      setChatState(p => ({ ...p, status: 'error', errorMessage: msg }));
    }
  };

  const initPeer = () => {
    if (peerRef.current) return;

    try {
      peerRef.current = new window.Peer(undefined, {
        host: '0.peerjs.com',
        secure: true,
        port: 443,
        debug: 0, // Desativado para evitar logs de erro no console do usuário
        config: {
          iceServers: [
            { urls: 'stun:stun.l.google.com:19302' },
            { urls: 'stun:stun1.l.google.com:19302' },
            { urls: 'stun:stun2.l.google.com:19302' },
            { urls: 'stun:stun3.l.google.com:19302' },
            { urls: 'stun:stun4.l.google.com:19302' },
          ]
        }
      });

      peerRef.current.on('open', (id: string) => {
        matchService.registerPresence(id);
        findPartner(isGrid4x);
      });

      peerRef.current.on('call', (call: any) => {
        call.answer(localStreamRef.current);
        handleNewCall(call);
      });

      peerRef.current.on('error', (err: any) => {
        // CORREÇÃO: Tratamento silencioso de peer indisponível
        if (err.type === 'peer-unavailable' || err.type === 'unavailable-id') {
          console.debug("Peer not found, seeking next...");
          // Em vez de crashar, limpamos e tentamos o próximo instantaneamente
          skip();
          return;
        }

        if (err.type === 'network' || err.type === 'server-error') {
          setChatState(p => ({ ...p, status: 'error', errorMessage: "Falha crítica de conexão com o servidor." }));
        }
      });

      peerRef.current.on('disconnected', () => {
        if (!peerRef.current?.destroyed) peerRef.current.reconnect();
      });
    } catch (e) {
      setChatState(p => ({ ...p, status: 'error', errorMessage: "Erro ao inicializar motor de vídeo." }));
    }
  };

  const handleNewCall = (call: any) => {
    call.on('stream', (remoteStream: MediaStream) => {
      setRemotePeers(prev => {
        if (prev.find(p => p.id === call.peer)) return prev;
        return [...prev, { id: call.peer, stream: remoteStream }];
      });
      setChatState(p => ({ ...p, status: 'connected' }));
    });

    call.on('close', () => removePeer(call.peer));
    call.on('error', () => removePeer(call.peer));
    activeCallsRef.current.set(call.peer, call);
  };

  const removePeer = (peerId: string) => {
    activeCallsRef.current.delete(peerId);
    setRemotePeers(prev => prev.filter(p => p.id !== peerId));
    if (activeCallsRef.current.size === 0 && chatState.status === 'connected') {
      setChatState(p => ({ ...p, status: 'searching' }));
      setTimeout(() => findPartner(isGrid4x), 1000);
    }
  };

  const findPartner = useCallback(async (mode4x: boolean) => {
    if (!peerRef.current || !localStreamRef.current) return;

    setChatState(p => ({ ...p, status: 'searching' }));
    setRemotePeers([]);
    activeCallsRef.current.forEach(c => { try { c.close(); } catch (e) { } });
    activeCallsRef.current.clear();

    // Register as waiting
    const { error: regError } = await matchService.registerPresence(peerRef.current.id);
    if (regError) {
      console.error("Presence Error:", regError);
      const msg = typeof regError === 'object' && regError !== null && 'message' in regError
        ? (regError as any).message
        : JSON.stringify(regError);
      setChatState(p => ({ ...p, status: 'error', errorMessage: `Erro de conexão: ${msg}` }));
      return;
    }

    // Loop to find partner
    let attempts = 0;
    const search = async () => {
      if (activeCallsRef.current.size > 0) return; // Stop if already connected
      if (attempts > 30) { // Timeout after ~1 minute
        setChatState(p => ({ ...p, status: 'error', errorMessage: "Ninguém online no momento. Tente novamente." }));
        return;
      }

      const { peerId: partnerId, error: searchError } = await matchService.findRandomPeer(peerRef.current.id);

      if (searchError) {
        console.error("Search error:", searchError);
        // Only stop if it's a critical error (like table missing 404 or 42P01)
        // For transient network errors, maybe we continue? 
        // But for "Relation 'rooms' does not exist", we must stop.
        if (searchError.code === '42P01' || searchError.message?.includes('does not exist')) {
          setChatState(p => ({ ...p, status: 'error', errorMessage: "Erro crítico: Tabela 'rooms' não encontrada no Supabase." }));
          return;
        }
      }

      if (partnerId) {
        console.log("Calling partner:", partnerId);
        const call = peerRef.current.call(partnerId, localStreamRef.current);
        handleNewCall(call);
        matchService.updateStatus('chatting');
      } else {
        attempts++;
        setTimeout(search, 2000); // Retry every 2s
      }
    };

    search();
  }, [isGrid4x]);

  const skip = () => {
    if (chatState.status === 'skipping' || chatState.status === 'searching') return;
    setChatState(p => ({ ...p, status: 'skipping' }));

    activeCallsRef.current.forEach(c => { try { c.close(); } catch (e) { } });
    activeCallsRef.current.clear();
    setRemotePeers([]);

    setTimeout(() => findPartner(isGrid4x), 400);
  };

  const toggleGrid = () => {
    setIsGrid4x(prev => !prev);
    skip();
  };

  const toggleTrack = (kind: 'audio' | 'video') => {
    if (!localStreamRef.current) return;
    const track = localStreamRef.current.getTracks().find(t => t.kind === kind);
    if (track) {
      track.enabled = !track.enabled;
      setChatState(p => ({ ...p, [kind === 'audio' ? 'isAudioEnabled' : 'isVideoEnabled']: track.enabled }));
    }
  };

  const handleLogout = async () => {
    await authService.logout();
    shutdown();
    setCurrentPage(Page.LOGIN);
    setChatState(p => ({ ...p, status: 'idle', errorMessage: null }));
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthLoading(true);
    setAuthError(null);

    try {
      if (currentPage === Page.LOGIN) {
        await authService.login(email, password);
      } else {
        await authService.signup(email, password, username);
      }

      setCurrentPage(Page.CHAT);
      initializeHardware();
    } catch (err: any) {
      setAuthError(err.message || 'Ocorreu um erro na autenticação.');
    } finally {
      setAuthLoading(false);
    }
  };

  if (currentPage === Page.LOGIN || currentPage === Page.SIGNUP) {
    return (
      <div className="auth-screen">
        <div className="auth-card" role="main">
          <h1 style={{ color: 'var(--primary)', marginBottom: '8px', fontWeight: '900', fontSize: '28px' }}>Random online</h1>
          <p style={{ color: '#666', fontSize: '13px', marginBottom: '32px' }}>Videochat anônimo em tempo real.</p>

          {authError && <div style={{ color: 'red', marginBottom: '10px', fontSize: '12px' }}>{authError}</div>}

          <form onSubmit={handleAuth}>
            {currentPage === Page.SIGNUP && (
              <input
                className="input-field"
                type="text"
                placeholder="Nome de usuário"
                required
                value={username}
                onChange={e => setUsername(e.target.value)}
              />
            )}
            <input
              className="input-field"
              type="email"
              placeholder="Email"
              required
              autoComplete="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
            />
            <input
              className="input-field"
              type="password"
              placeholder="Senha"
              required
              autoComplete={currentPage === Page.LOGIN ? "current-password" : "new-password"}
              value={password}
              onChange={e => setPassword(e.target.value)}
            />
            <button
              type="submit"
              className="btn-skip"
              style={{ width: '100%', justifyContent: 'center', marginTop: '12px' }}
              disabled={authLoading}
            >
              {authLoading ? 'CARREGANDO...' : (currentPage === Page.LOGIN ? 'ENTRAR' : 'CRIAR CONTA')}
            </button>
          </form>

          <div style={{ marginTop: '20px', fontSize: '12px', color: '#888' }}>
            {currentPage === Page.LOGIN ? (
              <p>Não tem uma conta? <button style={{ color: 'var(--primary)', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 'bold' }} onClick={() => { setCurrentPage(Page.SIGNUP); setAuthError(null); }}>Cadastre-se</button></p>
            ) : (
              <p>Já tem uma conta? <button style={{ color: 'var(--primary)', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 'bold' }} onClick={() => { setCurrentPage(Page.LOGIN); setAuthError(null); }}>Entre agora</button></p>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full w-full relative bg-black" role="application">

      <nav className="top-bar" aria-label="Controles superiores">
        <button
          className="top-btn"
          onClick={toggleGrid}
          aria-label={isGrid4x ? "Mudar para visão 1 para 1" : "Mudar para visão 4 câmeras"}
          title="Alternar Layout"
        >
          <i className={`fas ${isGrid4x ? 'fa-user-friends' : 'fa-th-large'}`} aria-hidden="true"></i>
          <span>{isGrid4x ? '1v1' : '4x'}</span>
        </button>

        <div className="flex items-center gap-2" aria-live="polite">
          <div style={{
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            background: chatState.status === 'connected' ? 'var(--primary)' : '#555',
            boxShadow: chatState.status === 'connected' ? '0 0 10px var(--primary)' : 'none'
          }}></div>
          <span style={{ fontSize: '11px', fontWeight: 'bold', color: 'rgba(255,255,255,0.6)', letterSpacing: '0.5px' }}>
            {chatState.status === 'connected' ? 'CONECTADO' : 'BUSCANDO...'}
          </span>
        </div>

        <button className="top-btn exit" onClick={handleLogout} aria-label="Sair e encerrar vídeo">
          Sair <i className="fas fa-sign-out-alt" aria-hidden="true"></i>
        </button>
      </nav>

      <main className={`video-container ${isGrid4x ? 'grid-2-2' : 'grid-1-1'} ${chatState.status === 'skipping' ? 'skipping' : ''}`}>
        {remotePeers.map(peer => (
          <VideoPeer key={peer.id} stream={peer.stream} filter={activeFilter} />
        ))}
        <VideoPeer stream={localStreamRef.current} isLocal={true} filter={activeFilter} />
      </main>

      {chatState.status === 'searching' && (
        <div className="loading-overlay" aria-live="assertive">
          <div className="spinner"></div>
          <p style={{ color: 'var(--primary)', fontWeight: '800', fontSize: '11px', letterSpacing: '1px' }}>PROCURANDO...</p>
        </div>
      )}

      {chatState.status === 'error' && (
        <div className="loading-overlay">
          <div className="report-card" style={{ borderColor: 'var(--danger)', padding: '24px' }}>
            <i className="fas fa-exclamation-triangle text-red-500 fa-2x mb-4"></i>
            <p style={{ fontSize: '14px', marginBottom: '20px' }}>{chatState.errorMessage}</p>
            <button onClick={() => window.location.reload()} className="btn-skip" style={{ width: '100%', justifyContent: 'center' }}>RECONECTAR</button>
          </div>
        </div>
      )}

      <footer className="action-bar" aria-label="Controles de chamada">
        <div className="control-group">
          <button
            onClick={() => toggleTrack('video')}
            className={`btn-circle ${!chatState.isVideoEnabled ? 'active' : ''}`}
            aria-label={chatState.isVideoEnabled ? "Desligar câmera" : "Ligar câmera"}
          >
            <i className={`fas ${chatState.isVideoEnabled ? 'fa-video' : 'fa-video-slash'}`}></i>
          </button>
          <button
            onClick={() => toggleTrack('audio')}
            className={`btn-circle ${!chatState.isAudioEnabled ? 'active' : ''}`}
            aria-label={chatState.isAudioEnabled ? "Mutar áudio" : "Ativar áudio"}
          >
            <i className={`fas ${chatState.isAudioEnabled ? 'fa-microphone' : 'fa-microphone-slash'}`}></i>
          </button>
        </div>

        <button onClick={skip} className="btn-skip" aria-label="Pular para o próximo usuário" disabled={chatState.status === 'skipping'}>
          {chatState.status === 'skipping' ? 'PULANDO...' : 'PRÓXIMO'} <i className="fas fa-chevron-right"></i>
        </button>

        <div className="control-group">
          <button
            onClick={() => setShowEffects(!showEffects)}
            className={`btn-circle ${showEffects ? 'active' : ''}`}
            aria-label="Filtros de vídeo"
          >
            <i className="fas fa-magic"></i>
          </button>
          <button
            onClick={() => setShowReport(true)}
            className="btn-circle danger"
            aria-label="Denunciar"
          >
            <i className="fas fa-flag"></i>
          </button>
        </div>
      </footer>

      {showEffects && (
        <div className="effects-panel">
          {VIDEO_FILTERS.map(f => (
            <button
              key={f.id}
              className={`filter-option ${activeFilter === f.id ? 'active' : ''}`}
              onClick={() => setActiveFilter(f.id)}
            >
              <div className="filter-thumb"><i className={`fas ${f.icon}`}></i></div>
              <span>{f.name}</span>
            </button>
          ))}
        </div>
      )}

      {showReport && (
        <div className="modal-overlay" role="dialog" aria-modal="true" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div className="report-card" style={{ background: '#111', padding: '24px', borderRadius: '24px', width: '90%', maxWidth: '340px', textAlign: 'center' }}>
            <h3 style={{ marginBottom: '10px' }}>Denunciar conduta</h3>
            <p style={{ fontSize: '12px', color: '#888', marginBottom: '20px' }}>O usuário será bloqueado e você será desconectado.</p>
            {REPORT_REASONS.map(r => (
              <button
                key={r.id}
                className="report-option"
                style={{ width: '100%', padding: '12px', background: '#222', border: '1px solid #333', color: 'white', borderRadius: '12px', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}
                onClick={() => { setShowReport(false); skip(); }}
              >
                <i className={`fas ${r.icon}`}></i> {r.label}
              </button>
            ))}
            <button onClick={() => setShowReport(false)} style={{ background: 'transparent', border: 'none', color: '#666', marginTop: '10px', cursor: 'pointer' }}>CANCELAR</button>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;