import { NextResponse } from "next/server";
import { blogService } from "@/server/services/blog.service";
import { handleError } from "@/server/utils/error-handler";

export async function GET() {
  try {
    const result = await blogService.getTags();

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 500 },
      );
    }

    return NextResponse.json({ success: true, data: result.data });
  } catch (error) {
    return handleError(error);
  }
}
