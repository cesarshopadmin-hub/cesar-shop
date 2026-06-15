import { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { User, Mail, Lock, Eye, EyeOff, Loader2, UserPlus, ArrowRight } from "lucide-react";
import { toast } from "react-toastify";
import api from "../../Services/api.js";

function AddAdminPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});

  const validateField = (fieldName, value) => {
    let errMsg = "";
    if (fieldName === "name") {
      if (!value) errMsg = "الاسم مطلوب";
      else if (value.trim().length < 3) errMsg = "يجب أن يكون الاسم 3 أحرف على الأقل";
    }
    if (fieldName === "email") {
      if (!value) errMsg = "البريد الإلكتروني مطلوب";
      else if (!/\S+@\S+\.\S+/.test(value)) errMsg = "صيغة البريد الإلكتروني غير صحيحة";
    }
    if (fieldName === "password") {
      if (!value) errMsg = "كلمة المرور مطلوبة";
      else if (value.length < 6) errMsg = "يجب أن تكون كلمة المرور 6 أحرف على الأقل";
    }
    setFieldErrors((prev) => ({ ...prev, [fieldName]: errMsg }));
  };

  const handleBlur = (e) => validateField(e.target.name, e.target.value);

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Trigger inline validation for all fields
    validateField("name", name);
    validateField("email", email);
    validateField("password", password);

    if (
      !name ||
      !email ||
      !password ||
      fieldErrors.name ||
      fieldErrors.email ||
      fieldErrors.password
    ) {
      return;
    }

    setLoading(true);

    try {
      await api.post("/auth/add-admin", { name, email, password });
      toast.success("تم إضافة مسؤول جديد بنجاح");
      setName("");
      setEmail("");
      setPassword("");
      setFieldErrors({});
    } catch (error) {
      console.error(error);
      const errorMsg = error.response?.data?.message || "حدث خطأ أثناء إضافة المسؤول.";
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div dir="rtl" className="min-h-screen bg-cesar-darker flex items-center justify-center px-4 py-12 font-cairo text-white">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="w-full max-w-md"
      >
        {/* Back Link */}
        <div className="mb-6 flex justify-start">
          <Link
            to="/admin/dashboard"
            className="inline-flex items-center gap-2 text-sm font-semibold text-cesar-gray hover:text-emerald-400 transition duration-300"
          >
            <ArrowRight className="h-4 w-4" />
            العودة للوحة التحكم
          </Link>
        </div>

        {/* Form Card */}
        <div className="bg-cesar-dark/80 backdrop-blur-md border border-white/5 rounded-[2rem] p-8 shadow-2xl shadow-black/55 relative overflow-hidden">
          {/* Glowing Top line with Emerald Neon Accent */}
          <div className="absolute top-0 inset-x-0 h-[3px] bg-gradient-to-r from-transparent via-emerald-500/50 to-transparent"></div>

          {/* Heading */}
          <div className="text-center mb-8">
            <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 mb-4 shadow-[0_0_15px_rgba(16,185,129,0.15)]">
              <UserPlus className="h-8 w-8" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">إضافة مسؤول جديد</h2>
            <p className="text-sm text-cesar-gray">سجل حساب إدارة جديد يتمتع بكافة صلاحيات لوحة التحكم</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Name Input */}
            <div className="space-y-1.5 text-right">
              <label className="text-sm font-medium text-slate-300 mr-1">الاسم الكامل</label>
              <div className="relative">
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-slate-500">
                  <User className="h-5 w-5" />
                </div>
                <input
                  type="text"
                  name="name"
                  required
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    if (fieldErrors.name) validateField("name", e.target.value);
                  }}
                  onBlur={handleBlur}
                  className={`w-full bg-black/40 border ${
                    fieldErrors.name
                      ? "border-red-500 focus:ring-red-500"
                      : "border-white/10 focus:border-emerald-500 focus:ring-emerald-500 focus:shadow-[0_0_10px_rgba(16,185,129,0.2)]"
                  } text-white rounded-xl pr-10 pl-4 py-3 focus:ring-1 transition outline-none`}
                  placeholder="ادخل الاسم ثلاثي"
                />
              </div>
              {fieldErrors.name && (
                <p className="text-red-400 text-xs mt-1 pr-2">{fieldErrors.name}</p>
              )}
            </div>

            {/* Email Input */}
            <div className="space-y-1.5 text-right">
              <label className="text-sm font-medium text-slate-300 mr-1">البريد الإلكتروني</label>
              <div className="relative">
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-slate-500">
                  <Mail className="h-5 w-5" />
                </div>
                <input
                  type="email"
                  name="email"
                  required
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (fieldErrors.email) validateField("email", e.target.value);
                  }}
                  onBlur={handleBlur}
                  className={`w-full bg-black/40 border ${
                    fieldErrors.email
                      ? "border-red-500 focus:ring-red-500"
                      : "border-white/10 focus:border-emerald-500 focus:ring-emerald-500 focus:shadow-[0_0_10px_rgba(16,185,129,0.2)]"
                  } text-white rounded-xl pr-10 pl-4 py-3 focus:ring-1 transition outline-none`}
                  placeholder="admin@cesar.com"
                />
              </div>
              {fieldErrors.email && (
                <p className="text-red-400 text-xs mt-1 pr-2">{fieldErrors.email}</p>
              )}
            </div>

            {/* Password Input */}
            <div className="space-y-1.5 text-right">
              <label className="text-sm font-medium text-slate-300 mr-1">كلمة المرور</label>
              <div className="relative">
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-slate-500">
                  <Lock className="h-5 w-5" />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  required
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (fieldErrors.password) validateField("password", e.target.value);
                  }}
                  onBlur={handleBlur}
                  className={`w-full bg-black/40 border ${
                    fieldErrors.password
                      ? "border-red-500 focus:ring-red-500"
                      : "border-white/10 focus:border-emerald-500 focus:ring-emerald-500 focus:shadow-[0_0_10px_rgba(16,185,129,0.2)]"
                  } text-white rounded-xl pr-10 pl-12 py-3 focus:ring-1 transition outline-none [&::-ms-reveal]:hidden [&::-ms-clear]:hidden`}
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 left-0 pl-4 flex items-center text-slate-500 hover:text-emerald-400 transition z-10"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
              {fieldErrors.password && (
                <p className="text-red-400 text-xs mt-1 pr-2">{fieldErrors.password}</p>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full mt-4 bg-emerald-500/10 border border-emerald-500/50 text-emerald-400 font-bold rounded-xl px-4 py-3.5 transition duration-300 hover:bg-emerald-500/20 hover:shadow-[0_0_15px_rgba(16,185,129,0.2)] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  جاري تسجيل المسؤول...
                </>
              ) : (
                <>
                  <UserPlus className="h-5 w-5" />
                  تسجيل المسؤول الجديد
                </>
              )}
            </button>
          </form>
        </div>
      </motion.div>
    </div>
  );
}

export default AddAdminPage;
