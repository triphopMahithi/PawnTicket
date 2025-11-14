// src/pages/History.tsx
import { useState } from "react";
import { Button } from "../components/ui/button";
import { useNavigate } from "react-router-dom";

interface HistoryItem {
    ticket_ID: string;
    first_name: string;
    last_name: string;
    customer_ID: string;
    contract_date: string;
    loan_amount: number;
    interest_rate: number;
    due_date: string;
    notice_date: string;
    contract_status: "ACTIVE" | "ROLLED_OVER" | "CANCELLED" | "EXPIRED";
    staff_ID: string;
    item_ID: string;
}

interface CustomerInfo {
    customer_ID: string;
    first_name: string;
    last_name: string;
    national_ID: string;
    date_of_birth: string;
    address: string;
    phone_number: string;
    kyc_status: "PENDING" | "PASSED" | "FAILED" | "REJECTED";
    contract_status: "ACTIVE" | "ROLLED_OVER" | "CANCELLED" | "EXPIRED";
}
interface EmployeeInfo {
    Staff_ID: string;
    first_name: string;
    last_name: string;
    phone_number: string;
    position: "STAFF" | "SUPERVISOR" | "MANAGER";
}

export default function History() {
    const navigate = useNavigate();
    const [search, setSearch] = useState("");
    const [editTicket, setEditTicket] = useState<HistoryItem | null>(null);
    const [viewCustomer, setViewCustomer] = useState<CustomerInfo | null>(null);
    const [employeeSearch, setEmployeeSearch] = useState("");
    const [editEmployee, setEditEmployee] = useState<EmployeeInfo | null>(null); 
    const [isAddingEmployee, setIsAddingEmployee] = useState(false); 
    const [newEmployee, setNewEmployee] = useState({ // (ฟอร์มเพิ่ม)
        first_name: "",
        last_name: "",
        phone_number: "",
        position: "STAFF" as EmployeeInfo["position"],
    });

    const [historyData, setHistoryData] = useState<HistoryItem[]>([
        {
            ticket_ID: "T001",
            first_name: "INK",
            last_name: "Dekab",
            customer_ID: "C001",
            contract_date: "2025-01-01",
            loan_amount: 10000,
            interest_rate: 5.5,
            due_date: "2025-12-31",
            notice_date: "2025-12-01",
            contract_status: "ACTIVE",
            staff_ID: "S001",
            item_ID: "I001",
        },
        {
            ticket_ID: "T002",
            first_name: "Nam",
            last_name: "Maka",
            customer_ID: "C002",
            contract_date: "2025-02-15",
            loan_amount: 5000,
            interest_rate: 6.0,
            due_date: "2025-08-15",
            notice_date: "2025-08-01",
            contract_status: "ROLLED_OVER",
            staff_ID: "S002",
            item_ID: "I002",
        },
    ]);

    // mock customer data
    const customerData: CustomerInfo[] = [
        {
            customer_ID: "C001",
            first_name: "INK",
            last_name: "Dekab",
            national_ID: "1234567890123",
            date_of_birth: "2000-05-10",
            address: "123 Bangkok Road, Thailand",
            phone_number: "0812345678",
            kyc_status: "PASSED",
            contract_status: "ACTIVE",
        },
        {
            customer_ID: "C002",
            first_name: "Nam",
            last_name: "Maka",
            national_ID: "9876543210987",
            date_of_birth: "1998-10-20",
            address: "45 Chiang Mai Street, Thailand",
            phone_number: "0898765432",
            kyc_status: "PENDING",
            contract_status: "ROLLED_OVER",
        },
    ];

    
    const [employeeData, setEmployeeData] = useState<EmployeeInfo[]>([
        {
            Staff_ID: "S001",
            first_name: "Ploy",
            last_name: "Sai",
            phone_number: "0881112222",
            position: "STAFF",
        },
        {
            Staff_ID: "S002",
            first_name: "Max",
            last_name: "Well",
            phone_number: "0883334444",
            position: "SUPERVISOR",
        },
        {
            Staff_ID: "S003",
            first_name: "Boss",
            last_name: "Man",
            phone_number: "0885556666",
            position: "MANAGER",
        },
        {
            Staff_ID: "S004",
            first_name: "ink",
            last_name: "eng",
            phone_number: "0881112229",
            position: "STAFF",
        },
        {
            Staff_ID: "S005",
            first_name: "flim",
            last_name: "kub",
            phone_number: "088111229",
            position: "STAFF",
        },
    ]);

    const filteredData = historyData.filter((item) =>
        item.first_name.toLowerCase().includes(search.toLowerCase())
    );
    const filteredEmployees = employeeData.filter((employee) =>
        employee.first_name.toLowerCase().includes(employeeSearch.toLowerCase()) ||
        employee.last_name.toLowerCase().includes(employeeSearch.toLowerCase())
    );
    function getStatusColor(status: string) {
        switch (status) {
            case "ACTIVE":
            case "PASSED":
                return "text-green-600 font-semibold";
            case "ROLLED_OVER":
            case "PENDING":
                return "text-yellow-600 font-semibold";
            case "CANCELLED":
            case "FAILED":
                return "text-red-600 font-semibold";
            case "EXPIRED":
            case "REJECTED":
                return "text-gray-500 font-semibold";
            default:
                return "text-gray-700";
        }
    }

    const handleSaveTicket = () => {
        if (!editTicket) return;
        const updated = historyData.map((t) =>
            t.ticket_ID === editTicket.ticket_ID ? editTicket : t
        );
        setHistoryData(updated);
        setEditTicket(null);
    };

    const handleSaveCustomer = () => {
        setViewCustomer(null);
    };
    const handleSaveEmployee = () => {
        if (!editEmployee) return;
        const updated = employeeData.map((emp) =>
            emp.Staff_ID === editEmployee.Staff_ID ? editEmployee : emp
        );
        setEmployeeData(updated);
        setEditEmployee(null);
    };

    const handleSaveNewEmployee = () => {
        if (!newEmployee.first_name || !newEmployee.last_name) {
            alert("Please enter the first and last name");
            return;
        }
        const newStaffId = "S" + (employeeData.length + 1).toString().padStart(3, '0');
        
        const employeeToAdd: EmployeeInfo = {
            Staff_ID: newStaffId,
            ...newEmployee,
        };

        setEmployeeData([...employeeData, employeeToAdd]);
        setIsAddingEmployee(false);
        setNewEmployee({
            first_name: "",
            last_name: "",
            phone_number: "",
            position: "STAFF",
        });
    };
    const handleDeleteEmployee = (staffId: string) => {
        if (window.confirm("Are you certain that you want to delete this employee?")) {
            const updated = employeeData.filter((emp) => emp.Staff_ID !== staffId);
            setEmployeeData(updated);
            setEditEmployee(null);
        }
    };
    return (
        <div className="p-6 bg-gray-100 min-h-screen">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-gray-800">History</h1>
                <Button onClick={() => navigate("/")}>
                    Back
                </Button>
            </div>



            <input
                type="text"
                placeholder="Search by first name"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="mb-6 p-3 rounded-lg border border-gray-300 w-full max-w-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />

            {filteredData.length === 0 ? (
                <p className="text-gray-500">No results found.</p>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                    {filteredData.map((item) => (
                        <div
                            key={item.ticket_ID}
                            className="bg-white rounded-xl shadow-lg p-5 hover:shadow-xl transition-all duration-200"
                        >
                            <p
                                className="text-blue-600 text-sm font-semibold cursor-pointer hover:underline"
                                onClick={() => setEditTicket({ ...item })}
                            >
                                Ticket ID: {item.ticket_ID}
                            </p>
                            <p className="text-gray-900 font-semibold text-lg mb-1">
                                {item.first_name} {item.last_name}
                            </p>
                            <p
                                className="text-gray-500 text-sm cursor-pointer hover:text-blue-600"
                                onClick={() =>
                                    setViewCustomer(
                                        customerData.find((c) => c.customer_ID === item.customer_ID) || null
                                    )
                                }
                            >
                                Customer ID: {item.customer_ID}
                            </p>
                        </div>
                    ))}
                </div>
            )}
                <div className="mt-10 p-6 bg-white rounded-xl shadow-lg">
                
                {/* ปุ่ม Add พนักงาน */}
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-2xl font-bold text-gray-800">Employees</h2>
                    <Button 
                        className="bg-green-600 hover:bg-green-700 text-white" 
                        onClick={() => setIsAddingEmployee(true)} // ❇️
                    >
                        + Add Employee
                    </Button>
                </div>

                {/* ค้นหาพนักงาน */}
                <input
                    type="text"
                    placeholder="Search by employee name"
                    value={employeeSearch} 
                    onChange={(e) => setEmployeeSearch(e.target.value)} 
                    className="mb-6 p-3 rounded-lg border border-gray-300 w-full max-w-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                />

                {/* การ์ดพนักงาน (ตามที่ "เอง" ขอ) */}
                {filteredEmployees.length === 0 ? ( 
                    <p className="text-gray-500">No employees found.</p>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                        {filteredEmployees.map((employee) => ( 
                            <div
                                key={employee.Staff_ID}
                                className="bg-gray-50 rounded-xl shadow-md p-5"
                            >
                                {/* Staff ID สีฟ้า คลิกได้ */}
                                <p 
                                    className="text-blue-600 text-sm font-semibold cursor-pointer hover:underline"
                                    onClick={() => setEditEmployee({ ...employee })} // 🟪
                                >
                                    Staff ID: {employee.Staff_ID}
                                </p>
                                {/* ชื่อ */}
                                <p className="text-gray-900 font-semibold text-lg mb-1">
                                    {employee.first_name} {employee.last_name}
                                </p>
                            </div>
                        ))}
                    </div>
                )}
            </div>
            {/* === MODALS === */}

            {/* 🟦 Modal: Ticket Editable */}
            {editTicket && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6 relative">
                        <button
                            className="absolute top-4 right-4 text-gray-400 hover:text-gray-800 text-xl font-bold"
                            onClick={() => setEditTicket(null)}
                        >
                            ×
                        </button>
                        <h2 className="text-2xl font-bold text-blue-600 mb-4">
                            Edit Ticket
                        </h2>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {/* Editable */}
                            <div>
                                <p className="font-medium">First Name</p>
                                <input
                                    type="text"
                                    value={editTicket.first_name}
                                    onChange={(e) =>
                                        setEditTicket({ ...editTicket, first_name: e.target.value })
                                    }
                                    className="border p-2 rounded w-full"
                                />
                            </div>
                            <div>
                                <p className="font-medium">Last Name</p>
                                <input
                                    type="text"
                                    value={editTicket.last_name}
                                    onChange={(e) =>
                                        setEditTicket({ ...editTicket, last_name: e.target.value })
                                    }
                                    className="border p-2 rounded w-full"
                                />
                            </div>
                            <div>
                                <p className="font-medium">Loan Amount (฿)</p>
                                <input
                                    type="number"
                                    value={editTicket.loan_amount}
                                    onChange={(e) =>
                                        setEditTicket({
                                            ...editTicket,
                                            loan_amount: parseFloat(e.target.value),
                                        })
                                    }
                                    className="border p-2 rounded w-full"
                                />
                            </div>
                            <div>
                                <p className="font-medium">Contract Status</p>
                                <select
                                    value={editTicket.contract_status}
                                    onChange={(e) =>
                                        setEditTicket({
                                            ...editTicket,
                                            contract_status:
                                                e.target.value as HistoryItem["contract_status"],
                                        })
                                    }
                                    className={`border p-2 rounded w-full ${getStatusColor(
                                        editTicket.contract_status
                                    )}`}
                                >
                                    <option value="ACTIVE">ACTIVE</option>
                                    <option value="ROLLED_OVER">ROLLED_OVER</option>
                                    <option value="CANCELLED">CANCELLED</option>
                                    <option value="EXPIRED">EXPIRED</option>
                                </select>
                            </div>

                            {/* Read-only */}
                            <div>
                                <p className="font-medium">Ticket ID</p>
                                <input
                                    readOnly
                                    value={editTicket.ticket_ID}
                                    className="border p-2 rounded w-full bg-gray-100"
                                />
                            </div>
                            <div>
                                <p className="font-medium">Customer ID</p>
                                <input
                                    readOnly
                                    value={editTicket.customer_ID}
                                    className="border p-2 rounded w-full bg-gray-100"
                                />
                            </div>
                        </div>

                        <div className="mt-5 flex justify-end gap-3">
                            <button
                                className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
                                onClick={() => setEditTicket(null)}
                            >
                                Cancel
                            </button>
                            <button
                                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                                onClick={handleSaveTicket}
                            >
                                Save
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* 🟩 Modal: Customer Editable */}
            {viewCustomer && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6 relative">
                        <button
                            className="absolute top-4 right-4 text-gray-400 hover:text-gray-800 text-xl font-bold"
                            onClick={() => setViewCustomer(null)}
                        >
                            ×
                        </button>
                        <h2 className="text-2xl font-bold text-green-600 mb-4">
                            Customer Details
                        </h2>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {/* Editable fields */}
                            <div>
                                <p className="font-medium">First Name</p>
                                <input
                                    type="text"
                                    value={viewCustomer.first_name}
                                    onChange={(e) =>
                                        setViewCustomer({
                                            ...viewCustomer,
                                            first_name: e.target.value,
                                        })
                                    }
                                    className="border p-2 rounded w-full"
                                />
                            </div>
                            <div>
                                <p className="font-medium">Last Name</p>
                                <input
                                    type="text"
                                    value={viewCustomer.last_name}
                                    onChange={(e) =>
                                        setViewCustomer({
                                            ...viewCustomer,
                                            last_name: e.target.value,
                                        })
                                    }
                                    className="border p-2 rounded w-full"
                                />
                            </div>
                            <div className="col-span-2">
                                <p className="font-medium">Address</p>
                                <textarea
                                    value={viewCustomer.address}
                                    onChange={(e) =>
                                        setViewCustomer({
                                            ...viewCustomer,
                                            address: e.target.value,
                                        })
                                    }
                                    className="border p-2 rounded w-full"
                                />
                            </div>
                            <div>
                                <p className="font-medium">Phone Number</p>
                                <input
                                    type="text"
                                    value={viewCustomer.phone_number}
                                    onChange={(e) =>
                                        setViewCustomer({
                                            ...viewCustomer,
                                            phone_number: e.target.value,
                                        })
                                    }
                                    className="border p-2 rounded w-full"
                                />
                            </div>
                            <div>
                                <p className="font-medium">KYC Status</p>
                                <select
                                    value={viewCustomer.kyc_status}
                                    onChange={(e) =>
                                        setViewCustomer({
                                            ...viewCustomer,
                                            kyc_status:
                                                e.target.value as CustomerInfo["kyc_status"],
                                        })
                                    }
                                    className={`border p-2 rounded w-full ${getStatusColor(
                                        viewCustomer.kyc_status
                                    )}`}
                                >
                                    <option value="PENDING">PENDING</option>
                                    <option value="PASSED">PASSED</option>
                                    <option value="FAILED">FAILED</option>
                                    <option value="REJECTED">REJECTED</option>
                                </select>
                            </div>

                            {/* Read-only */}
                            <div>
                                <p className="font-medium">Customer ID</p>
                                <input
                                    readOnly
                                    value={viewCustomer.customer_ID}
                                    className="border p-2 rounded w-full bg-gray-100"
                                />
                            </div>
                            <div>
                                <p className="font-medium">National ID</p>
                                <input
                                    readOnly
                                    value={viewCustomer.national_ID}
                                    className="border p-2 rounded w-full bg-gray-100"
                                />
                            </div>
                            <div>
                                <p className="font-medium">Date of Birth</p>
                                <input
                                    type="date"
                                    readOnly
                                    value={viewCustomer.date_of_birth}
                                    className="border p-2 rounded w-full bg-gray-100"
                                />
                            </div>
                        </div>

                        <div className="mt-5 flex justify-end gap-3">
                            <button
                                className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
                                onClick={() => setViewCustomer(null)}
                            >
                                Cancel
                            </button>
                            <button
                                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                                onClick={handleSaveCustomer}
                            >
                                Save
                            </button>
                        </div>
                    </div>
                </div>
            )}
       {editEmployee && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6 relative">
                        <button
                            className="absolute top-4 right-4 text-gray-400 hover:text-gray-800 text-xl font-bold"
                            onClick={() => setEditEmployee(null)}
                        >
                            ×
                        </button>
                        <h2 className="text-2xl font-bold text-green-600 mb-4">
                            Edit Employee Details
                        </h2>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            
                            {/* --- Editable fields (ตามที่ "เอง" ขอ) --- */}
                            <div>
                                <p className="font-medium">Phone Number</p>
                                <input
                                    type="text"
                                    value={editEmployee.phone_number}
                                    onChange={(e) =>
                                        setEditEmployee({ ...editEmployee, phone_number: e.target.value })
                                    }
                                    className="border p-2 rounded w-full"
                                />
                            </div>
                            <div>
                                <p className="font-medium">Position</p>
                                <select
                                    value={editEmployee.position}
                                    onChange={(e) =>
                                        setEditEmployee({
                                            ...editEmployee,
                                            position: e.target.value as EmployeeInfo["position"],
                                        })
                                    }
                                    className="border p-2 rounded w-full"
                                >
                                    <option value="STAFF">STAFF</option>
                                    <option value="SUPERVISOR">SUPERVISOR</option>
                                    <option value="MANAGER">MANAGER</option>
                                </select>
                            </div>

                          {/* --- Editable fields --- */}
                            <div>
                                <p className="font-medium">First Name</p>
                                <input
                                    type="text"
                                    value={editEmployee.first_name}
                                    onChange={(e) =>
                                        setEditEmployee({ ...editEmployee, first_name: e.target.value })
                                    }
                                    className="border p-2 rounded w-full"
                                />
                            </div>
                            <div>
                                <p className="font-medium">Last Name</p>
                                <input
                                    type="text"
                                    value={editEmployee.last_name}
                                    onChange={(e) =>
                                        setEditEmployee({ ...editEmployee, last_name: e.target.value })
                                    }
                                    className="border p-2 rounded w-full"
                                />
                            </div>
                            <div className="col-span-2">
                                <p className="font-medium">Staff ID</p>
                                <input readOnly value={editEmployee.Staff_ID} className="border p-2 rounded w-full bg-green-100" />
                            </div>
                        </div>

                        {/* --- Buttons (Delete, Cancel, Save) --- */}
                        <div className="mt-5 flex justify-between gap-3">
                            <button
                                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                                onClick={() => handleDeleteEmployee(editEmployee.Staff_ID)} // 🟥
                            >
                                Delete Employee
                            </button>
                            <div className="flex gap-3">
                                <button
                                    className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
                                    onClick={() => setEditEmployee(null)}
                                >
                                    Cancel
                                </button>
                                <button
                                    className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                                    onClick={handleSaveEmployee}
                                >
                                    Save Changes
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ❇️ (ใหม่) Modal: Add Employee */}
            {isAddingEmployee && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6 relative">
                        <button
                            className="absolute top-4 right-4 text-gray-400 hover:text-gray-800 text-xl font-bold"
                            onClick={() => setIsAddingEmployee(false)}
                        >
                            ×
                        </button>
                        <h2 className="text-2xl font-bold text-green-600 mb-4">
                            Add New Employee
                        </h2>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <p className="font-medium">First Name</p>
                                <input
                                    type="text"
                                    placeholder="e.g. Somchai"
                                    value={newEmployee.first_name}
                                    onChange={(e) => setNewEmployee({ ...newEmployee, first_name: e.target.value })}
                                    className="border p-2 rounded w-full"
                                />
                            </div>
                            <div>
                                <p className="font-medium">Last Name</p>
                                <input
                                    type="text"
                                    placeholder="e.g. Jaidee"
                                    value={newEmployee.last_name}
                                    onChange={(e) => setNewEmployee({ ...newEmployee, last_name: e.target.value })}
                                    className="border p-2 rounded w-full"
                                />
                            </div>
                            <div>
                                <p className="font-medium">Phone Number</p>
                                <input
                                    type="text"
                                    placeholder="e.g. 0812345678"
                                    value={newEmployee.phone_number}
                                    onChange={(e) => setNewEmployee({ ...newEmployee, phone_number: e.target.value })}
                                    className="border p-2 rounded w-full"
                                />
                            </div>
                            <div>
                                <p className="font-medium">Position</p>
                                <select
                                    value={newEmployee.position}
                                    onChange={(e) =>
                                        setNewEmployee({
                                            ...newEmployee,
                                            position: e.target.value as EmployeeInfo["position"],
                                        })
                                    }
                                    className="border p-2 rounded w-full"
                                >
                                    <option value="STAFF">STAFF</option>
                                    <option value="SUPERVISOR">SUPERVISOR</option>
                                    <option value="MANAGER">MANAGER</option>
                                </select>
                            </div>
                        </div>

                        <div className="mt-5 flex justify-end gap-3">
                            <button
                                className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
                                onClick={() => setIsAddingEmployee(false)}
                            >
                                Cancel
                            </button>
                            <button
                                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                                onClick={handleSaveNewEmployee}
                            >
                                Save Employee
                            </button>
                        </div>
                    </div>
                </div>
            )}
        
        </div>
    );
}
