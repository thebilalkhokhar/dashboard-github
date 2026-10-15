"use client";
import React, { useEffect, useState } from "react";
import AuthGuard from "@/components/AuthGuard";
import Navbar from "@/components/Navbar";
import MetricCard from "@/components/MetricCard";
import RepositoryTable from "@/components/RepositoryTable";
import DeveloperTable from "@/components/DeveloperTable";
import StuckPrsTable from "@/components/StuckPrsTable";
import {
  fetchOverviewStats,
  fetchDeveloperAnalytics,
  fetchStuckPRs,
  fetchRepositories,
} from "@/lib/api";
import {
  FolderSimple,
  ClockCountdown,
  GitPullRequest,
  WarningOctagon,
  Users,
} from "@phosphor-icons/react";

const REPOSITORY_FETCH_PAGE_SIZE = 100;
const TABLE_PAGE_SIZE = 10;

function DashboardContent() {
  const [overview, setOverview] = useState(null);
  const [developers, setDevelopers] = useState([]);
  const [stuckPrs, setStuckPrs] = useState([]);
  const [repositories, setRepositories] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [repositoryPage, setRepositoryPage] = useState(1);
  const [repositoryPageInfo, setRepositoryPageInfo] = useState({ totalCount: 0 });
  const [inactiveOnly, setInactiveOnly] = useState(false);
  const [repositorySortBy, setRepositorySortBy] = useState("lastPushedAt");
  const [repositoryRefreshKey, setRepositoryRefreshKey] = useState(0);
  const [loading, setLoading] = useState(true);
  const [repositoriesLoading, setRepositoriesLoading] = useState(true);
  const repositoryFetchPage =
    Math.floor(
      ((repositoryPage - 1) * TABLE_PAGE_SIZE) / REPOSITORY_FETCH_PAGE_SIZE,
    ) + 1;

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
      setInactiveOnly(false);
      setRepositoryPage(1);
      setRepositoryRefreshKey((currentKey) => currentKey + 1);
    } catch (err) {
      console.error("Failed to fetch dashboard data:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleRepositoryFilterChange = (nextInactiveOnly) => {
    if (nextInactiveOnly === inactiveOnly) return;
    setInactiveOnly(nextInactiveOnly);
    setRepositoryPage(1);
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

  useEffect(() => {
    let isCurrent = true;

    const timeoutId = setTimeout(
      () => {
        setRepositoriesLoading(true);
        void (async () => {
          try {
            const response = await fetchRepositories({
              inactiveOnly,
              page: repositoryFetchPage,
              limit: REPOSITORY_FETCH_PAGE_SIZE,
              search: searchQuery.trim(),
              sortBy: repositorySortBy,
            });

            if (!isCurrent) return;

            setRepositories(response.data);
            setRepositoryPageInfo(response.pagination);
          } catch (error) {
            if (isCurrent) {
              console.error("Failed to fetch repositories:", error);
            }
          } finally {
            if (isCurrent) setRepositoriesLoading(false);
          }
        })();
      },
      searchQuery.trim() ? 250 : 0,
    );

    return () => {
      isCurrent = false;
      clearTimeout(timeoutId);
    };
  }, [
    inactiveOnly,
    repositoryFetchPage,
    repositoryRefreshKey,
    repositorySortBy,
    searchQuery,
  ]);

  const handleRepositorySortChange = (nextSortBy) => {
    setRepositorySortBy(nextSortBy);
    setRepositoryPage(1);
  };

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900 flex flex-col font-sans dark:bg-black dark:text-zinc-100">
      <Navbar
        onSyncComplete={loadData}
        searchQuery={searchQuery}
        onSearchChange={(event) => {
          setSearchQuery(event.target.value);
          setRepositoryPage(1);
        }}
      />

      <main className="max-w-[1920px] w-full mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 py-8 flex-1 space-y-8">
        {/* Metric Cards Grid */}
        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-5">
          <MetricCard
            title="Total Repos"
            value={overview?.totalRepos}
            icon={FolderSimple}
            colorClass="bg-zinc-100 text-zinc-700 dark:bg-zinc-900 dark:text-zinc-300"
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
            colorClass="bg-zinc-100 text-zinc-700 dark:bg-zinc-900 dark:text-zinc-300"
          />
        </section>

        <section id="repositories" aria-label="Repositories">
          <RepositoryTable
            repositories={repositories}
            searchQuery={searchQuery}
            loading={loading || repositoriesLoading}
            inactiveOnly={inactiveOnly}
            allCount={overview?.totalRepos ?? 0}
            inactiveCount={overview?.inactiveRepos ?? 0}
            onFilterChange={handleRepositoryFilterChange}
            page={repositoryPage}
            pageSize={TABLE_PAGE_SIZE}
            pageOffset={(repositoryFetchPage - 1) * REPOSITORY_FETCH_PAGE_SIZE}
            totalCount={repositoryPageInfo.totalCount}
            onPageChange={setRepositoryPage}
            sortBy={repositorySortBy}
            onSortChange={handleRepositorySortChange}
          />
        </section>

        {/* Data Tables Grid */}
        <section className="grid grid-cols-1 items-start gap-6 lg:gap-8 xl:grid-cols-2">
          <div id="developers">
            <DeveloperTable
              developers={developers}
              loading={loading}
              searchQuery={searchQuery}
            />
          </div>
          <div id="pull-requests">
            <StuckPrsTable
              prs={stuckPrs}
              loading={loading}
              searchQuery={searchQuery}
            />
          </div>
        </section>
      </main>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <AuthGuard>
      <DashboardContent />
    </AuthGuard>
  );
}
