/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        mizany: {
          blue: "#0F50BD",
          deep: "#1941B5",
          peri: "#DBEAFE",
          ink: "#101828",
          muted: "#475467",
          amber: "#B45309",
          teal: "#0F766E",
          bg: "#F4F7FB",
        }
      },
      fontFamily: {
        sans: ['"Figtree"', 'system-ui', '-apple-system', 'sans-serif'],
        poppins: ['"Figtree"', 'system-ui', '-apple-system', 'sans-serif'],
        arabic: ['"Noto Naskh Arabic"', 'serif'],
      },
      boxShadow: {
        glass: '0 1px 2px rgba(16,24,40,.04), 0 4px 12px rgba(16,24,40,.03)',
        'glass-sm': '0 1px 2px rgba(16,24,40,.04)',
        floating: '0 10px 28px rgba(16,24,40,.10), 0 2px 6px rgba(16,24,40,.05)',
      },
      borderRadius: {
        'mizany': '18px',
      }
    },
  },
  plugins: [],
}
