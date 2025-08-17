import { KnowledgeBase, KnowledgeBaseFile, KnowledgeBaseRepository, CreateKnowledgeBaseRequest, KnowledgeBaseSearchResult } from "../../../../app-types/knowledge-base";
import { pgDb as db } from "../db.pg";
import { KnowledgeBaseSchema, KnowledgeBaseFileSchema } from "../schema.pg";
import { eq, and, ilike, desc } from "drizzle-orm";

export const pgKnowledgeBaseRepository: KnowledgeBaseRepository = {
  create: async (userId: string, data: CreateKnowledgeBaseRequest): Promise<KnowledgeBase> => {
    const [result] = await db
      .insert(KnowledgeBaseSchema)
      .values({
        name: data.name,
        description: data.description,
        userId,
      })
      .returning();
    return result;
  },

  findByUserId: async (userId: string): Promise<KnowledgeBase[]> => {
    const results = await db
      .select()
      .from(KnowledgeBaseSchema)
      .where(eq(KnowledgeBaseSchema.userId, userId))
      .orderBy(desc(KnowledgeBaseSchema.updatedAt));
    return results;
  },

  findById: async (id: string, userId: string): Promise<KnowledgeBase | null> => {
    const [result] = await db
      .select()
      .from(KnowledgeBaseSchema)
      .where(
        and(
          eq(KnowledgeBaseSchema.id, id),
          eq(KnowledgeBaseSchema.userId, userId)
        )
      );
    
    if (!result) return null;

    // Get associated files
    const files = await db
      .select()
      .from(KnowledgeBaseFileSchema)
      .where(eq(KnowledgeBaseFileSchema.knowledgeBaseId, id))
      .orderBy(desc(KnowledgeBaseFileSchema.createdAt));

    return {
      ...result,
      files: files as KnowledgeBaseFile[],
    };
  },

  delete: async (id: string, userId: string): Promise<void> => {
    await db
      .delete(KnowledgeBaseSchema)
      .where(
        and(
          eq(KnowledgeBaseSchema.id, id),
          eq(KnowledgeBaseSchema.userId, userId)
        )
      );
  },

  addFile: async (fileData: Omit<KnowledgeBaseFile, 'id' | 'createdAt' | 'updatedAt'>): Promise<KnowledgeBaseFile> => {
    const [result] = await db
      .insert(KnowledgeBaseFileSchema)
      .values(fileData)
      .returning();
    return result;
  },

  findFiles: async (knowledgeBaseId: string, userId: string): Promise<KnowledgeBaseFile[]> => {
    const results = await db
      .select()
      .from(KnowledgeBaseFileSchema)
      .where(
        and(
          eq(KnowledgeBaseFileSchema.knowledgeBaseId, knowledgeBaseId),
          eq(KnowledgeBaseFileSchema.userId, userId)
        )
      )
      .orderBy(desc(KnowledgeBaseFileSchema.createdAt));
    return results;
  },

  deleteFile: async (fileId: string, userId: string): Promise<void> => {
    await db
      .delete(KnowledgeBaseFileSchema)
      .where(
        and(
          eq(KnowledgeBaseFileSchema.id, fileId),
          eq(KnowledgeBaseFileSchema.userId, userId)
        )
      );
  },

  searchContent: async (
    query: string, 
    userId: string, 
    knowledgeBaseId?: string, 
    limit: number = 10
  ): Promise<KnowledgeBaseSearchResult[]> => {
    console.log(`[KB REPO DEBUG] Searching content - query: "${query}", userId: ${userId}, knowledgeBaseId: ${knowledgeBaseId}, limit: ${limit}`);
    
    const baseQuery = db
      .select()
      .from(KnowledgeBaseFileSchema)
      .where(
        and(
          eq(KnowledgeBaseFileSchema.userId, userId),
          knowledgeBaseId ? eq(KnowledgeBaseFileSchema.knowledgeBaseId, knowledgeBaseId) : undefined,
          ilike(KnowledgeBaseFileSchema.content, `%${query}%`)
        )
      )
      .orderBy(desc(KnowledgeBaseFileSchema.updatedAt))
      .limit(limit);

    console.log(`[KB REPO DEBUG] Executing database query...`);
    const files = await baseQuery;
    console.log(`[KB REPO DEBUG] Query returned ${files.length} files`);
    
    // Log details about the files found
    files.forEach((file, index) => {
      console.log(`[KB REPO DEBUG] File ${index + 1}: ${file.originalName}, content length: ${file.content ? file.content.length : 0}, has content: ${!!file.content}`);
    });

    return files.map(file => {
      // Extract relevant content snippet
      const content = file.content || '';
      const queryLower = query.toLowerCase();
      const contentLower = content.toLowerCase();
      const index = contentLower.indexOf(queryLower);
      
      let relevantContent = content;
      if (index !== -1) {
        // Extract context around the match
        const start = Math.max(0, index - 100);
        const end = Math.min(content.length, index + query.length + 100);
        relevantContent = content.substring(start, end);
        if (start > 0) relevantContent = '...' + relevantContent;
        if (end < content.length) relevantContent = relevantContent + '...';
      }

      return {
        file,
        relevantContent,
        score: 1.0, // Simple scoring for now
      };
    });
  },
};
