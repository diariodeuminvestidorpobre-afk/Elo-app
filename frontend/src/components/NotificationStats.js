import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Chart, Bell, TrendUp } from '@phosphor-icons/react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function NotificationStats() {
  const [stats, setStats] = useState({
    pending: 0,
    processed: 0,
    lastProcessed: null
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
    // Refresh stats every 30 seconds
    const interval = setInterval(loadStats, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadStats = async () => {
    try {
      // This would be a real API call in production
      // For now, we'll simulate it
      setStats({
        pending: Math.floor(Math.random() * 10),
        processed: Math.floor(Math.random() * 100),
        lastProcessed: new Date().toLocaleTimeString('pt-BR')
      });
    } catch (error) {
      console.error('Failed to load notification stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return null;
  }

  return (
    <div className="bg-gradient-to-br from-blue-50 to-red-50 rounded-2xl p-4 border border-blue-100">
      <div className="flex items-center gap-2 mb-3">
        <Chart size={20} weight="duotone" className="text-blue-600" />
        <h3 className="font-semibold text-sm">Notificações Inteligentes</h3>
      </div>
      
      <div className="grid grid-cols-3 gap-2 text-center">
        <div className="bg-white/60 rounded-xl p-2">
          <p className="text-xs text-gray-600">Pendentes</p>
          <p className="text-lg font-bold text-blue-600">{stats.pending}</p>
        </div>
        <div className="bg-white/60 rounded-xl p-2">
          <p className="text-xs text-gray-600">Processadas</p>
          <p className="text-lg font-bold text-green-600">{stats.processed}</p>
        </div>
        <div className="bg-white/60 rounded-xl p-2">
          <p className="text-xs text-gray-600">Economia</p>
          <p className="text-lg font-bold text-red-600">~{Math.floor(stats.processed * 0.6)}</p>
        </div>
      </div>
      
      <div className="mt-3 flex items-center justify-between text-xs text-gray-600">
        <div className="flex items-center gap-1">
          <TrendUp size={14} weight="bold" className="text-green-600" />
          <span>Agrupamento ativo</span>
        </div>
        {stats.lastProcessed && (
          <span>Último: {stats.lastProcessed}</span>
        )}
      </div>
      
      <p className="text-xs text-gray-500 mt-2">
        ✨ Notificações similares são agrupadas automaticamente
      </p>
    </div>
  );
}
