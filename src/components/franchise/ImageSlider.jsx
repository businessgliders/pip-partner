import React, { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

export default function ImageSlider({ images, interval = 4500, className = "", children }) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (!images || images.length <= 1) return;
    const id = setInterval(() => {
      setIndex((i) => (i + 1) % images.length);
    }, interval);
    return () => clearInterval(id);
  }, [images, interval]);

  return (
    <div className={`relative overflow-hidden ${className}`}>
      <AnimatePresence initial={false}>
        <motion.div
          key={index}
          initial={{ opacity: 0, scale: 1.04 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 1 }}
          transition={{ duration: 1.2, ease: "easeInOut" }}
          className="absolute inset-0"
          style={{
            backgroundImage: `url('${images[index]}')`,
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        />
      </AnimatePresence>
      {children}
    </div>
  );
}