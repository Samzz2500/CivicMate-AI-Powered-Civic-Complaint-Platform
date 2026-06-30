const express = require("express");
const router = express.Router();
const Tweet = require("../models/Tweet");
const User = require("../models/User");
const { authMiddleware } = require("../middleware/auth");
const { asyncHandler, AppError } = require("../middleware/errorHandler");
const logger = require("../utils/logger");

// Conversation history storage (in production, use Redis or MongoDB)
const conversationHistory = new Map();

// System prompt for civic assistant
const SYSTEM_PROMPT = `You are CivicMate, an AI assistant for a civic engagement platform called "Shahar Sahayya Kranti". 
Your role is to help citizens report and track civic issues like potholes, garbage, street lights, water supply, sewage, etc.

Be helpful, concise, and guide users on:
1. How to report civic issues
2. What information to include in reports
3. How to track complaint status
4. General civic services information
5. Answer questions about their specific complaints

Keep responses under 200 words. Be friendly and encouraging. Support both English and Marathi.`;

/**
 * @swagger
 * /api/chatbot/chat:
 *   post:
 *     summary: Chat with AI assistant
 *     tags: [Chatbot]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - message
 *             properties:
 *               message:
 *                 type: string
 *                 example: How do I report a pothole?
 *               sessionId:
 *                 type: string
 *                 description: Optional session ID for conversation history
 *     responses:
 *       200:
 *         description: AI response
 */
router.post("/chat", authMiddleware, asyncHandler(async (req, res) => {
    const userMessage = req.body.message;
    const sessionId = req.body.sessionId || req.user.id;

    if (!userMessage) {
        throw new AppError("Message is required", 400);
    }

    try {
        // Get user's complaints for context
        const userComplaints = await Tweet.find({ user: req.user.id })
            .sort({ createdAt: -1 })
            .limit(5)
            .select('title category completed createdAt');

        // Get conversation history
        let history = conversationHistory.get(sessionId) || [];
        
        // Add user message to history
        history.push({ role: 'user', content: userMessage });
        
        // Keep only last 10 messages
        if (history.length > 10) {
            history = history.slice(-10);
        }

        // Build context with user data
        const contextPrompt = `
User Context:
- User has ${userComplaints.length} complaints
${userComplaints.length > 0 ? `- Recent complaints: ${userComplaints.map(c => `${c.title} (${c.category}, ${c.completed})`).join(', ')}` : ''}

User Question: ${userMessage}
`;

        // Try multiple AI APIs
        let aiReply = null;
        let source = null;

        // 1. Try Groq
        const GROQ_API_KEY = process.env.GROQ_API_KEY;
        if (GROQ_API_KEY && !aiReply) {
            try {
                const groqResponse = await fetch('https://api.groq.com/openai/v1/chat/completions', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${GROQ_API_KEY}`,
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        model: "llama-3.3-70b-versatile",
                        messages: [
                            { role: "system", content: SYSTEM_PROMPT },
                            ...history.slice(-6), // Last 6 messages for context
                            { role: "user", content: contextPrompt }
                        ],
                        max_tokens: 300,
                        temperature: 0.7
                    })
                });

                if (groqResponse.ok) {
                    const data = await groqResponse.json();
                    if (data.choices && data.choices[0]?.message?.content) {
                        aiReply = data.choices[0].message.content;
                        source = "AI (Groq)";
                    }
                }
            } catch (error) {
                logger.warn("Groq API failed", { error: error.message });
            }
        }
        
        // 2. Try OpenRouter
        const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
        if (OPENROUTER_API_KEY && !aiReply) {
            try {
                const openrouterResponse = await fetch('https://openrouter.ai/api/v1/chat/completions', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
                        'Content-Type': 'application/json',
                        'HTTP-Referer': process.env.FRONTEND_URL || 'http://localhost:5000',
                        'X-Title': 'Shahar Sahayya Kranti'
                    },
                    body: JSON.stringify({
                        model: "meta-llama/llama-3.2-3b-instruct:free",
                        messages: [
                            { role: "system", content: SYSTEM_PROMPT },
                            ...history.slice(-6),
                            { role: "user", content: contextPrompt }
                        ],
                        max_tokens: 300,
                        temperature: 0.7
                    })
                });

                if (openrouterResponse.ok) {
                    const data = await openrouterResponse.json();
                    if (data.choices && data.choices[0]?.message?.content) {
                        aiReply = data.choices[0].message.content;
                        source = "AI (OpenRouter)";
                    }
                }
            } catch (error) {
                logger.warn("OpenRouter API failed", { error: error.message });
            }
        }

        // Fallback to intelligent response
        if (!aiReply) {
            aiReply = getIntelligentResponse(userMessage, userComplaints);
            source = "Smart Assistant";
        }

        // Add assistant response to history
        history.push({ role: 'assistant', content: aiReply });
        conversationHistory.set(sessionId, history);

        // Auto-cleanup old sessions (keep for 1 hour)
        setTimeout(() => {
            conversationHistory.delete(sessionId);
        }, 60 * 60 * 1000);

        logger.info("✅ Chatbot response generated", { 
            userId: req.user.id,
            messageLength: userMessage.length,
            source
        });
        
        return res.json({ 
            success: true, 
            reply: aiReply,
            source,
            sessionId,
            hasHistory: history.length > 2
        });
        
    } catch (error) {
        logger.warn("⚠️ Using intelligent fallback", { error: error.message });
        
        const userComplaints = await Tweet.find({ user: req.user.id })
            .sort({ createdAt: -1 })
            .limit(5);
        
        const reply = getIntelligentResponse(userMessage, userComplaints);
        
        return res.json({ 
            success: true, 
            reply: reply,
            source: "Smart Assistant",
            sessionId
        });
    }
}));

/**
 * @swagger
 * /api/chatbot/clear-history:
 *   post:
 *     summary: Clear conversation history
 *     tags: [Chatbot]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               sessionId:
 *                 type: string
 *     responses:
 *       200:
 *         description: History cleared
 */
router.post("/clear-history", authMiddleware, asyncHandler(async (req, res) => {
    const sessionId = req.body.sessionId || req.user.id;
    conversationHistory.delete(sessionId);
    
    res.json({
        success: true,
        message: "Conversation history cleared"
    });
}));

/**
 * @swagger
 * /api/chatbot/quick-actions:
 *   get:
 *     summary: Get quick action suggestions
 *     tags: [Chatbot]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Quick actions
 */
router.get("/quick-actions", authMiddleware, asyncHandler(async (req, res) => {
    const userComplaints = await Tweet.find({ user: req.user.id });
    const pendingCount = userComplaints.filter(c => c.completed === 'pending').length;
    const completedCount = userComplaints.filter(c => c.completed === 'completed').length;

    const actions = [
        {
            id: 'report_pothole',
            label: 'Report a Pothole',
            icon: '🚧',
            action: 'navigate',
            target: '/create-tweet?category=potholes'
        },
        {
            id: 'report_garbage',
            label: 'Report Garbage Issue',
            icon: '🗑️',
            action: 'navigate',
            target: '/create-tweet?category=garbage'
        },
        {
            id: 'check_status',
            label: `Check My Complaints (${userComplaints.length})`,
            icon: '📊',
            action: 'navigate',
            target: '/profile'
        }
    ];

    if (pendingCount > 0) {
        actions.push({
            id: 'pending_complaints',
            label: `View Pending (${pendingCount})`,
            icon: '🟡',
            action: 'navigate',
            target: '/profile?filter=pending'
        });
    }

    if (completedCount > 0) {
        actions.push({
            id: 'rate_service',
            label: 'Rate Completed Services',
            icon: '⭐',
            action: 'navigate',
            target: '/profile?filter=completed'
        });
    }

    res.json({
        success: true,
        actions
    });
}));

// Enhanced intelligent response system
function getIntelligentResponse(message, userComplaints = []) {
    const lowerMessage = message.toLowerCase();
    
    // Check for user's complaint queries
    if (lowerMessage.match(/\b(my|mine|status|track)\b/) && userComplaints.length > 0) {
        const pending = userComplaints.filter(c => c.completed === 'pending').length;
        const inProgress = userComplaints.filter(c => c.completed === 'in-progress').length;
        const completed = userComplaints.filter(c => c.completed === 'completed').length;
        
        return `📊 Your Complaints Summary:\n\n` +
               `Total: ${userComplaints.length}\n` +
               `🟡 Pending: ${pending}\n` +
               `🔵 In Progress: ${inProgress}\n` +
               `🟢 Completed: ${completed}\n\n` +
               `Visit your Profile to see detailed status of each complaint!`;
    }
    
    // Greetings
    if (lowerMessage.match(/\b(hello|hi|hey|greetings|namaste)\b/)) {
        return "Hello! 👋 I'm CivicMate, your AI assistant for civic issues. I can help you report potholes, garbage, street lights, water supply issues, and more. What would you like to know?";
    }
    
    // Help
    if (lowerMessage.match(/\b(help|what can you do|capabilities)\b/)) {
        return "I can help you with:\n\n🚧 Report potholes & road damage\n🗑️ Report garbage & waste issues\n💡 Report street light problems\n💧 Report water supply issues\n🚰 Report sewage & drainage\n📊 Track your complaint status\n📝 Guide you through the reporting process\n\nWhat would you like to do?";
    }
    
    // Pothole
    if (lowerMessage.match(/\b(pothole|road|crack|damage)\b/)) {
        return "🚧 To report a pothole:\n\n1. Click 'Create Tweet'\n2. Title: 'Pothole at [Location]'\n3. Describe size and severity\n4. Upload a clear photo\n5. Add exact location\n6. Submit\n\n💡 Tip: Include nearby landmarks for faster response!";
    }
    
    // Garbage
    if (lowerMessage.match(/\b(garbage|trash|waste|bin)\b/)) {
        return "🗑️ To report garbage issues:\n\n1. Click 'Create Tweet'\n2. Describe the problem (overflowing bins, uncollected waste, etc.)\n3. Upload photo\n4. Specify location\n5. Submit\n\nAuthorities will be notified within 24 hours!";
    }
    
    // Street light
    if (lowerMessage.match(/\b(street light|streetlight|light|lamp)\b/)) {
        return "💡 To report street light issues:\n\n1. Create a tweet\n2. Mention 'Street Light' in title\n3. Describe problem (not working, broken, flickering)\n4. Add photo if possible\n5. Provide location\n6. Submit\n\nElectrical department will be notified!";
    }
    
    // Water
    if (lowerMessage.match(/\b(water|leak|pipe|supply)\b/)) {
        return "💧 To report water issues:\n\n1. Create a tweet\n2. Select 'Water Leakage' category\n3. Describe the issue\n4. Upload photo showing the problem\n5. Provide exact location\n6. Submit\n\nWater department will respond quickly!";
    }
    
    // Status
    if (lowerMessage.match(/\b(status|check|track|progress)\b/)) {
        return "📊 To check your complaint status:\n\n1. Go to your Profile\n2. Click 'My Tweets'\n3. View status:\n   🟡 Pending\n   🔵 In Progress\n   🟢 Resolved\n\nYou'll see updates from authorities in real-time!";
    }
    
    // How to report
    if (lowerMessage.match(/\b(how to|how do i|report|file|submit)\b/)) {
        return "📝 How to file a complaint:\n\n1. Login to your account\n2. Click 'Create Tweet'\n3. Fill in:\n   • Clear title\n   • Detailed description\n   • Upload photo\n   • Exact location\n4. Submit\n\nYour report goes directly to authorities!";
    }
    
    // Marathi support
    if (lowerMessage.match(/\b(marathi|मराठी)\b/)) {
        return "नमस्कार! 🙏 मी CivicMate आहे. मी तुम्हाला नागरी समस्यांसाठी मदत करू शकतो:\n\n🚧 खड्डे\n🗑️ कचरा\n💡 रस्त्यावरील दिवे\n💧 पाणी पुरवठा\n🚰 गटार\n\nतुम्हाला काय मदत हवी आहे?";
    }
    
    // Default
    return "I'm here to help with civic issues! 🏙️\n\nYou can ask me about:\n• Reporting potholes, garbage, or street lights\n• Checking complaint status\n• How to file a report\n• Water or sewage issues\n\nWhat would you like to know?";
}

module.exports = router;
