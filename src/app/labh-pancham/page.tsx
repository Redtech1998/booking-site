"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import Link from "next/link";
import { useApp } from "@/context/AppContext";
import {
  calculateLabhPanchamPrice,
  isLabhPanchamActive,
  LABH_PANCHAM_OFFER_DEADLINE,
} from "@/lib/pricingCalculator";
import { Booking } from "@/types";
import {
  Calendar as CalendarIcon,
  Phone,
  CheckCircle,
  AlertCircle,
  Video,
  Send,
  Sparkles,
  Check,
  ChevronDown,
  ChevronUp,
  Copy,
  ExternalLink,
  ShieldCheck,
  FileText,
  Gift,
  HelpCircle,
  PlusCircle,
  Lock,
} from "lucide-react";

const STUDIO_WHATSAPP = "+918866323567";
const STUDIO_WHATSAPP_CLEAN = "918866323567";

// Only full wedding projects (Reels are strictly excluded per studio policy)
const ELIGIBLE_SERVICES = [
  {
    id: "in_wedding_highlight",
    name: "Wedding Highlight (૩ થી ૫ મિનિટ)",
    desc: "સિનેમેટિક ટીઝર + સોંગ હાઇલાઇટ, સિનેમેટિક 4K કલર ગ્રેડિંગ",
    defaultDuration: "05:00",
    placeholder: "દા.ત. 05:00 (5 મિનિટ)",
    unitNote: "મૂળ ભાવ: ₹1,251/મિનિટ → 15% મુહૂર્ત ઑફર: ₹1,063/મિનિટ",
  },
  {
    id: "in_wedding_short_film",
    name: "Wedding Short Film (૩૦ થી ૪૦ મિનિટ)",
    desc: "ડોક્યુમેન્ટરી સ્ટાઇલ શોર્ટ ફિલ્મ, સ્પીચ, રિચ્યુઅલ્સ અને ગીતો",
    defaultDuration: "35:00",
    placeholder: "30-40 મિનિટ",
    unitNote: "મૂળ ભાવ: ₹16,500 ફિક્સ → 15% મુહૂર્ત ઑફર: ₹14,025 (₹2,475 બચત)",
  },
  {
    id: "in_traditional_single",
    name: "Traditional Wedding Film (Single-Cam)",
    desc: "સિંગલ કેમેરા ફૂલ ઇવેન્ટ એડિટિંગ (મિનિમમ 1 કલાકનો ફ્લોર રેટ)",
    defaultDuration: "01:00",
    placeholder: "દા.ત. 01:25 (1 કલાક 25 મિનિટ)",
    unitNote: "મૂળ ભાવ: ₹1,550/કલાક → 15% મુહૂર્ત ઑફર: ₹1,317/કલાક",
  },
  {
    id: "in_traditional_multi",
    name: "Traditional Wedding Film (Multi-Cam)",
    desc: "મલ્ટી-કેમેરા સિંક, લાઇવ સ્વિચિંગ, ઓડિયો સિંક અને રિચ્યુઅલ્સ",
    defaultDuration: "01:00",
    placeholder: "દા.ત. 01:25 (1 કલાક 25 મિનિટ)",
    unitNote: "મૂળ ભાવ: ₹1,850/કલાક → 15% મુહૂર્ત ઑફર: ₹1,572/કલાક",
  },
  {
    id: "in_wedding_teaser",
    name: "Wedding Teaser / Trailer (૬૦ થી ૯૦ સેકન્ડ)",
    desc: "હાઇ-એનર્જી 4K સિનેમેટિક ટ્રેઇલર, ઇન્સ્ટન્ટ રિલિઝ માટે",
    defaultDuration: "01:15",
    placeholder: "60-90 સેકન્ડ",
    unitNote: "મૂળ ભાવ: ₹3,500 ફિક્સ → 15% મુહૂર્ત ઑફર: ₹2,975 (₹525 બચત)",
  },
];

// Quick shortcut chips for entire wedding year (Nov 2026 to Dec 2027)
const SEASON_MONTH_SHORTCUTS = [
  { label: "નવેમ્બર '૨૬", date: "2026-11-20" },
  { label: "ડિસેમ્બર '૨૬", date: "2026-12-15" },
  { label: "જાન્યુઆરી '૨૭", date: "2027-01-20" },
  { label: "ફેબ્રુઆરી '૨૭", date: "2027-02-15" },
  { label: "માર્ચ '૨૭", date: "2027-03-20" },
  { label: "એપ્રિલ/મે '૨૭", date: "2027-05-10" },
  { label: "નવેમ્બર '૨૭", date: "2027-11-25" },
  { label: "ડિસેમ્બર '૨૭", date: "2027-12-15" },
];

export default function LabhPanchamOfferPage() {
  const { addBooking, calculateDeliveryDate } = useApp();

  // ─── 1. Offer Expiry Guard (Auto-expires after 14-11-2026 23:59:59) ───
  const [offerActive, setOfferActive] = useState<boolean>(true);
  const [timeLeft, setTimeLeft] = useState<{
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
  }>({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    const updateCountdown = () => {
      const deadline = new Date(LABH_PANCHAM_OFFER_DEADLINE).getTime();
      const now = new Date().getTime();
      const diff = deadline - now;

      if (diff <= 0) {
        setOfferActive(false);
      } else {
        setOfferActive(true);
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
        const minutes = Math.floor((diff / 1000 / 60) % 60);
        const seconds = Math.floor((diff / 1000) % 60);
        setTimeLeft({ days, hours, minutes, seconds });
      }
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, []);

  // ─── Wizard State ───
  // Step 1: Select Slot Date (Single date only)
  // Step 2: Choose Services & Output Duration (Reels excluded)
  // Step 3: Studio & Couple Details
  // Step 4: Pay ₹1,000 Advance via QR / UPI App & WhatsApp Screenshot
  // Step 5: Success & Multi-project booking
  const [currentStep, setCurrentStep] = useState<number>(1);
  const formTopRef = useRef<HTMLDivElement>(null);

  // Date selection (Only 1 date: Slot Date across the whole year)
  const [selectedSlotDate, setSelectedSlotDate] = useState<string>("");

  // Services & Custom Output Duration Selection (Single project deliverables)
  const [selectedServices, setSelectedServices] = useState<{
    [serviceId: string]: {
      selected: boolean;
      durationInput: string;
    };
  }>({
    in_wedding_highlight: { selected: true, durationInput: "05:00" },
  });

  // Client & Project Details
  const [studioName, setStudioName] = useState<string>("");
  const [contactPerson, setContactPerson] = useState<string>("");
  const [coupleNames, setCoupleNames] = useState<string>("");
  const [whatsappNumber, setWhatsappNumber] = useState<string>("");
  const [clientCity, setClientCity] = useState<string>("");
  const [projectNotes, setProjectNotes] = useState<string>("");
  const [agreedToTerms, setAgreedToTerms] = useState<boolean>(true);

  // Submission State
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [confirmedBooking, setConfirmedBooking] = useState<Booking | null>(null);
  const [copiedUpi, setCopiedUpi] = useState<boolean>(false);

  // FAQ Accordion Toggle
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  // ─── Service Toggle & Duration Update ───
  const toggleService = (id: string, defaultDuration = "05:00") => {
    setSelectedServices((prev) => {
      const current = prev[id]?.selected;
      return {
        ...prev,
        [id]: {
          selected: !current,
          durationInput: prev[id]?.durationInput || defaultDuration,
        },
      };
    });
  };

  const updateDuration = (id: string, val: string) => {
    setSelectedServices((prev) => ({
      ...prev,
      [id]: {
        selected: prev[id]?.selected ?? true,
        durationInput: val,
      },
    }));
  };

  // ─── Real-Time Pricing Summary (Flat 15% Discount & ₹1,000 Token per Project) ───
  const pricingSummary = useMemo(() => {
    let grandOriginal = 0;
    let grandDiscount = 0;
    let grandOfferPrice = 0;
    const items: Array<{
      id: string;
      name: string;
      duration: string;
      originalPrice: number;
      discountAmount: number;
      offerPrice: number;
    }> = [];

    Object.entries(selectedServices).forEach(([svcId, cfg]) => {
      if (!cfg.selected) return;
      const def = ELIGIBLE_SERVICES.find((s) => s.id === svcId);
      if (!def) return;

      const calc = calculateLabhPanchamPrice(svcId, cfg.durationInput);
      grandOriginal += calc.originalPrice;
      grandDiscount += calc.discountAmount;
      grandOfferPrice += calc.offerPrice;

      items.push({
        id: svcId,
        name: def.name,
        duration: cfg.durationInput,
        originalPrice: calc.originalPrice,
        discountAmount: calc.discountAmount,
        offerPrice: calc.offerPrice,
      });
    });

    // Exactly ₹1,000 token advance per wedding project
    const tokenAdvance = items.length > 0 ? 1000 : 0;
    const balanceDue = Math.max(0, grandOfferPrice - tokenAdvance);

    return {
      items,
      grandOriginal,
      grandDiscount,
      grandOfferPrice,
      tokenAdvance,
      balanceDue,
    };
  }, [selectedServices]);

  // Delivery date calculation (estimated delivery date based on slot date)
  const promisedDeliveryDate = useMemo(() => {
    if (!selectedSlotDate) return "";
    return calculateDeliveryDate("in_wedding_highlight", selectedSlotDate, "online", 5);
  }, [selectedSlotDate, calculateDeliveryDate]);

  // Scroll smoothly when advancing steps
  const goToStep = (step: number) => {
    setCurrentStep(step);
    if (formTopRef.current) {
      formTopRef.current.scrollIntoView({ behavior: "smooth" });
    }
  };

  // Reset form to book another project smoothly
  const handleBookAnotherProject = () => {
    setCoupleNames("");
    setProjectNotes("");
    setSelectedSlotDate("");
    setConfirmedBooking(null);
    setCurrentStep(1);
    if (formTopRef.current) {
      formTopRef.current.scrollIntoView({ behavior: "smooth" });
    }
  };

  // ─── Handle Slot Booking Submission ───
  const handleSubmitBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSlotDate || pricingSummary.items.length === 0) return;
    setIsSubmitting(true);

    try {
      const primarySvc = pricingSummary.items[0];
      const allSvcNames = pricingSummary.items.map((i) => i.name).join(" + ");
      const allDurations = pricingSummary.items
        .map((i) => `${i.name}: ${i.duration}`)
        .join(" | ");

      // Slot is explicitly marked advancePaid: false until WhatsApp screenshot is verified
      const newBooking = addBooking({
        source: "website",
        region: "indian",
        customerType: "new",
        coupleNames: coupleNames || "Couple",
        studioOrClient: studioName || "Studio Partner",
        contactPerson: contactPerson || studioName,
        phone: whatsappNumber,
        email: "Hello@rse-edit.com",
        city: clientCity || "Gujarat",
        country: "India",
        eventDate: selectedSlotDate,
        slotDate: selectedSlotDate,
        deliveryDate: promisedDeliveryDate,
        serviceId: primarySvc?.id || "in_wedding_highlight",
        packageType: `[🪔 લાભ પાંચમ મુહૂર્ત] ${allSvcNames}`,
        serviceIds: pricingSummary.items.map((i) => i.id),
        packagesList: pricingSummary.items.map((i) => i.name),
        editorDays: 4,
        clientDays: 6,
        deliveryMethod: "online",
        rawLink: "Awaiting Footage / Drive Link",
        notes: `🪔 લાભ પાંચમ મુહૂર્ત ઑફર (15% OFF). ૧ પ્રોજેક્ટ સ્લોટ. એસ્ટિમેટેડ ડ્યુરેશન: ${allDurations}. નોટ્સ: ${projectNotes} | [⚠️ નોંધ: ₹1,000 પેમેન્ટ સ્ક્રીનશૉટ વેરિફિકેશન બાદ જ સ્લોટ કન્ફર્મ ગણાશે]`,
        ndaAccepted: true,
        ndaAcceptedAt: new Date().toISOString(),
        offerType: "labh_pancham_2026",
        discountPercent: 15,
        paymentScreenshotSent: false,
        pricing: {
          totalAmount: pricingSummary.grandOfferPrice,
          advanceAmount: pricingSummary.tokenAdvance,
          finalAmount: pricingSummary.balanceDue,
          advancePaid: false, // Strictly false until verified!
          finalPaid: false,
          currency: "INR",
        },
        status: "new_deposit_pending",
      });

      setConfirmedBooking(newBooking);
      goToStep(5);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // WhatsApp screenshot click handler
  const getWhatsAppScreenshotUrl = () => {
    const text = `નમસ્તે RSE સ્ટુડિયો,\n\nમેં "લાભ પાંચમ મુહૂર્ત ઓફર '26" હેઠળ સ્લોટ બુકિંગ માટે ₹1,000 ટોકન એડવાન્સ પેમેન્ટ કર્યું છે.\n\n👤 સ્ટુડિયો / ક્લાયન્ટ: ${studioName || contactPerson || "ક્લાયન્ટ"}\n💍 પ્રોજેક્ટ (કપલ): ${coupleNames}\n📞 ફોન: ${whatsappNumber}\n🗓️ બુક કરેલ સ્લોટ તારીખ: ${selectedSlotDate}\n💰 15% મુહૂર્ત ફાઇનલ ભાવ: ₹${pricingSummary.grandOfferPrice}\n\nપેમેન્ટનો સ્ક્રીનશૉટ આ સાથે મોકલી રહ્યો છું. કૃપા કરીને સ્લોટ કન્ફર્મ કરવા વિનંતી!`;
    return `https://wa.me/${STUDIO_WHATSAPP_CLEAN}?text=${encodeURIComponent(text)}`;
  };

  // Direct Mobile UPI Intent link (opens GPay / PhonePe / Paytm directly on phone)
  const mobileUpiUrl = `upi://pay?pa=8866323567@upi&pn=RSE%20Post%20Production&am=1000&cu=INR&tn=Labh%20Pancham%20Slot%20Token`;

  // ─── 2. Auto-Expired View (After 14-11-2026) ───
  if (!offerActive) {
    return (
      <div className="min-h-screen bg-[#F8F7F4] text-[#1C1C1E] flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-3xl p-8 border border-[#E5E5EA] shadow-xl text-center space-y-4">
          <span className="text-4xl">🪔</span>
          <h2 className="text-xl font-bold text-[#6B2E4C]">
            લાભ પાંચમ મુહૂર્ત ઑફર પૂર્ણ થઈ ગઈ છે
          </h2>
          <p className="text-xs text-[#8E8E93] leading-relaxed">
            આ સ્પેશિયલ મુહૂર્ત ઑફર 14 નવેમ્બર 2026 રાત્રે 11:59 વાગ્યા સુધી સીમિત હતી. તમામ બુક થયેલા સ્લોટ્સ સુરક્ષિત રીતે નોંધાઈ ગયા છે.
          </p>
          <div className="pt-2">
            <Link
              href="/book"
              className="inline-block px-6 py-2.5 rounded-xl bg-[#6B2E4C] hover:bg-[#58243E] text-white font-bold text-xs transition shadow-md"
            >
              સામાન્ય સ્લોટ બુકિંગ પેજ પર જાઓ →
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // ─── 3. Active Festive Labh Pancham Booking Page ───
  return (
    <div className="min-h-screen bg-[#FAF8F5] text-[#1C1C1E] font-sans antialiased selection:bg-[#6B2E4C] selection:text-white pb-24 overflow-x-hidden">
      {/* ── Top Festive Golden Bar ── */}
      <div className="bg-gradient-to-r from-[#6B2E4C] via-[#8B3A62] to-[#6B2E4C] text-[#F5E6CC] border-b border-amber-400/30 px-3 sm:px-4 py-2 sm:py-2.5 text-center text-xs font-semibold shadow-sm sticky top-0 z-40 backdrop-blur-md">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-1 text-center sm:text-left">
          <div className="flex items-center space-x-1.5 justify-center">
            <span className="text-base animate-pulse">🪔</span>
            <span className="font-bold tracking-wide text-xs sm:text-sm">
              શુભ લાભ પાંચમ મુહૂર્ત ઑફર '26 • ફ્લેટ 15% ડિસ્કાઉન્ટ
            </span>
          </div>
          <div className="flex items-center space-x-2 text-2xs font-mono font-bold bg-black/30 px-2.5 py-1 rounded-full border border-amber-300/40 text-amber-200">
            <span>ઓફર સમાપ્ત થવાને આડે:</span>
            <span className="text-white">
              {timeLeft.days}દિ {timeLeft.hours}ક {timeLeft.minutes}મિ {timeLeft.seconds}સે
            </span>
          </div>
        </div>
      </div>

      <div ref={formTopRef} className="max-w-4xl mx-auto px-3 sm:px-6 pt-4 sm:pt-8 space-y-6 sm:space-y-8">
        {/* ── Festive Hero Header ── */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#6B2E4C] via-[#521C37] to-[#360F22] text-white p-5 sm:p-10 shadow-2xl border border-amber-400/40 text-center space-y-3.5">
          <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-amber-400/20 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-64 h-64 bg-[#F59E0B]/20 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 space-y-2.5">
            <div className="inline-flex items-center space-x-2 px-3.5 py-1 rounded-full bg-amber-400/20 border border-amber-300/40 text-amber-300 text-2xs font-extrabold uppercase tracking-widest shadow-sm">
              <span>✨ દિવાળી & લાભ પાંચમ વેડિંગ સીઝન સ્પેશિયલ ✨</span>
            </div>

            <h1 className="text-xl sm:text-4xl font-extrabold tracking-tight font-serif text-[#FFF8E7] drop-shadow-sm leading-tight">
              RSE લાભ પાંચમ મુહૂર્ત બુકિંગ ઑફર '26
            </h1>

            <p className="text-xs sm:text-sm text-amber-100/90 max-w-2xl mx-auto leading-relaxed">
              આખા વર્ષ (૨૦૨૬-૨૦૨૭) ના તમારા વેડિંગ પ્રોજેક્ટ્સ માટે સ્લોટ કરો લોક. તમામ વેડિંગ પ્રોજેક્ટ્સ પર{" "}
              <strong className="text-amber-300 font-bold underline decoration-amber-400 underline-offset-4">
                ફ્લેટ ૧૫% ડિસ્કાઉન્ટ
              </strong>{" "}
              અને સ્લોટ રિઝર્વ કરવા માત્ર{" "}
              <strong className="text-amber-300 font-bold">₹૧,૦૦૦ ટોકન એડવાન્સ (પ્રોજેક્ટ દીઠ)!</strong>
            </p>

            {/* 4 Value Badges */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 text-left">
              <div className="p-2.5 rounded-2xl bg-white/10 border border-amber-300/30 backdrop-blur-sm">
                <div className="text-xs font-bold text-amber-300">🎁 ફ્લેટ 15% OFF</div>
                <div className="text-2xs text-amber-100/80">ફાઇનલ બિલમાંથી ૧૫% બાદ</div>
              </div>
              <div className="p-2.5 rounded-2xl bg-white/10 border border-amber-300/30 backdrop-blur-sm">
                <div className="text-xs font-bold text-amber-300">🔒 ₹1,000 માં સ્લોટ લોક</div>
                <div className="text-2xs text-amber-100/80">૧ પ્રોજેક્ટ = ₹૧,૦૦૦ ટોકન</div>
              </div>
              <div className="p-2.5 rounded-2xl bg-white/10 border border-amber-300/30 backdrop-blur-sm">
                <div className="text-xs font-bold text-amber-300">🗓️ આખું વર્ષ માન્ય</div>
                <div className="text-2xs text-amber-100/80">૨૦૨૬-૨૭ ની કોઈપણ તારીખ</div>
              </div>
              <div className="p-2.5 rounded-2xl bg-white/10 border border-amber-300/30 backdrop-blur-sm">
                <div className="text-xs font-bold text-amber-300">🚫 રીલ્સ બાકાત</div>
                <div className="text-2xs text-amber-100/80">ફક્ત ફુલ વેડિંગ પ્રોજેક્ટ્સ</div>
              </div>
            </div>
          </div>
        </div>

        {/* ── Strict Payment Policy Notice Banner ── */}
        <div className="p-3.5 sm:p-4 rounded-2xl bg-amber-50 border-2 border-amber-400/80 text-amber-950 text-xs sm:text-sm flex items-start space-x-2.5 shadow-sm">
          <span className="text-lg shrink-0">🚨</span>
          <div className="leading-relaxed">
            <strong className="font-extrabold text-[#6B2E4C] block sm:inline mr-1">
              અગત્યની સૂચના (મહત્વપૂર્ણ):
            </strong>
            જ્યાં સુધી <strong>₹૧,૦૦૦ ટોકન પેમેન્ટનો સ્ક્રીનશૉટ</strong> WhatsApp પર વેરિફાય નહીં થાય, ત્યાં સુધી સ્લોટ બુક થયેલો ગણાશે નહીં. પેમેન્ટ વગર સ્લોટ હોલ્ડ પર રહેશે નહીં. દરેક પ્રોજેક્ટ માટે અલગથી સ્લોટ બુક કરવાનો રહેશે.
          </div>
        </div>

        {/* ── Wizard Progress Bar (Mobile Friendly) ── */}
        {currentStep <= 4 && (
          <div className="flex items-center justify-between text-2xs font-bold text-[#8E8E93] max-w-xl mx-auto px-1">
            {[
              { num: 1, label: "૧. સ્લોટ તારીખ" },
              { num: 2, label: "૨. સર્વિસ & ટાઈમ" },
              { num: 3, label: "૩. સ્ટુડિયો વિગત" },
              { num: 4, label: "૪. ₹1000 પેમેન્ટ" },
            ].map((st) => (
              <div
                key={st.num}
                className={`flex items-center space-x-1 sm:space-x-1.5 transition ${
                  currentStep === st.num
                    ? "text-[#6B2E4C] font-extrabold"
                    : currentStep > st.num
                    ? "text-emerald-700"
                    : ""
                }`}
              >
                <span
                  className={`h-6 w-6 rounded-full flex items-center justify-center text-xs font-bold ${
                    currentStep === st.num
                      ? "bg-[#6B2E4C] text-white shadow-sm"
                      : currentStep > st.num
                      ? "bg-emerald-600 text-white"
                      : "bg-[#E5E5EA] text-[#8E8E93]"
                  }`}
                >
                  {currentStep > st.num ? "✓" : st.num}
                </span>
                <span className="text-xs sm:inline">{st.label}</span>
              </div>
            ))}
          </div>
        )}

        {/* ── STEP 1: SELECT PRODUCTION SLOT DATE (Single Date Across Entire Year) ── */}
        {currentStep === 1 && (
          <div className="bg-white rounded-3xl p-5 sm:p-8 border border-[#E5E5EA] shadow-xl space-y-5">
            <div className="border-b border-[#E5E5EA] pb-3">
              <h2 className="text-base sm:text-lg font-bold text-[#6B2E4C] flex items-center space-x-2">
                <CalendarIcon className="h-5 w-5 text-amber-600 shrink-0" />
                <span>પગલું ૧: એડિટિંગ શરૂ કરવાની સ્લોટ તારીખ પસંદ કરો</span>
              </h2>
              <p className="text-xs text-[#8E8E93] mt-0.5">
                તમે આખા વર્ષ (૨૦૨૬-૨૦૨૭) માંથી તમારા શૂટ કે ડિલિવરી મુજબની કોઈપણ અનુકૂળ તારીખ પસંદ કરી શકો છો.
              </p>
            </div>

            {/* Quick Season Month Jump Chips */}
            <div className="space-y-2">
              <label className="block text-2xs font-extrabold text-[#8E8E93] uppercase tracking-wider">
                ઝડપી તારીખ પસંદગી (૨૦૨૬ - ૨૦૨૭ વેડિંગ સીઝન શૉર્ટકટ્સ):
              </label>
              <div className="flex flex-wrap gap-1.5">
                {SEASON_MONTH_SHORTCUTS.map((chip) => (
                  <button
                    key={chip.label}
                    type="button"
                    onClick={() => setSelectedSlotDate(chip.date)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition border ${
                      selectedSlotDate === chip.date
                        ? "bg-[#6B2E4C] text-white border-[#6B2E4C] shadow-sm"
                        : "bg-[#F8F7F4] hover:bg-[#E5E5EA] text-[#1C1C1E] border-[#D1D1D6]"
                    }`}
                  >
                    {chip.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Native Full-Year Date Picker (Mobile Optimized) */}
            <div className="space-y-1.5 pt-1">
              <label className="block text-xs font-bold text-[#1C1C1E]">
                સ્લોટ તારીખ જાતે પસંદ કરો (Slot Date) *
              </label>
              <input
                type="date"
                required
                value={selectedSlotDate}
                onChange={(e) => setSelectedSlotDate(e.target.value)}
                min={new Date().toISOString().split("T")[0]}
                max="2027-12-31"
                className="w-full px-4 py-3 sm:py-2.5 rounded-2xl border-2 border-[#6B2E4C] font-mono font-bold text-base sm:text-sm text-[#6B2E4C] bg-amber-50/20 focus:outline-none focus:ring-2 focus:ring-[#6B2E4C]"
              />
              <p className="text-2xs text-[#8E8E93]">
                * આ તારીખે તમારા પ્રોજેક્ટનું એડિટિંગ શરૂ થશે. જો શૂટિંગ મોડું થાય તો સ્લોટ તારીખ મફતમાં બદલી શકાશે.
              </p>
            </div>

            {selectedSlotDate && (
              <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 flex items-center space-x-2.5">
                <CheckCircle className="h-5 w-5 text-emerald-700 shrink-0" />
                <div>
                  <span className="font-bold">પસંદ કરેલ મુહૂર્ત સ્લોટ:</span>{" "}
                  <strong>{selectedSlotDate}</strong> • અંદાજિત 4K માસ્ટર ડિલિવરી તારીખ:{" "}
                  <strong>{promisedDeliveryDate}</strong>
                </div>
              </div>
            )}

            <div className="flex justify-end pt-2">
              <button
                type="button"
                disabled={!selectedSlotDate}
                onClick={() => goToStep(2)}
                className="w-full sm:w-auto px-7 py-3 rounded-xl bg-[#6B2E4C] hover:bg-[#58243E] disabled:opacity-40 text-white font-bold text-xs shadow-md transition flex items-center justify-center space-x-1.5"
              >
                <span>આગળ વધો: સર્વિસ & ટાઈમ સિલેક્શન →</span>
              </button>
            </div>
          </div>
        )}

        {/* ── STEP 2: SERVICE SELECTION (REELS EXCLUDED, SINGLE PROJECT DELIVERABLES) ── */}
        {currentStep === 2 && (
          <div className="bg-white rounded-3xl p-5 sm:p-8 border border-[#E5E5EA] shadow-xl space-y-5">
            <div className="border-b border-[#E5E5EA] pb-3">
              <div className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 text-2xs font-extrabold mb-1">
                <span>૧ પ્રોજેક્ટ સ્લોટ</span>
              </div>
              <h2 className="text-base sm:text-lg font-bold text-[#6B2E4C] flex items-center space-x-2">
                <Video className="h-5 w-5 text-amber-600 shrink-0" />
                <span>પગલું ૨: સર્વિસ પસંદ કરો અને અંદાજિત આઉટપુટ ટાઇમ લખો</span>
              </h2>
              <p className="text-xs text-[#8E8E93] mt-0.5">
                આ પ્રોજેક્ટ માટે તમને કેટલા સમયનું આઉટપુટ જોઈએ છે તે લખો. ૧૫% મુહૂર્ત ડિસ્કાઉન્ટ આપોઆપ લાગુ થશે.
              </p>
            </div>

            {/* Policy Notice: Reels are excluded */}
            <div className="p-3 rounded-xl bg-[#F8F7F4] border border-[#E5E5EA] text-2xs text-[#4A4A4C] flex items-center justify-between">
              <span>📌 આ ઑફરમાં ફક્ત ફુલ વેડિંગ પ્રોજેક્ટ્સ માન્ય છે (રીલ્સ આ ઑફરમાં સામેલ નથી).</span>
              <span className="font-bold text-[#6B2E4C] shrink-0 ml-2">૧ પ્રોજેક્ટ = ૧ સ્લોટ</span>
            </div>

            {/* List of Eligible Indian Services */}
            <div className="space-y-3">
              {ELIGIBLE_SERVICES.map((svc) => {
                const isSelected = selectedServices[svc.id]?.selected ?? false;
                const durationVal = selectedServices[svc.id]?.durationInput ?? svc.defaultDuration;

                return (
                  <div
                    key={svc.id}
                    className={`p-3.5 sm:p-4 rounded-2xl border-2 transition-all ${
                      isSelected
                        ? "border-[#6B2E4C] bg-amber-50/40 shadow-sm"
                        : "border-[#E5E5EA] bg-white hover:border-[#D1D1D6]"
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                      <div
                        onClick={() => toggleService(svc.id, svc.defaultDuration)}
                        className="cursor-pointer flex-1"
                      >
                        <div className="flex items-center space-x-2">
                          <span
                            className={`h-4 w-4 rounded border flex items-center justify-center text-2xs shrink-0 ${
                              isSelected
                                ? "bg-[#6B2E4C] border-[#6B2E4C] text-white"
                                : "border-[#D1D1D6] bg-white"
                            }`}
                          >
                            {isSelected && "✓"}
                          </span>
                          <span className="font-bold text-xs sm:text-sm text-[#1C1C1E]">
                            {svc.name}
                          </span>
                        </div>
                        <p className="text-2xs text-[#8E8E93] mt-1 ml-6">{svc.desc}</p>
                        <span className="inline-block mt-1.5 ml-6 px-2 py-0.5 rounded-md bg-amber-100 text-amber-900 font-bold text-2xs">
                          {svc.unitNote}
                        </span>
                      </div>

                      {/* Custom Output Duration Input */}
                      {isSelected && (
                        <div className="w-full sm:w-40 shrink-0 space-y-1 sm:text-right pt-2 sm:pt-0 border-t sm:border-t-0 border-[#E5E5EA]">
                          <label className="block text-2xs font-bold text-[#6B2E4C] uppercase sm:text-right">
                            આઉટપુટ ટાઇમ (Duration) *
                          </label>
                          <input
                            type="text"
                            value={durationVal}
                            onChange={(e) => updateDuration(svc.id, e.target.value)}
                            placeholder={svc.placeholder}
                            className="w-full px-3 py-2 sm:py-1.5 rounded-xl border border-amber-400 bg-white font-mono font-bold text-sm sm:text-xs text-[#6B2E4C] sm:text-right focus:outline-none"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* ── Real-Time Festive Calculation Card ── */}
            <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-[#6B2E4C] to-[#45142E] text-white space-y-3 shadow-lg">
              <div className="flex items-center justify-between border-b border-white/20 pb-2">
                <span className="text-xs font-bold text-amber-300 uppercase tracking-wider flex items-center space-x-1.5">
                  <span>🪔</span>
                  <span>મુહૂર્ત લાઈવ બિલિંગ કેલ્ક્યુલેટર</span>
                </span>
                <span className="text-2xs px-2 py-0.5 rounded-full bg-amber-400 text-[#6B2E4C] font-extrabold">
                  FLAT 15% OFF
                </span>
              </div>

              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between text-white/80">
                  <span>મૂળ અંદાજિત કિંમત (Regular):</span>
                  <span className="font-mono line-through text-red-200">
                    ₹{pricingSummary.grandOriginal.toLocaleString("en-IN")}
                  </span>
                </div>
                <div className="flex justify-between text-amber-300 font-bold">
                  <span>મુહૂર્ત ૧૫% ડિસ્કાઉન્ટ બચત:</span>
                  <span className="font-mono">
                    - ₹{pricingSummary.grandDiscount.toLocaleString("en-IN")}
                  </span>
                </div>
                <div className="flex justify-between text-sm sm:text-base font-extrabold text-[#FFF8E7] pt-1 border-t border-white/20">
                  <span>મુહૂર્ત ફાઇનલ કિંમત:</span>
                  <span className="font-mono text-amber-300">
                    ₹{pricingSummary.grandOfferPrice.toLocaleString("en-IN")}
                  </span>
                </div>
              </div>

              {/* Advance and Balance Highlight */}
              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-white/20 text-xs">
                <div className="p-2.5 rounded-xl bg-white/10 border border-amber-300/40">
                  <span className="text-2xs text-amber-200 uppercase font-bold block">
                    સ્લોટ લોક કરવા આજે ચૂકવો:
                  </span>
                  <span className="text-base font-extrabold font-mono text-emerald-300">
                    ₹1,000
                  </span>
                  <span className="text-2xs text-white/70 block mt-0.5">(૧ પ્રોજેક્ટ ટોકન)</span>
                </div>
                <div className="p-2.5 rounded-xl bg-white/10 border border-white/10 text-right">
                  <span className="text-2xs text-white/70 uppercase font-bold block">
                    ડિલિવરી વખતે બાકી રકમ:
                  </span>
                  <span className="text-base font-extrabold font-mono text-white">
                    ₹{pricingSummary.balanceDue.toLocaleString("en-IN")}
                  </span>
                  <span className="text-2xs text-white/70 block mt-0.5">(કામ પૂરું થયે)</span>
                </div>
              </div>
            </div>

            <div className="flex flex-col-reverse sm:flex-row justify-between gap-2 pt-2">
              <button
                type="button"
                onClick={() => goToStep(1)}
                className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-[#D1D1D6] text-xs font-semibold text-center"
              >
                ← પાછળ (તારીખ બદલો)
              </button>
              <button
                type="button"
                disabled={pricingSummary.items.length === 0}
                onClick={() => goToStep(3)}
                className="w-full sm:w-auto px-6 py-3 rounded-xl bg-[#6B2E4C] hover:bg-[#58243E] disabled:opacity-40 text-white font-bold text-xs shadow-md transition text-center"
              >
                આગળ વધો: સ્ટુડિયો વિગતો ભરો →
              </button>
            </div>
          </div>
        )}

        {/* ── STEP 3: STUDIO & COUPLE DETAILS (Single Project Representation) ── */}
        {currentStep === 3 && (
          <div className="bg-white rounded-3xl p-5 sm:p-8 border border-[#E5E5EA] shadow-xl space-y-5">
            <div className="border-b border-[#E5E5EA] pb-3">
              <h2 className="text-base sm:text-lg font-bold text-[#6B2E4C] flex items-center space-x-2">
                <FileText className="h-5 w-5 text-amber-600 shrink-0" />
                <span>પગલું ૩: સ્ટુડિયો અને પ્રોજેક્ટની વિગતો</span>
              </h2>
              <p className="text-xs text-[#8E8E93] mt-0.5">
                દરેક પ્રોજેક્ટ માટે અલગ સ્લોટ બુક કરવાનો રહેશે. આ ફોર્મમાં આ ચોક્કસ લગ્ન પ્રોજેક્ટની વિગત લખો.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-2xs font-bold text-[#8E8E93] uppercase mb-1">
                  સ્ટુડિયો / કંપનીનું નામ *
                </label>
                <input
                  type="text"
                  required
                  value={studioName}
                  onChange={(e) => setStudioName(e.target.value)}
                  placeholder="દા.ત. Royal Wedding Films"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#D1D1D6] text-sm sm:text-xs focus:ring-2 focus:ring-[#6B2E4C] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-2xs font-bold text-[#8E8E93] uppercase mb-1">
                  તમારું નામ (Contact Person)
                </label>
                <input
                  type="text"
                  value={contactPerson}
                  onChange={(e) => setContactPerson(e.target.value)}
                  placeholder="દા.ત. Rahul Patel"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#D1D1D6] text-sm sm:text-xs focus:ring-2 focus:ring-[#6B2E4C] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-2xs font-bold text-[#8E8E93] uppercase mb-1">
                  આ પ્રોજેક્ટનું કપલ નામ (Couple Names) *
                </label>
                <input
                  type="text"
                  required
                  value={coupleNames}
                  onChange={(e) => setCoupleNames(e.target.value)}
                  placeholder="દા.ત. Parth & Pooja"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#D1D1D6] text-sm sm:text-xs font-semibold focus:ring-2 focus:ring-[#6B2E4C] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-2xs font-bold text-[#8E8E93] uppercase mb-1">
                  WhatsApp ફોન નંબર *
                </label>
                <input
                  type="tel"
                  required
                  value={whatsappNumber}
                  onChange={(e) => setWhatsappNumber(e.target.value)}
                  placeholder="+91 98765 43210"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#D1D1D6] font-mono font-bold text-sm sm:text-xs focus:ring-2 focus:ring-[#6B2E4C] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-2xs font-bold text-[#8E8E93] uppercase mb-1">
                  શહેર (City)
                </label>
                <input
                  type="text"
                  value={clientCity}
                  onChange={(e) => setClientCity(e.target.value)}
                  placeholder="દા.ત. Ahmedabad / Surat / Rajkot"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#D1D1D6] text-sm sm:text-xs focus:ring-2 focus:ring-[#6B2E4C] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-2xs font-bold text-[#8E8E93] uppercase mb-1">
                  પ્રોજેક્ટ નોટ્સ / વિશેષ સૂચના
                </label>
                <input
                  type="text"
                  value={projectNotes}
                  onChange={(e) => setProjectNotes(e.target.value)}
                  placeholder="કેમેરા પ્રોફાઇલ, સોંગ ચોઇસ, અથવા કલર ટોન"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#D1D1D6] text-sm sm:text-xs focus:ring-2 focus:ring-[#6B2E4C] focus:outline-none"
                />
              </div>
            </div>

            {/* Terms & Conditions Agreement */}
            <div className="p-3.5 sm:p-4 rounded-2xl bg-[#F8F7F4] border border-[#E5E5EA] space-y-2 text-2xs text-[#4A4A4C]">
              <span className="font-bold text-[#6B2E4C] uppercase block">
                📜 લાભ પાંચમ મુહૂર્ત નિયમો & શરતો (T&C):
              </span>
              <ul className="list-disc list-inside space-y-1 leading-relaxed">
                <li>આ ઑફર 14 નવેમ્બર 2026 રાત્રે 11:59 વાગ્યા સુધી જ માન્ય રહેશે.</li>
                <li><strong>પેમેન્ટ શરત:</strong> સ્લોટ લોક કરવા માટે પ્રોજેક્ટ દીઠ ₹1,000 ટોકન એડવાન્સ ચૂકવવું ફરજિયાત છે. પેમેન્ટ વગર સ્લોટ કન્ફર્મ ગણાશે નહીં.</li>
                <li>દરેક પ્રોજેક્ટ માટે અલગથી સ્લોટ બુક કરવાનો રહેશે.</li>
                <li>બુક કરેલા સ્લોટથી ઓછામાં ઓછા ૩ થી ૫ દિવસ પહેલાં રૉ ફૂટેજ પહોંચવી જરૂરી છે.</li>
                <li>વોટરમાર્કડ પ્રિવ્યુ Frame.io પર મંજૂર થયા પછી 4K માસ્ટર ફાઇલ ડિલિવરી વખતે ૧૫% ડિસ્કાઉન્ટ બાદ કરીને બાકી રકમ ચૂકવવાની રહેશે.</li>
              </ul>
              <label className="flex items-center space-x-2 pt-2 cursor-pointer font-bold text-xs text-[#1C1C1E]">
                <input
                  type="checkbox"
                  checked={agreedToTerms}
                  onChange={(e) => setAgreedToTerms(e.target.checked)}
                  className="h-4 w-4 rounded text-[#6B2E4C] focus:ring-[#6B2E4C]"
                />
                <span>હું તમામ નિયમો અને શરતો સાથે સહમત છું.</span>
              </label>
            </div>

            <div className="flex flex-col-reverse sm:flex-row justify-between gap-2 pt-2">
              <button
                type="button"
                onClick={() => goToStep(2)}
                className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-[#D1D1D6] text-xs font-semibold text-center"
              >
                ← પાછળ (સર્વિસ બદલો)
              </button>
              <button
                type="button"
                disabled={!studioName || !coupleNames || !whatsappNumber || !agreedToTerms}
                onClick={() => goToStep(4)}
                className="w-full sm:w-auto px-6 py-3 rounded-xl bg-[#6B2E4C] hover:bg-[#58243E] disabled:opacity-40 text-white font-bold text-xs shadow-md transition text-center"
              >
                આગળ વધો: ₹1,000 પેમેન્ટ & સ્લોટ લોક →
              </button>
            </div>
          </div>
        )}

        {/* ── STEP 4: UPI QR CODE & DIRECT MOBILE UPI APP INTENT ── */}
        {currentStep === 4 && (
          <div className="bg-white rounded-3xl p-5 sm:p-8 border-2 border-amber-400 shadow-2xl space-y-6">
            <div className="border-b border-[#E5E5EA] pb-3 text-center sm:text-left">
              <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-amber-100 text-amber-900 text-2xs font-extrabold mb-1">
                <span>🪔</span>
                <span>અંતિમ પગલું: ₹1,000 સ્લોટ લોક ટોકન પેમેન્ટ</span>
              </div>
              <h2 className="text-lg sm:text-xl font-extrabold text-[#6B2E4C]">
                ₹1,000 પેમેન્ટ કરો અને સ્ક્રીનશૉટ મોકલો
              </h2>
              <p className="text-xs text-[#8E8E93]">
                પેમેન્ટ કર્યા બાદ સ્ક્રીનશૉટ <strong>+91 8866323567</strong> પર મોકલવાનો રહેશે. પેમેન્ટ વગર સ્લોટ બુક થયેલો ગણાશે નહીં.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
              {/* Official UPI QR Code Card */}
              <div className="p-5 rounded-3xl bg-gradient-to-b from-[#FDFBF7] to-white border-2 border-amber-300/80 shadow-md text-center space-y-3">
                <div className="text-xs font-extrabold text-[#6B2E4C] uppercase tracking-wider">
                  RSE Post Production House
                </div>

                {/* Mobile Direct UPI Intent Button (Crucial for mobile phones) */}
                <div className="block sm:hidden">
                  <a
                    href={mobileUpiUrl}
                    className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs shadow-md transition flex items-center justify-center space-x-2"
                  >
                    <span>📲 UPI App માં ખોલો (GPay / PhonePe)</span>
                  </a>
                  <p className="text-2xs text-[#8E8E93] mt-1.5">
                    તમારા ફોનમાં રહેલી Google Pay કે PhonePe થી સીધું ₹૧,૦૦૦ પે કરો.
                  </p>
                </div>

                {/* Real Scannable UPI QR SVG */}
                <div className="mx-auto w-48 h-48 sm:w-52 sm:h-52 p-2 bg-white rounded-2xl border-2 border-[#6B2E4C] shadow-inner flex items-center justify-center">
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(
                      mobileUpiUrl
                    )}`}
                    alt="Scan UPI QR Code to pay ₹1000"
                    className="w-full h-full object-contain"
                  />
                </div>

                <div className="space-y-0.5">
                  <div className="text-base font-extrabold font-mono text-[#6B2E4C]">
                    ₹1,000.00
                  </div>
                  <div className="text-2xs text-[#8E8E93]">
                    Google Pay • PhonePe • Paytm • BHIM UPI
                  </div>
                </div>

                {/* Copy UPI Phone / ID */}
                <div className="flex items-center justify-center space-x-2 pt-1">
                  <span className="font-mono font-bold text-xs bg-[#F8F7F4] px-3 py-1.5 rounded-xl border border-[#D1D1D6] text-[#1C1C1E]">
                    8866323567
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText("8866323567");
                      setCopiedUpi(true);
                      setTimeout(() => setCopiedUpi(false), 2000);
                    }}
                    className="px-2.5 py-1.5 rounded-xl bg-[#6B2E4C] text-white text-2xs font-bold flex items-center space-x-1"
                  >
                    <Copy className="h-3 w-3" />
                    <span>{copiedUpi ? "કોપી થઈ ગયું!" : "કોપી નંબર"}</span>
                  </button>
                </div>
              </div>

              {/* Action Steps & WhatsApp Direct Submission */}
              <div className="space-y-3.5">
                <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-900 space-y-2">
                  <span className="font-extrabold text-xs uppercase block text-[#6B2E4C]">
                    📋 પેમેન્ટ કર્યા પછી શું કરવું?
                  </span>
                  <div className="space-y-1.5 text-2xs leading-relaxed">
                    <p>
                      <strong>૧.</strong> QR Code સ્કેન કરીને અથવા UPI App દ્વારા <strong>₹1,000</strong> પે કરો.
                    </p>
                    <p>
                      <strong>૨.</strong> પેમેન્ટ સક્સેસ થયાની સ્ક્રીનનો <strong>સ્ક્રીનશૉટ</strong> લો.
                    </p>
                    <p>
                      <strong>૩.</strong> નીચે આપેલા લીલા બટન પર ક્લિક કરીને સ્ક્રીનશૉટ અમારા સત્તાવાર WhatsApp{" "}
                      <strong>+91 8866323567</strong> પર મોકલો.
                    </p>
                    <p className="text-red-700 font-bold pt-1">
                      ⚠️ જ્યાં સુધી સ્ક્રીનશૉટ વેરિફાય નહીં થાય ત્યાં સુધી સ્લોટ બુક થયેલો ગણાશે નહીં.
                    </p>
                  </div>
                </div>

                {/* Big WhatsApp Screenshot Button */}
                <a
                  href={getWhatsAppScreenshotUrl()}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-3.5 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs shadow-lg transition flex items-center justify-center space-x-2 text-center"
                >
                  <Phone className="h-4 w-4" />
                  <span>📲 WhatsApp પર પેમેન્ટ સ્ક્રીનશૉટ મોકલો (+91 8866323567)</span>
                </a>

                {/* Final Booking Submit Button */}
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={handleSubmitBooking}
                  className="w-full py-3.5 px-4 rounded-2xl bg-[#6B2E4C] hover:bg-[#58243E] disabled:opacity-40 text-white font-extrabold text-xs shadow-lg transition flex items-center justify-center space-x-2"
                >
                  <Sparkles className="h-4 w-4 text-amber-300" />
                  <span>
                    {isSubmitting
                      ? "સ્લોટ બુકિંગ નોંધાઈ રહ્યું છે..."
                      : "સ્લોટ બુકિંગ સબમિટ કરો (રિક્વેસ્ટ નોંધો) →"}
                  </span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── STEP 5: SUCCESS / PENDING VERIFICATION SCREEN ── */}
        {currentStep === 5 && confirmedBooking && (
          <div className="bg-white rounded-3xl p-6 sm:p-10 border-2 border-emerald-400 shadow-2xl text-center space-y-5 animate-fadeIn">
            <div className="h-16 w-16 bg-amber-100 text-amber-800 rounded-full flex items-center justify-center mx-auto text-3xl font-bold">
              🪔
            </div>

            <div className="space-y-1.5">
              <span className="text-2xs font-extrabold px-3 py-1 rounded-full bg-amber-100 text-amber-900 uppercase">
                સ્લોટ બુકિંગ રિક્વેસ્ટ નોંધાઈ ગઈ છે
              </span>
              <h2 className="text-xl sm:text-2xl font-extrabold text-[#6B2E4C]">
                તમારા પ્રોજેક્ટ માટે સ્લોટ રિક્વેસ્ટ મળી ગઈ છે!
              </h2>
              <p className="text-xs text-[#8E8E93] max-w-md mx-auto">
                તમારા ₹૧,૦૦૦ ટોકન પેમેન્ટનો સ્ક્રીનશૉટ WhatsApp પર વેરિફાય થયા પછી સ્લોટ સત્તાવાર કન્ફર્મ થઈ જશે.
              </p>
            </div>

            {/* Receipt Summary Card */}
            <div className="max-w-md mx-auto p-4 sm:p-5 rounded-2xl bg-[#F8F7F4] border border-[#E5E5EA] text-left text-xs space-y-2">
              <div className="flex justify-between border-b border-[#E5E5EA] pb-1.5">
                <span className="text-[#8E8E93]">બુકિંગ કોડ:</span>
                <span className="font-mono font-extrabold text-[#6B2E4C]">
                  {confirmedBooking.code}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#8E8E93]">કપલ (પ્રોજેક્ટ):</span>
                <span className="font-bold">{confirmedBooking.coupleNames}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#8E8E93]">સ્ટુડિયો:</span>
                <span className="font-bold">{confirmedBooking.studioOrClient}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#8E8E93]">સ્લોટ તારીખ:</span>
                <span className="font-mono font-bold text-[#6B2E4C]">{confirmedBooking.slotDate}</span>
              </div>
              <div className="flex justify-between border-t border-[#E5E5EA] pt-1.5 text-amber-900 font-bold">
                <span>૧૫% મુહૂર્ત ફાઇનલ કિંમત:</span>
                <span className="font-mono">₹{confirmedBooking.pricing?.totalAmount?.toLocaleString("en-IN")}</span>
              </div>
              <div className="flex justify-between text-amber-700 font-bold">
                <span>ટોકન એડવાન્સ:</span>
                <span className="font-mono">₹1,000 (ચકાસણી પ્રક્રિયામાં)</span>
              </div>
            </div>

            {/* Actions: Send Screenshot & Multi-Project Booking */}
            <div className="pt-2 max-w-md mx-auto space-y-2.5">
              <a
                href={getWhatsAppScreenshotUrl()}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-3.5 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs flex items-center justify-center space-x-2 shadow-md transition"
              >
                <Phone className="h-4 w-4" />
                <span>હમણાં જ પેમેન્ટ સ્ક્રીનશૉટ WhatsApp કરો (+91 8866323567)</span>
              </a>

              {/* Multi-Project Button (Point 04) */}
              <button
                type="button"
                onClick={handleBookAnotherProject}
                className="w-full py-3 px-4 rounded-2xl bg-[#6B2E4C] hover:bg-[#58243E] text-white font-bold text-xs flex items-center justify-center space-x-1.5 shadow-sm transition"
              >
                <PlusCircle className="h-4 w-4" />
                <span>➕ બીજા પ્રોજેક્ટ માટે સ્લોટ બુક કરો (Book Another Project)</span>
              </button>

              <Link
                href="/book"
                className="inline-block text-xs font-semibold text-[#8E8E93] hover:text-[#1C1C1E] underline pt-1"
              >
                સામાન્ય બુકિંગ હોમપેજ પર જાઓ
              </Link>
            </div>
          </div>
        )}

        {/* ── 4. Frequently Asked Questions (FAQ Accordion) ── */}
        <div className="bg-white rounded-3xl p-5 sm:p-8 border border-[#E5E5EA] shadow-lg space-y-4">
          <div className="flex items-center space-x-2 border-b border-[#E5E5EA] pb-3">
            <HelpCircle className="h-5 w-5 text-[#6B2E4C]" />
            <h3 className="font-bold text-base text-[#1C1C1E]">
              વારંવાર પૂછાતા પ્રશ્નો (FAQ)
            </h3>
          </div>

          <div className="space-y-2.5">
            {[
              {
                q: "જો લગ્નની તારીખ બદલાય કે શૂટિંગ મોડું થાય તો સ્લોટ તારીખ બદલી શકાશે?",
                a: "હા, ચોક્કસ! તમે સ્લોટ શરૂ થવાના ઓછામાં ઓછા ૭ દિવસ પહેલાં અમને WhatsApp પર જાણ કરીને આખા વર્ષ (૨૦૨૬-૨૦૨૭) માંથી કોઈપણ નવી ઉપલબ્ધ તારીખમાં ફ્રીમાં સ્લોટ રિશેડ્યુલ કરી શકો છો.",
              },
              {
                q: "₹૧,૦૦૦ ટોકન એડવાન્સ શા માટે લેવામાં આવે છે?",
                a: "લાભ પાંચમ મુહૂર્તમાં એડિટર્સના લિમિટેડ સ્લોટ્સ હોય છે. આ ₹૧,૦૦૦ ટોકન તમારા પ્રોજેક્ટ માટે ડેડિકેટેડ સીનિયર એડિટર અને કેલેન્ડર લોક કરવા માટે છે. આ રકમ તમારા ફાઇનલ બિલમાંથી બાદ થઈ જશે.",
              },
              {
                q: "જો મારી પાસે ૨ કે ૩ અલગ-અલગ લગ્નોના પ્રોજેક્ટ્સ હોય તો?",
                a: "દરેક પ્રોજેક્ટ માટે અલગથી સ્લોટ બુક કરવાનો રહેશે (પ્રોજેક્ટ દીઠ ₹૧,૦૦૦ ટોકન). પ્રથમ પ્રોજેક્ટ બુક કર્યા બાદ તમે 'બીજા પ્રોજેક્ટ માટે સ્લોટ બુક કરો' બટન પર ક્લિક કરીને આગલો સ્લોટ બુક કરી શકો છો.",
              },
              {
                q: "૧૫% ડિસ્કાઉન્ટ કઈ રીતે મળશે?",
                a: "ફાઇનલ ડિલિવરી વખતે તમારા પ્રોજેક્ટના મૂળ બિલમાંથી પૂરા ૧૫% બાદ કરીને જ બિલ આપવામાં આવશે.",
              },
              {
                q: "રૉ ફૂટેજ (SSD / ગૂગલ ડ્રાઇવ) ક્યારે આપવાની રહેશે?",
                a: "તમે બુક કરેલા સ્લોટથી ઓછામાં ઓછા ૩ થી ૫ દિવસ પહેલાં કુરિયર દ્વારા SSD/HDD અથવા ગૂગલ ડ્રાઇવ લિંક દ્વારા ડેટા અમારા ગાંધીનગર સ્ટુડિયો પર પહોંચવો જરૂરી છે.",
              },
            ].map((faq, idx) => (
              <div
                key={idx}
                className="border border-[#E5E5EA] rounded-2xl overflow-hidden transition"
              >
                <button
                  type="button"
                  onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                  className="w-full p-3.5 text-left flex items-center justify-between font-bold text-xs sm:text-sm text-[#1C1C1E] bg-[#FDFBF7] hover:bg-[#F8F7F4]"
                >
                  <span>{faq.q}</span>
                  {openFaq === idx ? (
                    <ChevronUp className="h-4 w-4 text-[#6B2E4C] shrink-0 ml-2" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-[#8E8E93] shrink-0 ml-2" />
                  )}
                </button>
                {openFaq === idx && (
                  <div className="p-3.5 bg-white text-xs text-[#4A4A4C] leading-relaxed border-t border-[#E5E5EA]">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* ── Studio Assurance & Contact Footer ── */}
        <div className="text-center space-y-1 text-2xs text-[#8E8E93] pb-4">
          <p className="font-bold text-[#6B2E4C]">RSE Post Production House • Gandhinagar, Gujarat</p>
          <p>સહાયતા માટે સત્તાવાર WhatsApp: +91 8866323567 • ઈમેઇલ: Hello@rse-edit.com</p>
        </div>
      </div>
    </div>
  );
}
