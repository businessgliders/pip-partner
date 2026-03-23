import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import PasswordGate from "@/components/PasswordGate";
import { motion, AnimatePresence } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Sparkles, CheckCircle2, Smile, CalendarDays, Camera, Home } from "lucide-react";

const PROVINCES = [
  "Alberta", "British Columbia", "Manitoba", "New Brunswick",
  "Newfoundland and Labrador", "Nova Scotia", "Northwest Territories",
  "Nunavut", "Ontario", "Prince Edward Island", "Quebec", "Saskatchewan", "Yukon"
];

export default function FrontAdmin() {
  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    email: "",
    preferred_studio: "",
    postal_code: "",
    province: "",
    message: "",
    resume_url: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [resumeFile, setResumeFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleResumeUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setResumeFile(file);
    setUploading(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    setFormData((prev) => ({ ...prev, resume_url: file_url }));
    setUploading(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    await base44.entities.FrontAdminApplication.create(formData);
    await base44.functions.invoke('sendFrontAdminApplicationEmail', { applicationData: formData });
    setIsSubmitting(false);
    setIsSubmitted(true);
  };

  const highlights = [
    { icon: Smile, title: "Be the Welcome", description: "Greet every client with warmth and set the tone for their experience" },
    { icon: CalendarDays, title: "Keep Things Flowing", description: "Manage bookings and ensure the studio runs seamlessly day to day" },
    { icon: Camera, title: "Create & Share", description: "Shoot content and post on our social media to grow our community" },
    { icon: Home, title: "Own the Space", description: "Make the studio feel like home for every single person who walks in" },
  ];

  return (
    <PasswordGate>
    <div className="min-h-screen" style={{ background: "linear-gradient(180deg, #5f8fa8 0%, #89b4cc 30%, #d6eaf4 60%, #eef6fa 100%)" }}>
      {/* Hero */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-10 w-64 h-64 rounded-full bg-white/30 blur-3xl" />
          <div className="absolute bottom-10 right-10 w-96 h-96 rounded-full bg-[#5f8fa8]/20 blur-3xl" />
        </div>
        <div className="relative max-w-4xl mx-auto px-6 pt-12 pb-8 text-center">
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <img
              src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/user_690aada19e27fe8fcf067828/33a04cb27_Pilatesinpinklogojusticon1.png"
              alt="Pilates in Pink™"
              className="w-20 h-20 mx-auto mb-6"
            />
            <img
              src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/697a18eb75a9e57a35bc853a/29d852d1f_.png"
              alt="Pilates in Pink™"
              className="h-8 mx-auto mb-8"
            />
            <h1 className="text-4xl md:text-5xl font-light text-white mb-4 tracking-wide">
              Join as Front Desk
            </h1>
            <p className="text-lg text-white/90 max-w-xl mx-auto font-light leading-relaxed">
              Be the heart of our studio — the first smile, the warm energy, and the reason every client feels right at home.
            </p>
          </motion.div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-12">
        {/* Highlights */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12"
        >
          {highlights.map((item, index) => (
            <motion.div
              key={item.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.3 + index * 0.1 }}
              className="bg-white/60 backdrop-blur-sm rounded-2xl p-5 text-center hover:bg-white/80 transition-all duration-300"
            >
              <div className="w-12 h-12 mx-auto mb-3 rounded-full flex items-center justify-center" style={{ background: "rgba(95,143,168,0.15)" }}>
                <item.icon className="w-6 h-6" style={{ color: "#3d7a9e" }} />
              </div>
              <h3 className="font-medium text-sm mb-1" style={{ color: "#3d7a9e" }}>{item.title}</h3>
              <p className="text-xs leading-relaxed" style={{ color: "rgba(61,122,158,0.7)" }}>{item.description}</p>
            </motion.div>
          ))}
        </motion.div>

        {/* Role description */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="bg-white/60 backdrop-blur-sm rounded-3xl p-8 mb-8 text-center"
        >
          <h2 className="text-2xl font-light mb-4" style={{ color: "#3d7a9e" }}>About the Role</h2>
          <p className="leading-relaxed max-w-2xl mx-auto" style={{ color: "rgba(61,122,158,0.85)" }}>
            You're the friendly face that greets every client and the energy that sets the tone for their visit. As part of our front desk team, you'll welcome guests, manage bookings, and bring our brand to life through social media content creation and posting. You keep the studio running seamlessly — and you make everyone feel right at home the moment they walk through the door.
          </p>
        </motion.div>

        {/* Application Form */}
        <AnimatePresence mode="wait">
          {!isSubmitted ? (
            <motion.div
              key="form"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.5 }}
              className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl p-8 md:p-10"
            >
              <div className="text-center mb-8">
                <h2 className="text-2xl font-light mb-2" style={{ color: "#3d7a9e" }}>Apply Now</h2>
                <p className="text-sm" style={{ color: "rgba(61,122,158,0.7)" }}>Take the first step toward joining the Pilates in Pink™ family</p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label className="font-medium text-sm" style={{ color: "#3d7a9e" }}>First Name *</Label>
                    <Input
                      required
                      placeholder="First name"
                      value={formData.first_name}
                      onChange={(e) => handleInputChange("first_name", e.target.value)}
                      className="rounded-xl h-12 bg-white/50"
                      style={{ borderColor: "rgba(95,143,168,0.4)" }}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="font-medium text-sm" style={{ color: "#3d7a9e" }}>Last Name *</Label>
                    <Input
                      required
                      placeholder="Last name"
                      value={formData.last_name}
                      onChange={(e) => handleInputChange("last_name", e.target.value)}
                      className="rounded-xl h-12 bg-white/50"
                      style={{ borderColor: "rgba(95,143,168,0.4)" }}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="font-medium text-sm" style={{ color: "#3d7a9e" }}>Email *</Label>
                  <Input
                    required
                    type="email"
                    placeholder="your.email@example.com"
                    value={formData.email}
                    onChange={(e) => handleInputChange("email", e.target.value)}
                    className="rounded-xl h-12 bg-white/50"
                    style={{ borderColor: "rgba(95,143,168,0.4)" }}
                  />
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label className="font-medium text-sm" style={{ color: "#3d7a9e" }}>Preferred Studio</Label>
                    <Select value={formData.preferred_studio} onValueChange={(v) => handleInputChange("preferred_studio", v)}>
                      <SelectTrigger className="rounded-xl h-12 bg-white/50" style={{ borderColor: "rgba(95,143,168,0.4)" }}>
                        <SelectValue placeholder="Choose studio" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Brampton">Brampton</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="font-medium text-sm" style={{ color: "#3d7a9e" }}>Postal Code</Label>
                    <Input
                      placeholder="A1A 1A1"
                      value={formData.postal_code}
                      onChange={(e) => handleInputChange("postal_code", e.target.value)}
                      className="rounded-xl h-12 bg-white/50"
                      style={{ borderColor: "rgba(95,143,168,0.4)" }}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="font-medium text-sm" style={{ color: "#3d7a9e" }}>Province</Label>
                  <Select value={formData.province} onValueChange={(v) => handleInputChange("province", v)}>
                    <SelectTrigger className="rounded-xl h-12 bg-white/50" style={{ borderColor: "rgba(95,143,168,0.4)" }}>
                      <SelectValue placeholder="Choose province" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Ontario">Ontario</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="font-medium text-sm" style={{ color: "#3d7a9e" }}>Tell us about yourself</Label>
                  <Textarea
                    placeholder="Share a bit about who you are and why you'd thrive in this role..."
                    value={formData.message}
                    onChange={(e) => handleInputChange("message", e.target.value)}
                    className="rounded-xl min-h-[120px] bg-white/50 resize-none"
                    style={{ borderColor: "rgba(95,143,168,0.4)" }}
                  />
                </div>

                <div className="space-y-2">
                  <Label className="font-medium text-sm" style={{ color: "#3d7a9e" }}>Attach Resume</Label>
                  <div className="border-2 border-dashed rounded-xl p-6 text-center bg-white/30 hover:bg-white/50 transition-colors" style={{ borderColor: "rgba(95,143,168,0.5)" }}>
                    <input
                      type="file"
                      accept=".pdf,.doc,.docx,.jpg,.png"
                      onChange={handleResumeUpload}
                      className="hidden"
                      id="resume-upload"
                    />
                    <label htmlFor="resume-upload" className="cursor-pointer">
                      {uploading ? (
                        <p className="text-sm" style={{ color: "rgba(61,122,158,0.7)" }}>Uploading...</p>
                      ) : resumeFile ? (
                        <p className="text-sm font-medium" style={{ color: "#3d7a9e" }}>✓ {resumeFile.name}</p>
                      ) : (
                        <>
                          <p className="text-sm" style={{ color: "rgba(61,122,158,0.7)" }}>Click to upload or drag and drop</p>
                          <p className="text-xs mt-1" style={{ color: "rgba(61,122,158,0.5)" }}>PDF, DOC, DOCX, JPG or PNG • Max 15MB</p>
                        </>
                      )}
                    </label>
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={isSubmitting || uploading}
                  className="w-full h-14 rounded-xl text-white font-medium text-base transition-all duration-300 hover:opacity-90 hover:shadow-lg"
                  style={{ background: "linear-gradient(135deg, #3d7a9e 0%, #5f8fa8 100%)" }}
                >
                  {isSubmitting ? (
                    <span className="flex items-center gap-2">
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full"
                      />
                      Submitting...
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <Sparkles className="w-5 h-5" />
                      Submit Application
                    </span>
                  )}
                </Button>
              </form>
            </motion.div>
          ) : (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
              className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl p-12 text-center"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                className="w-20 h-20 mx-auto mb-6 rounded-full flex items-center justify-center"
                style={{ background: "rgba(95,143,168,0.2)" }}
              >
                <CheckCircle2 className="w-10 h-10" style={{ color: "#3d7a9e" }} />
              </motion.div>
              <h2 className="text-2xl font-light mb-3" style={{ color: "#3d7a9e" }}>Application Received!</h2>
              <p className="max-w-md mx-auto leading-relaxed" style={{ color: "rgba(61,122,158,0.7)" }}>
                Thank you for your interest in joining the Pilates in Pink™ team. We'll review your application and be in touch within a few business days.
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Cross-promo banners */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="mt-10 flex flex-col gap-4"
        >
          <div className="bg-white/60 backdrop-blur-sm rounded-3xl p-8 flex flex-col md:flex-row items-center justify-between gap-6">
            <div>
              <h3 className="text-lg font-medium mb-1" style={{ color: "#3d7a9e" }}>Passionate about Pilates?</h3>
              <p className="text-sm" style={{ color: "rgba(61,122,158,0.7)" }}>If you'd love to teach on the floor, check out our Instructor Program.</p>
            </div>
            <a
              href="/Instructor"
              className="shrink-0 px-6 py-3 rounded-xl text-white text-sm font-medium transition-all duration-300 hover:opacity-90 hover:shadow-lg"
              style={{ background: "linear-gradient(135deg, #3d7a9e 0%, #5f8fa8 100%)" }}
            >
              Apply as Instructor →
            </a>
          </div>
          <div className="bg-white/60 backdrop-blur-sm rounded-3xl p-8 flex flex-col md:flex-row items-center justify-between gap-6">
            <div>
              <h3 className="text-lg font-medium mb-1" style={{ color: "#3d7a9e" }}>Love Pilates but prefer to promote?</h3>
              <p className="text-sm" style={{ color: "rgba(61,122,158,0.7)" }}>Check out our Influencer Program and partner with us on social media.</p>
            </div>
            <a
              href="/InfluencerProgram"
              className="shrink-0 px-6 py-3 rounded-xl text-white text-sm font-medium transition-all duration-300 hover:opacity-90 hover:shadow-lg"
              style={{ background: "linear-gradient(135deg, #3d7a9e 0%, #5f8fa8 100%)" }}
            >
              Join as Influencer →
            </a>
          </div>
        </motion.div>

        <div className="text-center mt-12 pb-8">
          <p className="text-sm" style={{ color: "rgba(61,122,158,0.5)" }}>
            © {new Date().getFullYear()} Pilates in Pink™ • All rights reserved
          </p>
        </div>
      </div>
    </div>
    </PasswordGate>
  );
}