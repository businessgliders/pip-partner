import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { motion, AnimatePresence } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Sparkles, CheckCircle2, Star, Award, Heart, Dumbbell, ChevronDown, ChevronUp } from "lucide-react";

const QUALIFICATIONS = [
  "Personal Training / Group Fitness Cert",
  "Kinesiology Degree or Similar",
  "Pilates, Dance or Performance Trained",
  "6+ Months of Coaching Experience",
  "CPR/AED/First Aid Training",
];

const PROVINCES = [
  "Alberta", "British Columbia", "Manitoba", "New Brunswick",
  "Newfoundland and Labrador", "Nova Scotia", "Northwest Territories",
  "Nunavut", "Ontario", "Prince Edward Island", "Quebec", "Saskatchewan", "Yukon"
];

function FAQItem({ question, answer }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-[#f7b1bd]/40 last:border-0">
      <button
        className="w-full text-left py-4 flex items-center justify-between gap-4 text-[#b67651] font-medium"
        onClick={() => setOpen(!open)}
      >
        <span>{question}</span>
        {open ? <ChevronUp className="w-4 h-4 shrink-0" /> : <ChevronDown className="w-4 h-4 shrink-0" />}
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <p className="text-[#b67651]/70 text-sm leading-relaxed pb-4">{answer}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function Hire() {
  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    email: "",
    preferred_studio: "",
    postal_code: "",
    province: "",
    qualifications: [],
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

  const handleQualificationToggle = (qual) => {
    setFormData((prev) => ({
      ...prev,
      qualifications: prev.qualifications.includes(qual)
        ? prev.qualifications.filter((q) => q !== qual)
        : [...prev.qualifications, qual],
    }));
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
    await base44.entities.InstructorApplication.create(formData);
    await base44.functions.invoke('sendInstructorApplicationEmail', { applicationData: formData });
    setIsSubmitting(false);
    setIsSubmitted(true);
  };

  const highlights = [
    { icon: Star, title: "Supportive Community", description: "Join a passionate team of wellness professionals" },
    { icon: Award, title: "Training Provided", description: "Comprehensive onboarding and ongoing development" },
    { icon: Heart, title: "Meaningful Work", description: "Help clients transform their bodies and mindsets" },
    { icon: Dumbbell, title: "Flexible Schedule", description: "Opportunities that fit your lifestyle" },
  ];

  const faqs = [
    {
      question: "Will I be tested?",
      answer: "Yes! You'll complete a series of online modules and quizzes as part of your pre-training online learning content. At the end of your onboarding period, you'll be asked to teach a class as part of your practical assessment, along with a final online exam that must be completed and passed."
    },
    {
      question: "What qualifications do I need?",
      answer: "To be considered, you need at least one of: a Personal Training or Group Fitness Certification, a Kinesiology Degree or similar, Pilates, Dance or Performance training, 6+ months of coaching experience, or CPR/AED/First Aid Training."
    },
    {
      question: "What does the training look like?",
      answer: "You'll go through an intensive training program including community classes and assessments. You'll master the Pilates in Pink™ method, learn proper cueing, how to create an exceptional client experience, and our brand philosophy."
    },
    {
      question: "Is this a part-time or full-time role?",
      answer: "We offer both part-time and full-time opportunities depending on your availability and the needs of our studio. We can discuss this further during the interview process."
    },
  ];

  return (
    <div className="min-h-screen" style={{ background: "linear-gradient(180deg, #c4896b 0%, #d4a088 30%, #f6eee7 60%, #fbe0e2 100%)" }}>
      {/* Hero */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-10 w-64 h-64 rounded-full bg-white/30 blur-3xl" />
          <div className="absolute bottom-10 right-10 w-96 h-96 rounded-full bg-[#b67651]/20 blur-3xl" />
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
              Become an Instructor
            </h1>
            <p className="text-lg text-white/90 max-w-xl mx-auto font-light leading-relaxed">
              Join the Pilates in Pink™ team and inspire others through movement, mindset, and community.
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
              <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-[#f7b1bd]/30 flex items-center justify-center">
                <item.icon className="w-6 h-6 text-[#b67651]" />
              </div>
              <h3 className="font-medium text-[#b67651] text-sm mb-1">{item.title}</h3>
              <p className="text-xs text-[#b67651]/70 leading-relaxed">{item.description}</p>
            </motion.div>
          ))}
        </motion.div>

        {/* Intro blurb */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="bg-white/60 backdrop-blur-sm rounded-3xl p-8 mb-8 text-center"
        >
          <h2 className="text-2xl font-light text-[#b67651] mb-4">Let's Build Something Beautiful</h2>
          <p className="text-[#b67651]/80 leading-relaxed max-w-2xl mx-auto">
            At Pilates in Pink™, we believe great instructors are the heart of what we do. Our comprehensive training program will equip you with everything you need — from proper cueing and class flow to our signature brand experience. If you're passionate about Pilates and empowering others, we want to meet you.
          </p>
        </motion.div>

        {/* FAQ */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="bg-white/70 backdrop-blur-sm rounded-3xl p-8 mb-8"
        >
          <h2 className="text-xl font-light text-[#b67651] mb-4">Frequently Asked Questions</h2>
          {faqs.map((faq) => (
            <FAQItem key={faq.question} question={faq.question} answer={faq.answer} />
          ))}
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
                <h2 className="text-2xl font-light text-[#b67651] mb-2">Apply Now</h2>
                <p className="text-[#b67651]/70 text-sm">Take the first step toward joining the Pilates in Pink™ family</p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label className="text-[#b67651] font-medium text-sm">First Name *</Label>
                    <Input
                      required
                      placeholder="First name"
                      value={formData.first_name}
                      onChange={(e) => handleInputChange("first_name", e.target.value)}
                      className="border-[#f7b1bd]/50 focus:border-[#f1889b] rounded-xl h-12 bg-white/50"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[#b67651] font-medium text-sm">Last Name *</Label>
                    <Input
                      required
                      placeholder="Last name"
                      value={formData.last_name}
                      onChange={(e) => handleInputChange("last_name", e.target.value)}
                      className="border-[#f7b1bd]/50 focus:border-[#f1889b] rounded-xl h-12 bg-white/50"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-[#b67651] font-medium text-sm">Email *</Label>
                  <Input
                    required
                    type="email"
                    placeholder="your.email@example.com"
                    value={formData.email}
                    onChange={(e) => handleInputChange("email", e.target.value)}
                    className="border-[#f7b1bd]/50 focus:border-[#f1889b] rounded-xl h-12 bg-white/50"
                  />
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label className="text-[#b67651] font-medium text-sm">Preferred Studio</Label>
                    <Select value={formData.preferred_studio} onValueChange={(v) => handleInputChange("preferred_studio", v)}>
                      <SelectTrigger className="border-[#f7b1bd]/50 focus:border-[#f1889b] rounded-xl h-12 bg-white/50">
                        <SelectValue placeholder="Choose studio" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Brampton">Brampton</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[#b67651] font-medium text-sm">Postal Code</Label>
                    <Input
                      placeholder="A1A 1A1"
                      value={formData.postal_code}
                      onChange={(e) => handleInputChange("postal_code", e.target.value)}
                      className="border-[#f7b1bd]/50 focus:border-[#f1889b] rounded-xl h-12 bg-white/50"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-[#b67651] font-medium text-sm">Province</Label>
                  <Select value={formData.province} onValueChange={(v) => handleInputChange("province", v)}>
                    <SelectTrigger className="border-[#f7b1bd]/50 focus:border-[#f1889b] rounded-xl h-12 bg-white/50">
                      <SelectValue placeholder="Choose province" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Ontario">Ontario</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-3">
                  <Label className="text-[#b67651] font-medium text-sm">Qualifications (select all that apply)</Label>
                  <div className="grid md:grid-cols-2 gap-3">
                    {QUALIFICATIONS.map((qual) => (
                      <label key={qual} className="flex items-center gap-3 p-3 rounded-xl bg-white/50 border border-[#f7b1bd]/30 hover:bg-white/70 transition-colors cursor-pointer">
                        <Checkbox
                          checked={formData.qualifications.includes(qual)}
                          onCheckedChange={() => handleQualificationToggle(qual)}
                          className="border-[#f7b1bd] data-[state=checked]:bg-[#b67651] data-[state=checked]:border-[#b67651]"
                        />
                        <span className="text-sm text-[#b67651]/80">{qual}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-[#b67651] font-medium text-sm">Tell us about yourself</Label>
                  <Textarea
                    placeholder="Share your passion for Pilates and why you'd be a great fit..."
                    value={formData.message}
                    onChange={(e) => handleInputChange("message", e.target.value)}
                    className="border-[#f7b1bd]/50 focus:border-[#f1889b] rounded-xl min-h-[120px] bg-white/50 resize-none"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-[#b67651] font-medium text-sm">Attach Resume</Label>
                  <div className="border-2 border-dashed border-[#f7b1bd]/60 rounded-xl p-6 text-center bg-white/30 hover:bg-white/50 transition-colors">
                    <input
                      type="file"
                      accept=".pdf,.doc,.docx,.jpg,.png"
                      onChange={handleResumeUpload}
                      className="hidden"
                      id="resume-upload"
                    />
                    <label htmlFor="resume-upload" className="cursor-pointer">
                      {uploading ? (
                        <p className="text-[#b67651]/70 text-sm">Uploading...</p>
                      ) : resumeFile ? (
                        <p className="text-[#b67651] text-sm font-medium">✓ {resumeFile.name}</p>
                      ) : (
                        <>
                          <p className="text-[#b67651]/70 text-sm">Click to upload or drag and drop</p>
                          <p className="text-[#b67651]/50 text-xs mt-1">PDF, DOC, DOCX, JPG or PNG • Max 15MB</p>
                        </>
                      )}
                    </label>
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={isSubmitting || uploading}
                  className="w-full h-14 rounded-xl text-white font-medium text-base transition-all duration-300 hover:opacity-90 hover:shadow-lg"
                  style={{ background: "linear-gradient(135deg, #b67651 0%, #c4896b 100%)" }}
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
                className="w-20 h-20 mx-auto mb-6 rounded-full bg-[#f7b1bd]/30 flex items-center justify-center"
              >
                <CheckCircle2 className="w-10 h-10 text-[#b67651]" />
              </motion.div>
              <h2 className="text-2xl font-light text-[#b67651] mb-3">Application Received!</h2>
              <p className="text-[#b67651]/70 max-w-md mx-auto leading-relaxed">
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
              <h3 className="text-lg font-medium text-[#b67651] mb-1">Love Pilates but prefer to promote?</h3>
              <p className="text-sm text-[#b67651]/70">Check out our Influencer Program and partner with us on social media.</p>
            </div>
            <a
              href="/InfluencerProgram"
              className="shrink-0 px-6 py-3 rounded-xl text-white text-sm font-medium transition-all duration-300 hover:opacity-90 hover:shadow-lg"
              style={{ background: "linear-gradient(135deg, #b67651 0%, #c4896b 100%)" }}
            >
              Join as Influencer →
            </a>
          </div>
          <div className="bg-white/60 backdrop-blur-sm rounded-3xl p-8 flex flex-col md:flex-row items-center justify-between gap-6">
            <div>
              <h3 className="text-lg font-medium text-[#b67651] mb-1">Interested in the front of house?</h3>
              <p className="text-sm text-[#b67651]/70">We're also looking for friendly Front Desk team members to keep the studio running.</p>
            </div>
            <a
              href="/FrontAdmin"
              className="shrink-0 px-6 py-3 rounded-xl text-white text-sm font-medium transition-all duration-300 hover:opacity-90 hover:shadow-lg"
              style={{ background: "linear-gradient(135deg, #b67651 0%, #c4896b 100%)" }}
            >
              Apply as Front Desk →
            </a>
          </div>
        </motion.div>

        <div className="text-center mt-12 pb-8">
          <p className="text-[#b67651]/50 text-sm">
            © {new Date().getFullYear()} Pilates in Pink™™ • All rights reserved
          </p>
        </div>
      </div>
    </div>
  );
}