import { useTranslation } from "react-i18next";
import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { UserPlus, Mail, Lock, User, Phone, Loader2, Eye, EyeOff } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import PhoneInputDefault from "react-phone-input-2";
import "react-phone-input-2/lib/style.css";

function RegisterPage() {
  const PhoneInput = PhoneInputDefault.default || PhoneInputDefault;
  const { i18n } = useTranslation();
  const [activeTab, setActiveTab] = useState("email"); // "email" or "phone"
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: ""
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const [selectedCountryCode, setSelectedCountryCode] = useState("eg");
  
  const { register, token } = useAuth();
  const navigate = useNavigate();

  // Route Guard
  useEffect(() => {
    if (token) {
      navigate("/");
    }
  }, [token, navigate]);

  // Synchronous validation function to avoid state batching race conditions
  const getValidationErrors = (data = formData, tab = activeTab) => {
    const errors = {};

    // 1. Name validation
    if (!data.name.trim()) {
      errors.name = "الاسم مطلوب";
    } else if (data.name.trim().length < 3) {
      errors.name = "يجب أن يكون الاسم 3 أحرف على الأقل";
    }

    // 2. Email validation (only if activeTab is email)
    if (tab === "email") {
      if (!data.email) {
        errors.email = "البريد الإلكتروني مطلوب";
      } else if (!/\S+@\S+\.\S+/.test(data.email)) {
        errors.email = "صيغة البريد الإلكتروني غير صحيحة";
      }
    }

    // 3. Phone validation (always required)
    if (!data.phone) {
      errors.phone = "رقم الهاتف مطلوب";
    } else if (data.phone.length < 8) {
      errors.phone = "رقم الهاتف غير صالح أو قصير جداً";
    }

    // 4. Password validation
    if (!data.password) {
      errors.password = "كلمة المرور مطلوبة";
    } else if (data.password.length < 6) {
      errors.password = "يجب أن تكون كلمة المرور 6 أحرف على الأقل";
    }

    // 5. Confirm Password validation
    if (!data.confirmPassword) {
      errors.confirmPassword = "يرجى تأكيد كلمة المرور";
    } else if (data.confirmPassword !== data.password) {
      errors.confirmPassword = "كلمات المرور غير متطابقة";
    }

    return errors;
  };

  const validateField = (name, value) => {
    const updatedData = { ...formData, [name]: value };
    const errors = getValidationErrors(updatedData, activeTab);
    
    setFieldErrors((prev) => ({
      ...prev,
      [name]: errors[name] || ""
    }));
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    validateField(name, value);
  };

  const handlePhoneChange = (value, country) => {
    setFormData((prev) => ({ ...prev, phone: value }));
    if (country && country.countryCode) {
      setSelectedCountryCode(country.countryCode);
    }
    const updatedData = { ...formData, phone: value };
    const errors = getValidationErrors(updatedData, activeTab);
    setFieldErrors((prev) => ({
      ...prev,
      phone: errors.phone || ""
    }));
  };

  const handleBlur = (e) => validateField(e.target.name, e.target.value);

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setError("");
    // Instantly wipe validation errors for toggled inputs
    setFieldErrors((prev) => {
      const next = { ...prev };
      delete next.email;
      return next;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Get errors synchronously for current state and tab
    const errors = getValidationErrors(formData, activeTab);
    setFieldErrors(errors);

    if (Object.keys(errors).length > 0) {
      return setError("يرجى مراجعة الحقول وتصحيح الأخطاء");
    }
    
    setLoading(true);
    setError("");

    const identifier = activeTab === "email" ? formData.email : `+${formData.phone}`;

    try {
      await register({
        name: formData.name.trim(),
        identifier: identifier.trim(),
        password: formData.password,
        confirmPassword: formData.confirmPassword,
        phoneNumber: `+${formData.phone}`.trim()
      });
      navigate("/");
    } catch (err) {
      console.log("Full Registration Error:", err.response?.data);
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

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
        <div className="bg-cesar-dark/80 backdrop-blur-md border border-white/5 rounded-[2rem] p-8 shadow-2xl shadow-black/50 relative overflow-hidden">
          <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-cesar-cyan/50 to-transparent"></div>
          
          <div className="text-center mb-6">
            <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-cesar-cyan/10 border border-cesar-cyan/20 text-cesar-cyan mb-4 shadow-[0_0_15px_rgba(0,240,255,0.15)]">
              <UserPlus className="h-8 w-8" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">إنشاء حساب جديد</h2>
            <p className="text-sm text-cesar-gray">انضم لمجتمع متجر سيزار الآن</p>
          </div>

          {/* Toggle Tabs */}
          <div className="flex border border-white/10 rounded-xl p-1 bg-black/40 mb-6 font-semibold text-sm">
            <button
              type="button"
              onClick={() => handleTabChange("email")}
              className={`flex-1 py-2.5 rounded-lg transition-all ${
                activeTab === "email"
                  ? "bg-cesar-cyan/10 text-cesar-cyan border border-cesar-cyan/20"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              البريد الإلكتروني
            </button>
            <button
              type="button"
              onClick={() => handleTabChange("phone")}
              className={`flex-1 py-2.5 rounded-lg transition-all ${
                activeTab === "phone"
                  ? "bg-cesar-cyan/10 text-cesar-cyan border border-cesar-cyan/20"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              رقم الهاتف
            </button>
          </div>

          {error && <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm text-center">{error}</div>}

          <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* Full Name */}
            <div className="space-y-1">
              <div className="relative">
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-slate-500"><User className="h-5 w-5" /></div>
                <input 
                  type="text" 
                  name="name" 
                  required 
                  value={formData.name} 
                  onChange={handleChange} 
                  onBlur={handleBlur} 
                  className={`w-full bg-black/40 border ${fieldErrors.name ? 'border-red-500 focus:ring-red-500' : 'border-white/10 focus:border-cesar-cyan focus:ring-cesar-cyan'} text-white rounded-xl pr-10 pl-4 py-3 focus:ring-1 transition outline-none text-sm`} 
                  placeholder="الاسم بالكامل" 
                />
              </div>
              {fieldErrors.name && <p className="text-red-400 text-xs pr-2">{fieldErrors.name}</p>}
            </div>

            {/* Email Field - only visible on Email Tab */}
            {activeTab === "email" && (
              <div className="space-y-1 animate-fadeIn">
                <div className="relative">
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-slate-500"><Mail className="h-5 w-5" /></div>
                  <input 
                    type="email" 
                    name="email" 
                    required 
                    value={formData.email} 
                    onChange={handleChange} 
                    onBlur={handleBlur} 
                    className={`w-full bg-black/40 border ${fieldErrors.email ? 'border-red-500 focus:ring-red-500' : 'border-white/10 focus:border-cesar-cyan focus:ring-cesar-cyan'} text-white rounded-xl pr-10 pl-4 py-3 focus:ring-1 transition outline-none text-sm`} 
                    placeholder="البريد الإلكتروني" 
                  />
                </div>
                {fieldErrors.email && <p className="text-red-400 text-xs pr-2">{fieldErrors.email}</p>}
              </div>
            )}

            {/* Phone Field - visible on both Tabs. z-40 layout wrapper prevents lower inputs overlap */}
            {(activeTab === "phone" || activeTab === "email") && (
              <div className="space-y-1 animate-fadeIn relative z-40">
                <div className="relative" dir="ltr">
                  <PhoneInput
                    country={"eg"}
                    value={formData.phone}
                    onChange={handlePhoneChange}
                    enableSearch={true}
                    placeholder="رقم الهاتف"
                    countryCodeEditable={false}
                  />
                </div>
                {selectedCountryCode === "eg" && (
                  <p className="text-slate-400 text-xs pr-2 mt-1 text-right">
                    اكتب رقم الهاتف بدون الصفر الأول (مثال: 1003481108)
                  </p>
                )}
                {fieldErrors.phone && <p className="text-red-400 text-xs pr-2 text-right">{fieldErrors.phone}</p>}
              </div>
            )}

            {/* Password */}
            <div className="space-y-1">
              <div className="relative z-10">
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-slate-500"><Lock className="h-5 w-5" /></div>
                <input 
                  type={showPassword ? "text" : "password"} 
                  name="password" 
                  required 
                  value={formData.password} 
                  onChange={handleChange} 
                  onBlur={handleBlur} 
                  className={`w-full bg-black/40 border ${fieldErrors.password ? 'border-red-500 focus:ring-red-500' : 'border-white/10 focus:border-cesar-cyan focus:ring-cesar-cyan'} text-white rounded-xl pr-10 pl-12 py-3 focus:ring-1 transition outline-none text-sm [&::-ms-reveal]:hidden [&::-ms-clear]:hidden`} 
                  placeholder="كلمة المرور" 
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute top-[1px] bottom-[1px] left-[1px] px-3 flex items-center text-slate-500 hover:text-cesar-cyan transition bg-[#0d121c] border-r border-white/10 rounded-l-xl z-20 focus:outline-none"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
              {fieldErrors.password && <p className="text-red-400 text-xs pr-2">{fieldErrors.password}</p>}
            </div>

            {/* Confirm Password */}
            <div className="space-y-1">
              <div className="relative z-10">
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-slate-500"><Lock className="h-5 w-5" /></div>
                <input 
                  type={showConfirmPassword ? "text" : "password"} 
                  name="confirmPassword" 
                  required 
                  value={formData.confirmPassword} 
                  onChange={handleChange} 
                  onBlur={handleBlur} 
                  className={`w-full bg-black/40 border ${fieldErrors.confirmPassword ? 'border-red-500 focus:ring-red-500' : 'border-white/10 focus:border-cesar-cyan focus:ring-cesar-cyan'} text-white rounded-xl pr-10 pl-12 py-3 focus:ring-1 transition outline-none text-sm [&::-ms-reveal]:hidden [&::-ms-clear]:hidden`} 
                  placeholder="تأكيد كلمة المرور" 
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute top-[1px] bottom-[1px] left-[1px] px-3 flex items-center text-slate-500 hover:text-cesar-cyan transition bg-[#0d121c] border-r border-white/10 rounded-l-xl z-20 focus:outline-none"
                >
                  {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
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