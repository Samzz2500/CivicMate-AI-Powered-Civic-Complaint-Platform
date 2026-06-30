const axios = require('axios');
const fs = require('fs');
const path = require('path');

/**
 * Verify image using AI API (Groq Vision)
 * Checks for NSFW content and civic relevance
 */
const verifyImageWithAI = async (imagePath) => {
  try {
    const apiKey = process.env.GROQ_API_KEY;
    
    if (!apiKey) {
      console.log('No GROQ API key found, using fallback verification');
      return fallbackVerification();
    }

    // Read image and convert to base64
    const imageBuffer = fs.readFileSync(imagePath);
    const base64Image = imageBuffer.toString('base64');
    const mimeType = getMimeType(imagePath);

    // Call Groq Vision API
    const response = await axios.post(
      'https://api.groq.com/openai/v1/chat/completions',
      {
        model: 'llava-v1.5-7b-4096-preview',
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: `Analyze this image and determine:
1. Is it NSFW/inappropriate/explicit content? (nudity, violence, etc.)
2. Is it related to civic issues? (potholes, garbage, street lights, drainage, water leakage, public washroom, infrastructure problems)
3. What category does it belong to?

Respond ONLY in valid JSON format:
{
  "nsfw": boolean,
  "civic": boolean,
  "category": "potholes|streetlight|garbage|drainage|water_leakage|public washroom|others",
  "confidence": number (0-100),
  "description": "brief description"
}`
              },
              {
                type: 'image_url',
                image_url: {
                  url: `data:${mimeType};base64,${base64Image}`
                }
              }
            ]
          }
        ],
        temperature: 0.1,
        max_tokens: 300
      },
      {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        timeout: 30000
      }
    );

    // Parse AI response
    const content = response.data.choices[0].message.content;
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    
    if (!jsonMatch) {
      console.log('Could not parse AI response, using fallback');
      return fallbackVerification();
    }

    const result = JSON.parse(jsonMatch[0]);
    
    return {
      nsfw: result.nsfw || false,
      civic: result.civic !== false, // Default to true
      category: result.category || 'others',
      confidence: result.confidence || 50,
      description: result.description || '',
      source: 'Groq AI',
      verified: true
    };

  } catch (error) {
    console.error('AI verification error:', error.message);
    return fallbackVerification();
  }
};

/**
 * Verify complaint text using AI
 */
const verifyComplaintText = async (title, description, category) => {
  try {
    const apiKey = process.env.GROQ_API_KEY;
    
    if (!apiKey) {
      return { verified: true, confidence: 0, reason: 'No AI verification' };
    }

    const response = await axios.post(
      'https://api.groq.com/openai/v1/chat/completions',
      {
        model: 'mixtral-8x7b-32768',
        messages: [
          {
            role: 'user',
            content: `Analyze this civic complaint and determine if it's legitimate:

Title: ${title}
Description: ${description}
Category: ${category}

Check for:
1. Is it a real civic issue?
2. Is the description meaningful and not spam?
3. Does it match the category?
4. Is it appropriate content?

Respond ONLY in valid JSON format:
{
  "verified": boolean,
  "confidence": number (0-100),
  "reason": "brief explanation",
  "suggestedCategory": "potholes|streetlight|garbage|drainage|water_leakage|public washroom|others",
  "isSpam": boolean
}`
          }
        ],
        temperature: 0.1,
        max_tokens: 300
      },
      {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        timeout: 15000
      }
    );

    const content = response.data.choices[0].message.content;
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    
    if (!jsonMatch) {
      return { verified: true, confidence: 0, reason: 'Could not parse AI response' };
    }

    const result = JSON.parse(jsonMatch[0]);
    
    return {
      verified: result.verified !== false,
      confidence: result.confidence || 50,
      reason: result.reason || 'AI verification passed',
      suggestedCategory: result.suggestedCategory || category,
      isSpam: result.isSpam || false
    };

  } catch (error) {
    console.error('AI text verification error:', error.message);
    return { verified: true, confidence: 0, reason: 'Verification unavailable' };
  }
};

/**
 * Comprehensive complaint verification (text + image)
 */
const verifyComplaint = async (title, description, category, imagePath = null) => {
  try {
    // 1. Verify text
    const textVerification = await verifyComplaintText(title, description, category);
    
    if (textVerification.isSpam || (!textVerification.verified && textVerification.confidence > 70)) {
      return {
        success: false,
        verified: false,
        reason: textVerification.reason,
        confidence: textVerification.confidence
      };
    }

    // 2. Verify image if provided
    let imageVerification = null;
    if (imagePath && fs.existsSync(imagePath)) {
      imageVerification = await verifyImageWithAI(imagePath);
      
      if (imageVerification.nsfw) {
        return {
          success: false,
          verified: false,
          reason: 'Image contains inappropriate content',
          nsfw: true
        };
      }
    }

    // 3. Combine results
    return {
      success: true,
      verified: true,
      textVerification,
      imageVerification,
      suggestedCategory: imageVerification?.category || textVerification.suggestedCategory || category,
      confidence: Math.max(
        textVerification.confidence || 0,
        imageVerification?.confidence || 0
      )
    };

  } catch (error) {
    console.error('Complaint verification error:', error.message);
    return {
      success: true,
      verified: true,
      reason: 'Verification unavailable',
      confidence: 0
    };
  }
};

/**
 * Fallback verification when AI is unavailable
 */
const fallbackVerification = () => {
  return {
    nsfw: false,
    civic: true,
    category: 'others',
    confidence: 0,
    description: 'Fallback verification',
    source: 'fallback',
    verified: true
  };
};

/**
 * Get MIME type from file extension
 */
const getMimeType = (filePath) => {
  const ext = path.extname(filePath).toLowerCase();
  const mimeTypes = {
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.webp': 'image/webp'
  };
  return mimeTypes[ext] || 'image/jpeg';
};

/**
 * Check for spam/duplicate complaints
 */
const checkForSpam = async (userId, title, description) => {
  try {
    const Tweet = require('../models/Tweet');
    
    // Check if user submitted too many complaints recently (last 24 hours)
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const recentComplaints = await Tweet.find({
      user: userId,
      createdAt: { $gte: oneDayAgo }
    });

    // Spam detection: more than 10 complaints in 24 hours
    if (recentComplaints.length >= 10) {
      return { 
        isSpam: true, 
        reason: 'Too many complaints submitted in 24 hours. Please wait before submitting more.' 
      };
    }

    // Check for duplicate title (exact match)
    const duplicateTitle = recentComplaints.find(c => 
      c.title.toLowerCase().trim() === title.toLowerCase().trim()
    );

    if (duplicateTitle) {
      return { 
        isSpam: true, 
        reason: 'You have already submitted a complaint with this title recently.' 
      };
    }

    // Check for very similar descriptions (simple check)
    const similarDescription = recentComplaints.find(c => {
      const similarity = calculateSimilarity(
        c.description.toLowerCase(),
        description.toLowerCase()
      );
      return similarity > 0.9; // 90% similar
    });

    if (similarDescription) {
      return { 
        isSpam: true, 
        reason: 'You have already submitted a very similar complaint recently.' 
      };
    }

    return { isSpam: false };

  } catch (error) {
    console.error('Spam check error:', error.message);
    return { isSpam: false }; // Allow on error
  }
};

/**
 * Calculate text similarity (simple Jaccard similarity)
 */
const calculateSimilarity = (text1, text2) => {
  const words1 = new Set(text1.split(/\s+/));
  const words2 = new Set(text2.split(/\s+/));
  
  const intersection = new Set([...words1].filter(x => words2.has(x)));
  const union = new Set([...words1, ...words2]);
  
  return intersection.size / union.size;
};

module.exports = {
  verifyImageWithAI,
  verifyComplaintText,
  verifyComplaint,
  checkForSpam,
  fallbackVerification
};
