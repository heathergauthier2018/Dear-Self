// src/services/getTodayEntry.js
import affirmations from '../data/affirmations';
import sendUsageWarning from './sendUsageWarning';

function getTodayEntry() {
  const STORAGE_KEYS = {
    shuffledIDs: 'shuffledAffirmationIDs',
    usedIDs: 'usedAffirmationIDs',
    lastUsedDate: 'lastUsedDate',
    lastCategory: 'lastUsedCategory',
    lastAffirmationID: 'lastAffirmationID',
    notifiedLowCount: 'notifiedLowAffirmations',
    lastTotal: 'lastAffirmationTotal',
  };

  const todayStr = new Date().toLocaleDateString('en-CA');
  const totalAffirmations = affirmations.length;

  let usedIDs = JSON.parse(localStorage.getItem(STORAGE_KEYS.usedIDs)) || [];
  const lastUsedDate = localStorage.getItem(STORAGE_KEYS.lastUsedDate);
  const lastCategory = localStorage.getItem(STORAGE_KEYS.lastCategory);
  const lastShownID = parseInt(localStorage.getItem(STORAGE_KEYS.lastAffirmationID), 10);
  const notifiedLow = localStorage.getItem(STORAGE_KEYS.notifiedLowCount) === 'true';
  const lastTotal = parseInt(localStorage.getItem(STORAGE_KEYS.lastTotal), 10) || totalAffirmations;

  const newAffirmations = affirmations.filter(a => !usedIDs.includes(a.id));
  if (usedIDs.length >= lastTotal) {
    if (newAffirmations.length > 0) {
      usedIDs = [];
      localStorage.setItem(STORAGE_KEYS.usedIDs, JSON.stringify([]));
    } else {
      usedIDs = [];
      localStorage.setItem(STORAGE_KEYS.usedIDs, JSON.stringify([]));
      localStorage.setItem(STORAGE_KEYS.notifiedLowCount, 'false');
      sendUsageWarning(0);
    }
  }

  const remaining = totalAffirmations - usedIDs.length;
  if (!notifiedLow && (remaining === 10 || remaining === 1)) {
    sendUsageWarning(remaining);
    localStorage.setItem(STORAGE_KEYS.notifiedLowCount, 'true');
  }

  let todayAffirmation;

  if (lastUsedDate !== todayStr) {
    const unused = affirmations.filter(a => !usedIDs.includes(a.id));
    const filtered = unused.filter(a => a.category !== lastCategory);

    todayAffirmation =
      (filtered.length > 0
        ? filtered[Math.floor(Math.random() * filtered.length)]
        : unused[Math.floor(Math.random() * unused.length)]) || affirmations[0];

    usedIDs.push(todayAffirmation.id);

    localStorage.setItem(STORAGE_KEYS.usedIDs, JSON.stringify(usedIDs));
    localStorage.setItem(STORAGE_KEYS.lastUsedDate, todayStr);
    localStorage.setItem(STORAGE_KEYS.lastCategory, todayAffirmation.category);
    localStorage.setItem(STORAGE_KEYS.lastAffirmationID, todayAffirmation.id);
    localStorage.setItem(STORAGE_KEYS.lastTotal, totalAffirmations);
  } else {
    todayAffirmation = affirmations.find(a => a.id === lastShownID) || affirmations[0];
  }

  const cleanAffirmation = todayAffirmation.affirmation.match(/\[(.*?)\]/)?.[1] || todayAffirmation.affirmation;
  const cleanChallenge = todayAffirmation.challenge.match(/\[(.*?)\]/)?.[1] || todayAffirmation.challenge;

  return {
    ...todayAffirmation,
    affirmation: cleanAffirmation,
    challenge: cleanChallenge,
  };
}

export default getTodayEntry;
