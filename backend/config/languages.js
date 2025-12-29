module.exports = {
  SUPPORTED_LANGUAGES: {
    en: { code: 'en', name: 'English', native: 'English' },
    hi: { code: 'hi', name: 'Hindi', native: 'हिन्दी' }
  },
  
  DEFAULT_LANGUAGE: 'en',
  
  getLanguage(code) {
    return this.SUPPORTED_LANGUAGES[code] || this.SUPPORTED_LANGUAGES[this.DEFAULT_LANGUAGE];
  },
  
  getAllLanguages() {
    return Object.values(this.SUPPORTED_LANGUAGES);
  }
};