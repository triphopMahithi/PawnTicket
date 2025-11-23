import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trophy, Medal } from "lucide-react";
import { useEffect, useState } from "react";

const API_BASE = "http://localhost:3001";

interface TopCustomer {
  Customer_ID: string;
  first_name: string;
  last_name: string;
  ticketCount: number;
  phone?: string;
}

interface TopCustomersCardProps {
  customers: TopCustomer[];
  loading?: boolean;
  onSelectCustomer?: (customer: TopCustomer) => void;
}

export function TopCustomersCard({
  customers,
  loading,
  onSelectCustomer,
}: TopCustomersCardProps) {
  const getMedalIcon = (rank: number) => {
    if (rank === 1) return <Trophy className="h-5 w-5 text-yellow-500" />;
    if (rank === 2) return <Medal className="h-5 w-5 text-gray-400" />;
    if (rank === 3) return <Medal className="h-5 w-5 text-amber-600" />;
    return null;
  };

  const getRankBadgeVariant = (rank: number) => {
    if (rank <= 3) return "default";
    return "secondary";
  };

  return (
    <Card className="p-6">
      <div className="flex items-center gap-2 mb-4">
        <Trophy className="h-5 w-5 text-primary" />
        <h3 className="text-lg font-semibold">Top 3 ลูกค้าที่มีตั๋วมากที่สุด</h3>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-16 bg-muted animate-pulse rounded-lg" />
          ))}
        </div>
      ) : customers.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-8">
          ยังไม่มีข้อมูลลูกค้า
        </p>
      ) : (
        <div className="space-y-2">
          {customers.map((customer, index) => {
  const rank = index + 1;
  const fullName = `${customer.first_name} ${customer.last_name}`;

  return (
    <div
      key={customer.Customer_ID}  // ใช้ Customer_ID เป็น key
      onClick={() => onSelectCustomer?.(customer)}
      className={`flex items-center gap-4 p-4 rounded-lg border transition-all duration-200 ${
        onSelectCustomer ? "cursor-pointer hover:bg-accent/50 hover:shadow-md" : ""
      } ${rank <= 3 ? "bg-accent/20" : "bg-card"}`}
    >
      <div className="flex items-center gap-2 min-w-[60px]">
        {getMedalIcon(rank)}
        <Badge variant={getRankBadgeVariant(rank)} className="font-bold">
          #{rank}
        </Badge>
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-foreground truncate">{fullName}</p>
        {customer.phone && (
          <p className="text-xs text-muted-foreground">{customer.phone}</p>
        )}
      </div>
      <div className="text-right">
        <p className="text-2xl font-bold text-primary">{customer.ticketCount}</p>
        <p className="text-xs text-muted-foreground">ตั๋ว</p>
      </div>
    </div>
  );
})}

        </div>
      )}
    </Card>
  );
}
