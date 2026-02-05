import localFont from "next/font/local";

const sfProDisplay = localFont({
  src: [
    { path: "../public/fonts/sfpro/SFPRODISPLAYREGULAR.OTF", weight: "400" },
    { path: "../public/fonts/sfpro/SFPRODISPLAYMEDIUM.OTF", weight: "500" },
    { path: "../public/fonts/sfpro/SFPRODISPLAYBOLD.OTF", weight: "700" },
    {
      path: "../public/fonts/sfpro/SFPRODISPLAYTHINITALIC.OTF",
      weight: "100",
      style: "italic",
    },
    {
      path: "../public/fonts/sfpro/SFPRODISPLAYULTRALIGHTITALIC.OTF",
      weight: "200",
      style: "italic",
    },
    {
      path: "../public/fonts/sfpro/SFPRODISPLAYLIGHTITALIC.OTF",
      weight: "300",
      style: "italic",
    },
    {
      path: "../public/fonts/sfpro/SFPRODISPLAYSEMIBOLDITALIC.OTF",
      weight: "600",
      style: "italic",
    },
    {
      path: "../public/fonts/sfpro/SFPRODISPLAYHEAVYITALIC.OTF",
      weight: "800",
      style: "italic",
    },
    {
      path: "../public/fonts/sfpro/SFPRODISPLAYBLACKITALIC.OTF",
      weight: "900",
      style: "italic",
    },
  ],
  variable: "--font-sf-pro-display",
  display: "swap",
});

export const sfPro = sfProDisplay;
