import { useTranslation } from "react-i18next";
import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import {
  FaWhatsapp,
  FaFacebookF,
  FaTelegramPlane,
  FaTiktok,
  FaLink,
} from "react-icons/fa";
import { MonitorPlay, RefreshCw, Sparkles, Play, X } from "lucide-react";
import api from "../Services/api.js";
import useDocumentTitle from "../hooks/useDocumentTitle.js";
// import ParticleBackground from "../components/layout/ParticleBackground.jsx";
import CesarLogo from "../components/CesarLogo.jsx";

const platformIconMap = {
  whatsapp: FaWhatsapp,
  facebook: FaFacebookF,
  telegram: FaTelegramPlane,
  instagram: FaLink,
  tiktok: FaTiktok,
  other: FaLink,
};

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.12,
      delayChildren: 0.12,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 28 },
  show: { opacity: 1, y: 0 },
};

function getLinkIcon(platform) {
  return platformIconMap[platform] || MonitorPlay;
}

function HomePage() {
  const { t, i18n } = useTranslation();
  useDocumentTitle(t("nav.logo") + " | " + t("nav.home"));

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [retryToken, setRetryToken] = useState(0);
  const [socialLinks, setSocialLinks] = useState([]);
  const [alertMessage, setAlertMessage] = useState("");
  const [adminNumbers, setAdminNumbers] = useState([]);
  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const fetchSettings = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await api.get("/settings");
        const settings = response.data || {};

        if (!isMounted) {
          return;
        }

        setSocialLinks(
          Array.isArray(settings.socialLinks) ? settings.socialLinks : [],
        );
        setAlertMessage(
          typeof settings.alertMessage === "string"
            ? settings.alertMessage
            : "",
        );
        setAdminNumbers(
          Array.isArray(settings.adminContactNumbers)
            ? settings.adminContactNumbers
            : [],
        );
      } catch {
        if (!isMounted) {
          return;
        }

        setError(t("home.errorLoad"));
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
  }, [retryToken]);

  // const cards = useMemo(() => {
  //   const mapped = socialLinks.map((link, index) => ({
  //     ...link,
  //     index,
  //     Icon: getLinkIcon(link.platform),
  //   }));
  //   return mapped.sort((a, b) => {
  //     const isWhatsappA = (a.platform || "").toLowerCase() === "whatsapp";
  //     const isWhatsappB = (b.platform || "").toLowerCase() === "whatsapp";

  //     // 1. Platform Priority: WhatsApp always at the top
  //     if (isWhatsappA && !isWhatsappB) return -1;
  //     if (!isWhatsappA && isWhatsappB) return 1;

  //     // 2. Platform Grouping (for non-WhatsApp items)
  //     if (!isWhatsappA && !isWhatsappB) {
  //       const platformComp = (a.platform || "").localeCompare(b.platform || "");
  //       if (platformComp !== 0) return platformComp;
  //     }

  //     // Both are of the same platform (or both are WhatsApp)
  //     const titleA = a.title || "";
  //     const titleB = b.title || "";
  //     const isChannelA = titleA.includes("قناة");
  //     const isChannelB = titleB.includes("قناة");

  //     // 3. Channel Placement: Pushed to the bottom of the platform group
  //     if (isChannelA && !isChannelB) return 1;
  //     if (!isChannelA && isChannelB) return -1;

  //     // 4. Alphabetical Order (for title)
  //     return titleA.localeCompare(titleB, undefined, { numeric: true });
  //   });
  // }, [socialLinks]);
  const cards = useMemo(() => {
    return socialLinks.map((link, index) => ({
      ...link,
      index,
      Icon: getLinkIcon(link.platform),
    }));
  }, [socialLinks]);

  return (
    <section
      dir={i18n.dir()}
      className="relative isolate min-h-screen overflow-hidden bg-cesar-darker px-4 py-6 font-cairo text-white sm:px-6 lg:px-8"
    >
      {/* <ParticleBackground /> */}

      <div className="pointer-events-none absolute inset-x-0 top-0 h-72 bg-gradient-to-b from-black/70 via-black/45 to-transparent" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-44 bg-[radial-gradient(circle_at_center,rgba(0,240,255,0.18),transparent_60%)] opacity-70 blur-3xl" />
      <div className="pointer-events-none absolute top-0 h-24 w-full border-b border-white/5 bg-black/35 backdrop-blur-sm" />

      <div className="pointer-events-none absolute inset-x-0 top-0 z-0 h-80 overflow-hidden">
        <div className="absolute inset-0 border-b border-white/5 bg-[linear-gradient(180deg,rgba(5,5,5,0.88),rgba(5,5,5,0.58))]" />
        <div className="absolute inset-x-[10%] top-10 h-32 rounded-full bg-cesar-cyan/10 blur-3xl" />
      </div>

      <div className="relative z-10 mx-auto flex w-full max-w-7xl flex-col gap-8">
        <motion.header
          initial={{ opacity: 0, y: -28 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: "easeOut" }}
          className="flex flex-col items-center gap-3 pt-5 text-center"
        >
          {/* <div className="inline-flex items-center gap-2 rounded-full border border-white/8 bg-white/5 px-4 py-2 text-xs font-semibold uppercase tracking-[0.35em] text-cesar-gray backdrop-blur">
            <Sparkles className="h-4 w-4 text-cesar-cyan" />
            Portal رئيسي
          </div> */}

          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="flex flex-col md:flex-row items-center justify-center gap-4 md:gap-6 my-4"
          >
            <CesarLogo className="w-24 h-24 md:w-20 md:h-20 animate-pulse drop-shadow-[0_0_20px_rgba(0,209,255,0.8)]" />
            <h1 className="text-5xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cesar-cyan to-white drop-shadow-[0_0_15px_rgba(0,209,255,0.5)] pb-4 leading-normal">
              {t("home.heroTitle")}
            </h1>
          </motion.div>

          <p className="max-w-2xl text-sm leading-7 text-cesar-gray sm:text-base">
            {t("home.heroSubtitle")}
          </p>

          <div className="mt-6 flex flex-wrap items-center justify-center gap-4">
            <Link
              to="/posts"
              className="inline-flex items-center gap-2 rounded-full bg-cesar-cyan px-6 py-2.5 text-sm font-bold text-cesar-darker transition duration-300 hover:bg-white hover:shadow-neon-cyan shadow-[0_0_15px_rgba(0,240,255,0.4)]"
            >
              {t("nav.posts")}
            </Link>
            <button
              onClick={() => setIsVideoModalOpen(true)}
              className="inline-flex items-center gap-2 rounded-full border border-cesar-cyan/30 bg-cesar-cyan/10 px-6 py-2.5 text-sm font-bold text-cesar-cyan transition duration-300 hover:bg-cesar-cyan/20 hover:shadow-neon-cyan"
            >
              <Play className="h-4 w-4 fill-current" />
              {t("home.howToUse")}
            </button>
          </div>
        </motion.header>

        {loading ? (
          <div className="flex min-h-[52vh] items-center justify-center">
            <div className="flex flex-col items-center gap-5 rounded-[2rem] border border-white/8 bg-white/5 px-10 py-12 shadow-2xl shadow-cyan-950/20 backdrop-blur-xl">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1.2, repeat: Infinity, ease: "linear" }}
                className="relative h-18 w-18 rounded-full border border-cesar-cyan/30"
              >
                <motion.div
                  animate={{ scale: [1, 1.15, 1] }}
                  transition={{
                    duration: 1.4,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                  className="absolute inset-2 rounded-full border border-cesar-cyan/60 shadow-neon-cyan"
                />
                <motion.div
                  animate={{ opacity: [0.45, 1, 0.45] }}
                  transition={{
                    duration: 1.1,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                  className="absolute inset-0 rounded-full bg-cesar-cyan/10 blur-sm"
                />
              </motion.div>
              <p className="text-sm text-cesar-gray">
                {t("home.loadingPortal")}
              </p>
            </div>
          </div>
        ) : error ? (
          <div className="mx-auto flex min-h-[52vh] w-full max-w-2xl items-center justify-center">
            <div className="w-full rounded-[2rem] border border-red-500/20 bg-red-500/10 p-6 text-center shadow-2xl shadow-red-950/20 backdrop-blur-xl">
              <p className="text-sm font-medium text-red-300">{error}</p>
              <button
                type="button"
                onClick={() =>
                  setRetryToken((currentToken) => currentToken + 1)
                }
                className="mt-5 inline-flex items-center gap-2 rounded-full border border-red-400/25 bg-red-500/10 px-5 py-3 text-sm font-semibold text-red-200 transition hover:bg-red-500/20 hover:text-white"
              >
                <RefreshCw className="h-4 w-4" />
                {t("home.retryBtn")}
              </button>
            </div>
          </div>
        ) : (
          <motion.main
            variants={containerVariants}
            initial="hidden"
            animate="show"
            className="space-y-8 pb-12"
          >
            {alertMessage ? (
              <motion.div
                variants={itemVariants}
                className="rounded-2xl border border-red-500/30 bg-red-500/10 px-5 py-4 text-sm leading-7 text-red-400 shadow-lg shadow-red-950/10 backdrop-blur-md"
              >
                {alertMessage}
              </motion.div>
            ) : null}

            <motion.section
              variants={itemVariants}
              className="grid gap-4 rounded-[2rem] border border-white/5 bg-cesar-dark/85 p-5 shadow-2xl shadow-black/30 backdrop-blur-xl lg:grid-cols-[1.1fr_0.9fr] lg:p-6"
            >
              <div className="space-y-4">
                <div className="inline-flex rounded-full border border-cesar-cyan/20 bg-cesar-cyan/10 px-4 py-2 text-xs font-semibold tracking-[0.25em] text-cesar-cyan">
                  {t("home.liveBadge")}
                </div>
                <h2 className="text-3xl font-bold leading-tight sm:text-4xl lg:text-3xl lg:leading-tight">
                  {t("home.bannerTitle")}
                </h2>
                <p className="max-w-2xl text-sm leading-7 text-cesar-gray sm:text-base lg:text-sm lg:leading-6">
                  {t("home.bannerDescription")}
                </p>
              </div>
            </motion.section>

            <motion.section variants={containerVariants} className="space-y-4">
              <div className="flex items-center justify-between gap-4">
                <h3 className="text-xl font-semibold text-white sm:text-xl md:text-2xl lg:text-2xl">
                  {t("home.channelsTitle")}
                </h3>
                <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-cesar-gray">
                  {cards.length} {t("home.linksCount")}
                </span>
              </div>

              {cards.length > 0 ? (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {cards.map((link) => {
                    const Icon = link.Icon;

                    return (
                      <motion.a
                        key={link._id || `${link.title}-${link.url}`}
                        variants={itemVariants}
                        href={link.url}
                        target="_blank"
                        rel="noreferrer"
                        whileHover={{ y: -6, scale: 1.01 }}
                        whileTap={{ scale: 0.98 }}
                        className="group rounded-2xl border border-white/5 bg-cesar-dark p-5 transition duration-300 hover:shadow-neon-cyan"
                      >
                        <div className="flex items-center justify-between gap-4">
                          <div className="space-y-2">
                            <div className="flex items-center gap-3">
                              <span className="flex h-12 w-12 items-center justify-center rounded-2xl border border-cesar-cyan/20 bg-cesar-cyan/10 text-cesar-cyan shadow-[0_0_18px_rgba(0,240,255,0.16)] transition group-hover:shadow-neon-cyan">
                                <Icon className="h-5 w-5" />
                              </span>
                              <div>
                                <h4 className="text-base font-bold text-white md:text-base lg:text-lg">
                                  {" "}
                                  {link.title}
                                </h4>
                                <p className="text-xs uppercase tracking-[0.25em] text-cesar-gray">
                                  {link.platform || "other"}
                                </p>
                              </div>
                            </div>
                            {link.subtitle ? (
                              <p className="max-w-sm text-sm leading-6 text-cesar-gray md:text-sm lg:text-sm lg:mt-1">
                                {" "}
                                {link.subtitle}
                              </p>
                            ) : null}
                          </div>

                          <div className="shrink-0 rounded-full border border-white/8 bg-white/5 px-3 py-1 text-xs md:text-sm lg:text-sm lg:px-4 lg:py-1.5 text-slate-300 transition group-hover:border-cesar-cyan/25 group-hover:text-white font-medium">
                            {" "}
                            {t("home.openLinkBtn")}
                          </div>
                        </div>
                      </motion.a>
                    );
                  })}
                </div>
              ) : (
                <div className="rounded-2xl border border-white/5 bg-white/5 px-6 py-8 text-sm text-cesar-gray backdrop-blur-sm">
                  {t("home.noLinks")}
                </div>
              )}
            </motion.section>

            {adminNumbers.length > 0 ? (
              <motion.section
                variants={containerVariants}
                className="space-y-4 pt-6 border-t border-white/5"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-500/10 text-green-400 border border-green-500/20">
                    <FaWhatsapp className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white lg:text-xl">
                      {t("home.contactAdminTitle")}
                    </h3>
                    <p className="text-xs text-cesar-gray lg:text-sm">
                      {t("home.contactAdminSubtitle")}
                    </p>
                  </div>
                </div>

                <div className="grid gap-3 grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
                  {adminNumbers.map((link, index) => {
                    const displayNum = link.replace("https://wa.me/", "+");

                    return (
                      <motion.a
                        key={index}
                        variants={itemVariants}
                        href={link}
                        target="_blank"
                        rel="noreferrer"
                        whileHover={{ y: -4 }}
                        whileTap={{ scale: 0.95 }}
                        className="group flex flex-col items-center justify-center gap-2 rounded-2xl border border-white/5 bg-cesar-dark p-4 transition duration-300 hover:border-green-500/30 hover:bg-green-500/5 hover:shadow-[0_0_15px_rgba(34,197,94,0.15)]"
                      >
                        <FaWhatsapp className="h-6 w-6 text-slate-400 transition group-hover:text-green-400" />
                        <span
                          className="text-xs font-semibold text-slate-300 transition group-hover:text-white"
                          dir="ltr"
                        >
                          {displayNum}
                        </span>
                        <span className="text-[10px] text-cesar-gray">
                          {t("home.adminLabel")} {index + 1}
                        </span>
                      </motion.a>
                    );
                  })}
                </div>
              </motion.section>
            ) : null}

            <motion.section
              variants={containerVariants}
              className="space-y-4 pt-6 mt-6 border-t border-white/5"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-500/10 text-sky-400 border border-sky-500/20">
                  <FaTelegramPlane className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white lg:text-xl">
                    تواصل مع الإدارة
                  </h3>
                  <p className="text-xs text-cesar-gray lg:text-sm">
                    الدعم الفني عبر تيليجرام
                  </p>
                </div>
              </div>

              <div className="grid gap-3 grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
                <motion.a
                  variants={itemVariants}
                  href="https://t.me/m/VaAqq6mjMDBk"
                  target="_blank"
                  rel="noreferrer"
                  whileHover={{ y: -4 }}
                  whileTap={{ scale: 0.95 }}
                  className="group flex flex-col items-center justify-center gap-2 rounded-2xl border border-white/5 bg-cesar-dark p-4 transition duration-300 hover:border-sky-500/30 hover:bg-sky-500/5 hover:shadow-[0_0_15px_rgba(14,165,233,0.15)]"
                >
                  <FaTelegramPlane className="h-6 w-6 text-slate-400 transition group-hover:text-sky-400" />
                  <span
                    className="text-xs font-semibold text-slate-300 transition group-hover:text-white"
                    dir="ltr"
                  >
                    VaAqq6mjMDBk
                  </span>
                  <span className="text-[10px] text-cesar-gray">
                    إدارة سيزار
                  </span>
                </motion.a>
              </div>
            </motion.section>
          </motion.main>
        )}
      </div>

      {/* Video Modal */}
      {isVideoModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm p-4"
          onClick={() => setIsVideoModalOpen(false)}
        >
          <div
            className="relative w-full max-w-sm aspect-[9/16] rounded-xl overflow-hidden border border-cesar-cyan shadow-[0_0_30px_rgba(0,240,255,0.3)] bg-cesar-dark"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button
              onClick={() => setIsVideoModalOpen(false)}
              className="absolute top-4 right-4 z-10 p-2 rounded-full bg-black/60 border border-white/10 text-white hover:text-cesar-cyan hover:border-cesar-cyan/50 hover:bg-black/85 transition duration-200"
              aria-label="Close modal"
            >
              <X className="h-5 w-5" />
            </button>

            <iframe
              className="w-full h-full"
              src="https://www.youtube.com/embed/S6GQD0fg1fM"
              title="How to use the platform"
              allow="autoplay; encrypted-media"
              allowFullScreen
            />
          </div>
        </div>
      )}
    </section>
  );
}

export default HomePage;
