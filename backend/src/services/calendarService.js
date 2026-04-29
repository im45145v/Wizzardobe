const { google } = require('googleapis');
const User = require('../models/User');
const { encrypt, decrypt } = require('./encryptionService');

function createOAuthClient() {
  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  );
}

function getAuthUrl(userId) {
  const oauth2Client = createOAuthClient();
  return oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: ['https://www.googleapis.com/auth/calendar'],
    state: Buffer.from(String(userId)).toString('base64'),
  });
}

async function handleCallback(code, userId) {
  const oauth2Client = createOAuthClient();
  const { tokens } = await oauth2Client.getToken(code);

  const update = {
    'googleCalendar.tokenExpiry': tokens.expiry_date ? new Date(tokens.expiry_date) : null,
  };
  if (tokens.access_token) {
    update['googleCalendar.accessToken'] = encrypt(tokens.access_token);
  }
  if (tokens.refresh_token) {
    update['googleCalendar.refreshToken'] = encrypt(tokens.refresh_token);
  }

  await User.findByIdAndUpdate(userId, update);
  return { success: true };
}

async function getAuthenticatedClient(userId) {
  const user = await User.findById(userId);
  if (!user || !user.googleCalendar || !user.googleCalendar.accessToken) {
    throw new Error('Google Calendar not connected');
  }

  const oauth2Client = createOAuthClient();
  oauth2Client.setCredentials({
    access_token: decrypt(user.googleCalendar.accessToken),
    refresh_token: user.googleCalendar.refreshToken ? decrypt(user.googleCalendar.refreshToken) : undefined,
    expiry_date: user.googleCalendar.tokenExpiry ? user.googleCalendar.tokenExpiry.getTime() : undefined,
  });

  // Refresh token if needed
  oauth2Client.on('tokens', async (tokens) => {
    const tokenUpdate = {};
    if (tokens.access_token) {
      tokenUpdate['googleCalendar.accessToken'] = encrypt(tokens.access_token);
    }
    if (tokens.expiry_date) {
      tokenUpdate['googleCalendar.tokenExpiry'] = new Date(tokens.expiry_date);
    }
    if (Object.keys(tokenUpdate).length) {
      await User.findByIdAndUpdate(userId, tokenUpdate);
    }
  });

  return oauth2Client;
}

async function getEvents(userId, startDate, endDate) {
  const auth = await getAuthenticatedClient(userId);
  const calendar = google.calendar({ version: 'v3', auth });

  const response = await calendar.events.list({
    calendarId: 'primary',
    timeMin: startDate || new Date().toISOString(),
    timeMax: endDate || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    singleEvents: true,
    orderBy: 'startTime',
  });

  return response.data.items || [];
}

async function createOutfitEvent(userId, date, outfitItems) {
  const auth = await getAuthenticatedClient(userId);
  const calendar = google.calendar({ version: 'v3', auth });

  const description = `Outfit planned via WizzardoAI:\n${outfitItems.map(i => `- ${i.clothName || i.name}`).join('\n')}`;
  const eventDate = new Date(date);

  const event = {
    summary: '👗 Planned Outfit',
    description,
    start: { date: eventDate.toISOString().split('T')[0] },
    end: { date: eventDate.toISOString().split('T')[0] },
  };

  const response = await calendar.events.insert({ calendarId: 'primary', resource: event });
  return response.data;
}

module.exports = { getAuthUrl, handleCallback, getEvents, createOutfitEvent };
