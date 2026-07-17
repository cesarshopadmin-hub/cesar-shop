import { useTranslation } from "react-i18next";
import { useState, useRef, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  AlignRight,
  FileText,
  ImagePlus,
  PoundSterling,
  DollarSign,
  Coins,
  Loader2,
  Tags,
  X,
} from "lucide-react";
import { toast } from "react-toastify";
import api from "../Services/api.js";
import PhoneInputDefault from "react-phone-input-2";
import "react-phone-input-2/lib/style.css";
import { optimizeImage } from "../utils/imageOptimizer.js";

const PhoneInput = PhoneInputDefault.default || PhoneInputDefault;

const CURRENCIES = [
  { value: "EGP", label: "جنيه مصري", symbol: "ج.م" },
  { value: "USD", label: "دولار أمريكي", symbol: "$" },
  { value: "SAR", label: "ريال سعودي", symbol: "ر.س" },
  { value: "AED", label: "درهم إماراتي", symbol: "د.إ" },
];

const getCurrencyIcon = (value) => {
  switch (value) {
    case "USD": return <DollarSign className="h-5 w-5" />;
    case "SAR":
    case "AED": return <Coins className="h-5 w-5" />;
    default:    return <PoundSterling className="h-5 w-5" />;
  }
};

const initialForm = {
  category: "",
  price: "",
  currency: "EGP",
  description: "",
  whatsappNumber: "",
  countryCode: "20",
};

function AddPostPage() {
  const { i18n } = useTranslation();
  const navigate = useNavigate();
  const [formData, setFormData] = useState(initialForm);
  const [selectedImages, setSelectedImages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fileInputKey, setFileInputKey] = useState(0);
  const [fieldErrors, setFieldErrors] = useState({});
  const [phoneInputVal, setPhoneInputVal] = useState("");

  const objectUrlCache = useRef(new Map());

  const handlePhoneChange = (value, country) => {
    setPhoneInputVal(value);
    const dialCode = country?.dialCode || "20";
    setFormData((prev) => ({
      ...prev,
      countryCode: dialCode,
      whatsappNumber: value.startsWith(dialCode) ? value.slice(dialCode.length) : value
    }));
    if (fieldErrors.whatsappNumber) {
      setFieldErrors((prev) => {
        const next = { ...prev };
        delete next.whatsappNumber;
        return next;
      });
    }
  };

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
    if (fieldErrors[name]) {
      setFieldErrors((prev) => {
        const next = { ...prev };
        delete next[name];
        return next;
      });
    }
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
    if (fieldErrors.images) {
      setFieldErrors((prev) => {
        const next = { ...prev };
        delete next.images;
        return next;
      });
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
    setPhoneInputVal("");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);

    const errors = {};
    const fullNumber = (formData.countryCode + formData.whatsappNumber).trim();
    if (!formData.whatsappNumber.trim()) {
      errors.whatsappNumber = "رقم الواتساب مطلوب";
    } else if (fullNumber.length < 8) {
      errors.whatsappNumber = "رقم الواتساب غير صالح أو قصير جداً";
    }

    if (!formData.description.trim()) {
      errors.description = "وصف الإعلان مطلوب";
    } else if (formData.description.trim().length < 10) {
      errors.description = "الوصف يجب أن يكون 10 أحرف على الأقل";
    }

    if (formData.price === "" || formData.price === undefined || formData.price === null) {
      errors.price = "السعر مطلوب";
    } else if (Number(formData.price) < 0) {
      errors.price = "السعر لا يمكن أن يكون سالباً";
    }

    if (!formData.category) {
      errors.category = "يجب اختيار الفئة";
    }

    if (selectedImages.length === 0) {
      errors.images = "يجب اختيار صورة واحدة على الأقل";
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      setLoading(false);
      return;
    }

    setFieldErrors({});

    try {
      // 1. Upload images directly to Cloudinary from the client
      const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
      const uploadPreset = (import.meta.env.VITE_CLOUDINARY_CHAT_PRESET || "chat_media").replace(/"/g, "");

      const uploadPromises = selectedImages.map(async (file) => {
        const uploadData = new FormData();
        uploadData.append("file", file);
        uploadData.append("upload_preset", uploadPreset);

        const response = await fetch(
          `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
          {
            method: "POST",
            body: uploadData,
          }
        );

        if (!response.ok) {
          throw new Error("Failed to upload image to Cloudinary");
        }

        const data = await response.json();
        return data.secure_url;
      });

      const uploadedUrlsArray = await Promise.all(uploadPromises);

      // 2. Construct JSON payload for backend
      const payload = {
        category: formData.category,
        price: Number(formData.price),
<<<<<<< HEAD
=======
        currency: formData.currency || "EGP",
>>>>>>> feature/v2-chat-community
        description: formData.description.trim(),
        whatsappNumber: formData.whatsappNumber.trim(),
        countryCode: formData.countryCode.trim(),
        images: uploadedUrlsArray,
      };

      await api.post("/posts", payload);

      toast.success("تم إضافة الإعلان بنجاح!");
      resetForm();
      navigate("/profile");
    } catch (requestError) {
      if (requestError.response?.data?.errors) {
        const backendErrors = {};
        const errs = requestError.response.data.errors;
        if (Array.isArray(errs)) {
          errs.forEach((err) => {
            const field = err.path || err.param;
            if (field) {
              backendErrors[field] = err.msg;
            }
          });
        } else if (typeof errs === "object") {
          Object.keys(errs).forEach((key) => {
            backendErrors[key] = errs[key].message || errs[key];
          });
        }
        setFieldErrors(backendErrors);
      } else {
        toast.error(
          requestError.response?.data?.message ||
            "تعذر إضافة الإعلان. حاول مرة أخرى لاحقاً.",
        );
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div dir={i18n.dir()} className="min-h-screen px-4 py-10 font-cairo">
      {/* Custom Styles for react-phone-input-2 to fit our dark neon UI */}
      <style>{`
        .react-tel-input .form-control {
          width: 100% !important;
          background-color: rgba(0, 0, 0, 0.4) !important;
          border: 1px solid rgba(255, 255, 255, 0.1) !important;
          color: #fff !important;
          border-radius: 0.75rem !important;
          padding: 0.75rem 1.25rem 0.75rem 3.5rem !important;
          height: auto !important;
          font-family: 'Cairo', sans-serif !important;
          text-align: left !important;
          direction: ltr !important;
        }
        .react-tel-input .form-control:focus {
          border-color: #00D1FF !important;
          box-shadow: 0 0 10px rgba(0, 209, 255, 0.3) !important;
        }
        .react-tel-input .flag-dropdown {
          background-color: rgba(0, 0, 0, 0.4) !important;
          border: 1px solid rgba(255, 255, 255, 0.1) !important;
          border-radius: 0.75rem 0 0 0.75rem !important;
        }
        .react-tel-input .flag-dropdown.open .selected-flag {
          background: rgba(255, 255, 255, 0.05) !important;
        }
        .react-tel-input .selected-flag:hover,
        .react-tel-input .selected-flag:focus {
          background: rgba(255, 255, 255, 0.05) !important;
        }
        .react-tel-input .country-list {
          background-color: #0d121c !important;
          border: 1px solid rgba(255, 255, 255, 0.1) !important;
          color: #fff !important;
          font-family: 'Cairo', sans-serif !important;
          text-align: left !important;
          z-index: 9999 !important;
        }
        .react-tel-input .country-list .country:hover {
          background-color: rgba(0, 209, 255, 0.1) !important;
        }
        .react-tel-input .country-list .country.highlight {
          background-color: rgba(0, 209, 255, 0.2) !important;
        }
      `}</style>

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

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2 relative z-40">
            <label className="mr-1 text-sm font-medium text-slate-300">
              رقم الواتساب
            </label>
            <div className="relative" dir="ltr">
              <PhoneInput
                country={"eg"}
                value={phoneInputVal}
                onChange={handlePhoneChange}
                enableSearch={true}
                placeholder="رقم الواتساب"
                countryCodeEditable={false}
              />
            </div>
            {formData.countryCode === "20" && (
              <p className="text-slate-400 text-xs pr-2 mt-1 text-right">
                اكتب رقم الهاتف بدون الصفر الأول (مثال: 1003481108)
              </p>
            )}
            {fieldErrors.whatsappNumber && (
              <p className="mt-1 mr-1 text-xs text-red-500 text-right">{fieldErrors.whatsappNumber}</p>
            )}
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
                  value={formData.category}
                  onChange={handleChange}
                  className={`w-full appearance-none rounded-xl border bg-black/40 px-4 py-3 pl-4 pr-11 text-white outline-none transition ${
                    fieldErrors.category
                      ? "border-red-500 focus:ring-red-500"
                      : "border-white/10 focus:border-cesar-cyan focus:ring-cesar-cyan focus:shadow-neon-cyan"
                  }`}
                >
                  <option value="" disabled>
                    اختر الفئة
                  </option>
                  <option value="فري فاير">
                    فري فاير
                  </option>
                  <option value="ببجي">
                    ببجي
                  </option>
                  <option value="بيس فيفا و كلاش">
                    بيس فيفا و كلاش
                  </option>
                  <option value="بلود سترايك">
                    بلود سترايك
                  </option>
                  <option value="روبلوكس">
                    روبلوكس
                  </option>
                  <option value="حسابات سوشيال ميديا">
                    حسابات سوشيال ميديا
                  </option>
                  <option value="اخري">اخري</option>
                </select>
              </div>
              {fieldErrors.category && (
                <p className="mt-1 mr-1 text-xs text-red-500">{fieldErrors.category}</p>
              )}
            </div>

            <div className="space-y-2">
              <label className="mr-1 text-sm font-medium text-slate-300">
                السعر والعملة
              </label>
              <div className={`flex rounded-xl border overflow-hidden transition ${
                fieldErrors.price
                  ? "border-red-500"
                  : "border-white/10 focus-within:border-cesar-cyan focus-within:shadow-neon-cyan"
              }`}>
                {/* Currency selector — left side */}
                <select
                  name="currency"
                  value={formData.currency}
                  onChange={handleChange}
                  className="shrink-0 bg-white/5 border-r border-white/10 text-cesar-cyan font-bold text-sm px-3 py-3 outline-none cursor-pointer hover:bg-white/10 transition appearance-none text-center"
                  style={{ minWidth: "5rem" }}
                  title="اختر العملة"
                >
                  {CURRENCIES.map((c) => (
                    <option key={c.value} value={c.value}>
                      {c.symbol} {c.label}
                    </option>
                  ))}
                </select>
                {/* Price input — right side */}
                <div className="relative flex-1">
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-4 text-slate-500">
                    {getCurrencyIcon(formData.currency)}
                  </div>
                  <input
                    type="number"
                    name="price"
                    min="0"
                    step="0.01"
                    value={formData.price}
                    onChange={handleChange}
                    placeholder="0"
                    className="w-full bg-black/40 px-4 py-3 pr-11 text-white outline-none"
                  />
                </div>
              </div>
              {fieldErrors.price && (
                <p className="mt-1 mr-1 text-xs text-red-500">{fieldErrors.price}</p>
              )}
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
                rows="4"
                value={formData.description}
                onChange={handleChange}
                placeholder="اكتب تفاصيل الحساب، المستوى، المزايا، وأي معلومات مهمة للمشتري..."
                className={`w-full resize-none rounded-xl border bg-black/40 px-4 py-3 pl-4 pr-11 text-white outline-none transition ${
                  fieldErrors.description
                    ? "border-red-500 focus:ring-red-500"
                    : "border-white/10 focus:border-cesar-cyan focus:ring-cesar-cyan focus:shadow-neon-cyan"
                }`}
              />
            </div>
            {fieldErrors.description && (
              <p className="mt-1 mr-1 text-xs text-red-500">{fieldErrors.description}</p>
            )}
          </div>

          <div className="space-y-2">
            <label className="mr-1 text-sm font-medium text-slate-300">
              صور الإعلان (حد أقصى 5 صور)
            </label>
            <label
              className={`flex cursor-pointer items-center gap-4 rounded-xl border border-dashed bg-black/40 px-4 py-4 transition ${
                fieldErrors.images
                  ? "border-red-500 hover:border-red-500"
                  : "border-white/10 hover:border-cesar-cyan/60 hover:bg-black/50"
              }`}
            >
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
            {fieldErrors.images && (
              <p className="mt-1 mr-1 text-xs text-red-500">{fieldErrors.images}</p>
            )}
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
                        src={optimizeImage(url)}
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
