import { useState } from "react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { StatsCards } from "@/components/StatsCards";
import { EnhancedTimeline } from "@/components/EnhancedTimeline";
import { AddGoalForm } from "@/components/AddGoalForm";
import { AddAchievementForm } from "@/components/AddAchievementForm";
import { GoalsTable } from "@/components/GoalsTable";
import { ReporteeGoalsTable } from "@/components/ReporteeGoalsTable";
import { IdpDisplay } from "@/components/IdpDisplay";
import { useToast } from "@/hooks/use-toast";
import { 
  PlusIcon, Award, Target, Trophy, LayoutDashboard, TrendingUp, 
  FilterIcon, Users, Briefcase, BookOpen 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAchievements, useCareerEvents, useGoals } from "@/hooks/use-career-data";
import { CareerEventDetails } from "@shared/schema";
import { useAuth } from "@/hooks/use-auth";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function Dashboard() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("timeline");
  const { data: achievements } = useAchievements();
  const { data: goals } = useGoals();
  const { data: careerEvents } = useCareerEvents();
  const [goalModalOpen, setGoalModalOpen] = useState(false);
  const [achievementModalOpen, setAchievementModalOpen] = useState(false);
  const [timeFilter, setTimeFilter] = useState("all");
  
  // Check if user is a manager or admin, or specifically user 1 (Sam) who should see reportees
  const isManagerOrAdmin = user?.role === "manager" || user?.role === "admin" || user?.id === 1;
  
  // Filter functions to filter by time period
  const filterByTimePeriod = (date: Date) => {
    if (!date) return true;
    
    // Ensure date is a Date object
    const dateValue = date instanceof Date ? date : new Date(date);
    const now = new Date();
    
    switch (timeFilter) {
      case "monthly":
        // Last 30 days
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(now.getDate() - 30);
        return dateValue >= thirtyDaysAgo;
        
      case "quarterly":
        // Last 90 days (3 months)
        const ninetyDaysAgo = new Date();
        ninetyDaysAgo.setDate(now.getDate() - 90);
        return dateValue >= ninetyDaysAgo && dateValue <= now;
        
      case "yearly":
        // Last 365 days (1 year)
        const yearAgo = new Date();
        yearAgo.setFullYear(now.getFullYear() - 1);
        return dateValue >= yearAgo && dateValue <= now;
        
      case "recent":
        // Last 7 days
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(now.getDate() - 7);
        return dateValue >= sevenDaysAgo;
        
      case "month-to-date":
        // Current month
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        return dateValue >= startOfMonth;
        
      case "quarter-to-date":
        // Current quarter
        const quarterMonth = Math.floor(now.getMonth() / 3) * 3;
        const startOfQuarter = new Date(now.getFullYear(), quarterMonth, 1);
        return dateValue >= startOfQuarter;
        
      case "year-to-date":
        // Current year
        const startOfYear = new Date(now.getFullYear(), 0, 1);
        return dateValue >= startOfYear;
          
      default:
        // "all" - no filtering
        return true;
    }
  };
  
  // No additional functions needed
  
  return (
    <div className="min-h-screen flex flex-col bg-neutral-50">
      <Header />
      
      <main className="flex-1">
        <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          {/* Page header */}
          <div className="md:flex md:items-center md:justify-between mb-8 px-4 sm:px-0">
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl font-semibold text-neutral-900 sm:text-3xl sm:truncate">My Dashboard</h1>
              <p className="mt-1 text-sm text-neutral-500">
                Track your professional growth, set goals, and showcase achievements
              </p>
            </div>
          </div>
          
          {/* Stats Cards */}
          <StatsCards />
          
          {/* Tab Navigation */}
          <Tabs defaultValue="timeline" className="mb-8" onValueChange={setActiveTab}>
            <TabsList className="mb-2 bg-white border border-neutral-200 p-1">
              <TabsTrigger 
                value="timeline" 
                className="data-[state=active]:bg-indigo-700 data-[state=active]:text-white data-[state=active]:font-semibold data-[state=active]:shadow-md transition-all duration-200"
              >
                <LayoutDashboard className="w-4 h-4 mr-2" />
                Timeline
              </TabsTrigger>
              <TabsTrigger 
                value="goals" 
                className="data-[state=active]:bg-indigo-700 data-[state=active]:text-white data-[state=active]:font-semibold data-[state=active]:shadow-md transition-all duration-200"
              >
                <Target className="w-4 h-4 mr-2" />
                Goals
              </TabsTrigger>
              <TabsTrigger 
                value="achievements" 
                className="data-[state=active]:bg-indigo-700 data-[state=active]:text-white data-[state=active]:font-semibold data-[state=active]:shadow-md transition-all duration-200"
              >
                <Trophy className="w-4 h-4 mr-2" />
                Achievements
              </TabsTrigger>
              <TabsTrigger 
                value="promotions" 
                className="data-[state=active]:bg-indigo-700 data-[state=active]:text-white data-[state=active]:font-semibold data-[state=active]:shadow-md transition-all duration-200"
              >
                <TrendingUp className="w-4 h-4 mr-2" />
                Promotions
              </TabsTrigger>
              {/* <TabsTrigger 
                value="idps" 
                className="data-[state=active]:bg-indigo-700 data-[state=active]:text-white data-[state=active]:font-semibold data-[state=active]:shadow-md transition-all duration-200"
              >
                <BookOpen className="w-4 h-4 mr-2" />
                Development Plans
              </TabsTrigger> */}

              {isManagerOrAdmin && (
                <TabsTrigger 
                  value="reportees" 
                  className="data-[state=active]:bg-indigo-700 data-[state=active]:text-white data-[state=active]:font-semibold data-[state=active]:shadow-md transition-all duration-200"
                >
                  <Users className="w-4 h-4 mr-2" />
                  My Reportees
                </TabsTrigger>
              )}
            </TabsList>
            
            <TabsContent value="timeline" className="mt-0">
              {/* Enhanced Timeline */}
              <EnhancedTimeline 
                timeFilter={timeFilter}
                filterByTimePeriod={filterByTimePeriod}
              />
            </TabsContent>
            
            <TabsContent value="goals" className="mt-0">
              {/* Goals Table with Filter */}
              <div className="bg-white shadow rounded-lg p-6 mb-8">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-semibold text-neutral-900">Goals Management</h2>
                  
                  <div className="flex items-center space-x-3">
                    <div className="flex">
                      <div className="border border-gray-300 rounded-l-md px-3 py-2 flex items-center bg-white">
                        <FilterIcon className="h-4 w-4 text-gray-500" />
                      </div>
                      <Select 
                        value={timeFilter} 
                        onValueChange={setTimeFilter}
                      >
                        <SelectTrigger className="w-[150px] rounded-l-none border-l-0">
                          <SelectValue placeholder="All..." />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Goals</SelectItem>
                          <SelectItem value="recent">Last 7 Days</SelectItem>
                          <SelectItem value="monthly">Last 30 Days</SelectItem>
                          <SelectItem value="quarterly">Last 90 Days</SelectItem>
                          <SelectItem value="yearly">Last 365 Days</SelectItem>
                          <SelectItem value="month-to-date">This Month</SelectItem>
                          <SelectItem value="quarter-to-date">This Quarter</SelectItem>
                          <SelectItem value="year-to-date">This Year</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <Button 
                      onClick={() => setGoalModalOpen(true)}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white"
                    >
                      <PlusIcon className="h-4 w-4 mr-2" />
                      Add Goal
                    </Button>
                  </div>
                </div>
                
                {/* Goal Modal */}
                <Dialog open={goalModalOpen} onOpenChange={setGoalModalOpen}>
                  <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
                    <DialogHeader className="sr-only">
                      <DialogTitle>Add Goal</DialogTitle>
                      <DialogDescription>Set your professional goals and track progress over time</DialogDescription>
                    </DialogHeader>
                    <AddGoalForm onComplete={() => setGoalModalOpen(false)} />
                  </DialogContent>
                </Dialog>
                
                <GoalsTable timeFilter={timeFilter} filterByTimePeriod={filterByTimePeriod} />
              </div>
            </TabsContent>
            
            <TabsContent value="achievements" className="mt-0">
              {/* Achievements Section */}
              <div className="bg-white shadow rounded-lg p-6 mb-8">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-semibold text-neutral-900">Professional Achievements</h2>
                  
                  <div className="flex items-center space-x-3">
                    <div className="flex">
                      <div className="border border-gray-300 rounded-l-md px-3 py-2 flex items-center bg-white">
                        <FilterIcon className="h-4 w-4 text-gray-500" />
                      </div>
                      <Select 
                        value={timeFilter} 
                        onValueChange={setTimeFilter}
                      >
                        <SelectTrigger className="w-[150px] rounded-l-none border-l-0">
                          <SelectValue placeholder="All..." />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Achievements</SelectItem>
                          <SelectItem value="recent">Last 7 Days</SelectItem>
                          <SelectItem value="monthly">Last 30 Days</SelectItem>
                          <SelectItem value="quarterly">Last 90 Days</SelectItem>
                          <SelectItem value="yearly">Last 365 Days</SelectItem>
                          <SelectItem value="month-to-date">This Month</SelectItem>
                          <SelectItem value="quarter-to-date">This Quarter</SelectItem>
                          <SelectItem value="year-to-date">This Year</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <Button 
                      onClick={() => setAchievementModalOpen(true)}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white"
                    >
                      <PlusIcon className="h-4 w-4 mr-2" />
                      Add Achievement
                    </Button>
                  </div>
                </div>
                
                {/* Achievement Modal */}
                <Dialog open={achievementModalOpen} onOpenChange={setAchievementModalOpen}>
                  <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
                    <DialogHeader className="sr-only">
                      <DialogTitle>Add Achievement</DialogTitle>
                      <DialogDescription>Record your professional accomplishments and milestones</DialogDescription>
                    </DialogHeader>
                    <AddAchievementForm onComplete={() => setAchievementModalOpen(false)} />
                  </DialogContent>
                </Dialog>
                
                <div className="grid md:grid-cols-2 gap-6">
                  {achievements && achievements
                    .filter(achievement => filterByTimePeriod(new Date(achievement.date)))
                    .map((achievement) => (
                    <div key={achievement.id} className="border border-neutral-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow">
                      <div className="bg-gradient-to-r from-purple-500 to-purple-700 p-3 text-white">
                        <div className="flex items-center">
                          <Trophy className="h-5 w-5 mr-2" />
                          <h3 className="font-medium">{achievement.title}</h3>
                        </div>
                        <p className="text-sm text-purple-100 mt-1">
                          {new Date(achievement.date).toLocaleDateString('en-US', { 
                            year: 'numeric', 
                            month: 'short', 
                            day: 'numeric' 
                          })}
                        </p>
                      </div>
                      <div className="p-4">
                        <p className="text-neutral-700">{achievement.description}</p>
                        {achievement.attachments && achievement.attachments.length > 0 && (
                          <div className="mt-3 pt-3 border-t border-neutral-200">
                            <div className="flex items-center text-sm text-neutral-500">
                              <span className="font-medium text-neutral-600 mr-2">Attachments:</span>
                              {achievement.attachments.map((attachment, idx) => (
                                <span key={idx} className="text-primary-600 hover:underline mr-2">{attachment}</span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="promotions" className="mt-0">
              {/* Promotions Section */}
              <div className="bg-white shadow rounded-lg p-6 mb-8">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-semibold text-neutral-900">Career Advancements & Promotions</h2>
                  
                  <div className="flex">
                    <div className="border border-gray-300 rounded-l-md px-3 py-2 flex items-center bg-white">
                      <FilterIcon className="h-4 w-4 text-gray-500" />
                    </div>
                    <Select 
                      value={timeFilter} 
                      onValueChange={setTimeFilter}
                    >
                      <SelectTrigger className="w-[150px] rounded-l-none border-l-0">
                        <SelectValue placeholder="All..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Events</SelectItem>
                        <SelectItem value="recent">Last 7 Days</SelectItem>
                        <SelectItem value="monthly">Last 30 Days</SelectItem>
                        <SelectItem value="quarterly">Last 90 Days</SelectItem>
                        <SelectItem value="yearly">Last 365 Days</SelectItem>
                        <SelectItem value="month-to-date">This Month</SelectItem>
                        <SelectItem value="quarter-to-date">This Quarter</SelectItem>
                        <SelectItem value="year-to-date">This Year</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div className="space-y-6">
                  {careerEvents && careerEvents
                    .filter(event => event.eventType === 'promotion' || event.eventType === 'planned_promotion')
                    .filter(event => filterByTimePeriod(new Date(event.date)))
                    .map((promotion) => (
                      <div key={promotion.id} className="border border-neutral-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow">
                        <div className={`p-4 text-white ${
                          promotion.eventType === 'planned_promotion'
                            ? 'bg-gradient-to-r from-teal-500 to-teal-700' // Teal for future roadmap
                            : 'bg-gradient-to-r from-blue-500 to-blue-700' // Blue for regular promotions
                        }`}>
                          <div className="flex items-center">
                            <Award className="h-6 w-6 mr-2" />
                            <div>
                              <h3 className="text-lg font-medium">{promotion.title}</h3>
                              {promotion.eventType === 'planned_promotion' && (
                                <span className="inline-block mt-1 px-2 py-0.5 text-xs font-medium bg-teal-800 text-white rounded">Future Roadmap</span>
                              )}
                            </div>
                          </div>
                          <p className={`text-sm mt-1 ${
                            promotion.eventType === 'planned_promotion'
                              ? 'text-teal-100' // Light teal text for future roadmap
                              : 'text-blue-100' // Light blue text for regular promotions
                          }`}>
                            {new Date(promotion.date).toLocaleDateString('en-US', { 
                              year: 'numeric', 
                              month: 'long', 
                              day: 'numeric' 
                            })}
                          </p>
                        </div>
                        <div className="p-5">
                          <p className="text-neutral-700 mb-4">{promotion.description}</p>
                          {promotion.details && (
                            <div className="mt-3 pt-3 border-t border-neutral-200">
                              {(promotion.details as CareerEventDetails).responsibilities && (
                                <div className="mb-3">
                                  <h4 className="font-medium text-neutral-800 mb-2">
                                    {promotion.eventType === 'planned_promotion' 
                                      ? 'Expected Responsibilities:' 
                                      : 'New Responsibilities:'}
                                  </h4>
                                  <ul className="list-disc pl-5 text-neutral-600">
                                    {(promotion.details as CareerEventDetails).responsibilities?.map((resp, idx) => (
                                      <li key={idx} className="mb-1">{resp}</li>
                                    ))}
                                  </ul>
                                </div>
                              )}
                              {(promotion.details as CareerEventDetails).achievements && (
                                <div className="mb-3">
                                  <h4 className="font-medium text-neutral-800 mb-2">Key Achievements:</h4>
                                  <ul className="list-disc pl-5 text-neutral-600">
                                    {(promotion.details as CareerEventDetails).achievements?.map((ach, idx) => (
                                      <li key={idx} className="mb-1">{ach}</li>
                                    ))}
                                  </ul>
                                </div>
                              )}
                              {(promotion.details as CareerEventDetails).quote && (
                                <div className="mt-4 italic text-neutral-600 border-l-4 border-primary-300 pl-4 py-2">
                                  "{(promotion.details as CareerEventDetails).quote}"
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="idps" className="mt-0">
              {/* IDPs Section */}
              <div className="bg-white shadow rounded-lg p-6 mb-8">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-semibold text-neutral-900">Individual Development Plans</h2>
                </div>
                <IdpDisplay />
              </div>
            </TabsContent>
            
            {isManagerOrAdmin && (
              <TabsContent value="reportees" className="mt-0">
                {/* Reportees Section */}
                <div className="bg-white shadow rounded-lg p-6 mb-8">
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-semibold text-neutral-900">My Team's Goals</h2>
                    <div className="flex items-center">
                      <span className="text-sm text-neutral-500 mr-2 bg-neutral-100 py-1 px-3 rounded-full flex items-center">
                        <Briefcase className="h-3.5 w-3.5 mr-1 text-neutral-600" />
                        Manager View
                      </span>
                    </div>
                  </div>
                  
                  <ReporteeGoalsTable />
                </div>
              </TabsContent>
            )}
          </Tabs>
        </div>
      </main>
      
      <Footer />
    </div>
  );
}
