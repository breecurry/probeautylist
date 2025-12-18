import { getStripeSync } from './stripeClient';
import { storage } from './storage';

export class WebhookHandlers {
  static async processWebhook(payload: Buffer, signature: string, uuid: string): Promise<void> {
    if (!Buffer.isBuffer(payload)) {
      throw new Error(
        'STRIPE WEBHOOK ERROR: Payload must be a Buffer. ' +
        'Received type: ' + typeof payload + '. ' +
        'This usually means express.json() parsed the body before reaching this handler. ' +
        'FIX: Ensure webhook route is registered BEFORE app.use(express.json()).'
      );
    }

    const sync = await getStripeSync();
    await sync.processWebhook(payload, signature, uuid);

    // Also handle custom business logic for checkout completion
    try {
      const event = JSON.parse(payload.toString());
      await WebhookHandlers.handleCustomEvents(event);
    } catch (err: any) {
      console.error('[webhook] Custom event handling error:', err.message);
    }
  }

  static async handleCustomEvents(event: any): Promise<void> {
    switch (event.type) {
      case 'checkout.session.completed':
        await WebhookHandlers.handleCheckoutCompleted(event.data.object);
        break;
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
        await WebhookHandlers.handleSubscriptionUpdate(event.data.object);
        break;
      case 'customer.subscription.deleted':
        await WebhookHandlers.handleSubscriptionDeleted(event.data.object);
        break;
    }
  }

  static async handleCheckoutCompleted(session: any): Promise<void> {
    const { businessId, tier, userId } = session.metadata || {};
    
    if (!businessId || !tier) {
      console.log('[webhook] Checkout completed but missing businessId or tier in metadata');
      return;
    }

    console.log(`[webhook] Checkout completed for business ${businessId}, upgrading to tier: ${tier}`);
    
    try {
      await storage.updateBusiness(businessId, { tier });
      console.log(`[webhook] Successfully upgraded business ${businessId} to ${tier}`);
    } catch (error: any) {
      console.error(`[webhook] Failed to upgrade business ${businessId}:`, error.message);
    }
  }

  static async handleSubscriptionUpdate(subscription: any): Promise<void> {
    const { businessId, tier } = subscription.metadata || {};
    
    if (!businessId) {
      console.log('[webhook] Subscription update but missing businessId in metadata');
      return;
    }

    const status = subscription.status;
    
    if (status === 'active' || status === 'trialing') {
      console.log(`[webhook] Subscription active for business ${businessId}, tier: ${tier}`);
      if (tier) {
        await storage.updateBusiness(businessId, { tier });
      }
    }
  }

  static async handleSubscriptionDeleted(subscription: any): Promise<void> {
    const { businessId } = subscription.metadata || {};
    
    if (!businessId) {
      console.log('[webhook] Subscription deleted but missing businessId in metadata');
      return;
    }

    console.log(`[webhook] Subscription cancelled for business ${businessId}, downgrading to free`);
    
    try {
      await storage.updateBusiness(businessId, { tier: 'free' });
      console.log(`[webhook] Successfully downgraded business ${businessId} to free`);
    } catch (error: any) {
      console.error(`[webhook] Failed to downgrade business ${businessId}:`, error.message);
    }
  }
}
