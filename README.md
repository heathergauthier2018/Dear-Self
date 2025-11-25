# 🌸 Dear Self — A Gentle, Mindful Journaling App

**Dear Self** is a calm, atmospheric journaling experience built with **React**, designed to feel soft, emotionally safe, and deeply personal.  
It focuses on quiet ritual, gentle design, and giving users a space that feels like *their own*—private, soothing, and fully customizable.

👉 **Live Demo:** https://heathergauthier2018.github.io/Dear-Self/

---

# ✨ What This Project Demonstrates

Dear Self blends mindful design with thoughtful front-end engineering to create a journaling experience that prioritizes emotional well-being and intuitive customization.

### 🎨 **Design & UX**
- Soft UI inspired by analog journaling aesthetics  
- Watercolor-style visuals and warm, gentle color palettes  
- Optional background themes  
- A daily ritual flow (affirmation → gentle challenge → writing)  
- Emotionally safe interaction design (no guilt, no gamified pressure)

### ⚛️ **Engineering & Architecture**
- Component-driven architecture using **React Hooks**  
- LocalStorage persistence for all user data  
- Theme selector powered by custom utility modules  
- React Router for app navigation  
- Structured utilities for theming, entries, date logic, and data handling  

### 🌱 **Wellness-Centered Product Thinking**
- Focus on calm interaction, encouraging reflection—not productivity  
- A daily “moment” that feels supportive rather than demanding  
- Customization features that make the journal feel personal and comforting  

---

# 🌞 Version 1 — Core Features (Current Live App)

Version 1 is intentionally simple, gentle, and stable.  
These are the features that **currently exist** in the deployed build:

### **🌼 Daily Moment**
A soft daily ritual that includes:
- A positive affirmation  
- A gentle challenge  
- A watercolor-style theme  
- Favorite animation  
- Content that stays consistent throughout the day  

---

### **📔 Journal (Version 1 Functionality)**
A quiet and private writing space featuring:
- **Typed writing mode**  
- Optional soft paper-style backgrounds  
- LocalStorage saving of all entries  
- Ability to view past written entries  
- Favorite entries view  
- **Simple streak counter** (days you’ve shown up to write)

> 💡 *Note:*  
> Auto-save, handwritten mode, calendar navigation, editing, and expanded writing features are **future enhancements**, not part of Version 1.

---

### **🎨 Theme Customization (Version 1)**
- Gentle pre-made theme selection  
- Soft backgrounds and comforting color palettes  
- Designed to feel personal, expressive, and welcoming  

---

# 🌱 Future Versions — Curated Roadmap (Not Yet Implemented)

This roadmap is curated to reflect medium- and long-term direction without overwhelming detail.

---

## 📝 Journal Enhancements
Planned expansions to deepen the writing experience:
- **Auto-save** while typing  
- **Handwritten writing mode**  
- **Minimal / focus writing mode**  
- Rich-text formatting (bold, italics, underline)  
- Entry editing and rewrites  
- Entry search + filtering  
- Multi-entry support  
- Writing prompts and reflection suggestions  

### 🔥 Streak System (Expanded)
- Smarter streak tracking  
- Soft badge system  
- Gentle streak resets (no guilt or shame)  
- Celebration micro-animations  
- Weekly reflection tied to streak consistency  

---

## 🗓️ Calendar & Timeline System
A future interactive calendar to explore reflections over time:
- Clickable past days  
- View previous affirmations, challenges, and entries  
- Mood tagging  
- Mood heatmap  
- Scrollable timeline / year-in-review  

---

## 🎨 Advanced Theming & Customization
Enhancements that deepen personalization:
- **Dark Mode** (Moonlight, Candlelight)  
- Seasonal aesthetic packs (Cozy Autumn, Celestial Night, Spring Garden, etc.)  
- User-defined accent colors  
- Uploadable custom paper textures  
- Optional animated ambient backgrounds (dust motes, glow particles)  

### 🎨 Artist Collaborations (Planned)
Dear Self will expand its creative identity through collaborations with independent artists to create:
- Background artwork  
- Paper textures  
- Journal layout styles  
- Themed visual packs  

These collaborations will allow users to shape their space through diverse creative voices.

---

## ☁️ Account & Sync (Future)
- Optional user accounts  
- Encrypted cloud sync across devices  
- Backup + restore options  

---

## 📤 Exporting & Sharing
- Export entries to **PDF**  
- “Print-ready” journaling layouts  
- Yearly summary export  

---

## 🤖 Optional AI-Assisted Features (Long-Term)
Soft, supportive, opt-in-only AI features:
- Gentle journaling prompts  
- Emotional summaries  
- Kind-tone rewrite suggestions  
- Reflection guidance  

---

# 🧱 Tech Stack

- **React** (Hooks, functional components)  
- **React Router**  
- **CSS Modules** (App.css, PastEntries.css, theme.css)  
- **LocalStorage** for all persistence  
- **Custom theme utilities**  
- **Structured services** for daily logic, streaks, and session behavior  

---

# 📂 Project Structure

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

# ✍️ Motivation

Dear Self was created to be a **digital sanctuary** — a place that meets you exactly where you are.  
It avoids productivity metrics, pressure, and noise, focusing instead on calm ritual,  
creative expression, and emotional safety.

It is a journal you can make **truly yours**, today and as it grows.

---

# 📝 License — All Rights Reserved

**Dear Self © 2025 — Heather Gauthier**

All code, designs, themes, artwork, written content, prompts, and visual assets are the exclusive property of the creator.

### You MAY NOT:
- Copy, reuse, or distribute the code  
- Reproduce UI designs, themes, or artwork  
- Modify or repurpose the project  
- Use it in personal, academic, or commercial work  
- Incorporate it into other software  
- Sell or sublicense any part of the project  

For licensing inquiries  
📧 **heathergauthier18@gmail.com**
