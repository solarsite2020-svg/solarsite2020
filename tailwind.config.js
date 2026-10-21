import typography from "@tailwindcss/typography";

/** @type {import('tailwindcss').Config} */
export default {
  content: ["./docs/**/*.html"],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: "#3387a2",
          dark: "#2a6d84",
        },
      },
      fontFamily: {
        sans: ['"Noto Sans TC"', "ui-sans-serif", "system-ui", "sans-serif"],
      },
      maxWidth: {
        site: "1100px",
      },
    },
  },
  plugins: [typography],
};
