import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { requireAuth } from "@/server/utils/auth-middleware";
import { Project } from "@/models/Project";
import { BlogPost } from "@/models/BlogPost";
import { Skill } from "@/models/Skill";
import { ContactSubmission } from "@/models/ContactSubmission";
import { Subscriber } from "@/models/Subscriber";

export async function GET(request: NextRequest) {
  try {
    // Optional: Protect route with admin auth
    const authResult = requireAuth(request);
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    await connectToDatabase();

    // 1. Total Counts
    const [projectCount, blogCount, skillCount, messageCount, subscriberCount] =
      await Promise.all([
        Project.countDocuments(),
        BlogPost.countDocuments(),
        Skill.countDocuments(),
        ContactSubmission.countDocuments(),
        Subscriber.countDocuments({ isActive: true }),
      ]);

    // 2. Category Distributions
    const blogCategories = await BlogPost.aggregate([
      { $group: { _id: "$category", count: { $sum: 1 } } },
      { $project: { name: "$_id", value: "$count", _id: 0 } },
    ]);

    const skillCategories = await Skill.aggregate([
      { $group: { _id: "$category", count: { $sum: 1 } } },
      { $project: { name: "$_id", value: "$count", _id: 0 } },
    ]);

    // 3. Recent Activity (Combining latest from different models)
    const recentProjects = await Project.find()
      .sort({ createdAt: -1 })
      .limit(2)
      .select("title createdAt")
      .lean();
    const recentBlogs = await BlogPost.find()
      .sort({ createdAt: -1 })
      .limit(2)
      .select("title createdAt")
      .lean();
    const recentSkills = await Skill.find()
      .sort({ createdAt: -1 })
      .limit(2)
      .select("name createdAt")
      .lean();
    const recentMessages = await ContactSubmission.find()
      .sort({ createdAt: -1 })
      .limit(2)
      .select("name subject createdAt")
      .lean();

    const rawActivity = [
      ...recentProjects.map((p) => ({
        id: `proj-${p._id}`,
        action: `Project '${p.title}' created`,
        time: p.createdAt as Date,
        icon: "folder",
        type: "project",
      })),
      ...recentBlogs.map((b) => ({
        id: `blog-${b._id}`,
        action: `Blog post '${b.title}' added`,
        time: b.createdAt as Date,
        icon: "article",
        type: "blog",
      })),
      ...recentSkills.map((s) => ({
        id: `skill-${s._id}`,
        action: `Skill '${s.name}' updated`,
        time: s.createdAt as Date,
        icon: "code",
        type: "skill",
      })),
      ...recentMessages.map((m) => ({
        id: `msg-${m._id}`,
        action: `New message from ${m.name}`,
        time: m.createdAt as Date,
        icon: "mail",
        type: "message",
      })),
    ];

    // Sort combined activity by time descending and take top 5
    const recentActivity = rawActivity
      .sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())
      .slice(0, 5)
      .map((item) => ({
        ...item,
        // Convert to ISO string or keep as Date? We will format it on the frontend.
        time: new Date(item.time).toISOString(),
      }));

    return NextResponse.json({
      success: true,
      data: {
        counts: {
          projects: projectCount,
          blogs: blogCount,
          skills: skillCount,
          messages: messageCount,
          subscribers: subscriberCount,
        },
        distributions: {
          blogCategories:
            blogCategories.length > 0
              ? blogCategories
              : [{ name: "None", value: 1 }],
          skillCategories:
            skillCategories.length > 0
              ? skillCategories
              : [{ name: "None", value: 1 }],
        },
        recentActivity,
      },
    });
  } catch (error) {
    console.error("[Dashboard Stats API Error]", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 },
    );
  }
}
