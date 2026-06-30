# 🤖 AI Chatbot Setup Guide

## Current Status
Your chatbot is working with an **intelligent fallback system** that provides helpful responses. To enable **real AI responses**, you need to add an API key from one of the free AI providers below.

## ✅ Quick Setup (5 minutes)

### Option 1: Groq (RECOMMENDED - Fastest & Free)

1. **Get API Key:**
   - Visit: https://console.groq.com
   - Sign up with Google/GitHub (free)
   - Go to "API Keys" section
   - Click "Create API Key"
   - Copy the key (starts with `gsk_...`)

2. **Add to .env file:**
   ```
   GROQ_API_KEY=gsk_your_key_here
   ```

3. **Restart backend server**

**Features:**
- ⚡ Super fast responses (< 1 second)
- 🆓 Generous free tier
- 🧠 Uses Llama 3.3 70B model
- ✅ No credit card required

---

### Option 2: OpenRouter (Multiple Models)

1. **Get API Key:**
   - Visit: https://openrouter.ai
   - Sign up (free)
   - Go to "Keys" section
   - Create new key
   - Copy the key (starts with `sk-or-...`)

2. **Add to .env file:**
   ```
   OPENROUTER_API_KEY=sk-or-your_key_here
   ```

3. **Restart backend server**

**Features:**
- 🎯 Access to multiple AI models
- 🆓 Free tier available
- 🔄 Automatic fallback between models

---

### Option 3: Together AI

1. **Get API Key:**
   - Visit: https://api.together.xyz
   - Sign up (free)
   - Go to "API Keys"
   - Create new key
   - Copy the key

2. **Add to .env file:**
   ```
   TOGETHER_API_KEY=your_key_here
   ```

3. **Restart backend server**

**Features:**
- 💰 $25 free credits
- 🚀 Fast inference
- 🧠 Multiple Llama models

---

## 🔧 How It Works

The chatbot tries AI providers in this order:

1. **Groq** (if API key exists)
2. **OpenRouter** (if API key exists)
3. **Together AI** (if API key exists)
4. **Smart Fallback** (always available)

You only need ONE API key for real AI responses!

---

## 🧪 Testing

After adding an API key:

1. Restart backend: Stop and start the server
2. Open chatbot in frontend
3. Send a message like "Hello"
4. Check the response source:
   - ✅ "AI (Groq)" = Real AI working!
   - ✅ "AI (OpenRouter)" = Real AI working!
   - ✅ "AI (Together)" = Real AI working!
   - ⚠️ "Smart Assistant" = Using fallback (add API key)

---

## 📊 Comparison

| Provider | Speed | Free Tier | Setup Time | Recommended |
|----------|-------|-----------|------------|-------------|
| Groq | ⚡⚡⚡ | Generous | 2 min | ⭐⭐⭐⭐⭐ |
| OpenRouter | ⚡⚡ | Good | 3 min | ⭐⭐⭐⭐ |
| Together AI | ⚡⚡ | $25 credits | 3 min | ⭐⭐⭐⭐ |

---

## 🎯 Recommendation

**Start with Groq** - it's the fastest, easiest, and most generous free tier. You can always add other providers later for redundancy.

---

## 🐛 Troubleshooting

### Chatbot still using fallback after adding key?

1. Check `.env` file has the key (no spaces, no quotes)
2. Restart backend server completely
3. Check backend logs for errors
4. Verify API key is valid (not expired)

### Getting API errors?

1. Check your API key is correct
2. Verify you haven't exceeded free tier limits
3. Try a different provider

### Want to test without API key?

The smart fallback system is already working! It provides helpful responses for:
- Reporting issues (potholes, garbage, lights)
- Checking status
- How-to guides
- General help

---

## 💡 Pro Tips

1. **Add multiple keys** for redundancy (if one fails, another works)
2. **Monitor usage** on provider dashboards
3. **Groq is fastest** for real-time chat
4. **Free tiers are generous** - perfect for development and small projects

---

## 🚀 Next Steps

1. Choose a provider (Groq recommended)
2. Get API key (2 minutes)
3. Add to `.env` file
4. Restart backend
5. Test chatbot
6. Enjoy real AI responses! 🎉
