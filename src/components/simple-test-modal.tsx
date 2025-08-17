"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "ui/dialog";

interface SimpleTestModalProps {
  open: boolean;
  onClose: () => void;
}

export function SimpleTestModal({ open, onClose }: SimpleTestModalProps) {
  console.log("SimpleTestModal render - open:", open);
  
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Test Modal</DialogTitle>
        </DialogHeader>
        <div className="p-4">
          <p>This is a simple test modal to verify the dialog system works.</p>
          <p>If you can see this, the modal system is working correctly.</p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
