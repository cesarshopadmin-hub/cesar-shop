import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  AlignRight,
  FileText,
  ImagePlus,
  PoundSterling,
  Loader2,
  Tags,
} from "lucide-react";
import { toast } from "react-toastify";
import api from "../Services/api.js";

const initialForm = {
  title: "",
  category: "",
  price: "",
  description: "",
};

function EditPostPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [formData, setFormData] = useState(initialForm);
  const [selectedImage, setSelectedImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(true);
  const [error, setError] = useState("");
  const [fileInputKey, setFileInputKey] = useState(0);

  useEffect(() => {
    const fetchPost = async () => {
      try {
        const { data } = await api.get(`/posts/${id}`);
        setFormData({
          title: data.title || "",
          category: data.category || "",
          price: data.price || "",
          description: data.description || "",
        });
      } catch (err) {
        toast.error("تعذر جلب تفاصيل الإعلان");
        navigate("/profile");
      } finally {
        setFetchLoading(false);
      }
    };
    fetchPost();
  }, [id, navigate]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (event) => {
    const file = event.target.files?.[0] || null;
    setSelectedImage(file);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError("");

    const payload = new FormData();
    payload.append("title", formData.title.trim());
    payload.append("category", formData.category);
    payload.append("price", formData.price);
    payload.append("description", formData.description.trim());
    if (selectedImage) {
      payload.append("images", selectedImage);
    }

    try {
      await api.put(`/posts/${id}`, payload, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      toast.success("تم تعديل الإعلان وإرساله للمراجعة");
      navigate("/profile");
    } catch (requestError) {
      setError(
        requestError.response?.data?.message ||
          "تعذر تعديل الإعلان. حاول مرة أخرى لاحقاً.",
      );
    } finally {
      setLoading(false);
    }
  };

  if (fetchLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-black/90">
        <Loader2 className="h-10 w-10 animate-spin text-cesar-cyan" />
      </div>
    );
  }

  return (
    <div dir="rtl" className="min-h-screen px-4 py-10 font-cairo bg-cesar-darker">
      <motion.div
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="relative mx-auto max-w-2xl overflow-hidden rounded-[2rem] border border-white/5 bg-cesar-dark/80 p-8 shadow-2xl shadow-black/50 backdrop-blur-md"
      >
        <div className="pointer-events-none absolute inset-x-0 top-0 h-[3px] bg-gradient-to-r from-transparent via-cesar-cyan to-transparent" />
        <div className="pointer-events-none absolute -right-20 top-16 h-48 w-48 rounded-full bg-cesar-cyan/10 blur-3xl" />
        <div className="pointer-events-none absolute -left-16 bottom-10 h-40 w-40 rounded-full bg-white/5 blur-3xl" />

        <div className="relative mb-8 space-y-3 text-right">
          <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl border border-cesar-cyan/20 bg-cesar-cyan/10 text-cesar-cyan shadow-neon-cyan/30">
            <FileText className="h-7 w-7" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-white">تعديل الإعلان</h1>
            <p className="mt-2 text-sm leading-6 text-cesar-gray">
              قم بتعديل تفاصيل الإعلان وسيتم إرساله للمراجعة مرة أخرى.
            </p>
          </div>
        </div>

        {error ? (
          <div className="mb-6 rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-300">
            {error}
          </div>
        ) : null}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <label className="mr-1 text-sm font-medium text-slate-300">
              عنوان الإعلان
            </label>
            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-4 text-slate-500">
                <FileText className="h-5 w-5" />
              </div>
              <input
                type="text"
                name="title"
                required
                value={formData.title}
                onChange={handleChange}
                placeholder="مثال: حساب PUBG مستوى متقدم"
                className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 pl-4 pr-11 text-white outline-none transition focus:border-cesar-cyan focus:ring-1 focus:ring-cesar-cyan focus:shadow-neon-cyan"
              />
            </div>
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            <div className="space-y-2">
              <label className="mr-1 text-sm font-medium text-slate-300">
                الفئة
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-4 text-slate-500">
                  <Tags className="h-5 w-5" />
                </div>
                <select
                  name="category"
                  required
                  value={formData.category}
                  onChange={handleChange}
                  className="w-full appearance-none rounded-xl border border-white/10 bg-black/40 px-4 py-3 pl-4 pr-11 text-white outline-none transition focus:border-cesar-cyan focus:ring-1 focus:ring-cesar-cyan focus:shadow-neon-cyan"
                >
                  <option value="" disabled>
                    اختر الفئة
                  </option>
                  <option value="ألعاب (PUBG, FreeFire...)">
                    ألعاب (PUBG, FreeFire...)
                  </option>
                  <option value="حسابات تيك توك">حسابات تيك توك</option>
                  <option value="حسابات سوشيال ميديا">
                    حسابات سوشيال ميديا
                  </option>
                  <option value="أخرى">أخرى</option>
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <label className="mr-1 text-sm font-medium text-slate-300">
                السعر
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-4 text-slate-500">
                  <PoundSterling className="h-5 w-5" />
                </div>
                <input
                  type="number"
                  name="price"
                  required
                  min="0"
                  step="0.01"
                  value={formData.price}
                  onChange={handleChange}
                  placeholder="0"
                  className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 pl-4 pr-11 text-white outline-none transition focus:border-cesar-cyan focus:ring-1 focus:ring-cesar-cyan focus:shadow-neon-cyan"
                />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <label className="mr-1 text-sm font-medium text-slate-300">
              وصف الإعلان
            </label>
            <div className="relative">
              <div className="pointer-events-none absolute right-0 top-3 flex items-start pr-4 text-slate-500">
                <AlignRight className="h-5 w-5" />
              </div>
              <textarea
                name="description"
                required
                rows="4"
                value={formData.description}
                onChange={handleChange}
                placeholder="اكتب تفاصيل الحساب، المستوى، المزايا، وأي معلومات مهمة للمشتري..."
                className="w-full resize-none rounded-xl border border-white/10 bg-black/40 px-4 py-3 pl-4 pr-11 text-white outline-none transition focus:border-cesar-cyan focus:ring-1 focus:ring-cesar-cyan focus:shadow-neon-cyan"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="mr-1 text-sm font-medium text-slate-300">
              صورة الإعلان (اختياري، لتغيير الصورة الحالية)
            </label>
            <label className="flex cursor-pointer items-center gap-4 rounded-xl border border-dashed border-white/10 bg-black/40 px-4 py-4 transition hover:border-cesar-cyan/60 hover:bg-black/50">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-cesar-cyan/20 bg-cesar-cyan/10 text-cesar-cyan">
                <ImagePlus className="h-6 w-6" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-white">
                  اختر صورة جديدة للإعلان
                </p>
                <p className="mt-1 truncate text-sm text-cesar-gray">
                  {selectedImage ? selectedImage.name : "PNG, JPG, JPEG, WEBP"}
                </p>
              </div>
              <input
                key={fileInputKey}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />
            </label>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-cesar-cyan/50 bg-cesar-cyan/10 px-4 py-3.5 font-bold text-cesar-cyan transition duration-300 hover:bg-cesar-cyan/20 hover:shadow-neon-cyan disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                جاري الإرسال...
              </>
            ) : (
              "إرسال التعديلات"
            )}
          </button>
        </form>
      </motion.div>
    </div>
  );
}

export default EditPostPage;
