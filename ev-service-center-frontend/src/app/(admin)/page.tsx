import type { Metadata } from "next";
import React from "react";
import MonthlyUsersChart from "@/components/ecommerce/MonthlyUsersChart";
import StatisticsChart from "@/components/ecommerce/StatisticsChart";
import UserMetrics from "@/components/ecommerce/UserMetrics";
import MonthlyPartsChart from "@/components/ecommerce/MonthlyPartsChart";
import TaskStatisticsChart from "@/components/ecommerce/TaskStatisticsChart";
import MonthlyRevenueChart from "@/components/ecommerce/MonthlyRevenueChart";

export const metadata: Metadata = {
  title: "EV Service Center Dashboard",
  description: "EV Service Center Management Dashboard",
};

export default function Dashboard() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Dashboard
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Tổng quan về hoạt động của trung tâm dịch vụ EV
        </p>
      </div>

      {/* Metrics Cards */}
      <div className="mb-8">
        <UserMetrics />
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">

        {/* Monthly Revenue Chart */}
        <div className="xl:col-span-2">
          <MonthlyRevenueChart />
        </div>

        {/* Statistics Chart - Full width on mobile, half on xl */}
        <div className="xl:col-span-2">
          <StatisticsChart />
        </div>

        {/* Task Statistics Chart - Full width on mobile, half on xl */}
        <div className="xl:col-span-2">
          <TaskStatisticsChart />
        </div>

        {/* Monthly Users Chart */}
        <div>
          <MonthlyUsersChart />
        </div>

        {/* Monthly Parts Chart */}
        <div>
          <MonthlyPartsChart />
        </div>
      </div>
    </div>
  );
}