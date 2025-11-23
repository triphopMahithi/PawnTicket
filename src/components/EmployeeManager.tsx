import { useEffect, useState, useMemo } from "react";
import {
  Pencil,
  Trash2,
  RefreshCw,
  PlusCircle,
  Search,
  Users,
  UserCheck,
  Shield,
  Crown,
  X,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";

type EmployeePosition = "STAFF" | "SUPERVISOR" | "MANAGER";

interface Employee {
  Staff_ID: number;
  first_name: string;
  last_name: string;
  phone_number: string;
  position: string;
}

const POSITION_CONFIG: Record<
  string,
  { label: string; color: string; icon: React.ReactNode }
> = {
  STAFF: {
    label: "พนักงาน",
    color: "bg-accent/10 text-accent border-accent/20",
    icon: <UserCheck className="h-3 w-3" />,
  },
  SUPERVISOR: {
    label: "หัวหน้าทีม",
    color: "bg-primary/10 text-primary border-primary/20",
    icon: <Shield className="h-3 w-3" />,
  },
  MANAGER: {
    label: "ผู้จัดการ",
    color: "bg-success/10 text-success border-success/20",
    icon: <Crown className="h-3 w-3" />,
  },
};

const API_BASE = "http://localhost:3001";

export function EmployeeManager() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(false);

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState("");
  const [filterPosition, setFilterPosition] = useState<string>("ALL");

  // Form state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [position, setPosition] = useState<EmployeePosition | "">("");

  // Delete state
  const [employeeToDelete, setEmployeeToDelete] = useState<Employee | null>(null);

  // Filtered employees
  const filteredEmployees = useMemo(() => {
    return employees.filter((emp) => {
      const matchesSearch =
        searchQuery === "" ||
        emp.first_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        emp.last_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        emp.phone_number.includes(searchQuery) ||
        emp.Staff_ID.toString().includes(searchQuery);

      const matchesPosition =
        filterPosition === "ALL" || emp.position === filterPosition;

      return matchesSearch && matchesPosition;
    });
  }, [employees, searchQuery, filterPosition]);

  // Statistics
  const stats = useMemo(() => {
    const total = employees.length;
    const byPosition = employees.reduce(
      (acc, emp) => {
        acc[emp.position] = (acc[emp.position] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

    return {
      total,
      staff: byPosition.STAFF || 0,
      supervisor: byPosition.SUPERVISOR || 0,
      manager: byPosition.MANAGER || 0,
    };
  }, [employees]);

  const fetchEmployees = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE}/api/employees`);
      if (!res.ok) {
        throw new Error("โหลดข้อมูลพนักงานไม่สำเร็จ");
      }

      const data = await res.json();

      let list: Employee[] = [];

      if (Array.isArray(data)) {
        list = data as Employee[];
      } else if (Array.isArray(data.employees)) {
        list = data.employees as Employee[];
      } else if (Array.isArray(data.items)) {
        list = data.items.map((it: any) => ({
          Staff_ID: Number(it.Staff_ID ?? it.id),
          first_name: it.first_name,
          last_name: it.last_name,
          phone_number: it.phone_number,
          position: it.position,
        }));
      } else {
        console.warn("รูปแบบข้อมูลที่ได้จาก /api/employees ไม่ตรงที่คาดไว้");
      }

      setEmployees(list);
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "เกิดข้อผิดพลาดในการโหลดข้อมูลพนักงาน");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, []);

  const resetForm = () => {
    setFirstName("");
    setLastName("");
    setPhoneNumber("");
    setPosition("");
    setEditingEmployee(null);
  };

  const handleOpenCreate = () => {
    resetForm();
    setIsFormOpen(true);
  };

  const handleOpenEdit = (emp: Employee) => {
    setEditingEmployee(emp);
    setFirstName(emp.first_name);
    setLastName(emp.last_name);
    setPhoneNumber(emp.phone_number);
    setPosition(emp.position.toUpperCase() as EmployeePosition);
    setIsFormOpen(true);
  };

  const validateForm = () => {
    if (!firstName.trim() || !lastName.trim() || !phoneNumber.trim() || !position) {
      toast.error("กรุณากรอกข้อมูลให้ครบทุกช่อง");
      return false;
    }
    if (phoneNumber.trim().length < 6) {
      toast.error("กรุณากรอกเบอร์โทรศัพท์ให้ถูกต้อง");
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    try {
      setIsSubmitting(true);

      const payload = {
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        phone_number: phoneNumber.trim(),
        position: position.toUpperCase(),
      };

      if (editingEmployee) {
        const res = await fetch(
          `${API_BASE}/api/employees/${editingEmployee.Staff_ID}`,
          {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          }
        );

        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.message || "แก้ไขข้อมูลพนักงานไม่สำเร็จ");
        }

        toast.success("✓ แก้ไขข้อมูลพนักงานเรียบร้อยแล้ว");
      } else {
        const res = await fetch(`${API_BASE}/api/employees`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.message || "เพิ่มข้อมูลพนักงานไม่สำเร็จ");
        }

        toast.success("✓ เพิ่มพนักงานใหม่เรียบร้อยแล้ว");
      }

      setIsFormOpen(false);
      resetForm();
      await fetchEmployees();
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "เกิดข้อผิดพลาดในการบันทึกข้อมูลพนักงาน");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!employeeToDelete) return;
    try {
      const id = employeeToDelete.Staff_ID;
      const res = await fetch(`${API_BASE}/api/employees/${id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || "ลบข้อมูลพนักงานไม่สำเร็จ");
      }

      toast.success("✓ ลบข้อมูลพนักงานเรียบร้อยแล้ว");
      setEmployeeToDelete(null);
      await fetchEmployees();
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "เกิดข้อผิดพลาดในการลบข้อมูลพนักงาน");
    }
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="space-y-1">
        <h1 className="text-3xl font-bold tracking-tight">จัดการพนักงาน</h1>
        <p className="text-muted-foreground">
          เพิ่ม แก้ไข และจัดการข้อมูลพนักงานในระบบ
        </p>
      </div>

      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="shadow-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">พนักงานทั้งหมด</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground mt-1">
              จำนวนพนักงานในระบบ
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">พนักงาน</CardTitle>
            <UserCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.staff}</div>
            <p className="text-xs text-muted-foreground mt-1">
              ตำแหน่ง Staff
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">หัวหน้าทีม</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.supervisor}</div>
            <p className="text-xs text-muted-foreground mt-1">
              ตำแหน่ง Supervisor
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">ผู้จัดการ</CardTitle>
            <Crown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.manager}</div>
            <p className="text-xs text-muted-foreground mt-1">
              ตำแหน่ง Manager
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Search & Filter */}
      <Card className="shadow-card">
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="ค้นหาชื่อ, นามสกุล, เบอร์โทร หรือรหัสพนักงาน..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-9"
              />
              {searchQuery && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
                  onClick={() => setSearchQuery("")}
                >
                  <X className="h-3.5 w-3.5" />
                </Button>
              )}
            </div>

            <Select value={filterPosition} onValueChange={setFilterPosition}>
              <SelectTrigger className="w-full sm:w-[200px]">
                <SelectValue placeholder="กรองตามตำแหน่ง" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">ทุกตำแหน่ง</SelectItem>
                <SelectItem value="STAFF">พนักงาน</SelectItem>
                <SelectItem value="SUPERVISOR">หัวหน้าทีม</SelectItem>
                <SelectItem value="MANAGER">ผู้จัดการ</SelectItem>
              </SelectContent>
            </Select>

            <div className="flex gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={fetchEmployees}
                disabled={loading}
              >
                <RefreshCw
                  className={cn("h-4 w-4", loading && "animate-spin")}
                />
              </Button>
              <Button onClick={handleOpenCreate} className="gap-2">
                <PlusCircle className="h-4 w-4" />
                <span className="hidden sm:inline">เพิ่มพนักงาน</span>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card className="shadow-card">
        <div className="rounded-lg overflow-hidden">
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow>
                <TableHead className="font-semibold">รหัส</TableHead>
                <TableHead className="font-semibold">ชื่อ-นามสกุล</TableHead>
                <TableHead className="font-semibold">เบอร์โทรศัพท์</TableHead>
                <TableHead className="font-semibold">ตำแหน่ง</TableHead>
                <TableHead className="text-right font-semibold">จัดการ</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-32 text-center">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
                      <p className="text-sm text-muted-foreground">
                        กำลังโหลดข้อมูล...
                      </p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : filteredEmployees.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-32 text-center">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Users className="h-8 w-8 text-muted-foreground/50" />
                      {searchQuery || filterPosition !== "ALL" ? (
                        <>
                          <p className="text-sm font-medium">
                            ไม่พบข้อมูลที่ค้นหา
                          </p>
                          <p className="text-xs text-muted-foreground">
                            ลองปรับเงื่อนไขการค้นหาหรือกรองใหม่
                          </p>
                        </>
                      ) : (
                        <>
                          <p className="text-sm font-medium">
                            ยังไม่มีข้อมูลพนักงาน
                          </p>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={handleOpenCreate}
                            className="mt-2"
                          >
                            <PlusCircle className="h-4 w-4 mr-2" />
                            เพิ่มพนักงานคนแรก
                          </Button>
                        </>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filteredEmployees.map((emp) => (
                  <TableRow key={emp.Staff_ID} className="group">
                    <TableCell className="font-mono text-sm">
                      #{emp.Staff_ID}
                    </TableCell>
                    <TableCell className="font-medium">
                      {emp.first_name} {emp.last_name}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {emp.phone_number}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={cn(
                          "gap-1.5",
                          POSITION_CONFIG[emp.position]?.color
                        )}
                      >
                        {POSITION_CONFIG[emp.position]?.icon}
                        {POSITION_CONFIG[emp.position]?.label ?? emp.position}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => handleOpenEdit(emp)}
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:text-destructive"
                          onClick={() => setEmployeeToDelete(emp)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </Card>

      {/* Form Dialog */}
      <Dialog
        open={isFormOpen}
        onOpenChange={(open) => {
          setIsFormOpen(open);
          if (!open) resetForm();
        }}
      >
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              {editingEmployee ? "แก้ไขข้อมูลพนักงาน" : "เพิ่มพนักงานใหม่"}
            </DialogTitle>
            <DialogDescription>
              {editingEmployee
                ? "แก้ไขข้อมูลพนักงานในระบบ กรุณาตรวจสอบข้อมูลให้ถูกต้อง"
                : "เพิ่มพนักงานใหม่เข้าสู่ระบบ กรุณากรอกข้อมูลให้ครบถ้วน"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="first_name">
                  ชื่อ <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="first_name"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="ระบุชื่อ"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="last_name">
                  นามสกุล <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="last_name"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="ระบุนามสกุล"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone_number">
                เบอร์โทรศัพท์ <span className="text-destructive">*</span>
              </Label>
              <Input
                id="phone_number"
                type="tel"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="เช่น 0891234567"
              />
            </div>

            <div className="space-y-2">
              <Label>
                ตำแหน่ง <span className="text-destructive">*</span>
              </Label>
              <Select
                value={position}
                onValueChange={(value: EmployeePosition) => setPosition(value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="เลือกตำแหน่ง" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="STAFF">
                    <div className="flex items-center gap-2">
                      <UserCheck className="h-4 w-4" />
                      พนักงาน (STAFF)
                    </div>
                  </SelectItem>
                  <SelectItem value="SUPERVISOR">
                    <div className="flex items-center gap-2">
                      <Shield className="h-4 w-4" />
                      หัวหน้าทีม (SUPERVISOR)
                    </div>
                  </SelectItem>
                  <SelectItem value="MANAGER">
                    <div className="flex items-center gap-2">
                      <Crown className="h-4 w-4" />
                      ผู้จัดการ (MANAGER)
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsFormOpen(false);
                resetForm();
              }}
              disabled={isSubmitting}
            >
              ยกเลิก
            </Button>
            <Button onClick={handleSubmit} disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  กำลังบันทึก...
                </>
              ) : editingEmployee ? (
                "บันทึกการแก้ไข"
              ) : (
                "เพิ่มพนักงาน"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <AlertDialog
        open={!!employeeToDelete}
        onOpenChange={(open) => {
          if (!open) setEmployeeToDelete(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>ยืนยันการลบพนักงาน</AlertDialogTitle>
            <AlertDialogDescription>
              คุณต้องการลบพนักงาน{" "}
              <span className="font-semibold text-foreground">
                {employeeToDelete?.first_name} {employeeToDelete?.last_name}
              </span>{" "}
              หรือไม่?
              <br />
              <span className="text-destructive">
                การลบนี้ไม่สามารถย้อนกลับได้ กรุณาตรวจสอบให้แน่ใจ
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>ยกเลิก</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={handleDelete}
            >
              ลบข้อมูล
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export default EmployeeManager;
