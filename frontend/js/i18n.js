// i18n.js – Internationalisation for Hindi + English UI
// Usage: i18n.t('key') returns translated string for current language

const i18n = (() => {
  const strings = {
    en: {
      // Navigation
      'nav.ask':        'Ask a Question',
      'nav.history':    'My History',
      'nav.quiz':       'Take a Quiz',
      'nav.search':     'Search Books',
      'nav.progress':   'My Progress',
      'nav.signout':    'Sign Out',

      // Chat
      'chat.placeholder':   'Ask your question here…',
      'chat.send':          'Send',
      'chat.welcome.title': 'Namaste! 🙏',
      'chat.welcome.sub':   'Ask me anything about your textbooks.',
      'chat.thinking':      'Thinking…',
      'chat.cached':        '⚡ Cached',
      'chat.error.nobook':  'No relevant content found. Please ensure a textbook is uploaded.',
      'chat.error.llm':     'The AI tutor is currently unavailable. Please try again shortly.',

      // Answer sections
      'ans.explanation':  '📘 Explanation',
      'ans.example':      '💡 Example',
      'ans.summary':      '📝 Summary',
      'ans.practice':     '✏️ Practice Question',

      // Auth
      'auth.login':        'Sign In',
      'auth.register':     'Create Account',
      'auth.email':        'Email Address',
      'auth.password':     'Password',
      'auth.name':         'Full Name',
      'auth.newhere':      'New here?',
      'auth.haveacc':      'Already have an account?',
      'auth.role.student': 'Student',
      'auth.role.admin':   'Teacher / Admin',

      // Quiz
      'quiz.generate':  'Generate Quiz',
      'quiz.topic':     'Topic (optional)',
      'quiz.numq':      'Number of Questions',
      'quiz.submit':    'Submit Answers',
      'quiz.newquiz':   'New Quiz',
      'quiz.correct':   'correct',
      'quiz.nobook':    'Please select a textbook from the sidebar first.',

      // Progress
      'prog.questions': 'Questions',
      'prog.quizzes':   'Quizzes',
      'prog.avgscore':  'Avg Score',
      'prog.streak':    'Day Streak',
      'prog.subjects':  '📚 Questions by Subject',
      'prog.activity':  '📅 Activity (Last 7 Days)',
      'prog.bookmarks': '🔖 Bookmarked Answers',
      'prog.nobm':      'No bookmarks yet.',

      // Search
      'search.placeholder': 'Search textbook content semantically…',
      'search.btn':         'Search',
      'search.noresult':    'No results found.',
      'search.relevance':   'Relevance',

      // Admin
      'admin.upload':    'Upload Textbook PDF',
      'admin.books':     'Manage Books',
      'admin.analytics': 'Analytics',
      'admin.students':  'Students',
      'admin.settings':  'Settings',
      'admin.dropzone':  'Click to choose PDF or drag & drop here',
      'admin.maxsize':   'Max 50MB · PDF only',
      'admin.uploading': 'Uploading PDF…',

      // General
      'btn.delete':  'Delete',
      'btn.refresh': '🔄 Refresh',
      'btn.clear':   'Clear',
      'lbl.loading': 'Loading…',
      'lbl.never':   'Never',
      'lbl.or':      'or',
      'lbl.cached':  'Cached',
    },

    hi: {
      // Navigation
      'nav.ask':        'प्रश्न पूछें',
      'nav.history':    'मेरा इतिहास',
      'nav.quiz':       'प्रश्नोत्तरी',
      'nav.search':     'किताबें खोजें',
      'nav.progress':   'मेरी प्रगति',
      'nav.signout':    'साइन आउट',

      // Chat
      'chat.placeholder':   'यहाँ अपना प्रश्न लिखें…',
      'chat.send':          'भेजें',
      'chat.welcome.title': 'नमस्ते! 🙏',
      'chat.welcome.sub':   'अपनी पाठ्यपुस्तकों के बारे में कुछ भी पूछें।',
      'chat.thinking':      'सोच रहा हूँ…',
      'chat.cached':        '⚡ कैश्ड',
      'chat.error.nobook':  'कोई प्रासंगिक सामग्री नहीं मिली। कृपया पाठ्यपुस्तक अपलोड करें।',
      'chat.error.llm':     'AI ट्यूटर अभी उपलब्ध नहीं है। कृपया बाद में पुनः प्रयास करें।',

      // Answer sections
      'ans.explanation':  '📘 व्याख्या',
      'ans.example':      '💡 उदाहरण',
      'ans.summary':      '📝 सारांश',
      'ans.practice':     '✏️ अभ्यास प्रश्न',

      // Auth
      'auth.login':        'लॉग इन करें',
      'auth.register':     'खाता बनाएं',
      'auth.email':        'ईमेल पता',
      'auth.password':     'पासवर्ड',
      'auth.name':         'पूरा नाम',
      'auth.newhere':      'नए हैं?',
      'auth.haveacc':      'पहले से खाता है?',
      'auth.role.student': 'छात्र',
      'auth.role.admin':   'शिक्षक / एडमिन',

      // Quiz
      'quiz.generate':  'प्रश्नोत्तरी बनाएं',
      'quiz.topic':     'विषय (वैकल्पिक)',
      'quiz.numq':      'प्रश्नों की संख्या',
      'quiz.submit':    'उत्तर जमा करें',
      'quiz.newquiz':   'नई प्रश्नोत्तरी',
      'quiz.correct':   'सही',
      'quiz.nobook':    'कृपया पहले साइडबार से एक पाठ्यपुस्तक चुनें।',

      // Progress
      'prog.questions': 'प्रश्न',
      'prog.quizzes':   'प्रश्नोत्तरी',
      'prog.avgscore':  'औसत स्कोर',
      'prog.streak':    'दिन की लकीर',
      'prog.subjects':  '📚 विषय के अनुसार प्रश्न',
      'prog.activity':  '📅 गतिविधि (अंतिम 7 दिन)',
      'prog.bookmarks': '🔖 बुकमार्क किए गए उत्तर',
      'prog.nobm':      'अभी कोई बुकमार्क नहीं।',

      // Search
      'search.placeholder': 'पाठ्यपुस्तक में अर्थपूर्ण खोज करें…',
      'search.btn':         'खोजें',
      'search.noresult':    'कोई परिणाम नहीं मिला।',
      'search.relevance':   'प्रासंगिकता',

      // Admin
      'admin.upload':    'पाठ्यपुस्तक PDF अपलोड करें',
      'admin.books':     'किताबें प्रबंधित करें',
      'admin.analytics': 'विश्लेषण',
      'admin.students':  'छात्र',
      'admin.settings':  'सेटिंग्स',
      'admin.dropzone':  'PDF चुनने के लिए क्लिक करें या यहाँ खींचें',
      'admin.maxsize':   'अधिकतम 50MB · केवल PDF',
      'admin.uploading': 'PDF अपलोड हो रही है…',

      // General
      'btn.delete':  'हटाएं',
      'btn.refresh': '🔄 रीफ्रेश',
      'btn.clear':   'साफ करें',
      'lbl.loading': 'लोड हो रहा है…',
      'lbl.never':   'कभी नहीं',
      'lbl.or':      'या',
      'lbl.cached':  'कैश्ड',
    },
  };

  let currentLang = localStorage.getItem('edu_lang') || 'en';

  return {
    /** Get translation for key in current language */
    t(key) {
      return strings[currentLang]?.[key]
          || strings['en']?.[key]
          || key;
    },

    /** Change active language and re-render data-i18n elements */
    setLang(lang) {
      if (!strings[lang]) return;
      currentLang = lang;
      localStorage.setItem('edu_lang', lang);
      this.applyToDOM();
    },

    getLang() { return currentLang; },

    /**
     * Apply translations to all elements with data-i18n="key" attribute.
     * Also updates placeholder on inputs/textareas with data-i18n-placeholder.
     */
    applyToDOM() {
      document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        el.textContent = this.t(key);
      });
      document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
        const key = el.getAttribute('data-i18n-placeholder');
        el.placeholder = this.t(key);
      });
      document.querySelectorAll('[data-i18n-title]').forEach(el => {
        const key = el.getAttribute('data-i18n-title');
        el.title = this.t(key);
      });
    },

    /** Available languages */
    languages: { en: 'English', hi: 'हिंदी' },
  };
})();

// Auto-apply on script load
document.addEventListener('DOMContentLoaded', () => i18n.applyToDOM());
