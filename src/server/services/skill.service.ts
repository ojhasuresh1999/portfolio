import { Model } from "mongoose";
import { Skill, type ISkill } from "@/models";
import { BaseService } from "./base.service";
import { SkillFormData } from "../utils/validation";
import type { ServiceResult } from "../types";

export class SkillService extends BaseService<
  ISkill,
  SkillFormData,
  Partial<SkillFormData>
> {
  protected getModel(): Model<ISkill> {
    return Skill as Model<ISkill>;
  }

  protected readonly defaultOrderBy: Record<string, 1 | -1> = {
    category: 1,
    order: 1,
  };

  /**
   * Get all skills without pagination, specifically for the frontend
   */
  async getAllSkills(): Promise<ServiceResult<ISkill[]>> {
    try {
      await this.ensureConnection();
      const items = await this.getModel()
        .find()
        .sort(this.defaultOrderBy)
        .lean<ISkill[]>()
        .exec();
      return { success: true, data: items };
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to fetch skills";
      return { success: false, error: message };
    }
  }
}

export const skillService = new SkillService();
