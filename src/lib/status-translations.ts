// Status translation maps for Thai language
export const CONTRACT_STATUS_TH: Record<string, string> = {
  ACTIVE: "ใช้งานอยู่",
  ROLLED_OVER: "ต่ออายุแล้ว",
  CANCELLED: "ยกเลิก",
  EXPIRED: "หมดอายุ",
  REDEEMED: "ไถ่ถอนแล้ว",
  CLOSED: "ปิดแล้ว",
};

export const ITEM_STATUS_TH: Record<string, string> = {
  IN_STORAGE: "เก็บในคลัง",
  REDEEMED: "ไถ่ถอนแล้ว",
  DISPOSED: "จำหน่ายแล้ว",
  LOST: "สูญหาย",
  DAMAGED: "ชำรุด",
  PAWNED: "จำนำอยู่",
};

export const PAYMENT_TYPE_TH: Record<string, string> = {
  INTEREST: "ดอกเบี้ย",
  PRINCIPAL: "เงินต้น",
  FULL: "ชำระเต็มจำนวน",
  PARTIAL: "ชำระบางส่วน",
};

export const KYC_STATUS_TH: Record<string, string> = {
  VERIFIED: "ยืนยันแล้ว",
  PENDING: "รอยืนยัน",
  REJECTED: "ปฏิเสธ",
  NOT_VERIFIED: "ยังไม่ยืนยัน",
};

export const SALE_METHOD_TH: Record<string, string> = {
  AUCTION: "ประมูล",
  DIRECT_SALE: "ขายตรง",
  ONLINE: "ขายออนไลน์",
};

// Helper function to get translated status with fallback
export const getStatusText = (
  status: string | undefined | null,
  map: Record<string, string>
): string => {
  if (!status) return "-";
  return map[status] || status;
};

// Color classes for contract status
export const getContractStatusColor = (status: string): string => {
  switch (status) {
    case "ACTIVE":
      return "text-accent";
    case "ROLLED_OVER":
      return "text-yellow-600";
    case "CANCELLED":
      return "text-destructive";
    case "EXPIRED":
      return "text-muted-foreground";
    case "REDEEMED":
      return "text-primary";
    case "CLOSED":
      return "text-muted-foreground";
    default:
      return "text-foreground";
  }
};

// Badge variant for contract status
export const getContractStatusVariant = (
  status: string
): "default" | "secondary" | "destructive" | "outline" => {
  switch (status) {
    case "ACTIVE":
      return "default";
    case "ROLLED_OVER":
      return "secondary";
    case "CANCELLED":
      return "destructive";
    case "EXPIRED":
      return "outline";
    case "REDEEMED":
      return "default";
    default:
      return "secondary";
  }
};

// Color classes for item status
export const getItemStatusColor = (status: string): string => {
  switch (status) {
    case "IN_STORAGE":
    case "PAWNED":
      return "text-primary";
    case "REDEEMED":
      return "text-accent";
    case "DISPOSED":
      return "text-muted-foreground";
    case "LOST":
    case "DAMAGED":
      return "text-destructive";
    default:
      return "text-foreground";
  }
};