import { useCareerEvents, useGoals, useFeedbacks } from "@/hooks/use-career-data";
import { formatDate, statusColors, getEventTypeIcon } from "@/lib/utils";
import { 
  Award, Briefcase, Flag, Eye, 
  CheckCircle, ArrowRight, Edit, Send,
  ChevronRight 
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { useUpdateGoal } from "@/hooks/use-career-data";
import { useToast } from "@/hooks/use-toast";

export function Timeline() {
  const { data: careerEvents, isLoading: isEventsLoading } = useCareerEvents();
  const { data: goals, isLoading: isGoalsLoading } = useGoals();
  const { data: feedbacks, isLoading: isFeedbacksLoading } = useFeedbacks();
  const updateGoalMutation = useUpdateGoal();
  const { toast } = useToast();
  
  const handleSubmitGoal = async (goalId: number) => {
    try {
      await updateGoalMutation.mutateAsync({
        id: goalId,
        data: { status: "completed", progress: 100 }
      });
      
      toast({
        title: "Goal submitted successfully",
        description: "Your goal has been marked as completed.",
        variant: "default",
      });
    } catch (error) {
      toast({
        title: "Failed to submit goal",
        description: "There was an error submitting your goal.",
        variant: "destructive",
      });
    }
  };
  
  const getIconComponent = (eventType: string) => {
    switch (eventType) {
      case "promotion":
        return <Award className="text-white" />;
      case "career_start":
        return <Briefcase className="text-white" />;
      case "goal":
        return <Flag className="text-white" />;
      case "review":
        return <Eye className="text-white" />;
      default:
        return <Award className="text-white" />;
    }
  };
  
  const renderTimelineItems = () => {
    if (isEventsLoading || isGoalsLoading) {
      return Array(3).fill(0).map((_, index) => (
        <div key={`skeleton-${index}`} className="relative mb-12">
          <div className="md:flex items-center mb-3">
            <div className="mb-3 md:mb-0 flex md:justify-end md:w-1/2">
              <Skeleton className="h-10 w-32 md:mr-8" />
            </div>
            <div className="mx-6 z-10 flex items-center justify-center rounded-full bg-neutral-200 shadow-lg h-8 w-8 md:mx-0">
              <Skeleton className="h-4 w-4 rounded-full" />
            </div>
            <div className="md:pl-8 md:w-1/2">
              <Skeleton className="h-10 w-48" />
            </div>
          </div>
          <div className="md:grid md:grid-cols-2 md:gap-8">
            <div className="md:text-right md:pr-12 mb-6 md:mb-0">
              <Skeleton className="h-32 w-full" />
            </div>
            <div className="md:pl-12">
              <Skeleton className="h-32 w-full" />
            </div>
          </div>
        </div>
      ));
    }
    
    // Combine and sort all timeline items
    const allItems = [
      ...(careerEvents || []).map(event => ({
        ...event,
        itemType: 'career',
      })),
      ...(goals || []).map(goal => ({
        ...goal,
        itemType: 'goal',
        eventType: goal.status === 'review' ? 'review' : 'goal',
      }))
    ].sort((a, b) => {
      const dateA = new Date(a.itemType === 'career' ? a.date : a.targetDate);
      const dateB = new Date(b.itemType === 'career' ? b.date : b.targetDate);
      return dateB.getTime() - dateA.getTime();
    });
    
    return allItems.map((item, index) => {
      if (item.itemType === 'career') {
        const event = item;
        return (
          <div key={`event-${event.id}`} className="relative mb-12">
            <div className="md:flex items-center mb-3">
              <div className="mb-3 md:mb-0 flex md:justify-end md:w-1/2">
                <div className="md:pr-8">
                  <span className="text-lg font-semibold block text-primary-800">
                    {formatDate(event.date)}
                  </span>
                  <span className="text-neutral-500 text-sm">
                    {event.eventType === 'promotion' ? 'Promotion' : 
                     event.eventType === 'career_start' ? 'Career Start' : 'Event'}
                  </span>
                </div>
              </div>
              <div className="mx-6 z-10 flex items-center justify-center rounded-full bg-primary-800 shadow-lg h-8 w-8 md:mx-0">
                {getIconComponent(event.eventType)}
              </div>
              <div className="md:pl-8 md:w-1/2">
                <span className="text-lg font-semibold block text-primary-800">{event.title}</span>
                <span className="text-neutral-500 text-sm">{event.description}</span>
              </div>
            </div>

            <div className="md:grid md:grid-cols-2 md:gap-8">
              {event.eventType === 'career_start' || index % 2 === 0 ? (
                <>
                  <div className="md:text-right md:pr-12 mb-6 md:mb-0">
                    {/* Empty or key responsibilities */}
                    {event.details?.responsibilities && (
                      <div className="bg-white p-5 rounded-lg shadow">
                        <h3 className="text-md font-medium text-neutral-900 mb-2">Key Responsibilities</h3>
                        <ul className="space-y-2 text-neutral-600">
                          {event.details.responsibilities.map((resp, idx) => (
                            <li key={idx} className="flex md:flex-row-reverse">
                              <span className="md:text-right">{resp}</span>
                              <div className="text-primary-600 md:mr-2 mr-2 md:ml-2 flex-shrink-0 mt-1">•</div>
                            </li>
                          ))}
                        </ul>
                        {event.details?.quote && (
                          <div className="mt-4 pt-3 border-t border-neutral-200">
                            <blockquote className="italic text-neutral-600 text-sm">
                              "{event.details.quote}"
                            </blockquote>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  <div className="md:pl-12">
                    {event.details?.achievements && (
                      <div className="bg-white p-5 rounded-lg shadow">
                        <h3 className="text-md font-medium text-neutral-900 mb-2">Achievement Highlights</h3>
                        <ul className="space-y-2">
                          {event.details.achievements.map((ach, idx) => (
                            <li key={idx} className="flex">
                              <CheckCircle className="text-status-success h-4 w-4 mr-2 flex-shrink-0 mt-1" />
                              <span>{ach}</span>
                            </li>
                          ))}
                        </ul>
                        <div className="mt-4 flex justify-end">
                          <Button variant="ghost" size="sm" className="text-primary-700 hover:text-primary-900">
                            View details <ArrowRight className="ml-1 h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <>
                  <div className="md:text-right md:pr-12 mb-6 md:mb-0">
                    {event.details?.achievements && (
                      <div className="bg-white p-5 rounded-lg shadow">
                        <h3 className="text-md font-medium text-neutral-900 mb-2">Achievement Highlights</h3>
                        <ul className="space-y-2">
                          {event.details.achievements.map((ach, idx) => (
                            <li key={idx} className="flex md:flex-row-reverse">
                              <span className="md:text-right">{ach}</span>
                              <CheckCircle className="text-status-success h-4 w-4 md:mr-0 md:ml-2 mr-2 flex-shrink-0 mt-1" />
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                  <div className="md:pl-12">
                    {/* Empty or achievements section */}
                  </div>
                </>
              )}
            </div>
          </div>
        );
      } else if (item.itemType === 'goal') {
        const goal = item;
        const goalFeedback = feedbacks?.find(f => f.goalId === goal.id);
        const status = statusColors[goal.status as keyof typeof statusColors] || statusColors.in_progress;
        
        return (
          <div key={`goal-${goal.id}`} className="relative mb-12">
            <div className="md:flex items-center mb-3">
              <div className="mb-3 md:mb-0 flex md:justify-end md:w-1/2">
                <div className="md:pr-8">
                  <span className="text-lg font-semibold block text-primary-800">
                    {formatDate(goal.targetDate)}
                  </span>
                  <span className="text-neutral-500 text-sm">
                    {goal.status === 'review' ? 'Goal in Review' : 
                     goal.status === 'completed' ? 'Goal Accomplishment' : 
                     'Goal in Progress'}
                  </span>
                </div>
              </div>
              <div className={`mx-6 z-10 flex items-center justify-center rounded-full ${goal.status === 'review' ? 'bg-status-review' : goal.status === 'completed' ? 'bg-status-success' : 'bg-status-inprogress'} shadow-lg h-8 w-8 md:mx-0`}>
                {goal.status === 'review' ? <Eye className="text-white" /> : <Flag className="text-white" />}
              </div>
              <div className="md:pl-8 md:w-1/2">
                <span className={`text-lg font-semibold block ${goal.status === 'review' ? 'text-status-review' : goal.status === 'completed' ? 'text-status-success' : 'text-status-inprogress'}`}>
                  {goal.title}
                </span>
                <span className="text-neutral-500 text-sm">
                  {goal.status === 'review' ? 'Waiting for final approval' : 
                   goal.status === 'completed' ? `${goal.category} with high results` : 
                   `${goal.category} in progress`}
                </span>
              </div>
            </div>

            <div className="md:grid md:grid-cols-2 md:gap-8">
              {goal.status === 'completed' && (
                <>
                  <div className="md:text-right md:pr-12 mb-6 md:mb-0">
                    <div className="bg-white p-5 rounded-lg shadow">
                      <div className="flex justify-between items-center mb-2">
                        <h3 className="text-md font-medium text-neutral-900">Goal Details</h3>
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-status-success">
                          Completed
                        </span>
                      </div>
                      <p className="text-neutral-600 mb-4">{goal.description}</p>
                      <div className="border-t border-neutral-200 pt-4">
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-neutral-500 flex items-center">
                            <CalendarIcon className="h-4 w-4 mr-1" /> 
                            Completed: {formatDate(goal.updatedAt)}
                          </span>
                          <span className="text-status-success font-medium flex items-center">
                            <CheckCircle className="h-4 w-4 mr-1" /> 100%
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="md:pl-12">
                    {goalFeedback && (
                      <div className="bg-white p-5 rounded-lg shadow">
                        <h3 className="text-md font-medium text-neutral-900 mb-2">Feedback</h3>
                        <div className="p-3 bg-neutral-50 rounded-md mb-3">
                          <p className="text-neutral-700 italic">
                            "{goalFeedback.content}"
                          </p>
                          <div className="mt-2 text-sm text-neutral-500">
                            — {goalFeedback.source}
                          </div>
                        </div>
                        {goalFeedback.attachments && goalFeedback.attachments.length > 0 && (
                          <div className="flex items-center mt-3">
                            <FileText className="text-neutral-400 h-4 w-4 mr-2" />
                            <span className="text-sm text-primary-700">
                              {goalFeedback.attachments[0]}
                            </span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </>
              )}

              {goal.status === 'review' && (
                <>
                  <div className="md:text-right md:pr-12 mb-6 md:mb-0">
                    {/* Empty in alternating layout */}
                  </div>
                  <div className="md:pl-12">
                    <div className="bg-white p-5 rounded-lg shadow">
                      <div className="flex justify-between items-center mb-2">
                        <h3 className="text-md font-medium text-neutral-900">Goal Details</h3>
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-status-review">
                          In Review
                        </span>
                      </div>
                      <p className="text-neutral-600 mb-4">{goal.description}</p>
                      
                      <div className="mb-4">
                        <div className="w-full bg-neutral-200 rounded-full h-2.5">
                          <div 
                            className="bg-status-review h-2.5 rounded-full" 
                            style={{ width: `${goal.progress}%` }}
                          ></div>
                        </div>
                        <div className="flex justify-between mt-1 text-xs text-neutral-500">
                          <span>Progress</span>
                          <span>{goal.progress}%</span>
                        </div>
                      </div>
                      
                      <div className="mt-3 flex justify-end space-x-3">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="text-sm px-3 py-1 border border-neutral-300 rounded-md hover:bg-neutral-50 inline-flex items-center"
                        >
                          <Edit className="h-3 w-3 mr-1" /> Edit
                        </Button>
                        <Button 
                          size="sm" 
                          className="text-sm px-3 py-1 bg-primary-700 text-white rounded-md hover:bg-primary-800 inline-flex items-center"
                          onClick={() => handleSubmitGoal(goal.id)}
                          disabled={updateGoalMutation.isPending}
                        >
                          <Send className="h-3 w-3 mr-1" /> Submit
                        </Button>
                      </div>
                    </div>
                  </div>
                </>
              )}

              {goal.status === 'in_progress' && (
                <>
                  <div className="md:text-right md:pr-12 mb-6 md:mb-0">
                    <div className="bg-white p-5 rounded-lg shadow">
                      <div className="flex justify-between items-center mb-2">
                        <h3 className="text-md font-medium text-neutral-900">Goal Details</h3>
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-status-inprogress">
                          In Progress
                        </span>
                      </div>
                      <p className="text-neutral-600 mb-4">{goal.description}</p>
                      <div className="mb-4">
                        <div className="w-full bg-neutral-200 rounded-full h-2.5">
                          <div 
                            className="bg-status-inprogress h-2.5 rounded-full" 
                            style={{ width: `${goal.progress}%` }}
                          ></div>
                        </div>
                        <div className="flex justify-between mt-1 text-xs text-neutral-500">
                          <span>Progress</span>
                          <span>{goal.progress}%</span>
                        </div>
                      </div>
                      <div className="border-t border-neutral-200 pt-4">
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-neutral-500 flex items-center">
                            <CalendarIcon className="h-4 w-4 mr-1" /> 
                            Target: {formatDate(goal.targetDate)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="md:pl-12">
                    {/* Additional details or empty */}
                  </div>
                </>
              )}
            </div>
          </div>
        );
      }
    });
  };
  
  return (
    <div className="px-4 sm:px-0">
      <h2 className="text-lg font-medium text-neutral-900 mb-5">Timeline</h2>
      <div className="timeline-container">
        <div className="timeline-line"></div>
        {renderTimelineItems()}
      </div>
    </div>
  );
}

function CalendarIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect width="18" height="18" x="3" y="4" rx="2" ry="2" />
      <line x1="16" x2="16" y1="2" y2="6" />
      <line x1="8" x2="8" y1="2" y2="6" />
      <line x1="3" x2="21" y1="10" y2="10" />
    </svg>
  );
}

function FileText(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" x2="8" y1="13" y2="13" />
      <line x1="16" x2="8" y1="17" y2="17" />
      <line x1="10" x2="8" y1="9" y2="9" />
    </svg>
  );
}
