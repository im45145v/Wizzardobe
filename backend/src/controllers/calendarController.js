const calendarService = require('../services/calendarService');
const { successResponse, errorResponse } = require('../utils/helpers');
const openaiService = require('../services/openaiService');
const Cloth = require('../models/Cloth');
const { decrypt } = require('../services/encryptionService');

async function getAuthUrl(req, res) {
  try {
    const url = calendarService.getAuthUrl(req.user._id);
    return successResponse(res, { url }, 'Auth URL generated');
  } catch (err) {
    return errorResponse(res, err.message, 500);
  }
}

async function handleCallback(req, res) {
  try {
    const { code, state } = req.query;
    if (!code) return errorResponse(res, 'Authorization code missing', 400);

    const userId = Buffer.from(state, 'base64').toString('utf8');
    await calendarService.handleCallback(code, userId);

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    return res.redirect(`${frontendUrl}/calendar?connected=true`);
  } catch (err) {
    return errorResponse(res, err.message, 500);
  }
}

async function getEvents(req, res) {
  try {
    const { startDate, endDate } = req.query;
    const events = await calendarService.getEvents(req.user._id, startDate, endDate);
    return successResponse(res, { events }, 'Events fetched');
  } catch (err) {
    return errorResponse(res, err.message, 500);
  }
}

async function createOutfitEvent(req, res) {
  try {
    const { date, outfitItems } = req.body;
    if (!date) return errorResponse(res, 'Date is required', 400);
    if (!outfitItems || !Array.isArray(outfitItems)) return errorResponse(res, 'Outfit items array required', 400);

    const event = await calendarService.createOutfitEvent(req.user._id, date, outfitItems);
    return successResponse(res, { event }, 'Outfit event created', 201);
  } catch (err) {
    return errorResponse(res, err.message, 500);
  }
}

async function getWeeklyPlan(req, res) {
  try {
    const startDate = new Date().toISOString();
    const endDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

    let events = [];
    try {
      events = await calendarService.getEvents(req.user._id, startDate, endDate);
    } catch {
      // Calendar not connected — proceed without events
    }

    const cleanClothes = await Cloth.find({ userId: req.user._id, isActive: true, status: 'clean' });

    const weekPlan = [];
    for (let i = 0; i < 7; i++) {
      const day = new Date(Date.now() + i * 24 * 60 * 60 * 1000);
      const dayStr = day.toISOString().split('T')[0];
      const dayEvents = events.filter((e) => {
        const eventDate = e.start?.date || e.start?.dateTime?.split('T')[0];
        return eventDate === dayStr;
      });

      let suggestion = null;
      if (req.user.openaiApiKey && cleanClothes.length > 0) {
        try {
          const decryptedKey = decrypt(req.user.openaiApiKey);
          const occasionContext = dayEvents.map((e) => e.summary).join(', ') || 'casual day';
          const prompt = `Suggest a simple outfit for ${dayStr}. Events: ${occasionContext}.
Available clothes: ${JSON.stringify(cleanClothes.slice(0, 15).map(c => ({ id: c._id, name: c.name, category: c.category, color: c.color })))}
Return JSON: { items: [{ clothId, clothName }], reasoning: string }`;

          const aiResponse = await openaiService.getSuggestion(decryptedKey, prompt);
          const jsonMatch = aiResponse.match(/```json\n?([\s\S]*?)\n?```/) || aiResponse.match(/(\{[\s\S]*\})/);
          suggestion = jsonMatch ? JSON.parse(jsonMatch[1]) : null;
        } catch (e) {
          console.error('Weekly plan AI error:', e.message);
        }
      }

      weekPlan.push({ date: dayStr, events: dayEvents.map((e) => e.summary), suggestion });
    }

    return successResponse(res, { weekPlan }, 'Weekly plan fetched');
  } catch (err) {
    return errorResponse(res, err.message, 500);
  }
}

module.exports = { getAuthUrl, handleCallback, getEvents, createOutfitEvent, getWeeklyPlan };
