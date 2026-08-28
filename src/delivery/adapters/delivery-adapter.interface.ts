export interface DeliverySendResult {
  success: boolean;
  providerRef?: string;
  detail: string;
}

/**
 * Common interface for outbound message channels (SMS, WhatsApp, ...).
 *
 * MVP scope: every adapter is a stub. Real Termii / WhatsApp Business API integration is
 * intentionally NOT wired up here — this only simulates a send and returns a canned/no-op
 * result, whether or not an API key is configured in the environment. This keeps local dev
 * and CI deterministic and avoids taking a hard dependency on live third-party accounts for
 * the MVP. Swap the body of `send()` for a real HTTP call to the provider when ready to go live.
 */
export interface DeliveryChannelAdapter {
  readonly channel: string;
  send(recipientPhone: string, message: string): Promise<DeliverySendResult>;
}
