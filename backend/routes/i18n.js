/**
 * Internationalization API Routes
 * Provides language support and translations
 */

const express = require('express');
const router = express.Router();
const {
  getTranslations,
  getSupportedLanguages,
  getLocalizedCategories,
  getLocalizedStatuses,
  getLocalizedPriorities
} = require('../utils/i18n');
const { asyncHandler } = require('../middleware/errorHandler');

/**
 * @route   GET /api/i18n/languages
 * @desc    Get supported languages
 * @access  Public
 */
router.get('/languages', asyncHandler(async (req, res) => {
  const languages = getSupportedLanguages();
  
  res.json({
    success: true,
    languages
  });
}));

/**
 * @route   GET /api/i18n/translations
 * @desc    Get all translations for a language
 * @access  Public
 */
router.get('/translations', asyncHandler(async (req, res) => {
  const { lang = 'en' } = req.query;
  
  const translations = getTranslations(lang);
  
  res.json({
    success: true,
    language: lang,
    translations
  });
}));

/**
 * @route   GET /api/i18n/categories
 * @desc    Get localized category list
 * @access  Public
 */
router.get('/categories', asyncHandler(async (req, res) => {
  const { lang = 'en' } = req.query;
  
  const categories = getLocalizedCategories(lang);
  
  res.json({
    success: true,
    language: lang,
    categories
  });
}));

/**
 * @route   GET /api/i18n/statuses
 * @desc    Get localized status list
 * @access  Public
 */
router.get('/statuses', asyncHandler(async (req, res) => {
  const { lang = 'en' } = req.query;
  
  const statuses = getLocalizedStatuses(lang);
  
  res.json({
    success: true,
    language: lang,
    statuses
  });
}));

/**
 * @route   GET /api/i18n/priorities
 * @desc    Get localized priority list
 * @access  Public
 */
router.get('/priorities', asyncHandler(async (req, res) => {
  const { lang = 'en' } = req.query;
  
  const priorities = getLocalizedPriorities(lang);
  
  res.json({
    success: true,
    language: lang,
    priorities
  });
}));

module.exports = router;
