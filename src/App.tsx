/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Fuel, 
  Lock, 
  Unlock, 
  AlertCircle, 
  CheckCircle2, 
  Clock, 
  Play, 
  Square,
  Settings,
  Activity,
  Database,
  Wifi,
  Terminal as TerminalIcon,
  Info
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

type NozzleStatus = 'L' | 'A' | 'B' | 'E' | 'P' | 'F' | 'C' | ' ';

interface FuelingData {
  volume: number;
  total: number;
  price: number;
}

interface Nozzle {
  id: string;
  status: NozzleStatus;
  currentFueling: FuelingData | null;
}

const STATUS_COLORS: Record<NozzleStatus, string> = {
  'L': 'bg-emerald-500', // Livre
  'A': 'bg-yellow-400',  // Abastecendo
  'B': 'bg-red-500',     // Bloqueado
  'E': 'bg-orange-500',  // Espera
  'P': 'bg-blue-500',    // Pronto
  'F': 'bg-zinc-800',    // Falha
  'C': 'bg-purple-500',  // Concluiu
  ' ': 'bg-zinc-200',    // Não configurado
};

const STATUS_LABELS: Record<NozzleStatus, string> = {
  'L': 'Livre',
  'A': 'Abastecendo',
  'B': 'Bloqueado',
  'E': 'Espera',
  'P': 'Pronto',
  'F': 'Falha',
  'C': 'Concluiu',
  ' ': 'N/C',
};

export default function App() {
  const [nozzles, setNozzles] = useState<Nozzle[]>([]);
  const [selectedNozzle, setSelectedNozzle] = useState<Nozzle | null>(null);
  const [loading, setLoading] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [showConnModal, setShowConnModal] = useState(true);
  const [connSettings, setConnSettings] = useState({
    ip: '192.168.0.91',
    port: '2001',
    protocol: 'Horustech'
  });

  const fetchStatus = async () => {
    if (!isConnected) return;
    try {
      const response = await fetch('/api/status');
      const data = await response.json();
      setNozzles(data);
      if (selectedNozzle) {
        const updated = data.find((n: Nozzle) => n.id === selectedNozzle.id);
        if (updated) setSelectedNozzle(updated);
      }
    } catch (error) {
      console.error('Error fetching status:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isConnected) {
      fetchStatus();
      const interval = setInterval(fetchStatus, 1000);
      return () => clearInterval(interval);
    }
  }, [isConnected, selectedNozzle?.id]);

  const handleConnect = async () => {
    setLoading(true);
    // Simulate connection delay
    setTimeout(() => {
      setIsConnected(true);
      setShowConnModal(false);
      setLoading(false);
    }, 1500);
  };

  const handleDisconnect = () => {
    setIsConnected(false);
    setNozzles([]);
    setSelectedNozzle(null);
    setShowConnModal(true);
  };

  const sendCommand = async (nozzleId: string, command: string) => {
    if (!isConnected) return;
    try {
      await fetch('/api/command', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nozzleId, command })
      });
      fetchStatus();
    } catch (error) {
      console.error('Error sending command:', error);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-100 font-sans text-zinc-900 flex flex-col" id="app-container">
      {/* Connection Modal */}
      <AnimatePresence>
        {showConnModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            id="connection-modal"
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-zinc-200"
            >
              <div className="bg-zinc-800 p-6 text-white flex items-center gap-3">
                <Wifi className="w-6 h-6 text-blue-400" />
                <div>
                  <h2 className="text-xl font-bold">Conexão com Automação</h2>
                  <p className="text-xs text-zinc-400">Configure os parâmetros de rede</p>
                </div>
              </div>
              
              <div className="p-8 space-y-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Endereço IP</label>
                    <input 
                      type="text" 
                      value={connSettings.ip}
                      onChange={(e) => setConnSettings({...connSettings, ip: e.target.value})}
                      className="w-full px-4 py-3 rounded-xl border border-zinc-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all font-mono"
                      placeholder="192.168.0.1"
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Porta</label>
                      <select 
                        value={connSettings.port}
                        onChange={(e) => setConnSettings({...connSettings, port: e.target.value})}
                        className="w-full px-4 py-3 rounded-xl border border-zinc-200 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                      >
                        <option value="2001">2001 (Gerencial)</option>
                        <option value="1771">1771 (Console)</option>
                        <option value="857">857 (Auxiliar)</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Protocolo</label>
                      <select 
                        value={connSettings.protocol}
                        onChange={(e) => setConnSettings({...connSettings, protocol: e.target.value})}
                        className="w-full px-4 py-3 rounded-xl border border-zinc-200 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                      >
                        <option value="Horustech">Horustech</option>
                        <option value="Companytec">Companytec</option>
                        <option value="CBC">CBC</option>
                      </select>
                    </div>
                  </div>
                </div>

                <button 
                  onClick={handleConnect}
                  disabled={loading}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-xl shadow-lg shadow-blue-200 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                  id="btn-connect"
                >
                  {loading ? (
                    <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <Wifi className="w-5 h-5" />
                      Estabelecer Conexão
                    </>
                  )}
                </button>

                <div className="bg-zinc-50 p-4 rounded-xl border border-zinc-100 flex items-start gap-3">
                  <Info className="w-5 h-5 text-zinc-400 shrink-0 mt-0.5" />
                  <p className="text-[10px] text-zinc-500 leading-relaxed">
                    Certifique-se de que o concentrador esteja acessível na rede local. 
                    A porta padrão para sistemas gerenciais é a 2001.
                  </p>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <header className="bg-zinc-800 text-white p-4 shadow-md flex items-center justify-between" id="main-header">
        <div className="flex items-center gap-3">
          <div className="bg-blue-600 p-2 rounded-lg">
            <Fuel className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight">HRS-Console Web</h1>
            <p className="text-xs text-zinc-400">
              {isConnected ? `Conectado: ${connSettings.ip}:${connSettings.port}` : 'Desconectado'}
            </p>
          </div>
        </div>
        <nav className="flex gap-6 text-sm font-medium">
          <button 
            onClick={() => setShowConnModal(true)}
            className="flex items-center gap-2 hover:text-blue-400 transition-colors cursor-pointer" 
            id="nav-iniciar"
          >
            <Wifi className="w-4 h-4" /> Iniciar
          </button>
          <button className="flex items-center gap-2 hover:text-blue-400 transition-colors cursor-pointer" id="nav-abastecimentos">
            <Database className="w-4 h-4" /> Abastecimentos
          </button>
          <button className="flex items-center gap-2 hover:text-blue-400 transition-colors cursor-pointer" id="nav-diagnosticos">
            <Activity className="w-4 h-4" /> Diagnósticos
          </button>
          <button 
            onClick={handleDisconnect}
            className="flex items-center gap-2 text-red-400 hover:text-red-300 transition-colors cursor-pointer" 
            id="nav-desconectar"
          >
            <Square className="w-4 h-4" /> Desconectar
          </button>
        </nav>
      </header>

      <main className="flex-1 p-6 grid grid-cols-1 lg:grid-cols-4 gap-6 overflow-hidden" id="main-content">
        {/* Nozzle Grid */}
        <section className="lg:col-span-3 bg-white rounded-2xl shadow-sm border border-zinc-200 p-6 flex flex-col" id="nozzle-grid-section">
          {!isConnected ? (
            <div className="flex-1 flex flex-col items-center justify-center text-zinc-400 space-y-4">
              <Wifi className="w-16 h-16 opacity-10" />
              <p className="text-lg">Aguardando conexão com o concentrador...</p>
              <button 
                onClick={() => setShowConnModal(true)}
                className="px-6 py-2 bg-zinc-800 text-white rounded-lg hover:bg-zinc-700 transition-colors"
              >
                Configurar Conexão
              </button>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold flex items-center gap-2">
                  <Activity className="w-5 h-5 text-blue-600" />
                  Monitoramento de Pista
                </h2>
                <div className="flex gap-2 text-xs">
                  {Object.entries(STATUS_COLORS).map(([status, color]) => (
                    status !== ' ' && (
                      <div key={status} className="flex items-center gap-1">
                        <div className={`w-3 h-3 rounded-full ${color}`} />
                        <span className="text-zinc-500">{STATUS_LABELS[status as NozzleStatus]}</span>
                      </div>
                    )
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-3 overflow-y-auto pr-2" id="nozzles-container">
                {nozzles.map((nozzle) => (
                  <motion.button
                    key={nozzle.id}
                    id={`nozzle-${nozzle.id}`}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setSelectedNozzle(nozzle)}
                    className={`
                      relative aspect-square rounded-xl flex flex-col items-center justify-center gap-1
                      transition-all shadow-sm border-2
                      ${selectedNozzle?.id === nozzle.id ? 'border-blue-600 ring-2 ring-blue-100' : 'border-transparent'}
                      ${STATUS_COLORS[nozzle.status]}
                      ${['L', 'A', 'P', 'C'].includes(nozzle.status) ? 'text-white' : 'text-white'}
                    `}
                  >
                    <span className="text-xs font-bold opacity-70">{nozzle.id}</span>
                    {nozzle.status === 'A' ? (
                      <div className="animate-pulse">
                        <Fuel className="w-6 h-6" />
                      </div>
                    ) : nozzle.status === 'B' ? (
                      <Lock className="w-6 h-6" />
                    ) : (
                      <div className="w-6 h-6" />
                    )}
                    <span className="text-[10px] font-medium uppercase tracking-wider">
                      {STATUS_LABELS[nozzle.status]}
                    </span>
                    
                    {nozzle.currentFueling && (
                      <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 bg-white text-zinc-900 text-[8px] px-1.5 py-0.5 rounded-full shadow-sm border border-zinc-200 font-bold whitespace-nowrap">
                        {nozzle.currentFueling.volume.toFixed(2)}L
                      </div>
                    )}
                  </motion.button>
                ))}
              </div>
            </>
          )}
        </section>

        {/* Control Panel */}
        <aside className="bg-white rounded-2xl shadow-sm border border-zinc-200 p-6 flex flex-col" id="control-panel">
          <AnimatePresence mode="wait">
            {selectedNozzle ? (
              <motion.div
                key={selectedNozzle.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="flex flex-col h-full"
                id="nozzle-details"
              >
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold">Bico {selectedNozzle.id}</h3>
                  <div className={`px-3 py-1 rounded-full text-xs font-bold text-white ${STATUS_COLORS[selectedNozzle.status]}`}>
                    {STATUS_LABELS[selectedNozzle.status]}
                  </div>
                </div>

                <div className="space-y-6 flex-1">
                  {/* Real-time Display */}
                  <div className="bg-zinc-900 text-emerald-400 p-6 rounded-2xl font-mono shadow-inner border-4 border-zinc-800" id="fueling-display">
                    <div className="flex justify-between items-end mb-4">
                      <span className="text-xs text-zinc-500 uppercase">Total a Pagar</span>
                      <span className="text-3xl font-bold">R$ {selectedNozzle.currentFueling?.total.toFixed(2) || '0.00'}</span>
                    </div>
                    <div className="flex justify-between items-end mb-4">
                      <span className="text-xs text-zinc-500 uppercase">Volume (L)</span>
                      <span className="text-3xl font-bold">{selectedNozzle.currentFueling?.volume.toFixed(3) || '0.000'}</span>
                    </div>
                    <div className="flex justify-between items-end border-t border-zinc-800 pt-4">
                      <span className="text-xs text-zinc-500 uppercase">Preço/L</span>
                      <span className="text-xl">R$ {selectedNozzle.currentFueling?.price.toFixed(3) || '5.890'}</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="grid grid-cols-2 gap-3" id="action-buttons">
                    <button 
                      onClick={() => sendCommand(selectedNozzle.id, 'AUTHORIZE')}
                      disabled={!['B', 'E'].includes(selectedNozzle.status)}
                      className="flex flex-col items-center gap-2 p-4 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-semibold"
                      id="btn-authorize"
                    >
                      <Play className="w-6 h-6" />
                      Autorizar
                    </button>
                    <button 
                      onClick={() => sendCommand(selectedNozzle.id, 'BLOCK')}
                      disabled={selectedNozzle.status === 'B'}
                      className="flex flex-col items-center gap-2 p-4 rounded-xl bg-red-50 text-red-700 border border-red-200 hover:bg-red-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-semibold"
                      id="btn-block"
                    >
                      <Lock className="w-6 h-6" />
                      Bloquear
                    </button>
                    <button 
                      onClick={() => sendCommand(selectedNozzle.id, 'FREE')}
                      disabled={selectedNozzle.status === 'L'}
                      className="flex flex-col items-center gap-2 p-4 rounded-xl bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-semibold"
                      id="btn-free"
                    >
                      <Unlock className="w-6 h-6" />
                      Liberar
                    </button>
                    <button 
                      className="flex flex-col items-center gap-2 p-4 rounded-xl bg-zinc-50 text-zinc-700 border border-zinc-200 hover:bg-zinc-100 transition-colors font-semibold"
                      id="btn-preset"
                    >
                      <TerminalIcon className="w-6 h-6" />
                      Preset
                    </button>
                  </div>

                  {/* Info */}
                  <div className="bg-zinc-50 p-4 rounded-xl border border-zinc-200 space-y-2 text-sm" id="nozzle-info">
                    <div className="flex justify-between">
                      <span className="text-zinc-500">Tanque:</span>
                      <span className="font-medium">01 (Gasolina Comum)</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-500">Último Identfid:</span>
                      <span className="font-medium">B3CF6CCFFF1FD792</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-500">ICOM / Canal:</span>
                      <span className="font-medium">01 / A</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-zinc-400 text-center space-y-4" id="no-selection">
                <Info className="w-12 h-12 opacity-20" />
                <p>Selecione um bico na pista para visualizar detalhes e enviar comandos.</p>
              </div>
            )}
          </AnimatePresence>
        </aside>
      </main>

      {/* Footer Status Bar */}
      <footer className="bg-zinc-800 text-zinc-400 px-4 py-2 text-xs flex items-center justify-between border-t border-zinc-700" id="status-bar">
        <div className="flex gap-4">
          <span className="flex items-center gap-1">
            <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-500' : 'bg-red-500'}`} />
            {isConnected ? 'Controlador Online' : 'Controlador Offline'}
          </span>
          <span className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {new Date().toLocaleTimeString()}
          </span>
        </div>
        <div className="flex gap-4">
          <span>Porta: {connSettings.port} ({connSettings.protocol})</span>
          <span>IP: {connSettings.ip}</span>
        </div>
      </footer>
    </div>
  );
}
