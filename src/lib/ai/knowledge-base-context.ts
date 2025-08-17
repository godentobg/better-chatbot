import { knowledgeBaseRepository } from "../db/repository";

export async function buildKnowledgeBaseContext(
  userQuery: string,
  userId: string
): Promise<string> {
  try {
    console.log(`[KB CONTEXT DEBUG] Searching for query: "${userQuery}" for user: ${userId}`);
    
    // Search for relevant content in the user's knowledge base
    const searchResults = await knowledgeBaseRepository.searchContent(
      userQuery,
      userId,
      undefined, // Search across all knowledge bases
      5 // Limit to top 5 results
    );

    console.log(`[KB CONTEXT DEBUG] Search results found: ${searchResults.length}`);

    if (searchResults.length === 0) {
      console.log(`[KB CONTEXT DEBUG] No search results found, returning empty context`);
      return "";
    }

    // Build context from search results
    const contextParts = searchResults.map((result, index) => {
      return `--- Knowledge Base Document ${index + 1}: ${result.file.originalName} ---
${result.relevantContent}
--- End Document ${index + 1} ---`;
    });

    return `
KNOWLEDGE BASE CONTEXT:
The user has uploaded files to their knowledge base. Below are relevant excerpts that may help answer their question:

${contextParts.join('\n\n')}

Please use this information from the user's knowledge base when relevant to answer their questions. Always cite which document you're referencing when using information from the knowledge base.
`;
  } catch (error) {
    console.error("Error building knowledge base context:", error);
    return "";
  }
}

export function extractUserQuery(messages: any[]): string {
  // Get the last user message to use as search query
  const lastUserMessage = messages
    .slice()
    .reverse()
    .find(msg => msg.role === 'user');

  if (!lastUserMessage) return "";

  // Extract text from parts
  if (lastUserMessage.parts) {
    return lastUserMessage.parts
      .filter((part: any) => part.type === 'text')
      .map((part: any) => part.text)
      .join(' ');
  }

  return lastUserMessage.content || "";
}
