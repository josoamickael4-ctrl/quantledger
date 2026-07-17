/**
 * Script de test de performance
 * Simule 1000 membres avec beaucoup d'actions
 */

const axios = require('axios');

const API_URL = 'http://localhost:3000';
const ADMIN_CODE = 'DF204501-C189-43DE-9CC1-18D96A9481E2';

// Configuration axios avec header admin
const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'x-member-role': 'admin'
  }
});

// Configuration du test (séquentiel pour éviter de surcharger le backend)
const CONFIG = {
  memberCount: 1000,  // 1000 membres
  tradesPerMember: 20,  // 20 trades par membre
  strategiesPerMember: 2,  // 2 stratégies par membre
  conseilsPerMember: 1,  // 1 conseil par membre
  concurrentRequests: 5  // 5 requêtes concurrentes
};

// Métriques
const metrics = {
  totalMembers: 0,
  totalTrades: 0,
  totalStrategies: 0,
  totalConseils: 0,
  errors: 0,
  startTime: null,
  endTime: null,
  responseTimes: []
};

// Données de test
const ASSETS = ['XAU/USD', 'EUR/USD', 'GBP/USD', 'USD/JPY', 'BTC/USD'];
const POSITIONS = ['Achat', 'Vente'];
const SESSIONS = ['Asie', 'Londres', 'New York', 'Overlap'];
const TIMEFRAMES = ['M1', 'M5', 'M15', 'H1', 'H4', 'D1'];
const EMOTIONS = ['Calme / Serein', 'Confiant', 'Hésitant', 'Grisé / Excité', 'Frustré'];
const STRATEGY_NAMES = ['Breakout London', 'Trend Following', 'Scalping Asie', 'Reversal NY', 'Overlap Setup'];

// Fonction utilitaire pour délai
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Fonction pour mesurer le temps de réponse
async function measureTime(fn) {
  const start = Date.now();
  try {
    const result = await fn();
    const end = Date.now();
    metrics.responseTimes.push(end - start);
    return result;
  } catch (error) {
    const end = Date.now();
    metrics.responseTimes.push(end - start);
    metrics.errors++;
    throw error;
  }
}

// Créer un membre
async function createMember(index) {
  const memberData = {
    fullName: `Test Member ${index}`,
    email: `test${index}@example.com`,
    role: 'member',
    accessCode: ADMIN_CODE
  };

  try {
    const response = await measureTime(() =>
      apiClient.post('/members', memberData)
    );
    metrics.totalMembers++;
    console.log(`✓ Membre ${index} créé (${response.data.id})`);
    return response.data;
  } catch (error) {
    console.error(`✗ Erreur création membre ${index}:`, error.message);
    throw error;
  }
}

// Créer un trade pour un membre
async function createTrade(memberId, memberIndex, tradeIndex) {
  const tradeData = {
    memberId,
    actif: ASSETS[Math.floor(Math.random() * ASSETS.length)],
    position: POSITIONS[Math.floor(Math.random() * POSITIONS.length)],
    prixEntree: 2000 + Math.random() * 100,
    stopLoss: 1990 + Math.random() * 5,
    takeProfit: 2020 + Math.random() * 10,
    prixSortie: 1995 + Math.random() * 30,
    resultat: (Math.random() - 0.5) * 500,
    contexte: `Trade test ${tradeIndex} pour membre ${memberIndex}`,
    emotion: EMOTIONS[Math.floor(Math.random() * EMOTIONS.length)],
    lots: 0.1 + Math.random() * 0.9,
    session: SESSIONS[Math.floor(Math.random() * SESSIONS.length)],
    timeframe: TIMEFRAMES[Math.floor(Math.random() * TIMEFRAMES.length)],
    createdAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString()
  };

  try {
    const response = await measureTime(() =>
      apiClient.post('/trades', tradeData)
    );
    metrics.totalTrades++;
    if (tradeIndex % 10 === 0) {
      console.log(`  ✓ Trade ${tradeIndex} créé pour membre ${memberIndex}`);
    }
    return response.data;
  } catch (error) {
    console.error(`  ✗ Erreur création trade ${tradeIndex}:`, error.message);
    throw error;
  }
}

// Créer une stratégie pour un membre
async function createStrategy(memberId, memberIndex, strategyIndex) {
  const strategyData = {
    memberId,
    name: `${STRATEGY_NAMES[Math.floor(Math.random() * STRATEGY_NAMES.length)]} ${strategyIndex}`,
    actif: ASSETS[Math.floor(Math.random() * ASSETS.length)],
    rules: [
      'Règle 1: Condition d\'entrée',
      'Règle 2: Gestion du risque',
      'Règle 3: Confirmation tendance'
    ],
    riskPercent: 1 + Math.random() * 2,
    targetRR: 1.5 + Math.random() * 1.5,
    description: `Stratégie de test ${strategyIndex}`
  };

  try {
    const response = await measureTime(() =>
      apiClient.post('/strategies', strategyData)
    );
    metrics.totalStrategies++;
    return response.data;
  } catch (error) {
    console.error(`  ✗ Erreur création stratégie ${strategyIndex}:`, error.message);
    throw error;
  }
}

// Créer un conseil pour un membre
async function createConseil(memberId, memberIndex, conseilIndex) {
  const conseilData = {
    memberId,
    title: `Conseil trading ${conseilIndex}`,
    content: `Ceci est un conseil de test ${conseilIndex} pour le membre ${memberIndex}. Important pour améliorer la discipline.`,
    category: 'Discipline'
  };

  try {
    const response = await measureTime(() =>
      apiClient.post('/conseils', conseilData)
    );
    metrics.totalConseils++;
    return response.data;
  } catch (error) {
    console.error(`  ✗ Erreur création conseil ${conseilIndex}:`, error.message);
    throw error;
  }
}

// Créer toutes les données pour un membre
async function createMemberData(memberId, memberIndex) {
  console.log(`\n--- Création données pour membre ${memberIndex} ---`);

  // Créer les stratégies
  for (let i = 0; i < CONFIG.strategiesPerMember; i++) {
    try {
      await createStrategy(memberId, memberIndex, i);
    } catch (error) {
      // Continuer même si erreur
    }
  }

  // Créer les trades
  for (let i = 0; i < CONFIG.tradesPerMember; i++) {
    try {
      await createTrade(memberId, memberIndex, i);
    } catch (error) {
      // Continuer même si erreur
    }
  }

  // Créer les conseils
  for (let i = 0; i < CONFIG.conseilsPerMember; i++) {
    try {
      await createConseil(memberId, memberIndex, i);
    } catch (error) {
      // Continuer même si erreur
    }
  }
}

// Exécuter le test de performance
async function runPerformanceTest() {
  console.log('=== DÉBUT DU TEST DE PERFORMANCE ===');
  console.log(`Configuration: ${CONFIG.memberCount} membres, ${CONFIG.tradesPerMember} trades/membre`);
  console.log(`URL API: ${API_URL}\n`);

  metrics.startTime = Date.now();

  // Créer les membres en parallèle par lots
  const batchSize = CONFIG.concurrentRequests;
  const members = [];

  for (let i = 0; i < CONFIG.memberCount; i += batchSize) {
    const batch = [];
    const endIndex = Math.min(i + batchSize, CONFIG.memberCount);

    for (let j = i; j < endIndex; j++) {
      batch.push(createMember(j + 1));
    }

    try {
      const batchResults = await Promise.all(batch);
      members.push(...batchResults);
    } catch (error) {
      console.error(`Erreur batch ${i}-${endIndex}:`, error.message);
    }

    // Petit délai entre les batches
    await delay(100);
  }

  console.log(`\n✓ ${members.length} membres créés`);

  // Créer les données pour chaque membre en parallèle
  console.log('\n--- Création des données (trades, stratégies, conseils) ---');

  const dataCreationPromises = members.map((member, index) =>
    createMemberData(member.id, index + 1)
  );

  await Promise.all(dataCreationPromises);

  metrics.endTime = Date.now();

  // Afficher les résultats
  printResults();
}

// Afficher les résultats
function printResults() {
  const duration = (metrics.endTime - metrics.startTime) / 1000;
  const avgResponseTime = metrics.responseTimes.length > 0
    ? metrics.responseTimes.reduce((a, b) => a + b, 0) / metrics.responseTimes.length
    : 0;
  const maxResponseTime = metrics.responseTimes.length > 0
    ? Math.max(...metrics.responseTimes)
    : 0;
  const minResponseTime = metrics.responseTimes.length > 0
    ? Math.min(...metrics.responseTimes)
    : 0;

  console.log('\n=== RÉSULTATS DU TEST DE PERFORMANCE ===\n');
  console.log(`Durée totale: ${duration.toFixed(2)} secondes`);
  console.log(`Membres créés: ${metrics.totalMembers}`);
  console.log(`Trades créés: ${metrics.totalTrades}`);
  console.log(`Stratégies créées: ${metrics.totalStrategies}`);
  console.log(`Conseils créés: ${metrics.totalConseils}`);
  console.log(`Erreurs: ${metrics.errors}`);
  console.log(`\nTemps de réponse moyen: ${avgResponseTime.toFixed(2)} ms`);
  console.log(`Temps de réponse min: ${minResponseTime.toFixed(2)} ms`);
  console.log(`Temps de réponse max: ${maxResponseTime.toFixed(2)} ms`);
  console.log(`\nRequêtes/seconde: ${((metrics.totalMembers + metrics.totalTrades + metrics.totalStrategies + metrics.totalConseils) / duration).toFixed(2)}`);
  console.log(`\n=== FIN DU TEST ===`);
}

// Vérifier si l'API est accessible
async function checkApiHealth() {
  try {
    // Essayer de récupérer les membres existants
    await apiClient.get('/members');
    console.log('✓ API accessible\n');
    return true;
  } catch (error) {
    console.error('✗ API non accessible. Assurez-vous que le backend est démarré sur', API_URL);
    console.error('Erreur:', error.message);
    return false;
  }
}

// Point d'entrée
async function main() {
  console.log('Vérification de l\'accessibilité de l\'API...');
  const isHealthy = await checkApiHealth();
  if (!isHealthy) {
    console.log('\nConseils:');
    console.log('- Assurez-vous que le backend est démarré: npm run start:dev');
    console.log('- Vérifiez que le backend tourne sur http://localhost:3000');
    process.exit(1);
  }

  try {
    await runPerformanceTest();
  } catch (error) {
    console.error('Erreur lors du test:', error);
    process.exit(1);
  }
}

main();
