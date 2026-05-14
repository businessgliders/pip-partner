import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
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
import { Sparkles, Gift, Users, Camera, Heart, CheckCircle2, Briefcase, ClipboardList, ArrowUpRight } from "lucide-react";
import { Link } from "react-router-dom";
import BackToHome from "../components/BackToHome";

export default function InfluencerProgram() {
  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    instagram_handle: "",
    tiktok_handle: "",
    follower_count: "",
    location: "",
    why_partner: "",
    content_style: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    const record = await base44.entities.InfluencerApplication.create(formData);
    await base44.functions.invoke('sendInfluencerApplicationEmail', { applicationId: record.id });
    
    setIsSubmitting(false);
    setIsSubmitted(true);
  };

  const benefits = [
    {
      icon: Gift,
      title: "Complimentary Classes",
      description: "Enjoy free Pilates sessions to experience and share",
    },
    {
      icon: Users,
      title: "Brand Partnership",
      description: "Collaborate with a growing wellness community",
    },
    {
      icon: Camera,
      title: "Content Opportunities",
      description: "Create unique, engaging fitness content",
    },
    {
      icon: Heart,
      title: "Exclusive Perks",
      description: "Special discounts and early access to events",
    },
  ];

  return (
    <div className="min-h-screen" style={{ background: "linear-gradient(180deg, #f1889b 0%, #f7b1bd 40%, #fbe0e2 75%, #fce8ee 100%)" }}>
      <BackToHome />
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-10 w-64 h-64 rounded-full bg-white/30 blur-3xl" />
          <div className="absolute bottom-10 right-10 w-96 h-96 rounded-full bg-[#b67651]/20 blur-3xl" />
        </div>

        <div className="relative max-w-4xl mx-auto px-6 pt-12 pb-8">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center"
          >
            {/* Logo */}
            <img
              src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/user_690aada19e27fe8fcf067828/33a04cb27_Pilatesinpinklogojusticon1.png"
              alt="Pilates in Pink™"
              className="w-20 h-20 mx-auto mb-6"
            />
            
            {/* Brand Name */}
            <img
              src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/697a18eb75a9e57a35bc853a/29d852d1f_.png"
              alt="Pilates in Pink™"
              className="h-8 mx-auto mb-8"
            />

            <h1 className="text-4xl md:text-5xl font-light text-white mb-4 tracking-wide">
              Influence with Us
            </h1>
            <p className="text-lg text-white/90 max-w-xl mx-auto font-light leading-relaxed">
              Partner with a growing wellness brand to create unique, engaging content and grow your social channels.
            </p>
          </motion.div>
        </div>
      </div>

      {/* Benefits Section */}
      <div className="max-w-4xl mx-auto px-6 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12"
        >
          {benefits.map((benefit, index) => (
            <motion.div
              key={benefit.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.3 + index * 0.1 }}
              className="bg-white/60 backdrop-blur-sm rounded-2xl p-5 text-center hover:bg-white/80 transition-all duration-300"
            >
              <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-[#f7b1bd]/30 flex items-center justify-center">
                <benefit.icon className="w-6 h-6 text-[#b67651]" />
              </div>
              <h3 className="font-medium text-[#b67651] text-sm mb-1">{benefit.title}</h3>
              <p className="text-xs text-[#b67651]/70 leading-relaxed">{benefit.description}</p>
            </motion.div>
          ))}
        </motion.div>

        {/* Form Section */}
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
                <p className="text-[#b67651]/70 text-sm">
                  Receive a complimentary class to enjoy and share
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label className="text-[#b67651] font-medium text-sm">Full Name *</Label>
                    <Input
                      required
                      placeholder="Your name"
                      value={formData.full_name}
                      onChange={(e) => handleInputChange("full_name", e.target.value)}
                      className="border-[#f7b1bd]/50 focus:border-[#f1889b] focus:ring-[#f1889b]/20 rounded-xl h-12 bg-white/50"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-[#b67651] font-medium text-sm">Email *</Label>
                    <Input
                      required
                      type="email"
                      placeholder="your.email@example.com"
                      value={formData.email}
                      onChange={(e) => handleInputChange("email", e.target.value)}
                      className="border-[#f7b1bd]/50 focus:border-[#f1889b] focus:ring-[#f1889b]/20 rounded-xl h-12 bg-white/50"
                    />
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label className="text-[#b67651] font-medium text-sm">Instagram Handle *</Label>
                    <Input
                      required
                      placeholder="@yourusername"
                      value={formData.instagram_handle}
                      onChange={(e) => handleInputChange("instagram_handle", e.target.value)}
                      className="border-[#f7b1bd]/50 focus:border-[#f1889b] focus:ring-[#f1889b]/20 rounded-xl h-12 bg-white/50"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-[#b67651] font-medium text-sm">TikTok Handle</Label>
                    <Input
                      placeholder="@yourusername"
                      value={formData.tiktok_handle}
                      onChange={(e) => handleInputChange("tiktok_handle", e.target.value)}
                      className="border-[#f7b1bd]/50 focus:border-[#f1889b] focus:ring-[#f1889b]/20 rounded-xl h-12 bg-white/50"
                    />
                  </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label className="text-[#b67651] font-medium text-sm">Number of Followers</Label>
                    <Select
                      value={formData.follower_count}
                      onValueChange={(value) => handleInputChange("follower_count", value)}
                    >
                      <SelectTrigger className="border-[#f7b1bd]/50 focus:border-[#f1889b] focus:ring-[#f1889b]/20 rounded-xl h-12 bg-white/50">
                        <SelectValue placeholder="Select range" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1K-5K">1K - 5K</SelectItem>
                        <SelectItem value="5K-10K">5K - 10K</SelectItem>
                        <SelectItem value="10K-25K">10K - 25K</SelectItem>
                        <SelectItem value="25K-50K">25K - 50K</SelectItem>
                        <SelectItem value="50K-100K">50K - 100K</SelectItem>
                        <SelectItem value="100K+">100K+</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                <div className="space-y-2">
                  <Label className="text-[#b67651] font-medium text-sm">Location</Label>
                    <Input
                      placeholder="City, Province"
                      value={formData.location}
                      onChange={(e) => handleInputChange("location", e.target.value)}
                      className="border-[#f7b1bd]/50 focus:border-[#f1889b] focus:ring-[#f1889b]/20 rounded-xl h-12 bg-white/50"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-[#b67651] font-medium text-sm">Content Style</Label>
                    <Select
                      value={formData.content_style}
                      onValueChange={(value) => handleInputChange("content_style", value)}
                    >
                      <SelectTrigger className="border-[#f7b1bd]/50 focus:border-[#f1889b] focus:ring-[#f1889b]/20 rounded-xl h-12 bg-white/50">
                        <SelectValue placeholder="Select your niche" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Fitness & Wellness">Fitness & Wellness</SelectItem>
                        <SelectItem value="Lifestyle">Lifestyle</SelectItem>
                        <SelectItem value="Fashion">Fashion</SelectItem>
                        <SelectItem value="Health & Nutrition">Health & Nutrition</SelectItem>
                        <SelectItem value="Other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-[#b67651] font-medium text-sm">Why do you want to partner with Pilates in Pink™?</Label>
                  <Textarea
                    placeholder="Tell us about yourself and why you'd be a great fit..."
                    value={formData.why_partner}
                    onChange={(e) => handleInputChange("why_partner", e.target.value)}
                    className="border-[#f7b1bd]/50 focus:border-[#f1889b] focus:ring-[#f1889b]/20 rounded-xl min-h-[120px] bg-white/50 resize-none"
                  />
                </div>

                <Button
                  type="submit"
                  disabled={isSubmitting}
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
                Thank you for your interest in partnering with Pilates in Pink™. We'll review your application and get back to you within 48 hours.
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Cross-promo banners */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="mt-16"
        >
          <div className="text-center mb-6">
            <p className="text-xs tracking-[0.2em] text-[#b67651]/70 font-medium mb-2">EXPLORE MORE</p>
            <h3 className="text-2xl font-light text-[#b67651]">Other ways to join us</h3>
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            <Link
              to="/Instructor"
              className="group bg-white/70 backdrop-blur-sm rounded-2xl p-6 hover:bg-white/90 transition-all duration-300 hover:shadow-lg flex items-center gap-4"
            >
              <div className="w-12 h-12 rounded-full bg-[#f7b1bd]/30 flex items-center justify-center shrink-0">
                <Briefcase className="w-5 h-5 text-[#b67651]" />
              </div>
              <div className="flex-1">
                <p className="text-[10px] tracking-[0.2em] text-[#b67651]/60 font-semibold mb-0.5">TEACH WITH US</p>
                <h4 className="text-base font-medium text-[#b67651]">Become an Instructor</h4>
              </div>
              <ArrowUpRight className="w-5 h-5 text-[#b67651] group-hover:rotate-45 transition-transform" />
            </Link>
            <Link
              to="/FrontAdmin"
              className="group bg-white/70 backdrop-blur-sm rounded-2xl p-6 hover:bg-white/90 transition-all duration-300 hover:shadow-lg flex items-center gap-4"
            >
              <div className="w-12 h-12 rounded-full bg-[#f7b1bd]/30 flex items-center justify-center shrink-0">
                <ClipboardList className="w-5 h-5 text-[#b67651]" />
              </div>
              <div className="flex-1">
                <p className="text-[10px] tracking-[0.2em] text-[#b67651]/60 font-semibold mb-0.5">JOIN OUR TEAM</p>
                <h4 className="text-base font-medium text-[#b67651]">Front Desk Careers</h4>
              </div>
              <ArrowUpRight className="w-5 h-5 text-[#b67651] group-hover:rotate-45 transition-transform" />
            </Link>
          </div>
        </motion.div>

        {/* Footer */}
        <div className="text-center mt-12 pb-8">
          <p className="text-[#b67651]/50 text-sm">
            © {new Date().getFullYear()} Pilates in Pink™™ • All rights reserved
          </p>
        </div>
      </div>
    </div>
  );
}