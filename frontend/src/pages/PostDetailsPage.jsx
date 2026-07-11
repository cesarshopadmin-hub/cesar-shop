import { useTranslation } from "react-i18next";
import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  ArrowRight,
  Tag,
  User,
  Mail,
  Phone,
  MessageCircle,
  MessageSquare,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  XCircle,
  Loader2,
  X,
  Trash2,
} from "lucide-react";
import { toast } from "react-toastify";
import api from "../Services/api";
import { useAuth } from "../context/AuthContext";
import { motion } from "framer-motion";
import { optimizeImage } from "../utils/imageOptimizer.js";

const PostDetailsPage = () => {
  const { t, i18n } = useTranslation();
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // Admin Action States
  const [actionLoading, setActionLoading] = useState(false);
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");

  // Admin Edit Post States
  const [isEditingDesc, setIsEditingDesc] = useState(false);
  const [tempDesc, setTempDesc] = useState("");
  const [tempPrice, setTempPrice] = useState("");
  const [tempCategory, setTempCategory] = useState("");
  const [updatingDesc, setUpdatingDesc] = useState(false);

  const CATEGORIES = [
    "فري فاير",
    "ببجي",
    "بيس فيفا و كلاش",
    "بلود سترايك",
    "روبلوكس",
    "حسابات سوشيال ميديا",
    "اخري",
  ];

  const handleSaveDescription = async () => {
    if (!tempDesc.trim()) {
      toast.error("الوصف لا يمكن أن يكون فارغاً");
      return;
    }
    if (tempDesc.trim().length < 10) {
      toast.error("يجب أن يكون وصف الإعلان 10 أحرف على الأقل");
      return;
    }
    if (!tempPrice || isNaN(tempPrice) || Number(tempPrice) <= 0) {
      toast.error("يرجى إدخال سعر صحيح");
      return;
    }
    try {
      setUpdatingDesc(true);
      const response = await api.put(`/posts/${post._id}`, {
        description: tempDesc,
        price: Number(tempPrice),
        category: tempCategory,
      });
      setPost((prev) => ({
        ...prev,
        description: response.data.description,
        price: response.data.price,
        category: response.data.category,
      }));
      toast.success("تم تحديث الإعلان بنجاح");
      setIsEditingDesc(false);
    } catch (err) {
      console.error("Error updating post:", err);
      toast.error(err.response?.data?.message || "حدث خطأ أثناء تحديث الإعلان.");
    } finally {
      setUpdatingDesc(false);
    }
  };

  const currentUser = user?.name ? user : user?.user;
  const isOwner = currentUser && post && post.user && (post.user._id === currentUser._id || post.user === currentUser._id || post.user.toString() === currentUser._id.toString());

  const handleDeletePost = async () => {
    const confirmDelete = window.confirm("هل أنت متأكد من حذف هذا الإعلان نهائياً؟");
    if (!confirmDelete) return;

    try {
      setActionLoading(true);
      await api.delete(`/posts/${post._id}`);
      toast.success("تم حذف الإعلان بنجاح");
      navigate(isAdmin ? "/admin/dashboard" : "/profile");
    } catch (err) {
      console.error("Error deleting post:", err);
      toast.error(err.response?.data?.message || "حدث خطأ أثناء حذف الإعلان.");
    } finally {
      setActionLoading(false);
    }
  };

  // Lightbox States
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  


  const handlePrev = () => {
    if (post && post.images && post.images.length > 0) {
      setCurrentImageIndex((prev) =>
        prev === 0 ? post.images.length - 1 : prev - 1
      );
    }
  };

  const handleNext = () => {
    if (post && post.images && post.images.length > 0) {
      setCurrentImageIndex((prev) =>
        prev === post.images.length - 1 ? 0 : prev + 1
      );
    }
  };

  const handleApprove = async () => {
    try {
      setActionLoading(true);
      await api.put(`/posts/${post._id}/status`, { status: "approved" });
      toast.success("تمت الموافقة على المنشور بنجاح.");
      navigate("/admin/dashboard");
    } catch (requestError) {
      toast.error(
        requestError.response?.data?.message || "تعذر الموافقة على المنشور. حاول مرة أخرى."
      );
    } finally {
      setActionLoading(false);
    }
  };

  const handleRejectSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!rejectionReason.trim()) {
      toast.error("يرجى إدخال سبب الرفض");
      return;
    }

    try {
      setActionLoading(true);
      await api.put(`/posts/${post._id}/status`, {
        status: "rejected",
        rejectionReason: rejectionReason.trim(),
      });
      toast.success("تم رفض المنشور بنجاح.");
      setIsRejectModalOpen(false);
      navigate("/admin/dashboard");
    } catch (requestError) {
      toast.error(
        requestError.response?.data?.message || "تعذر رفض المنشور. حاول مرة أخرى."
      );
    } finally {
      setActionLoading(false);
    }
  };

  useEffect(() => {
    const fetchPost = async () => {
      try {
        const response = await api.get(`/posts/${id}`);
        setPost(response.data);
      } catch (err) {
        console.error(err);
        setError("حدث خطأ أثناء جلب تفاصيل الإعلان");
        toast.error("حدث خطأ أثناء جلب تفاصيل الإعلان");
      } finally {
        setLoading(false);
      }
    };
    fetchPost();
  }, [id]);

  if (loading) {
    return (
      <div
        className="min-h-screen bg-cesar-darker font-cairo flex items-center justify-center text-white"
        dir={i18n.dir()}
      >
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cesar-cyan"></div>
      </div>
    );
  }

  if (error || !post) {
    return (
      <div
        className="min-h-screen bg-cesar-darker font-cairo flex flex-col items-center justify-center text-white"
        dir={i18n.dir()}
      >
        <p className="text-red-500 mb-4">{error || "الإعلان غير موجود"}</p>
        <button
          onClick={() => navigate(-1)}
          className="text-cesar-cyan hover:underline"
        >
          العودة
        </button>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen bg-cesar-darker text-white font-cairo p-4 md:p-8"
      dir={i18n.dir()}
    >
      <div className="max-w-6xl mx-auto space-y-8">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors group"
        >
          <ArrowRight className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
          <span>العودة للسوق</span>
        </button>

        {isAdmin && post.status === "pending" && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative overflow-hidden rounded-2xl border border-cesar-cyan/30 bg-cesar-dark/80 p-6 shadow-[0_0_20px_rgba(0,209,255,0.1)] backdrop-blur-md text-right flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
          >
            <div className="pointer-events-none absolute inset-x-0 top-0 h-[3px] bg-gradient-to-r from-transparent via-cesar-cyan to-transparent" />
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-cesar-cyan animate-pulse" />
                خيارات مراجعة المنشور
              </h2>
              <p className="text-sm text-cesar-gray mt-1">
                هذا المنشور معلق وبانتظار المراجعة. يمكنك الموافقة عليه ليتم عرضه للعامة، أو رفضه مع تحديد السبب.
              </p>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <button
                type="button"
                onClick={handleApprove}
                disabled={actionLoading}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-500/10 border border-emerald-500/50 px-5 py-3 text-sm font-bold text-emerald-300 hover:bg-emerald-500/20 hover:shadow-[0_0_15px_rgba(16,185,129,0.2)] transition duration-300 disabled:opacity-50"
              >
                {actionLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <CheckCircle2 className="h-4 w-4" />
                )}
                موافقة
              </button>
              <button
                type="button"
                onClick={() => setIsRejectModalOpen(true)}
                disabled={actionLoading}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-rose-500/10 border border-rose-500/50 px-5 py-3 text-sm font-bold text-rose-300 hover:bg-rose-500/20 hover:shadow-[0_0_15px_rgba(244,63,94,0.2)] transition duration-300 disabled:opacity-50"
              >
                <XCircle className="h-4 w-4" />
                رفض
              </button>
            </div>
          </motion.div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
          {/* ── Image gallery ── */}
          <div className="flex flex-col">
            <div className="w-full aspect-[4/3] rounded-2xl overflow-hidden border border-cesar-cyan/30 shadow-[0_0_15px_rgba(0,255,255,0.1)] relative group">
              <img
                src={
                  post.images && post.images.length > 0
                    ? optimizeImage(post.images[currentImageIndex])
                    : "https://via.placeholder.com/600x400?text=No+Image"
                }
                alt={post.category || "إعلان"}
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105 cursor-zoom-in"
                onClick={() => setIsLightboxOpen(true)}
              />

              {post.images && post.images.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={handlePrev}
                    className="absolute right-4 top-1/2 -translate-y-1/2 flex h-10 w-10 items-center justify-center rounded-full border border-cesar-cyan/30 bg-black/60 text-cesar-cyan hover:bg-cesar-cyan hover:text-black hover:shadow-neon-cyan transition duration-300 backdrop-blur-sm focus:outline-none z-10"
                  >
                    <ChevronRight className="w-6 h-6" />
                  </button>
                  <button
                    type="button"
                    onClick={handleNext}
                    className="absolute left-4 top-1/2 -translate-y-1/2 flex h-10 w-10 items-center justify-center rounded-full border border-cesar-cyan/30 bg-black/60 text-cesar-cyan hover:bg-cesar-cyan hover:text-black hover:shadow-neon-cyan transition duration-300 backdrop-blur-sm focus:outline-none z-10"
                  >
                    <ChevronLeft className="w-6 h-6" />
                  </button>
                </>
              )}
            </div>

            {post.images && post.images.length > 1 && (
              <div className="flex gap-3 mt-4 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-cesar-cyan/20">
                {post.images.map((img, idx) => (
                  <div
                    key={idx}
                    onClick={() => setCurrentImageIndex(idx)}
                    className={`w-20 h-20 rounded-lg overflow-hidden border-2 cursor-pointer transition-all duration-300 ${
                      idx === currentImageIndex
                        ? "border-cesar-cyan opacity-100 shadow-[0_0_10px_rgba(0,240,255,0.4)]"
                        : "border-transparent opacity-60 hover:opacity-100"
                    }`}
                  >
                    <img
                      src={optimizeImage(img)}
                      alt={`${post.category || "إعلان"}-${idx}`}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ── Post details + seller info ── */}
          <div className="flex flex-col">
            <div className="mb-6">
              <div className="inline-flex items-center gap-2 bg-cesar-cyan/10 text-cesar-cyan px-4 py-1.5 rounded-full text-sm font-medium mb-4 border border-cesar-cyan/20 shadow-[0_0_10px_rgba(0,255,255,0.1)]">
                <Tag className="w-4 h-4" />
                <span>
                  {t(`enums.${post.category}`, {
                    defaultValue:
                      post.category ||
                      t("enums.غير محدد", { defaultValue: "غير محدد" }),
                  })}
                </span>
              </div>
              <div className="text-4xl font-black text-cesar-cyan drop-shadow-[0_0_12px_rgba(0,255,255,0.4)] mb-4">
                {post.price} جنيه
              </div>
              {/* ── Contact buttons ── */}
              <div className="flex flex-col sm:flex-row gap-3 w-full mt-2 mb-6">
                {/* WhatsApp */}
                <a
                  href={`https://wa.me/${post.countryCode || ''}${post.whatsappNumber || ''}`}
                  onClick={(e) => {
                    if (!post.countryCode || !post.whatsappNumber) {
                      e.preventDefault();
                      toast.error("رقم الواتساب غير متوفر لهذا الإعلان");
                    }
                  }}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 flex items-center justify-center gap-2 h-12 bg-[#25D366]/10 hover:bg-[#25D366]/20 text-[#25D366] border border-[#25D366]/40 hover:shadow-[0_0_18px_rgba(37,211,102,0.25)] rounded-xl font-bold text-sm transition-all duration-300 group"
                >
                  <MessageCircle className="w-5 h-5 group-hover:scale-110 transition-transform" />
                  تواصل عبر واتساب
                </a>

                {/* Chat */}
                {user && post.user && user._id !== post.user._id && (
                  <button
                    type="button"
                    onClick={() => navigate(`/chat/${post.user._id}`)}
                    className="flex-1 flex items-center justify-center gap-2 h-12 bg-cesar-cyan/10 hover:bg-cesar-cyan/20 text-cesar-cyan border border-cesar-cyan/30 hover:shadow-[0_0_18px_rgba(0,209,255,0.2)] rounded-xl font-bold text-sm transition-all duration-300 group"
                  >
                    <MessageSquare className="w-5 h-5 group-hover:scale-110 transition-transform" />
                    تواصل معي
                  </button>
                )}
              </div>
            </div>

            <div className="prose prose-invert max-w-none text-gray-300 mb-8 bg-black/20 p-6 rounded-xl border border-white/5 text-right">
              {isEditingDesc ? (
                <div className="space-y-4 font-cairo">
                  {/* Price */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-cesar-gray">السعر (جنيه)</label>
                    <input
                      type="number"
                      min="1"
                      value={tempPrice}
                      onChange={(e) => setTempPrice(e.target.value)}
                      className="w-full bg-cesar-darker border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-cesar-cyan/50 text-sm font-cairo"
                      placeholder="أدخل السعر..."
                      disabled={updatingDesc}
                      dir="ltr"
                    />
                  </div>
                  {/* Category */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-cesar-gray">الفئة</label>
                    <select
                      value={tempCategory}
                      onChange={(e) => setTempCategory(e.target.value)}
                      className="w-full bg-cesar-darker border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-cesar-cyan/50 text-sm font-cairo"
                      disabled={updatingDesc}
                    >
                      {CATEGORIES.map((cat) => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>
                  {/* Description */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-cesar-gray">الوصف</label>
                    <textarea
                      value={tempDesc}
                      onChange={(e) => setTempDesc(e.target.value)}
                      className="w-full min-h-[120px] bg-cesar-darker border border-white/10 rounded-xl p-4 text-white placeholder-slate-500 focus:outline-none focus:border-cesar-cyan/50 text-sm leading-relaxed text-right font-cairo"
                      placeholder="عدل وصف الإعلان هنا..."
                      disabled={updatingDesc}
                    />
                  </div>
                  <div className="flex gap-2 justify-end">
                    <button
                      type="button"
                      onClick={() => setIsEditingDesc(false)}
                      disabled={updatingDesc}
                      className="px-4 py-2 rounded-xl text-sm font-bold text-cesar-gray hover:text-white transition duration-200"
                    >
                      إلغاء
                    </button>
                    <button
                      type="button"
                      onClick={handleSaveDescription}
                      disabled={updatingDesc}
                      className="px-5 py-2 rounded-xl text-sm font-bold text-white bg-cesar-cyan/20 border border-cesar-cyan/40 hover:bg-cesar-cyan/30 hover:shadow-neon-cyan transition duration-300 disabled:opacity-50"
                    >
                      {updatingDesc ? "جاري الحفظ..." : "حفظ التعديلات"}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="relative group/desc">
                  <p className="leading-relaxed whitespace-pre-wrap text-lg">
                    {post.description}
                  </p>
                  {isAdmin && (
                    <div className="mt-4 flex justify-end">
                      <button
                        type="button"
                        onClick={() => {
                          setTempDesc(post.description);
                          setTempPrice(post.price);
                          setTempCategory(post.category);
                          setIsEditingDesc(true);
                        }}
                        className="bg-cesar-cyan/10 border border-cesar-cyan/30 hover:bg-cesar-cyan/20 text-cesar-cyan text-xs font-bold px-3 py-1.5 rounded-lg transition duration-200"
                      >
                        تعديل الإعلان (أدمن)
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* ── Owner/Admin Actions ── */}
            {(isOwner || isAdmin) && (
              <div className="bg-black/40 border border-red-500/20 rounded-2xl p-6 mb-6 shadow-lg backdrop-blur-sm text-right">
                <h3 className="text-xl font-bold text-white border-b border-gray-800 pb-3 mb-5">
                  {isAdmin ? "إدارة الإعلان (أدمن)" : "إدارة الإعلان الخاص بك"}
                </h3>
                <div className="flex flex-col sm:flex-row gap-3">
                  {isOwner && post.status === "pending" && (
                    <Link
                      to={`/edit-post/${post._id}`}
                      className="flex-1 flex items-center justify-center gap-2 py-3 border border-cesar-cyan/40 bg-cesar-cyan/10 text-cesar-cyan hover:bg-cesar-cyan/20 hover:shadow-neon-cyan rounded-xl font-bold text-sm transition-all duration-300 text-center"
                    >
                      تعديل الإعلان
                    </Link>
                  )}
                  <button
                    onClick={handleDeletePost}
                    disabled={actionLoading}
                    className="flex-1 flex items-center justify-center gap-2 py-3 bg-red-500/10 border border-red-500/50 hover:bg-red-500/20 text-red-400 hover:shadow-[0_0_15px_rgba(239,68,68,0.3)] rounded-xl font-bold text-sm transition-all duration-300 disabled:opacity-50"
                  >
                    <Trash2 className="w-5 h-5" />
                    حذف الإعلان
                  </button>
                </div>
              </div>
            )}

            {/* ── Seller information ── */}
            {post.user && (
              <div className="bg-black/40 border border-gray-800 rounded-2xl p-6 mt-auto shadow-lg backdrop-blur-sm">
                <h3 className="text-xl font-bold text-white border-b border-gray-800 pb-3 mb-5">
                  معلومات البائع
                </h3>

                <div className="space-y-4">
                  {/* Name — always visible to everyone */}
                  <div className="flex items-center gap-4 text-gray-300">
                    <div className="bg-gray-800/50 p-2 shrink-0 rounded-lg">
                      <User className="w-5 h-5 text-cesar-cyan" />
                    </div>
                    <span className="font-medium text-lg truncate">
                      {post.user.name}
                    </span>
                  </div>

                  {/* Admin-only: Email */}
                  {isAdmin && (
                    <div className="flex items-center gap-4 text-gray-300">
                      <div className="bg-gray-800/50 p-2 shrink-0 rounded-lg">
                        <Mail className="w-5 h-5 text-cesar-cyan" />
                      </div>
                      <span
                        dir="ltr"
                        className="font-medium break-all text-sm sm:text-base"
                      >
                        {post.user.email}
                      </span>
                    </div>
                  )}

                  {/* Admin-only: raw phone number */}
                  {isAdmin && post.user.phoneNumber && (
                    <div className="flex items-center gap-4 text-gray-300">
                      <div className="bg-gray-800/50 p-2 shrink-0 rounded-lg">
                        <Phone className="w-5 h-5 text-cesar-cyan" />
                      </div>
                      <span dir="ltr" className="font-medium tracking-wide">
                        {post.user.phoneNumber}
                      </span>
                    </div>
                  )}
                </div>


              </div>
            )}
          </div>

          {/* Rejection Modal */}
          {isRejectModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="relative w-full max-w-md overflow-hidden rounded-[2rem] border border-white/5 bg-cesar-dark p-6 text-right shadow-2xl"
              >
                <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-rose-500 to-transparent"></div>
                
                <div className="flex items-center justify-between border-b border-white/5 pb-3 mb-5">
                  <button
                    type="button"
                    onClick={() => setIsRejectModalOpen(false)}
                    className="text-slate-400 hover:text-white transition"
                  >
                    <X className="h-5 w-5" />
                  </button>
                  <h3 className="text-lg font-bold text-white">رفض المنشور</h3>
                </div>

                <form onSubmit={handleRejectSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-300 mr-1">سبب الرفض</label>
                    <textarea
                      required
                      rows="3"
                      value={rejectionReason}
                      onChange={(e) => setRejectionReason(e.target.value)}
                      placeholder="اكتب سببًا واضحًا ومختصرًا لرفض المنشور..."
                      className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-sm text-white outline-none focus:border-rose-500 focus:shadow-[0_0_10px_rgba(244,63,94,0.3)] transition resize-none"
                    />
                  </div>

                  <div className="flex justify-end gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setIsRejectModalOpen(false)}
                      className="px-4 py-2 text-sm font-medium text-slate-400 hover:text-white transition"
                    >
                      إلغاء
                    </button>
                    <button
                      type="submit"
                      disabled={actionLoading || !rejectionReason.trim()}
                      className="inline-flex items-center gap-2 px-5 py-2.5 bg-rose-500/10 border border-rose-500/50 hover:bg-rose-500/20 text-rose-300 rounded-xl font-bold text-sm transition-all disabled:opacity-50"
                    >
                      {actionLoading && <Loader2 className="h-4 w-4 animate-spin" />}
                      تأكيد الرفض
                    </button>
                  </div>
                </form>
              </motion.div>
            </div>
          )}

          {/* Fullscreen Lightbox Modal */}
          {isLightboxOpen && (
            <div
              onClick={() => setIsLightboxOpen(false)}
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-md animate-fadeIn p-4 md:p-8"
            >
              {/* Close Button */}
              <button
                type="button"
                onClick={() => setIsLightboxOpen(false)}
                className="absolute top-6 right-6 flex h-12 w-12 items-center justify-center rounded-xl border border-white/10 bg-black/50 text-white hover:bg-white hover:text-black hover:scale-105 transition-all duration-300 z-50 focus:outline-none"
              >
                <X className="h-6 w-6" />
              </button>

              {/* Navigation Arrows */}
              {post.images && post.images.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handlePrev();
                    }}
                    className="absolute right-4 md:right-8 top-1/2 -translate-y-1/2 flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-black/60 text-white hover:bg-cesar-cyan hover:text-black hover:border-cesar-cyan hover:shadow-neon-cyan transition duration-300 backdrop-blur-sm focus:outline-none z-50"
                  >
                    <ChevronRight className="w-8 h-8" />
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleNext();
                    }}
                    className="absolute left-4 md:left-8 top-1/2 -translate-y-1/2 flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-black/60 text-white hover:bg-cesar-cyan hover:text-black hover:border-cesar-cyan hover:shadow-neon-cyan transition duration-300 backdrop-blur-sm focus:outline-none z-50"
                  >
                    <ChevronLeft className="w-8 h-8" />
                  </button>
                </>
              )}

              {/* Active Image */}
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                onClick={(e) => e.stopPropagation()}
                className="relative max-w-full max-h-full select-none"
              >
                <img
                  src={optimizeImage(post.images[currentImageIndex])}
                  alt={`${post.category || "إعلان"}-lightbox`}
                  className="max-w-[90vw] max-h-[85vh] object-contain rounded-2xl shadow-[0_0_50px_rgba(0,0,0,0.8)] border border-white/5"
                />
              </motion.div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PostDetailsPage;