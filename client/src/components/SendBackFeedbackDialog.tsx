import React, { useState } from "react";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Loader2, SendIcon } from "lucide-react";
import { queryClient } from "@/lib/queryClient";
import { Goal } from "@shared/schema";

interface SendBackFeedbackDialogProps {
  goalId: number;
  goalTitle: string;
  isOpen: boolean;
  onClose: () => void;
  goal?: Goal; // Optional goal object to determine feedback status
}

export function SendBackFeedbackDialog({
  goalId,
  goalTitle,
  isOpen,
  onClose,
  goal
}: SendBackFeedbackDialogProps) {
  const [feedback, setFeedback] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  
  // Determine feedback status and target state based on the current goal status
  const feedbackStatus = goal?.status === "pending_confirmed" ? "Goal Confirmation Status" : "Goal Review Status";
  // For pending_confirmed goals, we send back to draft; for reviewed goals, we send back to in_progress
  const targetStatus = goal?.status === "pending_confirmed" ? "draft" : "in_progress";

  const handleSendBack = async () => {
    if (!feedback.trim()) {
      toast({
        title: "Feedback Required",
        description: "Please provide feedback before sending back the goal.",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Create a FormData object to send both the feedback and status change
      const formData = new FormData();
      formData.append("content", feedback);
      formData.append("goalId", goalId.toString());
      formData.append("source", "Manager Feedback");
      formData.append("date", new Date().toISOString());
      formData.append("feedbackGoalStatus", feedbackStatus);
      
      // Submit feedback
      const feedbackRes = await fetch("/api/feedbacks", {
        method: "POST",
        body: formData,
        credentials: "include",
      });
      
      if (!feedbackRes.ok) {
        throw new Error("Failed to submit feedback");
      }
      
      // Update goal status to either draft or in_progress (sending it back to employee)
      const statusRes = await fetch(`/api/goals/${goalId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: targetStatus }),
        credentials: "include",
      });
      
      if (!statusRes.ok) {
        throw new Error("Failed to update goal status");
      }
      
      // Success!
      toast({
        title: "Goal Sent Back",
        description: "The goal has been sent back to the employee with your feedback.",
      });
      
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ["/api/goals"] });
      queryClient.invalidateQueries({ queryKey: ["/api/feedbacks"] });
      queryClient.invalidateQueries({ queryKey: ["/api/reportees/goals"] });
      
      // Close dialog and clear feedback
      onClose();
      setFeedback("");
    } catch (error) {
      console.error("Error sending back goal:", error);
      toast({
        title: "Error",
        description: "Failed to send back the goal. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Send Goal Back to Employee</DialogTitle>
        </DialogHeader>
        
        <div className="py-4">
          <div className="mb-4">
            <h3 className="text-sm font-medium text-neutral-700 mb-1">Goal</h3>
            <p className="text-neutral-600">{goalTitle}</p>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="feedback" className="text-sm font-medium text-neutral-700">
              Feedback for Employee
            </Label>
            <Textarea
              id="feedback"
              placeholder="Provide constructive feedback about what needs to be improved or modified..."
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              className="min-h-[120px]"
            />
            <p className="text-xs text-neutral-500">
              This feedback will be visible to the employee and will help them understand what needs to be changed.
            </p>
          </div>
        </div>
        
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleSendBack}
            disabled={isSubmitting}
            className="bg-amber-600 hover:bg-amber-700 text-white"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Sending...
              </>
            ) : (
              <>
                <SendIcon className="mr-2 h-4 w-4" />
                Send Back
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}