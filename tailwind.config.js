/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./*.{html,js}"],
  theme: {
    extend: {
      fontFamily: {
        "pixelify": ["Pixelify Sans", "sans-serif"],
        "Inter": ["Inter"],
        "Poppins": ["Poppins", "serif"],
        "Metrophobic": ["Metrophobic", "serif"],
        "Montserrat": ["Montserrat", 'serif'],
        "Outfit": ["Outfit", "serif"],
        "Niagara": ["'Niagara Solid'", "sans-serif"],
        "Italiana": ["Italiana", "serif"],
      },
      colors: {
        darkblue: "#1B4965",
        lightblue: "#6FC9FF",
        neongreen: "#CCFF5D",
        newdarkblue: "#3693cb",
        darkerneongreen: "#CCE25D",
      }
    },
  },
  plugins: [],
}
