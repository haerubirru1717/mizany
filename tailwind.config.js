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
        sans: ['"Poppins"', 'system-ui', '-apple-system', 'sans-serif'],
        poppins: ['"Poppins"', 'system-ui', '-apple-system', 'sans-serif'],
        arabic: ['"Noto Naskh Arabic"', 'serif'],
      },
      boxShadow: {
        glass: '0 6px 20px rgba(25,65,181,.06), 0 1px 4px rgba(16,24,40,.04)',
        'glass-sm': '0 3px 10px rgba(25,65,181,.05), 0 1px 2px rgba(16,24,40,.03)',
        floating: '0 10px 30px rgba(16,24,40,.13), 0 2px 6px rgba(16,24,40,.06)',
      },
      borderRadius: {
        'mizany': '20px',
      }
    },
  },
  plugins: [],
}
