import { NextResponse } from "next/server";
import { getKudoFeedPage, getViewerId, type FeedCursor } from "@/features/kudos/infrastructure/board-queries";
import type { BoardFilter } from "@/features/kudos/domain/types";

function parseCursor(value: string | null): FeedCursor | null {
  if (!value) return null;
  try {
    const parsed: unknown = JSON.parse(value);
    if (typeof parsed !== "object" || parsed === null) return null;
    const cursor = parsed as Record<string, unknown>;
    return typeof cursor.createdAt === "string" &&
      !Number.isNaN(Date.parse(cursor.createdAt)) &&
      typeof cursor.id === "string" &&
      /^[0-9a-f-]{36}$/i.test(cursor.id)
      ? { createdAt: cursor.createdAt, id: cursor.id }
      : null;
  } catch {
    return null;
  }
}

function parseNullableNumber(value: string | null): number | null {
  if (value === null || value === "") return null;
  const parsed = Number(value);
  return Number.isInteger(parsed) ? parsed : null;
}

export async function GET(request: Request) {
  const viewerId = await getViewerId();
  if (!viewerId) return NextResponse.json({ error: "unauthenticated" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const filter: BoardFilter = {
    hashtagId: parseNullableNumber(searchParams.get("hashtagId")),
    department: parseNullableNumber(searchParams.get("department")),
  };

  try {
    const page = await getKudoFeedPage({ cursor: parseCursor(searchParams.get("cursor")), filter, viewerId });
    return NextResponse.json(page);
  } catch {
    return NextResponse.json({ error: "feed_unavailable" }, { status: 500 });
  }
}
