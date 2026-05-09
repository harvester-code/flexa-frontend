import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/Dialog";
import ProfileCriteriaSettings from "./ProfileCriteriaSettings";
import { ParquetMetadataItem } from "@/types/parquet";

interface RuleEditModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingRuleId: string | null;
  editingRuleName?: string;
  editDescription: string;
  createDescription: string;
  parquetMetadata?: ParquetMetadataItem[];
  definedProperties: string[];
  configType?: string;
  editingRule?: Record<string, unknown>;
}

export default function RuleEditModal({
  open,
  onOpenChange,
  editingRuleId,
  editingRuleName,
  editDescription,
  createDescription,
  parquetMetadata,
  definedProperties,
  configType,
  editingRule,
}: RuleEditModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-4xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {editingRuleId
              ? `Update ${editingRuleName || "Rule"}`
              : "Create New Rule"}
          </DialogTitle>
          <DialogDescription>
            {editingRuleId ? editDescription : createDescription}
          </DialogDescription>
        </DialogHeader>
        <div className="mt-4">
          <ProfileCriteriaSettings
            parquetMetadata={parquetMetadata}
            definedProperties={definedProperties}
            configType={configType}
            editingRule={editingRule}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
