import { useTranslation } from "react-i18next";
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowRight,
  Tag,
  User,
  Mail,
  Phone,
  MessageCircle,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { toast } from "react-toastify";
import api from "../Services/api";

const PostDetailsPage = () => {
  const { t, i18n } = useTranslation();
  const { id } = useParams();
  const navigate = useNavigate();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

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

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
          <div className="flex flex-col">
            <div className="w-full aspect-[4/3] rounded-2xl overflow-hidden border border-cesar-cyan/30 shadow-[0_0_15px_rgba(0,255,255,0.1)] relative group">
              <img
                src={
                  post.images && post.images.length > 0
                    ? post.images[currentImageIndex]
                    : "https://via.placeholder.com/600x400?text=No+Image"
                }
                alt={post.title}
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
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
                      src={img}
                      alt={`${post.title}-${idx}`}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex flex-col">
            <div className="mb-6">
              <div className="inline-flex items-center gap-2 bg-cesar-cyan/10 text-cesar-cyan px-4 py-1.5 rounded-full text-sm font-medium mb-4 border border-cesar-cyan/20 shadow-[0_0_10px_rgba(0,255,255,0.1)]">
                <Tag className="w-4 h-4" />
                <span>{t(`enums.${post.category}`, { defaultValue: post.category || t("enums.غير محدد", { defaultValue: "غير محدد" }) })}</span>
              </div>
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-4 leading-tight">
                {post.title}
              </h1>
              <div className="text-4xl font-black text-cesar-cyan drop-shadow-[0_0_12px_rgba(0,255,255,0.4)]">
                {post.price} جنيه
              </div>
            </div>

            <div className="prose prose-invert max-w-none text-gray-300 mb-8 bg-black/20 p-6 rounded-xl border border-white/5">
              <p className="leading-relaxed whitespace-pre-wrap text-lg">
                {post.description}
              </p>
            </div>

            {post.user && (
              <div className="bg-black/40 border border-gray-800 rounded-2xl p-6 mt-auto shadow-lg backdrop-blur-sm">
                <h3 className="text-xl font-bold text-white border-b border-gray-800 pb-3 mb-5">
                  معلومات البائع
                </h3>

                <div className="space-y-4">
                  <div className="flex items-center gap-4 text-gray-300">
                    <div className="bg-gray-800/50 p-2 shrink-0 rounded-lg">
                      <User className="w-5 h-5 text-cesar-cyan" />
                    </div>
                    <span className="font-medium text-lg truncate">
                      {post.user.name}
                    </span>
                  </div>

                  <div className="flex items-center gap-4 text-gray-300">
                    <div className="bg-gray-800/50 p-2 shrink-0 rounded-lg">
                      <Mail className="w-5 h-5 text-cesar-cyan" />
                    </div>
                    <span dir="ltr" className="font-medium break-all text-sm sm:text-base">
                      {post.user.email}
                    </span>
                  </div>

                  {post.user.phoneNumber && (
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

                {post.user.phoneNumber && (
                  <a
                    href={`https://wa.me/20${post.user.phoneNumber.replace(/^0/, "")}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-6 flex items-center justify-center gap-3 w-full py-4 bg-[#25D366]/10 hover:bg-[#25D366]/20 text-[#25D366] border border-[#25D366]/50 hover:shadow-[0_0_20px_rgba(37,211,102,0.3)] rounded-xl font-bold text-lg transition-all duration-300 group"
                  >
                    <MessageCircle className="w-6 h-6 group-hover:scale-110 transition-transform" />
                    تواصل عبر واتساب
                  </a>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PostDetailsPage;