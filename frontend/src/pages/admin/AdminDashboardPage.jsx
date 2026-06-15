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
} from "lucide-react";
import { toast } from "react-toastify";
import api from "../../Services/api.js";

function AdminDashboardPage() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionLoadingId, setActionLoadingId] = useState(null);
  const [selectedPostToReject, setSelectedPostToReject] = useState(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [isRejecting, setIsRejecting] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const fetchPendingPosts = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await api.get("/posts/pending");

        if (isMounted) {
          setPosts(Array.isArray(response.data) ? response.data : []);
        }
      } catch (requestError) {
        if (isMounted) {
          setError(
            requestError.response?.data?.message ||
              "تعذر تحميل المنشورات المعلقة.",
          );
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchPendingPosts();

    return () => {
      isMounted = false;
    };
  }, []);

  const pendingCount = useMemo(() => posts.length, [posts.length]);

  const removePostFromState = (postId) => {
    setPosts((currentPosts) =>
      currentPosts.filter((post) => post._id !== postId),
    );
  };

  const handleApprove = async (postId) => {
    try {
      setActionLoadingId(postId);
      await api.put(`/posts/${postId}/status`, { status: "approved" });
      removePostFromState(postId);
      toast.success("تمت الموافقة على المنشور بنجاح.");
    } catch (requestError) {
      toast.error(
        requestError.response?.data?.message ||
          "تعذر الموافقة على المنشور. حاول مرة أخرى.",
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
    if (isRejecting) {
      return;
    }

    setSelectedPostToReject(null);
    setRejectionReason("");
  };

  const handleReject = async (event) => {
    event.preventDefault();

    if (!selectedPostToReject) {
      return;
    }

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
        requestError.response?.data?.message ||
          "تعذر رفض المنشور. حاول مرة أخرى.",
      );
    } finally {
      setIsRejecting(false);
    }
  };

  const selectedPost =
    posts.find((post) => post._id === selectedPostToReject) || null;

  return (
    <div
      dir="rtl"
      className="min-h-screen bg-cesar-darker px-4 py-8 font-cairo text-white sm:px-6 lg:px-8"
    >
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="mx-auto max-w-7xl space-y-8"
      >
        <section className="relative overflow-hidden rounded-[2rem] border border-white/5 bg-cesar-dark/85 p-6 shadow-2xl shadow-black/50 backdrop-blur-md sm:p-8">
          <div className="pointer-events-none absolute inset-x-0 top-0 h-[3px] bg-gradient-to-r from-transparent via-cesar-cyan to-transparent" />
          <div className="pointer-events-none absolute -right-24 top-6 h-56 w-56 rounded-full bg-cesar-cyan/10 blur-3xl" />
          <div className="pointer-events-none absolute left-0 top-24 h-48 w-48 rounded-full bg-emerald-500/10 blur-3xl" />

          <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="space-y-3 text-right">
              <div className="flex items-center justify-between">
                <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl border border-cesar-cyan/20 bg-cesar-cyan/10 text-cesar-cyan shadow-neon-cyan">
                  <ShieldCheck className="h-7 w-7" />
                </div>
                <Link
                  to="/admin/settings"
                  className="rounded-xl border border-cesar-cyan/50 bg-cesar-cyan/10 px-4 py-2.5 text-sm font-bold text-cesar-cyan transition duration-300 hover:bg-cesar-cyan/20 hover:shadow-neon-cyan"
                >
                  إعدادات المتجر العامة
                </Link>
              </div>
              <div>
                <p className="text-sm text-cesar-gray">لوحة الإدارة</p>
                <h1 className="mt-1 text-3xl font-bold text-white sm:text-4xl">
                  مراجعة المنشورات المعلقة
                </h1>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">
                  راجع المنشورات الجديدة، وافق عليها أو ارفضها من خلال واجهة
                  سريعة وواضحة ومناسبة للعمل اليومي.
                </p>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border border-white/5 bg-black/30 px-4 py-3 text-right">
                <p className="text-xs text-cesar-gray">المنشورات المعلقة</p>
                <p className="mt-2 text-2xl font-bold text-white">
                  {pendingCount}
                </p>
              </div>
              <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-right">
                <p className="text-xs text-emerald-200">إجراء سريع</p>
                <p className="mt-2 text-sm font-semibold text-emerald-100">
                  موافقة أو رفض لكل منشور
                </p>
              </div>
              <div className="rounded-2xl border border-cyan-500/20 bg-cyan-500/10 px-4 py-3 text-right">
                <p className="text-xs text-cyan-200">الحالة</p>
                <p className="mt-2 text-sm font-semibold text-cyan-100">
                  RTL + Neon Dark UI
                </p>
              </div>
            </div>
          </div>
        </section>

        {loading ? (
          <div className="flex min-h-[40vh] items-center justify-center rounded-[2rem] border border-white/5 bg-cesar-dark/70 backdrop-blur-md">
            <div className="flex items-center gap-3 text-cesar-cyan">
              <Loader2 className="h-6 w-6 animate-spin" />
              <span className="text-sm font-medium">
                جارٍ تحميل المنشورات...
              </span>
            </div>
          </div>
        ) : error ? (
          <div className="rounded-[2rem] border border-red-500/20 bg-red-500/10 p-6 text-right text-sm text-red-300">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-2">
                <div className="flex items-center justify-end gap-2 text-red-200">
                  <AlertCircle className="h-5 w-5" />
                  <span className="font-semibold">تعذر تحميل البيانات</span>
                </div>
                <p>{error}</p>
              </div>
            </div>
          </div>
        ) : posts.length === 0 ? (
          <div className="rounded-[2rem] border border-white/5 bg-cesar-dark/70 p-10 text-center shadow-2xl shadow-black/40 backdrop-blur-md">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl border border-cesar-cyan/20 bg-cesar-cyan/10 text-cesar-cyan">
              <CheckCircle2 className="h-8 w-8" />
            </div>
            <h2 className="text-xl font-bold text-white">
              لا توجد منشورات معلقة
            </h2>
            <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-cesar-gray">
              تم التعامل مع جميع المنشورات المعلقة بالفعل. ستظهر هنا أي منشورات
              جديدة تحتاج إلى مراجعة.
            </p>
          </div>
        ) : (
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {posts.map((post, index) => {
              const imageUrl = Array.isArray(post.images)
                ? post.images[0]
                : post.images || "";
              const userName = post.user?.name || "غير متوفر";
              const userEmail = post.user?.email || "غير متوفر";

              return (
                <motion.article
                  key={post._id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    duration: 0.25,
                    delay: Math.min(index * 0.05, 0.25),
                  }}
                  className="overflow-hidden rounded-[1.75rem] border border-white/5 bg-cesar-dark/80 shadow-2xl shadow-black/40 backdrop-blur-md"
                >
                  <div className="relative aspect-[16/10] overflow-hidden bg-black/40">
                    {imageUrl ? (
                      <img
                        src={imageUrl}
                        alt={post.title}
                        className="h-full w-full object-cover transition duration-500 hover:scale-105"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center bg-gradient-to-br from-cesar-cyan/10 via-transparent to-white/5 text-cesar-cyan">
                        <User className="h-10 w-10" />
                      </div>
                    )}

                    <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/80 to-transparent" />
                    <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between gap-3">
                      <span className="inline-flex items-center gap-2 rounded-full border border-cesar-cyan/20 bg-black/55 px-3 py-1.5 text-xs font-semibold text-cesar-cyan backdrop-blur-sm">
                        <Tags className="h-4 w-4" />
                        {post.category || "غير محدد"}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-4 p-5 text-right">
                    <div className="space-y-2">
                      <h2 className="line-clamp-2 text-lg font-bold text-white">
                        {post.title}
                      </h2>
                      <p className="line-clamp-3 text-sm leading-6 text-cesar-gray">
                        {post.description}
                      </p>
                    </div>

                    <div className="grid gap-3 rounded-2xl border border-white/5 bg-black/30 p-4 text-sm">
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-cesar-gray">السعر</span>
                        <span className="font-bold text-cesar-cyan">
                          {Number(post.price || 0).toLocaleString()} ج.م
                        </span>
                      </div>
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-cesar-gray">اسم المستخدم</span>
                        <span className="font-semibold text-white">
                          {userName}
                        </span>
                      </div>
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-cesar-gray">
                          البريد الإلكتروني
                        </span>
                        <span
                          className="truncate font-semibold text-white"
                          dir="ltr"
                        >
                          {userEmail}
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                      <Link
                        to={"/posts/" + post._id}
                        className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/20 bg-white/5 px-4 py-3 font-bold text-cesar-gray hover:text-white hover:bg-white/10 transition duration-300"
                      >
                        <Eye className="h-5 w-5" />
                        عرض التفاصيل
                      </Link>

                      <button
                        type="button"
                        onClick={() => handleApprove(post._id)}
                        disabled={actionLoadingId === post._id || isRejecting}
                        className="inline-flex items-center justify-center gap-2 rounded-xl border border-emerald-500/40 bg-emerald-500/10 px-4 py-3 font-bold text-emerald-300 transition duration-300 hover:bg-emerald-500/20 hover:shadow-[0_0_18px_rgba(16,185,129,0.2)] disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {actionLoadingId === post._id ? (
                          <Loader2 className="h-5 w-5 animate-spin" />
                        ) : (
                          <CheckCircle2 className="h-5 w-5" />
                        )}
                        موافقة
                      </button>

                      <button
                        type="button"
                        onClick={() => openRejectModal(post._id)}
                        disabled={actionLoadingId === post._id}
                        className="inline-flex items-center justify-center gap-2 rounded-xl border border-rose-500/40 bg-rose-500/10 px-4 py-3 font-bold text-rose-300 transition duration-300 hover:bg-rose-500/20 hover:shadow-[0_0_18px_rgba(244,63,94,0.2)] disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        <XCircle className="h-5 w-5" />
                        رفض
                      </button>
                    </div>
                  </div>
                </motion.article>
              );
            })}
          </div>
        )}
      </motion.div>

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
                className="rounded-full border border-white/10 bg-black/30 p-2 text-slate-300 transition hover:border-white/20 hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
                aria-label="إغلاق"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form
              onSubmit={handleReject}
              className="space-y-5 px-6 py-6 text-right"
            >
              {selectedPost ? (
                <div className="rounded-2xl border border-white/5 bg-black/30 p-4 text-sm text-slate-300">
                  <p className="text-xs text-cesar-gray">المنشور المحدد</p>
                  <p className="mt-1 font-semibold text-white">
                    {selectedPost.title}
                  </p>
                </div>
              ) : null}

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300">
                  سبب الرفض
                </label>
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
                  className="inline-flex items-center justify-center rounded-xl border border-white/10 bg-white/5 px-5 py-3 font-semibold text-white transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={isRejecting}
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-rose-500/40 bg-rose-500/10 px-5 py-3 font-bold text-rose-300 transition hover:bg-rose-500/20 disabled:cursor-not-allowed disabled:opacity-60"
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
