import type { Messages } from "./tr";

export const en = {
  // ── Navigation ──
  nav: {
    mahfuz: "Mahfuz",
    memorization: "Memorization",
    audio: "Listen",
    bookmarks: "Bookmarks",
    settings: "Settings",
    credits: "Contributors",
    search: "Search",
    menu: "Menu",
    login: "Sign In",
    signOut: "Sign Out",
    profile: "Profile",
    openMenu: "Open menu",
    closeMenu: "Close menu",
    scrollToTop: "Scroll to top",
    prevSurah: "Previous surah",
    nextSurah: "Next surah",
    prevPage: "Previous page",
    nextPage: "Next page",
  },

  // ── Common ──
  common: {
    search: "Search",
    close: "Close",
    back: "Back",
    ok: "OK",
    loading: "Loading...",
    noResults: "No results found",
    add: "Add",
    remove: "Remove",
    cancel: "Cancel",
    save: "Save",
    or: "or",
    page: "Page",
    surah: "Surah",
    verse: "Verse",
    juz: "Juz",
    local: "Local",
  },

  // ── Footer ──
  footer: {
    brand: "Mahfuz — The Holy Quran",
    tagline: "Open source Quran application",
  },

  // ── Theme & Font ──
  theme: {
    settings: "Theme settings",
    light: "Light",
    sepia: "Sepia",
    dark: "Dark",
    dimmed: "Night",
    colorizeWords: "Word Coloring",
    fontLabel: "Font",
  },

  fonts: {
    title: "Font",
    groups: {
      classic: "Classic & Mushaf",
      modern: "Modern & Clean",
      decorative: "Calligraphy & Decorative",
    },
    shortLabels: {
      "uthmani-hafs": "Mushaf · Classic",
      "scheherazade-new": "Naskh · Elegant",
      amiri: "Naskh · Print",
      "noto-naskh-arabic": "Modern · Clean",
      rubik: "Modern · Soft",
      zain: "Modern · Thin",
      "reem-kufi": "Kufic · Bold",
      "playpen-sans-arabic": "Handwriting · Warm",
    },
    descriptions: {
      "uthmani-hafs": "A digital typeface faithful to Mushaf tradition. Enriched with tajweed colors and diacritical marks.",
      "scheherazade-new": "An elegant design rooted in Naskh tradition. Easy on the eyes for extended recitation.",
      amiri: "A classic Naskh interpretation carrying the spirit of the Egyptian Bulaq press. Nobility and simplicity combined.",
      "noto-naskh-arabic": "The Arabic member of a global font family. Offers a clear and consistent reading experience.",
      rubik: "A contemporary design with soft curves. Comfortable and fluid on screen.",
      zain: "Fine lines where simplicity meets elegance. A gentle choice for digital reading.",
      "reem-kufi": "A bold character that interprets Kufic tradition with modern lines. Striking in headings.",
      "playpen-sans-arabic": "A warm typeface bringing the warmth of handwriting to digital. Makes daily reading enjoyable.",
    },
  },

  palettes: {
    pastel: "زَهريّ • Elegant",
    ocean: "بَرق • Light",
    earth: "جَوهَر • Jewel",
    vivid: "حِبر • Ink",
  },

  // ── Meta / SEO ──
  meta: {
    title: "Mahfuz | The Holy Quran",
    description: "Read, listen, and memorize the Holy Quran. Open source Quran application.",
  },

  // ── 404 ──
  error: {
    notFound: "Page Not Found",
    notFoundDesc: "The page you are looking for does not exist.",
    goHome: "Go to Home",
  },

  // ── Landing Page ──
  landing: {
    banner: "By the grace of the Unique Creator",
    goToApp: "Go to App",
    startReading: "Start Reading",
    login: "Sign In",
    register: "Sign Up",
    heroSubtitle: "Begin your journey with the Holy Quran.",
    ctaRead: "Start Reading",
    ctaMemorize: "Start Memorizing",
    verseRef: "Al-Hijr 15:9",
    verseText: "Indeed, it is We who sent down the Quran and indeed, We will be its guardian.",
    featuresTitle: "Everything in one place.",
    featuresSubtitle: "Read, listen, memorize and understand. With word-by-word tracking, smart review and progress system.",
    featureReading: "Reading",
    featureReadingDesc: "Surah, page and juz views. Word-by-word translation.",
    featureListening: "Listening",
    featureListeningDesc: "Word-level tracking with 60+ reciters and repeat mode.",
    featureMemorization: "Memorization",
    featureMemorizationDesc: "Hifz support with SM-2 spaced repetition algorithm.",
    featureProgress: "Progress",
    featureProgressDesc: "Motivation with XP, streaks, badges and khatm counter.",
    statSurahs: "Surahs",
    statVerses: "Verses",
    statJuzs: "Juz",
    statPages: "Pages",
  },

  // ── Auth ──
  auth: {
    login: "Sign In",
    loginSubtitle: "Sign in to your account",
    register: "Sign Up",
    registerTitle: "Create Account",
    registerSubtitle: "Welcome to Mahfuz",
    continueWithGoogle: "Continue with Google",
    continueWithApple: "Continue with Apple (soon)",
    email: "Email",
    emailPlaceholder: "example@email.com",
    password: "Password",
    passwordPlaceholder: "••••••••",
    passwordMinChars: "At least 8 characters",
    fullName: "Full Name",
    fullNamePlaceholder: "Your Full Name",
    loggingIn: "Signing in...",
    registering: "Creating account...",
    noAccount: "Don't have an account?",
    hasAccount: "Already have an account?",
    loginFailed: "Sign in failed.",
    loginError: "An error occurred. Please try again.",
    googleLoginFailed: "Google sign in failed.",
    googleLoginError: "Google sign in failed. Please try again.",
    appleLoginFailed: "Apple sign in failed.",
    appleLoginError: "Apple sign in failed. Please try again.",
    registerFailed: "Registration failed.",
    registerError: "An error occurred. Please try again.",
    googleRegisterFailed: "Google registration failed.",
    googleRegisterError: "Google registration failed. Please try again.",
    appleRegisterFailed: "Apple registration failed.",
    appleRegisterError: "Apple registration failed. Please try again.",
  },

  // ── Browse ──
  browse: {
    surahs: "Surahs",
    juzs: "Juz",
    pages: "Pages",
    index: "Index",
    searchSurah: "Search surah...",
    versesCount: "verses",
  },

  // ── Settings ──
  settings: {
    title: "Settings",
    subtitle: "Customize your reading experience",
    general: "General",
    readingMode: "Reading Mode Settings",
    colorizeWords: "Colorize Words",
    colorizeWordsDesc: "Show each word in a different color",
    colorPalette: "Color Palette",
    showTranslation: "Show Translation",
    showTranslationDesc: "Show verse translations in normal mode",
    translationSelection: "Translation Selection",
    translationSelectionDesc: "Reorder and select primary translation",
    arabicSize: "Arabic Size",
    translationSize: "Translation Size",
    wordTranslation: "Word Translation",
    transliteration: "Transliteration",
    transliterationSize: "Transliteration Size",
    viewModes: {
      normal: "Normal",
      wordByWord: "Word",
      mushaf: "Mushaf",
    },
    language: "Language",
    languageDesc: "Change interface language",
    sampleTranslation: "In the name of Allah, the Most Gracious, the Most Merciful",
  },

  // ── Reading / Toolbar ──
  reading: {
    settings: "Reading settings",
    settingsTitle: "Reading Settings",
    translation: "Translation",
    translationSubtitle: "Show translation text",
    wordInfo: "Word Info",
    wordInfoSubtitle: "Tap a word for translation and pronunciation",
    transliterationLabel: "Transliteration",
    transliterationSubtitle: "Pronunciation guide",
    wordTranslationLabel: "Word Translation",
    wordTranslationSubtitle: "Meaning of each word",
    swapOrder: "Swap Order",
  },

  // ── Translation Picker ──
  translationPicker: {
    selected: "Selected Translations",
    makePrimary: "Make primary",
    isPrimary: "Primary translation",
    moveUp: "Move up",
    moveDown: "Move down",
  },

  // ── Command Palette ──
  commandPalette: {
    placeholder: "Search surah, verse, page or juz...",
    emptyDesc: "Type a surah name, verse number, page or juz",
    quickNav: "Quick Navigation",
    searching: "Searching...",
    verseResults: "Verse Results",
    results: "results",
    surahUnit: "surah",
    mushafPage: "Mushaf page",
  },

  // ── Surah Picker ──
  surahPicker: {
    placeholder: "Search surah...",
  },

  // ── Credits ──
  credits: {
    title: "Contributors",
    subtitle: "People and resources that made this app possible",
    translations: "Translation Sources",
    dataSources: "Data Sources",
    fontsSection: "Fonts",
    contactUs: "Contact Us",
    disclaimer: "Translation texts belong to their respective authors and publishers. This app brings together these resources to facilitate access to the Holy Quran.",
    translationCredits: {
      diyanet: "The official Quran translation prepared by the Presidency of Religious Affairs of the Republic of Turkey.",
      pirveysal: "A scholarly translation known for its academic rigor and clear Turkish.",
      bilmen: "A classic translation by Ömer Nasuhi Bilmen, one of the first heads of Religious Affairs in the Republic era.",
      yavuz: "A widely read translation known for its plain and fluent Turkish.",
    },
    dataCredits: {
      quranApi: "Open API used for verse texts, word-by-word data, transliteration and Diyanet translation.",
      quranJsonRepo: "JSON source for Ali Fikri Yavuz and Ömer Nasuhi Bilmen translations.",
    },
    fontCredits: {
      kfgqpc: "Mushaf typeface developed by the King Fahd Glorious Quran Printing Complex.",
      googleFonts: "Scheherazade New, Amiri, Noto Naskh Arabic, Rubik, Zain, Reem Kufi and Playpen Sans Arabic fonts.",
    },
    issueLinks: {
      featureRequest: "Feature Request",
      bugReport: "Bug Report",
      copyright: "Copyright Notice",
      message: "Message",
      contribute: "I Want to Contribute",
    },
  },

  // ── Memorization ──
  memorize: {
    title: "Memorization",
    startReview: "Start Review",
    emptyTitle: "Start Memorizing",
    emptyDesc: "Select a surah and add your first verses",
    goals: "Goals",
    backToMemorize: "← Memorization",
    addVerse: "Add Verses",
    versesAdded: "verses added",

    // Review
    congratulations: "Congratulations!",
    allCardsDone: "All cards for today are completed!",
    backToPanel: "Back to Panel",

    // Add verses
    addVersesTitle: "Add Verses",
    versesAvailable: "verses available",
    versesExisting: "verses already added",
    allVersesAdded: "All verses of this surah have already been added.",
    viewProgress: "View Progress",
    selectAll: "Select All",
    deselectAll: "Clear",
    selected: "selected",
    quickSelect: "Quick select:",
    firstN: "First",
    verseNum: "Verse",
    adding: "Adding...",
    memorizeVerses: "Memorize Verses",

    // Confidence
    confidence: {
      struggling: "Struggling",
      learning: "Learning",
      familiar: "Familiar",
      confident: "Confident",
      mastered: "Mastered",
    },

    // Stats
    stats: {
      dueToday: "Due Today",
      reviewedToday: "Reviewed Today",
      streak: "Streak",
      streakSuffix: "days",
      accuracy: "Accuracy",
      confidenceDist: "Confidence Distribution",
      ofQuran: "of Quran",
      memorized: "Memorized",
    },

    // Goals
    goalsSettings: {
      title: "Daily Goals",
      newPerDay: "New verses / day",
      reviewPerDay: "Reviews / day",
    },

    // Review Card
    review: {
      wordCount: "words",
      nextWord: "Next Word",
      revealAll: "Reveal All",
      memorized: "Memorized ✓",
      gradePrompt: "How well did you remember this verse?",
      simpleGrading: "Simple grading",
      detailedGrading: "Detailed grading",
      verseLoadError: "Failed to load verse",
      grades: {
        again: "Again",
        hard: "Hard",
        easy: "Easy",
      },
      detailedGrades: {
        blackout: "Blackout",
        veryHard: "Very Hard",
        hard: "Hard",
        medium: "Medium",
        easy: "Easy",
        veryEasy: "Very Easy",
      },
    },

    // Session Results
    results: {
      title: "Session Complete",
      total: "Total",
      correct: "Correct",
      accuracy: "Accuracy",
      continue: "Continue",
    },

    // Surah Selector
    surahSelector: {
      progress: "Progress",
      add: "Add",
      practice: "Practice",
      verify: "Mastered ✓",
      surahs: "Surahs",
      searchPlaceholder: "Search surah...",
      noResults: "No surah found",
      noResultsHint: "Try a different search term",
      addedSurahs: "Added Surahs",
      completedSurahs: "Completed Surahs",
      inProgressSurahs: "In Progress",
      allSurahs: "All Surahs",
      markMastered: "Mastered ✓",
    },

    // Practice mode
    practice: {
      button: "Practice",
      label: "Practice",
      noCards: "No Cards Found",
      noCardsDesc: "No cards have been added for this surah yet.",
    },

    // Goal Celebration
    goalCelebration: {
      title: "Daily Goal Complete!",
      subtitle: "Great job! Would you like to continue?",
      continue: "Continue",
    },

    // Verification
    verification: {
      label: "Verification Test",
      passTitle: "Congratulations!",
      passDesc: "You have memorized surah {surah}!",
      failTitle: "More Practice Needed",
      failDesc: "Some verses need more review.",
      needsWork: "Verses that need work:",
      fillBlank: "Fill the Blank",
      correct: "Correct!",
      wrong: "Wrong",
      selectWord: "Select the missing word",
    },

    // Badges
    badges: {
      title: "Badges",
      unlocked: "New Badge Unlocked!",
      names: {
        "first-verse": "First Step",
        "10-verses": "Small Start",
        "50-verses": "Determined",
        "100-verses": "100th Verse",
        "500-verses": "Hafiz Path",
        "1000-verses": "Thousand Verses",
        "first-surah": "First Surah",
        "5-surahs": "Five Surahs",
        "10-surahs": "Ten Surahs",
        "streak-7": "One Week",
        "streak-30": "One Month",
        "streak-100": "Hundred Days",
        "hatim": "Khatm",
        "perfect-session": "Perfect Session",
        "dedicated-50": "Dedicated",
      } as Record<string, string>,
    },

    // Advanced Stats
    advancedStats: {
      quranProgress: "Quran Memorization Progress",
      longestStreak: "Longest streak",
      chartTitle: "Last 30 Days Progress",
      reviews: "Reviews",
    },

    // Profile
    profile: {
      totalVerses: "Total Verses",
      masteredVerses: "Mastered",
      totalReviews: "Accuracy",
    },
  },

  // ── Quran Reader (shared across surah/juz/page/verse views) ──
  quranReader: {
    listen: "Listen",
    pause: "Pause",
    pauseVerse: "Pause",
    listenVerse: "Listen to verse",
    verseByVerse: "Verse by Verse",
    copy: "Copy",
    copied: "Copied",
    fullscreen: "Fullscreen",
    exitFullscreen: "Exit fullscreen",
    surahLoading: "Loading surah...",
    verseLoading: "Loading verse...",
    surahEnd: "End of surah.",
    nextSurahPrompt: "Would you like to continue to the next surah?",
    nextSurah: "Next Surah",
    prevSurah: "Previous Surah",
    prev: "Previous",
    next: "Next",
    done: "Done",
    backToIndex: "Back to Index",
    verseLabel: "Verse",
    pauseVerseAudio: "Pause verse audio",
    playFromVerse: "Play from verse",
    viewModes: {
      normal: "Normal",
      wordByWord: "Word",
      mushaf: "Mushaf",
    },
    // Juz
    juzLoading: "Loading juz...",
    goToJuz: "Go to Juz",
    prevJuz: "Previous Juz",
    nextJuz: "Next Juz",
    // Page
    pageLoading: "Loading page...",
    goToPage: "Go to Page",
    prevPage: "Previous Page",
    nextPage: "Next Page",
    // Units
    versesUnit: "verses",
    pageAbbr: "p.",
  },

  // ── Offline ──
  offline: {
    message: "You are offline — Showing cached data",
  },
} as const satisfies Messages;
