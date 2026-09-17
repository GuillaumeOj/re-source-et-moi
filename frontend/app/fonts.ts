import { Cormorant_Garamond, Nunito } from "next/font/google";

// Display face — titles, headings, pull-quotes (used with restraint, light weights).
export const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  style: ["normal", "italic"],
  display: "swap",
  variable: "--font-cormorant",
});

// Body / UI face — humanist, rounded, highly legible.
export const nunito = Nunito({
  subsets: ["latin"],
  weight: ["400", "600", "700"],
  display: "swap",
  variable: "--font-nunito",
});
