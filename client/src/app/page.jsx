"use client";
import React, { useEffect, useState } from "react";
import Navbar from "@/components/Navbar";
import MetricCard from "@/components/MetricCard";
import DeveloperTable from "@/components/DeveloperTable";
import StuckPrsTable from "@/components/StuckPrsTable";
import {
  fetchOverviewStats,
  fetchDeveloperAnalytics,
  fetchStuckPRs,
} from "@/lib/api";
import {
  FolderSimple,
  ClockCountdown,
  GitPullRequest,
  WarningOctagon,
  Users,
} from "@phosphor-icons/react";

export default function DashboardPage() {
  const [overview, setOverview] = useState(null);
  const [developers, setDevelopers] = useState([]);
  const [stuckPrs, setStuckPrs] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      setLoading(true);
      const [overviewData, devData, stuckData] = await Promise.all([
        fetchOverviewStats(),
        fetchDeveloperAnalytics(),
        fetchStuckPRs(),
      ]);
      setOverview(overviewData);
      setDevelopers(devData);
      setStuckPrs(stuckData);
    } catch (err) {
      console.error("Failed to fetch dashboard data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let isMounted = true;

    const timeoutId = setTimeout(() => {
      void (async () => {
        try {
          setLoading(true);
          const [overviewData, devData, stuckData] = await Promise.all([
            fetchOverviewStats(),
            fetchDeveloperAnalytics(),
            fetchStuckPRs(),
          ]);

          if (!isMounted) return;

          setOverview(overviewData);
          setDevelopers(devData);
          setStuckPrs(stuckData);
        } catch (err) {
          console.error("Failed to fetch dashboard data:", err);
        } finally {
          if (isMounted) {
            setLoading(false);
          }
        }
      })();
    }, 0);

    return () => {
      isMounted = false;
      clearTimeout(timeoutId);
    };
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      <Navbar onSyncComplete={loadData} />

      <main className="max-w-7xl mx-auto px-6 py-8 flex-1 w-full space-y-8">
        {/* Metric Cards Grid */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <MetricCard
            title="Total Repos"
            value={overview?.totalRepos}
            icon={FolderSimple}
            colorClass="bg-blue-500/10 text-blue-400"
          />
          <MetricCard
            title="Inactive Repos"
            value={overview?.inactiveRepos}
            icon={ClockCountdown}
            colorClass="bg-amber-500/10 text-amber-400"
            subtitle="> 90 days idle"
          />
          <MetricCard
            title="Open PRs"
            value={overview?.openPrs}
            icon={GitPullRequest}
            colorClass="bg-emerald-500/10 text-emerald-400"
          />
          <MetricCard
            title="Stuck PRs"
            value={overview?.stuckPrs}
            icon={WarningOctagon}
            colorClass="bg-rose-500/10 text-rose-400"
            subtitle="Awaiting review"
          />
          <MetricCard
            title="Active Devs"
            value={overview?.totalActiveDevs}
            icon={Users}
            colorClass="bg-indigo-500/10 text-indigo-400"
          />
        </section>

        {/* Data Tables Grid */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
          <DeveloperTable developers={developers} loading={loading} />
          <StuckPrsTable prs={stuckPrs} loading={loading} />
        </section>
      </main>
    </div>
  );
}
