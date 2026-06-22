import { useTranslation } from "react-i18next";
import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { LogIn, Mail, Lock, Loader2, Eye, EyeOff } from "lucide-react";
import { useAuth } from "../context/AuthContext";

function LoginPage() {
  const { i18n } = useTranslation();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});

  const { login, token } = useAuth();
  const navigate = useNavigate();

  // Route Guard: Go home if already logged in
  useEffect(() => {
    if (token) {
      navigate("/");
    }
  }, [token, navigate]);

  const validateField = (name, value) => {
    let errMsg = "";
    if (name === "identifier") {
      if (!value) errMsg = "البريد الإلكتروني أو رقم الهاتف مطلوب";
    }
    if (name === "password" && !value) {
      errMsg = "كلمة المرور مطلوبة";
    }
    setFieldErrors(prev => ({ ...prev, [name]: errMsg }));
  };

  const handleBlur = (e) => validateField(e.target.name, e.target.value);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (fieldErrors.identifier || fieldErrors.password || !identifier || !password) {
      setLoading(false);
      return;
    }

    try {
      await login(identifier, password);
      navigate("/");
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || "البريد الإلكتروني/رقم الهاتف أو كلمة المرور غير صحيحة");
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
              <LogIn className="h-8 w-8" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">تسجيل الدخول</h2>
            <p className="text-sm text-cesar-gray">أهلاً بك مجدداً في متجر سيزار</p>
          </div>

          {error && (
            <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm text-center">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-300 ml-1">البريد الإلكتروني أو رقم الهاتف</label>
              <div className="relative">
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-slate-500">
                  <Mail className="h-5 w-5" />
                </div>
                <input
                  type="text" name="identifier" required value={identifier} 
                  onChange={(e) => { setIdentifier(e.target.value); validateField(e.target.name, e.target.value); }}
                  onBlur={handleBlur}
                  className={`w-full bg-black/40 border ${fieldErrors.identifier ? 'border-red-500 focus:ring-red-500' : 'border-white/10 focus:border-cesar-cyan focus:ring-cesar-cyan focus:shadow-neon-cyan'} text-white rounded-xl pr-10 pl-4 py-3 focus:ring-1 transition outline-none`}
                  placeholder="البريد الإلكتروني أو رقم الهاتف"
                />
              </div>
              {fieldErrors.identifier && <p className="text-red-400 text-xs mt-1 pr-2">{fieldErrors.identifier}</p>}
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-300 ml-1">كلمة المرور</label>
              <div className="relative">
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-slate-500">
                  <Lock className="h-5 w-5" />
                </div>
                <input
                  type={showPassword ? "text" : "password"} name="password" required value={password} 
                  onChange={(e) => { setPassword(e.target.value); validateField(e.target.name, e.target.value); }}
                  onBlur={handleBlur}
                  className={`w-full bg-black/40 border ${fieldErrors.password ? 'border-red-500 focus:ring-red-500' : 'border-white/10 focus:border-cesar-cyan focus:ring-cesar-cyan focus:shadow-neon-cyan'} text-white rounded-xl pr-10 pl-12 py-3 focus:ring-1 transition outline-none [&::-ms-reveal]:hidden [&::-ms-clear]:hidden`}
                  placeholder="••••••••"
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-0 left-0 pl-4 flex items-center text-slate-500 hover:text-cesar-cyan transition z-10">
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
              {fieldErrors.password && <p className="text-red-400 text-xs mt-1 pr-2">{fieldErrors.password}</p>}
            </div>

            <button type="submit" disabled={loading} className="w-full mt-2 bg-cesar-cyan/10 border border-cesar-cyan/50 text-cesar-cyan font-bold rounded-xl px-4 py-3.5 transition duration-300 hover:bg-cesar-cyan/20 hover:shadow-neon-cyan disabled:opacity-50 flex items-center justify-center gap-2">
              {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : "دخول"}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-cesar-gray">
            ليس لديك حساب؟{" "}
            <Link to="/register" className="text-cesar-cyan font-semibold hover:underline">
              أنشئ حساباً جديداً
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}

export default LoginPage;