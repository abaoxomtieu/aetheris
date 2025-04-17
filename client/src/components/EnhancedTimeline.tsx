import { useCareerEvents, useGoals, useFeedbacks, useAchievements } from "@/hooks/use-career-data";
import { formatDate } from "@/lib/utils";
import { 
  Award, Briefcase, Flag, Eye, 
  CheckCircle, ArrowRight, Edit, Send,
  ChevronRight, Trophy, Calendar, FileText, Star
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useUpdateGoal } from "@/hooks/use-career-data";
import { useToast } from "@/hooks/use-toast";
import { useState, useMemo } from "react";
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";

interface EnhancedTimelineProps {
  timeFilter?: string;
  filterByTimePeriod?: (date: Date) => boolean;
}

export function EnhancedTimeline({ timeFilter = "all", filterByTimePeriod }: EnhancedTimelineProps = {}) {
  const { data: careerEvents, isLoading: isEventsLoading } = useCareerEvents();
  const { data: goals, isLoading: isGoalsLoading } = useGoals();
  const { data: feedbacks, isLoading: isFeedbacksLoading } = useFeedbacks();
  const { data: achievements, isLoading: isAchievementsLoading } = useAchievements();
  const updateGoalMutation = useUpdateGoal();
  const { toast } = useToast();
  const [selectedItem, setSelectedItem] = useState<TimelineItem | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  
  // Define types for each item kind
  type TimelineItemBase = {
    id: number;
    date: Date;
    itemType: string;
  };

  type CareerTimelineItem = TimelineItemBase & {
    itemType: 'career';
    title: string;
    description: string | null;
    eventType: string;
    details?: {
      responsibilities?: string[];
      achievements?: string[];
      quote?: string;
    };
  };

  type GoalTimelineItem = TimelineItemBase & {
    itemType: 'goal';
    title: string;
    description: string;
    status: string;
    progress: number;
    category: string;
    startDate: Date;
    targetDate: Date;
    eventType: string;
  };

  type AchievementTimelineItem = TimelineItemBase & {
    itemType: 'achievement';
    title: string;
    description: string;
    eventType: string;
    goalId?: number;
    attachments?: string[];
  };

  type TimelineItem = CareerTimelineItem | GoalTimelineItem | AchievementTimelineItem;

  // Get all timeline items and sort them
  const timelineItems = useMemo<TimelineItem[]>(() => {
    if (!careerEvents || !goals || !achievements) return [];
    
    // Create properly typed items for each category, excluding future promotions from main timeline
    const careerItems: CareerTimelineItem[] = (careerEvents || [])
      .filter(event => event.eventType !== 'planned_promotion') // Filter out future promotions
      .map(event => ({
        id: event.id,
        itemType: 'career' as const,
        date: new Date(event.date),
        title: event.title,
        description: event.description,
        eventType: event.eventType,
        details: event.details as {
          responsibilities?: string[];
          achievements?: string[];
          quote?: string;
        }
      }));
    
    const goalItems: GoalTimelineItem[] = (goals || []).map(goal => ({
      id: goal.id,
      itemType: 'goal' as const,
      date: new Date(goal.targetDate),
      title: goal.title,
      description: goal.description,
      status: goal.status,
      progress: goal.progress,
      category: goal.category,
      startDate: new Date(goal.startDate),
      targetDate: new Date(goal.targetDate),
      eventType: goal.status === 'review' || goal.status === 'pending_review' 
        ? 'review' 
        : goal.status === 'completed' 
          ? 'completed' 
          : 'goal'
    }));
    
    const achievementItems: AchievementTimelineItem[] = (achievements || []).map(achievement => ({
      id: achievement.id,
      itemType: 'achievement' as const,
      date: new Date(achievement.date),
      title: achievement.title,
      description: achievement.description,
      eventType: 'achievement',
      goalId: achievement.goalId || undefined,
      attachments: achievement.attachments || undefined
    }));
    
    // Combine all properly typed items
    const allItems: TimelineItem[] = [
      ...careerItems,
      ...goalItems,
      ...achievementItems
    ];
    
    // Sort by date descending
    return allItems.sort((a, b) => b.date.getTime() - a.date.getTime());
  }, [careerEvents, goals, achievements]);
  
  // Default filter function if none is provided
  const defaultFilterFn = (date: Date) => true;
  const filterFn = filterByTimePeriod || defaultFilterFn;
  
  // Create chronological view for the timeline
  const chronologicalData = useMemo(() => {
    // Apply time filter first if specified
    const filteredItems = timeFilter === "all" ? 
      timelineItems : 
      timelineItems.filter(item => filterFn(item.date));
      
    // Sort in reverse chronological order (newest first)
    const sortedItems = [...filteredItems].sort((a, b) => b.date.getTime() - a.date.getTime());
    
    // Group by year
    const itemsByYear: Record<string, TimelineItem[]> = {};
    sortedItems.forEach(item => {
      const year = item.date.getFullYear().toString();
      if (!itemsByYear[year]) {
        itemsByYear[year] = [];
      }
      itemsByYear[year].push(item);
    });
    
    // Get years in reverse chronological order (newest first)
    const years = Object.keys(itemsByYear).sort().reverse();
    
    return { sortedItems, itemsByYear, years };
  }, [timelineItems, timeFilter, filterFn]);
  
  if (isEventsLoading || isGoalsLoading || isAchievementsLoading) {
    return (
      <div className="bg-white shadow rounded-lg p-6 mb-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-neutral-900">Timeline</h2>
          <Skeleton className="h-8 w-24" />
        </div>
        <div className="space-y-8">
          {Array(4).fill(0).map((_, index) => (
            <div key={index} className="flex">
              <div className="flex-shrink-0 mr-4">
                <Skeleton className="h-12 w-12 rounded-full" />
              </div>
              <div className="flex-1">
                <Skeleton className="h-6 w-1/3 mb-2" />
                <Skeleton className="h-4 w-2/3 mb-3" />
                <Skeleton className="h-24 w-full rounded-md" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }
  
  // Get an appropriate icon for each timeline item
  const getTimelineIcon = (item: TimelineItem) => {
    if (item.itemType === 'career') {
      switch (item.eventType) {
        case "promotion":
          return <Award className="h-6 w-6 text-white" />;
        case "planned_promotion":
          return <Award className="h-6 w-6 text-white" />;
        case "career_start":
          return <Briefcase className="h-6 w-6 text-white" />;
        default:
          return <Star className="h-6 w-6 text-white" />;
      }
    } 
    else if (item.itemType === 'goal') {
      if (item.status === 'completed') {
        return <CheckCircle className="h-6 w-6 text-white" />;
      } else if (item.status === 'review' || item.status === 'pending_review') {
        return <Eye className="h-6 w-6 text-white" />;
      } else {
        return <Flag className="h-6 w-6 text-white" />;
      }
    }
    else if (item.itemType === 'achievement') {
      return <Trophy className="h-6 w-6 text-white" />;
    }
    
    return <Star className="h-6 w-6 text-white" />;
  };
  
  // Get the item title
  const getItemTitle = (item: TimelineItem) => {
    return item.title;
  };
  
  // Get the item description
  const getItemSubtitle = (item: TimelineItem) => {
    if (item.itemType === 'career') {
      switch (item.eventType) {
        case "promotion":
          return "Promotion";
        case "planned_promotion":
          return "Future Promotion";
        case "career_start":
          return "Career Start";
        default:
          return "Career Event";
      }
    } 
    else if (item.itemType === 'goal') {
      const statusMap: Record<string, string> = {
        'draft': 'Draft Goal',
        'pending_confirmed': 'Pending Confirmation',
        'confirmed': 'Confirmed Goal',
        'in_progress': 'Goal In Progress',
        'pending_review': 'Pending Review',
        'review': 'In Review',
        'reviewed': 'Reviewed Goal',
        'approved': 'Approved Goal',
        'rejected': 'Rejected Goal',
        'completed': 'Completed Goal'
      };
      
      return statusMap[item.status] || 'Goal';
    }
    else if (item.itemType === 'achievement') {
      const goalTitle = item.goalId && goals ? 
        goals.find(g => g.id === item.goalId)?.title : 
        null;
        
      return goalTitle ? 
        `Achievement - ${goalTitle}` : 
        'Achievement';
    }
    
    return "";
  };
  
  const handleItemClick = (item: TimelineItem) => {
    setSelectedItem(item);
    setIsDialogOpen(true);
  };
  
  // Render dialog content based on selected item
  const renderDialogContent = () => {
    if (!selectedItem) return null;
    
    if (selectedItem.itemType === 'career') {
      return (
        <>
          <DialogHeader>
            <DialogTitle>{selectedItem.title}</DialogTitle>
            <DialogDescription>
              {formatDate(selectedItem.date)} • {
                selectedItem.eventType === 'promotion' 
                  ? 'Promotion' 
                  : selectedItem.eventType === 'planned_promotion'
                    ? 'Future Promotion'
                    : selectedItem.eventType === 'career_start' 
                      ? 'Career Start' 
                      : 'Career Event'
              }
            </DialogDescription>
          </DialogHeader>
          
          <div className="mt-4 space-y-4">
            {selectedItem.description && (
              <p className="text-neutral-700">{selectedItem.description}</p>
            )}
            
            {selectedItem.details?.responsibilities && (
              <div className="bg-neutral-50 p-4 rounded-md">
                <h3 className="font-medium text-neutral-900 mb-2">Key Responsibilities</h3>
                <ul className="space-y-2 text-neutral-600 pl-5 list-disc">
                  {selectedItem.details.responsibilities.map((resp, idx) => (
                    <li key={idx}>{resp}</li>
                  ))}
                </ul>
              </div>
            )}
            
            {selectedItem.details?.achievements && (
              <div className="bg-neutral-50 p-4 rounded-md">
                <h3 className="font-medium text-neutral-900 mb-2">Achievement Highlights</h3>
                <ul className="space-y-2 text-neutral-600 pl-5">
                  {selectedItem.details.achievements.map((ach, idx) => (
                    <li key={idx} className="flex items-start">
                      <CheckCircle className="text-emerald-500 h-4 w-4 mr-2 mt-1 flex-shrink-0" />
                      <span>{ach}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            
            {selectedItem.details?.quote && (
              <div className="border-l-4 border-primary-300 pl-4 italic text-neutral-600">
                "{selectedItem.details.quote}"
              </div>
            )}
          </div>
        </>
      );
    }
    else if (selectedItem.itemType === 'goal') {
      // Find related achievements and feedback
      const relatedAchievements = achievements?.filter(a => a.goalId === selectedItem.id) || [];
      const relatedFeedback = feedbacks?.find(f => f.goalId === selectedItem.id);
      
      return (
        <>
          <DialogHeader>
            <DialogTitle>{selectedItem.title}</DialogTitle>
            <DialogDescription>
              {formatDate(selectedItem.targetDate)} • {getItemSubtitle(selectedItem)}
            </DialogDescription>
          </DialogHeader>
          
          <div className="mt-4 space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-neutral-500">Category</span>
                <span className="text-sm font-medium">{selectedItem.category}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-neutral-500">Start Date</span>
                <span className="text-sm font-medium">{formatDate(selectedItem.startDate)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-neutral-500">Progress</span>
                <span className="text-sm font-medium">{selectedItem.progress}%</span>
              </div>
              
              <div className="w-full bg-neutral-200 rounded-full h-2.5 mt-1">
                <div 
                  className={`h-2.5 rounded-full ${
                    selectedItem.status === 'completed' ? 'bg-emerald-500' : 
                    selectedItem.status === 'review' || selectedItem.status === 'pending_review' ? 'bg-amber-500' : 
                    'bg-blue-500'
                  }`}
                  style={{ width: `${selectedItem.progress}%` }}
                ></div>
              </div>
            </div>
            
            <div className="bg-neutral-50 p-4 rounded-md">
              <p className="text-neutral-700">{selectedItem.description}</p>
            </div>
            
            {relatedAchievements.length > 0 && (
              <div>
                <h3 className="font-medium text-neutral-900 mb-2">Achievements</h3>
                <div className="space-y-3">
                  {relatedAchievements.map((achievement) => (
                    <div key={achievement.id} className="p-3 border border-neutral-200 rounded-md">
                      <div className="flex items-start">
                        <Trophy className="text-purple-500 h-4 w-4 mt-1 mr-2 flex-shrink-0" />
                        <div>
                          <h4 className="font-medium text-neutral-900">{achievement.title}</h4>
                          <p className="text-sm text-neutral-600">{achievement.description}</p>
                          <p className="text-xs text-neutral-500 mt-1">{formatDate(achievement.date)}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {relatedFeedback && (
              <div>
                <h3 className="font-medium text-neutral-900 mb-2">Feedback</h3>
                <div className="p-4 bg-neutral-50 rounded-md border border-neutral-200">
                  <p className="italic text-neutral-700">"{relatedFeedback.content}"</p>
                  <p className="text-sm text-neutral-500 mt-2">— {relatedFeedback.source}</p>
                  {relatedFeedback.attachments && relatedFeedback.attachments.length > 0 && (
                    <div className="mt-2 flex items-center">
                      <FileText className="h-4 w-4 text-neutral-400 mr-2" />
                      <span className="text-sm text-primary-600">{relatedFeedback.attachments[0]}</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </>
      );
    }
    else if (selectedItem.itemType === 'achievement') {
      // Find related goal
      const relatedGoal = goals?.find(g => g.id === selectedItem.goalId);
      
      return (
        <>
          <DialogHeader>
            <DialogTitle>{selectedItem.title}</DialogTitle>
            <DialogDescription>
              {formatDate(selectedItem.date)} • Achievement
              {relatedGoal && ` for ${relatedGoal.title}`}
            </DialogDescription>
          </DialogHeader>
          
          <div className="mt-4 space-y-4">
            <div className="bg-neutral-50 p-4 rounded-md">
              <p className="text-neutral-700">{selectedItem.description}</p>
            </div>
            
            {relatedGoal && (
              <div className="border-t border-neutral-200 pt-4">
                <h3 className="font-medium text-neutral-900 mb-2">Related Goal</h3>
                <div className="flex items-start">
                  <Flag className="text-blue-500 h-4 w-4 mt-1 mr-2 flex-shrink-0" />
                  <div>
                    <h4 className="font-medium text-neutral-900">{relatedGoal.title}</h4>
                    <p className="text-sm text-neutral-600">{relatedGoal.description.substring(0, 100)}...</p>
                    <div className="flex items-center mt-1 text-xs text-neutral-500">
                      <Calendar className="h-3 w-3 mr-1" />
                      {formatDate(relatedGoal.targetDate)}
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {selectedItem.attachments && selectedItem.attachments.length > 0 && (
              <div>
                <h3 className="font-medium text-neutral-900 mb-2">Attachments</h3>
                <div className="space-y-2">
                  {selectedItem.attachments.map((attachment, idx) => (
                    <div key={idx} className="flex items-center p-2 border border-neutral-200 rounded-md">
                      <FileText className="h-4 w-4 text-neutral-400 mr-2" />
                      <span className="text-sm text-primary-600">{attachment}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </>
      );
    }
    
    return null;
  };
  
  return (
    <div className="bg-white shadow rounded-lg p-6 mb-8">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-neutral-900">Timeline</h2>
        <div className="text-sm text-neutral-500">
          {timelineItems.length} events
        </div>
      </div>
      
      <div className="relative">
        {/* Vertical line */}
        <div className="absolute left-6 top-8 bottom-0 w-0.5 bg-gradient-to-b from-primary-300 to-neutral-200"></div>
        
        {/* Timeline Items by Year */}
        <div className="space-y-8">
          {chronologicalData.years.map((year) => (
            <div key={year} className="relative">
              {/* Year Marker */}
              <div className="mb-6 flex items-center">
                <div className="relative z-20 flex items-center justify-center h-12 w-12 rounded-full bg-indigo-700 text-white font-bold shadow-lg">
                  {year}
                </div>
                <div className="ml-4 text-lg font-semibold text-indigo-900 border-b border-dashed border-neutral-300 pb-1 flex-grow">
                  {year === chronologicalData.years[chronologicalData.years.length - 1] ? 'Career Start' : ''}
                  {year === chronologicalData.years[0] && year !== chronologicalData.years[chronologicalData.years.length - 1] ? 'Current Position' : ''}
                </div>
              </div>
              
              {/* Items within the year */}
              <div className="space-y-8 ml-6">
                {chronologicalData.itemsByYear[year].map((item: TimelineItem, index: number) => (
                  <div key={`${item.itemType}-${item.id}`} className="relative">
                    {/* Item type badge */}
                    <div className="absolute -left-6 top-0 z-10 flex items-center justify-center h-12 w-12 rounded-full shadow-md border-4 border-white" style={{
                      background: item.itemType === 'career' 
                        ? item.eventType === 'planned_promotion'
                          ? 'linear-gradient(135deg, #0f766e, #14b8a6)' // Teal for future promotion
                          : 'linear-gradient(135deg, #4338ca, #6366f1)' // Indigo for regular career events
                        : item.itemType === 'goal' 
                          ? 'linear-gradient(135deg, #0284c7, #38bdf8)' 
                          : 'linear-gradient(135deg, #7e22ce, #a855f7)'
                    }}>
                      {getTimelineIcon(item)}
                    </div>
                    
                    {/* Content Card with curved connector */}
                    <div className="ml-10 relative">
                      {/* Timeline item type indicator */}
                      <div className="absolute -left-6 top-6 h-0.5 w-6 bg-neutral-200"></div>
                      
                      <div className="bg-white rounded-lg border border-neutral-200 hover:border-primary-200 hover:shadow-md transition duration-300 overflow-hidden cursor-pointer"
                        onClick={() => handleItemClick(item)}>
                        {/* Header with item type */}
                        <div className="px-4 py-3 border-b border-neutral-100 flex justify-between items-center" style={{
                          background: item.itemType === 'career' 
                            ? item.eventType === 'planned_promotion'
                              ? 'linear-gradient(to right, #f0fdfa, #ffffff)' // Teal for future promotion
                              : 'linear-gradient(to right, #eff6ff, #ffffff)' // Indigo for regular career events
                            : item.itemType === 'goal' 
                              ? 'linear-gradient(to right, #f0f9ff, #ffffff)' 
                              : 'linear-gradient(to right, #faf5ff, #ffffff)'
                        }}>
                          <div className="flex items-center">
                            <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              item.itemType === 'career' 
                                ? item.eventType === 'planned_promotion'
                                  ? 'bg-teal-100 text-teal-800' // Teal for future roadmap  
                                  : 'bg-indigo-100 text-indigo-800' // Indigo for regular career events
                                : item.itemType === 'goal' 
                                  ? 'bg-sky-100 text-sky-800' 
                                  : 'bg-purple-100 text-purple-800'
                            }`}>
                              {item.itemType === 'career' 
                                ? item.eventType === 'planned_promotion'
                                  ? 'Future Roadmap'
                                  : 'Career Milestone'
                                : item.itemType === 'goal' 
                                  ? 'Goal' 
                                  : 'Achievement'
                              }
                            </span>
                            <div className="ml-3 flex items-center text-sm text-neutral-500">
                              <Calendar className="h-3.5 w-3.5 mr-1" />
                              {formatDate(item.date)}
                            </div>
                          </div>
                          
                          {item.itemType === 'goal' && (
                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                              item.status === 'completed' ? 'bg-emerald-100 text-emerald-800' : 
                              item.status === 'review' || item.status === 'pending_review' ? 'bg-amber-100 text-amber-800' : 
                              'bg-blue-100 text-blue-800'
                            }`}>
                              {item.status.replace(/_/g, ' ')}
                            </span>
                          )}
                        </div>
                        
                        {/* Main content */}
                        <div className="p-4">
                          <h3 className="text-lg font-medium text-neutral-900 mb-2">
                            {getItemTitle(item)}
                          </h3>
                          
                          {item.itemType === 'career' && (
                            <div className="space-y-3">
                              {item.description && <p className="text-neutral-700">{item.description}</p>}
                              {item.details?.responsibilities && (
                                <div className="text-sm text-neutral-600 bg-neutral-50 p-3 rounded-md">
                                  <span className="font-medium block mb-1">Key responsibilities:</span>
                                  <ul className="list-disc pl-5 space-y-1">
                                    {item.details.responsibilities.slice(0, 2).map((resp, idx) => (
                                      <li key={idx}>{resp}</li>
                                    ))}
                                    {item.details.responsibilities.length > 2 && (
                                      <li className="text-primary-600">And {item.details.responsibilities.length - 2} more...</li>
                                    )}
                                  </ul>
                                </div>
                              )}
                            </div>
                          )}
                          
                          {item.itemType === 'goal' && (
                            <div className="space-y-3">
                              <p className="text-neutral-700">{item.description.substring(0, 150)}...</p>
                              <div className="w-full bg-neutral-100 rounded-full h-2">
                                <div className={`h-2 rounded-full ${
                                  item.status === 'completed' ? 'bg-emerald-500' : 
                                  item.status === 'review' || item.status === 'pending_review' ? 'bg-amber-500' : 
                                  'bg-sky-500'
                                }`} style={{ width: `${item.progress}%` }}></div>
                              </div>
                              <div className="text-right text-xs text-neutral-500">
                                Progress: {item.progress}%
                              </div>
                            </div>
                          )}
                          
                          {item.itemType === 'achievement' && (
                            <div className="space-y-2">
                              <p className="text-neutral-700">{item.description.substring(0, 150)}...</p>
                              {item.attachments && item.attachments.length > 0 && (
                                <div className="flex items-center text-sm text-neutral-500 mt-2">
                                  <FileText className="h-3.5 w-3.5 mr-1" />
                                  {item.attachments.length} attachment{item.attachments.length !== 1 ? 's' : ''}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                        
                        <div className="bg-neutral-50 px-4 py-2 text-right border-t border-neutral-100">
                          <Button variant="ghost" size="sm" className="text-primary-600 hover:text-primary-800">
                            View details <ChevronRight className="ml-1 h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {/* Detail Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-auto">
          {renderDialogContent()}
          <DialogFooter>
            <Button onClick={() => setIsDialogOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}