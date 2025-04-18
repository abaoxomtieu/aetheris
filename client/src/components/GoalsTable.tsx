import {
  useGoals,
  useUpdateGoal,
  useGoalFeedbacks,
} from "@/hooks/use-career-data";
import { formatDate, statusColors } from "@/lib/utils";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Edit,
  Eye,
  Send,
  CheckCircle2,
  XCircle,
  Plus,
  MessageSquare,
  CornerDownRight,
  AlertTriangle,
} from "lucide-react";
import { SendBackFeedbackDialog } from "@/components/SendBackFeedbackDialog";
import React, { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useAuth } from "@/hooks/use-auth";
import { Goal, GoalStatus, goalStatusEnum } from "@shared/schema";
import { AddGoalForm } from "@/components/AddGoalForm";
import { EditGoalForm } from "@/components/EditGoalForm";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface GoalsTableProps {
  timeFilter?: string;
  filterByTimePeriod?: (date: Date) => boolean;
}

export function GoalsTable({
  timeFilter = "all",
  filterByTimePeriod,
}: GoalsTableProps) {
  const { data: goals, isLoading, isError } = useGoals();
  const updateGoalMutation = useUpdateGoal();
  const { toast } = useToast();
  const { user } = useAuth();
  const isEmployee = user?.role?.toLowerCase() === "employee";
  const isSam = user?.id === 1; // Check if the user is Sam (user ID 1)
  const [selectedGoal, setSelectedGoal] = useState<number | null>(null);
  const [statusToUpdate, setStatusToUpdate] = useState<GoalStatus | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isAddGoalDialogOpen, setIsAddGoalDialogOpen] = useState(false);
  const [isEditGoalDialogOpen, setIsEditGoalDialogOpen] = useState(false);
  const [goalToEdit, setGoalToEdit] = useState<Goal | null>(null);
  const [goalForFeedback, setGoalForFeedback] = useState<Goal | null>(null);
  const [isSendBackDialogOpen, setIsSendBackDialogOpen] = useState(false);

  // Default filter function if none is provided
  const defaultFilterByTime = (date: Date) => true;
  const filterFn = filterByTimePeriod || defaultFilterByTime;

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg overflow-hidden">
        <div className="p-6">
          <div className="animate-pulse flex flex-col space-y-4">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-full"></div>
            <div className="h-4 bg-gray-200 rounded w-5/6"></div>
          </div>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="bg-white rounded-lg overflow-hidden">
        <div className="p-6">
          <p className="text-red-500">
            There was an error loading your goals. Please try again later.
          </p>
        </div>
      </div>
    );
  }

  const handleStatusUpdate = async () => {
    if (!selectedGoal || !statusToUpdate) return;

    try {
      await updateGoalMutation.mutateAsync({
        id: selectedGoal,
        data: {
          status: statusToUpdate,
          progress:
            statusToUpdate === "completed"
              ? 100
              : statusToUpdate === "in_progress"
              ? 50
              : statusToUpdate === "pending_review"
              ? 90
              : undefined,
        },
      });
      toast({
        title: "Goal updated",
        description: `Goal status updated to ${statusToUpdate.replace(
          "_",
          " "
        )}`,
      });
      setIsDialogOpen(false);
    } catch (error) {
      toast({
        title: "Update failed",
        description: "Failed to update goal status",
        variant: "destructive",
      });
    }
  };

  // Function to directly update a goal status without opening the dialog
  const updateGoalStatusDirectly = async (
    goalId: number,
    newStatus: GoalStatus
  ) => {
    try {
      await updateGoalMutation.mutateAsync({
        id: goalId,
        data: {
          status: newStatus,
          progress:
            newStatus === "completed"
              ? 100
              : newStatus === "in_progress"
              ? 50
              : newStatus === "pending_review"
              ? 90
              : undefined,
        },
      });
      toast({
        title: "Goal updated",
        description: `Goal status updated to ${newStatus.replace("_", " ")}`,
      });
    } catch (error) {
      toast({
        title: "Update failed",
        description: "Failed to update goal status",
        variant: "destructive",
      });
    }
  };

  // Function to render an appropriate status badge for each goal
  const renderStatusBadge = (status: string) => {
    // Format status label with proper capitalization
    let label = status
      .replace(/_/g, " ")
      .split(" ")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");

    // Special case for backward compatibility
    if (status === "review") {
      label = "Pending Review";
    }

    // Get colors from the shared statusColors object
    const colorSet = statusColors[status as keyof typeof statusColors] || {
      bg: "#F3F4F6",
      text: "#6B7280",
      border: "#D1D5DB",
    };

    // Apply more vibrant styling with transitions
    return (
      <Badge
        style={{
          backgroundColor: colorSet.bg,
          color: colorSet.text,
          borderColor: colorSet.border,
          borderWidth: "1px",
          boxShadow: `0 1px 2px rgba(0, 0, 0, 0.05)`,
        }}
        className="font-medium px-3 py-1 rounded-full text-xs transition-all duration-200 hover:shadow-md"
      >
        {label}
      </Badge>
    );
  };

  // Available actions based on current status
  const getAvailableActions = (goal: any) => {
    const actions = [];

    switch (goal.status) {
      case "draft":
        actions.push(
          <Button
            key="send"
            size="sm"
            variant="default"
            className="ml-2 min-w-[100px] bg-blue-600 hover:bg-blue-700 text-white"
            onClick={() =>
              updateGoalStatusDirectly(goal.id, "pending_confirmed")
            }
            disabled={updateGoalMutation.isPending}
          >
            <Send className="h-3 w-3 mr-1" /> Submit
          </Button>
        );
        break;

      case "pending_confirmed":
        // If user is an employee, don't show any action buttons for "pending_confirmed" state
        if (!isEmployee) {
          actions.push(
            <Button
              key="confirm"
              size="sm"
              variant="outline"
              className="ml-2 min-w-[150px]"
              onClick={() => updateGoalStatusDirectly(goal.id, "confirmed")}
              disabled={updateGoalMutation.isPending}
            >
              <CheckCircle2 className="h-3 w-3 mr-1" /> Confirm
            </Button>
          );
          actions.push(
            <Button
              key="send_back_draft"
              size="sm"
              variant="outline"
              className="ml-2 min-w-[150px] bg-amber-50 text-amber-700 hover:bg-amber-100"
              onClick={() => {
                setGoalForFeedback(goal);
                setIsSendBackDialogOpen(true);
              }}
              disabled={updateGoalMutation.isPending}
            >
              <MessageSquare className="h-3 w-3 mr-1" /> Send Back
            </Button>
          );
          actions.push(
            <Button
              key="reject"
              size="sm"
              variant="destructive"
              className="ml-2 min-w-[150px]"
              onClick={() => updateGoalStatusDirectly(goal.id, "rejected")}
              disabled={updateGoalMutation.isPending}
            >
              <XCircle className="h-3 w-3 mr-1" /> Reject
            </Button>
          );
        }
        break;

      case "confirmed":
        if (isEmployee) {
          // Only employees see the "In Progress" button
          actions.push(
            <Button
              key="in_progress"
              size="sm"
              variant="default"
              className="ml-2 min-w-[150px] bg-blue-600 hover:bg-blue-700 text-white"
              onClick={() => updateGoalStatusDirectly(goal.id, "in_progress")}
              disabled={updateGoalMutation.isPending}
            >
              <Send className="h-3 w-3 mr-1" /> In Progress
            </Button>
          );
        } else {
          // Managers see a status update button
          actions.push(
            <Button
              key="status_update"
              size="sm"
              variant="outline"
              className="ml-2 min-w-[150px]"
              onClick={() => {
                setGoalToEdit(goal);
                setIsEditGoalDialogOpen(true);
              }}
              disabled={updateGoalMutation.isPending}
            >
              <Eye className="h-3 w-3 mr-1" /> Review Progress
            </Button>
          );
        }
        break;

      case "in_progress":
        if (isEmployee) {
          // Only employees see the "Send for Review" button
          actions.push(
            <Button
              key="review"
              size="sm"
              variant="default"
              className="ml-2 min-w-[150px] bg-blue-600 hover:bg-blue-700 text-white"
              onClick={() =>
                updateGoalStatusDirectly(goal.id, "pending_review")
              }
              disabled={updateGoalMutation.isPending}
            >
              <Eye className="h-3 w-3 mr-1" /> Send for Review
            </Button>
          );
        } else {
          // Managers see a status update button
          actions.push(
            <Button
              key="status_update"
              size="sm"
              variant="outline"
              className="ml-2 min-w-[150px]"
              onClick={() => {
                setGoalToEdit(goal);
                setIsEditGoalDialogOpen(true);
              }}
              disabled={updateGoalMutation.isPending}
            >
              <Eye className="h-3 w-3 mr-1" /> Review Progress
            </Button>
          );
        }
        break;

      case "pending_review":
      case "review": // For compatibility with old data
        if (isEmployee) {
          // For employees, show "Awaiting Review" text
          actions.push(
            <span className="text-xs text-neutral-500 ml-2">
              Awaiting Review
            </span>
          );
        } else {
          // For managers and admins, show action buttons
          actions.push(
            <Button
              key="reviewed"
              size="sm"
              variant="outline"
              className="ml-2 min-w-[150px]"
              onClick={() => updateGoalStatusDirectly(goal.id, "reviewed")}
              disabled={updateGoalMutation.isPending}
            >
              <Eye className="h-3 w-3 mr-1" /> Mark as Reviewed
            </Button>
          );
        }
        break;

      case "reviewed":
        actions.push(
          <Button
            key="approve"
            size="sm"
            variant="outline"
            className="ml-2 min-w-[150px] bg-green-50 text-green-700 hover:bg-green-100"
            onClick={() => updateGoalStatusDirectly(goal.id, "approved")}
            disabled={updateGoalMutation.isPending}
          >
            <CheckCircle2 className="h-3 w-3 mr-1" /> Approve
          </Button>
        );
        actions.push(
          <Button
            key="send_back"
            size="sm"
            variant="outline"
            className="ml-2 min-w-[150px] bg-amber-50 text-amber-700 hover:bg-amber-100"
            onClick={() => {
              setGoalForFeedback(goal);
              setIsSendBackDialogOpen(true);
            }}
            disabled={updateGoalMutation.isPending}
          >
            <MessageSquare className="h-3 w-3 mr-1" /> Send Back
          </Button>
        );
        actions.push(
          <Button
            key="reject2"
            size="sm"
            variant="destructive"
            className="ml-2 min-w-[150px]"
            onClick={() => updateGoalStatusDirectly(goal.id, "rejected")}
            disabled={updateGoalMutation.isPending}
          >
            <XCircle className="h-3 w-3 mr-1" /> Reject
          </Button>
        );
        break;

      case "approved":
        actions.push(
          <Button
            key="complete"
            size="sm"
            variant="outline"
            className="ml-2 min-w-[150px] bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
            onClick={() => updateGoalStatusDirectly(goal.id, "completed")}
            disabled={updateGoalMutation.isPending}
          >
            <CheckCircle2 className="h-3 w-3 mr-1" /> Mark Complete
          </Button>
        );
        break;
    }

    // Always allow editing except when completed or rejected
    // For employees, don't show edit button when goal is in pending_confirmed status
    if (
      goal.status !== "completed" &&
      goal.status !== "rejected" &&
      !(isEmployee && goal.status === "pending_confirmed")
    ) {
      actions.unshift(
        <Button
          key="edit"
          size="sm"
          variant="default"
          className="ml-2 min-w-[100px] bg-green-600 hover:bg-green-700 text-white"
          onClick={() => {
            setGoalToEdit(goal);
            setIsEditGoalDialogOpen(true);
          }}
        >
          <Edit className="h-3 w-3" /> Edit
        </Button>
      );
    }

    return actions;
  };

  // Component to display feedback for a goal
  const FeedbackRow = ({ goalId }: { goalId: number }) => {
    const { data: feedbacks, isLoading } = useGoalFeedbacks(goalId);

    if (isLoading || !feedbacks || feedbacks.length === 0) {
      return null;
    }

    // Sort feedbacks by creation date - newest first
    const sortedFeedbacks = [...feedbacks].sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    console.log("FEEDBACK DATA:", {
      goalId,
      feedbacksCount: feedbacks.length,
      feedbacks: feedbacks,
      sortedFeedbacks,
    });

    return (
      <TableRow className="bg-amber-50/50">
        <TableCell colSpan={9} className="py-2">
          <div className="flex items-start space-x-2 p-2 rounded-md">
            <div className="flex-shrink-0 mt-1">
              <CornerDownRight className="h-4 w-4 text-amber-500" />
            </div>
            <div className="flex-1">
              <div className="font-medium text-sm text-amber-800 flex items-center">
                <AlertTriangle className="h-4 w-4 mr-1 text-amber-500" />
                This goal was sent back from{" "}
                {sortedFeedbacks[0]?.feedbackGoalStatus || "Review"}
              </div>
              <div className="mt-2 space-y-3">
                {sortedFeedbacks.map((feedback) => (
                  <div
                    key={feedback.id}
                    className="bg-white p-3 rounded-md shadow-sm border border-amber-200"
                  >
                    <div className="flex items-center mb-1">
                      <Avatar className="h-6 w-6 mr-2">
                        <AvatarFallback className="text-xs bg-blue-100 text-blue-700">
                          {feedback.userId === 1 ? "SD" : "M"}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-sm font-medium text-neutral-800">
                        {feedback.userId === 1 ? "Sam Doe" : "Manager"}
                      </span>
                      <span className="text-xs text-neutral-500 ml-2">
                        {formatDate(new Date(feedback.createdAt))}
                      </span>
                    </div>
                    <p className="text-sm text-neutral-700 whitespace-pre-line">
                      {feedback.content}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </TableCell>
      </TableRow>
    );
  };

  return (
    <div className="overflow-hidden rounded-lg shadow-sm border border-gray-100">
      <div>
        <Table className="rounded-lg overflow-hidden">
          <TableCaption>
            {isSam ? (
              <div className="flex items-center justify-center space-x-2">
                <span>My Goals</span>
                <Badge
                  variant="outline"
                  className="ml-2 bg-indigo-50 text-indigo-700 border-indigo-200"
                >
                  See "My Reportees" tab for team goals
                </Badge>
              </div>
            ) : (
              "A list of your goals and their current status"
            )}
          </TableCaption>
          <TableHeader className="bg-blue-600 border-b border-blue-500">
            <TableRow>
              <TableHead className="w-[200px] font-semibold text-white">
                Goal
              </TableHead>
              <TableHead className="w-[300px] font-semibold text-white">
                Description
              </TableHead>
              <TableHead className="font-semibold text-white">
                Category
              </TableHead>
              <TableHead className="font-semibold text-white">
                Delegator
              </TableHead>
              <TableHead className="font-semibold text-white">
                Start Date
              </TableHead>
              <TableHead className="font-semibold text-white">
                Target Date
              </TableHead>
              <TableHead className="font-semibold text-white">Status</TableHead>
              <TableHead className="font-semibold text-white">
                Progress
              </TableHead>
              <TableHead className="text-right font-semibold text-white">
                Actions
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {goals &&
              goals
                .filter((goal) => {
                  if (timeFilter === "all") return true;

                  // Filter goals with different strategies based on their status
                  if (goal.status === "completed") {
                    // For completed goals, filter by their target date (when they were supposed to finish)
                    return filterFn(new Date(goal.targetDate));
                  } else if (
                    ["in_progress", "pending_review", "reviewed"].includes(
                      goal.status
                    )
                  ) {
                    // For active goals, filter by start date (when they began)
                    return filterFn(new Date(goal.startDate));
                  } else {
                    // For other goals (draft, confirmed, etc.), check if target date is within filter period
                    // This shows goals that need attention in the upcoming time period
                    return filterFn(new Date(goal.targetDate));
                  }
                })
                .map((goal) => {
                  // For each goal, we render two rows: the goal row and (conditionally) the feedback row
                  return (
                    <>
                      {/* Using fragment shorthand instead of React.Fragment */}
                      <TableRow key={goal.id}>
                        <TableCell className="font-medium">
                          {goal.title}
                        </TableCell>
                        <TableCell className="max-w-xs">
                          <div className="truncate">
                            {goal.description.split(" ").slice(0, 2).join(" ")}
                            ...
                          </div>
                        </TableCell>
                        <TableCell>{goal.category}</TableCell>
                        <TableCell>
                          <div className="flex flex-col space-y-2">
                            <Badge
                              variant="outline"
                              className={`capitalize font-normal ${
                                goal.origin === "Manager"
                                  ? "border-yellow-500 text-yellow-700 bg-yellow-50"
                                  : "border-blue-500 text-blue-700 bg-blue-50"
                              }`}
                            >
                              {goal.origin}
                            </Badge>

                            {goal.managerId && (
                              <Badge
                                variant="outline"
                                className="border-purple-500 text-purple-700 bg-purple-50"
                              >
                                Assigned by #{goal.managerId}
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>{formatDate(goal.startDate)}</TableCell>
                        <TableCell>{formatDate(goal.targetDate)}</TableCell>
                        <TableCell>{renderStatusBadge(goal.status)}</TableCell>
                        <TableCell>
                          <div className="flex items-center">
                            <div className="w-full bg-gray-200 rounded-full h-2.5 mr-2">
                              <div
                                className="bg-blue-600 h-2.5 rounded-full"
                                style={{ width: `${goal.progress}%` }}
                              ></div>
                            </div>
                            <span className="text-sm">{goal.progress}%</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end">
                            {getAvailableActions(goal)}
                          </div>
                        </TableCell>
                      </TableRow>

                      {/* Display feedback for goals that have been sent back with feedback (either from review or confirm) */}
                      {(goal.status === "in_progress" ||
                        goal.status === "draft") && (
                        <FeedbackRow
                          key={`feedback-${goal.id}`}
                          goalId={goal.id}
                        />
                      )}
                    </>
                  );
                })}
          </TableBody>
        </Table>

        {/* Status Update Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Update Goal Status</DialogTitle>
              <DialogDescription>
                Change the status of this goal. This will update the goal's
                progress and visibility.
              </DialogDescription>
            </DialogHeader>

            <div className="py-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                New Status
              </label>
              <Select
                value={statusToUpdate || ""}
                onValueChange={(value) =>
                  setStatusToUpdate(value as GoalStatus)
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select new status" />
                </SelectTrigger>
                <SelectContent>
                  {goalStatusEnum.map((status) => (
                    <SelectItem key={status} value={status}>
                      {status.replace(/_/g, " ")}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleStatusUpdate}
                disabled={updateGoalMutation.isPending}
              >
                {updateGoalMutation.isPending ? "Updating..." : "Update Status"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Add Goal Dialog */}
        <Dialog
          open={isAddGoalDialogOpen}
          onOpenChange={setIsAddGoalDialogOpen}
        >
          <DialogContent className="sm:max-w-[625px]">
            <DialogHeader className="sr-only">
              <DialogTitle>Add Goal</DialogTitle>
            </DialogHeader>
            <AddGoalForm onComplete={() => setIsAddGoalDialogOpen(false)} />
          </DialogContent>
        </Dialog>

        {/* Edit Goal Dialog */}
        <Dialog
          open={isEditGoalDialogOpen}
          onOpenChange={setIsEditGoalDialogOpen}
        >
          <DialogContent className="sm:max-w-[625px]">
            <DialogHeader>
              <DialogTitle>Update Goal Progress</DialogTitle>
              <DialogDescription>
                Update the progress of this goal and add a comment about your
                progress.
              </DialogDescription>
            </DialogHeader>
            {goalToEdit && (
              <EditGoalForm
                goal={goalToEdit}
                onComplete={() => {
                  setIsEditGoalDialogOpen(false);
                  setGoalToEdit(null);
                }}
              />
            )}
          </DialogContent>
        </Dialog>

        {/* Send Back Feedback Dialog */}
        {goalForFeedback && (
          <SendBackFeedbackDialog
            goalId={goalForFeedback.id}
            goalTitle={goalForFeedback.title}
            isOpen={isSendBackDialogOpen}
            onClose={() => {
              setIsSendBackDialogOpen(false);
              setGoalForFeedback(null);
            }}
            goal={goalForFeedback}
          />
        )}
      </div>
    </div>
  );
}
