"use client";

import React, { useState, useCallback, useRef, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "ui/dialog";
import { Button } from "ui/button";
import { Input } from "ui/input";
import { Textarea } from "ui/textarea";
import { Label } from "ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "ui/tabs";
import { Upload, Plus, Trash2, FileText, FolderPlus } from "lucide-react";
import { toast } from "sonner";
import { KnowledgeBase, KnowledgeBaseFile } from "../app-types/knowledge-base";

interface KnowledgeBaseModalProps {
  open: boolean;
  onClose: () => void;
}

export function KnowledgeBaseModal({ open, onClose }: KnowledgeBaseModalProps) {
  console.log("KnowledgeBaseModal render - open:", open);
  const [knowledgeBases, setKnowledgeBases] = useState<KnowledgeBase[]>([]);
  const [selectedKB, setSelectedKB] = useState<KnowledgeBase | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [newKBName, setNewKBName] = useState("");
  const [newKBDescription, setNewKBDescription] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);


  // Load knowledge bases when modal opens
  const loadKnowledgeBases = useCallback(async () => {
    try {
      const response = await fetch("/api/knowledge-base");
      if (response.ok) {
        const data = await response.json();
        setKnowledgeBases(data);
        if (data.length > 0 && !selectedKB) {
          setSelectedKB(data[0]);
        }
      }
    } catch (error) {
      console.error("Error loading knowledge bases:", error);
      toast.error("Failed to load knowledge bases");
    }
  }, [selectedKB]);

  // Create new knowledge base
  const createKnowledgeBase = async () => {
    if (!newKBName.trim()) return;

    setIsCreating(true);
    try {
      const response = await fetch("/api/knowledge-base", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newKBName,
          description: newKBDescription,
        }),
      });

      if (response.ok) {
        const newKB = await response.json();
        setKnowledgeBases(prev => [newKB, ...prev]);
        setSelectedKB(newKB);
        setNewKBName("");
        setNewKBDescription("");
        toast.success("Knowledge base created successfully");
      } else {
        throw new Error("Failed to create knowledge base");
      }
    } catch (error) {
      console.error("Error creating knowledge base:", error);
      toast.error("Failed to create knowledge base");
    } finally {
      setIsCreating(false);
    }
  };

  // Upload files
  const uploadFiles = async (files: FileList) => {
    if (!selectedKB || files.length === 0) return;

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append("knowledgeBaseId", selectedKB.id);
      
      for (let i = 0; i < files.length; i++) {
        formData.append("files", files[i]);
      }

      const response = await fetch("/api/knowledge-base/upload", {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        // Reload the selected knowledge base to show new files
        const updatedKB = await fetch(`/api/knowledge-base/${selectedKB.id}`);
        if (updatedKB.ok) {
          const kbData = await updatedKB.json();
          setSelectedKB(kbData);
          setKnowledgeBases(prev => 
            prev.map(kb => kb.id === selectedKB.id ? kbData : kb)
          );
        }

        toast.success(`${files.length} file(s) uploaded successfully`);
      } else {
        throw new Error("Failed to upload files");
      }
    } catch (error) {
      console.error("Error uploading files:", error);
      toast.error("Failed to upload files");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  // Handle file input change
  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      uploadFiles(e.target.files);
    }
  };

  // Trigger file input
  const triggerFileUpload = () => {
    fileInputRef.current?.click();
  };

  // Load data when modal opens
  useEffect(() => {
    if (open) {
      loadKnowledgeBases();
    }
  }, [open, loadKnowledgeBases]);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle>Knowledge Base Management</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="manage" className="h-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="manage">Manage Files</TabsTrigger>
            <TabsTrigger value="create">Create Knowledge Base</TabsTrigger>
          </TabsList>

          <TabsContent value="manage" className="space-y-4 overflow-y-auto max-h-[60vh]">
            {knowledgeBases.length === 0 ? (
              <div className="text-center py-8">
                <FolderPlus className="mx-auto h-12 w-12 text-muted-foreground" />
                <p className="mt-2 text-muted-foreground">
                  No knowledge bases found. Create one to get started.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Knowledge Base Selector */}
                <div>
                  <Label>Select Knowledge Base</Label>
                  <select
                    className="w-full mt-1 p-2 border rounded-md"
                    value={selectedKB?.id || ""}
                    onChange={(e) => {
                      const kb = knowledgeBases.find(kb => kb.id === e.target.value);
                      setSelectedKB(kb || null);
                    }}
                  >
                    {knowledgeBases.map((kb) => (
                      <option key={kb.id} value={kb.id}>
                        {kb.name} ({kb.files?.length || 0} files)
                      </option>
                    ))}
                  </select>
                </div>

                {selectedKB && (
                  <>
                    {/* Upload Section */}
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
                      <div className="text-center">
                        <Upload className="mx-auto h-12 w-12 text-muted-foreground" />
                        <div className="mt-4">
                          <Button
                            onClick={triggerFileUpload}
                            disabled={isUploading}
                            className="mb-2"
                          >
                            <Plus className="w-4 h-4 mr-2" />
                            {isUploading ? "Uploading..." : "Upload Files"}
                          </Button>
                          <p className="text-sm text-muted-foreground">
                            Supports text files, markdown, and more
                          </p>
                        </div>
                      </div>
                      <input
                        ref={fileInputRef}
                        type="file"
                        multiple
                        className="hidden"
                        onChange={handleFileInputChange}
                        accept=".txt,.md,.json,.csv,.log"
                      />
                    </div>

                    {/* Files List */}
                    {selectedKB.files && selectedKB.files.length > 0 && (
                      <div>
                        <h3 className="font-medium mb-2">Files in {selectedKB.name}</h3>
                        <div className="space-y-2 max-h-64 overflow-y-auto">
                          {selectedKB.files.map((file: KnowledgeBaseFile) => (
                            <div
                              key={file.id}
                              className="flex items-center justify-between p-3 border rounded-lg"
                            >
                              <div className="flex items-center space-x-3">
                                <FileText className="w-4 h-4 text-muted-foreground" />
                                <div>
                                  <p className="font-medium">{file.originalName}</p>
                                  <p className="text-sm text-muted-foreground">
                                    {file.mimeType} • {Math.round(parseInt(file.size) / 1024)} KB
                                  </p>
                                </div>
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  // TODO: Implement file deletion
                                  toast.info("File deletion will be implemented soon");
                                }}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}
          </TabsContent>

          <TabsContent value="create" className="space-y-4">
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Knowledge Base Name</Label>
                <Input
                  id="name"
                  value={newKBName}
                  onChange={(e) => setNewKBName(e.target.value)}
                  placeholder="Enter knowledge base name"
                />
              </div>
              <div>
                <Label htmlFor="description">Description (Optional)</Label>
                <Textarea
                  id="description"
                  value={newKBDescription}
                  onChange={(e) => setNewKBDescription(e.target.value)}
                  placeholder="Describe what this knowledge base contains"
                  rows={3}
                />
              </div>
              <Button
                onClick={createKnowledgeBase}
                disabled={isCreating || !newKBName.trim()}
                className="w-full"
              >
                {isCreating ? "Creating..." : "Create Knowledge Base"}
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
