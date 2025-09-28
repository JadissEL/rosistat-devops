# 🎰 RoSiStrat - Documentation Technique Complète

## 📋 Table des Matières

1. [Vue d'ensemble du Projet](#vue-densemble-du-projet)
2. [Architecture Technique](#architecture-technique)
3. [Fonctionnalités Détaillées](#fonctionnalités-détaillées)
4. [Stratégies de Roulette](#stratégies-de-roulette)
5. [Composants UI](#composants-ui)
6. [Système d'Authentification](#système-dauthentification)
7. [Services et Utilitaires](#services-et-utilitaires)
8. [Configuration et Déploiement](#configuration-et-déploiement)
9. [Structure des Fichiers](#structure-des-fichiers)
10. [API et Interfaces](#api-et-interfaces)

---

## 🎯 Vue d'ensemble du Projet

**RoSiStrat** est une plateforme éducative avancée de simulation de stratégies de roulette européenne, développée par **Jadiss EL ANTAKI**. Cette application permet aux utilisateurs d'explorer et d'analyser différentes stratégies de paris sans risque financier réel.

### 🎨 Caractéristiques Principales

- **Simulation Multi-Stratégies** : 6 stratégies sophistiquées de roulette
- **Interface Multi-Devices** : Responsive design avec support PWA
- **Authentification Robuste** : Firebase Auth avec mode démo
- **Analytics Avancés** : Visualisations et statistiques détaillées
- **Support Multi-Monnaies** : 9 devises internationales
- **Mode Hors-Ligne** : Fonctionnement sans connexion internet

### 🎯 Objectifs Éducatifs

- Enseigner la théorie des probabilités
- Démontrer les réalités mathématiques des systèmes de paris
- Promouvoir la sensibilisation au jeu responsable
- Fournir un environnement sûr pour l'expérimentation

---

## 🏗️ Architecture Technique

### Stack Technologique

```typescript
Frontend Framework: React 18 + TypeScript
Build Tool: Vite 6.2.2
Styling: Tailwind CSS 3.4.11
UI Components: Radix UI + shadcn/ui
State Management: React Context + React Query
Authentication: Firebase Auth
Database: Firestore
Charts: Recharts 2.12.7
Icons: Lucide React 0.462.0
Testing: Vitest 3.1.4
```

### Architecture des Composants

```
src/
├── components/           # Composants réutilisables
│   ├── ui/              # Bibliothèque de composants UI
│   ├── auth/            # Composants d'authentification
│   ├── simulation/      # Composants de simulation
│   ├── privacy/         # Composants de confidentialité
│   └── user/            # Composants utilisateur
├── contexts/            # Contextes React
├── hooks/               # Hooks personnalisés
├── lib/                 # Utilitaires et configurations
├── pages/               # Pages de l'application
├── services/            # Services métier
└── utils/               # Utilitaires généraux
```

### Patterns Architecturaux

1. **Context Pattern** : Gestion d'état globale (Auth, Cookies)
2. **Service Layer** : Abstraction des données (SimulationService)
3. **Component Composition** : Composants modulaires et réutilisables
4. **Custom Hooks** : Logique métier réutilisable
5. **Type Safety** : TypeScript strict avec interfaces détaillées

---

## 🎮 Fonctionnalités Détaillées

### 1. Système de Simulation

#### Configuration de Base
```typescript
interface SimulationConfig {
  startingInvestment: number;    // Montant initial (1,000 - 1,000,000)
  currency: string;              // Devise sélectionnée
  strategy: StrategyType;        // Stratégie choisie
  spinCount: number;            // Nombre de tours (500 par défaut)
  safetyRatio?: number;         // Ratio de sécurité (SAM+)
}
```

#### Générateur de Nombres Aléatoires
```typescript
// Générateur avec seed pour résultats reproductibles
export function generateFixedSpins(count: number = 300, seed?: number): number[] {
  let random = seed ? seedRandom(seed) : Math.random;
  const spins: number[] = [];
  for (let i = 0; i < count; i++) {
    spins.push(Math.floor(random() * 37)); // 0-36
  }
  return spins;
}
```

### 2. Interface Utilisateur

#### Design System
- **Thème Sombre** : Interface moderne avec dégradés
- **Responsive Design** : Mobile-first approach
- **Accessibilité** : Support ARIA et navigation clavier
- **Animations** : Transitions fluides avec Framer Motion

#### Composants Principaux
- **Dashboard** : Vue d'ensemble des simulations
- **Charts** : Visualisations Recharts
- **Tables** : Données tabulaires avec tri
- **Modals** : Explications détaillées des stratégies

### 3. Système Multi-Devises

```typescript
const CURRENCIES: Currency[] = [
  { code: "USD", symbol: "$", name: "US Dollar", flag: "🇺🇸" },
  { code: "EUR", symbol: "€", name: "Euro", flag: "🇪🇺" },
  { code: "GBP", symbol: "£", name: "British Pound", flag: "🇬🇧" },
  { code: "AED", symbol: "د.إ", name: "UAE Dirham", flag: "🇦🇪" },
  { code: "SAR", symbol: "﷼", name: "Saudi Riyal", flag: "🇸🇦" },
  { code: "MAD", symbol: "د.م.", name: "Moroccan Dirham", flag: "🇲🇦" },
  { code: "JPY", symbol: "¥", name: "Japanese Yen", flag: "🇯🇵" },
  { code: "CHF", symbol: "CHF", name: "Swiss Franc", flag: "🇨🇭" },
  { code: "CAD", symbol: "C$", name: "Canadian Dollar", flag: "🇨🇦" },
];
```

---

## 🎲 Stratégies de Roulette

### 1. Compound Martingale (Martingale Composé)

**Complexité** : Intermédiaire | **Risque** : Élevé

```typescript
interface CompoundMartingaleConfig {
  strategies: [
    { target: 0, betType: "single", payout: 35 },
    { target: "1st_dozen", betType: "dozen", payout: 2 },
    { target: "2nd_dozen", betType: "dozen", payout: 2 },
    { target: "black", betType: "color", payout: 1 },
    { target: "even", betType: "even_odd", payout: 1 }
  ];
  progression: "martingale";
  resetOnWin: true;
}
```

**Mécanisme** :
- 5 paris simultanés sur différents paramètres
- Doublement des mises après chaque perte
- Reset complet après toute victoire
- Couverture maximale de la table

### 2. Max Lose Strategy (Stratégie Perte Maximale)

**Complexité** : Débutant | **Risque** : Moyen

```typescript
interface MaxLoseState {
  currentBet: number;
  consecutiveLosses: number;
  maxLosses: 5;
  bonusOnZero: true;
}
```

**Mécanisme** :
- Reset automatique après 5 pertes consécutives
- Bonus spécial sur le zéro
- Protection intégrée contre les séries longues

### 3. Zapping Strategy (Stratégie Zapping)

**Complexité** : Intermédiaire | **Risque** : Moyen-Élevé

```typescript
interface ZappingState {
  currentColor: "red" | "black";
  currentBet: number;
  lastResult: "win" | "loss";
}
```

**Mécanisme** :
- Alternance dynamique Rouge/Noir
- Doublement et changement de couleur après perte
- Stratégie adaptative basée sur les résultats

### 4. Safe Compound Martingale (Martingale Composé Sécurisé)

**Complexité** : Intermédiaire | **Risque** : Faible-Moyen

```typescript
interface SafeCompoundConfig {
  safetyRatio: 5 | 6 | 8 | 10;
  pauseThreshold: number;
  resumeThreshold: number;
}
```

**Mécanisme** :
- Pause automatique si portefeuille < ratio × mise suivante
- Reprise quand portefeuille se rétablit
- Protection maximale du capital

### 5. SAM+ (Smart Adaptive Martingale Plus)

**Complexité** : Avancé | **Risque** : Élevé

```typescript
interface SAMPlusConfig {
  kellyCriterion: boolean;
  markovSwitching: boolean;
  dynamicRiskManagement: boolean;
  realTimeOptimization: boolean;
}
```

**Mécanisme** :
- Calcul optimal des mises (critère de Kelly)
- Gestion dynamique du risque
- Commutation Markov pour sélection intelligente
- Adaptation en temps réel

### 6. Standard Martingale (Martingale Standard)

**Complexité** : Débutant | **Risque** : Élevé

```typescript
interface StandardMartingaleConfig {
  target: "red";
  progression: "martingale";
  resetOnWin: true;
}
```

**Mécanisme** :
- Pari exclusif sur Rouge
- Doublement classique après perte
- Reset après victoire
- Martingale pur et simple

---

## 🧩 Composants UI

### 1. Composants de Simulation

#### `StartingInvestmentInput`
```typescript
interface StartingInvestmentInputProps {
  value: number;
  onChange: (amount: number) => void;
  selectedCurrency: string;
  disabled?: boolean;
}
```

**Fonctionnalités** :
- Validation des montants (1,000 - 1,000,000)
- Presets rapides (5K, 10K, 25K, 50K, 100K)
- Sauvegarde automatique (local/cloud)
- Formatage multi-devises

#### `CurrencySelector`
```typescript
interface CurrencySelectorProps {
  selectedCurrency: string;
  onCurrencyChange: (currency: string) => void;
}
```

**Fonctionnalités** :
- Sélection visuelle avec drapeaux
- Formatage automatique des montants
- Persistance des préférences

#### `StrategyExplanationModal`
```typescript
interface StrategyExplanationModalProps {
  strategy: StrategyType;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}
```

**Fonctionnalités** :
- Explications détaillées de chaque stratégie
- Niveaux de risque et complexité
- Avantages et inconvénients
- Facteurs de risque

### 2. Composants d'Authentification

#### `AuthDialog`
```typescript
interface AuthDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: "signin" | "signup" | "reset";
}
```

**Fonctionnalités** :
- Connexion/Inscription Firebase
- Mode démo pour environnements restreints
- Validation des formulaires
- Gestion des erreurs

### 3. Composants de Confidentialité

#### `CookieConsentBanner`
```typescript
interface CookieConsentBannerProps {
  onAcceptAll: () => void;
  onAcceptNecessary: () => void;
  onCustomize: () => void;
}
```

**Fonctionnalités** :
- Conformité RGPD
- Cookies essentiels vs analytiques
- Persistance des préférences
- Interface de personnalisation

#### `AgeVerificationModal`
```typescript
interface AgeVerificationModalProps {
  onConfirm: () => void;
  onReject: () => void;
}
```

**Fonctionnalités** :
- Vérification d'âge obligatoire
- Conformité légale
- Blocage des mineurs

---

## 🔐 Système d'Authentification

### Architecture d'Authentification

```typescript
interface AuthContextType {
  currentUser: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
  signUp: (email: string, password: string, displayName: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updateUserProfile: (updates: Partial<UserProfile>) => Promise<void>;
  updateStartingInvestment: (amount: number) => Promise<void>;
}
```

### Profil Utilisateur

```typescript
interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  startingInvestment: number;
  createdAt: Date;
  lastLoginAt: Date;
}
```

### Mode Démo et Fallback

```typescript
class AuthFallback {
  static createDemoUser(email: string, displayName: string): MockUser;
  static getDemoUser(): MockUser | null;
  static removeDemoUser(): void;
  static validateDemoCredentials(email: string, password: string): boolean;
}
```

**Fonctionnalités** :
- Détection automatique des environnements restreints
- Mode démo pour développement local
- Migration des données locales vers le cloud
- Gestion des erreurs réseau

---

## 🛠️ Services et Utilitaires

### 1. SimulationService

```typescript
class SimulationService {
  // Stockage local
  static getLocalData(): LocalSimulationData;
  static saveLocalData(data: LocalSimulationData): void;
  static addLocalSimulation(simulation: SimulationResult): void;
  static clearLocalData(): void;
  
  // Stockage cloud
  static saveSimulation(simulation: SimulationResult, userId: string): Promise<string>;
  static getUserSimulations(userId: string): Promise<SimulationResult[]>;
  static deleteSimulation(simulationId: string): Promise<void>;
  
  // Migration
  static migrateLocalToCloud(userId: string): Promise<void>;
}
```

### 2. RouletteUtils

```typescript
// Configuration de la roulette européenne
const ROULETTE_NUMBERS: RouletteNumber[] = [
  { number: 0, color: "green", isEven: false, dozen: null },
  { number: 1, color: "red", isEven: false, dozen: 1 },
  // ... 36 numéros
];

// Fonctions utilitaires
export function getRouletteNumber(num: number): RouletteNumber;
export function generateRandomSpin(): number;
export function generateFixedSpins(count: number, seed?: number): number[];
export function processSpinResult(drawnNumber: number, strategies: Strategies, spinNumber: number): SpinResult;
export function runSimulation(spins: number[], onProgress?: (progress: number) => void): SpinResult[];
```

### 3. Utilitaires Généraux

```typescript
// Combinaison de classes CSS
export function cn(...inputs: ClassValue[]): string;

// Formatage des devises
export function formatCurrency(value: number, currencyCode: string): string;
```

---

## ⚙️ Configuration et Déploiement

### 1. Configuration Vite

```typescript
export default defineConfig({
  plugins: [react({ jsxRuntime: "automatic" })],
  resolve: { alias: { "@": path.resolve(__dirname, "./src") } },
  build: {
    outDir: "dist",
    sourcemap: false,
    minify: "esbuild",
    target: "esnext",
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ["react", "react-dom"],
          ui: ["@radix-ui/react-tabs", "@radix-ui/react-dialog"],
          charts: ["recharts"],
          icons: ["lucide-react"],
        },
      },
    },
    chunkSizeWarningLimit: 1000,
  },
  server: { hmr: { overlay: false } },
  base: "/",
  preview: { port: 3000, strictPort: true },
});
```

### 2. Configuration Tailwind

```typescript
export default {
  darkMode: ["class"],
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Système de couleurs personnalisé
        primary: "hsl(var(--primary))",
        secondary: "hsl(var(--secondary))",
        // ... autres couleurs
      },
      keyframes: {
        "accordion-down": { from: { height: "0" }, to: { height: "var(--radix-accordion-content-height)" } },
        "accordion-up": { from: { height: "var(--radix-accordion-content-height)" }, to: { height: "0" } },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};
```

### 3. Configuration Firebase

```typescript
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "demo-api-key",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "rosistrat-demo.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "rosistrat-demo",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "rosistrat-demo.appspot.com",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "123456789",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:123456789:web:abcdef123456",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-XXXXXXXXXX",
};
```

### 4. Variables d'Environnement

```env
# Firebase Configuration
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_FIREBASE_MEASUREMENT_ID=your_measurement_id
```

---

## 📁 Structure des Fichiers

```
RoSiStrat/
├── public/                    # Fichiers statiques
│   ├── favicon.ico
│   ├── manifest.json         # Configuration PWA
│   ├── sw.js                 # Service Worker
│   └── icons/                # Icônes PWA
├── src/
│   ├── components/           # Composants React
│   │   ├── ui/              # Composants UI de base
│   │   ├── auth/            # Authentification
│   │   ├── simulation/      # Simulation
│   │   ├── privacy/         # Confidentialité
│   │   └── user/            # Utilisateur
│   ├── contexts/            # Contextes React
│   │   ├── AuthContext.tsx
│   │   └── CookieContext.tsx
│   ├── hooks/               # Hooks personnalisés
│   │   ├── use-mobile.tsx
│   │   └── use-toast.ts
│   ├── lib/                 # Utilitaires
│   │   ├── firebase.ts
│   │   ├── rouletteUtils.ts
│   │   └── utils.ts
│   ├── pages/               # Pages de l'application
│   │   ├── Index.tsx        # Page principale
│   │   ├── About.tsx        # À propos
│   │   ├── PrivacyPolicy.tsx
│   │   ├── TermsOfUse.tsx
│   │   └── NotFound.tsx
│   ├── services/            # Services métier
│   │   └── simulationService.ts
│   ├── styles/              # Styles CSS
│   │   └── mobile.css
│   ├── utils/               # Utilitaires généraux
│   │   └── authFallback.ts
│   ├── App.tsx              # Composant principal
│   ├── main.tsx             # Point d'entrée
│   └── index.css            # Styles globaux
├── package.json              # Dépendances
├── tailwind.config.ts        # Configuration Tailwind
├── vite.config.ts           # Configuration Vite
├── tsconfig.json            # Configuration TypeScript
└── README.md                # Documentation utilisateur
```

---

## 🔌 API et Interfaces

### 1. Interfaces Principales

```typescript
// Résultat de simulation
interface SimulationResult {
  id?: string;
  userId?: string;
  strategy: string;
  startingInvestment: number;
  finalEarnings: number;
  finalPortfolio: number;
  totalSpins: number;
  timestamp: Date;
  settings: Record<string, any>;
  results: any[];
}

// Configuration de stratégie
interface StrategyConfig {
  id: string;
  name: string;
  initialBet: number;
  betType: "single" | "dozen" | "color" | "even_odd" | "high_low" | "column";
  target: string | number;
  progression: "flat" | "martingale" | "fibonacci" | "dalembert" | "custom";
  winMultiplier: number;
  customProgression?: number[];
  resetOnWin: boolean;
  maxBet?: number;
}

// Résultat de tour
interface SpinResult {
  spin: number;
  drawnNumber: number;
  strategies: {
    zero: BettingStrategy;
    firstDozen: BettingStrategy;
    secondDozen: BettingStrategy;
    black: BettingStrategy;
    even: BettingStrategy;
  };
  spinNetResult: number;
  cumulativeEarnings: number;
}
```

### 2. Types de Stratégies

```typescript
type StrategyType =
  | "compound_martingale"      // Martingale composé
  | "max_lose"                 // Perte maximale
  | "zapping"                  // Zapping
  | "safe_compound_martingale" // Martingale composé sécurisé
  | "sam_plus"                 // SAM+ (Smart Adaptive Martingale Plus)
  | "standard_martingale";     // Martingale standard
```

### 3. Configuration de la Roulette

```typescript
interface RouletteNumber {
  number: number;
  color: "red" | "black" | "green";
  isEven: boolean;
  dozen: 1 | 2 | 3 | null;
}

interface BettingStrategy {
  name: string;
  currentBet: number;
  initialBet: number;
  totalWagered: number;
  totalWon: number;
  netResult: number;
}
```

---

## 🚀 Fonctionnalités Avancées

### 1. Progressive Web App (PWA)

- **Service Worker** : Mise en cache intelligente
- **Manifest** : Installation sur appareils mobiles
- **Offline Support** : Fonctionnement sans connexion
- **Push Notifications** : Notifications (futur)

### 2. Analytics et Métriques

- **Suivi des Performances** : Métriques de simulation
- **Visualisations** : Graphiques Recharts
- **Export de Données** : CSV/JSON
- **Comparaison de Stratégies** : Analyse comparative

### 3. Sécurité et Conformité

- **RGPD** : Gestion des cookies et données
- **Vérification d'Âge** : Protection des mineurs
- **Chiffrement** : Données sensibles protégées
- **Audit Trail** : Traçabilité des actions

### 4. Internationalisation

- **Multi-Devises** : 9 devises supportées
- **Formatage Local** : Adaptation aux régions
- **Traductions** : Support multilingue (futur)

---

## 🧪 Tests et Qualité

### 1. Tests Unitaires

```typescript
// Exemple de test pour les utilitaires
describe('rouletteUtils', () => {
  test('generateRandomSpin returns valid number', () => {
    const spin = generateRandomSpin();
    expect(spin).toBeGreaterThanOrEqual(0);
    expect(spin).toBeLessThanOrEqual(36);
  });
  
  test('processSpinResult calculates correctly', () => {
    const strategies = initializeStrategies();
    const result = processSpinResult(0, strategies, 1);
    expect(result.drawnNumber).toBe(0);
    expect(result.spin).toBe(1);
  });
});
```

### 2. Tests d'Intégration

- **Authentification** : Flux complet de connexion
- **Simulation** : Exécution complète des stratégies
- **Persistance** : Sauvegarde et récupération des données

### 3. Tests de Performance

- **Chargement** : Temps de chargement des composants
- **Simulation** : Performance des calculs intensifs
- **Mémoire** : Gestion de la mémoire pour les grandes simulations

---

## 🔧 Maintenance et Évolution

### 1. Monitoring

- **Erreurs** : Capture et reporting des erreurs
- **Performance** : Métriques de performance
- **Utilisation** : Analytics d'usage
- **Sécurité** : Monitoring des tentatives d'intrusion

### 2. Mises à Jour

- **Dépendances** : Mise à jour régulière des packages
- **Sécurité** : Correctifs de sécurité
- **Fonctionnalités** : Ajout de nouvelles stratégies
- **Améliorations** : Optimisations continues

### 3. Documentation

- **Code** : Commentaires et documentation inline
- **API** : Documentation des interfaces
- **Utilisateur** : Guides d'utilisation
- **Développeur** : Guide de contribution

---

## 📊 Métriques et KPIs

### 1. Métriques Techniques

- **Temps de Chargement** : < 2 secondes
- **Taux d'Erreur** : < 0.1%
- **Disponibilité** : > 99.9%
- **Performance** : Score Lighthouse > 90

### 2. Métriques Utilisateur

- **Engagement** : Temps passé sur la plateforme
- **Rétention** : Utilisateurs récurrents
- **Conversion** : Inscriptions vs visites
- **Satisfaction** : Feedback utilisateur

### 3. Métriques Éducatives

- **Compréhension** : Utilisation des explications
- **Expérimentation** : Nombre de simulations
- **Apprentissage** : Progression des utilisateurs

---

## 🎯 Roadmap et Évolutions Futures

### Phase 1 - Améliorations Immédiates
- [ ] Optimisation des performances
- [ ] Tests automatisés complets
- [ ] Documentation utilisateur
- [ ] Support multilingue

### Phase 2 - Nouvelles Fonctionnalités
- [ ] Nouvelles stratégies de roulette
- [ ] Simulation de blackjack
- [ ] Mode multijoueur
- [ ] API publique

### Phase 3 - Plateforme Étendue
- [ ] Autres jeux de casino
- [ ] Intelligence artificielle
- [ ] Recommandations personnalisées
- [ ] Communauté d'apprentissage

---

## 🤝 Contribution et Support

### 1. Contribution au Code

- **Fork** : Créer une branche de développement
- **Pull Request** : Proposer des améliorations
- **Issues** : Signaler des bugs ou demandes
- **Documentation** : Améliorer la documentation

### 2. Support Utilisateur

- **Email** : elantaki.dijadiss@gmail.com
- **Issues GitHub** : Pour les bugs et demandes
- **Documentation** : Guides et FAQ
- **Communauté** : Forum d'entraide

### 3. Support Financier

- **PayPal** : [Support via PayPal](https://paypal.me/JadissEL)
- **GitHub Sponsors** : Support récurrent
- **Partenariats** : Collaborations éducatives

---

## 📄 Licence et Légal

### 1. Licence du Code

- **MIT License** : Libre d'utilisation et modification
- **Attribution** : Reconnaissance du créateur
- **Commercial** : Utilisation commerciale autorisée
- **Distribution** : Redistribution libre

### 2. Conformité Légale

- **RGPD** : Protection des données personnelles
- **COPPA** : Protection des mineurs
- **Accessibilité** : Conformité WCAG 2.1
- **Responsabilité** : Limitation de responsabilité

### 3. Avertissements

- **Éducatif Uniquement** : Pas de jeu d'argent réel
- **Risques** : Conscience des risques du jeu
- **Responsabilité** : Jeu responsable
- **Légalité** : Respect des lois locales

---

## 🏆 Reconnaissance et Remerciements

### 1. Technologies Utilisées

- **React** : Framework frontend
- **TypeScript** : Typage statique
- **Tailwind CSS** : Framework CSS
- **Radix UI** : Composants accessibles
- **Firebase** : Backend as a Service
- **Recharts** : Visualisations de données

### 2. Communauté

- **Développeurs** : Communauté open source
- **Testeurs** : Utilisateurs beta
- **Contributeurs** : Améliorations et suggestions
- **Supporters** : Soutien financier et moral

### 3. Inspiration

- **Éducation** : Promotion de l'apprentissage
- **Mathématiques** : Théorie des probabilités
- **Technologie** : Innovation et créativité
- **Responsabilité** : Jeu responsable et éthique

---

**Développé avec ❤️ par Jadiss EL ANTAKI**

*Cette documentation est maintenue à jour avec l'évolution du projet. Pour toute question ou suggestion, n'hésitez pas à nous contacter.*
