/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./index.html", "./js/**/*.js"],
  theme: {
    extend: {
      colors: {
        board: {
          DEFAULT: "#182620",
          light: "#213629",
          lighter: "#2B4335",
        },
        chalk: {
          DEFAULT: "#F4F1E6",
          muted: "#A9BFAE",
          dim: "#6F8578",
        },
        tomato: {
          DEFAULT: "#E8583B",
          dim: "#B9432A",
        },
        breeze: {
          DEFAULT: "#5FA8C9",
          dim: "#417C99",
        },
        amber: {
          DEFAULT: "#E3B23C",
        },
      },
      fontFamily: {
        display: ["'Fraunces'", "serif"],
        mono: ["'Space Mono'", "monospace"],
        body: ["'Inter'", "sans-serif"],
      },
      boxShadow: {
        card: "0 4px 0 0 rgba(0,0,0,0.25)",
      },
      backgroundImage: {
        grid: "linear-gradient(rgba(244,241,230,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(244,241,230,0.05) 1px, transparent 1px)",
      },
      backgroundSize: {
        grid: "24px 24px",
      },
    },
  },
  plugins: [],
}

