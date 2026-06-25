import { useTranslation } from "react-i18next";
import { useEffect, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Loader2,
  ShieldCheck,
  Trash2,
  Plus,
  Save,
  AlertCircle,
  Phone,
  Share2,
  ArrowRight,
  GripVertical,
} from "lucide-react";
import { toast } from "react-toastify";
import api from "../../Services/api.js";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

function SortableItem({ id, children }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : "auto",
    opacity: isDragging ? 0.7 : 1,
    position: "relative",
  };

  return (
    <div ref={setNodeRef} style={style}>
      {children({ dragHandleProps: { ...attributes, ...listeners } })}
    </div>
  );
}


function AdminSettingsPage() {
  const { t, i18n } = useTranslation();
  const [alertMessage, setAlertMessage] = useState("");
  const [adminNumbers, setAdminNumbers] = useState([]);
  const [socialLinks, setSocialLinks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const fetchSettings = async () => {
      try {
        setLoading(true);
        const response = await api.get("/settings");
        if (isMounted) {
          setAlertMessage(response.data?.alertMessage || "");
          setAdminNumbers(response.data?.adminContactNumbers || []);
          const linksWithIds = (response.data?.socialLinks || []).map((link, idx) => ({
            ...link,
            _id: link._id || `existing-${idx}-${Date.now()}`
          }));
          setSocialLinks(linksWithIds);
        }
      } catch (err) {
        console.error(err);
        toast.error("تعذر تحميل إعدادات المتجر.");
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchSettings();

    return () => {
      isMounted = false;
    };
  }, []);

  const handleAddNumber = () => {
    setAdminNumbers((prev) => [...prev, ""]);
  };

  const handleNumberChange = (index, value) => {
    setAdminNumbers((prev) => {
      const next = [...prev];
      next[index] = value;
      return next;
    });
  };

  const handleRemoveNumber = (index) => {
    setAdminNumbers((prev) => prev.filter((_, i) => i !== index));
  };

  const handleAddSocialLink = () => {
    setSocialLinks((prev) => [
      ...prev,
      { _id: `new-${Date.now()}`, platform: "whatsapp", title: "", subtitle: "", url: "" },
    ]);
  };

  const handleSocialLinkChange = (id, field, value) => {
    setSocialLinks((prev) =>
      prev.map((link) => (link._id === id ? { ...link, [field]: value } : link))
    );
  };

  const handleRemoveSocialLink = (id) => {
    setSocialLinks((prev) => prev.filter((link) => link._id !== id));
  };

  const handleDragEnd = async (event) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    let newArray = [];
    setSocialLinks((prev) => {
      const oldIndex = prev.findIndex((item) => item._id === active.id);
      const newIndex = prev.findIndex((item) => item._id === over.id);
      newArray = arrayMove(prev, oldIndex, newIndex);
      return newArray;
    });

    const payload = newArray
      .filter((item) => !item._id.startsWith("new-"))
      .map((item, index) => ({
        id: item._id,
        order: index,
      }));

    if (payload.length > 0) {
      try {
        await api.put("/links/reorder", payload);
      } catch (err) {
        console.error("Failed to update links order:", err);
        toast.error("تعذر تحديث ترتيب الروابط في قاعدة البيانات.");
      }
    }
  };

  const sortedSocialLinks = useMemo(() => {
    return socialLinks;
  }, [socialLinks]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 250,
        tolerance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleSave = async (event) => {
    event.preventDefault();
    try {
      setSaving(true);

      const cleanedNumbers = adminNumbers
        .map((num) => {
          const trimmed = num.trim();
          if (!trimmed) return "";
          if (trimmed.startsWith("http")) {
            return trimmed;
          }
          const digitsOnly = trimmed.replace(/\D/g, "");
          let formattedNumber = digitsOnly;
          if (digitsOnly.startsWith("01")) {
            formattedNumber = "2" + digitsOnly;
          }
          return "https://wa.me/" + formattedNumber;
        })
        .filter(Boolean);

      const cleanedSocialLinks = socialLinks
        .map((link) => ({
          platform: link.platform || "whatsapp",
          title: link.title.trim(),
          subtitle: (link.subtitle || "").trim(),
          url: link.url.trim(),
        }))
        .filter((link) => link.title && link.url);

      const payload = {
        alertMessage: alertMessage.trim(),
        adminContactNumbers: cleanedNumbers,
        socialLinks: cleanedSocialLinks,
      };

      const { data } = await api.put("/settings", payload);
      toast.success("تم حفظ الإعدادات العامة بنجاح.");
      setAdminNumbers(data.adminContactNumbers || []);
      const linksWithIds = (data.socialLinks || []).map((link, idx) => ({
        ...link,
        _id: link._id || `existing-${idx}-${Date.now()}`
      }));
      setSocialLinks(linksWithIds);
    } catch (err) {
      toast.error(
        err.response?.data?.message || "تعذر حفظ الإعدادات. حاول مرة أخرى.",
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-cesar-darker">
        <div className="flex items-center gap-3 text-cesar-cyan">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="text-lg font-medium font-cairo">
            جارٍ تحميل الإعدادات...
          </span>
        </div>
      </div>
    );
  }

  return (
    <div
      dir={i18n.dir()}
      className="min-h-screen bg-cesar-darker px-4 pt-8 pb-32 md:pb-12 font-cairo text-white sm:px-6 lg:px-8"
    >
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="mx-auto max-w-4xl space-y-8"
      >
        {/* Header Section */}
        <section className="relative overflow-hidden rounded-[2rem] border border-white/5 bg-cesar-dark/85 p-6 shadow-2xl shadow-black/50 backdrop-blur-md sm:p-8">
          <div className="pointer-events-none absolute inset-x-0 top-0 h-[3px] bg-gradient-to-r from-transparent via-cesar-cyan to-transparent" />
          <div className="pointer-events-none absolute -right-24 top-6 h-56 w-56 rounded-full bg-cesar-cyan/10 blur-3xl" />
          
          <div className="relative flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-3 text-right">
              <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl border border-cesar-cyan/20 bg-cesar-cyan/10 text-cesar-cyan shadow-neon-cyan">
                <ShieldCheck className="h-7 w-7" />
              </div>
              <div>
                <p className="text-sm text-cesar-gray">إعدادات النظام</p>
                <h1 className="mt-1 text-3xl font-bold text-white">
                  إعدادات المتجر العامة
                </h1>
                <p className="mt-2 text-sm leading-6 text-slate-300">
                  تحكم في الرسائل الإرشادية للمستخدمين وروابط التواصل أينما تظهر في الموقع.
                </p>
              </div>
            </div>

            <div className="shrink-0">
              <Link
                to="/admin/dashboard"
                className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-black/40 px-4 py-2.5 text-sm font-bold text-slate-300 transition hover:border-white/20 hover:text-white"
              >
                <ArrowRight className="h-4 w-4" />
                لوحة الإدارة
              </Link>
            </div>
          </div>
        </section>

        {/* Settings Form */}
        <form onSubmit={handleSave} className="space-y-8 pb-24">
          
          {/* 1. Alert Message Section */}
          <section className="relative overflow-hidden rounded-2xl border border-white/5 bg-cesar-dark/80 p-6 shadow-xl backdrop-blur-md">
            <div className="mb-5 flex items-center gap-3 border-b border-white/5 pb-4 text-right">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-500/10 text-amber-400">
                <AlertCircle className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">شريط التنبيهات العلوي</h2>
                <p className="text-xs text-cesar-gray">تنبيه تحذيري يظهر للمشترين في أعلى صفحات الموقع.</p>
              </div>
            </div>

            <div className="space-y-2 text-right">
              <label className="text-sm font-medium text-slate-300">نص التنبيه</label>
              <textarea
                value={alertMessage}
                onChange={(e) => setAlertMessage(e.target.value)}
                placeholder="مثال: احذر النصب! لا تتعامل إلا مع أرقام الإدارة الموضحة أدناه."
                rows={3}
                className="w-full resize-none rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-white outline-none transition focus:border-cesar-cyan focus:ring-1 focus:ring-cesar-cyan focus:shadow-neon-cyan"
              />
            </div>
          </section>

          {/* 2. Admin Numbers Section */}
          <section className="relative overflow-hidden rounded-2xl border border-white/5 bg-cesar-dark/80 p-6 shadow-xl backdrop-blur-md">
            <div className="mb-5 flex items-center gap-3 border-b border-white/5 pb-4 text-right">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400">
                <Phone className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">أرقام هواتف الإدارة الرسمية</h2>
                <p className="text-xs text-cesar-gray">أرقام الهواتف المعتمدة لإتمام المعاملات وحل المشكلات.</p>
              </div>
            </div>

            <div className="space-y-4">
              {adminNumbers.length === 0 ? (
                <div className="rounded-xl border border-dashed border-white/10 bg-black/20 p-6 text-center">
                  <p className="text-sm text-cesar-gray">لا توجد أرقام هواتف مسجلة حالياً.</p>
                </div>
              ) : (
                <div className="grid gap-3 sm:grid-cols-2">
                  {adminNumbers.map((num, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <input
                        type="text"
                        required
                        placeholder="ادخل رقم الهاتف"
                        value={num}
                        onChange={(e) => handleNumberChange(index, e.target.value)}
                        className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-white outline-none transition focus:border-cesar-cyan focus:ring-1 focus:ring-cesar-cyan focus:shadow-neon-cyan"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveNumber(index)}
                        className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-rose-500/30 bg-rose-500/10 text-rose-400 hover:bg-rose-500 hover:text-white transition duration-200"
                        title="حذف الرقم"
                      >
                        <Trash2 className="h-5 w-5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <button
                type="button"
                onClick={handleAddNumber}
                className="flex items-center gap-2 rounded-xl border border-dashed border-white/10 bg-black/30 px-4 py-3 text-sm font-semibold text-slate-300 transition hover:border-cesar-cyan/40 hover:text-cesar-cyan"
              >
                <Plus className="h-4 w-4" />
                أضف رقم هاتف جديد
              </button>
            </div>
          </section>

          {/* 3. Social Links Section */}
          <section className="relative overflow-hidden rounded-2xl border border-white/5 bg-cesar-dark/80 p-6 shadow-xl backdrop-blur-md">
            <div className="mb-5 flex items-center gap-3 border-b border-white/5 pb-4 text-right">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-cesar-cyan/10 text-cesar-cyan">
                <Share2 className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">روابط الشبكات الاجتماعية والدعم</h2>
                <p className="text-xs text-cesar-gray">تظهر هذه الروابط في الفوتر أو صفحات الدعم للمشترين.</p>
              </div>
            </div>

            <div className="space-y-4">
              {sortedSocialLinks.length === 0 ? (
                <div className="rounded-xl border border-dashed border-white/10 bg-black/20 p-6 text-center">
                  <p className="text-sm text-cesar-gray">لا توجد روابط تواصل اجتماعي مسجلة.</p>
                </div>
              ) : (
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={handleDragEnd}
                >
                  <SortableContext
                    items={sortedSocialLinks.map((link) => link._id)}
                    strategy={verticalListSortingStrategy}
                  >
                    <div className="space-y-4">
                      {sortedSocialLinks.map((link) => (
                        <SortableItem key={link._id} id={link._id}>
                          {({ dragHandleProps }) => (
                            <div className="relative rounded-xl border border-white/5 bg-black/30 p-5 space-y-4 text-right">
                              {/* Header row containing drag handle and delete button */}
                              <div className="flex items-center gap-3 mb-4 select-none">
                                {/* Wide, prominent drag handle button */}
                                <div
                                  className="flex-1 flex items-center justify-center gap-2 h-10 px-4 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 hover:border-cesar-cyan/30 text-slate-300 hover:text-white cursor-grab active:cursor-grabbing transition duration-200 touch-none select-none text-sm font-medium font-cairo"
                                  title="اسحب لإعادة الترتيب"
                                  {...dragHandleProps}
                                >
                                  <GripVertical className="h-4 w-4 shrink-0" />
                                  <span>اسحب لإعادة الترتيب</span>
                                </div>

                                {/* Delete button */}
                                <button
                                  type="button"
                                  onClick={() => handleRemoveSocialLink(link._id)}
                                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-rose-500/30 bg-rose-500/10 text-rose-400 hover:bg-rose-500 hover:text-white transition duration-200"
                                  title="حذف الرابط"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </div>

                              <div className="grid gap-4 sm:grid-cols-2">
                                <div className="space-y-2">
                                  <label className="text-xs font-medium text-slate-300">اسم المنصة (النوع)</label>
                                  <select
                                    required
                                    value={link.platform}
                                    onChange={(e) =>
                                      handleSocialLinkChange(link._id, "platform", e.target.value)
                                    }
                                    className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-white outline-none transition focus:border-cesar-cyan focus:ring-1 focus:ring-cesar-cyan"
                                  >
                                    <option value="whatsapp">{t("enums.whatsapp", { defaultValue: "واتساب" })}</option>
                                    <option value="facebook">{t("enums.facebook", { defaultValue: "فيسبوك" })}</option>
                                    <option value="telegram">{t("enums.telegram", { defaultValue: "تيليجرام" })}</option>
                                    <option value="tiktok">{t("enums.tiktok", { defaultValue: "تيك توك" })}</option>
                                    <option value="instagram">{t("enums.instagram", { defaultValue: "انستجرام" })}</option>
                                    <option value="other">{t("enums.other", { defaultValue: "أخرى / منصة مختلفة" })}</option>
                                  </select>
                                </div>

                                <div className="space-y-2">
                                  <label className="text-xs font-medium text-slate-300">العنوان الرئيسي للرابط</label>
                                  <input
                                    type="text"
                                    required
                                    placeholder="مثال: تواصل معنا عبر واتساب"
                                    value={link.title}
                                    onChange={(e) =>
                                      handleSocialLinkChange(link._id, "title", e.target.value)
                                    }
                                    className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-white outline-none transition focus:border-cesar-cyan focus:ring-1 focus:ring-cesar-cyan focus:shadow-neon-cyan"
                                  />
                                </div>
                              </div>

                              <div className="grid gap-4 sm:grid-cols-2">
                                <div className="space-y-2">
                                  <label className="text-xs font-medium text-slate-300">العنوان الفرعي (اختياري)</label>
                                  <input
                                    type="text"
                                    placeholder="مثال: متاح طوال أيام الأسبوع"
                                    value={link.subtitle}
                                    onChange={(e) =>
                                      handleSocialLinkChange(link._id, "subtitle", e.target.value)
                                    }
                                    className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-white outline-none transition focus:border-cesar-cyan focus:ring-1 focus:ring-cesar-cyan focus:shadow-neon-cyan"
                                  />
                                </div>

                                <div className="space-y-2">
                                  <label className="text-xs font-medium text-slate-300">الرابط الكامل (URL)</label>
                                  <input
                                    type="url"
                                    required
                                    placeholder="https://..."
                                    value={link.url}
                                    onChange={(e) =>
                                      handleSocialLinkChange(link._id, "url", e.target.value)
                                    }
                                    className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-white outline-none transition focus:border-cesar-cyan focus:ring-1 focus:ring-cesar-cyan focus:shadow-neon-cyan"
                                  />
                                </div>
                              </div>
                            </div>
                          )}
                        </SortableItem>
                      ))}
                    </div>
                  </SortableContext>
                </DndContext>
              )}

              <button
                type="button"
                onClick={handleAddSocialLink}
                className="flex items-center gap-2 rounded-xl border border-dashed border-white/10 bg-black/30 px-4 py-3 text-sm font-semibold text-slate-300 transition hover:border-cesar-cyan/40 hover:text-cesar-cyan"
              >
                <Plus className="h-4 w-4" />
                أضف رابط تواصل اجتماعي جديد
              </button>
            </div>
          </section>

          {/* Fixed Save Button Panel */}
          <div className="fixed bottom-16 md:bottom-0 inset-x-0 border-t border-white/5 bg-cesar-darker/90 py-4 px-4 backdrop-blur-lg z-20">
            <div className="mx-auto max-w-4xl flex justify-center">
              <button
                type="submit"
                disabled={saving}
                className="flex items-center gap-2 rounded-xl border border-cesar-cyan/50 bg-cesar-cyan/10 px-8 py-3.5 font-bold text-cesar-cyan hover:bg-cesar-cyan/20 hover:shadow-neon-cyan transition duration-300 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {saving ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    جاري الحفظ...
                  </>
                ) : (
                  <>
                    <Save className="h-5 w-5 " />
                    حفظ كافة التغييرات
                  </>
                )}
              </button>
            </div>
          </div>

        </form>
      </motion.div>
    </div>
  );
}

export default AdminSettingsPage;
