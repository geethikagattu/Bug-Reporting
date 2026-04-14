export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: "#3B82F6",    // Blue
        secondary: "#10B981",  // Emerald
        background: "#0F172A", // Slate 900
        surface: "#1E293B",    // Slate 800
        danger: "#EF4444",     // Red 500
        warning: "#F59E0B",    // Amber 500
      }
    },
  },
  plugins: [],
}
