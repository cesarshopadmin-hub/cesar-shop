import { useTranslation } from "react-i18next";
import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { UserPlus, Mail, Lock, User, Phone, Loader2, Eye, EyeOff } from "lucide-react";
import { useAuth } from "../context/AuthContext";

function RegisterPage() {
  const { i18n } = useTranslation();
  const [formData, setFormData] = useState({ name: "", email: "", phoneNumber: "", password: "", confirmPassword: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  
  const { register, token } = useAuth();
  const navigate = useNavigate();

  // Route Guard
  useEffect(() => {
    if (token) {
      navigate("/");
    }
  }, [token, navigate]);

  const validateField = (name, value, allData = formData) => {
    let errMsg = "";
    switch (name) {
      case "name":
        if (!value.trim()) errMsg = "الاسم مطلوب";
        break;
      case "email":
        if (!value) errMsg = "البريد الإلكتروني مطلوب";
        else if (!/\S+@\S+\.\S+/.test(value)) errMsg = "صيغة البريد غير صحيحة";
        break;
      case "phoneNumber":
        // bey2bal arqam masrya
        if (!value) errMsg = "رقم الهاتف مطلوب";
        else if (!/^01[0125][0-9]{8}$/.test(value)) errMsg = "رقم هاتف غير صحيح";
        break;
      case "password":
        if (value.length < 6) errMsg = "يجب أن تكون 6 أحرف على الأقل";
        break;
      case "confirmPassword":
        if (value !== allData.password) errMsg = "كلمات المرور غير متطابقة";
        break;
      default:
        break;
    }
    setFieldErrors(prev => ({ ...prev, [name]: errMsg }));
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // lw el user byktb, nfhm el error w hwa byktb
    validateField(name, value, { ...formData, [name]: value });
  };

  const handleBlur = (e) => validateField(e.target.name, e.target.value);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (Object.values(fieldErrors).some(err => err !== "") || Object.values(formData).some(val => val === "")) {
      return setError("يرجى مراجعة الحقول وتصحيح الأخطاء");
    }
    
    setLoading(true);
    setError("");

    try {
      await register(formData);
      navigate("/");
    } catch (err) {
      console.log("Full Backend Error:", err.response?.data);
      let errorMsg = err.response?.data?.message || "حدث خطأ أثناء إنشاء الحساب.";
      if (err.response?.data?.errors && Array.isArray(err.response.data.errors) && err.response.data.errors.length > 0) {
        errorMsg = err.response.data.errors[0].msg;
      } 
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div dir={i18n.dir()} className="min-h-[85vh] flex items-center justify-center px-4 py-12 font-cairo">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
        <div className="bg-cesar-dark/80 backdrop-blur-md border border-white/5 rounded-[2rem] p-8 shadow-2xl shadow-black/50 relative overflow-hidden">
          <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-cesar-cyan/50 to-transparent"></div>
          
          <div className="text-center mb-8">
            <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-cesar-cyan/10 border border-cesar-cyan/20 text-cesar-cyan mb-4 shadow-[0_0_15px_rgba(0,240,255,0.15)]">
              <UserPlus className="h-8 w-8" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">إنشاء حساب جديد</h2>
            <p className="text-sm text-cesar-gray">انضم لمجتمع متجر سيزار الآن</p>
          </div>

          {error && <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm text-center">{error}</div>}

          <form onSubmit={handleSubmit} className="space-y-4">
            
            <div className="space-y-1">
              <div className="relative">
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-slate-500"><User className="h-5 w-5" /></div>
                <input type="text" name="name" required value={formData.name} onChange={handleChange} onBlur={handleBlur} className={`w-full bg-black/40 border ${fieldErrors.name ? 'border-red-500 focus:ring-red-500' : 'border-white/10 focus:border-cesar-cyan focus:ring-cesar-cyan'} text-white rounded-xl pr-10 pl-4 py-3 focus:ring-1 transition outline-none text-sm`} placeholder="الاسم بالكامل" />
              </div>
              {fieldErrors.name && <p className="text-red-400 text-xs pr-2">{fieldErrors.name}</p>}
            </div>

            <div className="space-y-1">
              <div className="relative">
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-slate-500"><Mail className="h-5 w-5" /></div>
                <input type="email" name="email" required value={formData.email} onChange={handleChange} onBlur={handleBlur} className={`w-full bg-black/40 border ${fieldErrors.email ? 'border-red-500 focus:ring-red-500' : 'border-white/10 focus:border-cesar-cyan focus:ring-cesar-cyan'} text-white rounded-xl pr-10 pl-4 py-3 focus:ring-1 transition outline-none text-sm`} placeholder="البريد الإلكتروني" />
              </div>
              {fieldErrors.email && <p className="text-red-400 text-xs pr-2">{fieldErrors.email}</p>}
            </div>

            <div className="space-y-1">
              <div className="relative">
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-slate-500"><Phone className="h-5 w-5" /></div>
                <input type="tel" name="phoneNumber" required value={formData.phoneNumber} onChange={handleChange} onBlur={handleBlur} className={`w-full bg-black/40 border ${fieldErrors.phoneNumber ? 'border-red-500 focus:ring-red-500' : 'border-white/10 focus:border-cesar-cyan focus:ring-cesar-cyan'} text-white rounded-xl pr-10 pl-4 py-3 focus:ring-1 transition outline-none text-sm`} placeholder="رقم الهاتف" dir={i18n.dir()} />
              </div>
              {fieldErrors.phoneNumber && <p className="text-red-400 text-xs pr-2">{fieldErrors.phoneNumber}</p>}
            </div>

            <div className="space-y-1">
              <div className="relative">
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-slate-500"><Lock className="h-5 w-5" /></div>
                <input type={showPassword ? "text" : "password"} name="password" required value={formData.password} onChange={handleChange} onBlur={handleBlur} className={`w-full bg-black/40 border ${fieldErrors.password ? 'border-red-500 focus:ring-red-500' : 'border-white/10 focus:border-cesar-cyan focus:ring-cesar-cyan'} text-white rounded-xl pr-10 pl-12 py-3 focus:ring-1 transition outline-none text-sm [&::-ms-reveal]:hidden [&::-ms-clear]:hidden`} placeholder="كلمة المرور" />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-0 left-0 pl-4 flex items-center text-slate-500 hover:text-cesar-cyan transition z-10">{showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}</button>
              </div>
              {fieldErrors.password && <p className="text-red-400 text-xs pr-2">{fieldErrors.password}</p>}
            </div>

            <div className="space-y-1">
              <div className="relative">
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-slate-500"><Lock className="h-5 w-5" /></div>
                <input type={showConfirmPassword ? "text" : "password"} name="confirmPassword" required value={formData.confirmPassword} onChange={handleChange} onBlur={handleBlur} className={`w-full bg-black/40 border ${fieldErrors.confirmPassword ? 'border-red-500 focus:ring-red-500' : 'border-white/10 focus:border-cesar-cyan focus:ring-cesar-cyan'} text-white rounded-xl pr-10 pl-12 py-3 focus:ring-1 transition outline-none text-sm [&::-ms-reveal]:hidden [&::-ms-clear]:hidden`} placeholder="تأكيد كلمة المرور" />
                <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute inset-y-0 left-0 pl-4 flex items-center text-slate-500 hover:text-cesar-cyan transition z-10">{showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}</button>
              </div>
              {fieldErrors.confirmPassword && <p className="text-red-400 text-xs pr-2">{fieldErrors.confirmPassword}</p>}
            </div>

            <button type="submit" disabled={loading} className="w-full mt-4 bg-cesar-cyan/10 border border-cesar-cyan/50 text-cesar-cyan font-bold rounded-xl px-4 py-3 transition duration-300 hover:bg-cesar-cyan/20 hover:shadow-neon-cyan disabled:opacity-50 flex items-center justify-center gap-2">
              {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : "إنشاء حساب"}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-cesar-gray">
            لديك حساب بالفعل؟ <Link to="/login" className="text-cesar-cyan font-semibold hover:underline">سجل دخولك</Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}

export default RegisterPage;