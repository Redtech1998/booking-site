import type { Metadata, Viewport } from "next";
import "./globals.css";
import { AppProvider } from "@/context/AppContext";

export const viewport: Viewport = {
  themeColor: "#6b2e4c",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export const metadata: Metadata = {
  metadataBase: new URL("https://book.rsegnr.in"),
  title: {
    default: "Book Wedding Video Editing & Color Grading | RSE Post Production House",
    template: "%s | RSE Post Production House",
  },
  description:
    "Official client booking portal for RSE Post Production House, Gandhinagar. Industry-standard wedding film editing in Adobe Premiere Pro & Apple FCP X, paired with DaVinci Resolve color grading. Instant courier intake, live tracking & 100% on-time delivery.",
  keywords: [
    "adobe premiere pro video editing",
    "final cut pro x wedding editor",
    "fcpx wedding video editing studio",
    "wedding video editing gandhinagar",
    "wedding film editing studio gujarat",
    "davinci resolve color grading ahmedabad",
    "cinematic wedding highlight editor",
    "wedding teaser editing service",
    "post production house gandhinagar",
    "courier hard drive video editing",
    "rse post production",
    "rsegnr",
    "video editing services for photographers",
  ],
  authors: [{ name: "RSE Post Production House", url: "https://rsegnr.in" }],
  creator: "RSE Post Production House",
  publisher: "Red Smile Entertainments",
  alternates: {
    canonical: "https://book.rsegnr.in",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  openGraph: {
    title: "Book Wedding Video Editing & Color Grading | RSE Post Production House",
    description:
      "Book premium wedding video editing, highlight teasers, and DaVinci Resolve color grading. Instant courier intake & live project tracking in Gandhinagar, Gujarat.",
    url: "https://book.rsegnr.in",
    siteName: "RSE Post Production House",
    images: [
      {
        url: "/rse-logo.png",
        width: 800,
        height: 800,
        alt: "RSE Post Production House Official Logo",
      },
    ],
    locale: "en_IN",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Book Wedding Video Editing | RSE Post Production House",
    description:
      "Cinema wedding highlight editing, teaser cuts, and DaVinci Resolve color grading. Book online with instant courier intake.",
    images: ["/rse-logo.png"],
  },
  icons: {
    icon: [
      { url: "/rse-logo.png" },
      { url: "/rse-logo.png", sizes: "192x192", type: "image/png" },
      { url: "/rse-logo.png", sizes: "512x512", type: "image/png" },
    ],
    shortcut: "/rse-logo.png",
    apple: "/rse-logo.png",
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "ProfessionalService",
  "@id": "https://book.rsegnr.in/#organization",
  name: "RSE Post Production House",
  alternateName: "Red Smile Entertainments",
  url: "https://book.rsegnr.in",
  logo: "https://book.rsegnr.in/rse-logo.png",
  image: "https://book.rsegnr.in/rse-logo.png",
  description:
    "Specialist wedding video editing (Adobe Premiere Pro & Apple FCP X) and DaVinci Resolve color grading post-production studio based in Gandhinagar, Gujarat.",
  telephone: "+919313553726",
  email: "Hello@rse-edit.com",
  address: {
    "@type": "PostalAddress",
    streetAddress: "7th Floor, Radhe Infinity, 726, Raksha Shakti Cir, nr. Swaminarayan Dham, Urjanagar, Randesan",
    addressLocality: "Gandhinagar",
    addressRegion: "Gujarat",
    postalCode: "382421",
    addressCountry: "IN",
  },
  geo: {
    "@type": "GeoCoordinates",
    latitude: 23.1895,
    longitude: 72.6394,
  },
  hasMap: "https://maps.google.com/?cid=17962468400633901627",
  openingHoursSpecification: [
    {
      "@type": "OpeningHoursSpecification",
      dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
      opens: "09:00",
      closes: "21:00",
    },
  ],
  priceRange: "₹₹",
  areaServed: ["Gandhinagar", "Ahmedabad", "Gujarat", "India"],
  sameAs: [
    "https://rsegnr.in",
    "https://maps.google.com/?cid=17962468400633901627",
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body>
        <AppProvider>{children}</AppProvider>
      </body>
    </html>
  );
}
