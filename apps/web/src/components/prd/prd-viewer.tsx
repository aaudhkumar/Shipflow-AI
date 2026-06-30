"use client";

import { PRDSection } from "./prd-section";
import { UserStoriesSection } from "./user-stories-section";
import { AcceptanceCriteriaSection } from "./acceptance-criteria-section";
import { Button } from "@/components/ui/button";
import { Copy, Printer } from "lucide-react";
import { toast } from "sonner";

interface PRDViewerProps {
  prd: any;
  featureId: string;
  orgId: string;
  canEdit: boolean;
}

export function PRDViewer({ prd, featureId, orgId, canEdit }: PRDViewerProps) {
  if (!prd) return null;

  // Print functionality is now handled by the parent container

  return (
    <div className="space-y-6">
      <div className="space-y-6 print:space-y-4">
        <PRDSection 
          title="Problem Statement" 
          content={prd.problemStatement || ""} 
          field="problemStatement" 
          featureId={featureId} 
          orgId={orgId}
          canEdit={canEdit} 
        />
        
        <PRDSection 
          title="Goals" 
          content={prd.goals || []} 
          field="goals" 
          featureId={featureId} 
          orgId={orgId}
          canEdit={canEdit} 
          isList 
        />
        
        <PRDSection 
          title="Non-Goals" 
          content={prd.nonGoals || []} 
          field="nonGoals" 
          featureId={featureId} 
          orgId={orgId}
          canEdit={canEdit} 
          isList 
        />
        
        <UserStoriesSection 
          stories={prd.userStories || []} 
          featureId={featureId} 
          orgId={orgId}
          canEdit={canEdit} 
        />
        
        <AcceptanceCriteriaSection 
          criteria={prd.acceptanceCriteria || []} 
          featureId={featureId} 
          orgId={orgId}
          canEdit={canEdit} 
        />
        
        <PRDSection 
          title="Edge Cases" 
          content={prd.edgeCases || []} 
          field="edgeCases" 
          featureId={featureId} 
          orgId={orgId}
          canEdit={canEdit} 
          isList 
        />
        
        <PRDSection 
          title="Success Metrics" 
          content={prd.successMetrics || []} 
          field="successMetrics" 
          featureId={featureId} 
          orgId={orgId}
          canEdit={canEdit} 
          isList 
        />
      </div>
    </div>
  );
}
