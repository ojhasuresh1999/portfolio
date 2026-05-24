import { Api } from "@/server/utils/api-response";
import { withAdmin } from "@/server/utils/auth-middleware";
import { User } from "@/models";

/**
 * GET /api/admin/contacts/agents
 * Retrieves the list of authenticated administrator and support agent accounts.
 */
export const GET = withAdmin(async () => {
  try {
    const agents = await User.find({}, "name email role")
      .sort({ name: 1, email: 1 })
      .lean()
      .exec();

    const formattedAgents = agents.map((agent) => ({
      id: agent._id.toString(),
      name: agent.name || agent.email.split("@")[0],
      email: agent.email,
      role: agent.role,
    }));

    return Api.success(formattedAgents);
  } catch (error) {
    return Api.internalError(
      error instanceof Error ? error.message : "API Error",
    );
  }
});
