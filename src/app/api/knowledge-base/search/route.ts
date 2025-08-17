import { NextRequest } from "next/server";
import { getSession } from "auth/server";
import { knowledgeBaseRepository } from "lib/db/repository";
import { z } from "zod";

const searchSchema = z.object({
  query: z.string().min(1),
  knowledgeBaseId: z.string().optional(),
  limit: z.number().min(1).max(50).optional().default(10),
});

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.user.id) {
      return new Response("Unauthorized", { status: 401 });
    }

    const body = await request.json();
    const { query, knowledgeBaseId, limit } = searchSchema.parse(body);

    const results = await knowledgeBaseRepository.searchContent(
      query,
      session.user.id,
      knowledgeBaseId,
      limit
    );

    return Response.json({ results, query });
  } catch (error) {
    console.error("Error searching knowledge base:", error);
    if (error instanceof z.ZodError) {
      return Response.json(
        { error: "Invalid input", details: error.errors },
        { status: 400 }
      );
    }
    return new Response("Internal Server Error", { status: 500 });
  }
}
