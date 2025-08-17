import { NextRequest } from "next/server";
import { getSession } from "auth/server";
import { knowledgeBaseRepository } from "lib/db/repository";

import { z } from "zod";

const createKnowledgeBaseSchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().optional(),
});

export async function GET() {
  try {
    const session = await getSession();
    if (!session?.user.id) {
      return new Response("Unauthorized", { status: 401 });
    }

    const knowledgeBases = await knowledgeBaseRepository.findByUserId(session.user.id);
    return Response.json(knowledgeBases);
  } catch (error) {
    console.error("Error fetching knowledge bases:", error);
    return new Response("Internal Server Error", { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.user.id) {
      return new Response("Unauthorized", { status: 401 });
    }

    const body = await request.json();
    const validatedData = createKnowledgeBaseSchema.parse(body);

    const knowledgeBase = await knowledgeBaseRepository.create(session.user.id, validatedData);
    return Response.json(knowledgeBase, { status: 201 });
  } catch (error) {
    console.error("Error creating knowledge base:", error);
    if (error instanceof z.ZodError) {
      return Response.json(
        { error: "Invalid input", details: error.errors },
        { status: 400 }
      );
    }
    return new Response("Internal Server Error", { status: 500 });
  }
}
