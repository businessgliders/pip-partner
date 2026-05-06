// Catalog of ad creative formats. aspect_hint is the closest supported AI generation
// aspect ratio (currently '1:1', '16:9', '9:16', '4:3', '3:4').
export const AD_FORMATS = [
  // ---- Social ----
  { key: "instagram_post",      label: "Instagram Post",        category: "social",  w: 1080, h: 1080, aspect: "1:1" },
  { key: "instagram_story",     label: "Instagram Story / Reel", category: "social", w: 1080, h: 1920, aspect: "9:16" },
  { key: "facebook_post",       label: "Facebook Post",         category: "social",  w: 1200, h: 630,  aspect: "16:9" },
  { key: "tiktok_vertical",     label: "TikTok",                category: "social",  w: 1080, h: 1920, aspect: "9:16" },
  { key: "pinterest_pin",       label: "Pinterest Pin",         category: "social",  w: 1000, h: 1500, aspect: "3:4" },
  { key: "linkedin_post",       label: "LinkedIn Post",         category: "social",  w: 1200, h: 627,  aspect: "16:9" },
  { key: "youtube_thumbnail",   label: "YouTube Thumbnail",     category: "social",  w: 1280, h: 720,  aspect: "16:9" },

  // ---- Google Display ----
  { key: "display_medium_rectangle", label: "Medium Rectangle",   category: "display", w: 300, h: 250, aspect: "4:3" },
  { key: "display_large_rectangle",  label: "Large Rectangle",    category: "display", w: 336, h: 280, aspect: "4:3" },
  { key: "display_leaderboard",      label: "Leaderboard",        category: "display", w: 728, h: 90,  aspect: "16:9" },
  { key: "display_half_page",        label: "Half Page",          category: "display", w: 300, h: 600, aspect: "9:16" },
  { key: "display_skyscraper",       label: "Wide Skyscraper",    category: "display", w: 160, h: 600, aspect: "9:16" },
  { key: "display_mobile_banner",    label: "Mobile Banner",      category: "display", w: 320, h: 50,  aspect: "16:9" },

  // ---- Print ----
  { key: "print_flyer",         label: "Flyer (8.5×11)",         category: "print",   w: 2550, h: 3300, aspect: "3:4" },
];

export const CATEGORY_LABELS = {
  social: "Social Media",
  display: "Google Display",
  print: "Print",
};

export const CAMPAIGNS = [
  {
    slug: "own-a-studio",
    title: "Own A Studio",
    subtitle: "FRANCHISE",
    description: "Ad creatives for the franchise opportunity funnel.",
    image: "https://media.base44.com/images/public/697a18eb75a9e57a35bc853a/8525e2e00_generated_image.png",
    defaults: {
      headline: "Own a Pilates in Pink Studio",
      subheadline: "Become a franchise partner",
      cta: "Apply Now",
    },
    promptStyle:
      "Luxurious, feminine, premium pilates studio aesthetic. Soft pink (#f1889b, #f7b1bd, #fbe0e2), cream (#f6eee7), and warm bronze (#b67651) color palette. Elegant, modern, aspirational, magazine-quality lifestyle imagery. Pretty. Powerful. Pilates.",
    available: true,
  },
];