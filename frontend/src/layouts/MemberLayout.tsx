import { useState, useEffect } from 'react';
import { X, Menu } from 'lucide-react';
import { MemberSidebar, type MemberPage } from '../components/MemberSidebar';
import { Header } from '../components/Header';
import { StatsDashboard } from '../components/StatsDashboard';
import { TradeForm } from '../components/TradeForm';
import { CoachingPanel } from '../components/CoachingPanel';
import { ConseilsTab } from '../components/ConseilsTab';
import { StatsPage } from '../pages/StatsPage';
import { StrategyPage } from '../pages/StrategyPage';
import { TradesListPage } from '../pages/TradesListPage';
import { ConseilsListPage } from '../pages/ConseilsListPage';
import { CalculatorPage } from '../pages/CalculatorPage';
import { CapitalPage, type CapitalEntry } from '../pages/CapitalPage';
import { EditTradeModal } from '../components/EditTradeModal';
import { EditConseilModal } from '../components/EditConseilModal';
import { MemberDashboardPage } from '../pages/member/MemberDashboardPage';
import { MemberProfilePage } from '../pages/member/MemberProfilePage';

interface Trade {
  id?: string;
  actif: string;
  position: 'Achat' | 'Vente';
  prixEntree: number;
  stopLoss: number;
  takeProfit: number;
  resultat: number;
  contexte: string;
  emotion: string;
  imageBase64?: string;
  createdAt?: string;
  analyseMentor?: string;
  strategyId?: string;
  strategyName?: string;
  checkedRules?: string[];
  strategyRulesTotalCount?: number;
  lots?: number;
  session?: 'Asie' | 'Londres' | 'New York' | 'Overlap' | null;
  timeframe?: 'M1' | 'M5' | 'M15' | 'H1' | 'H4' | 'D1' | null;
  prixSortie?: number;
}

interface Conseil {
  id?: string;
  rawText: string;
  simplifiedText: string;
  categorie: 'Psychologie' | 'Stratégie';
  createdAt?: string;
}

interface Strategy {
  id?: string;
  name: string;
  actif: string;
  rules: string[];
  riskPercent: number;
  targetRR: number;
  description?: string;
  createdAt?: string;
}

const API_TRADES = '/api/trades';
const API_CONSEILS = '/api/conseils';
const API_STRATEGIES = '/api/strategies';

const PAGE_SIZE = 50;

const DEFAULT_STRATEGIES: Strategy[] = [
  {
    id: 'strat-1',
    name: 'ICT Liquidity Sweep / Purge de liquidité',
    actif: 'XAU/USD',
    rules: [
      "Attendre le sweep (balayage) du plus haut ou plus bas de la session d'Asie.",
      "Attendre un Market Structure Shift (MSS) avec déplacement en M5 ou M15.",
      "Placer un ordre limite sur la Fair Value Gap (FVG) créée par la cassure.",
      "Placer le Stop Loss juste au-delà de la mèche de balayage.",
      "Cibler le pool de liquidité opposé (minimum 2.5:1 R:R)."
    ],
    riskPercent: 1.0,
    targetRR: 3.0,
    description: "Exploitation de la volatilité de l'Or en piégeant les ordres stop-loss des traders de détail lors de l'ouverture de Londres ou New York."
  },
  {
    id: 'strat-2',
    name: 'SMC H1 Order Block Retracement',
    actif: 'XAU/USD',
    rules: [
      "Identifier la tendance de fond en unités H4/H1.",
      "Détecter un fort mouvement impulsif brisant la structure précédente (BOS).",
      "Tracer l'Order Block (OB) H1 à l'origine du mouvement.",
      "Attendre le retour lent du prix (retracement) dans la zone des 50% de l'OB.",
      "Positionner le SL 10 pips sous l'OB, et viser le prochain sommet technique."
    ],
    riskPercent: 0.5,
    targetRR: 4.0,
    description: "Suivi de tendance institutionnel cherchant à acheter ou vendre sur les zones d'accumulation/distribution majeures."
  },
  {
    id: 'strat-3',
    name: 'London Breakout Momentum',
    actif: 'XAU/USD',
    rules: [
      "Définir le range de pré-ouverture de Londres entre 07:00 et 09:00 Paris.",
      "Attendre une clôture claire de bougie M15 en dehors de ce range.",
      "Entrer en position sur le pullback/retest du niveau de support ou résistance cassé.",
      "Fixer le Stop Loss au milieu du range initial.",
      "Projeter l'objectif de gain à 1.5 fois la hauteur du range."
    ],
    riskPercent: 1.0,
    targetRR: 2.0,
    description: "Capture du flux d'ordres massif à l'ouverture de la session européenne, idéal pour capter le premier mouvement impulsif du matin."
  }
];

// ── Local fallback analysis ─────────────────────────────────────────────────
function localAnalysis(trade: Omit<Trade, 'id' | 'createdAt' | 'analyseMentor'>): string {
  const { prixEntree: e, stopLoss: sl, takeProfit: tp, position, resultat, emotion, strategyName, checkedRules, strategyRulesTotalCount } = trade;

  let risk = Math.abs(e - sl) || 0.1;
  let reward = Math.abs(tp - e);
  const rr = Number((reward / risk).toFixed(2));
  const dirOk = (position === 'Achat' && tp > e && sl < e) || (position === 'Vente' && tp < e && sl > e);

  let tech = dirOk
    ? rr < 1.5
      ? `🔴 **Ratio R:R Insuffisant (${rr}:1)**. Risque ${risk.toFixed(2)} pts vs objectif ${reward.toFixed(2)} pts.`
      : `🟢 **Excellent Ratio R:R (${rr}:1)**. Objectif ${reward.toFixed(2)} pts compense le risque ${risk.toFixed(2)} pts.`
    : `⚠️ **Incohérence Critique** : SL/TP inversés pour une position ${position}.`;

  let stratAudit = '';
  let stratAdvice = '';
  if (strategyName) {
    const checked = checkedRules?.length || 0;
    const total = strategyRulesTotalCount || 0;
    if (total === 0) {
      stratAudit = `⚪ **Plan non quantifié** : Setup "${strategyName}" appliqué sans règles enregistrées.`;
    } else if (checked === total) {
      stratAudit = `🟢 **Plan respecté à 100%** : Toutes les ${total} règles du setup "${strategyName}" ont été validées.`;
      stratAdvice = `Ta rigueur à valider tous tes critères pour "${strategyName}" montre un comportement professionnel. `;
    } else if (checked === 0) {
      stratAudit = `🔴 **Indiscipline totale (0% validé)** : Aucune des ${total} règles du setup "${strategyName}" n'a été validée.`;
      stratAdvice = `Prendre un trade sous le nom du setup "${strategyName}" sans valider aucune règle est une infraction majeure. `;
    } else {
      stratAudit = `🟡 **Plan partiellement respecté** : ${checked}/${total} règle(s) validée(s) pour le setup "${strategyName}".`;
      stratAdvice = `Tu as respecté certaines règles de ton setup, mais en ignorant les autres, tu as pris un risque non mesuré. `;
    }
  } else {
    stratAudit = `⚠️ **Aucune stratégie** : Ce trade a été pris sans stratégie formalisée.`;
    stratAdvice = `Trader sans stratégie formalisée nuit à la régularité statistique. `;
  }

  const emo = emotion.toLowerCase();
  const negEmo = emo.includes('fomo') || emo.includes('impatient') || emo.includes('stress') || emo.includes('peur') || emo.includes('frustré');
  const psych = negEmo
    ? `🔴 **Influence Émotionnelle Négative**. État : "${emotion}" pousse à des décisions impulsives.`
    : `🟢 **État Émotionnel Optimal**. État : "${emotion}" favorise le respect du plan technique.`;

  let advice = dirOk && rr >= 1.5
    ? `Conserve cette rigueur sur tes ratios. Assure-toi d'entrer sur des zones de liquidité. ${stratAdvice}${negEmo ? `Malgré l'émotion, gère ton risque.` : `Ta discipline ${resultat >= 0 ? 'a payé.' : 'paiera.'}`}`
    : `Revois ton setup avant chaque trade. ${stratAdvice}${negEmo ? `Attends un état plus serein avant d'entrer.` : `Le plan technique reste prioritaire.`}`;

  return `| Aspect | Évaluation de l'Expert XAU/USD |\n| :--- | :--- |\n| **Audit Technique** | ${tech} |\n| **Respect de la Stratégie** | ${stratAudit} |\n| **Audit Psychologique** | ${psych} |\n\n### 💡 Conseil du Mentor\n${advice}\n`;
}

function localSimplify(rawText: string): string {
  const low = rawText.toLowerCase();
  let action = 'Relire ce conseil avant ta prochaine session.';
  if (low.includes('stop loss') || low.includes('sl ')) action = "Place systématiquement ton Stop Loss avant d'ouvrir toute position.";
  else if (low.includes('levier') || low.includes('lot')) action = 'Réduis ton levier de moitié et risque max 1% du capital.';
  else if (low.includes('fomo') || low.includes('discipline')) action = "Attends un signal clair de ton plan avant d'entrer.";
  else if (low.includes('take profit') || low.includes('tp ')) action = 'Sécurise 50% du volume dès que le R:R 1:1 est atteint.';

  const bullets = rawText.split(/[.!\n]/).filter(s => s.trim().length > 10)
    .slice(0, 3).map(s => `- ${s.trim()}`).join('\n') || `- ${rawText.slice(0, 150)}`;

  return `### 📝 Synthèse du Conseil\n${bullets}\n\n### ⚡ Action immédiate\n**${action}**`;
}

interface MemberLayoutProps {
  currentMember: { id: string; fullName: string; role: string; email?: string; phone?: string; facebook?: string; accessCode?: string; createdAt?: string; profilePhoto?: string };
  apiFetch: (url: string, options?: RequestInit) => Promise<Response>;
  onLogout: () => void;
  onUpdateMember?: (member: any) => void;
}

export function MemberLayout({ currentMember, apiFetch, onLogout, onUpdateMember }: MemberLayoutProps) {
  const [activePage, setActivePage] = useState<MemberPage>('member-dashboard');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [backendOnline, setBackendOnline] = useState(false);

  // Helper function for safe localStorage operations
  const safeLocalStorage = {
    getItem: (key: string): string | null => {
      try {
        return localStorage.getItem(key);
      } catch (e) {
        console.error('Error reading from localStorage:', e);
        return null;
      }
    },
    setItem: (key: string, value: string): boolean => {
      try {
        localStorage.setItem(key, value);
        return true;
      } catch (e) {
        console.error('Error writing to localStorage:', e);
        return false;
      }
    },
    removeItem: (key: string): void => {
      try {
        localStorage.removeItem(key);
      } catch (e) {
        console.error('Error removing from localStorage:', e);
      }
    }
  };

  const toggleMobileMenu = () => {
    setMobileMenuOpen(v => !v);
  };

  const closeMobileMenu = () => {
    setMobileMenuOpen(false);
  };

  const [dailyGoal, setDailyGoal] = useState<number>(() => {
    const saved = safeLocalStorage.getItem('xau_daily_goal');
    return saved ? parseFloat(saved) : 500;
  });

  const [trades, setTrades] = useState<Trade[]>([]);
  const [selectedTrade, setSelectedTrade] = useState<Trade | null>(null);
  const [coachingModalTrade, setCoachingModalTrade] = useState<Trade | null>(null);
  const [_loadingTrades, setLoadingTrades] = useState(true);
  const [tradesPage, _setTradesPage] = useState(1);
  const [_tradesTotal, setTradesTotal] = useState(0);
  const [conseilsPage, _setConseilsPage] = useState(1);
  const [_conseilsTotal, setConseilsTotal] = useState(0);
  const [strategiesPage, _setStrategiesPage] = useState(1);
  const [_strategiesTotal, setStrategiesTotal] = useState(0);
  const [editingTrade, setEditingTrade] = useState<Trade | null>(null);

  const [conseils, setConseils] = useState<Conseil[]>([]);
  const [loadingConseils, setLoadingConseils] = useState(true);
  const [editingConseil, setEditingConseil] = useState<Conseil | null>(null);
  const [lastAddedConseil, setLastAddedConseil] = useState<Conseil | null>(null);

  const [strategies, setStrategies] = useState<Strategy[]>([]);
  const [loadingStrategies, setLoadingStrategies] = useState(true);

  const [capital, setCapital] = useState<number>(() => {
    const memberKey = `xau_capital_${currentMember.id}`;
    const saved = safeLocalStorage.getItem(memberKey);
    return saved ? parseFloat(saved) : 0;
  });

  const [capitalHistory, setCapitalHistory] = useState<CapitalEntry[]>(() => {
    const historyKey = `xau_capital_history_${currentMember.id}`;
    const saved = safeLocalStorage.getItem(historyKey);
    return saved ? JSON.parse(saved) : [];
  });

  // ── Data loading ──────────────────────────────────────────────────────────
  useEffect(() => {
    (async () => {
      let online = false;
      try {
        const ping = await apiFetch(API_STRATEGIES);
        if (ping.ok) online = true;
      } catch {}

      // TRADES
      const localTradesStr = safeLocalStorage.getItem('xau_trades');
      let localTrades: Trade[] = [];
      if (localTradesStr) { try { localTrades = JSON.parse(localTradesStr); } catch {} }

      if (online) {
        let backendTrades: Trade[] = [];
        try {
          const r = await apiFetch(`${API_TRADES}?page=${tradesPage}&limit=${PAGE_SIZE}`);
          if (r.ok) {
            const response = await r.json();
            backendTrades = response.data;
            setTradesTotal(response.total);
          }
        } catch {}

        // Always keep local data as primary if backend fails or is empty
        if (localTrades.length > 0) {
          setTrades(localTrades);
          if (localTrades.length > 0) setSelectedTrade(localTrades[0]);
          // Try to sync in background without blocking - only merge if backend has data
          (async () => {
            if (backendTrades.length > 0) {
              const syncedTrades = [...backendTrades];
              const failedSync: Trade[] = [];
              for (const localTrade of localTrades) {
                try {
                  const { id, createdAt, analyseMentor, ...dto } = localTrade;
                  const r = await apiFetch(API_TRADES, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(dto) });
                  if (r.ok) syncedTrades.push(await r.json()); else failedSync.push(localTrade);
                } catch { failedSync.push(localTrade); }
              }
              if (failedSync.length > 0) safeLocalStorage.setItem('xau_trades', JSON.stringify(failedSync)); else safeLocalStorage.removeItem('xau_trades');
              const sorted = syncedTrades.sort((a, b) => new Date(b.createdAt || '').getTime() - new Date(a.createdAt || '').getTime());
              setTrades(sorted);
            }
          })();
        } else {
          setTrades(backendTrades);
          if (backendTrades.length > 0) setSelectedTrade(backendTrades[0]);
        }
      } else {
        setTrades(localTrades);
        if (localTrades.length > 0) setSelectedTrade(localTrades[0]);
      }
      setLoadingTrades(false);

      // CONSEILS
      const localConseilsStr = safeLocalStorage.getItem('xau_conseils');
      let localConseils: Conseil[] = [];
      if (localConseilsStr) { try { localConseils = JSON.parse(localConseilsStr); } catch {} }

      if (online) {
        let backendConseils: Conseil[] = [];
        try {
          const r = await apiFetch(`${API_CONSEILS}?page=${conseilsPage}&limit=${PAGE_SIZE}`);
          if (r.ok) {
            const response = await r.json();
            backendConseils = response.data;
            setConseilsTotal(response.total);
          }
        } catch {}
        // Always keep local data as primary if backend fails or is empty
        if (localConseils.length > 0) {
          setConseils(localConseils);
          if (localConseils.length > 0) setLastAddedConseil(localConseils[0]);
          // Try to sync in background without blocking - only merge if backend has data
          (async () => {
            if (backendConseils.length > 0) {
              const syncedConseils = [...backendConseils];
              const failedSync: Conseil[] = [];
              for (const lc of localConseils) {
                try {
                  const { id, createdAt, simplifiedText, ...dto } = lc;
                  const r = await apiFetch(API_CONSEILS, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(dto) });
                  if (r.ok) syncedConseils.push(await r.json()); else failedSync.push(lc);
                } catch { failedSync.push(lc); }
              }
              if (failedSync.length > 0) safeLocalStorage.setItem('xau_conseils', JSON.stringify(failedSync)); else safeLocalStorage.removeItem('xau_conseils');
              const sorted = syncedConseils.sort((a, b) => new Date(b.createdAt || '').getTime() - new Date(a.createdAt || '').getTime());
              setConseils(sorted);
            }
          })();
        } else {
          setConseils(backendConseils);
          if (backendConseils.length > 0) setLastAddedConseil(backendConseils[0]);
        }
        setLoadingConseils(false);
      } else {
        setConseils(localConseils);
        if (localConseils.length > 0) setLastAddedConseil(localConseils[0]);
        setLoadingConseils(false);
      }

      // STRATEGIES
      const localStrategiesStr = safeLocalStorage.getItem('xau_strategies');
      let localStrategies: Strategy[] = [];
      if (localStrategiesStr) { try { localStrategies = JSON.parse(localStrategiesStr); } catch {} }

      if (online) {
        let backendStrategies: Strategy[] = [];
        try {
          const r = await apiFetch(`${API_STRATEGIES}?page=${strategiesPage}&limit=${PAGE_SIZE}`);
          if (r.ok) {
            const response = await r.json();
            backendStrategies = response.data;
            setStrategiesTotal(response.total);
          }
        } catch {}
        // Always keep local data as primary if backend fails or is empty
        if (localStrategies.length > 0) {
          setStrategies(localStrategies);
          // Try to sync in background without blocking - only merge if backend has data
          (async () => {
            if (backendStrategies.length > 0) {
              const syncedStrats = [...backendStrategies];
              const failedSync: Strategy[] = [];
              const customStrategies = localStrategies.filter(s => !s.id?.startsWith('strat-'));
              for (const ls of customStrategies) {
                try {
                  const { id, createdAt, ...dto } = ls;
                  const r = await apiFetch(API_STRATEGIES, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(dto) });
                  if (r.ok) syncedStrats.push(await r.json()); else failedSync.push(ls);
                } catch { failedSync.push(ls); }
              }
              if (failedSync.length > 0) safeLocalStorage.setItem('xau_strategies', JSON.stringify(failedSync)); else safeLocalStorage.removeItem('xau_strategies');
              setStrategies(syncedStrats.sort((a, b) => new Date(b.createdAt || '').getTime() - new Date(a.createdAt || '').getTime()));
            }
          })();
        } else {
          setStrategies(backendStrategies);
        }
        setLoadingStrategies(false);
      } else {
        if (localStrategies.length > 0) { setStrategies(localStrategies); } else { setStrategies(DEFAULT_STRATEGIES); safeLocalStorage.setItem('xau_strategies', JSON.stringify(DEFAULT_STRATEGIES)); }
        setLoadingStrategies(false);
      }

      setBackendOnline(online);
    })();
  }, [currentMember]);

  const todayStr = new Date().toDateString();
  const todayPnL = trades.filter(t => t.createdAt && new Date(t.createdAt).toDateString() === todayStr).reduce((sum, t) => sum + (typeof t.resultat === 'number' ? t.resultat : 0), 0);
  const handleSetDailyGoal = (val: number) => { setDailyGoal(val); safeLocalStorage.setItem('xau_daily_goal', val.toString()); };

  // ── Trade handlers ──────────────────────────────────────────────────────
  const handleAddTrade = async (data: Omit<Trade, 'id' | 'createdAt' | 'analyseMentor'>) => {
    if (backendOnline) {
      try {
        const r = await apiFetch(API_TRADES, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
        if (r.ok) { const saved: Trade = await r.json(); setTrades(prev => [saved, ...prev]); setSelectedTrade(saved); return; }
      } catch {}
    }
    const local: Trade = { id: Math.random().toString(36).substring(2, 9), ...data, analyseMentor: localAnalysis(data), createdAt: (data as any).createdAt || new Date().toISOString() };
    setTrades(prev => { const u = [local, ...prev]; safeLocalStorage.setItem('xau_trades', JSON.stringify(u)); return u; });
    setSelectedTrade(local);
  };

  const handleUpdateTrade = async (id: string, updates: Partial<Trade>) => {
    if (backendOnline) {
      try {
        const r = await apiFetch(`${API_TRADES}/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(updates) });
        if (r.ok) { const updated: Trade = await r.json(); setTrades(prev => prev.map(t => t.id === id ? updated : t)); setSelectedTrade(prev => prev?.id === id ? updated : prev); return; }
      } catch {}
    }
    setTrades(prev => { const u = prev.map(t => t.id === id ? { ...t, ...updates } : t); safeLocalStorage.setItem('xau_trades', JSON.stringify(u)); return u; });
    setSelectedTrade(prev => prev?.id === id ? { ...prev, ...updates } : prev);
  };

  const handleDeleteTrade = async (id: string) => {
    if (backendOnline) { try { await apiFetch(`${API_TRADES}/${id}`, { method: 'DELETE' }); } catch {} }
    setTrades(prev => { const u = prev.filter(t => t.id !== id); safeLocalStorage.setItem('xau_trades', JSON.stringify(u)); return u; });
    setSelectedTrade(prev => prev?.id === id ? (trades.find(t => t.id !== id) || null) : prev);
  };

  // ── Conseil handlers ────────────────────────────────────────────────────
  const handleAddConseil = async (data: Omit<Conseil, 'id' | 'createdAt' | 'simplifiedText'>) => {
    if (backendOnline) {
      try {
        const r = await apiFetch(API_CONSEILS, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
        if (r.ok) { const saved: Conseil = await r.json(); setConseils(prev => [saved, ...prev]); setLastAddedConseil(saved); return; }
      } catch {}
    }
    const local: Conseil = { id: Math.random().toString(36).substring(2, 9), ...data, simplifiedText: localSimplify(data.rawText), createdAt: new Date().toISOString() };
    setConseils(prev => { const u = [local, ...prev]; safeLocalStorage.setItem('xau_conseils', JSON.stringify(u)); return u; });
    setLastAddedConseil(local);
  };

  const handleUpdateConseil = async (id: string, updates: { rawText: string; categorie: 'Psychologie' | 'Stratégie' }) => {
    if (backendOnline) {
      try {
        const r = await apiFetch(`${API_CONSEILS}/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(updates) });
        if (r.ok) { const updated: Conseil = await r.json(); setConseils(prev => prev.map(c => c.id === id ? updated : c)); if (lastAddedConseil?.id === id) setLastAddedConseil(updated); return; }
      } catch {}
    }
    const newSimplified = localSimplify(updates.rawText);
    const updatedLocal = { rawText: updates.rawText, categorie: updates.categorie, simplifiedText: newSimplified };
    setConseils(prev => { const u = prev.map(c => c.id === id ? { ...c, ...updatedLocal } : c); safeLocalStorage.setItem('xau_conseils', JSON.stringify(u)); return u; });
    if (lastAddedConseil?.id === id) setLastAddedConseil(prev => prev ? { ...prev, ...updatedLocal } : null);
  };

  const handleDeleteConseil = async (id: string) => {
    if (backendOnline) { try { await apiFetch(`${API_CONSEILS}/${id}`, { method: 'DELETE' }); } catch {} }
    setConseils(prev => { const u = prev.filter(c => c.id !== id); safeLocalStorage.setItem('xau_conseils', JSON.stringify(u)); return u; });
    if (lastAddedConseil?.id === id) setLastAddedConseil(null);
  };

  // ── Strategy handlers ───────────────────────────────────────────────────
  const handleAddStrategy = async (data: Omit<Strategy, 'id' | 'createdAt'>) => {
    if (backendOnline) {
      try {
        const r = await apiFetch(API_STRATEGIES, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
        if (r.ok) { const saved: Strategy = await r.json(); setStrategies(prev => [saved, ...prev]); return; }
      } catch {}
    }
    const local: Strategy = { id: Math.random().toString(36).substring(2, 9), ...data, createdAt: new Date().toISOString() };
    setStrategies(prev => { const u = [local, ...prev]; safeLocalStorage.setItem('xau_strategies', JSON.stringify(u)); return u; });
  };

  const handleDeleteStrategy = async (id: string) => {
    if (backendOnline) { try { await apiFetch(`${API_STRATEGIES}/${id}`, { method: 'DELETE' }); } catch {} }
    setStrategies(prev => { const u = prev.filter(s => s.id !== id); safeLocalStorage.setItem('xau_strategies', JSON.stringify(u)); return u; });
  };

  const handleUpdateCapital = (newCapital: number, entryDetails: Omit<CapitalEntry, 'id' | 'date' | 'balanceApres'>) => {
    const entry: CapitalEntry = { id: Math.random().toString(36).substring(2, 9), date: new Date().toISOString(), balanceApres: newCapital, ...entryDetails };
    const updatedHistory = [entry, ...capitalHistory];
    setCapital(newCapital); setCapitalHistory(updatedHistory);
    safeLocalStorage.setItem(`xau_capital_${currentMember.id}`, newCapital.toString());
    safeLocalStorage.setItem(`xau_capital_history_${currentMember.id}`, JSON.stringify(updatedHistory));
  };

  const handleDeleteCapitalEntry = (id: string) => {
    const updatedHistory = capitalHistory.filter(e => e.id !== id);
    let runningBalance = 0;
    [...updatedHistory].reverse().forEach(e => {
      if (e.type === 'depot') runningBalance += e.montant;
      else if (e.type === 'retrait') runningBalance -= e.montant;
      else if (e.type === 'ajustement') runningBalance = e.balanceApres;
      e.balanceApres = runningBalance;
    });
    const newCapital = updatedHistory.length > 0 ? updatedHistory[0].balanceApres : 0;
    setCapital(newCapital); setCapitalHistory(updatedHistory);
    safeLocalStorage.setItem(`xau_capital_${currentMember.id}`, newCapital.toString());
    safeLocalStorage.setItem(`xau_capital_history_${currentMember.id}`, JSON.stringify(updatedHistory));
  };

  return (
    <div className="app-root">
      {/* Mobile menu toggle */}
      <button 
        className="mobile-menu-toggle"
        onClick={toggleMobileMenu}
        aria-label="Toggle menu"
        style={{
          display: 'flex',
          position: 'fixed',
          top: '1rem',
          left: '1rem',
          zIndex: 9999,
          background: 'rgba(10, 12, 20, 0.95)',
          backdropFilter: 'blur(10px)',
          border: '2px solid #d4a037',
          color: '#ffffff',
          borderRadius: '12px',
          padding: '0.75rem',
          cursor: 'pointer',
          minWidth: '48px',
          minHeight: '48px',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        <Menu size={28} color="#ffffff" />
      </button>

      {/* Mobile overlay */}
      <div 
        className={`mobile-sidebar-overlay ${mobileMenuOpen ? 'active' : ''}`}
        onClick={closeMobileMenu}
      />

      <MemberSidebar
        activePage={activePage}
        onNavigate={(page) => {
          setActivePage(page);
          closeMobileMenu();
        }}
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(v => !v)}
        tradeCount={trades.length}
        conseilCount={conseils.length}
        strategyCount={strategies.length}
        backendOnline={backendOnline}
        currentMember={currentMember}
        onLogout={onLogout}
        mobileOpen={mobileMenuOpen}
      />

      <div className={`main-area ${sidebarCollapsed ? 'collapsed' : ''}`}>
        <Header
          activePage={activePage as any}
          onAddTrade={() => setActivePage('journal')}
          dailyGoal={dailyGoal}
          todayPnL={todayPnL}
          onSetDailyGoal={handleSetDailyGoal}
          currentMember={currentMember}
        />

        <main className="page-content">
          {activePage === 'member-dashboard' && (
            <MemberDashboardPage trades={trades} capital={capital} currentMember={currentMember} />
          )}
          {activePage === 'journal' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
              <StatsDashboard trades={trades} />
              <TradeForm onAddTrade={handleAddTrade} strategies={strategies} />
              <CoachingPanel trade={selectedTrade} onDeleteTrade={handleDeleteTrade} onEditTrade={setEditingTrade} />
            </div>
          )}
          {activePage === 'tradesList' && (
            <TradesListPage trades={trades} onEditTrade={setEditingTrade} onDeleteTrade={handleDeleteTrade} onSelectTrade={setCoachingModalTrade} />
          )}
          {activePage === 'strategy' && (
            <StrategyPage strategies={strategies} onAddStrategy={handleAddStrategy} onDeleteStrategy={handleDeleteStrategy} loading={loadingStrategies} />
          )}
          {activePage === 'conseils' && (
            <ConseilsTab onAddConseil={handleAddConseil} lastAddedConseil={lastAddedConseil} />
          )}
          {activePage === 'conseilsList' && (
            <ConseilsListPage conseils={conseils} onEditConseil={setEditingConseil} onDeleteConseil={handleDeleteConseil} loading={loadingConseils} />
          )}
          {activePage === 'stats' && (
            <StatsPage trades={trades} capital={capital} />
          )}
          {activePage === 'calculator' && (
            <CalculatorPage capital={capital} />
          )}
          {activePage === 'capital' && (
            <CapitalPage capital={capital} capitalHistory={capitalHistory} onUpdateCapital={handleUpdateCapital} onDeleteEntry={handleDeleteCapitalEntry} />
          )}
          {activePage === 'member-profile' && (
            <MemberProfilePage 
              currentMember={currentMember} 
              onUpdateMember={(updates) => {
                const updatedMember = { ...currentMember, ...updates };
                if (onUpdateMember) {
                  onUpdateMember(updatedMember);
                }
                safeLocalStorage.setItem('xau_member', JSON.stringify(updatedMember));
              }}
            />
          )}
        </main>
      </div>

      {/* Modals */}
      {editingTrade && (
        <EditTradeModal trade={editingTrade} onClose={() => setEditingTrade(null)} onSave={handleUpdateTrade} strategies={strategies} />
      )}
      {editingConseil && (
        <EditConseilModal conseil={editingConseil} onClose={() => setEditingConseil(null)} onSave={handleUpdateConseil} />
      )}
      {coachingModalTrade && (
        <div className="modal-overlay" onClick={() => setCoachingModalTrade(null)} style={{ alignItems: 'flex-start', paddingTop: '2rem' }}>
          <div className="modal-dialog" style={{ maxWidth: '760px', maxHeight: '90vh', overflow: 'hidden', display: 'flex', flexDirection: 'column' }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title">🧠 Audit &amp; Mentorat — {coachingModalTrade.actif}</div>
              <button className="modal-close-btn" onClick={() => setCoachingModalTrade(null)} title="Fermer"><X size={18} /></button>
            </div>
            <div style={{ overflowY: 'auto', flex: 1 }}>
              <CoachingPanel trade={coachingModalTrade} onDeleteTrade={async (id: string) => { await handleDeleteTrade(id); setCoachingModalTrade(null); }} onEditTrade={(t: Trade) => { setEditingTrade(t); setCoachingModalTrade(null); }} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
