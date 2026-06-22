import { useTranslation } from "react-i18next";
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Loader2, Search, Tags, User, ArrowLeft, Sparkles } from "lucide-react";
import api from "../Services/api.js";
import { normalizeText, matchesCategory } from "../utils/postHelpers.js";
import useDocumentTitle from "../hooks/useDocumentTitle.js";

const categoryOptions = [
  { value: "all", label: "الكل" },
  { value: "ألعاب", label: "ألعاب" },
  { value: "حسابات سوشيال ميديا", label: "حسابات سوشيال ميديا" },
  { value: "أخرى", label: "أخرى" },
];


function PostsPage() {
  const { t, i18n } = useTranslation();
  useDocumentTitle(t("nav.logo") + " | " + t("nav.posts"));

  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");

  useEffect(() => {
    let isMounted = true;

    const fetchPosts = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await api.get("/posts");

        if (isMounted) {
          setPosts(Array.isArray(response.data) ? response.data : []);
        }
      } catch (requestError) {
        if (isMounted) {
          setError(
            requestError.response?.data?.message ||
              "تعذر تحميل المنشورات حالياً.",
          );
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchPosts();

    return () => {
      isMounted = false;
    };
  }, []);

  const filteredPosts = useMemo(() => {
    const normalizedQuery = normalizeText(searchQuery);

    return posts.filter((post) => {
      const matchesSearch =
        normalizedQuery.length === 0 ||
        normalizeText(post.title).includes(normalizedQuery) ||
        normalizeText(post.description).includes(normalizedQuery);

      return matchesSearch && matchesCategory(post.category, selectedCategory);
    });
  }, [posts, searchQuery, selectedCategory]);

  return (
    <section
      dir={i18n.dir()}
      className="relative isolate min-h-screen overflow-hidden bg-cesar-darker px-4 py-6 font-cairo text-white sm:px-6 lg:px-8"
    >
      <div className="pointer-events-none absolute inset-x-0 top-0 h-72 bg-gradient-to-b from-black/70 via-black/45 to-transparent" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-44 bg-[radial-gradient(circle_at_center,rgba(0,240,255,0.18),transparent_60%)] opacity-70 blur-3xl" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-24 border-b border-white/5 bg-black/35 backdrop-blur-sm" />

      <div className="relative z-10 mx-auto flex w-full max-w-7xl flex-col gap-8">
        <motion.header
          initial={{ opacity: 0, y: -22 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, ease: "easeOut" }}
          className="space-y-6 pt-4 text-right"
        >
          <div className="inline-flex items-center gap-2 rounded-full border border-white/8 bg-white/5 px-4 py-2 text-xs font-semibold uppercase tracking-[0.35em] text-cesar-gray backdrop-blur">
            <Sparkles className="h-4 w-4 text-cesar-cyan" />
            Public Marketplace
          </div>

          <div className="grid gap-4 rounded-[2rem] border border-white/5 bg-cesar-dark/85 p-5 shadow-2xl shadow-black/30 backdrop-blur-xl lg:grid-cols-[1.1fr_0.9fr] lg:p-6">
            <div className="space-y-3">
              <h1 className="text-3xl font-bold leading-tight text-white sm:text-4xl lg:text-3xl">
                تصفح المنشورات المعتمدة في المتجر
              </h1>
              <p className="max-w-2xl text-sm leading-7 text-cesar-gray sm:text-base lg:text-sm lg:leading-6">
                ابحث بسرعة داخل المنشورات المفعلة واستخدم الفلتر للوصول إلى
                الفئة التي تريدها دون تشتيت.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <label className="group relative overflow-hidden rounded-2xl border border-white/5 bg-black/30 p-4 transition focus-within:border-cesar-cyan/30 focus-within:shadow-neon-cyan">
                <span className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-cesar-gray">
                  <Search className="h-4 w-4 text-cesar-cyan" />
                  ابحث
                </span>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  placeholder="ابحث باسم المنشور أو الوصف..."
                  className="w-full bg-transparent text-sm text-white outline-none placeholder:text-slate-500"
                />
              </label>

              <label className="group relative overflow-hidden rounded-2xl border border-white/5 bg-black/30 p-4 transition focus-within:border-cesar-cyan/30 focus-within:shadow-neon-cyan">
                <span className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-cesar-gray">
                  <Tags className="h-4 w-4 text-cesar-cyan" />
                  الفئة
                </span>
                <select
                  value={selectedCategory}
                  onChange={(event) => setSelectedCategory(event.target.value)}
                  className="w-full appearance-none bg-transparent text-sm text-white outline-none"
                >
                  {categoryOptions.map((option) => (
                    <option
                      key={option.value}
                      value={option.value}
                      className="bg-cesar-darker text-white"
                    >
                      {t(`enums.${option.value}`, { defaultValue: option.label })}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </div>
        </motion.header>

        {loading ? (
          <div className="flex min-h-[52vh] items-center justify-center rounded-[2rem] border border-white/5 bg-cesar-dark/70 backdrop-blur-md">
            <div className="flex items-center gap-3 text-cesar-cyan">
              <Loader2 className="h-6 w-6 animate-spin" />
              <span className="text-sm font-medium">
                جارٍ تحميل المنشورات...
              </span>
            </div>
          </div>
        ) : error ? (
          <div className="rounded-[2rem] border border-red-500/20 bg-red-500/10 p-6 text-right text-sm text-red-300 shadow-2xl shadow-red-950/10 backdrop-blur-md">
            {error}
          </div>
        ) : filteredPosts.length === 0 ? (
          <div className="rounded-[2rem] border border-white/5 bg-cesar-dark/70 p-10 text-center shadow-2xl shadow-black/30 backdrop-blur-md">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl border border-cesar-cyan/20 bg-cesar-cyan/10 text-cesar-cyan">
              <User className="h-8 w-8" />
            </div>
            <h2 className="text-xl font-bold text-white">لا توجد نتائج</h2>
            <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-cesar-gray">
              لم نعثر على منشورات تطابق البحث أو الفئة المحددة حاليًا.
            </p>
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.35 }}
            className="grid gap-5 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 items-stretch"
          >
            {filteredPosts.map((post, index) => {
              const imageUrl = Array.isArray(post.images)
                ? post.images[0]
                : post.images || "";
              const userName = post.user?.name || "غير متوفر";

              return (
                <motion.article
                  key={post._id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    duration: 0.25,
                    delay: Math.min(index * 0.05, 0.25),
                  }}
                  className="flex h-full flex-col overflow-hidden rounded-[1.75rem] border border-white/5 bg-cesar-dark/80 shadow-2xl shadow-black/40 backdrop-blur-md"
                >
                  <div className="relative aspect-[16/10] shrink-0 overflow-hidden bg-black/40">
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

                    {post.createdAt && (
                      <span
                        className={`absolute top-2 bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-full text-[10px] font-medium text-slate-200 border border-white/10 z-10 shadow-lg ${
                          i18n.dir() === "rtl" ? "left-2" : "right-2"
                        }`}
                      >
                        {(() => {
                          const locale = i18n.language === "ar" ? "ar-EG" : "en-US";
                          const date = new Date(post.createdAt);
                          const formattedDate = date.toLocaleDateString(locale, { year: "numeric", month: "short", day: "numeric" });
                          const formattedTime = date.toLocaleTimeString(locale, { hour: "2-digit", minute: "2-digit" });
                          return `${formattedDate} • ${formattedTime}`;
                        })()}
                      </span>
                    )}

                    <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/80 to-transparent" />
                    <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between gap-3">
                      <span className="inline-flex items-center gap-2 rounded-full border border-cesar-cyan/20 bg-black/55 px-3 py-1.5 text-xs font-semibold text-cesar-cyan backdrop-blur-sm">
                        <Tags className="h-4 w-4" />
                        {t(`enums.${post.category}`, { defaultValue: post.category || t("enums.غير محدد", { defaultValue: "غير محدد" }) })}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-1 flex-col justify-between p-5 text-right">
                    <div className="space-y-2">
                      <h2 className="line-clamp-2 text-lg font-bold text-white">
                        {post.title}
                      </h2>
                      <p className="line-clamp-2 text-sm leading-6 text-cesar-gray">
                        {post.description}
                      </p>
                    </div>

                    <div className="mt-4 flex flex-col gap-3">
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
                      </div>

                      <Link
                        to={`/posts/${post._id}`}
                        className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-cesar-cyan/40 bg-cesar-cyan/10 px-4 py-3 font-bold text-cesar-cyan transition duration-300 hover:bg-cesar-cyan/20 hover:shadow-neon-cyan"
                      >
                        عرض التفاصيل
                        <ArrowLeft className="h-4 w-4" />
                      </Link>
                    </div>
                  </div>
                </motion.article>
              );
            })}
          </motion.div>
        )}
      </div>
    </section>
  );
}

export default PostsPage;
