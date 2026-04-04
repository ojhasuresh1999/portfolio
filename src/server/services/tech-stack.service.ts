import { Model } from "mongoose";
import { TechStack, type ITechStack } from "@/models";
import { BaseService } from "./base.service";
import { TechStackFormData } from "../utils/validation";
import type { ServiceResult } from "../types";

export class TechStackService extends BaseService<
  ITechStack,
  TechStackFormData,
  Partial<TechStackFormData>
> {
  protected getModel(): Model<ITechStack> {
    return TechStack as Model<ITechStack>;
  }

  protected readonly defaultOrderBy: Record<string, 1 | -1> = { order: 1 };

  /**
   * Get all tech stack entries without pagination
   */
  async getAllTechStack(): Promise<ServiceResult<ITechStack[]>> {
    try {
      await this.ensureConnection();
      const items = await this.getModel()
        .find()
        .sort(this.defaultOrderBy)
        .lean<ITechStack[]>()
        .exec();
      return { success: true, data: items };
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to fetch tech stack";
      return { success: false, error: message };
    }
  }
}

export const techStackService = new TechStackService();
