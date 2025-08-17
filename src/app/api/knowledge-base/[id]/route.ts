import { NextRequest } from "next/server";
import { getSession } from "auth/server";
import { knowledgeBaseRepository } from "lib/db/repository";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session?.user.id) {
      return new Response("Unauthorized", { status: 401 });
    }

    const { id } = await params;
    const knowledgeBase = await knowledgeBaseRepository.findById(id, session.user.id);
    
    if (!knowledgeBase) {
      return new Response("Knowledge base not found", { status: 404 });
    }

    return Response.json(knowledgeBase);
  } catch (error) {
    console.error("Error fetching knowledge base:", error);
    return new Response("Internal Server Error", { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session?.user.id) {
      return new Response("Unauthorized", { status: 401 });
    }

    const { id } = await params;
    
    // Check if knowledge base exists and belongs to user
    const knowledgeBase = await knowledgeBaseRepository.findById(id, session.user.id);
    if (!knowledgeBase) {
      return new Response("Knowledge base not found", { status: 404 });
    }

    await knowledgeBaseRepository.delete(id, session.user.id);
    return new Response("", { status: 204 });
  } catch (error) {
    console.error("Error deleting knowledge base:", error);
    return new Response("Internal Server Error", { status: 500 });
  }
}
