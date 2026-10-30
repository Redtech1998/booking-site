/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        /* RSE Design System — Light, Sober, Structured */
        canvas:   "#F7F6F3",   /* App background — warm off-white     */
        surface:  "#FFFFFF",   /* Card / panel surface                 */
        line:     "#E8E6E1",   /* Borders & dividers                   */
        subtle:   "#F0EEE9",   /* Hover state, table row               */
        ink:      "#1A1917",   /* Primary text                         */
        "ink-2":  "#605E59",   /* Secondary text                       */
        "ink-3":  "#9C9890",   /* Placeholder / muted                  */
        brand:    "#7C1D1D",   /* RSE Maroon — primary accent          */
        "brand-light": "#FBF0F0", /* Light maroon tint                 */
        "brand-border": "#EAC8C8",/* Maroon border tint                */
        ok:       "#166534",   /* Success green text                   */
        "ok-bg":  "#F0FDF4",   /* Success green bg                     */
        warn:     "#92400E",   /* Warning text                         */
        "warn-bg":"#FFFBEB",   /* Warning bg                           */
        danger:   "#991B1B",   /* Danger text                          */
        "danger-bg":"#FEF2F2", /* Danger bg                            */
      },
      fontFamily: {
        sans: [
          "Inter", "-apple-system", "BlinkMacSystemFont",
          "Segoe UI", "Helvetica Neue", "sans-serif"
        ],
      },
      fontSize: {
        "2xs": ["10px", "14px"],
        xs:    ["11px", "16px"],
        sm:    ["13px", "20px"],
        base:  ["14px", "22px"],
        md:    ["15px", "24px"],
        lg:    ["17px", "26px"],
        xl:    ["20px", "30px"],
        "2xl": ["24px", "34px"],
      },
      boxShadow: {
        card: "0 1px 3px rgba(0,0,0,.06), 0 1px 2px rgba(0,0,0,.04)",
        float: "0 4px 16px rgba(0,0,0,.10)",
        "inner-sm": "inset 0 1px 2px rgba(0,0,0,.05)",
      },
      borderRadius: {
        sm: "6px",
        DEFAULT: "8px",
        md: "10px",
        lg: "12px",
        xl: "16px",
      },
    },
  },
};
