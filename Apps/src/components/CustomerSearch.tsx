import { useState } from "react";
import { Search, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

interface Customer {
  id: string;
  name: string;
  nationalId: string;
  phone: string;
}

const mockCustomers: Customer[] = [
  {
    id: "1",
    name: "สมชาย ใจดี",
    nationalId: "1234567890123",
    phone: "0812345678",
  },
  {
    id: "2",
    name: "สมหญิง รักสุข",
    nationalId: "9876543210987",
    phone: "0898765432",
  },
  {
    id: "3",
    name: "วิชัย เจริญสุข",
    nationalId: "5551234567890",
    phone: "0856789012",
  },
];

interface CustomerSearchProps {
  onSelect: (customer: Customer) => void;
  selectedCustomer: Customer | null;
}

export function CustomerSearch({
  onSelect,
  selectedCustomer,
}: CustomerSearchProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [newCustomer, setNewCustomer] = useState({
    name: "",
    nationalId: "",
    phone: "",
  });

  const filteredCustomers = mockCustomers.filter(
    (customer) =>
      customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      customer.nationalId.includes(searchQuery) ||
      customer.phone.includes(searchQuery)
  );

  const formatNationalId = (id: string) => {
    const cleaned = id.replace(/\D/g, "");
    if (cleaned.length <= 1) return cleaned;
    if (cleaned.length <= 5)
      return `${cleaned.slice(0, 1)}-${cleaned.slice(1)}`;
    if (cleaned.length <= 10)
      return `${cleaned.slice(0, 1)}-${cleaned.slice(1, 5)}-${cleaned.slice(5)}`;
    if (cleaned.length <= 12)
      return `${cleaned.slice(0, 1)}-${cleaned.slice(1, 5)}-${cleaned.slice(5, 10)}-${cleaned.slice(10)}`;
    return `${cleaned.slice(0, 1)}-${cleaned.slice(1, 5)}-${cleaned.slice(5, 10)}-${cleaned.slice(10, 12)}-${cleaned.slice(12, 13)}`;
  };

  const formatPhone = (phone: string) => {
    const cleaned = phone.replace(/\D/g, "");
    if (cleaned.startsWith("66")) {
      return `+${cleaned.slice(0, 2)} ${cleaned.slice(2, 3)} ${cleaned.slice(3, 7)} ${cleaned.slice(7)}`;
    }
    if (cleaned.length <= 3) return cleaned;
    if (cleaned.length <= 6)
      return `${cleaned.slice(0, 3)}-${cleaned.slice(3)}`;
    return `${cleaned.slice(0, 3)}-${cleaned.slice(3, 6)}-${cleaned.slice(6, 10)}`;
  };

  const handleCreateCustomer = () => {
    if (!newCustomer.name || !newCustomer.nationalId || !newCustomer.phone) {
      toast.error("กรุณากรอกข้อมูลให้ครบถ้วน");
      return;
    }

    const customer: Customer = {
      id: Date.now().toString(),
      ...newCustomer,
    };

    onSelect(customer);
    setIsOpen(false);
    setNewCustomer({ name: "", nationalId: "", phone: "" });
    toast.success("เพิ่มข้อมูลลูกค้าสำเร็จ");
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="ค้นหาด้วยชื่อ, เลขบัตรประชาชน, หรือเบอร์โทร"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button variant="outline">
              <Plus className="w-4 h-4 mr-2" />
              สร้างใหม่
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>เพิ่มข้อมูลลูกค้าใหม่</DialogTitle>
              <DialogDescription>
                กรอกข้อมูลลูกค้าให้ครบถ้วน
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div>
                <Label htmlFor="name">
                  ชื่อ-นามสกุล <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="name"
                  placeholder="สมชาย ใจดี"
                  value={newCustomer.name}
                  onChange={(e) =>
                    setNewCustomer({ ...newCustomer, name: e.target.value })
                  }
                />
              </div>
              <div>
                <Label htmlFor="nationalId">
                  เลขบัตรประชาชน <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="nationalId"
                  placeholder="1-2345-67890-12-3"
                  value={formatNationalId(newCustomer.nationalId)}
                  onChange={(e) =>
                    setNewCustomer({
                      ...newCustomer,
                      nationalId: e.target.value.replace(/\D/g, ""),
                    })
                  }
                  maxLength={17}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  13 หลัก
                </p>
              </div>
              <div>
                <Label htmlFor="phone">
                  เบอร์โทรศัพท์ <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="phone"
                  placeholder="081-234-5678"
                  value={formatPhone(newCustomer.phone)}
                  onChange={(e) =>
                    setNewCustomer({
                      ...newCustomer,
                      phone: e.target.value.replace(/\D/g, ""),
                    })
                  }
                  maxLength={12}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  10 หลัก (เริ่มต้นด้วย 0)
                </p>
              </div>
              <Button onClick={handleCreateCustomer} className="w-full">
                บันทึก
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {searchQuery && (
        <div className="border rounded-lg divide-y max-h-60 overflow-y-auto">
          {filteredCustomers.length === 0 ? (
            <div className="p-4 text-center text-muted-foreground">
              ไม่พบข้อมูลลูกค้า
            </div>
          ) : (
            filteredCustomers.map((customer) => (
              <button
                key={customer.id}
                onClick={() => {
                  onSelect(customer);
                  setSearchQuery("");
                  toast.success(`เลือกลูกค้า: ${customer.name}`);
                }}
                className="w-full p-3 text-left hover:bg-muted transition-colors"
              >
                <p className="font-medium">{customer.name}</p>
                <p className="text-sm text-muted-foreground">
                  {formatNationalId(customer.nationalId)} | {formatPhone(customer.phone)}
                </p>
              </button>
            ))
          )}
        </div>
      )}

      {selectedCustomer && (
        <div className="p-4 bg-card rounded-lg border">
          <p className="text-sm text-muted-foreground mb-1">ลูกค้าที่เลือก</p>
          <p className="font-semibold">{selectedCustomer.name}</p>
          <p className="text-sm text-muted-foreground">
            {formatNationalId(selectedCustomer.nationalId)}
          </p>
          <p className="text-sm text-muted-foreground">
            {formatPhone(selectedCustomer.phone)}
          </p>
        </div>
      )}
    </div>
  );
}
