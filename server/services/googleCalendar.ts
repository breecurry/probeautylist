import { google } from 'googleapis';

let connectionSettings: any;

async function getAccessToken() {
  if (connectionSettings && connectionSettings.settings?.expires_at && new Date(connectionSettings.settings.expires_at).getTime() > Date.now()) {
    return connectionSettings.settings.access_token;
  }
  
  const hostname = process.env.REPLIT_CONNECTORS_HOSTNAME;
  if (!hostname) {
    console.error('[calendar] REPLIT_CONNECTORS_HOSTNAME not set');
    throw new Error('Google Calendar not connected');
  }

  const xReplitToken = process.env.REPL_IDENTITY 
    ? 'repl ' + process.env.REPL_IDENTITY 
    : process.env.WEB_REPL_RENEWAL 
    ? 'depl ' + process.env.WEB_REPL_RENEWAL 
    : null;

  if (!xReplitToken) {
    console.error('[calendar] X_REPLIT_TOKEN not available (neither REPL_IDENTITY nor WEB_REPL_RENEWAL set)');
    throw new Error('Google Calendar not connected');
  }

  try {
    const response = await fetch(
      'https://' + hostname + '/api/v2/connection?include_secrets=true&connector_names=google-calendar',
      {
        headers: {
          'Accept': 'application/json',
          'X_REPLIT_TOKEN': xReplitToken
        }
      }
    );
    
    if (!response.ok) {
      console.error('[calendar] Failed to fetch connection settings:', response.status, response.statusText);
      throw new Error('Google Calendar not connected');
    }
    
    const data = await response.json();
    connectionSettings = data.items?.[0];
  } catch (error) {
    console.error('[calendar] Error fetching connection settings:', error);
    throw new Error('Google Calendar not connected');
  }

  const accessToken = connectionSettings?.settings?.access_token || connectionSettings?.settings?.oauth?.credentials?.access_token;

  if (!connectionSettings || !accessToken) {
    console.error('[calendar] No valid access token found in connection settings');
    throw new Error('Google Calendar not connected');
  }
  return accessToken;
}

export async function getGoogleCalendarClient() {
  const accessToken = await getAccessToken();

  const oauth2Client = new google.auth.OAuth2();
  oauth2Client.setCredentials({
    access_token: accessToken
  });

  return google.calendar({ version: 'v3', auth: oauth2Client });
}

export async function createCalendarEvent(booking: {
  id: string;
  serviceName: string;
  date: string;
  businessName?: string;
  businessId?: string;
  userId?: string;
}) {
  const calendar = await getGoogleCalendarClient();
  
  const startTime = new Date(booking.date);
  const endTime = new Date(startTime.getTime() + 60 * 60 * 1000);
  
  let description = `Booking ID: ${booking.id}`;
  if (booking.businessId) description += `\nBusiness ID: ${booking.businessId}`;
  if (booking.userId) description += `\nSynced by: ${booking.userId}`;
  
  const event = {
    summary: `${booking.serviceName}${booking.businessName ? ` - ${booking.businessName}` : ''}`,
    description,
    start: {
      dateTime: startTime.toISOString(),
      timeZone: 'UTC',
    },
    end: {
      dateTime: endTime.toISOString(),
      timeZone: 'UTC',
    },
  };

  console.log('[calendar] Creating event:', event.summary, 'for user:', booking.userId);
  
  const result = await calendar.events.insert({
    calendarId: 'primary',
    requestBody: event,
  });

  return result.data;
}

export async function listCalendarEvents(timeMin?: Date, timeMax?: Date) {
  const calendar = await getGoogleCalendarClient();
  
  const now = new Date();
  const defaultTimeMin = timeMin || now;
  const defaultTimeMax = timeMax || new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
  
  const result = await calendar.events.list({
    calendarId: 'primary',
    timeMin: defaultTimeMin.toISOString(),
    timeMax: defaultTimeMax.toISOString(),
    singleEvents: true,
    orderBy: 'startTime',
  });

  return result.data.items || [];
}

export async function deleteCalendarEvent(eventId: string) {
  const calendar = await getGoogleCalendarClient();
  
  await calendar.events.delete({
    calendarId: 'primary',
    eventId: eventId,
  });
}
