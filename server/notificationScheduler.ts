import { storage } from "./storage";
import { log } from "./index";

interface ReminderConfig {
  type: string;
  hoursBeforeMin: number;
  hoursBeforeMax: number;
  timeframeLabel: string;
}

const REMINDER_CONFIGS: ReminderConfig[] = [
  { type: '7d', hoursBeforeMin: 168, hoursBeforeMax: 168 + 24, timeframeLabel: '7 days' },
  { type: '3d', hoursBeforeMin: 72, hoursBeforeMax: 72 + 24, timeframeLabel: '3 days' },
  { type: '48h', hoursBeforeMin: 48, hoursBeforeMax: 72, timeframeLabel: '48 hours' },
  { type: '24h', hoursBeforeMin: 24, hoursBeforeMax: 48, timeframeLabel: '24 hours' },
];

function formatDate(date: Date): string {
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export async function checkAndCreateReminders(): Promise<void> {
  try {
    const upcomingBookings = await storage.getUpcomingBookingsForReminders();
    const now = new Date();

    for (const booking of upcomingBookings) {
      const bookingDate = new Date(booking.date);
      const hoursUntilBooking = (bookingDate.getTime() - now.getTime()) / (1000 * 60 * 60);

      const business = await storage.getBusiness(booking.businessId);
      const client = await storage.getUser(booking.clientId);

      if (!business || !client) {
        continue;
      }

      for (const config of REMINDER_CONFIGS) {
        if (hoursUntilBooking >= config.hoursBeforeMin && hoursUntilBooking < config.hoursBeforeMax) {
          const clientReminderSent = await storage.hasReminderBeenSent(
            booking.id,
            booking.clientId,
            config.type
          );

          if (!clientReminderSent) {
            await storage.createNotification({
              userId: booking.clientId,
              bookingId: booking.id,
              type: 'reminder',
              title: 'Upcoming Appointment Reminder',
              message: `Your appointment for ${booking.serviceName} at ${business.name} is in ${config.timeframeLabel}. Date: ${formatDate(bookingDate)}`,
              reminderType: config.type,
            });
            log(`Created ${config.type} reminder for client ${client.username} for booking ${booking.id}`, 'scheduler');
          }

          const businessReminderSent = await storage.hasReminderBeenSent(
            booking.id,
            business.ownerId,
            config.type
          );

          if (!businessReminderSent) {
            await storage.createNotification({
              userId: business.ownerId,
              bookingId: booking.id,
              type: 'reminder',
              title: 'Upcoming Appointment Reminder',
              message: `Reminder: ${client.username} has an appointment for ${booking.serviceName} in ${config.timeframeLabel}. Date: ${formatDate(bookingDate)}`,
              reminderType: config.type,
            });
            log(`Created ${config.type} reminder for business owner of ${business.name} for booking ${booking.id}`, 'scheduler');
          }
        }
      }
    }
  } catch (error) {
    log(`Error in checkAndCreateReminders: ${error}`, 'scheduler');
  }
}

async function checkAndCreateRebookingReminders(): Promise<void> {
  try {
    const completedBookings = await storage.getCompletedBookingsForRebooking();
    
    for (const { booking, business } of completedBookings) {
      const bookingDate = new Date(booking.date);
      const suggestedRebookDate = new Date(bookingDate.getTime() + (business.defaultRebookingDays * 24 * 60 * 60 * 1000));
      
      const hasReminder = await storage.hasRebookingReminderForBooking(booking.id);
      if (hasReminder) continue;
      
      await storage.createRebookingReminder({
        clientId: booking.clientId,
        businessId: booking.businessId,
        lastBookingId: booking.id,
        serviceName: booking.serviceName,
        suggestedRebookDate,
        rebookingLink: null,
      });
      
      const client = await storage.getUser(booking.clientId);
      if (client) {
        const weeksSince = Math.floor((Date.now() - bookingDate.getTime()) / (7 * 24 * 60 * 60 * 1000));
        await storage.createNotification({
          userId: booking.clientId,
          bookingId: booking.id,
          type: 'rebooking_reminder',
          title: 'Time to Rebook?',
          message: `It's been ${weeksSince} weeks since your ${booking.serviceName} at ${business.name}. Ready to book again?`,
          reminderType: 'rebooking',
        });
        log(`Created rebooking reminder for client ${client.username} for ${booking.serviceName} at ${business.name}`, 'scheduler');
      }
    }
  } catch (error) {
    log(`Error in checkAndCreateRebookingReminders: ${error}`, 'scheduler');
  }
}

export function startNotificationScheduler(): void {
  log('Starting notification scheduler (runs every hour)', 'scheduler');
  
  checkAndCreateReminders();
  checkAndCreateRebookingReminders();
  
  setInterval(() => {
    checkAndCreateReminders();
    checkAndCreateRebookingReminders();
  }, 60 * 60 * 1000);
}
