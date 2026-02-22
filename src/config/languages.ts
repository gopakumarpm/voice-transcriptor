export interface Language {
  code: string;
  name: string;
  nativeName: string;
  group: 'indian' | 'european' | 'asian' | 'middle-eastern' | 'other';
}

export const LANGUAGES: Language[] = [
  // Indian Languages
  { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी', group: 'indian' },
  { code: 'bn', name: 'Bengali', nativeName: 'বাংলা', group: 'indian' },
  { code: 'te', name: 'Telugu', nativeName: 'తెలుగు', group: 'indian' },
  { code: 'mr', name: 'Marathi', nativeName: 'मराठी', group: 'indian' },
  { code: 'ta', name: 'Tamil', nativeName: 'தமிழ்', group: 'indian' },
  { code: 'gu', name: 'Gujarati', nativeName: 'ગુજરાતી', group: 'indian' },
  { code: 'kn', name: 'Kannada', nativeName: 'ಕನ್ನಡ', group: 'indian' },
  { code: 'ml', name: 'Malayalam', nativeName: 'മലയാളം', group: 'indian' },
  { code: 'pa', name: 'Punjabi', nativeName: 'ਪੰਜਾਬੀ', group: 'indian' },
  { code: 'or', name: 'Odia', nativeName: 'ଓଡ଼ିଆ', group: 'indian' },
  { code: 'as', name: 'Assamese', nativeName: 'অসমীয়া', group: 'indian' },
  { code: 'ur', name: 'Urdu', nativeName: 'اردو', group: 'indian' },
  { code: 'ne', name: 'Nepali', nativeName: 'नेपाली', group: 'indian' },
  { code: 'si', name: 'Sinhala', nativeName: 'සිංහල', group: 'indian' },
  { code: 'sa', name: 'Sanskrit', nativeName: 'संस्कृतम्', group: 'indian' },

  // European Languages
  { code: 'en', name: 'English', nativeName: 'English', group: 'european' },
  { code: 'es', name: 'Spanish', nativeName: 'Español', group: 'european' },
  { code: 'fr', name: 'French', nativeName: 'Français', group: 'european' },
  { code: 'de', name: 'German', nativeName: 'Deutsch', group: 'european' },
  { code: 'it', name: 'Italian', nativeName: 'Italiano', group: 'european' },
  { code: 'pt', name: 'Portuguese', nativeName: 'Português', group: 'european' },
  { code: 'ru', name: 'Russian', nativeName: 'Русский', group: 'european' },
  { code: 'nl', name: 'Dutch', nativeName: 'Nederlands', group: 'european' },
  { code: 'pl', name: 'Polish', nativeName: 'Polski', group: 'european' },
  { code: 'uk', name: 'Ukrainian', nativeName: 'Українська', group: 'european' },
  { code: 'cs', name: 'Czech', nativeName: 'Čeština', group: 'european' },
  { code: 'sv', name: 'Swedish', nativeName: 'Svenska', group: 'european' },
  { code: 'da', name: 'Danish', nativeName: 'Dansk', group: 'european' },
  { code: 'fi', name: 'Finnish', nativeName: 'Suomi', group: 'european' },
  { code: 'no', name: 'Norwegian', nativeName: 'Norsk', group: 'european' },
  { code: 'el', name: 'Greek', nativeName: 'Ελληνικά', group: 'european' },
  { code: 'ro', name: 'Romanian', nativeName: 'Română', group: 'european' },
  { code: 'hu', name: 'Hungarian', nativeName: 'Magyar', group: 'european' },

  // Asian Languages
  { code: 'zh', name: 'Chinese', nativeName: '中文', group: 'asian' },
  { code: 'ja', name: 'Japanese', nativeName: '日本語', group: 'asian' },
  { code: 'ko', name: 'Korean', nativeName: '한국어', group: 'asian' },
  { code: 'th', name: 'Thai', nativeName: 'ไทย', group: 'asian' },
  { code: 'vi', name: 'Vietnamese', nativeName: 'Tiếng Việt', group: 'asian' },
  { code: 'id', name: 'Indonesian', nativeName: 'Bahasa Indonesia', group: 'asian' },
  { code: 'ms', name: 'Malay', nativeName: 'Bahasa Melayu', group: 'asian' },
  { code: 'tl', name: 'Filipino', nativeName: 'Filipino', group: 'asian' },
  { code: 'my', name: 'Myanmar', nativeName: 'မြန်မာ', group: 'asian' },

  // Middle Eastern Languages
  { code: 'ar', name: 'Arabic', nativeName: 'العربية', group: 'middle-eastern' },
  { code: 'fa', name: 'Persian', nativeName: 'فارسی', group: 'middle-eastern' },
  { code: 'tr', name: 'Turkish', nativeName: 'Türkçe', group: 'middle-eastern' },
  { code: 'he', name: 'Hebrew', nativeName: 'עברית', group: 'middle-eastern' },

  // Other
  { code: 'sw', name: 'Swahili', nativeName: 'Kiswahili', group: 'other' },
  { code: 'af', name: 'Afrikaans', nativeName: 'Afrikaans', group: 'other' },
];

export const LANGUAGE_GROUPS = {
  indian: 'Indian Languages',
  european: 'European Languages',
  asian: 'Asian Languages',
  'middle-eastern': 'Middle Eastern Languages',
  other: 'Other Languages',
} as const;
