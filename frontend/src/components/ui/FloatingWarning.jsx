import { useState, useEffect } from "react";
import { AlertTriangle, X, Search, Copy, Check, ShieldAlert, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import api from "../../Services/api";

// Mock Scammers List fallback
const MOCK_SCAMMERS = [
  { _id: "1", name: "عمر خالد الجيزاوي", phone: "01123456789", reason: "وساطة وهمية وسرقة حساب ببجي", createdAt: "2026-05-12T00:00:00.000Z" },
  { _id: "2", name: "كريم محمد أبو المجد", phone: "01098765432", reason: "استلام حساب فري فاير وعدم الدفع", createdAt: "2026-06-01T00:00:00.000Z" },
  { _id: "3", name: "يوسف مصطفى عثمان", phone: "01200011122", reason: "بيع حساب مكرر ومسترد", createdAt: "2026-06-18T00:00:00.000Z" },
];

function FloatingWarning() {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [copiedId, setCopiedId] = useState(null);
  const [scammers, setScammers] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const fetchScammers = async () => {
        setLoading(true);
        try {
          const response = await api.get("/scammers");
          setScammers(Array.isArray(response.data) ? response.data : []);
        } catch (err) {
          console.error("Failed to fetch scammers, falling back to mock data:", err);
          setScammers(MOCK_SCAMMERS);
        } finally {
          setLoading(false);
        }
      };
      fetchScammers();
    }
  }, [isOpen]);

  const handleCopy = (id, text) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const filteredScammers = scammers.filter(
    (scammer) =>
      scammer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      scammer.phone.includes(searchQuery) ||
      scammer.reason.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <>
      {/* Custom pulsing animation style */}
      <style>{`
        @keyframes warning-pulse {
          0% {
            box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.7);
          }
          70% {
            box-shadow: 0 0 0 15px rgba(239, 68, 68, 0);
          }
          100% {
            box-shadow: 0 0 0 0 rgba(239, 68, 68, 0);
          }
        }
        .warning-fab-pulse {
          animation: warning-pulse 2s infinite;
        }
      `}</style>

      {/* Floating Action Button (FAB) */}
      <div className="fixed bottom-20 left-4 md:bottom-6 md:left-6 z-40">
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setIsOpen(true)}
          className="warning-fab-pulse flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-r from-red-600 via-orange-600 to-amber-500 text-white shadow-lg shadow-red-900/40 outline-none transition focus:ring-2 focus:ring-red-400 focus:ring-offset-2 focus:ring-offset-black"
          aria-label="تحذير أمني وقائمة المحظورين"
        >
          <AlertTriangle className="h-7 w-7 text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.3)]" />
        </motion.button>
      </div>

      {/* Warning & Scammer List Modal */}
      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-md"
            />

            {/* Modal Box */}
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              transition={{ type: "spring", duration: 0.45 }}
              className="relative w-full max-w-xl overflow-hidden rounded-[2rem] border border-red-500/20 bg-cesar-dark/95 p-6 md:p-8 shadow-2xl shadow-red-950/20 text-right font-cairo text-white backdrop-blur-xl"
            >
              {/* Top Red Glow Line */}
              <div className="absolute inset-x-0 top-0 h-[3px] bg-gradient-to-r from-transparent via-red-500 to-transparent" />

              {/* Close Button */}
              <button
                onClick={() => setIsOpen(false)}
                className="absolute top-6 left-6 text-slate-400 hover:text-white transition rounded-lg p-1.5 hover:bg-white/5 focus:outline-none"
              >
                <X className="h-5 w-5" />
              </button>

              {/* Modal Header */}
              <div className="flex items-center gap-3 mb-6 border-b border-white/5 pb-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-red-500/20 bg-red-500/10 text-red-500 shadow-[0_0_15px_rgba(239,68,68,0.2)]">
                  <ShieldAlert className="h-6 w-6" />
                </div>
                <div>
                  <h2 className="text-xl font-bold tracking-wide">تحذير أمني هام</h2>
                  <p className="text-xs text-red-400 mt-0.5">تعليمات السلامة وقائمة المحظورين</p>
                </div>
              </div>

              {/* Warning Content */}
              <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-5 mb-6 shadow-inner relative overflow-hidden">
                <div className="absolute top-0 right-0 p-3 opacity-5 pointer-events-none">
                  <AlertTriangle className="w-24 h-24 text-red-500" />
                </div>
                <h3 className="text-red-400 font-bold text-base mb-2 flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 shrink-0" />
                  حماية تعاملاتك المالية
                </h3>
                <p className="text-sm leading-relaxed text-slate-200">
                  تحذير هام: يرجى الحذر من عمليات النصب. تأكد من موثوقية البائع قبل تحويل أي مبالغ مالية. ننصح دائمًا باستخدام وساطة معتمدة أو مقابلة مباشرة إذا كان ذلك ممكنًا.
                </p>
              </div>

              {/* Scammers List Section */}
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <h3 className="text-md font-bold text-white">قائمة المحظورين (محدثة باستمرار)</h3>
                  
                  {/* Search input inside modal */}
                  <div className="relative w-full sm:w-60">
                    <input
                      type="text"
                      placeholder="ابحث بالاسم أو الهاتف..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full bg-black/40 border border-white/10 rounded-xl py-2 pl-3 pr-9 text-xs outline-none focus:border-red-500/50 transition"
                    />
                    <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                  </div>
                </div>

                {/* Scammers List Content */}
                <div className="max-h-64 overflow-y-auto pr-1 space-y-3 scrollbar-thin scrollbar-thumb-white/10">
                  {loading ? (
                    <div className="flex justify-center items-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin text-red-500" />
                    </div>
                  ) : filteredScammers.length === 0 ? (
                    <div className="text-center py-8 bg-black/20 rounded-2xl border border-white/5 text-slate-400 text-sm">
                      لا يوجد محظورين يطابقون هذا البحث.
                    </div>
                  ) : (
                    filteredScammers.map((scammer) => (
                      <div
                        key={scammer._id}
                        className="bg-black/30 border border-white/5 rounded-2xl p-4 transition duration-300 hover:border-red-500/20"
                      >
                        <div className="flex justify-between items-start gap-4">
                          <div className="space-y-1 flex-1">
                            <h4 className="font-bold text-sm text-white">{scammer.name}</h4>
                            <p className="text-xs text-red-400/90 leading-relaxed font-medium">
                              السبب: {scammer.reason}
                            </p>
                            {scammer.createdAt && (
                              <span className="inline-block text-[10px] text-slate-500 pt-1">
                                تاريخ الإضافة: {new Date(scammer.createdAt).toLocaleDateString("ar-EG")}
                              </span>
                            )}
                          </div>

                          <div className="flex flex-col items-end gap-2">
                            <span className="text-xs font-mono font-bold text-slate-300 tracking-wider">
                              {scammer.phone}
                            </span>
                            <button
                              onClick={() => handleCopy(scammer._id, scammer.phone)}
                              className="flex items-center gap-1.5 text-[11px] font-semibold text-cesar-cyan hover:text-cyan-400 transition"
                              title="نسخ رقم الهاتف"
                            >
                              {copiedId === scammer._id ? (
                                <>
                                  <Check className="h-3 w-3 text-emerald-400" />
                                  <span className="text-emerald-400">تم النسخ</span>
                                </>
                              ) : (
                                <>
                                  <Copy className="h-3 w-3" />
                                  <span>نسخ الرقم</span>
                                </>
                              )}
                            </button>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Close Action in Footer */}
              <div className="mt-8 border-t border-white/5 pt-4 flex justify-end">
                <button
                  onClick={() => setIsOpen(false)}
                  className="rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 px-5 py-2.5 text-sm font-semibold text-white transition focus:outline-none"
                >
                  إغلاق النافذة
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}

export default FloatingWarning;
