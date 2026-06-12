import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { UserPlus, Mail, Lock, User, Phone, Loader2, Eye, EyeOff } from "lucide-react";
import { useAuth } from "../context/AuthContext";

function RegisterPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phoneNumber: "", // hna mtmatcha m3 el model bta3k
    password: "",
    confirmPassword: ""
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      return setError("كلمات المرور غير متطابقة!");
    }
    if (formData.password.length < 6) {
      return setError("كلمة المرور يجب أن تكون 6 أحرف على الأقل");
    }
    
    setLoading(true);
    setError("");

    try {
      // bnshel el confirmPassword abl ma nb3t
      const { confirmPassword, ...dataToSend } = formData;
      await register(dataToSend);
      navigate("/");
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || "حدث خطأ أثناء إنشاء الحساب. تأكد من صحة البيانات.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div dir="rtl" className="min-h-[85vh] flex items-center justify-center px-4 py-12 font-cairo">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="bg-cesar-dark/80 backdrop-blur-md border border-white/5 rounded-[2rem] p-8 shadow-2xl shadow-black/50 relative overflow-hidden">
          <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-cesar-cyan/50 to-transparent"></div>
          
          <div className="text-center mb-8">
            <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-cesar-cyan/10 border border-cesar-cyan/20 text-cesar-cyan mb-4 shadow-[0_0_15px_rgba(0,240,255,0.15)]">
              <UserPlus className="h-8 w-8" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">إنشاء حساب جديد</h2>
            <p className="text-sm text-cesar-gray">انضم لمجتمع متجر سيزار الآن</p>
          </div>

          {error && (
            <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm text-center">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="relative">
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-slate-500">
                <User className="h-5 w-5" />
              </div>
              <input
                type="text" name="name" required value={formData.name} onChange={handleChange}
                className="w-full bg-black/40 border border-white/10 text-white rounded-xl pr-10 pl-4 py-3 focus:border-cesar-cyan focus:ring-1 focus:ring-cesar-cyan transition outline-none text-sm"
                placeholder="الاسم بالكامل"
              />
            </div>

            <div className="relative">
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-slate-500">
                <Mail className="h-5 w-5" />
              </div>
              <input
                type="email" name="email" required value={formData.email} onChange={handleChange}
                className="w-full bg-black/40 border border-white/10 text-white rounded-xl pr-10 pl-4 py-3 focus:border-cesar-cyan focus:ring-1 focus:ring-cesar-cyan transition outline-none text-sm"
                placeholder="البريد الإلكتروني"
              />
            </div>

            <div className="relative">
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-slate-500">
                <Phone className="h-5 w-5" />
              </div>
              <input
                type="tel" name="phoneNumber" required value={formData.phoneNumber} onChange={handleChange}
                className="w-full bg-black/40 border border-white/10 text-white rounded-xl pr-10 pl-4 py-3 focus:border-cesar-cyan focus:ring-1 focus:ring-cesar-cyan transition outline-none text-sm"
                placeholder="رقم الهاتف" dir="rtl"
              />
            </div>

            <div className="relative">
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-slate-500">
                <Lock className="h-5 w-5" />
              </div>
              <input
                type={showPassword ? "text" : "password"} name="password" required value={formData.password} onChange={handleChange}
                className="w-full bg-black/40 border border-white/10 text-white rounded-xl pr-10 pl-12 py-3 focus:border-cesar-cyan focus:ring-1 focus:ring-cesar-cyan transition outline-none text-sm [&::-ms-reveal]:hidden [&::-ms-clear]:hidden"
                placeholder="كلمة المرور"
              />
              <button 
                type="button" 
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 left-0 pl-4 flex items-center text-slate-500 hover:text-cesar-cyan transition z-10"
              >
                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>

            <div className="relative">
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-slate-500">
                <Lock className="h-5 w-5" />
              </div>
              <input
                type={showConfirmPassword ? "text" : "password"} name="confirmPassword" required value={formData.confirmPassword} onChange={handleChange}
                className="w-full bg-black/40 border border-white/10 text-white rounded-xl pr-10 pl-12 py-3 focus:border-cesar-cyan focus:ring-1 focus:ring-cesar-cyan transition outline-none text-sm [&::-ms-reveal]:hidden [&::-ms-clear]:hidden"
                placeholder="تأكيد كلمة المرور"
              />
               <button 
                type="button" 
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute inset-y-0 left-0 pl-4 flex items-center text-slate-500 hover:text-cesar-cyan transition z-10"
              >
                {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>

            <button
              type="submit" disabled={loading}
              className="w-full mt-4 bg-cesar-cyan/10 border border-cesar-cyan/50 text-cesar-cyan font-bold rounded-xl px-4 py-3 transition duration-300 hover:bg-cesar-cyan/20 hover:shadow-neon-cyan disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : "إنشاء حساب"}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-cesar-gray">
            لديك حساب بالفعل؟{" "}
            <Link to="/login" className="text-cesar-cyan font-semibold hover:underline">
              سجل دخولك
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}

export default RegisterPage;