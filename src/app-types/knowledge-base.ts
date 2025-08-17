export interface KnowledgeBase {
  id: string;
  name: string;
  description?: string | null;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
  files?: KnowledgeBaseFile[];
}

export interface KnowledgeBaseFile {
  id: string;
  knowledgeBaseId: string;
  filename: string;
  originalName: string;
  mimeType: string;
  size: string;
  content?: string | null;
  metadata?: Record<string, any> | null;
  embeddings?: number[] | null;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateKnowledgeBaseRequest {
  name: string;
  description?: string | null;
}

export interface UploadFileRequest {
  knowledgeBaseId: string;
  files: File[];
}

export interface KnowledgeBaseSearchRequest {
  query: string;
  knowledgeBaseId?: string;
  limit?: number;
}

export interface KnowledgeBaseSearchResult {
  file: KnowledgeBaseFile;
  relevantContent: string;
  score?: number;
}

export interface KnowledgeBaseRepository {
  create(userId: string, data: CreateKnowledgeBaseRequest): Promise<KnowledgeBase>;
  findByUserId(userId: string): Promise<KnowledgeBase[]>;
  findById(id: string, userId: string): Promise<KnowledgeBase | null>;
  delete(id: string, userId: string): Promise<void>;
  addFile(fileData: Omit<KnowledgeBaseFile, 'id' | 'createdAt' | 'updatedAt'>): Promise<KnowledgeBaseFile>;
  findFiles(knowledgeBaseId: string, userId: string): Promise<KnowledgeBaseFile[]>;
  deleteFile(fileId: string, userId: string): Promise<void>;
  searchContent(query: string, userId: string, knowledgeBaseId?: string, limit?: number): Promise<KnowledgeBaseSearchResult[]>;
}
