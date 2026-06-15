import { useState, useRef, useMemo, useEffect } from "react";
import { motion } from "framer-motion";
import {
  AlignRight,
  DollarSign,
  FileText,
  ImagePlus,
  PoundSterling,
  Loader2,
  Tags,
  X,
} from "lucide-react";
import { toast } from "react-toastify";
import api from "../Services/api.js";

const initialForm = {
  title: "",
  category: "",
  price: "",
  description: "",
};

function AddPostPage() {
  const [formData, setFormData] = useState(initialForm);
  const [selectedImages, setSelectedImages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [fileInputKey, setFileInputKey] = useState(0);

  const objectUrlCache = useRef(new Map());

  const getObjectURL = (file) => {
    if (typeof file === "string") return file;
    if (!objectUrlCache.current.has(file)) {
      objectUrlCache.current.set(file, URL.createObjectURL(file));
    }
    return objectUrlCache.current.get(file);
  };

  useEffect(() => {
    return () => {
      objectUrlCache.current.forEach((url) => URL.revokeObjectURL(url));
    };
  }, []);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (event) => {
    const files = Array.from(event.target.files || []);
    const totalFiles = [...selectedImages, ...files];
    if (totalFiles.length > 5) {
      toast.error("لا يمكنك رفع أكثر من 5 صور");
      setSelectedImages(totalFiles.slice(0, 5));
    } else {
      setSelectedImages(totalFiles);
    }
  };

  const handleRemoveImage = (index) => {
    const fileToRemove = selectedImages[index];
    if (fileToRemove && typeof fileToRemove !== "string") {
      const cachedUrl = objectUrlCache.current.get(fileToRemove);
      if (cachedUrl) {
        URL.revokeObjectURL(cachedUrl);
        objectUrlCache.current.delete(fileToRemove);
      }
    }
    setSelectedImages((prev) => prev.filter((_, i) => i !== index));
  };

  const resetForm = () => {
    setFormData(initialForm);
    setSelectedImages([]);
    setFileInputKey((prev) => prev + 1);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    if (selectedImages.length === 0) {
      setError("يجب اختيار صورة واحدة على الأقل");
      setLoading(false);
      return;
    }

    const payload = new FormData();
    payload.append("title", formData.title.trim());
    payload.append("category", formData.category);
    payload.append("price", formData.price);
    payload.append("description", formData.description.trim());
    selectedImages.forEach(file => payload.append("images", file));

    try {
      await api.post("/posts", payload, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      setSuccess("تم إرسال إعلانك بنجاح وهو الآن قيد المراجعة من الإدارة.");
      resetForm();
    } catch (requestError) {
      setError(
        requestError.response?.data?.message ||
          "تعذر إرسال الإعلان. حاول مرة أخرى لاحقاً.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div dir="rtl" className="min-h-screen px-4 py-10 font-cairo">
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
            <h1 className="text-3xl font-bold text-white">إضافة إعلان جديد</h1>
            <p className="mt-2 text-sm leading-6 text-cesar-gray">
              أنشئ إعلانك الآن وسيتم مراجعته قبل النشر على المنصة.
            </p>
          </div>
        </div>

        {error ? (
          <div className="mb-6 rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-300">
            {error}
          </div>
        ) : null}

        {success ? (
          <div className="mb-6 rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-sm text-emerald-300">
            {success}
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
                  {/* <DollarSign className="h-5 w-5" /> */}
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
              صور الإعلان (حد أقصى 5 صور)
            </label>
            <label className="flex cursor-pointer items-center gap-4 rounded-xl border border-dashed border-white/10 bg-black/40 px-4 py-4 transition hover:border-cesar-cyan/60 hover:bg-black/50">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-cesar-cyan/20 bg-cesar-cyan/10 text-cesar-cyan">
                <ImagePlus className="h-6 w-6" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-white">
                  اختر صور للإعلان (حد أقصى 5 صور)
                </p>
                <p className="mt-1 truncate text-sm text-cesar-gray">
                  {selectedImages.length > 0
                    ? `تم اختيار ${selectedImages.length} صور`
                    : "PNG, JPG, JPEG, WEBP"}
                </p>
              </div>
              <input
                key={fileInputKey}
                type="file"
                accept="image/*"
                multiple
                onChange={handleFileChange}
                className="hidden"
              />
            </label>
            {selectedImages.length > 0 && (
              <div className="flex flex-wrap gap-3 pt-2">
                {selectedImages.map((file, index) => {
                  const url = getObjectURL(file);
                  return (
                    <div
                      key={index}
                      className="relative h-24 w-24 rounded-xl border border-white/10 bg-black/40"
                    >
                      <img
                        src={url}
                        alt={`preview-${index}`}
                        className="h-full w-full object-cover rounded-xl"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveImage(index)}
                        className="absolute -top-2 -left-2 flex h-6 w-6 items-center justify-center rounded-full border border-red-500 bg-red-950/80 text-red-500 hover:bg-red-500 hover:text-white hover:shadow-[0_0_12px_rgba(239,68,68,0.8)] transition duration-200 text-xs font-bold focus:outline-none"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
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
              "إرسال الإعلان"
            )}
          </button>
        </form>
      </motion.div>
    </div>
  );
}

export default AddPostPage;
