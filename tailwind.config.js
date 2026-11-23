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
          peri: "#8BA0F3",
          ink: "#101828",
          muted: "#525252",
          amber: "#F59E0B",
          teal: "#14B8A6",
          bg: "#FFFFFF",
        }
      },
      fontFamily: {
        poppins: ['"Poppins"', 'system-ui', '-apple-system', 'sans-serif'],
      },
      boxShadow: {
        glass: '0 6px 20px rgba(25,65,181,.05), 0 1px 4px rgba(16,24,40,.03), inset 0 1px 0 rgba(255,255,255,.95)',
        'glass-sm': '0 3px 10px rgba(25,65,181,.04), inset 0 1px 0 rgba(255,255,255,.9)',
        floating: '0 10px 30px rgba(16,24,40,.12), 0 2px 6px rgba(16,24,40,.06)',
      },
      borderRadius: {
        'mizany': '18px',
      }
    },
  },
  plugins: [],
}
