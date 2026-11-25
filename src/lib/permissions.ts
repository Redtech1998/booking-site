import { Role, StaffMember, StaffPermissions } from "@/types";

export const FULL_ADMIN_PERMISSIONS: StaffPermissions = {
  canViewAllBookings: true,
  canCreateBooking: true,
  canEditBooking: true,
  canDeleteBooking: true,
  canViewPricingAndInvoices: true,
  canViewClientContacts: true,
  canViewClientsDirectory: true,
  canManageStaffAndSalary: true,
  canManageSettings: true,
};

export const EDITOR_DEFAULT_PERMISSIONS: StaffPermissions = {
  canViewAllBookings: false,
  canCreateBooking: false,
  canEditBooking: false,
  canDeleteBooking: false,
  canViewPricingAndInvoices: false,
  canViewClientContacts: false,
  canViewClientsDirectory: false,
  canManageStaffAndSalary: false,
  canManageSettings: false,
};

export function getRoleDefaultPermissions(role: Role): StaffPermissions {
  switch (role) {
    case "admin":
      return { ...FULL_ADMIN_PERMISSIONS };
    case "accountant":
      return {
        ...EDITOR_DEFAULT_PERMISSIONS,
        canViewAllBookings: true,
        canViewPricingAndInvoices: true,
        canViewClientContacts: true,
      };
    case "outreach":
      return {
        ...EDITOR_DEFAULT_PERMISSIONS,
        canViewAllBookings: true,
        canCreateBooking: true,
        canEditBooking: true,
        canViewClientContacts: true,
        canViewClientsDirectory: true,
      };
    case "social":
    case "editor":
    default:
      return { ...EDITOR_DEFAULT_PERMISSIONS };
  }
}

export function getEffectivePermissions(member: StaffMember | null | undefined): StaffPermissions {
  if (!member || !member.isActive) {
    return { ...EDITOR_DEFAULT_PERMISSIONS };
  }
  // Primary Super Admin (Keyur Rao / isSuperAdmin) always retains master control
  if (member.isSuperAdmin || member.id === "s1") {
    return { ...FULL_ADMIN_PERMISSIONS };
  }
  const base = getRoleDefaultPermissions(member.role);
  return {
    ...base,
    ...(member.permissions || {}),
  };
}

export function isSuperAdminUser(member: StaffMember | null | undefined): boolean {
  if (!member) return false;
  return Boolean(member.isSuperAdmin || member.id === "s1");
}

export const PERMISSION_LABELS: {
  key: keyof StaffPermissions;
  label: string;
  hint: string;
}[] = [
  {
    key: "canViewAllBookings",
    label: "બધા પ્રોજેક્ટ્સ & સ્લોટ્સ જોઈ શકે",
    hint: "બંધ રાખો તો ફક્ત પોતાને સોંપેલા પ્રોજેક્ટ્સ જ દેખાશે",
  },
  {
    key: "canCreateBooking",
    label: "નવું સ્લોટ બુકિંગ ઉમેરી શકે",
    hint: "+ નવું બુકિંગ ઉમેરો બટન અને ફોર્મ એક્સેસ",
  },
  {
    key: "canEditBooking",
    label: "પ્રોજેક્ટ વિગતો એડિટ & તારીખ બદલી શકે",
    hint: "એડિટર અસાઇન, ડિલિવરી તારીખ અને રિવિઝન એડિટ",
  },
  {
    key: "canDeleteBooking",
    label: "પ્રોજેક્ટ ડિલીટ કરી શકે",
    hint: "સાવચેતી: કાયમ માટે બુકિંગ હટાવવાનો પાવર",
  },
  {
    key: "canViewPricingAndInvoices",
    label: "ભાવ, પેમેન્ટ અને ઇન્વોઇસ/બિલ જોઈ શકે",
    hint: "બંધ રાખો તો ₹ રકમ, એડવાન્સ અને બિલિંગ હાઇડ રહેશે",
  },
  {
    key: "canViewClientContacts",
    label: "ક્લાયન્ટનો ફોન નંબર & WhatsApp જોઈ શકે",
    hint: "બંધ રાખો તો માત્ર સ્ટુડિયોનું નામ દેખાશે, નંબર નહીં",
  },
  {
    key: "canViewClientsDirectory",
    label: "ક્લાયન્ટ્સ ડિરેક્ટરી જોઈ શકે",
    hint: "બધા ફોટોગ્રાફર્સ અને તેમના WhatsApp ગ્રુપ લિસ્ટ",
  },
  {
    key: "canManageStaffAndSalary",
    label: "સ્ટાફ, સેલેરી, રજા મંજૂરી & પરમિશન કંટ્રોલ",
    hint: "ટીમ મેનેજમેન્ટ, પે-સ્લિપ અને રજા મંજૂર/અસ્વીકાર",
  },
  {
    key: "canManageSettings",
    label: "સ્ટુડિયો સેટિંગ્સ, હોલિડે, ભાવ & ડેટાબેઝ",
    hint: "પેકેજ રેટ, સ્ટુડિયો રજાઓ અને MongoDB સેટિંગ્સ",
  },
];
