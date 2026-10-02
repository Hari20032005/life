import { buildSearchIndex } from "@/lib/content/search";

export const dynamic = "force-static";

export function GET() {
  return Response.json(buildSearchIndex());
}
