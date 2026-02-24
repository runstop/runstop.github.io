/**
 * Site-wide configuration
 * Update these values once to apply throughout the entire website
 */

export const siteConfig = {
  // Copyright and legal
  currentYear: 2025,
  companyName: "Art is the Game",

  // Contact information
  supportEmail: "support@artisthegame.com",
  location: "Halifax, Nova Scotia, Canada",

  // App information
  featuredApp: {
    name: "Headzone",
    id: "1609763784",
    storeUrl: "https://apps.apple.com/us/app/headzone/id1609763784",
    category: "Health & Fitness",
    rating: "5.0",
    description: "Build better focus skills using concentration grid techniques practiced by sports psychologists. Train your mind to stay calm and focused even in distracting environments."
  },

  // Site metadata defaults
  siteUrl: "https://artisthegame.com",
  defaultTitle: "Art is the Game - Professional iOS App Development",
  defaultDescription: "Professional iOS app development by Paul Farnam. Creator of innovative mobile applications including Headzone, the focus and concentration training app.",
  keywords: "ios app development, mobile apps, headzone, focus app, productivity, paul farnam, artist the game",

  // Developer information
  developer: {
    name: "Paul Farnam",
    title: "iOS App Developer",
    bio: "Solo developer creating iOS applications with intimate attention that only comes from genuine human experience."
  }
} as const;