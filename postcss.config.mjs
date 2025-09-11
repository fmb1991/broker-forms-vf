// postcss.config.mjs
export default {
  plugins: {
    '@tailwindcss/postcss': {},   // <-- This runs Tailwind v4 in Vercel builds
  },
};
