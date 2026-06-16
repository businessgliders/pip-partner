import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, Sparkles } from 'lucide-react';

const INBOX_URL = 'https://inbox.pilatesinpinkstudio.com/inbox#events';
const SHOWCASE_IMAGE = 'https://media.base44.com/images/public/69b4780e4278ece8feeae352/4fdbd3e5b_generated_image.png';
const APP_ICON = 'https://media.base44.com/images/public/69841af9c747b033a60780f2/8796f5d2d_IMG_0093.png';

export default function MigrationPopup() {
  const [open, setOpen] = useState(true);

  const dismiss = () => setOpen(false);

  const handleTryNow = () => {
    window.open(INBOX_URL, '_blank', 'noopener,noreferrer');
    dismiss();
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4"
          style={{
            backgroundColor: 'rgba(20, 10, 15, 0.45)',
            backdropFilter: 'blur(10px)',
            WebkitBackdropFilter: 'blur(10px)',
          }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={dismiss}
        >
          <motion.div
            className="bg-white rounded-3xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-hidden"
            initial={{ opacity: 0, scale: 0.92, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 12 }}
            transition={{ type: 'spring', stiffness: 280, damping: 26 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ background: 'linear-gradient(135deg, #fbe0e2, #f7b1bd)' }}>
              <img
                src={SHOWCASE_IMAGE}
                alt="Unified PiP Inbox"
                className="w-full h-44 object-cover object-center"
              />
            </div>

            <div className="px-7 pt-6 pb-7 text-center">
              <div className="flex items-center justify-center gap-2 mb-4">
                <img
                  src={APP_ICON}
                  alt="PiP Inbox"
                  className="w-10 h-10 rounded-xl object-cover shadow-md"
                />
                <span
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full uppercase text-[11px] font-bold tracking-wider"
                  style={{ backgroundColor: 'rgba(241,136,155,0.15)', color: '#e86c84' }}
                >
                  <Sparkles className="w-3 h-3" />
                  New
                </span>
              </div>

              <h2 className="text-2xl font-bold mb-3" style={{ color: '#2a1a20' }}>
                Try the new Unified PiP Inbox
              </h2>

              <p className="text-sm leading-relaxed mb-6" style={{ color: '#7a6970' }}>
                PiP Inbox brings all your support, events, and influencer
                conversations into one beautiful place. Reply faster, stay
                organized, never miss a message.
              </p>

              <div className="flex items-center justify-center gap-5">
                <button
                  onClick={handleTryNow}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-full text-sm font-semibold text-white transition-transform hover:scale-[1.03]"
                  style={{
                    background: 'linear-gradient(135deg, #f1889b, #e86c84)',
                    boxShadow: '0 8px 20px rgba(232,108,132,0.35)',
                  }}
                >
                  Try now
                  <ArrowRight className="w-4 h-4" />
                </button>
                <button
                  onClick={dismiss}
                  className="text-sm font-semibold hover:opacity-70 transition-opacity"
                  style={{ color: '#2a1a20' }}
                >
                  Continue existing
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}