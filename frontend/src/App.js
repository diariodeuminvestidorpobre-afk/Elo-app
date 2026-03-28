import React, { useState, useEffect, useRef } from "react";
import { BrowserRouter, Routes, Route, useLocation, useNavigate, Navigate, Link } from "react-router-dom";
import axios from "axios";
import "@/App.css";
import { Toaster, toast } from "sonner";
import { usePushNotifications } from "@/hooks/usePushNotifications";
import NotificationSettings from "@/components/NotificationSettings";
import { 
  House, 
  HandsPraying, 
  Users, 
  User, 
  Heart, 
  ChatCircle, 
  Share, 
  Plus,
  SignOut,
  BookOpen,
  CurrencyDollar,
  X,
  UploadSimple,
  PaperPlaneTilt,
  Bell,
  BellSlash,
  GearSix
} from "@phosphor-icons/react";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// ============= LOGO COMPONENT =============

function EloLogo({ size = "large" }) {
  const sizes = {
    small: { width: 32, fontSize: 24 },
    medium: { width: 48, fontSize: 36 },
    large: { width: 120, fontSize: 72 }
  };
  
  const { width, fontSize } = sizes[size];
  
  return (
    <svg width={width} height={width} viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="blueRedGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style={{ stopColor: 'rgb(37, 99, 235)' }} />
          <stop offset="100%" style={{ stopColor: 'rgb(239, 68, 68)' }} />
        </linearGradient>
      </defs>
      <rect fill="url(#blueRedGradient)" width="100" height="100" rx="20"/>
      <text x="50" y="72" fontFamily="Poppins, sans-serif" fontSize={fontSize} fontWeight="800" fill="white" textAnchor="middle">E</text>
    </svg>
  );
}

// ============= AUTH COMPONENTS =============

function AuthCallback() {
  const navigate = useNavigate();
  const location = useLocation();
  const hasProcessed = useRef(false);

  useEffect(() => {
    if (hasProcessed.current) return;
    hasProcessed.current = true;

    const hash = location.hash;
    if (!hash || !hash.includes('session_id=')) {
      navigate('/login');
      return;
    }

    const sessionId = hash.split('session_id=')[1]?.split('&')[0];
    if (!sessionId) {
      navigate('/login');
      return;
    }

    axios.post(`${API}/auth/session`, { session_id: sessionId }, { withCredentials: true })
      .then(response => {
        navigate('/feed', { replace: true, state: { user: response.data } });
      })
      .catch(error => {
        console.error('Auth error:', error);
        toast.error('Erro na autenticação');
        navigate('/login');
      });
  }, [location.hash, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-amber-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
        <p className="text-gray-600">Autenticando...</p>
      </div>
    </div>
  );
}

function LoginPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const formatPhone = (value) => {
    const digits = value.replace(/\D/g, '');
    if (digits.length <= 2) return digits;
    if (digits.length <= 7) return `(${digits.slice(0,2)}) ${digits.slice(2)}`;
    if (digits.length <= 11) return `(${digits.slice(0,2)}) ${digits.slice(2,7)}-${digits.slice(7)}`;
    return `(${digits.slice(0,2)}) ${digits.slice(2,7)}-${digits.slice(7,11)}`;
  };

  const handlePhoneChange = (e) => {
    setPhone(formatPhone(e.target.value));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    const rawPhone = phone.replace(/\D/g, '');
    
    try {
      if (isLogin) {
        const response = await axios.post(`${API}/auth/login`, { phone: rawPhone, password }, { withCredentials: true });
        toast.success('Bem-vindo de volta!');
        navigate('/feed', { replace: true, state: { user: response.data } });
      } else {
        if (name.trim().length < 2) {
          toast.error('Digite seu nome');
          setLoading(false);
          return;
        }
        const response = await axios.post(`${API}/auth/register`, { phone: rawPhone, password, name: name.trim() }, { withCredentials: true });
        toast.success('Conta criada com sucesso!');
        navigate('/feed', { replace: true, state: { user: response.data } });
      }
    } catch (error) {
      const detail = error.response?.data?.detail;
      const msg = typeof detail === 'string' ? detail : Array.isArray(detail) ? detail.map(e => e.msg || JSON.stringify(e)).join(' ') : 'Erro ao processar';
      toast.error(msg);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-600 via-white to-red-500 p-4">
      <div className="max-w-md w-full space-y-8 text-center">
        <div className="flex justify-center mb-4">
          <EloLogo size="large" />
        </div>
        
        <div>
          <h1 className="text-5xl sm:text-6xl font-extrabold mb-4" style={{fontFamily: "'Poppins', sans-serif", background: 'linear-gradient(135deg, rgb(37, 99, 235) 0%, rgb(239, 68, 68) 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text'}}>Elo</h1>
          <p className="text-lg text-gray-700 mb-2 font-medium">Rede social cristã</p>
          <p className="text-sm text-gray-600">Conecte-se, ore e compartilhe fé</p>
        </div>
        
        <div className="bg-white/90 backdrop-blur-lg rounded-3xl shadow-2xl p-8 border border-white/30">
          <div className="flex mb-6 bg-gray-100 rounded-full p-1">
            <button
              type="button"
              onClick={() => setIsLogin(true)}
              data-testid="tab-login"
              className={`flex-1 py-2 rounded-full text-sm font-semibold transition-all ${isLogin ? 'bg-white shadow text-blue-600' : 'text-gray-500'}`}
            >
              Entrar
            </button>
            <button
              type="button"
              onClick={() => setIsLogin(false)}
              data-testid="tab-register"
              className={`flex-1 py-2 rounded-full text-sm font-semibold transition-all ${!isLogin ? 'bg-white shadow text-blue-600' : 'text-gray-500'}`}
            >
              Criar conta
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <input
                type="text"
                placeholder="Seu nome"
                value={name}
                onChange={(e) => setName(e.target.value)}
                data-testid="register-name-input"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all text-gray-700"
                required
              />
            )}
            <input
              type="tel"
              placeholder="(00) 00000-0000"
              value={phone}
              onChange={handlePhoneChange}
              data-testid="phone-input"
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all text-gray-700"
              required
            />
            <input
              type="password"
              placeholder="Senha"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              data-testid="password-input"
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all text-gray-700"
              minLength={6}
              required
            />
            <button
              type="submit"
              disabled={loading}
              data-testid="auth-submit-button"
              className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold py-4 px-6 rounded-full transition-all transform hover:scale-105 hover:shadow-xl disabled:opacity-50 disabled:transform-none"
            >
              {loading ? 'Aguarde...' : isLogin ? 'Entrar' : 'Criar conta'}
            </button>
          </form>
          
          <p className="text-xs text-gray-500 mt-6">
            Ao entrar, você concorda com nossos termos de uso e política de privacidade.
          </p>
        </div>
        
        <div className="grid grid-cols-3 gap-4 text-center text-sm text-gray-700">
          <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-4">
            <BookOpen size={28} className="mx-auto mb-2 text-blue-600" weight="duotone" />
            <p className="font-semibold">Versículo diário</p>
          </div>
          <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-4">
            <HandsPraying size={28} className="mx-auto mb-2 text-red-500" weight="duotone" />
            <p className="font-semibold">Pedidos de oração</p>
          </div>
          <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-4">
            <Users size={28} className="mx-auto mb-2 text-blue-600" weight="duotone" />
            <p className="font-semibold">Comunidades</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function ProtectedRoute({ children }) {
  const [isAuthenticated, setIsAuthenticated] = useState(null);
  const [user, setUser] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (location.state?.user) {
      setUser(location.state.user);
      setIsAuthenticated(true);
      return;
    }

    axios.get(`${API}/auth/me`, { withCredentials: true })
      .then(response => {
        setUser(response.data);
        setIsAuthenticated(true);
      })
      .catch(() => {
        setIsAuthenticated(false);
        navigate('/login');
      });
  }, [location.state, navigate]);

  if (isAuthenticated === null) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return React.cloneElement(children, { user });
}

// ============= BOTTOM NAVIGATION =============

function BottomNav({ active }) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 glass border-t border-gray-200 z-50" data-testid="bottom-navigation">
      <div className="flex justify-around items-center h-16 max-w-2xl mx-auto">
        <Link to="/feed" className={`flex flex-col items-center gap-1 ${active === 'feed' ? 'text-blue-600' : 'text-gray-600'}`} data-testid="nav-feed">
          <House size={24} weight={active === 'feed' ? 'fill' : 'regular'} />
          <span className="text-xs">Início</span>
        </Link>
        <Link to="/prayers" className={`flex flex-col items-center gap-1 ${active === 'prayers' ? 'text-blue-600' : 'text-gray-600'}`} data-testid="nav-prayers">
          <HandsPraying size={24} weight={active === 'prayers' ? 'fill' : 'regular'} />
          <span className="text-xs">Orações</span>
        </Link>
        <Link to="/communities" className={`flex flex-col items-center gap-1 ${active === 'communities' ? 'text-blue-600' : 'text-gray-600'}`} data-testid="nav-communities">
          <Users size={24} weight={active === 'communities' ? 'fill' : 'regular'} />
          <span className="text-xs">Comunidades</span>
        </Link>
        <Link to="/profile" className={`flex flex-col items-center gap-1 ${active === 'profile' ? 'text-blue-600' : 'text-gray-600'}`} data-testid="nav-profile">
          <User size={24} weight={active === 'profile' ? 'fill' : 'regular'} />
          <span className="text-xs">Perfil</span>
        </Link>
      </div>
    </nav>
  );
}

// ============= VIDEO FEED =============

function VideoFeed({ user }) {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showUpload, setShowUpload] = useState(false);

  useEffect(() => {
    loadVideos();
  }, []);

  const loadVideos = async () => {
    try {
      const response = await axios.get(`${API}/videos/feed`, { withCredentials: true });
      setVideos(response.data);
    } catch (error) {
      toast.error('Erro ao carregar vídeos');
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async (videoId) => {
    try {
      const response = await axios.post(`${API}/videos/${videoId}/like`, {}, { withCredentials: true });
      setVideos(videos.map(v => 
        v.video_id === videoId 
          ? { ...v, likes_count: v.likes_count + (response.data.liked ? 1 : -1) }
          : v
      ));
    } catch (error) {
      toast.error('Erro ao curtir');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="relative" data-testid="video-feed">
      {/* Upload Button */}
      <button
        onClick={() => setShowUpload(true)}
        data-testid="upload-video-button"
        className="fixed top-4 right-4 z-40 bg-blue-600 text-white p-4 rounded-full shadow-lg hover:bg-blue-700 transition-colors"
      >
        <Plus size={24} weight="bold" />
      </button>

      {/* Video Container */}
      <div className="video-container">
        {videos.length === 0 ? (
          <div className="h-screen flex items-center justify-center p-4">
            <div className="text-center">
              <BookOpen size={48} className="mx-auto mb-4 text-gray-400" weight="duotone" />
              <p className="text-gray-600">Nenhum vídeo ainda</p>
              <p className="text-sm text-gray-500">Seja o primeiro a compartilhar!</p>
            </div>
          </div>
        ) : (
          videos.map((video) => (
            <VideoCard key={video.video_id} video={video} onLike={handleLike} />
          ))
        )}
      </div>

      {/* Upload Modal */}
      {showUpload && <UploadModal onClose={() => setShowUpload(false)} onSuccess={loadVideos} />}

      <BottomNav active="feed" />
    </div>
  );
}

function VideoCard({ video, onLike }) {
  const videoUrl = `${API}/videos/${video.video_id}/download`;

  return (
    <div className="video-item relative h-screen w-full bg-black" data-testid="video-card">
      {/* Video */}
      <video
        src={videoUrl}
        className="w-full h-full object-cover"
        loop
        playsInline
        muted
        autoPlay
      />

      {/* Overlay */}
      <div className="absolute inset-0 video-overlay" />

      {/* Actions */}
      <div className="absolute right-4 bottom-24 flex flex-col gap-6">
        <button
          onClick={() => onLike(video.video_id)}
          data-testid="like-button"
          className="flex flex-col items-center text-white"
        >
          <div className="bg-white/20 backdrop-blur-sm p-3 rounded-full">
            <Heart size={28} weight="fill" className="text-red-500" />
          </div>
          <span className="text-xs mt-1">{video.likes_count}</span>
        </button>

        <button className="flex flex-col items-center text-white" data-testid="comment-button">
          <div className="bg-white/20 backdrop-blur-sm p-3 rounded-full">
            <ChatCircle size={28} weight="fill" />
          </div>
          <span className="text-xs mt-1">{video.comments_count}</span>
        </button>

        <button className="flex flex-col items-center text-white" data-testid="share-button">
          <div className="bg-white/20 backdrop-blur-sm p-3 rounded-full">
            <Share size={28} weight="fill" />
          </div>
          <span className="text-xs mt-1">{video.shares_count}</span>
        </button>
      </div>

      {/* User Info */}
      <div className="absolute left-4 bottom-24 text-white max-w-[60%]">
        <div className="flex items-center gap-3 mb-3">
          {video.user_picture ? (
            <img src={video.user_picture} alt={video.user_name} className="w-10 h-10 rounded-full border-2 border-white" />
          ) : (
            <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center border-2 border-white">
              <User size={20} weight="bold" className="text-white" />
            </div>
          )}
          <span className="font-medium">{video.user_name}</span>
        </div>
        {video.caption && <p className="text-sm">{video.caption}</p>}
      </div>
    </div>
  );
}

function UploadModal({ onClose, onSuccess }) {
  const [file, setFile] = useState(null);
  const [caption, setCaption] = useState('');
  const [uploading, setUploading] = useState(false);

  const handleUpload = async () => {
    if (!file) {
      toast.error('Selecione um vídeo');
      return;
    }

    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const uploadResponse = await axios.post(`${API}/videos/upload`, formData, {
        withCredentials: true,
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (caption) {
        await axios.put(`${API}/videos/${uploadResponse.data.video_id}/caption?caption=${encodeURIComponent(caption)}`, {}, {
          withCredentials: true
        });
      }

      toast.success('Vídeo enviado!');
      onSuccess();
      onClose();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Erro ao enviar vídeo');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" data-testid="upload-modal">
      <div className="bg-white rounded-2xl p-6 max-w-md w-full">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Enviar Vídeo</h2>
          <button onClick={onClose} data-testid="close-upload-modal">
            <X size={24} />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Vídeo</label>
            <input
              type="file"
              accept="video/*"
              onChange={(e) => setFile(e.target.files[0])}
              data-testid="video-file-input"
              className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Legenda</label>
            <textarea
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              data-testid="video-caption-input"
              className="w-full border border-gray-300 rounded-lg p-2 text-sm"
              rows={3}
              placeholder="Adicione uma legenda..."
            />
          </div>

          <button
            onClick={handleUpload}
            disabled={uploading}
            data-testid="submit-upload-button"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 rounded-full disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {uploading ? (
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
            ) : (
              <>
                <UploadSimple size={20} weight="bold" />
                <span>Enviar</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// ============= PRAYERS PAGE =============

function PrayersPage({ user }) {
  const [prayers, setPrayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [verse, setVerse] = useState(null);

  useEffect(() => {
    loadPrayers();
    loadVerse();
  }, []);

  const loadPrayers = async () => {
    try {
      const response = await axios.get(`${API}/prayers`, { withCredentials: true });
      setPrayers(response.data);
    } catch (error) {
      toast.error('Erro ao carregar orações');
    } finally {
      setLoading(false);
    }
  };

  const loadVerse = async () => {
    try {
      const response = await axios.get(`${API}/verses/daily`, { withCredentials: true });
      setVerse(response.data);
    } catch (error) {
      console.error('Erro ao carregar versículo');
    }
  };

  const handlePray = async (prayerId) => {
    try {
      await axios.post(`${API}/prayers/${prayerId}/pray`, {}, { withCredentials: true });
      setPrayers(prayers.map(p => 
        p.prayer_id === prayerId ? { ...p, prayer_count: p.prayer_count + 1 } : p
      ));
      toast.success('Oração registrada!');
    } catch (error) {
      toast.error('Erro ao registrar oração');
    }
  };

  return (
    <div className="min-h-screen pb-20 bg-gray-50" data-testid="prayers-page">
      {/* Header */}
      <div className="glass border-b border-gray-200 px-4 py-4 sticky top-0 z-10">
        <h1 className="text-2xl font-bold text-center">Pedidos de Oração</h1>
      </div>

      <div className="max-w-2xl mx-auto p-4 space-y-4">
        {/* Verse of the Day */}
        {verse && (
          <div className="verse-card bg-amber-50 rounded-2xl p-6 border border-amber-200 shadow-md" data-testid="verse-card">
            <p className="text-xs text-amber-600 font-medium mb-2">VERSÍCULO DO DIA</p>
            <p className="text-2xl italic leading-relaxed mb-4" style={{fontFamily: "'Playfair Display', serif"}}>
              "{verse.verse_text}"
            </p>
            <p className="text-sm text-gray-600">— {verse.reference} ({verse.translation})</p>
          </div>
        )}

        {/* Create Button */}
        <button
          onClick={() => setShowCreate(true)}
          data-testid="create-prayer-button"
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 rounded-full flex items-center justify-center gap-2"
        >
          <Plus size={20} weight="bold" />
          <span>Novo Pedido</span>
        </button>

        {/* Prayers List */}
        {loading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          </div>
        ) : prayers.length === 0 ? (
          <div className="text-center py-12">
            <HandsPraying size={48} className="mx-auto mb-4 text-gray-400" weight="duotone" />
            <p className="text-gray-600">Nenhum pedido ainda</p>
          </div>
        ) : (
          prayers.map(prayer => (
            <PrayerCard key={prayer.prayer_id} prayer={prayer} onPray={handlePray} />
          ))
        )}
      </div>

      {showCreate && <CreatePrayerModal onClose={() => setShowCreate(false)} onSuccess={loadPrayers} />}
      <BottomNav active="prayers" />
    </div>
  );
}

function PrayerCard({ prayer, onPray }) {
  const [prayed, setPrayed] = useState(false);

  const handlePray = () => {
    if (!prayed) {
      onPray(prayer.prayer_id);
      setPrayed(true);
    }
  };

  return (
    <div className="bg-white rounded-2xl p-4 border border-gray-200 shadow-sm" data-testid="prayer-card">
      <div className="flex items-start gap-3 mb-3">
        {prayer.user_picture ? (
          <img src={prayer.user_picture} alt={prayer.user_name} className="w-10 h-10 rounded-full" />
        ) : (
          <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center">
            <User size={20} weight="bold" className="text-white" />
          </div>
        )}
        <div className="flex-1">
          <p className="font-medium">{prayer.user_name}</p>
          <p className="text-sm text-gray-500">{new Date(prayer.created_at).toLocaleDateString('pt-BR')}</p>
        </div>
      </div>

      <p className="text-gray-800 mb-4">{prayer.text}</p>

      <div className="flex items-center justify-between">
        <span className="text-sm text-gray-600">{prayer.prayer_count} orações</span>
        <button
          onClick={handlePray}
          data-testid="pray-button"
          className={`prayer-btn px-4 py-2 rounded-full font-medium transition-all ${prayed ? 'prayed' : 'bg-gray-100 hover:bg-gray-200 text-gray-800'}`}
        >
          {prayed ? 'Orei por você ✓' : 'Orei por você'}
        </button>
      </div>
    </div>
  );
}

function CreatePrayerModal({ onClose, onSuccess }) {
  const [text, setText] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!text.trim()) {
      toast.error('Digite seu pedido');
      return;
    }

    setSubmitting(true);
    try {
      await axios.post(`${API}/prayers?text=${encodeURIComponent(text)}`, {}, { withCredentials: true });
      toast.success('Pedido criado!');
      onSuccess();
      onClose();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Erro ao criar pedido');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl p-6 max-w-md w-full">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Novo Pedido de Oração</h2>
          <button onClick={onClose}>
            <X size={24} />
          </button>
        </div>

        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          data-testid="prayer-text-input"
          className="w-full border border-gray-300 rounded-lg p-3 text-sm mb-4"
          rows={5}
          placeholder="Compartilhe seu pedido de oração..."
        />

        <button
          onClick={handleSubmit}
          disabled={submitting}
          data-testid="submit-prayer-button"
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 rounded-full disabled:opacity-50"
        >
          {submitting ? 'Enviando...' : 'Publicar'}
        </button>
      </div>
    </div>
  );
}

// ============= COMMUNITIES PAGE =============

function CommunitiesPage({ user }) {
  const [communities, setCommunities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);

  useEffect(() => {
    loadCommunities();
  }, []);

  const loadCommunities = async () => {
    try {
      const response = await axios.get(`${API}/communities`, { withCredentials: true });
      setCommunities(response.data);
    } catch (error) {
      toast.error('Erro ao carregar comunidades');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen pb-20 bg-gray-50" data-testid="communities-page">
      <div className="glass border-b border-gray-200 px-4 py-4 sticky top-0 z-10">
        <h1 className="text-2xl font-bold text-center">Comunidades</h1>
      </div>

      <div className="max-w-2xl mx-auto p-4 space-y-4">
        <button
          onClick={() => setShowCreate(true)}
          data-testid="create-community-button"
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 rounded-full flex items-center justify-center gap-2"
        >
          <Plus size={20} weight="bold" />
          <span>Criar Comunidade</span>
        </button>

        {loading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          </div>
        ) : communities.length === 0 ? (
          <div className="text-center py-12">
            <Users size={48} className="mx-auto mb-4 text-gray-400" weight="duotone" />
            <p className="text-gray-600">Nenhuma comunidade ainda</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {communities.map(community => (
              <CommunityCard key={community.community_id} community={community} />
            ))}
          </div>
        )}
      </div>

      {showCreate && <CreateCommunityModal onClose={() => setShowCreate(false)} onSuccess={loadCommunities} />}
      <BottomNav active="communities" />
    </div>
  );
}

function CommunityCard({ community }) {
  const navigate = useNavigate();

  return (
    <div
      onClick={() => navigate(`/community/${community.community_id}`)}
      className="bg-white rounded-2xl overflow-hidden border border-gray-200 shadow-sm cursor-pointer hover:shadow-md transition-shadow"
      data-testid="community-card"
    >
      <div className="h-32 bg-gradient-to-br from-blue-400 to-amber-400 relative">
        {community.image_url && <img src={community.image_url} alt={community.name} className="w-full h-full object-cover" />}
        <div className="absolute inset-0 bg-black/20" />
      </div>
      <div className="p-4">
        <h3 className="font-semibold mb-1">{community.name}</h3>
        <p className="text-sm text-gray-600 mb-2 line-clamp-2">{community.description}</p>
        <p className="text-xs text-gray-500">{community.member_count} membros</p>
      </div>
    </div>
  );
}

function CreateCommunityModal({ onClose, onSuccess }) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!name.trim() || !description.trim()) {
      toast.error('Preencha todos os campos');
      return;
    }

    setSubmitting(true);
    try {
      await axios.post(`${API}/communities?name=${encodeURIComponent(name)}&description=${encodeURIComponent(description)}`, {}, { withCredentials: true });
      toast.success('Comunidade criada!');
      onSuccess();
      onClose();
    } catch (error) {
      toast.error('Erro ao criar comunidade');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl p-6 max-w-md w-full">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Nova Comunidade</h2>
          <button onClick={onClose}>
            <X size={24} />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Nome</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              data-testid="community-name-input"
              className="w-full border border-gray-300 rounded-lg p-2 text-sm"
              placeholder="Ex: Jovens da Igreja"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Descrição</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              data-testid="community-description-input"
              className="w-full border border-gray-300 rounded-lg p-2 text-sm"
              rows={3}
              placeholder="Descreva a comunidade..."
            />
          </div>

          <button
            onClick={handleSubmit}
            disabled={submitting}
            data-testid="submit-community-button"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 rounded-full disabled:opacity-50"
          >
            {submitting ? 'Criando...' : 'Criar'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ============= COMMUNITY DETAIL =============

function CommunityDetail({ user }) {
  const { id } = useParams();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [isMember, setIsMember] = useState(false);

  useEffect(() => {
    loadMessages();
  }, [id]);

  const loadMessages = async () => {
    try {
      const response = await axios.get(`${API}/communities/${id}/messages`, { withCredentials: true });
      setMessages(response.data.reverse());
      setIsMember(true);
    } catch (error) {
      if (error.response?.status === 403) {
        setIsMember(false);
      } else {
        toast.error('Erro ao carregar mensagens');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleJoin = async () => {
    try {
      await axios.post(`${API}/communities/${id}/join`, {}, { withCredentials: true });
      toast.success('Você entrou na comunidade!');
      setIsMember(true);
      loadMessages();
    } catch (error) {
      toast.error('Erro ao entrar na comunidade');
    }
  };

  const handleSend = async () => {
    if (!newMessage.trim()) return;

    try {
      await axios.post(`${API}/communities/${id}/messages?message=${encodeURIComponent(newMessage)}`, {}, { withCredentials: true });
      setNewMessage('');
      loadMessages();
    } catch (error) {
      toast.error('Erro ao enviar mensagem');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!isMember) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center">
          <Users size={48} className="mx-auto mb-4 text-gray-400" weight="duotone" />
          <p className="text-gray-600 mb-4">Você precisa ser membro para acessar esta comunidade</p>
          <button
            onClick={handleJoin}
            className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-6 rounded-full"
          >
            Entrar na Comunidade
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <div className="glass border-b border-gray-200 px-4 py-4">
        <h1 className="text-xl font-bold text-center">Chat da Comunidade</h1>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.map((msg, idx) => (
          <div key={idx} className="flex items-start gap-2">
            {msg.user_picture ? (
              <img src={msg.user_picture} alt={msg.user_name} className="w-8 h-8 rounded-full" />
            ) : (
              <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center">
                <User size={16} weight="bold" className="text-white" />
              </div>
            )}
            <div className="bg-white rounded-2xl px-4 py-2 border border-gray-200">
              <p className="text-sm font-medium text-gray-900">{msg.user_name}</p>
              <p className="text-sm text-gray-800">{msg.message}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="glass border-t border-gray-200 p-4">
        <div className="flex gap-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Digite uma mensagem..."
            className="flex-1 border border-gray-300 rounded-full px-4 py-2 text-sm"
          />
          <button
            onClick={handleSend}
            className="bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-full"
          >
            <PaperPlaneTilt size={20} weight="fill" />
          </button>
        </div>
      </div>
    </div>
  );
}

// ============= PROFILE PAGE =============

function ProfilePage({ user }) {
  const navigate = useNavigate();
  const { supported, permission, subscribe, unsubscribe, isSubscribed } = usePushNotifications();
  const [notificationsEnabled, setNotificationsEnabled] = useState(isSubscribed);
  const [showSettings, setShowSettings] = useState(false);

  useEffect(() => {
    setNotificationsEnabled(isSubscribed);
  }, [isSubscribed]);

  const handleLogout = async () => {
    try {
      await axios.post(`${API}/auth/logout`, {}, { withCredentials: true });
      navigate('/login');
    } catch (error) {
      toast.error('Erro ao sair');
    }
  };

  const toggleNotifications = async () => {
    if (notificationsEnabled) {
      const result = await unsubscribe();
      if (result.success) {
        setNotificationsEnabled(false);
        toast.success('Notificações desativadas');
      }
    } else {
      const result = await subscribe();
      if (result.success) {
        setNotificationsEnabled(true);
        toast.success('Notificações ativadas!');
      } else {
        toast.error('Erro ao ativar notificações');
      }
    }
  };

  return (
    <div className="min-h-screen pb-20 bg-gray-50" data-testid="profile-page">
      <div className="glass border-b border-gray-200 px-4 py-4">
        <h1 className="text-2xl font-bold text-center">Perfil</h1>
      </div>

      <div className="max-w-2xl mx-auto p-4 space-y-4">
        <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm text-center">
          {user.picture ? (
            <img src={user.picture} alt={user.name} className="w-24 h-24 rounded-full mx-auto mb-4 border-4 border-blue-100" />
          ) : (
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-600 to-red-500 flex items-center justify-center mx-auto mb-4 border-4 border-blue-100">
              <User size={48} weight="bold" className="text-white" />
            </div>
          )}
          <h2 className="text-xl font-bold mb-1">{user.name}</h2>
          <p className="text-sm text-gray-600 mb-4">{user.email}</p>
          {user.bio && <p className="text-gray-800 mb-4">{user.bio}</p>}
          
          <div className="flex justify-center gap-8 mb-4">
            <div>
              <p className="text-2xl font-bold text-blue-600">{user.followers_count}</p>
              <p className="text-sm text-gray-600">Seguidores</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-blue-600">{user.following_count}</p>
              <p className="text-sm text-gray-600">Seguindo</p>
            </div>
          </div>
        </div>

        {/* Notifications Toggle */}
        {supported && (
          <div className="space-y-2">
            <button
              onClick={toggleNotifications}
              className="w-full bg-white rounded-2xl p-4 border border-gray-200 shadow-sm hover:shadow-md transition-shadow text-left"
              data-testid="notifications-toggle"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center ${notificationsEnabled ? 'bg-blue-100' : 'bg-gray-100'}`}>
                    {notificationsEnabled ? (
                      <Bell size={24} className="text-blue-600" weight="duotone" />
                    ) : (
                      <BellSlash size={24} className="text-gray-600" weight="duotone" />
                    )}
                  </div>
                  <div>
                    <p className="font-medium">Notificações Push</p>
                    <p className="text-sm text-gray-600">
                      {notificationsEnabled ? 'Ativadas' : 'Desativadas'}
                    </p>
                  </div>
                </div>
                <div className={`w-12 h-7 rounded-full transition-colors ${notificationsEnabled ? 'bg-blue-600' : 'bg-gray-300'} relative`}>
                  <div className={`absolute top-1 w-5 h-5 bg-white rounded-full transition-transform ${notificationsEnabled ? 'translate-x-6' : 'translate-x-1'}`} />
                </div>
              </div>
            </button>

            {/* Notification Preferences Button */}
            {notificationsEnabled && (
              <button
                onClick={() => setShowSettings(true)}
                className="w-full bg-white rounded-2xl p-4 border border-gray-200 shadow-sm hover:shadow-md transition-shadow text-left"
                data-testid="notification-preferences-button"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-100 to-red-100 flex items-center justify-center">
                      <GearSix size={24} className="text-blue-600" weight="duotone" />
                    </div>
                    <div>
                      <p className="font-medium">Preferências de Notificações</p>
                      <p className="text-sm text-gray-600">Escolha o que deseja receber</p>
                    </div>
                  </div>
                  <span className="text-gray-400">→</span>
                </div>
              </button>
            )}
          </div>
        )}

        <Link
          to="/donate"
          className="block bg-white rounded-2xl p-4 border border-gray-200 shadow-sm hover:shadow-md transition-shadow"
          data-testid="donate-link"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-red-100 to-red-50 flex items-center justify-center">
                <CurrencyDollar size={24} className="text-red-600" weight="duotone" />
              </div>
              <div>
                <p className="font-medium">Fazer uma Doação</p>
                <p className="text-sm text-gray-600">Apoie o Elo</p>
              </div>
            </div>
            <span className="text-gray-400">→</span>
          </div>
        </Link>

        <button
          onClick={handleLogout}
          data-testid="logout-button"
          className="w-full bg-white hover:bg-gray-50 text-red-600 font-medium py-3 rounded-2xl border border-gray-200 flex items-center justify-center gap-2"
        >
          <SignOut size={20} weight="bold" />
          <span>Sair</span>
        </button>
      </div>

      {showSettings && <NotificationSettings onClose={() => setShowSettings(false)} />}
      <BottomNav active="profile" />
    </div>
  );
}

// ============= DONATE PAGE =============

function DonatePage({ user }) {
  const [selectedPackage, setSelectedPackage] = useState('small');
  const [loading, setLoading] = useState(false);

  const packages = {
    small: { amount: 5, label: 'Pequena' },
    medium: { amount: 10, label: 'Média' },
    large: { amount: 20, label: 'Grande' }
  };

  const handleDonate = async () => {
    setLoading(true);
    try {
      const originUrl = window.location.origin;
      const response = await axios.post(
        `${API}/payments/checkout?package_type=${selectedPackage}&origin_url=${encodeURIComponent(originUrl)}`,
        {},
        { withCredentials: true }
      );
      window.location.href = response.data.url;
    } catch (error) {
      toast.error('Erro ao processar doação');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen pb-20 bg-gray-50" data-testid="donate-page">
      <div className="glass border-b border-gray-200 px-4 py-4">
        <h1 className="text-2xl font-bold text-center">Fazer uma Doação</h1>
      </div>

      <div className="max-w-2xl mx-auto p-4 space-y-6">
        <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
          <p className="text-center text-gray-600 mb-6">
            Sua doação ajuda a manter o Elo funcionando e alcançando mais pessoas.
          </p>

          <div className="space-y-3 mb-6">
            {Object.entries(packages).map(([key, pkg]) => (
              <button
                key={key}
                onClick={() => setSelectedPackage(key)}
                data-testid={`package-${key}`}
                className={`w-full p-4 rounded-xl border-2 transition-all ${
                  selectedPackage === key
                    ? 'border-blue-600 bg-blue-50'
                    : 'border-gray-200 hover:border-blue-300'
                }`}
              >
                <div className="flex justify-between items-center">
                  <span className="font-medium">{pkg.label}</span>
                  <span className="text-xl font-bold text-blue-600">${pkg.amount}</span>
                </div>
              </button>
            ))}
          </div>

          <button
            onClick={handleDonate}
            disabled={loading}
            data-testid="donate-button"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 rounded-full disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? (
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
            ) : (
              <>
                <CurrencyDollar size={20} weight="bold" />
                <span>Doar ${packages[selectedPackage].amount}</span>
              </>
            )}
          </button>

          <p className="text-xs text-center text-gray-500 mt-4">
            Pagamento seguro via Stripe • PIX e Cartão de Crédito
          </p>
        </div>
      </div>
    </div>
  );
}

// ============= DONATE SUCCESS =============

function DonateSuccess() {
  const [status, setStatus] = useState('checking');
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const sessionId = params.get('session_id');

    if (!sessionId) {
      navigate('/donate');
      return;
    }

    checkStatus(sessionId);
  }, [location, navigate]);

  const checkStatus = async (sessionId, attempt = 0) => {
    if (attempt >= 5) {
      setStatus('timeout');
      return;
    }

    try {
      const response = await axios.get(`${API}/payments/checkout/status/${sessionId}`, { withCredentials: true });
      
      if (response.data.payment_status === 'paid') {
        setStatus('success');
      } else if (response.data.status === 'expired') {
        setStatus('error');
      } else {
        setTimeout(() => checkStatus(sessionId, attempt + 1), 2000);
      }
    } catch (error) {
      setStatus('error');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50">
      <div className="max-w-md w-full bg-white rounded-2xl p-8 text-center shadow-lg">
        {status === 'checking' && (
          <>
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-gray-600">Verificando pagamento...</p>
          </>
        )}

        {status === 'success' && (
          <>
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl">✓</span>
            </div>
            <h2 className="text-2xl font-bold mb-2">Doação recebida!</h2>
            <p className="text-gray-600 mb-6">Muito obrigado pelo seu apoio!</p>
            <Link
              to="/feed"
              className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-6 rounded-full"
            >
              Voltar ao Início
            </Link>
          </>
        )}

        {(status === 'error' || status === 'timeout') && (
          <>
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <X size={32} className="text-red-600" />
            </div>
            <h2 className="text-2xl font-bold mb-2">Erro no pagamento</h2>
            <p className="text-gray-600 mb-6">Tente novamente mais tarde</p>
            <Link
              to="/donate"
              className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-6 rounded-full"
            >
              Tentar Novamente
            </Link>
          </>
        )}
      </div>
    </div>
  );
}

// ============= ROUTER =============

import { useParams } from "react-router-dom";

function AppRouter() {
  const location = useLocation();
  
  // Check URL fragment for session_id synchronously during render
  if (location.hash?.includes('session_id=')) {
    return <AuthCallback />;
  }

  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/auth/callback" element={<AuthCallback />} />
      <Route path="/" element={<Navigate to="/feed" replace />} />
      <Route path="/feed" element={<ProtectedRoute><VideoFeed /></ProtectedRoute>} />
      <Route path="/prayers" element={<ProtectedRoute><PrayersPage /></ProtectedRoute>} />
      <Route path="/communities" element={<ProtectedRoute><CommunitiesPage /></ProtectedRoute>} />
      <Route path="/community/:id" element={<ProtectedRoute><CommunityDetail /></ProtectedRoute>} />
      <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
      <Route path="/donate" element={<ProtectedRoute><DonatePage /></ProtectedRoute>} />
      <Route path="/donate/success" element={<ProtectedRoute><DonateSuccess /></ProtectedRoute>} />
    </Routes>
  );
}

function App() {
  return (
    <div className="App">
      <BrowserRouter>
        <AppRouter />
      </BrowserRouter>
      <Toaster position="top-center" richColors />
    </div>
  );
}

export default App;