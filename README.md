# 🌸 Dear Self — A Gentle, Mindful Journaling App

A calm, atmospheric journaling application built with **React**, designed to feel soft, emotionally safe, and reflective.  
Dear Self offers daily affirmations, writing modes, customizable themes, and a serene, private journaling experience powered by local data persistence.

👉 **Live Demo:** https://heathergauthier2018.github.io/Dear-Self/

---

## ✨ What This Project Demonstrates

Dear Self showcases modern front-end engineering, thoughtful UX design, and wellness-minded product thinking.

### 🎨 **Design & UX**
- Soft, mindful UI inspired by journaling aesthetics  
- Gentle color system & watercolor textures  
- Daily ritual flow (affirmation → challenge → journal)  
- Emotionally safe interactions (no guilt, no productivity pressure)

### ⚛️ **React Engineering**
- Component-driven architecture  
- Hooks for state management and autosave  
- LocalStorage-based persistence  
- React Router for navigation  
- Utility modules for logic isolation  
- Custom theming system with live preview

### 🌱 **Wellness-Centered Features**
- Daily “moment” generator  
- Gentle challenge prompts  
- Multiple writing modes  
- Calendar reflection view  
- Theme studio with customizable packs  

---

## 🌞 Core Features

### **🌼 Daily Moment (Affirmation Ritual)**
Every new day generates:
- A positive affirmation  
- A gentle challenge  
- A soft theme  
- A calming animation  
- Stored in a single “Day Object” so the moment stays stable all day  

---

### **📔 Journal**
A peaceful, private writing space featuring:
- **Typed, Handwritten, and Minimalist writing modes**  
- Watercolor, linen, and parchment paper textures  
- Auto-save using `localStorage`  
- Past entry browsing  
- Entry editing & rewriting  

---

### **📅 Calendar**
A guilt-free reflection tool:
- Shows which days you wrote  
- Blank days remain neutral (no streak shaming)  
- Tap any day to view:
  - Affirmation  
  - Challenge  
  - Entry  
  - Theme preview  

---

### **🎨 Theme Studio**
A calming customization system:
- Coquette, Earthbound, Celestial, Minimalist theme packs  
- Custom color + font selectors  
- Texture selector  
- Live preview engine  

---

## 💗 Upcoming Enhancements

- Mood selector  
- Gratitude line  
- Reflection widgets  
- Yearly emotional heatmap  
- Dark Mode (Moonlight / Candlelight)  
- PDF export for print journaling  
- Long-term: AI-assisted prompt generation  

---

## 🧱 Tech Stack

- **React** (Hooks + functional components)  
- **React Router**  
- **CSS** (App.css, PastEntries.css, theme.css)  
- **LocalStorage** for persistence  
- **Utility-based architecture**  
- **Custom theming engine**  

---

## 📂 Project Structure

```text
DEAR-SELF/
│── build/
│── node_modules/
│── public/
│   ├── images/
│   ├── favicon.ico
│   ├── index.html
│   ├── manifest.json
│   └── robots.txt
│
└── src/
    ├── components/
    │   ├── Favorites.js
    │   ├── JournalEntry.js
    │   ├── PastEntries.js
    │   └── Settings.js
    │
    ├── data/
    │   └── affirmations.js
    │
    ├── services/
    │   ├── auth.js
    │   ├── getTodayEntry.js
    │   ├── sendUsageWarning.js
    │   └── streak.js
    │
    ├── styles/
    │   ├── App.css
    │   ├── PastEntries.css
    │   └── theme.css
    │
    ├── utils/
    │   ├── getTodayEntry.js
    │   ├── paperImages.js
    │   ├── prefs.js
    │   ├── probelImages.js
    │   └── StreakBadge.js
    │
    ├── App.js
    ├── App.test.js
    ├── index.css
    ├── index.js
    ├── logo.svg
    ├── reportWebVitals.js
    └── setupTests.js
```

---

## 🚀 Running Dear Self Locally

### 1️⃣ Clone the repository

```bash
git clone https://github.com/heathergauthier2018/Dear-Self.git
cd Dear-Self
```

### 2️⃣ Install dependencies

```bash
npm install
```

### 3️⃣ Start the dev server

```bash
npm start
```

### 4️⃣ Build the production bundle

```bash
npm run build
```

---

## 🧩 Architecture Overview

### **DailyMoment System**
- Pulls a random affirmation  
- Generates a gentle challenge  
- Assigns a daily soft theme  
- Bundles into a single DayObject  
- Stored safely in LocalStorage  

### **Journal System**
- Writing modes  
- Texture engine  
- Autosave logic  
- Past entry retrieval  
- Entry editing & rewriting  

### **Calendar System**
- Days appear only when the user opens the app  
- No penalty for missed days  
- Tap-to-view previous content  

### **Theme Studio**
- Pre-built theme packs  
- Color, font, and texture customization  
- Real-time preview engine  

---

## 🧪 Tests

- **Jest**  
- **React Testing Library**  
- Includes baseline test coverage (`App.test.js`)  
- Additional tests planned for:
  - Theme studio behavior  
  - Past entries logic  
  - Calendar edge cases  

---

## ✍️ Developer Motivation

Dear Self is intended to be a **digital sanctuary**—not a productivity tracker.  
It is soft. It is slow. It is a place to breathe, explore, and reflect without pressure.

---

## 📝 License — All Rights Reserved

**Dear Self © 2025 — Heather Gauthier**

All code, assets, UI designs, writing, artwork, and branding are fully owned by the creator.

### ❌ You MAY NOT:
- Copy or reuse the code  
- Reproduce UI designs, themes, or artwork  
- Distribute or modify this project  
- Use it in personal, academic, or commercial work  
- Incorporate it into other software  
- Sell or sublicense any part of the project  

### ✅ You MAY:
- View the code for learning  
- Clone locally for study  
- Read the documentation  

For permission or licensing inquiries:  
📧 **heathergauthier18@gmail.com**
