import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { EditGoalForm } from "@/components/EditGoalForm";
import { useUpdateGoal } from "@/hooks/use-career-data";
import { useReporteeGoals, ReporteeGoalsData } from "@/hooks/use-career-data";
import { Goal, GoalStatus } from "@shared/schema";
import { formatDate, statusColors, calculateCompletionPercentage } from "@/lib/utils";
import { Loader2, ChevronDown, ChevronRight, BarChart3, BarChart2, PieChart, MessageSquare } from "lucide-react";
import { SendBackFeedbackDialog } from "@/components/SendBackFeedbackDialog";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useAuth } from "@/hooks/use-auth";
import { queryClient } from "@/lib/queryClient";
import { Progress } from "@/components/ui/progress";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

export function ReporteeGoalsTable() {
  const { user } = useAuth();
  const { data: reporteeGoalsData, isLoading } = useReporteeGoals();
  const [expandedUsers, setExpandedUsers] = useState<{[key: number]: boolean}>({});
  const [editGoalId, setEditGoalId] = useState<number | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [goalForFeedback, setGoalForFeedback] = useState<Goal | null>(null);
  const [isSendBackDialogOpen, setIsSendBackDialogOpen] = useState(false);
  const { toast } = useToast();
  const updateGoalMutation = useUpdateGoal();
  
  // Debug output
  console.log("Reportee Goals Data:", reporteeGoalsData);
  console.log("Current user role:", user?.role);
  console.log("Is user a manager or admin?", user?.role === "manager" || user?.role === "admin");
  console.log("Raw user object:", user);

  // Handle user expansion toggle
  const toggleUserExpansion = (userId: number) => {
    setExpandedUsers(prev => ({
      ...prev,
      [userId]: !prev[userId]
    }));
  };

  // Get goal for editing
  const getGoalForEditing = (): Goal | null => {
    if (!editGoalId || !reporteeGoalsData) return null;
    
    for (const reporteeData of reporteeGoalsData) {
      const goal = reporteeData.goals.find(g => g.id === editGoalId);
      if (goal) return goal;
    }
    
    return null;
  };

  // Handle edit click
  const handleEditClick = (goalId: number) => {
    setEditGoalId(goalId);
    setEditDialogOpen(true);
  };

  // Handle status update
  const updateGoalStatus = async (goalId: number, newStatus: GoalStatus) => {
    try {
      await updateGoalMutation.mutateAsync({
        id: goalId,
        data: { status: newStatus }
      });
      
      // Invalidate reportees/goals query to refresh the data
      queryClient.invalidateQueries({ queryKey: ["/api/reportees/goals"] });
      
      toast({
        title: "Goal status updated",
        description: `The goal status has been updated to ${newStatus}`,
      });
    } catch (error) {
      toast({
        title: "Update failed",
        description: "Failed to update goal status. Please try again.",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  if (!reporteeGoalsData || reporteeGoalsData.length === 0) {
    return (
      <div className="text-center p-8 border border-dashed border-neutral-300 rounded-lg bg-neutral-50">
        <p className="text-neutral-500">No reportee data available.</p>
      </div>
    );
  }

  // Get the goal being edited
  const goalToEdit = getGoalForEditing();

  return (
    <div className="space-y-6">
      {reporteeGoalsData.map((reporteeData) => (
        <Collapsible 
          key={reporteeData.user.id}
          open={expandedUsers[reporteeData.user.id]}
          onOpenChange={() => toggleUserExpansion(reporteeData.user.id)}
          className="border border-neutral-200 rounded-lg overflow-hidden"
        >
          <CollapsibleTrigger asChild>
            <div className="bg-neutral-100 p-4 cursor-pointer hover:bg-neutral-200 transition-colors">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center">
                  {expandedUsers[reporteeData.user.id] ? (
                    <ChevronDown className="h-5 w-5 mr-2 text-neutral-600" />
                  ) : (
                    <ChevronRight className="h-5 w-5 mr-2 text-neutral-600" />
                  )}
                  <div>
                    <h3 className="font-medium text-neutral-800">{reporteeData.user.fullName}</h3>
                    <p className="text-sm text-neutral-500">{reporteeData.user.title} • {reporteeData.user.department}</p>
                  </div>
                </div>
                <Badge
                  style={{
                    backgroundColor: '#EBF8FF',
                    color: '#3182CE',
                    borderColor: '#90CDF4',
                    borderWidth: '1px',
                    boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)'
                  }}
                  className="font-medium px-3 py-1 rounded-full text-xs transition-all duration-200 hover:shadow-md"
                >
                  {reporteeData.goals.length} Goals
                </Badge>
              </div>
              
              {/* Goals Summary Section */}
              {reporteeData.goals.length > 0 && (
                <div className="pt-2 pb-1">
                  {/* Overall Completion Progress */}
                  <div className="mb-3">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-xs font-medium text-neutral-600 flex items-center">
                        <BarChart2 className="h-3 w-3 mr-1" /> Overall Completion
                      </span>
                      <span className="text-xs font-medium text-neutral-600">
                        {calculateCompletionPercentage(reporteeData.goals)}%
                      </span>
                    </div>
                    <Progress 
                      value={calculateCompletionPercentage(reporteeData.goals)} 
                      className="h-2" 
                    />
                  </div>
                  
                  {/* Status Distribution */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-1">
                    {(() => {
                      // Calculate status counts
                      const statusCounts: Record<string, number> = {};
                      reporteeData.goals.forEach(goal => {
                        statusCounts[goal.status] = (statusCounts[goal.status] || 0) + 1;
                      });
                      
                      // Create badges for each status
                      return Object.keys(statusCounts).map(status => (
                        <TooltipProvider key={status}>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div className="flex justify-between items-center px-3 py-1.5 rounded-md" 
                                style={{
                                  backgroundColor: statusColors[status]?.bg || '#F3F4F6',
                                  border: `1px solid ${statusColors[status]?.border || '#D1D5DB'}`
                                }}
                              >
                                <span className="text-xs font-medium" 
                                  style={{ color: statusColors[status]?.text || '#6B7280' }}
                                >
                                  {status.replace(/_/g, ' ').split(' ').map(word => 
                                    word.charAt(0).toUpperCase() + word.slice(1)
                                  ).join(' ')}
                                </span>
                                <Badge className="ml-2 px-1.5 py-0.5 text-[10px] font-bold rounded-full"
                                  style={{ 
                                    backgroundColor: 'white',
                                    color: statusColors[status]?.text || '#6B7280'
                                  }}
                                >
                                  {statusCounts[status]}
                                </Badge>
                              </div>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>{statusCounts[status]} goals in {status.replace(/_/g, ' ')} status</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      ));
                    })()}
                  </div>
                  
                  {/* Click to view details hint */}
                  <div className="flex justify-center mt-2">
                    <span className="text-xs text-neutral-500 italic">Click to {expandedUsers[reporteeData.user.id] ? 'collapse' : 'expand'} details</span>
                  </div>
                </div>
              )}
            </div>
          </CollapsibleTrigger>
          
          <CollapsibleContent>
            {reporteeData.goals.length > 0 ? (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader className="bg-blue-600">
                    <TableRow>
                      <TableHead className="text-white">Title</TableHead>
                      <TableHead className="text-white">Category</TableHead>
                      <TableHead className="text-white">Delegator</TableHead>
                      <TableHead className="text-white">Status</TableHead>
                      <TableHead className="text-white">Progress</TableHead>
                      <TableHead className="text-white">Target Date</TableHead>
                      <TableHead className="text-white">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {reporteeData.goals.map((goal) => (
                      <TableRow key={goal.id}>
                        <TableCell className="font-medium">{goal.title}</TableCell>
                        <TableCell>{goal.category}</TableCell>
                        <TableCell>
                          <div className="flex flex-col space-y-2">
                            <Badge 
                              variant="outline"
                              className={`capitalize font-normal ${goal.origin === 'Manager' ? 'border-yellow-500 text-yellow-700 bg-yellow-50' : 'border-blue-500 text-blue-700 bg-blue-50'}`}
                            >
                              {goal.origin}
                            </Badge>
                            {goal.managerId && (
                              <Badge variant="outline" className="border-purple-500 text-purple-700 bg-purple-50">
                                Assigned by #{goal.managerId}
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge 
                            style={{
                              backgroundColor: statusColors[goal.status as keyof typeof statusColors]?.bg || '#F3F4F6',
                              color: statusColors[goal.status as keyof typeof statusColors]?.text || '#6B7280',
                              borderColor: statusColors[goal.status as keyof typeof statusColors]?.border || '#D1D5DB',
                              borderWidth: '1px',
                              boxShadow: `0 1px 2px rgba(0, 0, 0, 0.05)`
                            }}
                            className="font-medium px-3 py-1 rounded-full text-xs transition-all duration-200 hover:shadow-md"
                          >
                            {goal.status.replace(/_/g, ' ').split(' ').map(word => 
                              word.charAt(0).toUpperCase() + word.slice(1)
                            ).join(' ')}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="w-full bg-neutral-200 rounded-full h-2.5 dark:bg-neutral-700">
                            <div 
                              className="bg-blue-600 h-2.5 rounded-full" 
                              style={{ width: `${goal.progress}%` }}
                            />
                          </div>
                          <span className="text-xs text-neutral-500 mt-1">{goal.progress}%</span>
                        </TableCell>
                        <TableCell>
                          {formatDate(goal.targetDate)}
                        </TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            {/* Show buttons based on status and user role */}
                            {
                              goal.status === "pending_confirmed" ? (
                                <>
                                  <Button 
                                    variant="default" 
                                    size="sm"
                                    className="bg-green-600 hover:bg-green-700 text-white text-xs h-8"
                                    onClick={() => updateGoalStatus(goal.id, "confirmed")}
                                    disabled={updateGoalMutation.isPending}
                                  >
                                    {updateGoalMutation.isPending ? (
                                      <Loader2 className="h-3 w-3 animate-spin mr-1" />
                                    ) : (
                                      "Accept"
                                    )}
                                  </Button>
                                  <Button 
                                    variant="default" 
                                    size="sm"
                                    className="bg-amber-600 hover:bg-amber-700 text-white text-xs h-8 mx-2"
                                    onClick={() => {
                                      setGoalForFeedback(goal);
                                      setIsSendBackDialogOpen(true);
                                    }}
                                    disabled={updateGoalMutation.isPending}
                                  >
                                    <MessageSquare className="h-3 w-3 mr-1" />
                                    Send Back
                                  </Button>
                                  <Button 
                                    variant="default" 
                                    size="sm"
                                    className="bg-red-600 hover:bg-red-700 text-white text-xs h-8"
                                    onClick={() => updateGoalStatus(goal.id, "rejected")}
                                    disabled={updateGoalMutation.isPending}
                                  >
                                    {updateGoalMutation.isPending ? (
                                      <Loader2 className="h-3 w-3 animate-spin mr-1" />
                                    ) : (
                                      "Reject"
                                    )}
                                  </Button>
                                </>
                              ) : goal.status === "pending_review" ? (
                                <>
                                  <Button 
                                    variant="default" 
                                    size="sm"
                                    className="bg-green-600 hover:bg-green-700 text-white text-xs h-8 mr-2"
                                    onClick={() => updateGoalStatus(goal.id, "completed")}
                                    disabled={updateGoalMutation.isPending}
                                  >
                                    {updateGoalMutation.isPending ? (
                                      <Loader2 className="h-3 w-3 animate-spin mr-1" />
                                    ) : (
                                      "Review Accept"
                                    )}
                                  </Button>
                                  <Button 
                                    variant="default" 
                                    size="sm"
                                    className="bg-amber-600 hover:bg-amber-700 text-white text-xs h-8 mr-2"
                                    onClick={() => {
                                      setGoalForFeedback(goal);
                                      setIsSendBackDialogOpen(true);
                                    }}
                                    disabled={updateGoalMutation.isPending}
                                  >
                                    <MessageSquare className="h-3 w-3 mr-1" />
                                    Send Back
                                  </Button>
                                  <Button 
                                    variant="default" 
                                    size="sm"
                                    className="bg-red-600 hover:bg-red-700 text-white text-xs h-8"
                                    onClick={() => updateGoalStatus(goal.id, "rejected")}
                                    disabled={updateGoalMutation.isPending}
                                  >
                                    {updateGoalMutation.isPending ? (
                                      <Loader2 className="h-3 w-3 animate-spin mr-1" />
                                    ) : (
                                      "Review Reject"
                                    )}
                                  </Button>
                                </>
                              ) : (
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={() => handleEditClick(goal.id)}
                                  className="text-xs h-8"
                                >
                                  Review
                                </Button>
                              )
                            }
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="p-4 text-center text-neutral-500">
                No goals found for this employee.
              </div>
            )}
          </CollapsibleContent>
        </Collapsible>
      ))}

      {/* Edit Goal Dialog */}
      {goalToEdit && (
        <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
          <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Review Goal</DialogTitle>
            </DialogHeader>
            <EditGoalForm 
              goal={goalToEdit} 
              onComplete={() => setEditDialogOpen(false)} 
            />
          </DialogContent>
        </Dialog>
      )}
      
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
  );
}