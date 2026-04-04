import { Subscriber, ISubscriber } from "@/models/Subscriber";
import { connectToDatabase } from "@/lib/mongodb";
import type { ServiceResult } from "../types";

export class SubscriberService {
  private async ensureConnection(): Promise<void> {
    await connectToDatabase();
  }

  /**
   * Subscribe a new email
   */
  async subscribe(email: string): Promise<ServiceResult<ISubscriber>> {
    try {
      await this.ensureConnection();

      // Check if already exists
      const existing = await Subscriber.findOne({ email });
      if (existing) {
        if (existing.isActive) {
          return { success: false, error: "This email is already subscribed" };
        } else {
          // Re-activate
          existing.isActive = true;
          existing.unsubscribedAt = undefined;
          await existing.save();
          return { success: true, data: existing };
        }
      }

      const subscriber = await Subscriber.create({ email });
      return { success: true, data: subscriber };
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to subscribe";
      return { success: false, error: message };
    }
  }

  /**
   * Unsubscribe an email
   */
  async unsubscribe(email: string): Promise<ServiceResult<ISubscriber>> {
    try {
      await this.ensureConnection();
      const subscriber = await Subscriber.findOneAndUpdate(
        { email },
        { isActive: false, unsubscribedAt: new Date() },
        { new: true },
      );

      if (!subscriber) {
        return { success: false, error: "Subscriber not found" };
      }

      return { success: true, data: subscriber };
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to unsubscribe";
      return { success: false, error: message };
    }
  }

  /**
   * Get all active subscribers
   */
  async getActiveSubscribers(): Promise<ServiceResult<ISubscriber[]>> {
    try {
      await this.ensureConnection();
      const subscribers = await Subscriber.find({ isActive: true }).exec();
      return { success: true, data: subscribers };
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to fetch subscribers";
      return { success: false, error: message };
    }
  }
}

export const subscriberService = new SubscriberService();
