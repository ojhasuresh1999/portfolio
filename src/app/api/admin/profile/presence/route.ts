import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { User } from "@/models/User";
import { requireAuth } from "@/server/utils/auth-middleware";

export async function POST(request: NextRequest) {
  try {
    const authResult = requireAuth(request);
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const { userId } = authResult;
    await connectToDatabase();

    const admin = await User.findById(userId);
    if (!admin) {
      return NextResponse.json(
        { success: false, error: "Admin not found" },
        { status: 404 },
      );
    }

    admin.isOnline = !admin.isOnline;
    await admin.save();

    return NextResponse.json({
      success: true,
      data: { isOnline: admin.isOnline },
    });
  } catch (error) {
    console.error("[Presence API Error]", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 },
    );
  }
}
