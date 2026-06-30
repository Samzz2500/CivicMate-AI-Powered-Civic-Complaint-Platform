/**
 * Internationalization (i18n) Service
 * Provides multi-language support for the platform
 */

// Language translations
const translations = {
  en: {
    // Common
    'common.welcome': 'Welcome',
    'common.hello': 'Hello',
    'common.thankyou': 'Thank you',
    'common.submit': 'Submit',
    'common.cancel': 'Cancel',
    'common.save': 'Save',
    'common.delete': 'Delete',
    'common.edit': 'Edit',
    'common.view': 'View',
    'common.search': 'Search',
    'common.filter': 'Filter',
    'common.loading': 'Loading...',
    'common.error': 'Error',
    'common.success': 'Success',
    
    // Authentication
    'auth.login': 'Login',
    'auth.register': 'Register',
    'auth.logout': 'Logout',
    'auth.email': 'Email',
    'auth.password': 'Password',
    'auth.username': 'Username',
    'auth.name': 'Full Name',
    'auth.phone': 'Phone Number',
    'auth.forgotPassword': 'Forgot Password?',
    'auth.loginSuccess': 'Login successful',
    'auth.registerSuccess': 'Registration successful',
    'auth.invalidCredentials': 'Invalid credentials',
    
    // Complaints
    'complaint.title': 'Complaint Title',
    'complaint.description': 'Description',
    'complaint.category': 'Category',
    'complaint.location': 'Location',
    'complaint.status': 'Status',
    'complaint.priority': 'Priority',
    'complaint.image': 'Upload Image',
    'complaint.submit': 'Submit Complaint',
    'complaint.created': 'Complaint created successfully',
    'complaint.updated': 'Complaint updated successfully',
    'complaint.deleted': 'Complaint deleted successfully',
    'complaint.notFound': 'Complaint not found',
    
    // Status
    'status.pending': 'Pending',
    'status.inProgress': 'In Progress',
    'status.completed': 'Completed',
    'status.rejected': 'Rejected',
    
    // Priority
    'priority.low': 'Low',
    'priority.medium': 'Medium',
    'priority.high': 'High',
    'priority.critical': 'Critical',
    
    // Categories
    'category.potholes': 'Potholes',
    'category.streetlights': 'Street Lights',
    'category.garbage': 'Garbage',
    'category.waterSupply': 'Water Supply',
    'category.sewage': 'Sewage',
    'category.roads': 'Roads',
    'category.parks': 'Parks',
    'category.publicToilets': 'Public Toilets',
    'category.other': 'Other',
    
    // Notifications
    'notification.new': 'New Notification',
    'notification.statusChanged': 'Status Changed',
    'notification.commentAdded': 'New Comment',
    'notification.complaintAssigned': 'Complaint Assigned',
    'notification.feedbackRequest': 'Feedback Request',
    
    // Feedback
    'feedback.rate': 'Rate this service',
    'feedback.comment': 'Your feedback',
    'feedback.submit': 'Submit Feedback',
    'feedback.thankyou': 'Thank you for your feedback',
    
    // Dashboard
    'dashboard.overview': 'Overview',
    'dashboard.totalComplaints': 'Total Complaints',
    'dashboard.pendingComplaints': 'Pending Complaints',
    'dashboard.completedComplaints': 'Completed Complaints',
    'dashboard.completionRate': 'Completion Rate',
    
    // Messages
    'message.noData': 'No data available',
    'message.noComplaints': 'No complaints found',
    'message.noNotifications': 'No notifications',
    'message.confirmDelete': 'Are you sure you want to delete?',
    
    // Email subjects
    'email.welcome.subject': 'Welcome to CivicMate',
    'email.complaintReceived.subject': 'Complaint Received',
    'email.statusChanged.subject': 'Complaint Status Updated',
    'email.feedbackRequest.subject': 'Please Rate Our Service',
    'email.weeklyDigest.subject': 'Your Weekly Complaint Summary'
  },
  
  mr: { // Marathi
    // Common
    'common.welcome': 'स्वागत आहे',
    'common.hello': 'नमस्कार',
    'common.thankyou': 'धन्यवाद',
    'common.submit': 'सबमिट करा',
    'common.cancel': 'रद्द करा',
    'common.save': 'जतन करा',
    'common.delete': 'हटवा',
    'common.edit': 'संपादित करा',
    'common.view': 'पहा',
    'common.search': 'शोधा',
    'common.filter': 'फिल्टर',
    'common.loading': 'लोड होत आहे...',
    'common.error': 'त्रुटी',
    'common.success': 'यशस्वी',
    
    // Authentication
    'auth.login': 'लॉगिन',
    'auth.register': 'नोंदणी करा',
    'auth.logout': 'लॉगआउट',
    'auth.email': 'ईमेल',
    'auth.password': 'पासवर्ड',
    'auth.username': 'वापरकर्तानाव',
    'auth.name': 'पूर्ण नाव',
    'auth.phone': 'फोन नंबर',
    'auth.forgotPassword': 'पासवर्ड विसरलात?',
    'auth.loginSuccess': 'लॉगिन यशस्वी',
    'auth.registerSuccess': 'नोंदणी यशस्वी',
    'auth.invalidCredentials': 'अवैध क्रेडेन्शियल्स',
    
    // Complaints
    'complaint.title': 'तक्रार शीर्षक',
    'complaint.description': 'वर्णन',
    'complaint.category': 'श्रेणी',
    'complaint.location': 'स्थान',
    'complaint.status': 'स्थिती',
    'complaint.priority': 'प्राधान्य',
    'complaint.image': 'फोटो अपलोड करा',
    'complaint.submit': 'तक्रार सबमिट करा',
    'complaint.created': 'तक्रार यशस्वीरित्या तयार केली',
    'complaint.updated': 'तक्रार अपडेट केली',
    'complaint.deleted': 'तक्रार हटवली',
    'complaint.notFound': 'तक्रार सापडली नाही',
    
    // Status
    'status.pending': 'प्रलंबित',
    'status.inProgress': 'प्रगतीपथावर',
    'status.completed': 'पूर्ण झाले',
    'status.rejected': 'नाकारले',
    
    // Priority
    'priority.low': 'कमी',
    'priority.medium': 'मध्यम',
    'priority.high': 'उच्च',
    'priority.critical': 'गंभीर',
    
    // Categories
    'category.potholes': 'खड्डे',
    'category.streetlights': 'रस्त्यावरील दिवे',
    'category.garbage': 'कचरा',
    'category.waterSupply': 'पाणीपुरवठा',
    'category.sewage': 'सांडपाणी',
    'category.roads': 'रस्ते',
    'category.parks': 'उद्याने',
    'category.publicToilets': 'सार्वजनिक शौचालये',
    'category.other': 'इतर',
    
    // Notifications
    'notification.new': 'नवीन सूचना',
    'notification.statusChanged': 'स्थिती बदलली',
    'notification.commentAdded': 'नवीन टिप्पणी',
    'notification.complaintAssigned': 'तक्रार नियुक्त केली',
    'notification.feedbackRequest': 'अभिप्राय विनंती',
    
    // Feedback
    'feedback.rate': 'या सेवेला रेटिंग द्या',
    'feedback.comment': 'तुमचा अभिप्राय',
    'feedback.submit': 'अभिप्राय सबमिट करा',
    'feedback.thankyou': 'तुमच्या अभिप्रायाबद्दल धन्यवाद',
    
    // Dashboard
    'dashboard.overview': 'विहंगावलोकन',
    'dashboard.totalComplaints': 'एकूण तक्रारी',
    'dashboard.pendingComplaints': 'प्रलंबित तक्रारी',
    'dashboard.completedComplaints': 'पूर्ण झालेल्या तक्रारी',
    'dashboard.completionRate': 'पूर्णता दर',
    
    // Messages
    'message.noData': 'डेटा उपलब्ध नाही',
    'message.noComplaints': 'तक्रारी सापडल्या नाहीत',
    'message.noNotifications': 'सूचना नाहीत',
    'message.confirmDelete': 'तुम्हाला खात्री आहे की तुम्ही हटवू इच्छिता?',
    
    // Email subjects
    'email.welcome.subject': 'CivicMate मध्ये आपले स्वागत आहे',
    'email.complaintReceived.subject': 'तक्रार प्राप्त झाली',
    'email.statusChanged.subject': 'तक्रार स्थिती अपडेट केली',
    'email.feedbackRequest.subject': 'कृपया आमच्या सेवेला रेटिंग द्या',
    'email.weeklyDigest.subject': 'तुमचा साप्ताहिक तक्रार सारांश'
  },
  
  hi: { // Hindi
    // Common
    'common.welcome': 'स्वागत है',
    'common.hello': 'नमस्ते',
    'common.thankyou': 'धन्यवाद',
    'common.submit': 'सबमिट करें',
    'common.cancel': 'रद्द करें',
    'common.save': 'सहेजें',
    'common.delete': 'हटाएं',
    'common.edit': 'संपादित करें',
    'common.view': 'देखें',
    'common.search': 'खोजें',
    'common.filter': 'फ़िल्टर',
    'common.loading': 'लोड हो रहा है...',
    'common.error': 'त्रुटि',
    'common.success': 'सफल',
    
    // Authentication
    'auth.login': 'लॉगिन',
    'auth.register': 'पंजीकरण करें',
    'auth.logout': 'लॉगआउट',
    'auth.email': 'ईमेल',
    'auth.password': 'पासवर्ड',
    'auth.username': 'उपयोगकर्ता नाम',
    'auth.name': 'पूरा नाम',
    'auth.phone': 'फोन नंबर',
    'auth.forgotPassword': 'पासवर्ड भूल गए?',
    'auth.loginSuccess': 'लॉगिन सफल',
    'auth.registerSuccess': 'पंजीकरण सफल',
    'auth.invalidCredentials': 'अमान्य क्रेडेंशियल',
    
    // Complaints
    'complaint.title': 'शिकायत शीर्षक',
    'complaint.description': 'विवरण',
    'complaint.category': 'श्रेणी',
    'complaint.location': 'स्थान',
    'complaint.status': 'स्थिति',
    'complaint.priority': 'प्राथमिकता',
    'complaint.image': 'फोटो अपलोड करें',
    'complaint.submit': 'शिकायत सबमिट करें',
    'complaint.created': 'शिकायत सफलतापूर्वक बनाई गई',
    'complaint.updated': 'शिकायत अपडेट की गई',
    'complaint.deleted': 'शिकायत हटाई गई',
    'complaint.notFound': 'शिकायत नहीं मिली',
    
    // Status
    'status.pending': 'लंबित',
    'status.inProgress': 'प्रगति में',
    'status.completed': 'पूर्ण',
    'status.rejected': 'अस्वीकृत',
    
    // Priority
    'priority.low': 'कम',
    'priority.medium': 'मध्यम',
    'priority.high': 'उच्च',
    'priority.critical': 'गंभीर',
    
    // Categories
    'category.potholes': 'गड्ढे',
    'category.streetlights': 'स्ट्रीट लाइट',
    'category.garbage': 'कचरा',
    'category.waterSupply': 'जल आपूर्ति',
    'category.sewage': 'सीवेज',
    'category.roads': 'सड़कें',
    'category.parks': 'पार्क',
    'category.publicToilets': 'सार्वजनिक शौचालय',
    'category.other': 'अन्य',
    
    // Notifications
    'notification.new': 'नई सूचना',
    'notification.statusChanged': 'स्थिति बदली',
    'notification.commentAdded': 'नई टिप्पणी',
    'notification.complaintAssigned': 'शिकायत सौंपी गई',
    'notification.feedbackRequest': 'फीडबैक अनुरोध',
    
    // Feedback
    'feedback.rate': 'इस सेवा को रेट करें',
    'feedback.comment': 'आपकी प्रतिक्रिया',
    'feedback.submit': 'फीडबैक सबमिट करें',
    'feedback.thankyou': 'आपकी प्रतिक्रिया के लिए धन्यवाद',
    
    // Dashboard
    'dashboard.overview': 'अवलोकन',
    'dashboard.totalComplaints': 'कुल शिकायतें',
    'dashboard.pendingComplaints': 'लंबित शिकायतें',
    'dashboard.completedComplaints': 'पूर्ण शिकायतें',
    'dashboard.completionRate': 'पूर्णता दर',
    
    // Messages
    'message.noData': 'कोई डेटा उपलब्ध नहीं',
    'message.noComplaints': 'कोई शिकायत नहीं मिली',
    'message.noNotifications': 'कोई सूचना नहीं',
    'message.confirmDelete': 'क्या आप वाकई हटाना चाहते हैं?',
    
    // Email subjects
    'email.welcome.subject': 'CivicMate में आपका स्वागत है',
    'email.complaintReceived.subject': 'शिकायत प्राप्त हुई',
    'email.statusChanged.subject': 'शिकायत स्थिति अपडेट की गई',
    'email.feedbackRequest.subject': 'कृपया हमारी सेवा को रेट करें',
    'email.weeklyDigest.subject': 'आपका साप्ताहिक शिकायत सारांश'
  }
};

/**
 * Get translation for a key in specified language
 */
const translate = (key, lang = 'en', params = {}) => {
  const langTranslations = translations[lang] || translations['en'];
  let text = langTranslations[key] || translations['en'][key] || key;
  
  // Replace parameters in text
  Object.keys(params).forEach(param => {
    text = text.replace(`{${param}}`, params[param]);
  });
  
  return text;
};

/**
 * Get all translations for a language
 */
const getTranslations = (lang = 'en') => {
  return translations[lang] || translations['en'];
};

/**
 * Get supported languages
 */
const getSupportedLanguages = () => {
  return [
    { code: 'en', name: 'English', nativeName: 'English' },
    { code: 'mr', name: 'Marathi', nativeName: 'मराठी' },
    { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी' }
  ];
};

/**
 * Detect language from request
 */
const detectLanguage = (req) => {
  // Priority: query param > header > user preference > default
  const queryLang = req.query.lang;
  const headerLang = req.headers['accept-language']?.split(',')[0]?.split('-')[0];
  const userLang = req.user?.preferences?.language;
  
  const lang = queryLang || userLang || headerLang || 'en';
  
  // Validate language
  return translations[lang] ? lang : 'en';
};

/**
 * Middleware to add translation function to request
 */
const i18nMiddleware = (req, res, next) => {
  const lang = detectLanguage(req);
  
  req.t = (key, params) => translate(key, lang, params);
  req.lang = lang;
  req.translations = getTranslations(lang);
  
  next();
};

/**
 * Translate complaint data
 */
const translateComplaint = (complaint, lang = 'en') => {
  return {
    ...complaint,
    categoryLabel: translate(`category.${complaint.category}`, lang),
    statusLabel: translate(`status.${complaint.status}`, lang),
    priorityLabel: translate(`priority.${complaint.priority}`, lang)
  };
};

/**
 * Translate notification
 */
const translateNotification = (notification, lang = 'en') => {
  return {
    ...notification,
    title: translate(notification.title, lang),
    message: translate(notification.message, lang)
  };
};

/**
 * Get localized category list
 */
const getLocalizedCategories = (lang = 'en') => {
  const categories = [
    'potholes',
    'streetlights',
    'garbage',
    'waterSupply',
    'sewage',
    'roads',
    'parks',
    'publicToilets',
    'other'
  ];
  
  return categories.map(cat => ({
    value: cat.replace(/([A-Z])/g, '-$1').toLowerCase(),
    label: translate(`category.${cat}`, lang)
  }));
};

/**
 * Get localized status list
 */
const getLocalizedStatuses = (lang = 'en') => {
  const statuses = ['pending', 'inProgress', 'completed', 'rejected'];
  
  return statuses.map(status => ({
    value: status.replace(/([A-Z])/g, '-$1').toLowerCase(),
    label: translate(`status.${status}`, lang)
  }));
};

/**
 * Get localized priority list
 */
const getLocalizedPriorities = (lang = 'en') => {
  const priorities = ['low', 'medium', 'high', 'critical'];
  
  return priorities.map(priority => ({
    value: priority,
    label: translate(`priority.${priority}`, lang)
  }));
};

module.exports = {
  translate,
  getTranslations,
  getSupportedLanguages,
  detectLanguage,
  i18nMiddleware,
  translateComplaint,
  translateNotification,
  getLocalizedCategories,
  getLocalizedStatuses,
  getLocalizedPriorities
};
