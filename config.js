/* =====================================================================
   SPARKORA — shared settings for the game (index.html) AND the
   big-screen display (display.html). Edit here, then redeploy.
   ===================================================================== */
window.SPARKORA_CONFIG = {
  // 1) Google Sheet backend: paste your Apps Script Web App URL (ends with /exec).
  //    Leave empty to run offline (each phone keeps its own leaderboard).
  SHEET_API_URL: 'https://script.google.com/macros/s/AKfycbwjA1qsUXnf5-cMPLlOsy6-kTLPDJYwGSZIRxupitiEZ14Tm783mo5U_1VwvAztNlc-Yg/exec',       // e.g. 'https://script.google.com/macros/s/AKfy.../exec'

  // 2) Address the QR code on the big screen points to.
  GAME_URL: 'https://sparkoraminigame.vercel.app/',

  // 3) Reward tiers (used by the game and shown on the big screen).
  rewards: [
    { minScore: 2500, title: 'SPARKORA FAN',    reward: 'FREE TOYS' },
    { minScore: 3500, title: 'GRILL MASTER',    reward: 'FREE DRINK' },
    { minScore: 3900, title: 'SPARKORA LEGEND', reward: 'SPECIAL MERCHANDISE' }
  ]
};
