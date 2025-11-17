🌸 Dear Self — A Gentle, Mindful Journaling App

A beautifully atmospheric journaling app built in React.
Dear Self focuses on emotional safety, softness, and reflective design — offering users affirmations, customizable themes, mood tracking (upcoming), and a calm writing space that evolves with them.

👉 Live Demo:
https://heathergauthier2018.github.io/Dear-Self/

✨ Features
🌞 Daily Moment

Daily affirmation + gentle challenge

Watercolor background themes

“Favorite” animations

Generated only when the user opens the app

📔 Journal

Typed, Handwritten, and Minimal writing modes

Paper textures (linen, parchment, watercolor)

Auto-save + past entry recall

Editing + rewrite options

📅 Calendar

Tracks days you showed up

Empty days are treated with emotional neutrality

Tap into any day to view:

Affirmation

Challenge

Entry

Widgets

🎨 Theme Studio

Pre-made theme packs (Coquette, Earthbound, Celestial, Minimalist, etc.)

Custom colors, fonts, and paper textures

Live preview engine

💗 Upcoming

Mood selector

Gratitude line

Reflection widgets

Year emotional heatmap

PDF export

🛠️ Tech Stack

Frontend:

React (Hooks)

React Router

CSS (App.css + Theme.css)

LocalStorage (for all persistence)

Architecture Style:

Component-driven

Soft UI design

Utility modules for logic separation

Services for state retrieval

🗂️ File Structure

Directly matching your actual folder layout:

DEAR-SELF/
│── build/
│── node_modules/
│── public/
│   ├── images/
│   ├── favicon.ico
│   ├── index.html
│   ├── logo192.png
│   ├── logo512.png
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
    │   ├── sendUsageWarning.js
    │   └── StreakBadge.js
    │
    ├── App.js
    ├── App.test.js
    ├── index.css
    ├── index.js
    ├── logo.svg
    ├── reportWebVitals.js
    └── setupTests.js

🚀 Installation & Setup

Clone and install dependencies:

git clone https://github.com/heathergauthier2018/Dear-Self.git
cd dear-self
npm install
npm start


Production build:

npm run build

🧩 Architecture Overview
DailyMoment (core ritual system)
│
├── pulls random affirmation
├── assigns theme
├── generates challenge
└── stores in DayObject

Journal
├── writing modes
├── paper texture engine
└── auto-save logic

Calendar
└── day creation rules
    - Created only when user opens app
    - Blank days remain blank

ThemeStudio
├── theme packs
├── color systems
└── customization engine

🧪 Tests

React Testing Library & Jest
(Current tests include App.test.js — more planned)

🧭 Roadmap
Short Term

Mood tracking

Gratitude line

Theme polish

Mid Term

Dark mode (candle mode, moonlight themes)

User accounts

Sync across devices

Long Term

AI-assisted journaling prompts

Emotional timeline view

Export entries to PDF / print

📸 Screenshots

(Add images inside /public/images or create /assets)

✍️ Motivation

Dear Self is designed as a digital sanctuary, not a productivity tool.
It is soft, slow, and emotionally safe — a space to breathe.

📝 License

MIT License
