"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  Activity,
  BarChart3,
  Bell,
  Brain,
  Calendar,
  CheckCircle,
  Download,
  Eye,
  FileText,
  Filter,
  Lightbulb,
  Plus,
  RefreshCw,
  Search,
  Settings,
  Target,
  Users,
  X,
} from "lucide-react";

import CreateResearchModal from "./research/create-research-modal";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { apiService } from "@/lib/services/apiService";
import { config } from "@/lib/config";

interface User {
  id: string;
  email: string;
  full_name?: string;
  role?: string;
}

interface KnowledgeRepositoryProps {
  user: User | null;
}

interface ResearchItem {
  id: string;
  title: string;
  type?: string;
  content?: string;
  tags?: string[];
  confidence?: number;
  created_at?: string;
  updated_at?: string;
  author?: string;
  last_updated_by?: string;
}

interface ResearchVersion {
  id: string;
  version_number?: number;
  title?: string;
  content?: string;
  type?: string;
  tags?: string[];
  author?: string;
  created_at?: string;
  file_url?: string;
}

interface Thesis {
  id: string;
  name: string;
  investmentView: string;
  conviction: "Low" | "Medium" | "High";
  timeHorizon: "Short Term" | "Medium Term" | "Long Term";
  status: "Draft" | "Active" | "Under Review";
  linkedResearch: string[];
  rationale: string;
  catalysts: string;
  keyRisks: string;
  createdAt: string;
}

const RESEARCH_TYPES = [
  "All",
  "Company Research",
  "Sector Analysis",
  "Macro Analysis",
  "Technical Analysis",
  "Market Commentary",
];

const KnowledgeRepository: React.FC<KnowledgeRepositoryProps> = ({ user }) => {
  const supabase = createClientComponentClient();

  const [activeTab, setActiveTab] = useState("dashboard");
  const [researchItems, setResearchItems] = useState<ResearchItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedType, setSelectedType] = useState("All");
  const [showCreateModal, setShowCreateModal] = useState(false);

  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [unreadResearchIds, setUnreadResearchIds] = useState<Set<string>>(new Set());
  const knownResearchIds = useRef<Set<string>>(new Set());

  const [autoRefresh, setAutoRefresh] = useState(true);
  const [refreshInterval, setRefreshInterval] = useState(5);
  const [showAIInsights, setShowAIInsights] = useState(true);
  const [theme, setTheme] = useState<"light" | "dark">("light");

  const [activeEditors, setActiveEditors] = useState<Record<string, string[]>>({});
  const [ws, setWs] = useState<WebSocket | null>(null);
  const [wsStatus, setWsStatus] = useState<"connecting" | "connected" | "offline">("offline");

  const [collaborationResearchId, setCollaborationResearchId] =
    useState<string | null>(null);
  const collaborationResearchIdRef = useRef<string | null>(null);
  const [versionModalOpen, setVersionModalOpen] = useState(false);
  const [versionResearch, setVersionResearch] = useState<ResearchItem | null>(null);
  const [versions, setVersions] = useState<ResearchVersion[]>([]);
  const [versionsLoading, setVersionsLoading] = useState(false);
  const [versionsError, setVersionsError] = useState<string | null>(null);

  const [theses, setTheses] = useState<Thesis[]>([]);

  const [showThesisModal, setShowThesisModal] = useState(false);
  const [thesisName, setThesisName] = useState("");
  const [thesisInvestmentView, setThesisInvestmentView] = useState("");
  const [thesisConviction, setThesisConviction] =
    useState<Thesis["conviction"]>("Medium");
  const [thesisTimeHorizon, setThesisTimeHorizon] =
    useState<Thesis["timeHorizon"]>("Long Term");
  const [thesisStatus, setThesisStatus] =
    useState<Thesis["status"]>("Draft");
  const [thesisLinkedResearch, setThesisLinkedResearch] = useState<string[]>([]);
  const [thesisRationale, setThesisRationale] = useState("");
  const [thesisCatalysts, setThesisCatalysts] = useState("");
  const [thesisRisks, setThesisRisks] = useState("");
  const [thesisFormError, setThesisFormError] = useState("");

  const [userName, setUserName] = useState(
    user?.full_name || user?.email?.split("@")[0] || "User"
  );
  const [userRole, setUserRole] = useState(user?.role || "Team Member");
  const [userInitials, setUserInitials] = useState(
    (user?.full_name || user?.email || "U")
      .split(" ")
      .map((part) => part[0])
      .join("")
      .slice(0, 2)
      .toUpperCase()
  );

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const {
          data: { user: authUser },
        } = await supabase.auth.getUser();

        if (!authUser) return;

        const { data: profile } = await supabase
          .from("profiles")
          .select("full_name, role")
          .eq("id", authUser.id)
          .single();

        const name =
          profile?.full_name ||
          authUser.user_metadata?.full_name ||
          authUser.email?.split("@")[0] ||
          "User";

        setUserName(name);
        setUserRole(profile?.role || "Team Member");
        setUserInitials(
          name
            .split(" ")
            .map((part) => part[0])
            .join("")
            .slice(0, 2)
            .toUpperCase()
        );
      } catch (err) {
        console.warn("Unable to load profile:", err);
      }
    };

    loadProfile();
  }, [supabase]);

  useEffect(() => {
    try {
      const savedTheme = localStorage.getItem("strawfi_dashboard_theme");
      const savedAutoRefresh = localStorage.getItem("strawfi_auto_refresh");
      const savedInterval = Number(
        localStorage.getItem("strawfi_refresh_interval")
      );
      const savedAI = localStorage.getItem("strawfi_ai_insights");

      if (savedTheme === "light" || savedTheme === "dark") {
        setTheme(savedTheme);
      }
      if (savedAutoRefresh !== null) {
        setAutoRefresh(savedAutoRefresh === "true");
      }
      if ([5, 10, 30].includes(savedInterval)) {
        setRefreshInterval(savedInterval);
      }
      if (savedAI !== null) {
        setShowAIInsights(savedAI !== "false");
      }
    } catch (err) {
      console.warn("Unable to load dashboard settings:", err);
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem("strawfi_dashboard_theme", theme);
      localStorage.setItem("strawfi_auto_refresh", String(autoRefresh));
      localStorage.setItem(
        "strawfi_refresh_interval",
        String(refreshInterval)
      );
      localStorage.setItem("strawfi_ai_insights", String(showAIInsights));
    } catch (err) {
      console.warn("Unable to save dashboard settings:", err);
    }
  }, [theme, autoRefresh, refreshInterval, showAIInsights]);

  const thesisStorageKey = useMemo(() => {
    if (typeof window === "undefined") return "strawfi_theses_default";
    return `strawfi_theses_${
      localStorage.getItem("team_id") ||
      localStorage.getItem("teamId") ||
      "default"
    }`;
  }, []);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(thesisStorageKey);
      if (!stored) return;
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed)) setTheses(parsed);
    } catch (err) {
      console.warn("Unable to load theses:", err);
    }
  }, [thesisStorageKey]);

  const saveTheses = useCallback(
    (next: Thesis[]) => {
      setTheses(next);
      try {
        localStorage.setItem(thesisStorageKey, JSON.stringify(next));
      } catch (err) {
        console.warn("Unable to save theses:", err);
      }
    },
    [thesisStorageKey]
  );

  const fetchResearchItems = useCallback(
    async (silent = false) => {
      try {
        if (!silent) setIsLoading(true);
        setError(null);

        const teamJwt =
          localStorage.getItem("team_jwt") ||
          localStorage.getItem("teamJwt");

        if (!teamJwt) {
  setResearchItems([]);
  setError(null);
  return;
}

        const response = await apiService.authenticatedFetch(
          "/api/research",
          { method: "GET" },
          teamJwt
        );

        if (response.status === 401 || response.status === 403) {
          console.warn("Team session is invalid or expired.");

          localStorage.removeItem("team_jwt");
          localStorage.removeItem("teamJwt");

          setResearchItems([]);
          setError(null);

          return;
        }

let result;

try {
  result = await response.json();
} catch {
  throw new Error(
    `Research service returned an invalid response (${response.status}).`
  );
}

if (!response.ok || !result.success) {
  throw new Error(
    result.error ||
      result.message ||
      "Unable to load your team's research."
  );
}

        const items: ResearchItem[] = Array.isArray(result.data)
          ? result.data
          : [];

        if (knownResearchIds.current.size > 0) {
          const newIds = items
            .filter(
              (item) =>
                !knownResearchIds.current.has(String(item.id))
            )
            .map((item) => String(item.id));

          if (newIds.length > 0) {
            setUnreadResearchIds((previous) => {
              const next = new Set(previous);
              newIds.forEach((id) => next.add(id));
              return next;
            });
          }
        }

        knownResearchIds.current = new Set(
          items.map((item) => String(item.id))
        );

        setResearchItems(items);
      } catch (err: unknown) {
        const message =
          err instanceof Error ? err.message : String(err || "");

        // Treat an auth failure as a missing team session rather than
        // showing a persistent 401/403 error banner on the dashboard.
        if (/\b(401|403)\b|forbidden|unauthorized|team session/i.test(message)) {
          console.warn("Team session is invalid or expired.");
          localStorage.removeItem("team_jwt");
          localStorage.removeItem("teamJwt");
          setResearchItems([]);
          setError(null);
          return;
        }

        console.error("Dashboard research fetch failed:", err);
        setError(message || "Unable to load your team's research.");
      } finally {
        if (!silent) setIsLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    fetchResearchItems();
  }, [fetchResearchItems]);

  useEffect(() => {
    if (!autoRefresh) return;

    const interval = window.setInterval(() => {
      fetchResearchItems(true);
    }, refreshInterval * 1000);

    const handleFocus = () => {
      fetchResearchItems(true);
    };

    window.addEventListener("focus", handleFocus);

    return () => {
      window.clearInterval(interval);
      window.removeEventListener("focus", handleFocus);
    };
  }, [autoRefresh, refreshInterval, fetchResearchItems]);

  useEffect(() => {
    const wsUrl = config.websocket.url;
    if (!wsUrl) {
      setWsStatus("offline");
      return;
    }

    let socket: WebSocket | null = null;
    let reconnectTimer: number | null = null;
    let stopped = false;

    const connect = () => {
      if (stopped) return;
      setWsStatus("connecting");

      try {
        socket = new WebSocket(wsUrl);

        socket.onopen = () => {
          setWsStatus("connected");
        };

        socket.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            if (data?.type !== "editors_update") return;

            const allEditors: Record<string, string[]> = {};

            Object.entries(data.editors || {}).forEach(
              ([researchId, editors]) => {
                const editorList = Array.isArray(editors)
                  ? (editors as string[])
                  : [];

                if (editorList.length > 0) {
                  allEditors[researchId] = editorList;
                }
              }
            );

            setActiveEditors(allEditors);
          } catch (error) {
            console.warn("Unable to parse collaboration update:", error);
          }
        };

        socket.onerror = () => {
          setWsStatus("offline");
        };

        socket.onclose = () => {
          setWsStatus("offline");
          if (!stopped) {
            reconnectTimer = window.setTimeout(connect, 3000);
          }
        };
      } catch (error) {
        console.warn("Unable to connect collaboration WebSocket:", error);
        setWsStatus("offline");
        reconnectTimer = window.setTimeout(connect, 3000);
      }
    };

    connect();

    return () => {
      stopped = true;
      if (reconnectTimer !== null) {
        window.clearTimeout(reconnectTimer);
      }
      socket?.close(1000, "Dashboard closed");
    };
  }, []);

 
  const notifyEditing = useCallback(
    (researchId: string) => {
      if (!ws || ws.readyState !== WebSocket.OPEN) return false;

      const teamName = localStorage.getItem("team_name") || "Team Member";
      const teamId = localStorage.getItem("team_id") || "unknown";

      ws.send(
        JSON.stringify({
          type: "start_edit",
          researchId: String(researchId),
          teamName,
          teamId,
        })
      );

      return true;
    },
    [ws]
  );

  const notifyStoppedEditing = useCallback(
    (researchId: string) => {
      if (!ws || ws.readyState !== WebSocket.OPEN) return false;

      const teamName = localStorage.getItem("team_name") || "Team Member";
      const teamId = localStorage.getItem("team_id") || "unknown";

      ws.send(
        JSON.stringify({
          type: "stop_edit",
          researchId: String(researchId),
          teamName,
          teamId,
        })
      );

      return true;
    },
    [ws]
  );

  useEffect(() => {
    collaborationResearchIdRef.current = collaborationResearchId;
  }, [collaborationResearchId]);

  const handleStartCollaboration = useCallback(
    (research: ResearchItem) => {
      const teamJwt =
        localStorage.getItem("team_jwt") ||
        localStorage.getItem("teamJwt");

      if (!teamJwt) {
        alert("Please log in to your team through Research Memory first.");
        return false;
      }

      if (!ws || ws.readyState !== WebSocket.OPEN) {
        alert(
          "Live collaboration is still connecting. Please wait a moment and try again."
        );
        return false;
      }

      const previousResearchId = collaborationResearchIdRef.current;
      if (
        previousResearchId &&
        String(previousResearchId) !== String(research.id)
      ) {
        notifyStoppedEditing(previousResearchId);
      }

      const started = notifyEditing(String(research.id));
      if (!started) return false;

      setCollaborationResearchId(String(research.id));
      return true;
    },
    [ws, notifyEditing, notifyStoppedEditing]
  );

  const handleLeaveCollaboration = useCallback(() => {
    const researchId = collaborationResearchIdRef.current;
    if (researchId) notifyStoppedEditing(researchId);
    setCollaborationResearchId(null);
  }, [notifyStoppedEditing]);

  useEffect(() => {
    const handleBeforeUnload = () => {
      const researchId = collaborationResearchIdRef.current;
      if (!researchId || !ws || ws.readyState !== WebSocket.OPEN) return;

      const teamName = localStorage.getItem("team_name") || "Team Member";
      const teamId = localStorage.getItem("team_id") || "unknown";

      try {
        ws.send(
          JSON.stringify({
            type: "stop_edit",
            researchId: String(researchId),
            teamName,
            teamId,
          })
        );
      } catch {
        // Ignore errors while the browser is closing.
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [ws]);

  const currentCollaborationResearch = collaborationResearchId
    ? researchItems.find(
        (item) => String(item.id) === String(collaborationResearchId)
      ) || null
    : null;

 const activeCollaborationResearch = useMemo(() => {
    return Object.entries(activeEditors)
      .map(([researchId, editors]) => ({
        research: researchItems.find(
          (item) => String(item.id) === String(researchId)
        ),
        editors,
      }))
      .filter((entry) => entry.research && entry.editors.length > 0);
  }, [activeEditors, researchItems]);

  const activeCollaborationCount = activeCollaborationResearch.length;
  const activeEditorNames = Array.from(
    new Set(activeCollaborationResearch.flatMap((entry) => entry.editors))
  );

  const openVersionHistory = useCallback(async (research: ResearchItem) => {
    setVersionResearch(research);
    setVersionModalOpen(true);
    setVersions([]);
    setVersionsError(null);
    setVersionsLoading(true);

    try {
      const teamJwt =
        localStorage.getItem("team_jwt") ||
        localStorage.getItem("teamJwt");

      if (!teamJwt) {
        throw new Error("No team session found.");
      }

      const response = await apiService.authenticatedFetch(
        `/api/research/${research.id}/versions`,
        { method: "GET" },
        teamJwt
      );

      if (response.status === 401 || response.status === 403) {
        console.warn("Team session is invalid or expired.");

        localStorage.removeItem("team_jwt");
        localStorage.removeItem("teamJwt");

        setVersions([]);
        setVersionsError("Your team session has expired. Please log in again.");
        return;
      }

const result = await response.json();

if (!response.ok || !result.success) {
  throw new Error(
    result.error ||
      result.message ||
      "Unable to load your team's research."
  );
}
      setVersions(
        Array.isArray(result.versions)
          ? result.versions
          : []
      );
    } catch (error: any) {
      setVersionsError(
        error?.message || "Failed to load version history"
      );
    } finally {
      setVersionsLoading(false);
    }
  }, []);

  const sortedResearch = useMemo(
    () =>
      [...researchItems].sort((a, b) => {
        const aDate = new Date(
          a.updated_at || a.created_at || 0
        ).getTime();
        const bDate = new Date(
          b.updated_at || b.created_at || 0
        ).getTime();
        return bDate - aDate;
      }),
    [researchItems]
  );

  const filteredResearch = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return sortedResearch.filter((item) => {
      const typeMatches =
        selectedType === "All" ||
        item.type === selectedType;

      if (!query) return typeMatches;

      const content = (item.content || "")
        .replace(/<[^>]*>/g, " ")
        .toLowerCase();

      const tags = Array.isArray(item.tags)
        ? item.tags.join(" ").toLowerCase()
        : "";

      const searchable = [
        item.title,
        item.type,
        item.author,
        item.last_updated_by,
        content,
        tags,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return typeMatches && searchable.includes(query);
    });
  }, [sortedResearch, searchQuery, selectedType]);

  const latestResearch = sortedResearch.slice(0, 5);
  const notificationResearch = sortedResearch.slice(0, 10);
  const unreadNotificationCount = unreadResearchIds.size;

  const recentResearchCount = useMemo(
    () =>
      researchItems.filter((item) => {
        const timestamp = new Date(
          item.updated_at || item.created_at || 0
        ).getTime();
        if (!timestamp) return false;

        const ageDays =
          (Date.now() - timestamp) / (1000 * 60 * 60 * 24);

        return ageDays <= 7;
      }).length,
    [researchItems]
  );

  const staleResearchCount = useMemo(
    () =>
      researchItems.filter((item) => {
        const timestamp = new Date(
          item.updated_at || item.created_at || 0
        ).getTime();
        if (!timestamp) return false;

        const ageDays =
          (Date.now() - timestamp) / (1000 * 60 * 60 * 24);

        return ageDays > 30;
      }).length,
    [researchItems]
  );

  const typeCounts = useMemo(
    () =>
      researchItems.reduce<Record<string, number>>((acc, item) => {
        const type = item.type || "Other";
        acc[type] = (acc[type] || 0) + 1;
        return acc;
      }, {}),
    [researchItems]
  );

  const largestResearchType = useMemo(
    () =>
      Object.entries(typeCounts).sort((a, b) => b[1] - a[1])[0],
    [typeCounts]
  );

  const repositoryInsights = useMemo(() => {
    if (researchItems.length === 0) {
      return [
        "Your StrawFi repository is ready. Add research to begin building team intelligence.",
      ];
    }

    const insights: string[] = [];

    if (recentResearchCount > 0) {
      insights.push(
        `${recentResearchCount} research item${
          recentResearchCount === 1 ? "" : "s"
        } updated in the last 7 days.`
      );
    }

    if (staleResearchCount > 0) {
      insights.push(
        `${staleResearchCount} research item${
          staleResearchCount === 1 ? "" : "s"
        } may need a freshness review.`
      );
    }

    if (largestResearchType) {
      insights.push(
        `${largestResearchType[0]} is your largest research category with ${largestResearchType[1]} item${
          largestResearchType[1] === 1 ? "" : "s"
        }.`
      );
    }

    insights.push(
      "Smart Search can turn repository knowledge into reusable financial intelligence."
    );

    return insights.slice(0, 4);
  }, [
    researchItems.length,
    recentResearchCount,
    staleResearchCount,
    largestResearchType,
  ]);

  const formatRelativeTime = useCallback(
    (dateString?: string) => {
      if (!dateString) return "Recently";

      const timestamp = new Date(dateString).getTime();
      if (!timestamp) return "Recently";

      const diff = Date.now() - timestamp;

      if (diff < 60 * 1000) return "Just now";

      const minutes = Math.floor(diff / (60 * 1000));
      if (minutes < 60) return `${minutes}m ago`;

      const hours = Math.floor(minutes / 60);
      if (hours < 24) return `${hours}h ago`;

      const days = Math.floor(hours / 24);
      if (days < 30) return `${days}d ago`;

      return new Date(dateString).toLocaleDateString();
    },
    []
  );

  const getActivityLabel = useCallback(
    (item: ResearchItem) => {
      const created = item.created_at
        ? new Date(item.created_at).getTime()
        : 0;

      const updated = item.updated_at
        ? new Date(item.updated_at).getTime()
        : created;

      return updated - created > 60 * 1000
        ? "Research updated"
        : "Research added";
    },
    []
  );

  const openResearch = (title: string) => {
    setSearchQuery(title);
    setActiveTab("retrieval");
    setNotificationsOpen(false);
  };

  const createThesis = () => {
    setThesisName("");
    setThesisInvestmentView("");
    setThesisConviction("Medium");
    setThesisTimeHorizon("Long Term");
    setThesisStatus("Draft");
    setThesisRationale("");
    setThesisCatalysts("");
    setThesisRisks("");
    setThesisFormError("");
    setThesisLinkedResearch(
      sortedResearch.slice(0, 3).map((item) => item.title)
    );
    setShowThesisModal(true);
  };

  const toggleThesisResearch = (title: string) => {
    setThesisLinkedResearch((current) =>
      current.includes(title)
        ? current.filter((item) => item !== title)
        : [...current, title]
    );
  };

  const submitThesis = () => {
    if (!thesisName.trim()) {
      setThesisFormError("Please enter a thesis name.");
      return;
    }
    if (!thesisInvestmentView.trim()) {
      setThesisFormError("Please enter the investment view.");
      return;
    }

    const newThesis: Thesis = {
      id: typeof crypto !== "undefined" && crypto.randomUUID
        ? crypto.randomUUID()
        : `${Date.now()}`,
      name: thesisName.trim(),
      investmentView: thesisInvestmentView.trim(),
      conviction: thesisConviction,
      timeHorizon: thesisTimeHorizon,
      status: thesisStatus,
      linkedResearch: thesisLinkedResearch,
      rationale: thesisRationale.trim(),
      catalysts: thesisCatalysts.trim(),
      keyRisks: thesisRisks.trim(),
      createdAt: new Date().toISOString(),
    };

    saveTheses([newThesis, ...theses]);
    setShowThesisModal(false);
    setActiveTab("thesis");
  };

  const exportAudit = () => {
    const rows = researchItems.map((item) => ({
      title: item.title,
      type: item.type || "",
      author:
        item.author ||
        item.last_updated_by ||
        "",
      created_at: item.created_at || "",
      updated_at: item.updated_at || "",
    }));

    const blob = new Blob(
      [JSON.stringify(rows, null, 2)],
      { type: "application/json" }
    );

    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");

    anchor.href = url;
    anchor.download = "strawfi-research-audit.json";

    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();

    URL.revokeObjectURL(url);
  };

  const pageClasses =
    theme === "dark"
      ? "bg-slate-950 text-slate-100"
      : "bg-slate-50 text-slate-900";

  const cardClasses =
    theme === "dark"
      ? "bg-slate-900 border-slate-800"
      : "bg-white border-slate-200";

  const inputClasses =
    theme === "dark"
      ? "bg-slate-900 border-slate-700 text-white placeholder-slate-500"
      : "bg-white border-slate-300 text-slate-900 placeholder-slate-400";

  const mutedClasses =
    theme === "dark"
      ? "text-slate-400"
      : "text-slate-500";

  const navButton = (tab: string, icon: React.ReactNode, label: string) => (
    <button
      type="button"
      onClick={() => setActiveTab(tab)}
      className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left transition ${
        activeTab === tab
          ? "bg-blue-600 text-white"
          : "text-slate-300 hover:bg-slate-800"
      }`}
    >
      {icon}
      <span>{label}</span>
    </button>
  );

  const renderDashboard = () => (
    <div className="space-y-6">
      {error && !/team session|forbidden|unauthorized|401|403/i.test(error) && (
        <div
          className={`rounded-xl border p-4 ${
            theme === "dark"
              ? "border-amber-900 bg-amber-950/30 text-amber-300"
              : "border-amber-200 bg-amber-50 text-amber-800"
          }`}
        >
          <p className="text-sm font-medium">{error}</p>
          <button
            type="button"
            onClick={() => fetchResearchItems()}
            className="mt-2 text-sm font-semibold underline"
          >
            Try again
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <div className="rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-blue-100">
                Total Research Items
              </p>
              <p className="mt-1 text-3xl font-bold">
                {isLoading ? "—" : researchItems.length}
              </p>
            </div>
            <Brain size={32} />
          </div>
        </div>

        <div className="rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-emerald-100">
                Updated This Week
              </p>
              <p className="mt-1 text-3xl font-bold">
                {recentResearchCount}
              </p>
            </div>
            <Activity size={32} />
          </div>
        </div>

        <div className="rounded-xl bg-gradient-to-r from-purple-500 to-purple-600 p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-purple-100">
                Investment Theses
              </p>
              <p className="mt-1 text-3xl font-bold">
                {theses.length}
              </p>
            </div>
            <Target size={32} />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div
          className={`lg:col-span-2 rounded-xl border p-6 shadow-sm ${cardClasses}`}
        >
          <div className="mb-4 flex items-center justify-between">
            <h3 className="flex items-center text-lg font-semibold">
              <Activity
                className="mr-2 text-blue-600"
                size={20}
              />
              Recent Activity
            </h3>

            <span className="flex items-center gap-1 text-xs text-emerald-600">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              Live
            </span>
          </div>

          {latestResearch.length === 0 ? (
            <div
              className={`rounded-lg p-8 text-center ${
                theme === "dark"
                  ? "bg-slate-800"
                  : "bg-slate-50"
              }`}
            >
              <FileText
                size={32}
                className="mx-auto text-slate-400"
              />

              <p className="mt-3 font-medium">
                No research activity yet
              </p>

              <p className={`mt-1 text-sm ${mutedClasses}`}>
                Research created by your team will
                appear here automatically.
              </p>

              <button
                type="button"
                onClick={() => setShowCreateModal(true)}
                className="mt-4 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
              >
                Create Research
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {latestResearch.map((item) => {
                const isUnread = unreadResearchIds.has(
                  String(item.id)
                );

                return (
                  <button
                    type="button"
                    key={item.id}
                    onClick={() => openResearch(item.title)}
                    className={`w-full rounded-lg border p-3 text-left transition ${
                      isUnread
                        ? "border-blue-200 bg-blue-50"
                        : theme === "dark"
                        ? "border-slate-800 bg-slate-800 hover:bg-slate-700"
                        : "border-slate-200 bg-slate-50 hover:bg-slate-100"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <span
                        className={`mt-2 h-2 w-2 shrink-0 rounded-full ${
                          isUnread ? "bg-blue-600" : "bg-slate-300"
                        }`}
                      />

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <p className="truncate font-medium">
                            {item.title}
                          </p>

                          {isUnread && (
                            <span className="rounded bg-blue-600 px-1.5 py-0.5 text-[10px] text-white">
                              NEW
                            </span>
                          )}
                        </div>

                        <div
                          className={`mt-1 flex flex-wrap items-center gap-2 text-xs ${mutedClasses}`}
                        >
                          <span>{getActivityLabel(item)}</span>
                          <span>•</span>
                          <span>
                            {formatRelativeTime(
                              item.updated_at || item.created_at
                            )}
                          </span>

                          {item.type && (
                            <>
                              <span>•</span>
                              <span>{item.type}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div className="space-y-6">
          {showAIInsights && (
            <div
              className={`rounded-xl border p-6 shadow-sm ${cardClasses}`}
            >
              <h3 className="mb-4 flex items-center text-lg font-semibold">
                <Lightbulb
                  className="mr-2 text-yellow-500"
                  size={20}
                />
                AI Insights
              </h3>

              <div className="space-y-3">
                {repositoryInsights.map((insight, index) => (
                  <button
                    type="button"
                    key={index}
                    onClick={() => {
                      setNotificationsOpen(true);
                      setSettingsOpen(false);
                    }}
                    className={`w-full rounded-lg border p-3 text-left ${
                      theme === "dark"
                        ? "border-violet-900 bg-violet-950/40 hover:bg-violet-950/70"
                        : "border-violet-100 bg-violet-50 hover:bg-violet-100"
                    }`}
                  >
                    <p
                      className={`text-sm ${
                        theme === "dark"
                          ? "text-violet-200"
                          : "text-violet-800"
                      }`}
                    >
                      {insight}
                    </p>
                  </button>
                ))}
              </div>
            </div>
          )}

          <div
            className={`rounded-xl border p-6 shadow-sm ${cardClasses}`}
          >
            <h3 className="mb-4 text-lg font-semibold">
              Quick Actions
            </h3>

            <div className="space-y-2">
              <button
                type="button"
                onClick={() => setShowCreateModal(true)}
                className="flex w-full items-center gap-2 rounded-lg p-3 text-left hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <Plus size={17} className="text-blue-600" />
                New Research Note
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("collaboration")}
                className="flex w-full items-center gap-2 rounded-lg p-3 text-left hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <Users size={17} className="text-emerald-600" />
                Open Collaboration
              </button>

              <button
                type="button"
                onClick={createThesis}
                className="flex w-full items-center gap-2 rounded-lg p-3 text-left hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <Target size={17} className="text-violet-600" />
                Create Investment Thesis
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

 const renderCollaboration = () => (
   <div className="space-y-6">
     <div className={`rounded-2xl border p-6 shadow-sm ${cardClasses}`}>
       <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
         <div>
           <div className="flex items-center gap-3">
             <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${theme === "dark" ? "bg-green-950" : "bg-emerald-50"}`}>
               <Users size={21} className="text-emerald-600" />
             </div>
             <div>
               <h2 className="text-xl font-bold">Collaborative Intelligence</h2>
               <p className={`mt-1 text-sm ${mutedClasses}`}>
                 Start a live research session and see your teammates working in real time.
               </p>
             </div>
           </div>
         </div>

         <span className={`inline-flex w-fit items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold ${wsStatus === "connected" ? "bg-emerald-50 text-emerald-700" : wsStatus === "connecting" ? "bg-amber-100 text-amber-700" : "bg-slate-100 text-slate-600"}`}>
           <span className={`h-2 w-2 rounded-full ${wsStatus === "connected" ? "bg-emerald-500" : wsStatus === "connecting" ? "bg-amber-500" : "bg-slate-400"}`} />
           {wsStatus === "connected" ? "Live" : wsStatus === "connecting" ? "Connecting" : "Offline"}
         </span>
       </div>

       {wsStatus === "offline" && (
         <div className={`mt-4 rounded-lg border p-3 text-sm ${theme === "dark" ? "border-amber-900 bg-amber-950/30 text-amber-300" : "border-amber-200 bg-amber-50 text-amber-800"}`}>
           Live collaboration is temporarily unavailable. Your research data remains accessible.
         </div>
       )}
     </div>

     <div className={`rounded-2xl border p-6 shadow-sm ${cardClasses}`}>
       <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
         <div className="max-w-2xl">
           <div className="flex items-center gap-2">
             <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
               <Users size={18} />
             </span>
             <h3 className="text-lg font-semibold">Start a collaboration session</h3>
           </div>
           <p className={`mt-2 text-sm leading-6 ${mutedClasses}`}>
             Choose a research item and start a live editing session. Everyone on your team will see the active session automatically.
           </p>
         </div>

         <div className="flex w-full flex-col gap-3 lg:w-[430px]">
           <select
             value={collaborationResearchId || ""}
             onChange={(event) => setCollaborationResearchId(event.target.value || null)}
             className={`w-full rounded-lg border p-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 ${inputClasses}`}
           >
             <option value="">Choose research to collaborate on</option>
             {sortedResearch.map((research) => (
               <option key={research.id} value={String(research.id)}>
                 {research.title}
               </option>
             ))}
           </select>

           <button
             type="button"
             disabled={!collaborationResearchId || wsStatus !== "connected"}
             onClick={() => {
               const research = researchItems.find(
                 (item) => String(item.id) === String(collaborationResearchId)
               );
               if (research) handleStartCollaboration(research);
             }}
             className="inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
           >
             <Users size={16} />
             Start Collaboration
           </button>
         </div>
       </div>

       {researchItems.length === 0 && (
         <div className={`mt-4 rounded-lg border p-3 text-sm ${theme === "dark" ? "border-slate-700 bg-slate-800/60" : "border-slate-200 bg-slate-50"}`}>
           Create or load a research item first, then it will appear in the collaboration picker.
         </div>
       )}
     </div>

     {currentCollaborationResearch && (
       <div className={`rounded-2xl border p-6 shadow-sm ${theme === "dark" ? "border-emerald-900 bg-emerald-950/20" : "border-emerald-200 bg-emerald-50"}`}>
         <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
           <div>
             <p className="text-xs font-bold uppercase tracking-wide text-emerald-700">Live Collaboration</p>
             <h3 className="mt-1 text-xl font-bold">{currentCollaborationResearch.title}</h3>
             <p className={`mt-1 text-sm ${mutedClasses}`}>You are currently collaborating on this research.</p>
           </div>
           <div className="flex flex-wrap items-center gap-2">
             <button type="button" onClick={() => openResearch(currentCollaborationResearch.title)} className="rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700">Open Research</button>
             <button type="button" onClick={handleLeaveCollaboration} className="rounded-lg border border-red-300 px-4 py-2.5 text-sm font-semibold text-red-600 hover:bg-red-50">Leave Session</button>
           </div>
         </div>
       </div>
     )}

     <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
       <div className={`rounded-xl border p-5 shadow-sm ${cardClasses}`}>
         <div className="flex items-center justify-between"><div><p className={`text-sm ${mutedClasses}`}>Active research sessions</p><p className="mt-1 text-3xl font-bold">{activeCollaborationCount}</p></div><div className="rounded-lg bg-emerald-50 p-2"><Activity size={20} className="text-emerald-600" /></div></div>
         <p className={`mt-2 text-xs ${mutedClasses}`}>Research currently being edited</p>
       </div>
       <div className={`rounded-xl border p-5 shadow-sm ${cardClasses}`}>
         <div className="flex items-center justify-between"><div><p className={`text-sm ${mutedClasses}`}>Active collaborators</p><p className="mt-1 text-3xl font-bold">{activeEditorNames.length}</p></div><div className="rounded-lg bg-blue-100 p-2"><Users size={20} className="text-blue-600" /></div></div>
         <p className={`mt-2 text-xs ${mutedClasses}`}>Team members currently editing</p>
       </div>
       <div className={`rounded-xl border p-5 shadow-sm ${cardClasses}`}>
         <div className="flex items-center justify-between"><div><p className={`text-sm ${mutedClasses}`}>Repository research</p><p className="mt-1 text-3xl font-bold">{researchItems.length}</p></div><div className="rounded-lg bg-violet-100 p-2"><Brain size={20} className="text-violet-600" /></div></div>
         <p className={`mt-2 text-xs ${mutedClasses}`}>Available to the team</p>
       </div>
     </div>

     <div className={`rounded-2xl border p-6 shadow-sm ${cardClasses}`}>
       <div className="mb-5 flex items-center justify-between">
         <div><h3 className="text-lg font-semibold">Currently active sessions</h3><p className={`mt-1 text-sm ${mutedClasses}`}>Anyone collaborating on a research item appears here live.</p></div>
         {activeCollaborationResearch.length > 0 && <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">{activeCollaborationResearch.length} active</span>}
       </div>

       {activeCollaborationResearch.length === 0 ? (
         <div className={`rounded-xl border border-dashed p-10 text-center ${theme === "dark" ? "border-slate-700 bg-slate-800/50" : "border-slate-300 bg-slate-50"}`}>
           <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50"><Users size={24} className="text-emerald-600" /></div>
           <p className="mt-4 font-semibold">No active editing sessions</p>
           <p className={`mx-auto mt-2 max-w-md text-sm ${mutedClasses}`}>Pick a research item above and press Start Collaboration to begin a live session.</p>
         </div>
       ) : (
         <div className="space-y-3">
           {activeCollaborationResearch.map(({ research, editors }) => {
             if (!research) return null;
             const currentTeamName = localStorage.getItem("team_name") || "Team Member";
             return (
               <div key={research.id} className={`rounded-xl border p-4 ${theme === "dark" ? "border-slate-800 bg-slate-800/70" : "border-slate-200 bg-slate-50"}`}>
                 <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                   <button type="button" onClick={() => openResearch(research.title)} className="min-w-0 flex-1 text-left">
                     <div className="flex items-start gap-3">
                       <div className="mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-50"><FileText size={18} className="text-emerald-600" /></div>
                       <div className="min-w-0"><p className="truncate font-semibold">{research.title}</p><p className={`mt-1 text-sm ${mutedClasses}`}>{research.type || "Research"} • {editors.length} collaborator{editors.length === 1 ? "" : "s"} editing</p></div>
                     </div>
                   </button>
                   <div className="flex flex-wrap items-center gap-2">
                     {editors.map((editor) => <span key={editor} className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-700"><span className="h-2 w-2 rounded-full bg-emerald-500" />{editor === currentTeamName ? `${editor} (You)` : editor}</span>)}
                     <span className="rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700">Live</span>
                   </div>
                 </div>
               </div>
             );
           })}
         </div>
       )}
     </div>

     <div className={`rounded-xl border p-5 ${cardClasses}`}>
       <div className="flex gap-3"><Lightbulb size={19} className="mt-0.5 shrink-0 text-yellow-500" /><div><p className="font-medium">How live collaboration works</p><p className={`mt-1 text-sm leading-6 ${mutedClasses}`}>Choose a research item and start a session. StrawFi broadcasts the active editor list to connected teammates, so everyone can see who is working on the same research in real time. Use Leave Session when you are finished.</p></div></div>
     </div>
   </div>
 );

  const renderSmartSearch = () => (
    <div className="space-y-6">
      <div className={`rounded-xl border p-6 shadow-sm ${cardClasses}`}>
        <div className="flex gap-3">
          <div className="relative flex-1">
            <Search
              className={`absolute left-3 top-1/2 -translate-y-1/2 ${mutedClasses}`}
              size={20}
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(event) =>
                setSearchQuery(event.target.value)
              }
              placeholder="Search your team's research..."
              className={`w-full rounded-lg border py-3 pl-10 pr-4 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 ${inputClasses}`}
            />
          </div>

          <button
            type="button"
            onClick={() =>
              setSearchQuery(searchQuery.trim())
            }
            className="rounded-lg bg-blue-600 px-6 font-medium text-white hover:bg-blue-700"
          >
            Search
          </button>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {["Developer", "India", "Fintech", "AI", "Market"].map(
            (query) => (
              <button
                type="button"
                key={query}
                onClick={() => setSearchQuery(query)}
                className={`rounded-full px-3 py-1 text-sm ${
                  theme === "dark"
                    ? "bg-slate-800 hover:bg-slate-700"
                    : "bg-slate-100 hover:bg-slate-200"
                }`}
              >
                {query}
              </button>
            )
          )}
        </div>
      </div>

      <div className={`rounded-xl border p-6 shadow-sm ${cardClasses}`}>
        <div className="mb-5 flex items-center justify-between">
          <h3 className="text-lg font-semibold">
            Search Results
          </h3>
          <span className={`text-sm ${mutedClasses}`}>
            {filteredResearch.length} result
            {filteredResearch.length === 1 ? "" : "s"}
          </span>
        </div>

        {filteredResearch.length === 0 ? (
          <div
            className={`rounded-lg p-10 text-center ${
              theme === "dark" ? "bg-slate-800" : "bg-slate-50"
            }`}
          >
            <Search
              size={32}
              className="mx-auto text-slate-400"
            />
            <p className="mt-3 font-medium">
              No matching research found.
            </p>
            <p className={`mt-1 text-sm ${mutedClasses}`}>
              Try another title, tag, or keyword.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredResearch.map((item) => (
              <button
                type="button"
                key={item.id}
                onClick={() => openResearch(item.title)}
                className={`w-full rounded-lg border p-4 text-left transition ${
                  theme === "dark"
                    ? "border-slate-800 hover:bg-slate-800"
                    : "border-slate-200 hover:bg-slate-50"
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <h4 className="font-semibold">
                      {item.title}
                    </h4>
                    <p className={`mt-1 text-sm ${mutedClasses}`}>
                      {item.type || "Research"}
                    </p>
                    <p
                      className={`mt-2 line-clamp-3 text-sm ${mutedClasses}`}
                    >
                      {(item.content || "")
                        .replace(/<[^>]*>/g, " ")
                        .trim()}
                    </p>

                    {item.tags?.length ? (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {item.tags.slice(0, 6).map((tag) => (
                          <span
                            key={tag}
                            className={`rounded px-2 py-1 text-xs ${
                              theme === "dark"
                                ? "bg-slate-800"
                                : "bg-slate-100"
                            }`}
                          >
                            #{tag}
                          </span>
                        ))}
                      </div>
                    ) : null}
                  </div>

                  <Eye
                    size={18}
                    className="shrink-0 text-slate-400"
                  />
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      <div className={`rounded-xl border p-5 shadow-sm ${cardClasses}`}>
        <div className="mb-3 flex items-center gap-2">
          <Filter
            size={17}
            className="text-blue-600"
          />
          <h4 className="font-semibold">
            Research Type
          </h4>
        </div>

        <select
          value={selectedType}
          onChange={(event) =>
            setSelectedType(event.target.value)
          }
          className={`w-full rounded-lg border p-2 ${
            theme === "dark"
              ? "border-slate-700 bg-slate-800 text-white"
              : "border-slate-300 bg-white"
          }`}
        >
          {RESEARCH_TYPES.map((type) => (
            <option key={type} value={type}>
              {type}
            </option>
          ))}
        </select>
      </div>
    </div>
  );

  const renderInvestmentThesis = () => (
    <div className="space-y-6">
      <div className={`rounded-xl border p-6 shadow-sm ${cardClasses}`}>
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold">
              Investment Thesis
            </h2>
            <p className={`mt-1 text-sm ${mutedClasses}`}>
              Turn repository research into structured investment hypotheses.
            </p>
          </div>

          <button
            type="button"
            onClick={createThesis}
            className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            <Plus size={16} />
            New Thesis
          </button>
        </div>
      </div>

      {theses.length === 0 ? (
        <div
          className={`rounded-xl border p-10 text-center shadow-sm ${cardClasses}`}
        >
          <Target
            size={42}
            className="mx-auto text-slate-400"
          />

          <h3 className="mt-4 font-semibold">
            No investment thesis yet
          </h3>

          <p className={`mt-2 text-sm ${mutedClasses}`}>
            Create a thesis from the latest research in your repository.
          </p>

          <button
            type="button"
            onClick={createThesis}
            className="mt-5 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            Create Thesis
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {theses.map((thesis) => (
            <div
              key={thesis.id}
              className={`rounded-xl border p-6 shadow-sm ${cardClasses}`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <h3 className="text-lg font-semibold">
                    {thesis.name}
                  </h3>

                  <div className="mt-2 flex flex-wrap gap-2">
                    <span className="inline-flex rounded-full bg-blue-100 px-2 py-1 text-xs font-medium text-blue-800">
                      {thesis.status}
                    </span>
                    <span className="inline-flex rounded-full bg-violet-100 px-2 py-1 text-xs font-medium text-violet-800">
                      {thesis.conviction || "Medium"} conviction
                    </span>
                    <span className="inline-flex rounded-full bg-slate-100 px-2 py-1 text-xs font-medium text-slate-700">
                      {thesis.timeHorizon || "Long Term"}
                    </span>
                  </div>
                </div>

                <Target className="shrink-0 text-violet-600" />
              </div>

              <div className="mt-5 space-y-4">
                <div>
                  <p className="text-sm font-semibold">Investment View</p>
                  <p className={`mt-1 text-sm leading-6 ${mutedClasses}`}>
                    {thesis.investmentView || "No investment view provided."}
                  </p>
                </div>

                <div>
                  <p className="text-sm font-semibold">Supporting Research</p>
                  {thesis.linkedResearch?.length ? (
                    <div className="mt-2 space-y-2">
                      {thesis.linkedResearch.map((title) => (
                        <button
                          type="button"
                          key={title}
                          onClick={() => openResearch(title)}
                          className={`w-full rounded-lg p-3 text-left text-sm ${
                            theme === "dark"
                              ? "bg-slate-800 hover:bg-slate-700"
                              : "bg-slate-50 hover:bg-slate-100"
                          }`}
                        >
                          {title}
                        </button>
                      ))}
                    </div>
                  ) : (
                    <p className={`mt-2 text-sm ${mutedClasses}`}>No research linked.</p>
                  )}
                </div>

                {thesis.rationale && (
                  <div>
                    <p className="text-sm font-semibold">Rationale</p>
                    <p className={`mt-1 text-sm leading-6 ${mutedClasses}`}>
                      {thesis.rationale}
                    </p>
                  </div>
                )}

                {thesis.catalysts && (
                  <div>
                    <p className="text-sm font-semibold">Catalysts</p>
                    <p className={`mt-1 text-sm leading-6 ${mutedClasses}`}>
                      {thesis.catalysts}
                    </p>
                  </div>
                )}

                {thesis.keyRisks && (
                  <div>
                    <p className="text-sm font-semibold">Key Risks</p>
                    <p className={`mt-1 text-sm leading-6 ${mutedClasses}`}>
                      {thesis.keyRisks}
                    </p>
                  </div>
                )}
              </div>

              <div className="mt-5 flex items-center justify-between border-t border-slate-200 pt-4 dark:border-slate-800">
                <span className={`text-xs ${mutedClasses}`}>
                  Created{" "}
                  {new Date(
                    thesis.createdAt
                  ).toLocaleDateString()}
                </span>

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() =>
                      setActiveTab("retrieval")
                    }
                    className="text-xs font-medium text-blue-600 hover:text-blue-800"
                  >
                    Find Supporting Research
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      saveTheses(
                        theses.filter(
                          (item) =>
                            item.id !== thesis.id
                        )
                      )
                    }
                    className="text-xs font-medium text-red-500 hover:text-red-700"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div
        className={`rounded-xl border p-6 shadow-sm ${cardClasses}`}
      >
        <div className="mb-4 flex items-center gap-2">
          <Brain
            size={19}
            className="text-blue-600"
          />
          <h3 className="font-semibold">
            Thesis Building Blocks
          </h3>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="rounded-lg bg-blue-50 p-4">
            <p className="text-sm font-medium text-blue-800">
              Research Base
            </p>
            <p className="mt-1 text-2xl font-bold text-blue-900">
              {researchItems.length}
            </p>
          </div>

          <div className="rounded-lg bg-violet-50 p-4">
            <p className="text-sm font-medium text-violet-800">
              Saved Theses
            </p>
            <p className="mt-1 text-2xl font-bold text-violet-900">
              {theses.length}
            </p>
          </div>

          <div className="rounded-lg bg-amber-50 p-4">
            <p className="text-sm font-medium text-amber-800">
              Research to Review
            </p>
            <p className="mt-1 text-2xl font-bold text-amber-900">
              {staleResearchCount}
            </p>
          </div>
        </div>
      </div>
    </div>
  );

  const renderDecisionAudit = () => (
    <div className="space-y-6">
      <div
        className={`rounded-xl border p-6 shadow-sm ${cardClasses}`}
      >
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold">
              Decision Audit
            </h2>

            <p className={`mt-1 text-sm ${mutedClasses}`}>
              Repository activity only. No fake investment decisions are
              shown.
            </p>
          </div>

          <button
            type="button"
            onClick={exportAudit}
            className="flex items-center gap-2 rounded-lg bg-slate-700 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
          >
            <Download size={16} />
            Export Audit
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div
          className={`rounded-xl border p-5 ${cardClasses}`}
        >
          <p className={`text-sm ${mutedClasses}`}>
            Research Events
          </p>
          <p className="mt-1 text-2xl font-bold">
            {researchItems.length}
          </p>
        </div>

        <div
          className={`rounded-xl border p-5 ${cardClasses}`}
        >
          <p className={`text-sm ${mutedClasses}`}>
            Updated This Week
          </p>
          <p className="mt-1 text-2xl font-bold text-blue-600">
            {recentResearchCount}
          </p>
        </div>

        <div
          className={`rounded-xl border p-5 ${cardClasses}`}
        >
          <p className={`text-sm ${mutedClasses}`}>
            Needs Review
          </p>
          <p className="mt-1 text-2xl font-bold text-amber-600">
            {staleResearchCount}
          </p>
        </div>
      </div>

      <div
        className={`rounded-xl border p-6 shadow-sm ${cardClasses}`}
      >
        {sortedResearch.length === 0 ? (
          <div className="py-10 text-center">
            <FileText
              size={36}
              className="mx-auto text-slate-400"
            />
            <p className="mt-3 font-medium">
              No research events yet.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {sortedResearch.map((item) => (
              <div
                key={item.id}
                className={`rounded-lg border p-4 ${
                  theme === "dark"
                    ? "border-slate-800"
                    : "border-slate-200"
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <CheckCircle
                        size={18}
                        className="text-blue-600"
                      />
                      <h4 className="font-semibold">
                        {getActivityLabel(item)}
                      </h4>
                    </div>

                    <p className="mt-2">
                      {item.title}
                    </p>

                    <p
                      className={`mt-1 text-sm ${mutedClasses}`}
                    >
                      {item.type || "Research"}
                    </p>
                  </div>

                  <div className="text-right">
                    <p
                      className={`text-xs ${mutedClasses}`}
                    >
                      {formatRelativeTime(
                        item.updated_at ||
                          item.created_at
                      )}
                    </p>
                    <p
                      className={`mt-1 text-xs ${mutedClasses}`}
                    >
                      {item.author ||
                        item.last_updated_by ||
                        "Team"}
                    </p>
                  </div>
                </div>

                <div className="mt-3 border-t border-slate-200 pt-3 dark:border-slate-800">
                  <div className="flex flex-wrap gap-4">
                    <button
                      type="button"
                      onClick={() => openResearch(item.title)}
                      className="text-xs font-medium text-blue-600 hover:text-blue-800"
                    >
                      View in Smart Search
                    </button>
                    <button
                      type="button"
                      onClick={() => openVersionHistory(item)}
                      className="text-xs font-medium text-violet-600 hover:text-violet-800"
                    >
                      View Version History
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div
      className={`min-h-screen transition-colors duration-200 ${pageClasses}`}
    >
      {/* SIDEBAR */}
      <aside className="fixed left-0 top-0 z-40 flex h-screen w-64 flex-col bg-slate-900 text-white">
        <div className="border-b border-slate-700 p-6">
          <h1 className="text-xl font-bold text-blue-400">
            InvestIQ
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            Financial Intelligence
          </p>
        </div>

        <nav className="flex-1 space-y-2 overflow-y-auto p-4">
          {navButton(
            "dashboard",
            <BarChart3 size={20} />,
            "Dashboard"
          )}

          <Link
            href="/research-memory"
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-slate-300 transition hover:bg-slate-800"
          >
            <Brain size={20} />
            <span>Research Memory</span>
          </Link>

          {navButton(
            "collaboration",
            <Users size={20} />,
            "Collaboration"
          )}

          {navButton(
            "retrieval",
            <Search size={20} />,
            "Smart Search"
          )}

          {navButton(
            "thesis",
            <Target size={20} />,
            "Investment Thesis"
          )}

          {navButton(
            "audit",
            <FileText size={20} />,
            "Decision Audit"
          )}
        </nav>

        <div className="border-t border-slate-700 p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-r from-blue-500 to-purple-600">
              <span className="text-sm font-medium">
                {userInitials}
              </span>
            </div>

            <div className="min-w-0">
              <p className="truncate text-sm font-medium">
                {userName}
              </p>
              <p className="truncate text-xs text-slate-400">
                {userRole}
              </p>
            </div>
          </div>
        </div>
      </aside>

      {/* HEADER — INLINE JSX, NOT A NESTED COMPONENT.
          This is what keeps the search input mounted while typing. */}
      <header
        className={`sticky top-0 z-30 ml-64 border-b p-4 ${
          theme === "dark"
            ? "border-slate-800 bg-slate-900"
            : "border-slate-200 bg-white"
        }`}
      >
        <div className="flex items-center justify-between gap-4">
          <h2
            className={`text-2xl font-bold ${
              theme === "dark"
                ? "text-white"
                : "text-slate-800"
            }`}
          >
            {activeTab === "dashboard" &&
              "Financial Intelligence Dashboard"}
            {activeTab === "collaboration" &&
              "Collaborative Intelligence"}
            {activeTab === "retrieval" &&
              "Smart Search"}
            {activeTab === "thesis" &&
              "Investment Thesis"}
            {activeTab === "audit" &&
              "Decision Audit"}
          </h2>

          <div className="flex items-center gap-2">
            {/* SEARCH */}
            <form
              onSubmit={(event) => {
                event.preventDefault();
                setActiveTab("retrieval");
              }}
              className="relative"
            >
              <Search
                className={`absolute left-3 top-1/2 -translate-y-1/2 ${mutedClasses}`}
                size={18}
              />

              <input
                type="text"
                value={searchQuery}
                onChange={(event) =>
                  setSearchQuery(event.target.value)
                }
                placeholder="Search your research..."
                className={`w-72 rounded-lg border py-2 pl-10 pr-10 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 ${inputClasses}`}
              />

              {searchQuery.trim() && (
                <button
                  type="submit"
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-blue-600 hover:bg-blue-50 dark:hover:bg-slate-800"
                  title="Search"
                >
                  <Search size={16} />
                </button>
              )}
            </form>

            {/* NOTIFICATIONS */}
            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  setNotificationsOpen(
                    (value) => !value
                  );
                  setSettingsOpen(false);
                }}
                className={`relative rounded-lg p-2 transition ${
                  theme === "dark"
                    ? "hover:bg-slate-800"
                    : "hover:bg-slate-100"
                }`}
                title="Notifications"
              >
                <Bell
                  size={22}
                  className={
                    theme === "dark"
                      ? "text-slate-300"
                      : "text-slate-600"
                  }
                />

                {unreadNotificationCount > 0 && (
                  <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
                    {unreadNotificationCount}
                  </span>
                )}
              </button>

              {notificationsOpen && (
                <div
                  className={`absolute right-0 top-12 z-50 w-[420px] overflow-hidden rounded-xl border shadow-2xl ${
                    theme === "dark"
                      ? "border-slate-700 bg-slate-900"
                      : "border-slate-200 bg-white"
                  }`}
                >
                  <div
                    className={`flex items-center justify-between border-b p-4 ${
                      theme === "dark"
                        ? "border-slate-700"
                        : "border-slate-200"
                    }`}
                  >
                    <div>
                      <h3 className="font-semibold">
                        Notifications
                      </h3>
                      <p
                        className={`mt-1 text-xs ${mutedClasses}`}
                      >
                        Research activity and AI insights
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        setUnreadResearchIds(
                          new Set()
                        )
                      }
                      className="text-xs font-medium text-blue-600 hover:text-blue-800"
                    >
                      Mark all read
                    </button>
                  </div>

                  <div className="max-h-[70vh] overflow-y-auto">
                    <div
                      className={`border-b p-4 ${
                        theme === "dark"
                          ? "border-slate-800"
                          : "border-slate-200"
                      }`}
                    >
                      <div className="mb-3 flex items-center justify-between">
                        <h4 className="text-sm font-semibold">
                          Research Activity
                        </h4>
                        <span
                          className={`text-xs ${mutedClasses}`}
                        >
                          {notificationResearch.length} recent
                        </span>
                      </div>

                      {notificationResearch.length === 0 ? (
                        <div className="rounded-lg bg-slate-50 p-5 text-center dark:bg-slate-800">
                          <FileText
                            size={24}
                            className="mx-auto text-slate-400"
                          />
                          <p
                            className={`mt-2 text-sm ${mutedClasses}`}
                          >
                            No research activity yet.
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {notificationResearch.map((item) => {
                            const id = String(item.id);
                            const unread =
                              unreadResearchIds.has(id);

                            return (
                              <button
                                type="button"
                                key={item.id}
                                onClick={() =>
                                  openResearch(item.title)
                                }
                                className={`w-full rounded-lg p-3 text-left transition ${
                                  unread
                                    ? "border border-blue-200 bg-blue-50"
                                    : theme ===
                                      "dark"
                                    ? "bg-slate-800 hover:bg-slate-700"
                                    : "bg-slate-50 hover:bg-slate-100"
                                }`}
                              >
                                <div className="flex gap-3">
                                  <span
                                    className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${
                                      unread
                                        ? "bg-blue-600"
                                        : "bg-slate-300"
                                    }`}
                                  />

                                  <div className="min-w-0 flex-1">
                                    <div className="flex items-center gap-2">
                                      <p
                                        className={`truncate text-sm font-medium ${
                                          theme ===
                                          "dark"
                                            ? "text-white"
                                            : "text-slate-800"
                                        }`}
                                      >
                                        {item.title}
                                      </p>

                                      {unread && (
                                        <span className="rounded bg-blue-600 px-1.5 py-0.5 text-[10px] text-white">
                                          NEW
                                        </span>
                                      )}
                                    </div>

                                    <p
                                      className={`mt-1 text-xs ${mutedClasses}`}
                                    >
                                      {getActivityLabel(item)}{" "}
                                      •{" "}
                                      {formatRelativeTime(
                                        item.updated_at ||
                                          item.created_at
                                      )}
                                    </p>
                                  </div>

                                  <Eye
                                    size={15}
                                    className="mt-1 text-slate-400"
                                  />
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    {showAIInsights && (
                      <div
                        className={`border-b p-4 ${
                          theme === "dark"
                            ? "border-slate-800"
                            : "border-slate-200"
                        }`}
                      >
                        <h4 className="mb-3 text-sm font-semibold">
                          AI Insights
                        </h4>

                        <div className="space-y-2">
                          {repositoryInsights.map(
                            (insight, index) => (
                              <button
                                type="button"
                                key={index}
                                onClick={() => {
                                  setNotificationsOpen(
                                    false
                                  );
                                  setActiveTab(
                                    "dashboard"
                                  );
                                }}
                                className={`w-full rounded-lg border p-3 text-left transition ${
                                  theme ===
                                  "dark"
                                    ? "border-violet-900 bg-violet-950/40 hover:bg-violet-950/70"
                                    : "border-violet-100 bg-violet-50 hover:bg-violet-100"
                                }`}
                              >
                                <div className="flex gap-3">
                                  <Lightbulb
                                    size={17}
                                    className="mt-0.5 shrink-0 text-violet-600"
                                  />
                                  <p
                                    className={`text-sm ${
                                      theme ===
                                      "dark"
                                        ? "text-violet-200"
                                        : "text-violet-800"
                                    }`}
                                  >
                                    {insight}
                                  </p>
                                </div>
                              </button>
                            )
                          )}
                        </div>
                      </div>
                    )}

                    <div className="p-4">
                      <button
                        type="button"
                        onClick={() => {
                          setNotificationsOpen(
                            false
                          );
                          setActiveTab(
                            "dashboard"
                          );
                        }}
                        className={`w-full rounded-lg p-3 text-left transition ${
                          theme === "dark"
                            ? "bg-slate-800 hover:bg-slate-700"
                            : "bg-slate-50 hover:bg-slate-100"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <Activity
                            size={18}
                            className="text-blue-500"
                          />
                          <div>
                            <p className="text-sm font-medium">
                              Repository overview
                            </p>
                            <p
                              className={`mt-1 text-xs ${mutedClasses}`}
                            >
                              {researchItems.length} total
                              research item
                              {researchItems.length ===
                              1
                                ? ""
                                : "s"}
                              .
                            </p>
                          </div>
                        </div>
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* SETTINGS */}
            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  setSettingsOpen(
                    (value) => !value
                  );
                  setNotificationsOpen(
                    false
                  );
                }}
                className={`rounded-lg p-2 transition ${
                  theme === "dark"
                    ? "hover:bg-slate-800"
                    : "hover:bg-slate-100"
                }`}
                title="Settings"
              >
                <Settings
                  size={22}
                  className={
                    theme === "dark"
                      ? "text-slate-300"
                      : "text-slate-600"
                  }
                />
              </button>

              {settingsOpen && (
                <div
                  className={`absolute right-0 top-12 z-50 w-96 rounded-xl border shadow-2xl ${
                    theme === "dark"
                      ? "border-slate-700 bg-slate-900"
                      : "border-slate-200 bg-white"
                  }`}
                >
                  <div
                    className={`flex items-start justify-between border-b p-4 ${
                      theme === "dark"
                        ? "border-slate-700"
                        : "border-slate-200"
                    }`}
                  >
                    <div>
                      <h3 className="font-semibold">
                        StrawFi Settings
                      </h3>
                      <p
                        className={`mt-1 text-xs ${mutedClasses}`}
                      >
                        Dashboard and repository preferences
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        setSettingsOpen(
                          false
                        )
                      }
                      className="rounded p-1 hover:bg-slate-100 dark:hover:bg-slate-800"
                    >
                      <X size={16} />
                    </button>
                  </div>

                  <div className="space-y-5 p-4">
                    {/* Theme */}
                    <div>
                      <p className="text-sm font-medium">
                        Appearance
                      </p>

                      <div className="mt-2 grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() =>
                            setTheme(
                              "light"
                            )
                          }
                          className={`rounded-lg border px-3 py-2 text-sm ${
                            theme ===
                            "light"
                              ? "border-blue-500 bg-blue-50 text-blue-700"
                              : theme ===
                                "dark"
                              ? "border-slate-700 bg-slate-800 text-slate-300"
                              : "border-slate-200"
                          }`}
                        >
                          Light
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            setTheme(
                              "dark"
                            )
                          }
                          className={`rounded-lg border px-3 py-2 text-sm ${
                            theme ===
                            "dark"
                              ? "border-blue-500 bg-blue-950 text-blue-300"
                              : theme ===
                                "light"
                              ? "border-slate-200"
                              : "border-slate-700"
                          }`}
                        >
                          Dark
                        </button>
                      </div>
                    </div>

                    {/* Auto refresh */}
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium">
                          Live repository sync
                        </p>
                        <p
                          className={`mt-1 text-xs ${mutedClasses}`}
                        >
                          Detect newly created research
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() =>
                          setAutoRefresh(
                            (value) => !value
                          )
                        }
                        className={`h-6 w-11 rounded-full transition ${
                          autoRefresh
                            ? "bg-blue-600"
                            : "bg-slate-300"
                        }`}
                      >
                        <span
                          className={`block h-5 w-5 rounded-full bg-white transition-transform ${
                            autoRefresh
                              ? "translate-x-5"
                              : "translate-x-0"
                          }`}
                        />
                      </button>
                    </div>

                    {/* Refresh interval */}
                    <div>
                      <label className="text-sm font-medium">
                        Refresh interval
                      </label>

                      <select
                        value={refreshInterval}
                        onChange={(event) =>
                          setRefreshInterval(
                            Number(
                              event.target.value
                            )
                          )
                        }
                        className={`mt-2 w-full rounded-lg border p-2 text-sm ${
                          theme ===
                          "dark"
                            ? "border-slate-700 bg-slate-800 text-white"
                            : "border-slate-300 bg-white text-slate-900"
                        }`}
                      >
                        <option value={5}>
                          Every 5 seconds
                        </option>
                        <option value={10}>
                          Every 10 seconds
                        </option>
                        <option value={30}>
                          Every 30 seconds
                        </option>
                      </select>
                    </div>

                    {/* AI insights */}
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium">
                          AI Insights
                        </p>
                        <p
                          className={`mt-1 text-xs ${mutedClasses}`}
                        >
                          Show repository intelligence
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() =>
                          setShowAIInsights(
                            (value) =>
                              !value
                          )
                        }
                        className={`h-6 w-11 rounded-full transition ${
                          showAIInsights
                            ? "bg-violet-600"
                            : "bg-slate-300"
                        }`}
                      >
                        <span
                          className={`block h-5 w-5 rounded-full bg-white transition-transform ${
                            showAIInsights
                              ? "translate-x-5"
                              : "translate-x-0"
                          }`}
                        />
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        fetchResearchItems()
                      }
                      className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700"
                    >
                      <RefreshCw size={16} />
                      Refresh now
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* REFRESH */}
            <button
              type="button"
              onClick={() =>
                fetchResearchItems()
              }
              className={`rounded-lg p-2 transition ${
                theme === "dark"
                  ? "hover:bg-slate-800"
                  : "hover:bg-slate-100"
              }`}
              title="Refresh dashboard"
            >
              <RefreshCw
                size={21}
                className={
                  theme === "dark"
                    ? "text-slate-300"
                    : "text-slate-600"
                }
              />
            </button>
          </div>
        </div>
      </header>

      <main className="ml-64 p-6">
        {activeTab === "dashboard" && renderDashboard()}
        {activeTab === "collaboration" &&
          renderCollaboration()}
        {activeTab === "retrieval" &&
          renderSmartSearch()}
        {activeTab === "thesis" &&
          renderInvestmentThesis()}
        {activeTab === "audit" &&
          renderDecisionAudit()}
      </main>

      {showThesisModal && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setShowThesisModal(false);
            }
          }}
        >
          <div
            className={`max-h-[92vh] w-full max-w-4xl overflow-hidden rounded-2xl border shadow-2xl ${
              theme === "dark"
                ? "border-slate-700 bg-slate-900 text-white"
                : "border-slate-200 bg-white text-slate-900"
            }`}
            role="dialog"
            aria-modal="true"
            aria-labelledby="create-thesis-title"
          >
            <div className={`flex items-start justify-between border-b p-6 ${theme === "dark" ? "border-slate-700" : "border-slate-200"}`}>
              <div>
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-100">
                    <Target size={22} className="text-violet-600" />
                  </div>
                  <div>
                    <h2 id="create-thesis-title" className="text-xl font-bold">
                      Create Investment Thesis
                    </h2>
                    <p className={`mt-1 text-sm ${mutedClasses}`}>
                      Turn research into a structured and reviewable investment view.
                    </p>
                  </div>
                </div>
              </div>
              <button type="button" onClick={() => setShowThesisModal(false)} className="rounded-lg p-2 hover:bg-slate-100 dark:hover:bg-slate-800" aria-label="Close thesis form">
                <X size={20} />
              </button>
            </div>

            <div className="max-h-[calc(92vh-150px)] overflow-y-auto p-6">
              {thesisFormError && (
                <div className={`mb-5 rounded-lg border p-3 text-sm ${theme === "dark" ? "border-red-900 bg-red-950/30 text-red-300" : "border-red-200 bg-red-50 text-red-700"}`}>
                  {thesisFormError}
                </div>
              )}

              <div className="space-y-6">
                <div>
                  <label className="text-sm font-semibold">Thesis Name *</label>
                  <input
                    autoFocus
                    value={thesisName}
                    onChange={(event) => setThesisName(event.target.value)}
                    placeholder="e.g. India's Digital Payments Monetization"
                    className={`mt-2 w-full rounded-lg border p-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 ${inputClasses}`}
                  />
                </div>

                <div>
                  <label className="text-sm font-semibold">Investment View *</label>
                  <textarea
                    value={thesisInvestmentView}
                    onChange={(event) => setThesisInvestmentView(event.target.value)}
                    rows={4}
                    placeholder="State the core investment belief clearly."
                    className={`mt-2 w-full resize-none rounded-lg border p-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 ${inputClasses}`}
                  />
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                  <div>
                    <label className="text-sm font-semibold">Conviction</label>
                    <select value={thesisConviction} onChange={(event) => setThesisConviction(event.target.value as Thesis["conviction"])} className={`mt-2 w-full rounded-lg border p-3 ${inputClasses}`}>
                      <option value="Low">Low</option>
                      <option value="Medium">Medium</option>
                      <option value="High">High</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-sm font-semibold">Time Horizon</label>
                    <select value={thesisTimeHorizon} onChange={(event) => setThesisTimeHorizon(event.target.value as Thesis["timeHorizon"])} className={`mt-2 w-full rounded-lg border p-3 ${inputClasses}`}>
                      <option value="Short Term">Short Term</option>
                      <option value="Medium Term">Medium Term</option>
                      <option value="Long Term">Long Term</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-sm font-semibold">Status</label>
                    <select value={thesisStatus} onChange={(event) => setThesisStatus(event.target.value as Thesis["status"])} className={`mt-2 w-full rounded-lg border p-3 ${inputClasses}`}>
                      <option value="Draft">Draft</option>
                      <option value="Active">Active</option>
                      <option value="Under Review">Under Review</option>
                    </select>
                  </div>
                </div>

                <div>
                  <div className="flex items-end justify-between">
                    <div>
                      <label className="text-sm font-semibold">Supporting Research</label>
                      <p className={`mt-1 text-xs ${mutedClasses}`}>Select the actual repository evidence supporting this thesis.</p>
                    </div>
                    <span className={`text-xs ${mutedClasses}`}>{thesisLinkedResearch.length} selected</span>
                  </div>

                  <div className={`mt-3 max-h-64 space-y-2 overflow-y-auto rounded-xl border p-3 ${theme === "dark" ? "border-slate-700" : "border-slate-200"}`}>
                    {sortedResearch.length === 0 ? (
                      <p className={`p-4 text-sm ${mutedClasses}`}>No repository research is available yet.</p>
                    ) : (
                      sortedResearch.map((item) => {
                        const selected = thesisLinkedResearch.includes(item.title);
                        return (
                          <label key={item.id} className={`flex cursor-pointer items-start gap-3 rounded-lg border p-3 ${selected ? theme === "dark" ? "border-blue-700 bg-blue-950/30" : "border-blue-200 bg-blue-50" : theme === "dark" ? "border-slate-800 hover:bg-slate-800" : "border-slate-200 hover:bg-slate-50"}`}>
                            <input type="checkbox" checked={selected} onChange={() => toggleThesisResearch(item.title)} className="mt-1 h-4 w-4" />
                            <div className="min-w-0">
                              <p className="text-sm font-medium">{item.title}</p>
                              <p className={`mt-1 text-xs ${mutedClasses}`}>{item.type || "Research"} • {formatRelativeTime(item.updated_at || item.created_at)}</p>
                            </div>
                          </label>
                        );
                      })
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div>
                    <label className="text-sm font-semibold">Rationale</label>
                    <textarea value={thesisRationale} onChange={(event) => setThesisRationale(event.target.value)} rows={4} placeholder="Why is this thesis valid?" className={`mt-2 w-full resize-none rounded-lg border p-3 ${inputClasses}`} />
                  </div>
                  <div>
                    <label className="text-sm font-semibold">Catalysts</label>
                    <textarea value={thesisCatalysts} onChange={(event) => setThesisCatalysts(event.target.value)} rows={4} placeholder="What could cause the thesis to play out?" className={`mt-2 w-full resize-none rounded-lg border p-3 ${inputClasses}`} />
                  </div>
                </div>

                <div>
                  <label className="text-sm font-semibold">Key Risks</label>
                  <textarea value={thesisRisks} onChange={(event) => setThesisRisks(event.target.value)} rows={4} placeholder="What could invalidate or weaken the thesis?" className={`mt-2 w-full resize-none rounded-lg border p-3 ${inputClasses}`} />
                </div>
              </div>
            </div>

            <div className={`flex items-center justify-end gap-3 border-t p-5 ${theme === "dark" ? "border-slate-700 bg-slate-900" : "border-slate-200 bg-white"}`}>
              <button type="button" onClick={() => setShowThesisModal(false)} className={`rounded-lg border px-5 py-2.5 text-sm font-medium ${theme === "dark" ? "border-slate-700 hover:bg-slate-800" : "border-slate-300 hover:bg-slate-50"}`}>
                Cancel
              </button>
              <button type="button" onClick={submitThesis} className="rounded-lg bg-violet-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-violet-700">
                Create Thesis
              </button>
            </div>
          </div>
        </div>
      )}

      {versionModalOpen && versionResearch && (
        <div
          className="fixed inset-0 z-[90] flex items-center justify-center bg-black/60 p-4"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setVersionModalOpen(false);
            }
          }}
        >
          <div className={`w-full max-w-3xl overflow-hidden rounded-2xl border shadow-2xl ${
            theme === "dark"
              ? "border-slate-700 bg-slate-900 text-white"
              : "border-slate-200 bg-white text-slate-900"
          }`}>
            <div className={`flex items-center justify-between border-b p-5 ${
              theme === "dark" ? "border-slate-700" : "border-slate-200"
            }`}>
              <div>
                <h2 className="text-lg font-bold">Version History</h2>
                <p className={`mt-1 text-sm ${mutedClasses}`}>
                  {versionResearch.title}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setVersionModalOpen(false)}
                className="rounded-lg p-2 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X size={18} />
              </button>
            </div>

            <div className="max-h-[65vh] overflow-y-auto p-5">
              {versionsLoading ? (
                <div className="py-12 text-center">
                  <RefreshCw size={28} className="mx-auto animate-spin text-blue-600" />
                  <p className={`mt-3 text-sm ${mutedClasses}`}>Loading version history...</p>
                </div>
              ) : versionsError ? (
                <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                  {versionsError}
                </div>
              ) : versions.length === 0 ? (
                <div className={`rounded-lg p-8 text-center ${theme === "dark" ? "bg-slate-800" : "bg-slate-50"}`}>
                  <FileText size={30} className="mx-auto text-slate-400" />
                  <p className="mt-3 font-medium">No versions found</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {versions.map((version) => (
                    <div key={`${version.id}-${version.version_number ?? 0}`} className={`rounded-lg border p-4 ${theme === "dark" ? "border-slate-800" : "border-slate-200"}`}>
                      <div className="flex items-center justify-between gap-4">
                        <div>
                          <span className="rounded bg-blue-100 px-2 py-1 text-xs font-semibold text-blue-700">
                            Version {version.version_number ?? 0}
                          </span>
                          <h4 className="mt-2 font-semibold">
                            {version.title || versionResearch.title}
                          </h4>
                        </div>
                        <div className="text-right">
                          <p className={`text-xs ${mutedClasses}`}>
                            {formatRelativeTime(version.created_at)}
                          </p>
                          <p className={`mt-1 text-xs ${mutedClasses}`}>
                            {version.author || "Team"}
                          </p>
                        </div>
                      </div>
                      {version.content && (
                        <p className={`mt-3 line-clamp-4 text-sm ${mutedClasses}`}>
                          {version.content.replace(/<[^>]*>/g, " ").trim()}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <CreateResearchModal
        isOpen={showCreateModal}
        onClose={() =>
          setShowCreateModal(false)
        }
        onSuccess={async () => {
          setShowCreateModal(false);
          await fetchResearchItems();
        }}
      />
    </div>
  );
};

export default KnowledgeRepository;