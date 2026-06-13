import { useEffect, useState, useRef } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  CheckCircle,
  Clock,
  Loader2,
  Mail,
  Phone,
  User,
  XCircle,
  Camera,
  Edit2,
  Save,
  X,
} from "lucide-react";
import api from "../Services/api.js";
import { useAuth } from "../context/AuthContext.jsx";

const statusMeta = {
  pending: {
    label: "قيد المراجعة",
    className:
      "border-yellow-500/30 bg-yellow-500/10 text-yellow-300 shadow-[0_0_18px_rgba(234,179,8,0.15)]",
    icon: Clock,
  },
  approved: {
    label: "مقبول",
    className:
      "border-emerald-500/30 bg-emerald-500/10 text-emerald-300 shadow-[0_0_18px_rgba(16,185,129,0.15)]",
    icon: CheckCircle,
  },
  rejected: {
    label: "مرفوض",
    className:
      "border-red-500/30 bg-red-500/10 text-red-300 shadow-[0_0_18px_rgba(239,68,68,0.15)]",
    icon: XCircle,
  },
};

function ProfilePage() {
  const { user, updateUser } = useAuth();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fileInputRef = useRef(null);
  const [uploadingImage, setUploadingImage] = useState(false);

  const currentUser = user?.name ? user : user?.user;
  const profilePictureUrl = currentUser?.profilePictureUrl;

  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: currentUser?.name || "",
    phoneNumber: currentUser?.phoneNumber || "",
  });

  useEffect(() => {
    let isMounted = true;
    const fetchMyPosts = async () => {
      try {
        setLoading(true);
        setError("");
        const response = await api.get("/posts/my-posts");
        if (isMounted) {
          setPosts(Array.isArray(response.data) ? response.data : []);
        }
      } catch (requestError) {
        if (isMounted) {
          setError(
            requestError.response?.data?.message ||
              "تعذر تحميل المنشورات الخاصة بك.",
          );
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };
    fetchMyPosts();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleImageClick = () => {
    fileInputRef.current.click();
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploadingImage(true);
    const form = new FormData();
    form.append("profilePicture", file);

    try {
      const response = await api.put("/auth/profile-picture", form, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      if (response.data && response.data.profilePictureUrl) {
        updateUser({ profilePictureUrl: response.data.profilePictureUrl });
      }
    } catch (error) {
      console.error("Error uploading image:", error);
      alert("حدث خطأ أثناء رفع الصورة");
    } finally {
      setUploadingImage(false);
    }
  };

  const handleUpdateProfile = async () => {
    try {
      setIsSaving(true);
      const response = await api.put("/auth/profile", formData);
      if (response.data) {
        updateUser({
          name: response.data.name,
          phoneNumber: response.data.phoneNumber,
        });
        setIsEditing(false);
      }
    } catch (error) {
      console.error("Error updating profile:", error);
      alert("حدث خطأ أثناء تحديث البيانات");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div dir="rtl" className="min-h-screen px-4 py-10 font-cairo">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="mx-auto max-w-7xl space-y-8"
      >
        <section className="relative overflow-hidden rounded-[2rem] border border-white/5 bg-cesar-dark/80 p-8 shadow-2xl shadow-black/50 backdrop-blur-md">
          <div className="pointer-events-none absolute inset-x-0 top-0 h-[3px] bg-gradient-to-r from-transparent via-cesar-cyan to-transparent" />
          <div className="pointer-events-none absolute -right-20 top-12 h-48 w-48 rounded-full bg-cesar-cyan/10 blur-3xl" />

          <div className="relative flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
            <div className="flex items-start gap-4 text-right w-full md:w-auto">
              <div
                className="relative group cursor-pointer shrink-0"
                onClick={handleImageClick}
                title="تغيير الصورة الشخصية"
              >
                {uploadingImage ? (
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-cesar-cyan/20 bg-cesar-cyan/10 text-cesar-cyan shadow-neon-cyan">
                    <Loader2 className="h-6 w-6 animate-spin" />
                  </div>
                ) : profilePictureUrl ? (
                  <div className="relative h-16 w-16">
                    <img
                      src={profilePictureUrl}
                      alt={currentUser?.name}
                      className="h-full w-full rounded-2xl object-cover border border-cesar-cyan/30 group-hover:border-cesar-cyan transition shadow-neon-cyan"
                    />
                    <div className="absolute inset-0 bg-black/40 rounded-2xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition">
                      <Camera className="h-6 w-6 text-white" />
                    </div>
                  </div>
                ) : (
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-cesar-cyan/20 bg-cesar-cyan/10 text-cesar-cyan shadow-neon-cyan group-hover:border-cesar-cyan transition">
                    <Camera className="h-7 w-7" />
                  </div>
                )}
                <input
                  type="file"
                  accept="image/*"
                  ref={fileInputRef}
                  onChange={handleImageUpload}
                  className="hidden"
                />
              </div>

              <div className="space-y-2 flex-1">
                <div className="flex items-center justify-between w-full">
                  <p className="text-sm text-cesar-gray">الملف الشخصي</p>
                  {!isEditing ? (
                    <button
                      onClick={() => setIsEditing(true)}
                      className="text-cesar-cyan hover:text-white transition flex items-center gap-1 text-sm"
                    >
                      <Edit2 className="h-4 w-4" /> تعديل
                    </button>
                  ) : (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={handleUpdateProfile}
                        disabled={isSaving}
                        className="text-emerald-400 hover:text-emerald-300 transition flex items-center gap-1 text-sm disabled:opacity-50"
                      >
                        {isSaving ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Save className="h-4 w-4" />
                        )}{" "}
                        حفظ
                      </button>
                      <button
                        onClick={() => setIsEditing(false)}
                        disabled={isSaving}
                        className="text-red-400 hover:text-red-300 transition flex items-center gap-1 text-sm disabled:opacity-50"
                      >
                        <X className="h-4 w-4" /> إلغاء
                      </button>
                    </div>
                  )}
                </div>

                {isEditing ? (
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    className="w-full max-w-xs bg-black/40 border border-white/10 text-white rounded-lg px-3 py-1 focus:border-cesar-cyan focus:ring-1 focus:ring-cesar-cyan transition outline-none text-2xl font-bold"
                  />
                ) : (
                  <h1 className="text-3xl font-bold text-white">
                    {currentUser?.name || "الزائر"}
                  </h1>
                )}

                <p className="max-w-2xl text-sm leading-6 text-slate-300">
                  تابع تفاصيل حسابك والمنشورات التي أرسلتها وحالتها الحالية من
                  هنا.
                </p>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-3 w-full md:w-auto mt-4 md:mt-0">
              <div className="rounded-2xl border border-white/5 bg-black/30 px-4 py-3 text-right">
                <div className="mb-2 flex items-center justify-end gap-2 text-cesar-gray">
                  <Mail className="h-4 w-4" />
                  <span className="text-xs">البريد الإلكتروني</span>
                </div>
                <p className="truncate text-sm font-semibold text-white">
                  {currentUser?.email || "غير متوفر"}
                </p>
              </div>
              <div className="rounded-2xl border border-white/5 bg-black/30 px-4 py-3 text-right">
                <div className="mb-2 flex items-center justify-end gap-2 text-cesar-gray">
                  <Phone className="h-4 w-4" />
                  <span className="text-xs">رقم الهاتف</span>
                </div>
                {isEditing ? (
                  <input
                    type="tel"
                    value={formData.phoneNumber}
                    onChange={(e) =>
                      setFormData({ ...formData, phoneNumber: e.target.value })
                    }
                    className="w-full bg-black/40 border border-white/10 text-white rounded-lg px-2 py-1 focus:border-cesar-cyan focus:ring-1 focus:ring-cesar-cyan transition outline-none text-sm font-semibold text-right"
                    dir="ltr"
                  />
                ) : (
                  <p
                    className="truncate text-sm font-semibold text-white"
                    dir="ltr"
                  >
                    {currentUser?.phoneNumber || "غير متوفر"}
                  </p>
                )}
              </div>
              <div className="rounded-2xl border border-white/5 bg-black/30 px-4 py-3 text-right">
                <div className="mb-2 flex items-center justify-end gap-2 text-cesar-gray">
                  <Clock className="h-4 w-4" />
                  <span className="text-xs">إجمالي المنشورات</span>
                </div>
                <p className="text-sm font-semibold text-white">
                  {posts.length} إعلان
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="space-y-4">
          <div className="flex items-center justify-between gap-3 text-right">
            <div>
              <h2 className="text-2xl font-bold text-white">إعلاناتي</h2>
              <p className="mt-1 text-sm text-cesar-gray">
                عرض جميع الإعلانات التي قمت بإرسالها وحالتها في النظام.
              </p>
            </div>
          </div>

          {loading ? (
            <div className="flex min-h-[40vh] items-center justify-center rounded-[2rem] border border-white/5 bg-cesar-dark/60 backdrop-blur-md">
              <div className="flex items-center gap-3 text-cesar-cyan">
                <Loader2 className="h-6 w-6 animate-spin" />
                <span className="text-sm font-medium">
                  جارٍ تحميل المنشورات...
                </span>
              </div>
            </div>
          ) : error ? (
            <div className="rounded-[2rem] border border-red-500/20 bg-red-500/10 p-6 text-right text-sm text-red-300">
              {error}
            </div>
          ) : posts.length === 0 ? (
            <div className="rounded-[2rem] border border-white/5 bg-cesar-dark/70 p-10 text-center shadow-2xl shadow-black/40 backdrop-blur-md">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl border border-cesar-cyan/20 bg-cesar-cyan/10 text-cesar-cyan">
                <User className="h-8 w-8" />
              </div>
              <h3 className="text-xl font-bold text-white">
                لا توجد إعلانات بعد
              </h3>
              <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-cesar-gray">
                لم تقم بإضافة أي إعلان حتى الآن. ابدأ الآن وأنشئ أول إعلان لك
                على المنصة.
              </p>
              <Link
                to="/add-post"
                className="mt-6 inline-flex items-center justify-center rounded-xl border border-cesar-cyan/50 bg-cesar-cyan/10 px-6 py-3 text-sm font-bold text-cesar-cyan transition duration-300 hover:bg-cesar-cyan/20 hover:shadow-neon-cyan"
              >
                إضافة إعلان جديد
              </Link>
            </div>
          ) : (
            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {posts.map((post) => {
                const meta = statusMeta[post.status] || statusMeta.pending;
                const StatusIcon = meta.icon;
                const imageUrl =
                  Array.isArray(post.images) && post.images[0]
                    ? post.images[0]
                    : "";

                return (
                  <motion.article
                    key={post._id}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.25 }}
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
                      <div className="absolute bottom-4 right-4 left-4 flex items-center justify-between gap-3">
                        <span
                          className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold ${meta.className}`}
                        >
                          <StatusIcon className="h-4 w-4" />
                          {meta.label}
                        </span>
                        <span className="rounded-full bg-black/50 px-3 py-1.5 text-xs font-medium text-white backdrop-blur-sm">
                          {post.category}
                        </span>
                      </div>
                    </div>

                    <div className="space-y-4 p-5 text-right">
                      <div className="space-y-2">
                        <h3 className="line-clamp-2 text-lg font-bold text-white">
                          {post.title}
                        </h3>
                        <p className="line-clamp-3 text-sm leading-6 text-cesar-gray">
                          {post.description}
                        </p>
                      </div>

                      <div className="flex items-center justify-between gap-3 rounded-2xl border border-white/5 bg-black/30 px-4 py-3">
                        <div>
                          <p className="text-xs text-cesar-gray">السعر</p>
                          <p className="mt-1 text-lg font-bold text-cesar-cyan">
                            {Number(post.price).toLocaleString()} ج.م
                          </p>
                        </div>
                        <div className="text-left text-xs text-cesar-gray">
                          {post.createdAt
                            ? new Date(post.createdAt).toLocaleDateString(
                                "ar-EG",
                              )
                            : ""}
                        </div>
                      </div>

                      {post.status === "rejected" && post.rejectionReason ? (
                        <div className="space-y-3">
                          <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-300">
                            <p className="mb-1 font-semibold">سبب الرفض</p>
                            <p className="leading-6">{post.rejectionReason}</p>
                          </div>

                          <Link
                            to={`/edit-post/${post._id}`}
                            className="flex w-full items-center justify-center gap-2 rounded-xl border border-cesar-cyan/40 bg-cesar-cyan/10 px-4 py-2 text-sm font-bold text-cesar-cyan transition duration-300 hover:bg-cesar-cyan/20 hover:shadow-neon-cyan"
                          >
                            تعديل الإعلان وإعادة التقديم
                          </Link>
                        </div>
                      ) : null}
                    </div>
                  </motion.article>
                );
              })}
            </div>
          )}
        </section>
      </motion.div>
    </div>
  );
}

export default ProfilePage;
