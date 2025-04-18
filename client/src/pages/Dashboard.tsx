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
  PlusOutlined,
  TrophyOutlined,
  AimOutlined,
  RiseOutlined,
  AppstoreOutlined,
  FilterOutlined,
  TeamOutlined,
  BookOutlined,
} from "@ant-design/icons";
import { Button } from "antd";
import { Modal } from "antd";
import { Tabs } from "antd";
import {
  useAchievements,
  useCareerEvents,
  useGoals,
} from "@/hooks/use-career-data";
import { CareerEventDetails } from "@shared/schema";
import { useAuth } from "@/hooks/use-auth";
import { Select } from "antd";

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
  const isManagerOrAdmin =
    user?.role === "manager" || user?.role === "admin" || user?.id === 1;

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
              <h1 className="text-2xl font-semibold text-neutral-900 sm:text-3xl sm:truncate">
                My Dashboard
              </h1>
              <p className="mt-1 text-sm text-neutral-500">
                Track your professional growth, set goals, and showcase
                achievements
              </p>
            </div>
          </div>

          {/* Stats Cards */}
          <StatsCards />

          {/* Tab Navigation */}
          <Tabs
            defaultActiveKey="timeline"
            className="mb-8"
            onChange={setActiveTab}
          >
            <Tabs.TabPane
              tab={
                <span>
                  <AppstoreOutlined />
                  Timeline
                </span>
              }
              key="timeline"
            />
            <Tabs.TabPane
              tab={
                <span>
                  <AimOutlined />
                  Goals
                </span>
              }
              key="goals"
            />
            <Tabs.TabPane
              tab={
                <span>
                  <TrophyOutlined />
                  Achievements
                </span>
              }
              key="achievements"
            />
            <Tabs.TabPane
              tab={
                <span>
                  <RiseOutlined />
                  Promotions
                </span>
              }
              key="promotions"
            />
            {/* <Tabs.TabPane 
              tab={<span><BookOutlined />Development Plans</span>}
              key="idps"
            /> */}

            {isManagerOrAdmin && (
              <Tabs.TabPane
                tab={
                  <span>
                    <TeamOutlined />
                    My Reportees
                  </span>
                }
                key="reportees"
              />
            )}
          </Tabs>

          {activeTab === "timeline" && (
            /* Enhanced Timeline */
            <EnhancedTimeline
              timeFilter={timeFilter}
              filterByTimePeriod={filterByTimePeriod}
            />
          )}

          {activeTab === "goals" && (
            /* Goals Table with Filter */
            <div className="bg-white shadow rounded-lg p-6 mb-8">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold text-neutral-900">
                  Goals Management
                </h2>

                <div className="flex items-center space-x-3">
                  <div className="flex">
                    <div className="border border-gray-300 rounded-l-md px-3 py-2 flex items-center bg-white">
                      <FilterOutlined className="h-4 w-4 text-gray-500" />
                    </div>
                    <Select
                      value={timeFilter}
                      onChange={setTimeFilter}
                      style={{ width: 150 }}
                      bordered={false}
                      className="rounded-l-none border-l-0"
                    >
                      <Select.Option value="all">All Goals</Select.Option>
                      <Select.Option value="recent">Last 7 Days</Select.Option>
                      <Select.Option value="monthly">
                        Last 30 Days
                      </Select.Option>
                      <Select.Option value="quarterly">
                        Last 90 Days
                      </Select.Option>
                      <Select.Option value="yearly">
                        Last 365 Days
                      </Select.Option>
                      <Select.Option value="month-to-date">
                        This Month
                      </Select.Option>
                      <Select.Option value="quarter-to-date">
                        This Quarter
                      </Select.Option>
                      <Select.Option value="year-to-date">
                        This Year
                      </Select.Option>
                    </Select>
                  </div>

                  <Button
                    onClick={() => setGoalModalOpen(true)}
                    type="primary"
                    icon={<PlusOutlined />}
                  >
                    Add Goal
                  </Button>
                </div>
              </div>

              {/* Goal Modal */}
              <Modal
                open={goalModalOpen}
                onCancel={() => setGoalModalOpen(false)}
                footer={null}
                width={600}
              >
                <AddGoalForm onComplete={() => setGoalModalOpen(false)} />
              </Modal>

              <GoalsTable
                timeFilter={timeFilter}
                filterByTimePeriod={filterByTimePeriod}
              />
            </div>
          )}

          {activeTab === "achievements" && (
            /* Achievements Section */
            <div className="bg-white shadow rounded-lg p-6 mb-8">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold text-neutral-900">
                  Professional Achievements
                </h2>

                <div className="flex items-center space-x-3">
                  <div className="flex">
                    <div className="border border-gray-300 rounded-l-md px-3 py-2 flex items-center bg-white">
                      <FilterOutlined className="h-4 w-4 text-gray-500" />
                    </div>
                    <Select
                      value={timeFilter}
                      onChange={setTimeFilter}
                      style={{ width: 150 }}
                      bordered={false}
                      className="rounded-l-none border-l-0"
                    >
                      <Select.Option value="all">
                        All Achievements
                      </Select.Option>
                      <Select.Option value="recent">Last 7 Days</Select.Option>
                      <Select.Option value="monthly">
                        Last 30 Days
                      </Select.Option>
                      <Select.Option value="quarterly">
                        Last 90 Days
                      </Select.Option>
                      <Select.Option value="yearly">
                        Last 365 Days
                      </Select.Option>
                      <Select.Option value="month-to-date">
                        This Month
                      </Select.Option>
                      <Select.Option value="quarter-to-date">
                        This Quarter
                      </Select.Option>
                      <Select.Option value="year-to-date">
                        This Year
                      </Select.Option>
                    </Select>
                  </div>

                  <Button
                    onClick={() => setAchievementModalOpen(true)}
                    type="primary"
                    icon={<PlusOutlined />}
                  >
                    Add Achievement
                  </Button>
                </div>
              </div>

              {/* Achievement Modal */}
              <Modal
                open={achievementModalOpen}
                onCancel={() => setAchievementModalOpen(false)}
                footer={null}
                width={600}
              >
                <AddAchievementForm
                  onComplete={() => setAchievementModalOpen(false)}
                />
              </Modal>

              <div className="grid md:grid-cols-2 gap-6">
                {achievements &&
                  achievements
                    .filter((achievement) =>
                      filterByTimePeriod(new Date(achievement.date))
                    )
                    .map((achievement) => (
                      <div
                        key={achievement.id}
                        className="border border-neutral-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow"
                      >
                        <div className="bg-gradient-to-r from-purple-500 to-purple-700 p-3 text-white">
                          <div className="flex items-center">
                            <TrophyOutlined className="h-5 w-5 mr-2" />
                            <h3 className="font-medium">{achievement.title}</h3>
                          </div>
                          <p className="text-sm text-purple-100 mt-1">
                            {new Date(achievement.date).toLocaleDateString(
                              "en-US",
                              {
                                year: "numeric",
                                month: "short",
                                day: "numeric",
                              }
                            )}
                          </p>
                        </div>
                        <div className="p-4">
                          <p className="text-neutral-700">
                            {achievement.description}
                          </p>
                          {achievement.attachments &&
                            achievement.attachments.length > 0 && (
                              <div className="mt-3 pt-3 border-t border-neutral-200">
                                <div className="flex items-center text-sm text-neutral-500">
                                  <span className="font-medium text-neutral-600 mr-2">
                                    Attachments:
                                  </span>
                                  {achievement.attachments.map(
                                    (attachment, idx) => (
                                      <span
                                        key={idx}
                                        className="text-primary-600 hover:underline mr-2"
                                      >
                                        {attachment}
                                      </span>
                                    )
                                  )}
                                </div>
                              </div>
                            )}
                        </div>
                      </div>
                    ))}
              </div>
            </div>
          )}

          {activeTab === "promotions" && (
            /* Promotions Section */
            <div className="bg-white shadow rounded-lg p-6 mb-8">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold text-neutral-900">
                  Career Advancements & Promotions
                </h2>

                <div className="flex">
                  <div className="border border-gray-300 rounded-l-md px-3 py-2 flex items-center bg-white">
                    <FilterOutlined className="h-4 w-4 text-gray-500" />
                  </div>
                  <Select
                    value={timeFilter}
                    onChange={setTimeFilter}
                    style={{ width: 150 }}
                    bordered={false}
                    className="rounded-l-none border-l-0"
                  >
                    <Select.Option value="all">All Events</Select.Option>
                    <Select.Option value="recent">Last 7 Days</Select.Option>
                    <Select.Option value="monthly">Last 30 Days</Select.Option>
                    <Select.Option value="quarterly">
                      Last 90 Days
                    </Select.Option>
                    <Select.Option value="yearly">Last 365 Days</Select.Option>
                    <Select.Option value="month-to-date">
                      This Month
                    </Select.Option>
                    <Select.Option value="quarter-to-date">
                      This Quarter
                    </Select.Option>
                    <Select.Option value="year-to-date">
                      This Year
                    </Select.Option>
                  </Select>
                </div>
              </div>

              <div className="space-y-6">
                {careerEvents &&
                  careerEvents
                    .filter(
                      (event) =>
                        event.eventType === "promotion" ||
                        event.eventType === "planned_promotion"
                    )
                    .filter((event) => filterByTimePeriod(new Date(event.date)))
                    .map((promotion) => (
                      <div
                        key={promotion.id}
                        className="border border-neutral-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow"
                      >
                        <div
                          className={`p-4 text-white ${
                            promotion.eventType === "planned_promotion"
                              ? "bg-gradient-to-r from-teal-500 to-teal-700" // Teal for future roadmap
                              : "bg-gradient-to-r from-blue-500 to-blue-700" // Blue for regular promotions
                          }`}
                        >
                          <div className="flex items-center">
                            <TrophyOutlined className="h-6 w-6 mr-2" />
                            <div>
                              <h3 className="text-lg font-medium">
                                {promotion.title}
                              </h3>
                              {promotion.eventType === "planned_promotion" && (
                                <span className="inline-block mt-1 px-2 py-0.5 text-xs font-medium bg-teal-800 text-white rounded">
                                  Future Roadmap
                                </span>
                              )}
                            </div>
                          </div>
                          <p
                            className={`text-sm mt-1 ${
                              promotion.eventType === "planned_promotion"
                                ? "text-teal-100" // Light teal text for future roadmap
                                : "text-blue-100" // Light blue text for regular promotions
                            }`}
                          >
                            {new Date(promotion.date).toLocaleDateString(
                              "en-US",
                              {
                                year: "numeric",
                                month: "long",
                                day: "numeric",
                              }
                            )}
                          </p>
                        </div>
                        <div className="p-5">
                          <p className="text-neutral-700 mb-4">
                            {promotion.description}
                          </p>
                          {promotion.details && (
                            <div className="mt-3 pt-3 border-t border-neutral-200">
                              {(promotion.details as CareerEventDetails)
                                .responsibilities && (
                                <div className="mb-3">
                                  <h4 className="font-medium text-neutral-800 mb-2">
                                    {promotion.eventType === "planned_promotion"
                                      ? "Expected Responsibilities:"
                                      : "New Responsibilities:"}
                                  </h4>
                                  <ul className="list-disc pl-5 text-neutral-600">
                                    {(
                                      promotion.details as CareerEventDetails
                                    ).responsibilities?.map((resp, idx) => (
                                      <li key={idx} className="mb-1">
                                        {resp}
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              )}
                              {(promotion.details as CareerEventDetails)
                                .achievements && (
                                <div className="mb-3">
                                  <h4 className="font-medium text-neutral-800 mb-2">
                                    Key Achievements:
                                  </h4>
                                  <ul className="list-disc pl-5 text-neutral-600">
                                    {(
                                      promotion.details as CareerEventDetails
                                    ).achievements?.map((ach, idx) => (
                                      <li key={idx} className="mb-1">
                                        {ach}
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              )}
                              {(promotion.details as CareerEventDetails)
                                .quote && (
                                <div className="mt-4 italic text-neutral-600 border-l-4 border-primary-300 pl-4 py-2">
                                  "
                                  {
                                    (promotion.details as CareerEventDetails)
                                      .quote
                                  }
                                  "
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
              </div>
            </div>
          )}

          {activeTab === "idps" && (
            /* IDPs Section */
            <div className="bg-white shadow rounded-lg p-6 mb-8">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold text-neutral-900">
                  Individual Development Plans
                </h2>
              </div>
              <IdpDisplay />
            </div>
          )}

          {isManagerOrAdmin && activeTab === "reportees" && (
            /* Reportees Section */
            <div className="bg-white shadow rounded-lg p-6 mb-8">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold text-neutral-900">
                  My Team's Goals
                </h2>
                <div className="flex items-center">
                  <span className="text-sm text-neutral-500 mr-2 bg-neutral-100 py-1 px-3 rounded-full flex items-center">
                    <BookOutlined className="h-3.5 w-3.5 mr-1 text-neutral-600" />
                    Manager View
                  </span>
                </div>
              </div>

              <ReporteeGoalsTable />
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
