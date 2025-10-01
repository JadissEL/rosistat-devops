# 🎰 RoSiStrat - European Roulette Strategy Simulator

[![Deploy to GitHub Pages](https://github.com/JadissEL/rosistat-devops/actions/workflows/deploy.yml/badge.svg)](https://github.com/JadissEL/rosistat-devops/actions/workflows/deploy.yml)

**Created by Jadiss EL ANTAKI**

A comprehensive European Roulette strategy simulation platform that helps users understand betting systems without risking real money.

## ✨ Features

- **6 Strategy Simulations**: Compound Martingale, Max Lose, Zapping, Safe Compound Martingale, SAM+, Standard Martingale
- **Multi-Currency Support**: USD, EUR, GBP, AED, SAR, MAD, JPY, CHF, CAD
- **User Authentication**: Firebase-powered with demo mode fallback
- **Real-time Analytics**: Comprehensive 500-spin analysis with charts
- **Mobile Responsive**: Works perfectly on all devices
- **Progressive Web App**: Install on mobile devices

## 🚀 Live Demo

Visit: https://jadissel.github.io/rosistat-devops/

## 🛠️ Tech Stack

- **Frontend**: React 18, TypeScript, Vite
- **UI**: Tailwind CSS, Radix UI, Lucide Icons
- **Authentication**: Firebase Auth
- **Database**: Firestore
- **Charts**: Recharts
- **Hosting**: Firebase Hosting / Vercel / Netlify

## 🏃‍♂️ Quick Start

```bash
# Clone the repository
git clone https://github.com/YOUR_USERNAME/rosistrat-app.git

# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

### API Base (Frontend)

Create a `.env.local` file at the repo root with:

```env
VITE_API_BASE=http://localhost:8080
```

In code, use the centralized helpers in `src/lib/api.ts` which automatically prefix requests with `VITE_API_BASE`.

## 📊 Strategies Included

1. **Compound Martingale**: 5-strategy approach targeting Number 0, dozens, and even/odd
2. **Max Lose**: Reset after 5 losses with special zero handling
3. **Zapping**: Alternating Red/Black with progressive betting
4. **Safe Compound Martingale**: Capital protection with safety ratios
5. **SAM+ (Smart Adaptive Martingale Plus)**: Advanced Kelly betting system
6. **Standard Martingale**: Classic Red-only progressive system

## 🔧 Environment Setup

Create a `.env` file with your Firebase configuration:

```env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

## 📱 Progressive Web App

RoSiStrat can be installed as a PWA on mobile devices for a native app experience.

## 🤝 Contributing

This is a personal project by Jadiss EL ANTAKI. Feel free to fork and create your own versions!

## 💝 Support

If you find RoSiStrat useful, consider:

- ⭐ Starring this repository
- 💰 [Supporting the creator](https://paypal.me/JadissEL?country.x=GR&locale.x=en_US)

## 📄 License

MIT License - feel free to use this code for your own projects!

---

**Built with ❤️ by Jadiss EL ANTAKI**
