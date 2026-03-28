import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import { X, Bell, Heart, ChatCircle, HandsPraying, UserPlus, Users as UsersIcon, Video, BookOpen } from '@phosphor-icons/react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function NotificationSettings({ onClose }) {
  const [preferences, setPreferences] = useState({
    likes: true,
    comments: true,
    prayers: true,
    follows: true,
    community_messages: true,
    new_videos: false,
    daily_verse: false
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadPreferences();
  }, []);

  const loadPreferences = async () => {
    try {
      const response = await axios.get(`${API}/notifications/preferences`, { withCredentials: true });
      setPreferences(response.data);
    } catch (error) {
      console.error('Failed to load preferences:', error);
    } finally {
      setLoading(false);
    }
  };

  const updatePreference = async (key, value) => {
    setSaving(true);
    try {
      const response = await axios.put(
        `${API}/notifications/preferences?${key}=${value}`,
        {},
        { withCredentials: true }
      );
      setPreferences(response.data);
      toast.success('Preferência atualizada');
    } catch (error) {
      toast.error('Erro ao atualizar preferência');
    } finally {
      setSaving(false);
    }
  };

  const togglePreference = (key) => {
    const newValue = !preferences[key];
    setPreferences({ ...preferences, [key]: newValue });
    updatePreference(key, newValue);
  };

  const notificationTypes = [
    {
      key: 'likes',
      label: 'Curtidas',
      description: 'Quando alguém curtir seu vídeo',
      icon: Heart,
      color: 'text-red-500',
      bgColor: 'bg-red-50'
    },
    {
      key: 'comments',
      label: 'Comentários',
      description: 'Quando alguém comentar seu vídeo',
      icon: ChatCircle,
      color: 'text-blue-500',
      bgColor: 'bg-blue-50'
    },
    {
      key: 'prayers',
      label: 'Orações',
      description: 'Quando alguém orar por seu pedido',
      icon: HandsPraying,
      color: 'text-purple-500',
      bgColor: 'bg-purple-50'
    },
    {
      key: 'follows',
      label: 'Novos seguidores',
      description: 'Quando alguém começar a seguir você',
      icon: UserPlus,
      color: 'text-green-500',
      bgColor: 'bg-green-50'
    },
    {
      key: 'community_messages',
      label: 'Mensagens de comunidade',
      description: 'Novas mensagens nas suas comunidades',
      icon: UsersIcon,
      color: 'text-indigo-500',
      bgColor: 'bg-indigo-50'
    },
    {
      key: 'new_videos',
      label: 'Novos vídeos',
      description: 'Quando alguém que você segue postar',
      icon: Video,
      color: 'text-pink-500',
      bgColor: 'bg-pink-50'
    },
    {
      key: 'daily_verse',
      label: 'Versículo do dia',
      description: 'Lembrete diário do versículo',
      icon: BookOpen,
      color: 'text-amber-500',
      bgColor: 'bg-amber-50'
    }
  ];

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl p-6 max-w-md w-full">
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" data-testid="notification-settings">
      <div className="bg-white rounded-3xl max-w-md w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-600 to-red-500 flex items-center justify-center">
              <Bell size={20} weight="bold" className="text-white" />
            </div>
            <h2 className="text-xl font-bold">Preferências de Notificações</h2>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto flex-1 p-6 space-y-3">
          <p className="text-sm text-gray-600 mb-4">
            Escolha quais notificações você deseja receber
          </p>

          {notificationTypes.map((type) => {
            const Icon = type.icon;
            const isEnabled = preferences[type.key];

            return (
              <button
                key={type.key}
                onClick={() => togglePreference(type.key)}
                disabled={saving}
                className={`w-full p-4 rounded-2xl border-2 transition-all text-left ${
                  isEnabled
                    ? 'border-blue-600 bg-blue-50/50'
                    : 'border-gray-200 bg-white hover:border-gray-300'
                }`}
                data-testid={`notification-toggle-${type.key}`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 flex-1">
                    <div className={`w-12 h-12 rounded-xl ${type.bgColor} flex items-center justify-center`}>
                      <Icon size={24} weight="duotone" className={type.color} />
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-gray-900">{type.label}</p>
                      <p className="text-sm text-gray-600">{type.description}</p>
                    </div>
                  </div>

                  {/* Toggle Switch */}
                  <div
                    className={`w-12 h-7 rounded-full transition-colors relative ${
                      isEnabled ? 'bg-blue-600' : 'bg-gray-300'
                    }`}
                  >
                    <div
                      className={`absolute top-1 w-5 h-5 bg-white rounded-full transition-transform ${
                        isEnabled ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 bg-gray-50">
          <p className="text-xs text-center text-gray-500">
            Você pode alterar estas preferências a qualquer momento
          </p>
        </div>
      </div>
    </div>
  );
}
