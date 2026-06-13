import { motion } from "framer-motion";
import { useEffect, useState } from "react";

export default function ParticleBackground() {
  const [particles, setParticles] = useState([]);

  useEffect(() => {
    const newParticles = Array.from({ length: 40 }).map((_, i) => ({
      id: i,
      x: Math.random() * 100,
      height: Math.random() * 50 + 20,
      duration: Math.random() * 6+ 2.5,
      delay: Math.random() * 3,
    }));
    setParticles(newParticles);
  }, []);

  return (
    <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
      {particles.map((p) => (
        <motion.div
          key={p.id}
          className="absolute bg-cesar-cyan rounded-full"
          style={{
            width: "2px", 
            height: `${p.height}px`, 
            left: `${p.x}vw`,
            boxShadow: "0 0 15px 2px rgba(0, 209, 255, 0.9)", 
          }}
          initial={{ y: "-10vh", opacity: 0 }}
          animate={{
            y: ["-10vh", "110vh"], 
            opacity: [0, 1, 1, 0],
          }}
          transition={{
            duration: p.duration,
            repeat: Infinity,
            delay: p.delay,
            ease: "linear",
          }}
        />
      ))}
    </div>
  );
}