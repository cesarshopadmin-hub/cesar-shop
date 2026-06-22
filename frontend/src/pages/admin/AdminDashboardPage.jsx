import { useTranslation } from "react-i18next";
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  AlertCircle,
  CheckCircle2,
  ChevronLeft,
  Loader2,
  Tags,
  User,
  X,
  XCircle,
  ShieldCheck,
  Eye,
  UserPlus,
  UserCheck,
  UserX,
  Trash2,
  Search,
  PlusCircle,
} from "lucide-react";
import { toast } from "react-toastify";
import api from "../../Services/api.js";

function AdminDashboardPage() {
  const { t, i18n } = useTranslation();
  const [activeTab, setActiveTab] = useState("pending-posts"); // "pending-posts", "users", "scammers"

  // ── Pending Posts State ──
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionLoadingId, setActionLoadingId] = useState(null);
  const [selectedPostToReject, setSelectedPostToReject] = useState(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [isRejecting, setIsRejecting] = useState(false);

  // ── Users State ──
  const [users, setUsers] = useState([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [usersError, setUsersError] = useState("");
  const [userSearch, setUserSearch] = useState("");
  const [userTypeFilter, setUserTypeFilter] = useState("all"); // "all", "user", "admin", "blocked"
  const [blockLoadingId, setBlockLoadingId] = useState(null);

  // ── Scammers State ──
  const [scammers, setScammers] = useState([]);
  const [scammersLoading, setScammersLoading] = useState(false);
  const [scammersError, setScammersError] = useState("");
  const [scammerSearch, setScammerSearch] = useState("");
  const [newScammer, setNewScammer] = useState({ name: "", phone: "", reason: "" });
  const [scammerSubmitLoading, setScammerSubmitLoading] = useState(false);
  const [scammerDeleteId, setScammerDeleteId] = useState(null);

  // ── Data Fetching ──
  const fetchPendingPosts = async () => {
    try {
      setLoading(true);
      setError("");
      const response = await api.get("/posts/pending");
      setPosts(Array.isArray(response.data) ? response.data : []);
    } catch (requestError) {
      setError(
        requestError.response?.data?.message || "تعذر تحميل المنشورات المعلقة."
      );
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      setUsersLoading(true);
      setUsersError("");
      const response = await api.get("/auth/users");
      setUsers(Array.isArray(response.data) ? response.data : []);
    } catch (requestError) {
      setUsersError(
        requestError.response?.data?.message || "تعذر تحميل قائمة المستخدمين."
      );
    } finally {
      setUsersLoading(false);
    }
  };

  const fetchScammers = async () => {
    try {
      setScammersLoading(true);
      setScammersError("");
      const response = await api.get("/scammers");
      setScammers(Array.isArray(response.data) ? response.data : []);
    } catch (requestError) {
      setScammersError(
        requestError.response?.data?.message || "تعذر تحميل قائمة المحظورين."
      );
    } finally {
      setScammersLoading(false);
    }
  };

  useEffect(() => {
    // Fetch all datasets on mount to populate stats overview and enable instant tab switches
    fetchPendingPosts();
    fetchUsers();
    fetchScammers();
  }, []);

  // ── Pending Posts Actions ──
  const removePostFromState = (postId) => {
    setPosts((currentPosts) => currentPosts.filter((post) => post._id !== postId));
  };

  const handleApprove = async (postId) => {
    try {
      setActionLoadingId(postId);
      await api.put(`/posts/${postId}/status`, { status: "approved" });
      removePostFromState(postId);
      toast.success("تمت الموافقة على المنشور بنجاح.");
    } catch (requestError) {
      toast.error(
        requestError.response?.data?.message || "تعذر الموافقة على المنشور. حاول مرة أخرى."
      );
    } finally {
      setActionLoadingId(null);
    }
  };

  const openRejectModal = (postId) => {
    setSelectedPostToReject(postId);
    setRejectionReason("");
  };

  const closeRejectModal = () => {
    if (isRejecting) return;
    setSelectedPostToReject(null);
    setRejectionReason("");
  };

  const handleReject = async (event) => {
    event.preventDefault();
    if (!selectedPostToReject) return;

    try {
      setIsRejecting(true);
      await api.put(`/posts/${selectedPostToReject}/status`, {
        status: "rejected",
        rejectionReason: rejectionReason.trim(),
      });
      removePostFromState(selectedPostToReject);
      toast.success("تم رفض المنشور بنجاح.");
      closeRejectModal();
    } catch (requestError) {
      toast.error(
        requestError.response?.data?.message || "تعذر رفض المنشور. حاول مرة أخرى."
      );
    } finally {
      setIsRejecting(false);
    }
  };

  // ── User Management Actions ──
  const handleToggleBlock = async (userId) => {
    setBlockLoadingId(userId);
    try {
      const response = await api.put(`/auth/users/${userId}/block`);
      setUsers((prev) =>
        prev.map((u) =>
          u._id === userId ? { ...u, isBlocked: response.data.isBlocked } : u
        )
      );
      toast.success(response.data.message);
    } catch (requestError) {
      toast.error(
        requestError.response?.data?.message || "تعذر تغيير حالة الحظر للمستخدم."
      );
    } finally {
      setBlockLoadingId(null);
    }
  };

  // ── Scammers Actions ──
  const handleAddScammer = async (e) => {
    e.preventDefault();
    if (!newScammer.name.trim() || !newScammer.phone.trim() || !newScammer.reason.trim()) {
      toast.error("يرجى إدخال جميع البيانات المطلوبة للمحظور.");
      return;
    }

    setScammerSubmitLoading(true);
    try {
      const response = await api.post("/scammers", newScammer);
      setScammers((prev) => [response.data, ...prev]);
      setNewScammer({ name: "", phone: "", reason: "" });
      toast.success("تم إضافة المحظور بنجاح.");
    } catch (requestError) {
      toast.error(
        requestError.response?.data?.message || "تعذر إضافة المحظور حالياً."
      );
    } finally {
      setScammerSubmitLoading(false);
    }
  };

  const handleDeleteScammer = async (scammerId) => {
    if (!window.confirm("هل أنت متأكد من رغبتك في حذف هذا المحظور من القائمة؟")) return;

    setScammerDeleteId(scammerId);
    try {
      await api.delete(`/scammers/${scammerId}`);
      setScammers((prev) => prev.filter((s) => s._id !== scammerId));
      toast.success("تم حذف المحظور بنجاح.");
    } catch (requestError) {
      toast.error(
        requestError.response?.data?.message || "تعذر حذف المحظور حالياً."
      );
    } finally {
      setScammerDeleteId(null);
    }
  };

  // ── Filter Computations ──
  const filteredUsers = useMemo(() => {
    let result = users;

    if (userTypeFilter === "user") {
      result = result.filter((u) => u.role !== "admin");
    } else if (userTypeFilter === "admin") {
      result = result.filter((u) => u.role === "admin");
    } else if (userTypeFilter === "blocked") {
      result = result.filter((u) => u.isBlocked);
    }

    return result.filter(
      (u) =>
        u.name.toLowerCase().includes(userSearch.toLowerCase()) ||
        (u.email && u.email.toLowerCase().includes(userSearch.toLowerCase())) ||
        (u.phoneNumber && u.phoneNumber.includes(userSearch)) ||
        (u.identifier && u.identifier.toLowerCase().includes(userSearch.toLowerCase()))
    );
  }, [users, userSearch, userTypeFilter]);

  const filteredScammers = useMemo(() => {
    return scammers.filter(
      (s) =>
        s.name.toLowerCase().includes(scammerSearch.toLowerCase()) ||
        s.phone.includes(scammerSearch) ||
        s.reason.toLowerCase().includes(scammerSearch.toLowerCase())
    );
  }, [scammers, scammerSearch]);

  const selectedPost = posts.find((post) => post._id === selectedPostToReject) || null;

  return (
    <div
      dir={i18n.dir()}
      className="min-h-screen bg-cesar-darker px-4 py-8 font-cairo text-white sm:px-6 lg:px-8"
    >
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="mx-auto max-w-7xl space-y-8"
      >
        {/* Header Block */}
        <section className="relative overflow-hidden rounded-[2rem] border border-white/5 bg-cesar-dark/85 p-6 shadow-2xl shadow-black/50 backdrop-blur-md sm:p-8">
          <div className="pointer-events-none absolute inset-x-0 top-0 h-[3px] bg-gradient-to-r from-transparent via-cesar-cyan to-transparent" />
          <div className="pointer-events-none absolute -right-24 top-6 h-56 w-56 rounded-full bg-cesar-cyan/10 blur-3xl" />
          <div className="pointer-events-none absolute left-0 top-24 h-48 w-48 rounded-full bg-emerald-500/10 blur-3xl" />

          <div className="relative flex flex-col gap-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="flex items-start gap-4 text-right">
                <div className="inline-flex shrink-0 h-14 w-14 items-center justify-center rounded-2xl border border-cesar-cyan/20 bg-cesar-cyan/10 text-cesar-cyan shadow-neon-cyan">
                  <ShieldCheck className="h-7 w-7" />
                </div>
                <div>
                  <p className="text-sm text-cesar-gray">لوحة الإدارة الموحدة</p>
                  <h1 className="mt-1 text-2xl font-bold text-white md:text-3xl">
                    بوابة الإدارة والرقابة
                  </h1>
                  <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">
                    تحكم في المنشورات المعلقة، وإدارة حسابات المستخدمين وحظر المخالفين، بالإضافة إلى إدارة وتعديل قائمة المحظورين الرسمية للموقع.
                  </p>
                </div>
              </div>
              <div className="shrink-0 flex items-center gap-3">
                <Link
                  to="/admin/add-admin"
                  className="inline-flex items-center gap-2 rounded-xl border border-emerald-500/50 bg-emerald-500/10 px-5 py-3 text-sm font-bold text-emerald-400 transition duration-300 hover:bg-emerald-500/20 hover:shadow-[0_0_15px_rgba(16,185,129,0.2)]"
                >
                  <UserPlus className="h-5 w-5" />
                  إضافة مسؤول جديد
                </Link>
                <Link
                  to="/admin/settings"
                  className="inline-flex items-center gap-2 rounded-xl border border-cesar-cyan/50 bg-cesar-cyan/10 px-5 py-3 text-sm font-bold text-cesar-cyan transition duration-300 hover:bg-cesar-cyan/20 hover:shadow-neon-cyan"
                >
                  إعدادات المتجر العامة
                </Link>
              </div>
            </div>

            {/* Toggle Tabs */}
            <div className="flex flex-wrap border border-white/10 rounded-2xl p-1 bg-black/40 font-semibold text-sm max-w-xl">
              <button
                type="button"
                onClick={() => setActiveTab("pending-posts")}
                className={`flex-1 py-3 px-4 rounded-xl transition-all ${
                  activeTab === "pending-posts"
                    ? "bg-cesar-cyan/10 text-cesar-cyan border border-cesar-cyan/20"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                المنشورات المعلقة ({posts.length})
              </button>
              <button
                type="button"
                onClick={() => {
                  setActiveTab("users");
                  setUserTypeFilter("all");
                }}
                className={`flex-1 py-3 px-4 rounded-xl transition-all ${
                  activeTab === "users"
                    ? "bg-cesar-cyan/10 text-cesar-cyan border border-cesar-cyan/20"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                إدارة المستخدمين ({usersLoading ? "..." : users.length})
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("scammers")}
                className={`flex-1 py-3 px-4 rounded-xl transition-all ${
                  activeTab === "scammers"
                    ? "bg-cesar-cyan/10 text-cesar-cyan border border-cesar-cyan/20"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                قائمة المحظورين ({scammersLoading ? "..." : scammers.length})
              </button>
            </div>
          </div>
        </section>

        {/* ── Statistics Overview Cards ── */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {/* Card 1: Users */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.05 }}
            onClick={() => {
              setActiveTab("users");
              setUserTypeFilter("user");
            }}
            className={`relative overflow-hidden rounded-2xl border bg-cesar-dark/80 p-5 shadow-2xl backdrop-blur-md flex items-center justify-between group hover:border-cesar-cyan/25 cursor-pointer hover:scale-[1.02] transition-all duration-300 ${
              activeTab === "users" && userTypeFilter === "user"
                ? "border-cesar-cyan/40 shadow-[0_0_20px_rgba(0,209,255,0.15)] ring-1 ring-cesar-cyan/20"
                : "border-white/5 shadow-black/40"
            }`}
          >
            <div className="pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full bg-cesar-cyan/5 blur-xl group-hover:bg-cesar-cyan/10 transition-all duration-300" />
            <div className="space-y-1.5 text-right z-10">
              <p className="text-xs text-cesar-gray font-medium">عدد المستخدمين</p>
              <h3 className="text-2xl font-bold text-cesar-cyan font-mono leading-none">
                {usersLoading ? (
                  <Loader2 className="h-5 w-5 animate-spin inline-block" />
                ) : (
                  users.filter((u) => u.role !== "admin").length
                )}
              </h3>
            </div>
            <div className="h-12 w-12 rounded-xl bg-cesar-cyan/10 border border-cesar-cyan/20 flex items-center justify-center text-cesar-cyan shadow-[0_0_15px_rgba(0,209,255,0.15)] shrink-0 z-10 group-hover:scale-105 transition-transform duration-300">
              <User className="h-5 w-5" />
            </div>
          </motion.div>

          {/* Card 2: Admins */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
            onClick={() => {
              setActiveTab("users");
              setUserTypeFilter("admin");
            }}
            className={`relative overflow-hidden rounded-2xl border bg-cesar-dark/80 p-5 shadow-2xl backdrop-blur-md flex items-center justify-between group hover:border-emerald-500/25 cursor-pointer hover:scale-[1.02] transition-all duration-300 ${
              activeTab === "users" && userTypeFilter === "admin"
                ? "border-emerald-500/40 shadow-[0_0_20px_rgba(16,185,129,0.15)] ring-1 ring-emerald-500/20"
                : "border-white/5 shadow-black/40"
            }`}
          >
            <div className="pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full bg-emerald-500/5 blur-xl group-hover:bg-emerald-500/10 transition-all duration-300" />
            <div className="space-y-1.5 text-right z-10">
              <p className="text-xs text-cesar-gray font-medium">عدد المسؤولين</p>
              <h3 className="text-2xl font-bold text-emerald-400 font-mono leading-none">
                {usersLoading ? (
                  <Loader2 className="h-5 w-5 animate-spin inline-block" />
                ) : (
                  users.filter((u) => u.role === "admin").length
                )}
              </h3>
            </div>
            <div className="h-12 w-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.15)] shrink-0 z-10 group-hover:scale-105 transition-transform duration-300">
              <ShieldCheck className="h-5 w-5" />
            </div>
          </motion.div>

          {/* Card 3: Blocked Users */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.15 }}
            onClick={() => {
              setActiveTab("users");
              setUserTypeFilter("blocked");
            }}
            className={`relative overflow-hidden rounded-2xl border bg-cesar-dark/80 p-5 shadow-2xl backdrop-blur-md flex items-center justify-between group hover:border-red-500/25 cursor-pointer hover:scale-[1.02] transition-all duration-300 ${
              activeTab === "users" && userTypeFilter === "blocked"
                ? "border-red-500/40 shadow-[0_0_20px_rgba(239,68,68,0.15)] ring-1 ring-red-500/20"
                : "border-white/5 shadow-black/40"
            }`}
          >
            <div className="pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full bg-red-500/5 blur-xl group-hover:bg-red-500/10 transition-all duration-300" />
            <div className="space-y-1.5 text-right z-10">
              <p className="text-xs text-cesar-gray font-medium">الأعضاء المحظورين</p>
              <h3 className="text-2xl font-bold text-red-400 font-mono leading-none">
                {usersLoading ? (
                  <Loader2 className="h-5 w-5 animate-spin inline-block" />
                ) : (
                  users.filter((u) => u.isBlocked).length
                )}
              </h3>
            </div>
            <div className="h-12 w-12 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400 shadow-[0_0_15px_rgba(239,68,68,0.15)] shrink-0 z-10 group-hover:scale-105 transition-transform duration-300">
              <UserX className="h-5 w-5" />
            </div>
          </motion.div>

          {/* Card 4: Blacklisted Scammers */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.2 }}
            onClick={() => {
              setActiveTab("scammers");
            }}
            className={`relative overflow-hidden rounded-2xl border bg-cesar-dark/80 p-5 shadow-2xl backdrop-blur-md flex items-center justify-between group hover:border-orange-500/25 cursor-pointer hover:scale-[1.02] transition-all duration-300 ${
              activeTab === "scammers"
                ? "border-orange-500/40 shadow-[0_0_20px_rgba(249,115,22,0.15)] ring-1 ring-orange-500/20"
                : "border-white/5 shadow-black/40"
            }`}
          >
            <div className="pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full bg-orange-500/5 blur-xl group-hover:bg-orange-500/10 transition-all duration-300" />
            <div className="space-y-1.5 text-right z-10">
              <p className="text-xs text-cesar-gray font-medium">قائمة النصابين (المحظورين)</p>
              <h3 className="text-2xl font-bold text-orange-400 font-mono leading-none">
                {scammersLoading ? (
                  <Loader2 className="h-5 w-5 animate-spin inline-block" />
                ) : (
                  scammers.length
                )}
              </h3>
            </div>
            <div className="h-12 w-12 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-400 shadow-[0_0_15px_rgba(249,115,22,0.15)] shrink-0 z-10 group-hover:scale-105 transition-transform duration-300">
              <AlertCircle className="h-5 w-5" />
            </div>
          </motion.div>
        </div>

        {/* ── 1. Pending Posts Tab ── */}
        {activeTab === "pending-posts" && (
          <div className="space-y-6">
            {loading ? (
              <div className="flex min-h-[40vh] items-center justify-center rounded-[2rem] border border-white/5 bg-cesar-dark/70 backdrop-blur-md">
                <div className="flex items-center gap-3 text-cesar-cyan">
                  <Loader2 className="h-6 w-6 animate-spin" />
                  <span className="text-sm font-medium">جارٍ تحميل المنشورات...</span>
                </div>
              </div>
            ) : error ? (
              <div className="rounded-[2rem] border border-red-500/20 bg-red-500/10 p-6 text-right text-sm text-red-300">
                <div className="flex items-center gap-2 text-red-200 mb-2">
                  <AlertCircle className="h-5 w-5" />
                  <span className="font-semibold">خطأ في التحميل</span>
                </div>
                <p>{error}</p>
              </div>
            ) : posts.length === 0 ? (
              <div className="rounded-[2rem] border border-white/5 bg-cesar-dark/70 p-10 text-center shadow-2xl shadow-black/40 backdrop-blur-md">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl border border-cesar-cyan/20 bg-cesar-cyan/10 text-cesar-cyan">
                  <CheckCircle2 className="h-8 w-8" />
                </div>
                <h2 className="text-xl font-bold text-white">لا توجد منشورات معلقة</h2>
                <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-cesar-gray">
                  تم التعامل مع جميع المنشورات المعلقة بنجاح.
                </p>
              </div>
            ) : (
              <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 items-stretch">
                {posts.map((post, index) => {
                  const imageUrl = Array.isArray(post.images) ? post.images[0] : post.images || "";
                  const userName = post.user?.name || "غير متوفر";
                  const userContact = post.user?.email || post.user?.phoneNumber || "غير متوفر";

                  return (
                    <motion.article
                      key={post._id}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex h-full flex-col overflow-hidden rounded-[1.75rem] border border-white/5 bg-cesar-dark/80 shadow-2xl shadow-black/40 backdrop-blur-md"
                    >
                      <div className="relative aspect-[16/10] shrink-0 overflow-hidden bg-black/40">
                        {imageUrl ? (
                          <img src={imageUrl} alt={post.title} className="h-full w-full object-cover" />
                        ) : (
                          <div className="flex h-full items-center justify-center bg-gradient-to-br from-cesar-cyan/10 via-transparent to-white/5 text-cesar-cyan">
                            <User className="h-10 w-10" />
                          </div>
                        )}
                        <div className="absolute top-2 left-2 bg-black/60 px-2 py-1 rounded-full text-[10px]">
                          {new Date(post.createdAt).toLocaleDateString("ar-EG")}
                        </div>
                        <div className="absolute bottom-4 right-4">
                          <span className="inline-flex items-center gap-2 rounded-full bg-black/65 px-3 py-1.5 text-xs text-cesar-cyan">
                            <Tags className="h-4 w-4" />
                            {post.category}
                          </span>
                        </div>
                      </div>

                      <div className="flex flex-1 flex-col justify-between p-5 text-right">
                        <div className="space-y-2">
                          <h2 className="line-clamp-2 text-lg font-bold text-white">{post.title}</h2>
                          <p className="line-clamp-3 text-sm leading-6 text-cesar-gray">{post.description}</p>
                        </div>

                        <div className="mt-4 flex flex-col gap-3">
                          <div className="grid gap-2 rounded-2xl border border-white/5 bg-black/30 p-4 text-xs">
                            <div className="flex items-center justify-between">
                              <span className="text-cesar-gray">السعر</span>
                              <span className="font-bold text-cesar-cyan">{post.price} ج.م</span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-cesar-gray">صاحب الإعلان</span>
                              <span className="font-semibold text-white">{userName}</span>
                            </div>
                            <div className="flex items-center justify-between gap-4">
                              <span className="text-cesar-gray">التواصل</span>
                              <span className="truncate text-white font-mono" dir="ltr">{userContact}</span>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                            <Link
                              to={"/posts/" + post._id}
                              className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-white/10 bg-white/5 py-2 text-xs font-bold text-cesar-gray hover:text-white transition duration-300"
                            >
                              <Eye className="h-4 w-4" />
                              عرض
                            </Link>
                            <button
                              type="button"
                              onClick={() => handleApprove(post._id)}
                              disabled={actionLoadingId === post._id || isRejecting}
                              className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-emerald-500/40 bg-emerald-500/10 py-2 text-xs font-bold text-emerald-300 hover:bg-emerald-500/20 transition duration-300 disabled:opacity-50"
                            >
                              {actionLoadingId === post._id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <CheckCircle2 className="h-4 w-4" />
                              )}
                              موافقة
                            </button>
                            <button
                              type="button"
                              onClick={() => openRejectModal(post._id)}
                              disabled={actionLoadingId === post._id}
                              className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-rose-500/40 bg-rose-500/10 py-2 text-xs font-bold text-rose-300 hover:bg-rose-500/20 transition duration-300"
                            >
                              <XCircle className="h-4 w-4" />
                              رفض
                            </button>
                          </div>
                        </div>
                      </div>
                    </motion.article>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ── 2. Users Management Tab ── */}
        {activeTab === "users" && (
          <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/5 pb-4">
              <div className="space-y-2">
                <h2 className="text-xl font-bold text-white">إدارة الحسابات وكتلة المستخدمين</h2>
                
                {/* Filter Pills row */}
                <div className="flex flex-wrap gap-2 text-xs">
                  <button
                    type="button"
                    onClick={() => setUserTypeFilter("all")}
                    className={`px-3 py-1.5 rounded-lg border transition duration-200 ${
                      userTypeFilter === "all"
                        ? "bg-cesar-cyan/10 border-cesar-cyan/30 text-cesar-cyan"
                        : "border-white/5 bg-white/5 text-slate-400 hover:text-white"
                    }`}
                  >
                    الكل ({users.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setUserTypeFilter("user")}
                    className={`px-3 py-1.5 rounded-lg border transition duration-200 ${
                      userTypeFilter === "user"
                        ? "bg-cesar-cyan/10 border-cesar-cyan/30 text-cesar-cyan"
                        : "border-white/5 bg-white/5 text-slate-400 hover:text-white"
                    }`}
                  >
                    المستخدمين ({users.filter((u) => u.role !== "admin").length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setUserTypeFilter("admin")}
                    className={`px-3 py-1.5 rounded-lg border transition duration-200 ${
                      userTypeFilter === "admin"
                        ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                        : "border-white/5 bg-white/5 text-slate-400 hover:text-white"
                    }`}
                  >
                    المسؤولين ({users.filter((u) => u.role === "admin").length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setUserTypeFilter("blocked")}
                    className={`px-3 py-1.5 rounded-lg border transition duration-200 ${
                      userTypeFilter === "blocked"
                        ? "bg-red-500/10 border-red-500/30 text-red-400"
                        : "border-white/5 bg-white/5 text-slate-400 hover:text-white"
                    }`}
                  >
                    المحظورين ({users.filter((u) => u.isBlocked).length})
                  </button>
                </div>
              </div>
              
              {/* User search */}
              <div className="relative w-full sm:w-80">
                <input
                  type="text"
                  placeholder="ابحث باسم المستخدم أو البريد أو الهاتف..."
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded-xl py-3 pl-3 pr-10 text-sm outline-none focus:border-cesar-cyan focus:shadow-neon-cyan transition"
                />
                <Search className="absolute right-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500" />
              </div>
            </div>

            {usersLoading ? (
              <div className="flex min-h-[30vh] items-center justify-center rounded-[2rem] border border-white/5 bg-cesar-dark/70 backdrop-blur-md">
                <div className="flex items-center gap-3 text-cesar-cyan">
                  <Loader2 className="h-6 w-6 animate-spin" />
                  <span className="text-sm font-medium">جارٍ تحميل الحسابات...</span>
                </div>
              </div>
            ) : usersError ? (
              <div className="rounded-[2rem] border border-red-500/20 bg-red-500/10 p-6 text-right text-sm text-red-300">
                <p>{usersError}</p>
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className="text-center py-10 bg-cesar-dark/70 border border-white/5 rounded-[2rem] text-slate-400">
                لا يوجد مستخدمين يطابقون شروط البحث.
              </div>
            ) : (
              <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 items-stretch">
                {filteredUsers.map((user) => {
                  const contact = user.email || user.phoneNumber || "لا يوجد بريد أو هاتف";
                  const isAdminRole = user.role === "admin";
                  const registerDate = new Date(user.createdAt).toLocaleDateString("ar-EG");

                  return (
                    <div
                      key={user._id}
                      className={`relative flex flex-col justify-between p-5 rounded-[1.75rem] border bg-cesar-dark/80 shadow-2xl backdrop-blur-md transition-all ${
                        user.isBlocked ? "border-red-500/30 shadow-red-950/15" : "border-white/5"
                      }`}
                    >
                      <div className="space-y-4">
                        <div className="flex items-center gap-3 border-b border-white/5 pb-3">
                          <div className={`h-11 w-11 rounded-xl flex items-center justify-center shrink-0 ${
                            isAdminRole
                              ? "bg-emerald-500/10 border border-emerald-500/20 text-emerald-400"
                              : user.isBlocked
                              ? "bg-red-500/10 border border-red-500/20 text-red-400 animate-pulse"
                              : "bg-cesar-cyan/10 border border-cesar-cyan/20 text-cesar-cyan"
                          }`}>
                            <User className="h-5 w-5" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <h3 className="font-bold text-white truncate text-base">{user.name}</h3>
                            <span className={`inline-block px-2 py-0.5 mt-1 rounded text-[10px] font-bold ${
                              isAdminRole ? "bg-emerald-500/20 text-emerald-300" : "bg-blue-500/20 text-blue-300"
                            }`}>
                              {isAdminRole ? "مسؤول" : "عضو"}
                            </span>
                          </div>
                        </div>

                        <div className="space-y-2 text-xs">
                          <div className="flex items-center justify-between gap-4">
                            <span className="text-cesar-gray">اسم المستخدم / المعرف</span>
                            <span className="truncate text-white font-mono" dir="ltr">{user.identifier || user.email || user.phoneNumber}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-cesar-gray">التواصل الأساسي</span>
                            <span className="truncate text-slate-300 font-mono" dir="ltr">{contact}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-cesar-gray">تاريخ التسجيل</span>
                            <span className="text-slate-300">{registerDate}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-cesar-gray">حالة الحساب</span>
                            <span className={`font-bold ${user.isBlocked ? "text-red-500" : "text-emerald-400"}`}>
                              {user.isBlocked ? "محظور" : "نشط"}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Action buttons */}
                      <div className="mt-5 border-t border-white/5 pt-4">
                        {isAdminRole ? (
                          <div className="w-full text-center py-2 text-xs text-slate-500 border border-dashed border-white/5 rounded-xl">
                            حساب المسؤول لا يمكن حظره
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleToggleBlock(user._id)}
                            disabled={blockLoadingId === user._id}
                            className={`flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-bold transition duration-300 disabled:opacity-50 ${
                              user.isBlocked
                                ? "border border-emerald-500/50 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20"
                                : "border border-red-500/50 bg-red-500/10 text-red-400 hover:bg-red-500/20"
                            }`}
                          >
                            {blockLoadingId === user._id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : user.isBlocked ? (
                              <>
                                <UserCheck className="h-4 w-4" />
                                إلغاء الحظر
                              </>
                            ) : (
                              <>
                                <UserX className="h-4 w-4" />
                                حظر المستخدم
                              </>
                            )}
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ── 3. Scammers List CRUD Tab ── */}
        {activeTab === "scammers" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
            {/* Scammer Add Form */}
            <div className="relative overflow-hidden rounded-[2rem] border border-white/5 bg-cesar-dark/85 p-6 shadow-2xl shadow-black/50 backdrop-blur-md lg:p-7">
              <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-red-500 to-transparent"></div>
              
              <h2 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
                <PlusCircle className="w-5 h-5 text-red-500" />
                إضافة محظور جديد
              </h2>
              <p className="text-xs text-cesar-gray mb-6">
                أدخل بيانات النصاب أو الشخص المحظور للتحذير منه بشكل عام.
              </p>

              <form onSubmit={handleAddScammer} className="space-y-4 text-right">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300 mr-1">الاسم بالكامل</label>
                  <input
                    type="text"
                    required
                    value={newScammer.name}
                    onChange={(e) => setNewScammer(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="مثال: عمر خالد الجيزاوي"
                    className="w-full bg-black/40 border border-white/10 text-white text-sm rounded-xl px-4 py-3 outline-none focus:border-red-500/50 transition"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300 mr-1">رقم الهاتف / المعرف</label>
                  <input
                    type="text"
                    required
                    value={newScammer.phone}
                    onChange={(e) => setNewScammer(prev => ({ ...prev, phone: e.target.value }))}
                    placeholder="مثال: 01123456789"
                    className="w-full bg-black/40 border border-white/10 text-white text-sm rounded-xl px-4 py-3 outline-none focus:border-red-500/50 transition font-mono text-left"
                    dir="ltr"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300 mr-1">سبب الحظر / تفاصيل المخالفة</label>
                  <textarea
                    required
                    rows={4}
                    value={newScammer.reason}
                    onChange={(e) => setNewScammer(prev => ({ ...prev, reason: e.target.value }))}
                    placeholder="اكتب بالتفصيل سبب الحظر (مثل: وساطة وهمية وسرقة حساب ببجي)..."
                    className="w-full bg-black/40 border border-white/10 text-white text-sm rounded-xl px-4 py-3 outline-none focus:border-red-500/50 transition resize-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={scammerSubmitLoading}
                  className="w-full flex items-center justify-center gap-2 rounded-xl border border-red-500/50 bg-red-500/10 px-4 py-3 font-bold text-red-400 hover:bg-red-500/20 transition duration-300 disabled:opacity-50"
                >
                  {scammerSubmitLoading ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <>
                      <PlusCircle className="h-5 w-5" />
                      إضافة إلى القائمة
                    </>
                  )}
                </button>
              </form>
            </div>

            {/* Scammers List Table/Grid */}
            <div className="lg:col-span-2 space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <h2 className="text-xl font-bold text-white">قائمة المحظورين الحالية</h2>
                
                {/* Search */}
                <div className="relative w-full sm:w-72">
                  <input
                    type="text"
                    placeholder="ابحث بالاسم أو الهاتف أو السبب..."
                    value={scammerSearch}
                    onChange={(e) => setScammerSearch(e.target.value)}
                    className="w-full bg-black/40 border border-white/10 rounded-xl py-3.5 pl-3 pr-10 text-sm outline-none focus:border-red-500/50 transition"
                  />
                  <Search className="absolute right-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500" />
                </div>
              </div>

              {scammersLoading ? (
                <div className="flex min-h-[30vh] items-center justify-center rounded-[2rem] border border-white/5 bg-cesar-dark/70 backdrop-blur-md">
                  <div className="flex items-center gap-3 text-red-400">
                    <Loader2 className="h-6 w-6 animate-spin" />
                    <span className="text-sm font-medium">جارٍ تحميل القائمة...</span>
                  </div>
                </div>
              ) : scammersError ? (
                <div className="rounded-[2rem] border border-red-500/20 bg-red-500/10 p-6 text-right text-sm text-red-300">
                  <p>{scammersError}</p>
                </div>
              ) : filteredScammers.length === 0 ? (
                <div className="text-center py-12 bg-cesar-dark/70 border border-white/5 rounded-[2rem] text-slate-400">
                  لا يوجد نصابين أو محظورين في القائمة حالياً.
                </div>
              ) : (
                <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-white/10">
                  {filteredScammers.map((scammer) => (
                    <div
                      key={scammer._id}
                      className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 rounded-2xl border border-white/5 bg-black/30 hover:border-red-500/25 transition duration-300"
                    >
                      <div className="space-y-1.5 flex-1 text-right">
                        <h4 className="font-bold text-white text-base">{scammer.name}</h4>
                        <p className="text-xs text-red-400 leading-relaxed font-semibold">
                          السبب: {scammer.reason}
                        </p>
                        <span className="inline-block text-[10px] text-slate-500 font-medium">
                          تاريخ الإضافة: {new Date(scammer.createdAt || Date.now()).toLocaleDateString("ar-EG")}
                        </span>
                      </div>

                      <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end">
                        <span className="text-sm font-mono font-bold text-slate-300 tracking-wider bg-black/40 border border-white/5 px-3 py-1.5 rounded-lg" dir="ltr">
                          {scammer.phone}
                        </span>
                        
                        <button
                          type="button"
                          onClick={() => handleDeleteScammer(scammer._id)}
                          disabled={scammerDeleteId === scammer._id}
                          className="p-3 bg-rose-500/10 hover:bg-rose-500/25 border border-rose-500/30 text-rose-400 hover:text-rose-300 rounded-xl transition duration-200 shrink-0"
                          title="حذف من القائمة"
                        >
                          {scammerDeleteId === scammer._id ? (
                            <Loader2 className="h-5 w-5 animate-spin" />
                          ) : (
                            <Trash2 className="h-5 w-5" />
                          )}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </motion.div>

      {/* ── Rejection Modal ── */}
      {selectedPostToReject ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 py-6 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.2 }}
            className="w-full max-w-xl overflow-hidden rounded-[1.75rem] border border-white/5 bg-cesar-dark/95 shadow-2xl shadow-black/60"
          >
            <div className="flex items-start justify-between gap-4 border-b border-white/5 px-6 py-5 text-right">
              <div className="space-y-1">
                <p className="text-sm text-cesar-gray">إجراء الرفض</p>
                <h3 className="text-xl font-bold text-white">رفض المنشور</h3>
                <p className="text-sm leading-6 text-slate-300">
                  أضف سببًا مختصرًا للرفض قبل تأكيد الإجراء.
                </p>
              </div>

              <button
                type="button"
                onClick={closeRejectModal}
                disabled={isRejecting}
                className="rounded-full border border-white/10 bg-black/30 p-2 text-slate-300 transition hover:border-white/20 hover:text-white disabled:opacity-50"
                aria-label="إغلاق"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleReject} className="space-y-5 px-6 py-6 text-right">
              {selectedPost ? (
                <div className="rounded-2xl border border-white/5 bg-black/30 p-4 text-sm text-slate-300">
                  <p className="text-xs text-cesar-gray">المنشور المحدد</p>
                  <p className="mt-1 font-semibold text-white">{selectedPost.title}</p>
                </div>
              ) : null}

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300">سبب الرفض</label>
                <textarea
                  value={rejectionReason}
                  onChange={(event) => setRejectionReason(event.target.value)}
                  rows={4}
                  placeholder="اكتب سببًا واضحًا ومختصرًا لرفض المنشور..."
                  className="w-full resize-none rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-white outline-none transition focus:border-cesar-cyan focus:ring-1 focus:ring-cesar-cyan"
                />
              </div>

              <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={closeRejectModal}
                  disabled={isRejecting}
                  className="inline-flex items-center justify-center rounded-xl border border-white/10 bg-white/5 px-5 py-3 font-semibold text-white transition hover:bg-white/10 disabled:opacity-50"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={isRejecting}
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-rose-500/40 bg-rose-500/10 px-5 py-3 font-bold text-rose-300 hover:bg-rose-500/20 transition disabled:opacity-50"
                >
                  {isRejecting ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <ChevronLeft className="h-5 w-5" />
                  )}
                  تأكيد الرفض
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      ) : null}
    </div>
  );
}

export default AdminDashboardPage;