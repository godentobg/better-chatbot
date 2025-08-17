import { NextRequest } from "next/server";
import { getSession } from "auth/server";
import { knowledgeBaseRepository } from "lib/db/repository";
import { nanoid } from "nanoid";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { existsSync } from "fs";

// Simple text extraction for supported file types
async function extractTextContent(file: File): Promise<string> {
  const buffer = await file.arrayBuffer();
  const text = new TextDecoder().decode(buffer);
  
  // For now, handle text files directly
  // TODO: Add support for PDF, DOCX, etc. using libraries like pdf-parse, mammoth
  if (file.type.startsWith('text/') || file.name.endsWith('.md') || file.name.endsWith('.txt')) {
    return text;
  }
  
  // For other file types, return filename and type as searchable content
  return `File: ${file.name}\nType: ${file.type}\nContent extraction not yet supported for this file type.`;
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.user.id) {
      return new Response("Unauthorized", { status: 401 });
    }

    const formData = await request.formData();
    const knowledgeBaseId = formData.get("knowledgeBaseId") as string;
    const files = formData.getAll("files") as File[];

    if (!knowledgeBaseId) {
      return Response.json(
        { error: "Knowledge base ID is required" },
        { status: 400 }
      );
    }

    if (!files || files.length === 0) {
      return Response.json(
        { error: "No files provided" },
        { status: 400 }
      );
    }

    // Verify knowledge base exists and belongs to user
    const knowledgeBase = await knowledgeBaseRepository.findById(knowledgeBaseId, session.user.id);
    if (!knowledgeBase) {
      return new Response("Knowledge base not found", { status: 404 });
    }

    // Create uploads directory if it doesn't exist
    const uploadsDir = join(process.cwd(), "uploads", "knowledge-base");
    if (!existsSync(uploadsDir)) {
      await mkdir(uploadsDir, { recursive: true });
    }

    const uploadedFiles: any[] = [];

    for (const file of files) {
      // Generate unique filename
      const fileId = nanoid();
      const fileExtension = file.name.split('.').pop() || '';
      const filename = `${fileId}.${fileExtension}`;
      const filePath = join(uploadsDir, filename);

      // Save file to disk
      const buffer = await file.arrayBuffer();
      await writeFile(filePath, new Uint8Array(buffer));

      // Extract text content for searching
      const content = await extractTextContent(file);

      // Save file metadata to database
      const savedFile = await knowledgeBaseRepository.addFile({
        knowledgeBaseId,
        filename,
        originalName: file.name,
        mimeType: file.type,
        size: file.size.toString(),
        content,
        metadata: {
          path: filePath,
        },
        userId: session.user.id,
      });

      uploadedFiles.push(savedFile);
    }

    return Response.json({ 
      message: `${uploadedFiles.length} files uploaded successfully`,
      files: uploadedFiles 
    });
  } catch (error) {
    console.error("Error uploading files:", error);
    return new Response("Internal Server Error", { status: 500 });
  }
}
