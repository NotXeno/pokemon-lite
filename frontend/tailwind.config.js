/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        pokemon: ['"Press Start 2P"', 'cursive'],
      },
      keyframes: {
        attackLeft: {
          '0%, 100%': { transform: 'translateX(-50%) translateY(0)' },
          '50%': { transform: 'translateX(-10%) translateY(-10px) scale(1.1)' },
        },
        attackRight: {
          '0%, 100%': { transform: 'translateX(-50%) scaleX(-1) translateY(0)' },
          '50%': { transform: 'translateX(-90%) scaleX(-1) translateY(-10px) scale(1.1)' },
        },
        hitEffect: {
          '0%, 100%': { filter: 'brightness(1) sepia(0) hue-rotate(0deg) saturate(1)', transform: 'translateX(-50%) scaleX(var(--tw-scale-x, 1))' },
          '20%': { filter: 'brightness(1.5) sepia(1) hue-rotate(-50deg) saturate(5)', transform: 'translateX(calc(-50% - 10px)) scaleX(var(--tw-scale-x, 1))' },
          '40%': { filter: 'brightness(1) sepia(0) hue-rotate(0deg) saturate(1)', transform: 'translateX(calc(-50% + 10px)) scaleX(var(--tw-scale-x, 1))' },
          '60%': { filter: 'brightness(1.5) sepia(1) hue-rotate(-50deg) saturate(5)', transform: 'translateX(calc(-50% - 10px)) scaleX(var(--tw-scale-x, 1))' },
          '80%': { filter: 'brightness(1) sepia(0) hue-rotate(0deg) saturate(1)', transform: 'translateX(calc(-50% + 10px)) scaleX(var(--tw-scale-x, 1))' },
        },
        healEffect: {
          '0%, 100%': { filter: 'drop-shadow(0 0 0 rgba(34, 197, 94, 0)) brightness(1)' },
          '50%': { filter: 'drop-shadow(0 0 20px rgba(34, 197, 94, 1)) brightness(1.3)' },
        }
      },
      animation: {
        'attack-left': 'attackLeft 0.3s ease-in-out',
        'attack-right': 'attackRight 0.3s ease-in-out',
        'hit': 'hitEffect 0.4s ease-in-out',
        'heal': 'healEffect 0.8s ease-in-out',
      }
    },
  },
  plugins: [],
}

