import { useGoals, useAchievements, useFeedbacks, useCareerEvents } from "@/hooks/use-career-data";
import { Skeleton } from "@/components/ui/skeleton";
import { Award, Trophy, ClipboardCheck, UserRound, CheckCircle2, Clock, AlertCircle } from "lucide-react";
import { calculateCompletionPercentage } from "@/lib/utils";
import { 
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { InfoIcon } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";

export function StatsCards() {
  const { data: goals, isLoading: isGoalsLoading } = useGoals();
  const { data: achievements, isLoading: isAchievementsLoading } = useAchievements();
  const { data: feedbacks, isLoading: isFeedbacksLoading } = useFeedbacks();
  const { data: careerEvents, isLoading: isCareerEventsLoading } = useCareerEvents();
  const { user } = useAuth();
  
  // Get goals by status
  const reviewGoals = goals?.filter(goal => goal.status === "review" || goal.status === "pending_review") || [];
  const completedGoals = goals?.filter(goal => goal.status === "completed") || [];
  const inProgressGoals = goals?.filter(goal => goal.status === "in_progress") || [];
  const draftGoals = goals?.filter(goal => goal.status === "draft") || [];
  const confirmedGoals = goals?.filter(goal => goal.status === "confirmed") || [];
  const pendingConfirmedGoals = goals?.filter(goal => goal.status === "pending_confirmed") || [];
  const reviewedGoals = goals?.filter(goal => goal.status === "reviewed") || [];
  const approvedGoals = goals?.filter(goal => goal.status === "approved") || [];
  const rejectedGoals = goals?.filter(goal => goal.status === "rejected") || [];
  
  // Calculate years at company based on join date from career events
  const currentDate = new Date();
  const joinEvents = careerEvents?.filter(event => 
    event.eventType === "career_start" || 
    event.title.toLowerCase().includes("join") || 
    event.title.toLowerCase().includes("start") ||
    event.title.toLowerCase().includes("hired") ||
    event.description?.toLowerCase().includes("joined") ||
    event.description?.toLowerCase().includes("started")
  ) || [];
  
  // Sort join events by date (ascending) to get the earliest one
  const sortedJoinEvents = [...joinEvents].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );
  
  const earliestJoinDate = sortedJoinEvents.length > 0 
    ? new Date(sortedJoinEvents[0].date) 
    : undefined;
    
  const startDate = earliestJoinDate || new Date(currentDate.getFullYear() - 1, 0, 1);
  const yearsAtCompany = Math.max(1, Math.floor((currentDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24 * 365)));
  
  // Count promotions from career events
  const promotionEvents = careerEvents?.filter(event => 
    event.eventType === "promotion" || 
    event.eventType === "planned_promotion" ||
    event.title.toLowerCase().includes("promot") ||
    event.description?.toLowerCase().includes("promot")
  ) || [];
  
  return (
    <div className="px-4 sm:px-0 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-8">
      {/* Total Goals Card */}
      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 overflow-hidden shadow rounded-lg border border-blue-100">
        <div className="px-4 py-5 sm:p-6">
          {isGoalsLoading ? (
            <Skeleton className="h-16 w-full" />
          ) : (
            <dl>
              <dt className="text-sm font-medium text-neutral-500 truncate">Total Goals</dt>
              <dd className="mt-1 text-3xl font-semibold text-neutral-900">{goals?.length || 0}</dd>
            </dl>
          )}
        </div>
        <div className="bg-white/60 px-4 py-3 flex items-center justify-between">
          <div className="text-sm flex items-center gap-2">
            <span className="font-medium text-primary-700 hover:text-primary-900">
              {completedGoals.length} completed
            </span>
            
            <Popover>
              <PopoverTrigger asChild>
                <button className="inline-flex items-center justify-center text-sm font-medium rounded-full w-5 h-5 bg-indigo-100 text-indigo-600 hover:bg-indigo-200">
                  <InfoIcon className="h-3 w-3" />
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-64 p-2">
                <div className="space-y-2">
                  <h4 className="font-medium text-sm">Goals by Status</h4>
                  <div className="grid grid-cols-1 gap-1 text-xs">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-gray-300"></span>
                        <span>Draft</span>
                      </div>
                      <span className="font-semibold">{draftGoals.length}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-blue-300"></span>
                        <span>Pending Confirmation</span>
                      </div>
                      <span className="font-semibold">{pendingConfirmedGoals.length}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-green-300"></span>
                        <span>Confirmed</span>
                      </div>
                      <span className="font-semibold">{confirmedGoals.length}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-indigo-300"></span>
                        <span>In Progress</span>
                      </div>
                      <span className="font-semibold">{inProgressGoals.length}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-yellow-300"></span>
                        <span>Pending Review</span>
                      </div>
                      <span className="font-semibold">{reviewGoals.length}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-purple-300"></span>
                        <span>Reviewed</span>
                      </div>
                      <span className="font-semibold">{reviewedGoals.length}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-emerald-300"></span>
                        <span>Approved</span>
                      </div>
                      <span className="font-semibold">{approvedGoals.length}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                        <span>Completed</span>
                      </div>
                      <span className="font-semibold">{completedGoals.length}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-red-300"></span>
                        <span>Rejected</span>
                      </div>
                      <span className="font-semibold">{rejectedGoals.length}</span>
                    </div>
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          </div>
          <div className="flex-shrink-0">
            <div className="h-2 w-24 bg-neutral-200 rounded-full overflow-hidden">
              <div 
                className="h-2 bg-status-success rounded-full" 
                style={{ width: `${calculateCompletionPercentage(goals || [])}%` }}
              ></div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Achievements Card */}
      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 overflow-hidden shadow rounded-lg border border-blue-100">
        <div className="px-4 py-5 sm:p-6">
          {isAchievementsLoading ? (
            <Skeleton className="h-16 w-full" />
          ) : (
            <dl>
              <dt className="text-sm font-medium text-neutral-500 truncate">Achievements</dt>
              <dd className="mt-1 text-3xl font-semibold text-neutral-900">{achievements?.length || 0}</dd>
            </dl>
          )}
        </div>
        <div className="bg-white/60 px-4 py-3 flex items-center justify-between">
          <div className="text-sm">
            <span className="font-medium text-primary-700 hover:text-primary-900">View all</span>
          </div>
          <div className="flex-shrink-0">
            <Trophy className="h-5 w-5 text-status-warning" />
          </div>
        </div>
      </div>
      
      {/* Pending Reviews Card */}
      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 overflow-hidden shadow rounded-lg border border-blue-100">
        <div className="px-4 py-5 sm:p-6">
          {isGoalsLoading ? (
            <Skeleton className="h-16 w-full" />
          ) : (
            <dl>
              <dt className="text-sm font-medium text-neutral-500 truncate">Pending Reviews</dt>
              <dd className="mt-1 text-3xl font-semibold text-neutral-900">{reviewGoals.length}</dd>
            </dl>
          )}
        </div>
        <div className="bg-white/60 px-4 py-3 flex items-center justify-between">
          <div className="text-sm">
            <span className="font-medium text-status-review hover:text-orange-700">Submit reviews</span>
          </div>
          <div className="flex-shrink-0">
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-status-review">
              <span className="animate-pulse mr-1">•</span>
              Action required
            </span>
          </div>
        </div>
      </div>
      
      {/* Years at Company Card */}
      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 overflow-hidden shadow rounded-lg border border-blue-100">
        <div className="px-4 py-5 sm:p-6">
          {isCareerEventsLoading ? (
            <Skeleton className="h-16 w-full" />
          ) : (
            <dl>
              <dt className="text-sm font-medium text-neutral-500 truncate">Years at Company</dt>
              <dd className="mt-1 text-3xl font-semibold text-neutral-900">{yearsAtCompany}</dd>
            </dl>
          )}
        </div>
        <div className="bg-white/60 px-4 py-3 flex items-center justify-between">
          <div className="text-sm">
            <span className="font-medium text-primary-700 hover:text-primary-900">
              {promotionEvents.length} {promotionEvents.length === 1 ? 'promotion' : 'promotions'}
            </span>
          </div>
          <div className="flex-shrink-0">
            <UserRound className="h-5 w-5 text-status-info" />
          </div>
        </div>
      </div>
    </div>
  );
}
