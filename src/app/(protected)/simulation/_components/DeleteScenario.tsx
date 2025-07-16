import React from 'react';
import { Button } from '@/components/ui/Button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/Dialog';

interface DeleteScenarioProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  count: number;
}

const DeleteScenario: React.FC<DeleteScenarioProps> = ({ open, onClose, onConfirm, count }) => {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Delete Scenario{count > 1 ? 's' : ''}</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete {count} scenario{count > 1 ? 's' : ''}?
            <br />
            The deleted list can be checked in Trash Bin.
          </DialogDescription>
        </DialogHeader>
        <div className="mt-6 flex justify-end gap-3">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={onConfirm}>
            Delete
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default DeleteScenario;
