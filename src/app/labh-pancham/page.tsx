"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import Link from "next/link";
import { useApp } from "@/context/AppContext";
import {
  calculateLabhPanchamPrice,
  isLabhPanchamActive,
  LABH_PANCHAM_OFFER_DEADLINE,
  parseDuration,
} from "@/lib/pricingCalculator";
import { INDIAN_SERVICES } from "@/data/servicesData";
import { Booking } from "@/types";
import {
  Calendar as CalendarIcon,
  Clock,
  Phone,
  CheckCircle,
  AlertCircle,
  Video,
  Send,
  Sparkles,
  Check,
  ChevronLeft,
  ChevronRight,
  Copy,
  ExternalLink,
  ShieldCheck,
  FileText,
  Gift,
} from "lucide-react";

const STUDIO_WHATSAPP = "+918866323567";
const STUDIO_WHATSAPP_CLEAN = "918866323567";

export default function LabhPanchamOfferPage() {
  const {
    addBooking,
    getSlotAvailability,
    calculateDeliveryDate,
    findNextAvailableSlot,
    bookings,
  } = useApp();

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
  // Step 1: Select Slot Date
  // Step 2: Choose Services & Output Duration
  // Step 3: Studio & Couple Details
  // Step 4: Pay ₹1,000 Advance via QR & WhatsApp Screenshot
  const [currentStep, setCurrentStep] = useState<number>(1);
  const formTopRef = useRef<HTMLDivElement>(null);

  // Date selection
  const [selectedSlotDate, setSelectedSlotDate] = useState<string>("");
  const [eventDate, setEventDate] = useState<string>("");
  const [calendarMonth, setCalendarMonth] = useState<Date>(() => new Date());

  // Services & Custom Output Duration Selection
  const [selectedServices, setSelectedServices] = useState<{
    [serviceId: string]: {
      selected: boolean;
      durationInput: string; // e.g. "05:40" or "1:25" or count
    };
  }>({
    in_wedding_highlight: { selected: true, durationInput: "05:00" },
  });

  // Client Details
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

  // ─── Real-Time Pricing Summary with 15% Flat Discount & ₹1,000 Token ───
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
      const def = INDIAN_SERVICES.find((s) => s.id === svcId);
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

  // Delivery date calculation
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
        eventDate: eventDate || selectedSlotDate,
        slotDate: selectedSlotDate,
        deliveryDate: promisedDeliveryDate,
        serviceId: primarySvc?.id || "in_wedding_highlight",
        packageType: `[🪔 લાભ પાંચમ] ${allSvcNames}`,
        serviceIds: pricingSummary.items.map((i) => i.id),
        packagesList: pricingSummary.items.map((i) => i.name),
        editorDays: 4,
        clientDays: 6,
        deliveryMethod: "online",
        rawLink: "Awaiting Footage / Drive Link",
        notes: `🪔 લાભ પાંચમ મુહૂર્ત ઑફર (15% OFF). એસ્ટિમેટેડ ડ્યુરેશન: ${allDurations}. નોટ્સ: ${projectNotes}`,
        ndaAccepted: true,
        ndaAcceptedAt: new Date().toISOString(),
        offerType: "labh_pancham_2026",
        discountPercent: 15,
        paymentScreenshotSent: true,
        pricing: {
          totalAmount: pricingSummary.grandOfferPrice,
          advanceAmount: pricingSummary.tokenAdvance,
          finalAmount: pricingSummary.balanceDue,
          advancePaid: true, // ₹1,000 token advance initiated
          finalPaid: false,
          currency: "INR",
        },
        status: "new_deposit_pending",
      });

      setConfirmedBooking(newBooking);
      goToStep(5); // Show success screen
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // WhatsApp screenshot click handler
  const getWhatsAppScreenshotUrl = () => {
    const text = `નમસ્તે RSE સ્ટુડિયો,\n\nમેં "લાભ પાંચમ મુહૂર્ત ઓફર '26" હેઠળ સ્લોટ બુકિંગ માટે ₹1,000 ટોકન એડવાન્સ પેમેન્ટ કર્યું છે.\n\n👤 સ્ટુડિયો / ક્લાયન્ટ: ${studioName || contactPerson || "ક્લાયન્ટ"}\n💍 કપલ: ${coupleNames}\n📞 ફોન: ${whatsappNumber}\n🗓️ બુક કરેલ સ્લોટ તારીખ: ${selectedSlotDate}\n💰 કુલ ઑફર રકમ: ₹${pricingSummary.grandOfferPrice}\n\nપેમેન્ટનો સ્ક્રીનશૉટ આ સાથે મોકલી રહ્યો છું. કૃપા કરીને સ્લોટ કન્ફર્મ કરવા વિનંતી!`;
    return `https://wa.me/${STUDIO_WHATSAPP_CLEAN}?text=${encodeURIComponent(text)}`;
  };

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
            આ સ્પેશિયલ મુહૂર્ત ઑફર 14 નવેમ્બર 2026 રાત્રે 11:59 વાગ્યા સુધી સીમિત હતી. તમામ બુક થયેલા સ્લોટ્સ કન્ફર્મ થઈ ગયા છે.
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
    <div className="min-h-screen bg-[#FAF8F5] text-[#1C1C1E] font-sans antialiased selection:bg-[#6B2E4C] selection:text-white pb-20">
      {/* ── Top Festive Golden Bar ── */}
      <div className="bg-gradient-to-r from-[#6B2E4C] via-[#8B3A62] to-[#6B2E4C] text-[#F5E6CC] border-b border-amber-400/30 px-4 py-2.5 text-center text-xs font-semibold shadow-sm sticky top-0 z-40 backdrop-blur-md">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-1">
          <div className="flex items-center space-x-1.5">
            <span className="text-base animate-pulse">🪔</span>
            <span className="font-bold tracking-wide">
              શુભ લાભ પાંચમ મુહૂર્ત ઑફર '26 • ફ્લેટ 15% ડિસ્કાઉન્ટ
            </span>
          </div>
          <div className="flex items-center space-x-2 text-2xs font-mono font-bold bg-black/30 px-3 py-1 rounded-full border border-amber-300/40 text-amber-200">
            <span>ઓફર સમાપ્ત થવાને આડે:</span>
            <span className="text-white">
              {timeLeft.days}દિ {timeLeft.hours}ક {timeLeft.minutes}મિ {timeLeft.seconds}સે
            </span>
          </div>
        </div>
      </div>

      <div ref={formTopRef} className="max-w-4xl mx-auto px-4 sm:px-6 pt-6 sm:pt-10 space-y-8">
        {/* ── Festive Hero Header ── */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#6B2E4C] via-[#521C37] to-[#360F22] text-white p-6 sm:p-10 shadow-2xl border border-amber-400/40 text-center space-y-4">
          {/* Subtle Festive Background Glows */}
          <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-amber-400/20 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-64 h-64 bg-[#F59E0B]/20 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 space-y-3">
            <div className="inline-flex items-center space-x-2 px-4 py-1.5 rounded-full bg-amber-400/20 border border-amber-300/40 text-amber-300 text-2xs font-extrabold uppercase tracking-widest shadow-sm">
              <span>✨ દિવાળી & લાભ પાંચમ વેડિંગ સીઝન સ્પેશિયલ ✨</span>
            </div>

            <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight font-serif text-[#FFF8E7] drop-shadow-sm">
              RSE લાભ પાંચમ મુહૂર્ત બુકિંગ ઑફર '26
            </h1>

            <p className="text-xs sm:text-sm text-amber-100/90 max-w-2xl mx-auto leading-relaxed">
              નવા વર્ષના શુભ મુહૂર્તમાં તમારા વેડિંગ એડિટિંગ સ્લોટ્સ કરો લોક. તમામ સર્વિસ પર{" "}
              <strong className="text-amber-300 font-bold underline decoration-amber-400 underline-offset-4">
                ફ્લેટ ૧૫% ડિસ્કાઉન્ટ
              </strong>{" "}
              અને સ્લોટ કન્ફર્મ કરવા માત્ર{" "}
              <strong className="text-amber-300 font-bold">₹૧,૦૦૦ ટોકન એડવાન્સ!</strong>
            </p>

            {/* 3 Festive Value Badges */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-3 max-w-2xl mx-auto text-left">
              <div className="p-3 rounded-2xl bg-white/10 border border-amber-300/30 backdrop-blur-sm flex items-center space-x-2.5">
                <span className="text-2xl shrink-0">🎁</span>
                <div>
                  <div className="text-xs font-bold text-amber-300">ફ્લેટ 15% ડિસ્કાઉન્ટ</div>
                  <div className="text-2xs text-amber-100/80">દરેક પ્રોજેક્ટના ફાઇનલ બિલ પર</div>
                </div>
              </div>
              <div className="p-3 rounded-2xl bg-white/10 border border-amber-300/30 backdrop-blur-sm flex items-center space-x-2.5">
                <span className="text-2xl shrink-0">🔒</span>
                <div>
                  <div className="text-xs font-bold text-amber-300">માત્ર ₹1,000 માં સ્લોટ લોક</div>
                  <div className="text-2xs text-amber-100/80">આખી સીઝનનો સ્લોટ સુરક્ષિત</div>
                </div>
              </div>
              <div className="p-3 rounded-2xl bg-white/10 border border-amber-300/30 backdrop-blur-sm flex items-center space-x-2.5">
                <span className="text-2xl shrink-0">🎨</span>
                <div>
                  <div className="text-xs font-bold text-amber-300">સિનેમેટિક 4K કલર ગ્રેડિંગ</div>
                  <div className="text-2xs text-amber-100/80">Frame.io પ્રિવ્યુ & ફ્રી રિવિઝન</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── Wizard Progress Bar ── */}
        {currentStep <= 4 && (
          <div className="flex items-center justify-between text-2xs font-bold text-[#8E8E93] max-w-xl mx-auto px-2">
            {[
              { num: 1, label: "૧. સ્લોટ તારીખ" },
              { num: 2, label: "૨. સર્વિસ & ટાઈમ" },
              { num: 3, label: "૩. સ્ટુડિયો વિગત" },
              { num: 4, label: "૪. ₹1000 પેમેન્ટ" },
            ].map((st) => (
              <div
                key={st.num}
                className={`flex items-center space-x-1.5 transition ${
                  currentStep === st.num
                    ? "text-[#6B2E4C] font-extrabold"
                    : currentStep > st.num
                    ? "text-emerald-700"
                    : ""
                }`}
              >
                <span
                  className={`h-5 w-5 rounded-full flex items-center justify-center text-2xs ${
                    currentStep === st.num
                      ? "bg-[#6B2E4C] text-white"
                      : currentStep > st.num
                      ? "bg-emerald-600 text-white"
                      : "bg-[#E5E5EA] text-[#8E8E93]"
                  }`}
                >
                  {currentStep > st.num ? "✓" : st.num}
                </span>
                <span className="hidden sm:inline">{st.label}</span>
              </div>
            ))}
          </div>
        )}

        {/* ── STEP 1: SELECT EVENT DATE & PRODUCTION SLOT DATE ── */}
        {currentStep === 1 && (
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#E5E5EA] shadow-xl space-y-6">
            <div className="border-b border-[#E5E5EA] pb-3">
              <h2 className="text-lg font-bold text-[#6B2E4C] flex items-center space-x-2">
                <CalendarIcon className="h-5 w-5 text-amber-600" />
                <span>પગલું ૧: લગ્ન તારીખ અને એડિટિંગ સ્લોટ તારીખ પસંદ કરો</span>
              </h2>
              <p className="text-xs text-[#8E8E93]">
                તમે નવેમ્બર, ડિસેમ્બર કે આગામી ૨૦૨૭ ના લગ્નોનો સ્લોટ અત્યારથી લાભ પાંચમ મુહૂર્તમાં લોક કરી શકો છો!
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-2xs font-bold text-[#8E8E93] uppercase mb-1">
                  લગ્ન / ઇવેન્ટ તારીખ (Event Date)
                </label>
                <input
                  type="date"
                  value={eventDate}
                  onChange={(e) => setEventDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#D1D1D6] font-mono text-xs text-[#1C1C1E] focus:outline-none focus:ring-2 focus:ring-[#6B2E4C]"
                />
              </div>

              <div>
                <label className="block text-2xs font-bold text-[#8E8E93] uppercase mb-1">
                  એડિટિંગ શરૂ કરવાની સ્લોટ તારીખ (Production Slot Date) *
                </label>
                <input
                  type="date"
                  required
                  value={selectedSlotDate}
                  onChange={(e) => setSelectedSlotDate(e.target.value)}
                  min={new Date().toISOString().split("T")[0]}
                  className="w-full px-3.5 py-2.5 rounded-xl border-2 border-[#6B2E4C] font-mono font-bold text-xs text-[#6B2E4C] focus:outline-none"
                />
              </div>
            </div>

            {selectedSlotDate && (
              <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 flex items-center space-x-3">
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
                className="px-6 py-2.5 rounded-xl bg-[#6B2E4C] hover:bg-[#58243E] disabled:opacity-40 text-white font-bold text-xs shadow-md transition flex items-center space-x-1.5"
              >
                <span>આગળ વધો: સર્વિસ & ટાઈમ સિલેક્શન →</span>
              </button>
            </div>
          </div>
        )}

        {/* ── STEP 2: SERVICE SELECTION WITH CUSTOM ESTIMATED OUTPUT DURATION ── */}
        {currentStep === 2 && (
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#E5E5EA] shadow-xl space-y-6">
            <div className="border-b border-[#E5E5EA] pb-3">
              <h2 className="text-lg font-bold text-[#6B2E4C] flex items-center space-x-2">
                <Video className="h-5 w-5 text-amber-600" />
                <span>પગલું ૨: સર્વિસ પસંદ કરો અને અંદાજિત આઉટપુટ ટાઇમ લખો</span>
              </h2>
              <p className="text-xs text-[#8E8E93]">
                તમને કેટલા સમયનું આઉટપુટ જોઈએ છે તે લખો. ૧૫% મુહૂર્ત ડિસ્કાઉન્ટ ઓટોમેટિક લાગુ થઈને ફાઇનલ રેટ દેખાશે.
              </p>
            </div>

            {/* List of Indian Services with Custom Output Inputs */}
            <div className="space-y-3">
              {[
                {
                  id: "in_wedding_highlight",
                  name: "Wedding Highlight (૩ થી ૫ મિનિટ)",
                  desc: "ટીઝર + સોંગ હાઇલાઇટ, સિનેમેટિક 4K કલર ગ્રેડિંગ",
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
                {
                  id: "in_wedding_reel",
                  name: "Wedding Reel (Vertical 9:16)",
                  desc: "ઇન્સ્ટાગ્રામ ટ્રેન્ડિંગ ઓડિયો, ફાસ્ટ કટ્સ, 9:16 વર્ટિકલ",
                  defaultDuration: "1",
                  placeholder: "રીલ્સની સંખ્યા (દા.ત. 1, 2, 3)",
                  unitNote: "મૂળ ભાવ: ₹951/રીલ → 15% મુહૂર્ત ઑફર: ₹808/રીલ",
                },
                {
                  id: "in_wedding_insta_cut",
                  name: "Wedding Insta Cut (Vertical 9:16)",
                  desc: "પ્રિમિયમ કલર ગ્રેડેડ ઇન્સ્ટા કટ",
                  defaultDuration: "1",
                  placeholder: "કટ્સની સંખ્યા (દા.ત. 1, 2)",
                  unitNote: "મૂળ ભાવ: ₹1,851/કટ → 15% મુહૂર્ત ઑફર: ₹1,573/કટ",
                },
              ].map((svc) => {
                const isSelected = selectedServices[svc.id]?.selected ?? false;
                const durationVal = selectedServices[svc.id]?.durationInput ?? svc.defaultDuration;

                return (
                  <div
                    key={svc.id}
                    className={`p-4 rounded-2xl border-2 transition-all ${
                      isSelected
                        ? "border-[#6B2E4C] bg-amber-50/40 shadow-sm"
                        : "border-[#E5E5EA] bg-white hover:border-[#D1D1D6]"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div
                        onClick={() => toggleService(svc.id, svc.defaultDuration)}
                        className="cursor-pointer flex-1"
                      >
                        <div className="flex items-center space-x-2">
                          <span
                            className={`h-4 w-4 rounded border flex items-center justify-center text-2xs ${
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
                        <div className="w-36 shrink-0 space-y-1">
                          <label className="block text-2xs font-bold text-[#6B2E4C] uppercase text-right">
                            આઉટપુટ ટાઇમ / સંખ્યા *
                          </label>
                          <input
                            type="text"
                            value={durationVal}
                            onChange={(e) => updateDuration(svc.id, e.target.value)}
                            placeholder={svc.placeholder}
                            className="w-full px-2.5 py-1.5 rounded-xl border border-amber-400 bg-white font-mono font-bold text-xs text-[#6B2E4C] text-right focus:outline-none"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* ── Real-Time Festive Calculation Card ── */}
            <div className="p-5 rounded-2xl bg-gradient-to-br from-[#6B2E4C] to-[#45142E] text-white space-y-3 shadow-lg">
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
                  <span className="text-2xs text-white/70 block mt-0.5">(ટોકન એડવાન્સ)</span>
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

            <div className="flex justify-between pt-2">
              <button
                type="button"
                onClick={() => goToStep(1)}
                className="px-4 py-2 rounded-xl border border-[#D1D1D6] text-xs font-semibold"
              >
                ← પાછળ (તારીખ બદલો)
              </button>
              <button
                type="button"
                disabled={pricingSummary.items.length === 0}
                onClick={() => goToStep(3)}
                className="px-6 py-2.5 rounded-xl bg-[#6B2E4C] hover:bg-[#58243E] disabled:opacity-40 text-white font-bold text-xs shadow-md transition"
              >
                આગળ વધો: સ્ટુડિયો વિગતો ભરો →
              </button>
            </div>
          </div>
        )}

        {/* ── STEP 3: STUDIO & COUPLE DETAILS ── */}
        {currentStep === 3 && (
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#E5E5EA] shadow-xl space-y-6">
            <div className="border-b border-[#E5E5EA] pb-3">
              <h2 className="text-lg font-bold text-[#6B2E4C] flex items-center space-x-2">
                <FileText className="h-5 w-5 text-amber-600" />
                <span>પગલું ૩: સ્ટુડિયો અને ક્લાયન્ટ વિગતો</span>
              </h2>
              <p className="text-xs text-[#8E8E93]">
                સ્લોટ કન્ફર્મેશન અને ઇન્વોઇસ બિલિંગ માટે તમારી સત્તાવાર વિગત લખો.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#D1D1D6] text-xs focus:ring-2 focus:ring-[#6B2E4C] focus:outline-none"
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
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#D1D1D6] text-xs focus:ring-2 focus:ring-[#6B2E4C] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-2xs font-bold text-[#8E8E93] uppercase mb-1">
                  કપલનું નામ (Couple Names) *
                </label>
                <input
                  type="text"
                  required
                  value={coupleNames}
                  onChange={(e) => setCoupleNames(e.target.value)}
                  placeholder="દા.ત. Parth & Pooja"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#D1D1D6] text-xs font-semibold focus:ring-2 focus:ring-[#6B2E4C] focus:outline-none"
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
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#D1D1D6] font-mono font-bold text-xs focus:ring-2 focus:ring-[#6B2E4C] focus:outline-none"
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
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#D1D1D6] text-xs focus:ring-2 focus:ring-[#6B2E4C] focus:outline-none"
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
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#D1D1D6] text-xs focus:ring-2 focus:ring-[#6B2E4C] focus:outline-none"
                />
              </div>
            </div>

            {/* Terms & Conditions Agreement */}
            <div className="p-4 rounded-2xl bg-[#F8F7F4] border border-[#E5E5EA] space-y-2 text-2xs text-[#4A4A4C]">
              <span className="font-bold text-[#6B2E4C] uppercase block">
                📜 લાભ પાંચમ મુહૂર્ત નિયમો & શરતો (T&C):
              </span>
              <ul className="list-disc list-inside space-y-1">
                <li>આ ઑફર 14 નવેમ્બર 2026 રાત્રે 11:59 વાગ્યા સુધી જ માન્ય રહેશે.</li>
                <li>સ્લોટ લોક કરવા માટે પ્રોજેક્ટ દીઠ માત્ર ₹1,000 એડવાન્સ જમા કરાવવાના રહેશે (નોન-રિફંડેબલ ટોકન).</li>
                <li>બુક કરેલા સ્લોટથી ઓછામાં ઓછા ૩ થી ૫ દિવસ પહેલાં રૉ ફૂટેજ (SSD/HDD કુરિયર અથવા ડ્રાઇવ) પહોંચવી જરૂરી છે.</li>
                <li>૭૦-૮૦% વોટરમાર્કડ પ્રિવ્યુ Frame.io પર મંજૂર થયા પછી 4K માસ્ટર ફાઇલ ડિલિવરી વખતે બાકી રકમ ચૂકવવાની રહેશે.</li>
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

            <div className="flex justify-between pt-2">
              <button
                type="button"
                onClick={() => goToStep(2)}
                className="px-4 py-2 rounded-xl border border-[#D1D1D6] text-xs font-semibold"
              >
                ← પાછળ (સર્વિસ બદલો)
              </button>
              <button
                type="button"
                disabled={!studioName || !coupleNames || !whatsappNumber || !agreedToTerms}
                onClick={() => goToStep(4)}
                className="px-6 py-2.5 rounded-xl bg-[#6B2E4C] hover:bg-[#58243E] disabled:opacity-40 text-white font-bold text-xs shadow-md transition"
              >
                આગળ વધો: ₹1,000 પેમેન્ટ & સ્લોટ લોક →
              </button>
            </div>
          </div>
        )}

        {/* ── STEP 4: UPI QR CODE & WHATSAPP SCREENSHOT SUBMISSION ── */}
        {currentStep === 4 && (
          <div className="bg-white rounded-3xl p-6 sm:p-8 border-2 border-amber-400 shadow-2xl space-y-6">
            <div className="border-b border-[#E5E5EA] pb-3 text-center sm:text-left">
              <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-amber-100 text-amber-900 text-2xs font-extrabold mb-1">
                <span>🪔</span>
                <span>અંતિમ પગલું: ₹1,000 સ્લોટ લોક ટોકન પેમેન્ટ</span>
              </div>
              <h2 className="text-xl font-extrabold text-[#6B2E4C]">
                QR Code સ્કેન કરીને ₹1,000 પેમેન્ટ કરો અને સ્ક્રીનશૉટ મોકલો
              </h2>
              <p className="text-xs text-[#8E8E93]">
                નીચેના QR Code અથવા નંબર પર ₹1,000 પે કરીને સ્ક્રીનશૉટ <strong>+91 8866323567</strong> પર WhatsApp કરો.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
              {/* Official UPI QR Code Card */}
              <div className="p-6 rounded-3xl bg-gradient-to-b from-[#FDFBF7] to-white border-2 border-amber-300/80 shadow-md text-center space-y-3">
                <div className="text-xs font-extrabold text-[#6B2E4C] uppercase tracking-wider">
                  RSE Post Production House
                </div>

                {/* Real Scannable UPI QR SVG */}
                <div className="mx-auto w-52 h-52 p-3 bg-white rounded-2xl border-2 border-[#6B2E4C] shadow-inner flex items-center justify-center">
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(
                      `upi://pay?pa=8866323567@upi&pn=RSE%20Post%20Production&am=1000&cu=INR&tn=Labh%20Pancham%20Slot%20Token`
                    )}`}
                    alt="Scan UPI QR Code to pay ₹1000"
                    className="w-full h-full object-contain"
                  />
                </div>

                <div className="space-y-1">
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
              <div className="space-y-4">
                <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-900 space-y-2">
                  <span className="font-extrabold text-xs uppercase block text-[#6B2E4C]">
                    📋 પેમેન્ટ કર્યા પછી શું કરવું?
                  </span>
                  <div className="space-y-1.5 text-2xs leading-relaxed">
                    <p>
                      <strong>૧.</strong> ઉપર આપેલા QR Code પર <strong>₹1,000</strong> પે કરો.
                    </p>
                    <p>
                      <strong>૨.</strong> પેમેન્ટની રસીદ / સક્સેસ સ્ક્રીનનો <strong>સ્ક્રીનશૉટ</strong> લો.
                    </p>
                    <p>
                      <strong>૩.</strong> નીચે આપેલા લીલા બટન પર ક્લિક કરીને સ્ક્રીનશૉટ અમારા ઓફિશિયલ WhatsApp{" "}
                      <strong>+91 8866323567</strong> પર મોકલી આપો.
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
                      ? "સ્લોટ બુક થઈ રહ્યો છે..."
                      : "સ્લોટ બુકિંગ કન્ફર્મ કરો & રસીદ મેળવો →"}
                  </span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── STEP 5: SUCCESS / CONFIRMATION SCREEN ── */}
        {currentStep === 5 && confirmedBooking && (
          <div className="bg-white rounded-3xl p-8 sm:p-12 border-2 border-emerald-400 shadow-2xl text-center space-y-6 animate-fadeIn">
            <div className="h-16 w-16 bg-emerald-100 text-emerald-800 rounded-full flex items-center justify-center mx-auto text-2xl font-bold">
              ✓
            </div>

            <div className="space-y-2">
              <span className="text-2xs font-extrabold px-3 py-1 rounded-full bg-amber-100 text-amber-900 uppercase">
                🪔 લાભ પાંચમ મુહૂર્ત બુકિંગ કન્ફર્મ
              </span>
              <h2 className="text-2xl font-extrabold text-[#6B2E4C]">
                અભિનંદન! તમારો સ્લોટ સફળતાપૂર્વક રિઝર્વ થયો છે
              </h2>
              <p className="text-xs text-[#8E8E93] max-w-md mx-auto">
                તમારા પ્રોજેક્ટ માટે RSE સ્ટુડિયોમાં એડિટર અને કેલેન્ડર સ્લોટ ફાળવી દેવામાં આવ્યો છે.
              </p>
            </div>

            {/* Receipt Summary Card */}
            <div className="max-w-md mx-auto p-5 rounded-2xl bg-[#F8F7F4] border border-[#E5E5EA] text-left text-xs space-y-2">
              <div className="flex justify-between border-b border-[#E5E5EA] pb-1.5">
                <span className="text-[#8E8E93]">સત્તાવાર બુકિંગ કોડ:</span>
                <span className="font-mono font-extrabold text-[#6B2E4C]">
                  {confirmedBooking.code}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#8E8E93]">કપલ:</span>
                <span className="font-bold">{confirmedBooking.coupleNames}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#8E8E93]">સ્ટુડિયો:</span>
                <span className="font-bold">{confirmedBooking.studioOrClient}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#8E8E93]">સ્લોટ તારીખ:</span>
                <span className="font-mono font-bold">{confirmedBooking.slotDate}</span>
              </div>
              <div className="flex justify-between border-t border-[#E5E5EA] pt-1.5 text-amber-800 font-bold">
                <span>મુહૂર્ત ફાઇનલ કિંમત:</span>
                <span className="font-mono">₹{confirmedBooking.pricing?.totalAmount?.toLocaleString("en-IN")}</span>
              </div>
              <div className="flex justify-between text-emerald-800 font-bold">
                <span>સ્લોટ લોક એડવાન્સ:</span>
                <span className="font-mono">₹1,000 (ચૂકવેલ)</span>
              </div>
            </div>

            {/* Direct WhatsApp Action for Screenshot */}
            <div className="pt-2 max-w-md mx-auto space-y-3">
              <a
                href={getWhatsAppScreenshotUrl()}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center space-x-2 shadow-md transition"
              >
                <Phone className="h-4 w-4" />
                <span>પેમેન્ટ સ્ક્રીનશૉટ WhatsApp પર મોકલો (+91 8866323567)</span>
              </a>

              <Link
                href="/book"
                className="inline-block text-xs font-semibold text-[#8E8E93] hover:text-[#1C1C1E] underline pt-1"
              >
                બીજો સ્લોટ બુક કરો અથવા હોમપેજ પર જાઓ
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
