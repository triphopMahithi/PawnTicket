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

export default function History() {
    const navigate = useNavigate();
    const [search, setSearch] = useState("");
    const [editTicket, setEditTicket] = useState<HistoryItem | null>(null);
    const [viewCustomer, setViewCustomer] = useState<CustomerInfo | null>(null);
    const [viewTickets, setViewTickets] = useState<HistoryItem[] | null>(null);
    const handleDeleteAllTickets = () => {
    if (!viewTickets || viewTickets.length === 0) return;

    const customerID = viewTickets[0].customer_ID;

    // ลบตั๋วทั้งหมดของลูกค้าคนนี้ออกจาก historyData
    const updated = historyData.filter(t => t.customer_ID !== customerID);

    setHistoryData(updated);
    setViewTickets(null); // ปิด modal
};


    const [itemData, setItemData] = useState({
        item_ID: "",
        item_Type: "",
        description: "",
        appraised_value: "",
        item_status: "",
    });

    const [appraisalData, setAppraisalData] = useState({
        appraisal_ID: "",
        appraised_value: "",
        appraisal_date: "",
        evidence: "",
        item_ID: "",
        Staff_ID: "",
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
        {
             ticket_ID: "T003",
            first_name: "INK",
            last_name: "Dekab",
            customer_ID: "C001",
            contract_date: "2025-03-01",
            loan_amount: 8000,
            interest_rate: 5.0,
            due_date: "2025-09-01",
            notice_date: "2025-08-20",
            contract_status: "ACTIVE",
            staff_ID: "S001",
            item_ID: "I003",
        },
        {
            ticket_ID: "T004",
            first_name: "Nam",
            last_name: "Maka",
            customer_ID: "C002",
            contract_date: "2025-05-18",
            loan_amount: 9500,
            interest_rate: 6.0,
            due_date: "2025-08-19",
            notice_date: "2025-08-01",
            contract_status: "ROLLED_OVER",
            staff_ID: "S002",
            item_ID: "I004",
        },
    ]);
    const mockPawnItems = [
        {
            item_ID: "I001",
            item_Type: "Gold Necklace",
            description: "24K gold necklace 50g",
            appraised_value: 15000,
            item_status: "IN_STORAGE",
        },
        {
            item_ID: "I002",
            item_Type: "Smartphone",
            description: "iPhone 13 Pro",
            appraised_value: 22000,
            item_status: "IN_STORAGE",
        },
        {
            item_ID: "I003",
            item_Type: "Laptop",
            description: "MacBook Air 2020",
            appraised_value: 18000,
            item_status: "RETURNED_TO_CUSTOMER",
        },
        {
            item_ID: "I004",
            item_Type: "Watch",
            description: "Casio G-Shock",
            appraised_value: 4000,
            item_status: "IN_STORAGE",
        },
    ];

    const mockAppraisals = [
        {
            appraisal_ID: "A001",
            appraised_value: 15000,
            appraisal_Date: "2025-01-01 14:00:00",
            evidence: "mock_image_binary",
            item_ID: "I001",
            Staff_ID: "S001",
        },
        {
            appraisal_ID: "A002",
            appraised_value: 22000,
            appraisal_Date: "2025-02-15 10:30:00",
            evidence: "mock_image_binary",
            item_ID: "I002",
            Staff_ID: "S002",
        },
        {
            appraisal_ID: "A003",
            appraised_value: 18000,
            appraisal_Date: "2025-03-01 09:00:00",
            evidence: "mock_image_binary",
            item_ID: "I003",
            Staff_ID: "S001",
        },
    ];

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

    const uniqueCustomers = Array.from(
        new Map(historyData.map(item => [item.customer_ID, item])).values()
    );

    const filteredData = uniqueCustomers.filter((item) =>
        item.first_name.toLowerCase().includes(search.toLowerCase())
    );

    const getStatusColor = (status: string) => {
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
    };

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
                                className="text-blue-600 text-base font-semibold cursor-pointer hover:underline"
                                onClick={() => {
                                    const ticketsOfCustomer = historyData.filter(
                                        (t) => t.customer_ID === item.customer_ID
                                    );
                                    setViewTickets(ticketsOfCustomer);
                                }}
                            >
                                Ticket
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

            {/* 🟨 Modal: Tickets of a selected customer */}
            {viewTickets && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl p-6 relative max-h-[90vh] overflow-y-auto">
                <button
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-800 text-xl font-bold"
                onClick={() => setViewTickets(null)}
                >
                ×
                </button>
                <h2 className="text-2xl font-bold text-blue-700 mb-4">
                Tickets
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {viewTickets.map((t) => (
                    <div
                    key={t.ticket_ID}
                    className="p-4 border rounded-lg shadow hover:shadow-md cursor-pointer transition"
                    onClick={() => setEditTicket(t)} // เปิด modal Edit Ticket
                    >
                    <p className="text-blue-600 font-semibold">Ticket ID: {t.ticket_ID}</p>
                    <p>Loan Amount: ฿{t.loan_amount}</p>
                    <p>Status: <span className={getStatusColor(t.contract_status)}>{t.contract_status}</span></p>
                    <p>Due Date: {t.due_date}</p>
                    </div>
                ))}
                    </div>
                    <div className="mt-5 flex justify-between">
                    <button
                        className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 mr-auto"
                        onClick={handleDeleteAllTickets}
                    >
                    Delete All
                    </button>
                    <div className="flex gap-3">
                    <button
                        className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
                        onClick={() => setViewTickets(null)}
                    >
                    Cancel
                    </button>
                    </div>
                </div>    
            </div>
            </div>
            )}

            {/* 🟦 Modal: Ticket Editable */}
            {editTicket && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6 relative max-h-[90vh] overflow-y-auto">
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
                            {/* Read-only IDs */}
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
                            <div>
                                <p className="font-medium">Staff ID</p>
                                <input
                                    readOnly
                                    value={editTicket.staff_ID}
                                    className="border p-2 rounded w-full bg-gray-100"
                                />
                            </div>
                            <div>
                                <p className="font-medium">Item ID</p>
                                <input
                                    readOnly
                                    value={editTicket.item_ID}
                                    className="border p-2 rounded w-full bg-gray-100"
                                />
                            </div>

                            {/* Editable fields */}
                            <div>
                                <p className="font-medium">Contract Date</p>
                                <input
                                    type="datetime-local"
                                    value={editTicket.contract_date}
                                    onChange={(e) =>
                                        setEditTicket({ ...editTicket, contract_date: e.target.value })
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
                                <p className="font-medium">Interest Rate (%)</p>
                                <input
                                    type="number"
                                    step="0.01"
                                    value={editTicket.interest_rate}
                                    onChange={(e) =>
                                        setEditTicket({
                                            ...editTicket,
                                            interest_rate: parseFloat(e.target.value),
                                        })
                                    }
                                    className="border p-2 rounded w-full"
                                />
                            </div>
                            <div>
                                <p className="font-medium">Due Date</p>
                                <input
                                    type="datetime-local"
                                    value={editTicket.due_date}
                                    onChange={(e) =>
                                        setEditTicket({ ...editTicket, due_date: e.target.value })
                                    }
                                    className="border p-2 rounded w-full"
                                />
                            </div>
                            <div>
                                <p className="font-medium">Notice Date</p>
                                <input
                                    type="datetime-local"
                                    value={editTicket.notice_date}
                                    onChange={(e) =>
                                        setEditTicket({ ...editTicket, notice_date: e.target.value })
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
                                            contract_status: e.target.value as HistoryItem["contract_status"],
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
                        </div>

                        <h2 className="text-xl font-bold mt-6">PawnItem</h2>

                        <div className="grid grid-cols-2 gap-4 mt-4">

                            <div>
                                <label className="font-semibold">Item ID (read-only)</label>
                                <input
                                    type="text"
                                    value={itemData.item_ID}
                                    readOnly
                                    className="border p-2 w-full bg-gray-100"
                                />
                            </div>

                            <div>
                                <label className="font-semibold">Item Type</label>
                                <input
                                    type="text"
                                    value={itemData.item_Type}
                                    onChange={(e) =>
                                        setItemData({ ...itemData, item_Type: e.target.value })
                                    }
                                    className="border p-2 w-full"
                                />
                            </div>

                            <div className="col-span-2">
                                <label className="font-semibold">Description</label>
                                <input
                                    type="text"
                                    value={itemData.description}
                                    onChange={(e) =>
                                        setItemData({ ...itemData, description: e.target.value })
                                    }
                                    className="border p-2 w-full"
                                />
                            </div>

                            <div>
                                <label className="font-semibold">Appraised Value</label>
                                <input
                                    type="number"
                                    value={itemData.appraised_value}
                                    onChange={(e) =>
                                        setItemData({ ...itemData, appraised_value: e.target.value })
                                    }
                                    className="border p-2 w-full"
                                />
                            </div>

                            <div>
                                <label className="font-semibold">Item Status</label>
                                <select
                                    value={itemData.item_status}
                                    onChange={(e) =>
                                        setItemData({ ...itemData, item_status: e.target.value })
                                    }
                                    className="border p-2 w-full"
                                >
                                    <option value="IN_STORAGE">IN_STORAGE</option>
                                    <option value="RETURNED_TO_CUSTOMER">RETURNED_TO_CUSTOMER</option>
                                    <option value="FORFEITED_READY_FOR_SALE">FORFEITED_READY_FOR_SALE</option>
                                    <option value="SOLD">SOLD</option>
                                    <option value="OTHER">OTHER</option>
                                </select>
                            </div>

                        </div>

                        <h2 className="text-xl font-bold mt-6">Appraisal</h2>

                        <div className="grid grid-cols-2 gap-4 mt-4">

                            <div>
                                <label className="font-semibold">Appraisal ID (read-only)</label>
                                <input
                                    type="text"
                                    value={appraisalData.appraisal_ID}
                                    readOnly
                                    className="border p-2 w-full bg-gray-100"
                                />
                            </div>

                            <div>
                                <label className="font-semibold">Appraised Value</label>
                                <input
                                    type="number"
                                    value={appraisalData.appraised_value}
                                    onChange={(e) =>
                                        setAppraisalData({
                                            ...appraisalData,
                                            appraised_value: e.target.value,
                                        })
                                    }
                                    className="border p-2 w-full"
                                />
                            </div>

                            <div>
                                <label className="font-semibold">Appraisal Date</label>
                                <input
                                    type="datetime-local"
                                    value={appraisalData.appraisal_date}
                                    onChange={(e) =>
                                        setAppraisalData({ ...appraisalData, appraisal_date: e.target.value })
                                    }
                                    className="border p-2 w-full"
                                />
                            </div>

                            <div>
                                <label className="font-semibold">Evidence</label>
                                <input
                                    type="text"
                                    value={appraisalData.evidence}
                                    onChange={(e) =>
                                        setAppraisalData({ ...appraisalData, evidence: e.target.value })
                                    }
                                    className="border p-2 w-full"
                                />
                            </div>

                            <div>
                                <label className="font-semibold">Item ID (read-only)</label>
                                <input
                                    type="text"
                                    value={appraisalData.item_ID}
                                    readOnly
                                    className="border p-2 w-full bg-gray-100"
                                />
                            </div>

                            <div>
                                <label className="font-semibold">Staff ID (read-only)</label>
                                <input
                                    type="text"
                                    value={appraisalData.Staff_ID}
                                    readOnly
                                    className="border p-2 w-full bg-gray-100"
                                />
                            </div>

                        </div>


                        <div className="mt-5 flex justify-between">
                             <button
                                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 mr-auto"
                                onClick={() => { }}
                             >
                                Delete
                            </button>
                            <div className="flex gap-3">
                                <button
                                    className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
                                    onClick={() => setEditTicket(null)}
                                >
                                  Cancel
                                </button>
                                <button
                                    className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 "
                                    onClick={handleSaveTicket}
                                >
                                    Save
                                </button>
                            </div>
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

                        <div className="mt-5 flex justify-between">
                             <button
                                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 mr-auto"
                                onClick={() => { }}
                             >
                                Delete
                            </button>
                            <div className="flex gap-3">
                                <button
                                    className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
                                    onClick={() => setViewCustomer(null)}
                                >
                                  Cancel
                                </button>
                                <button
                                    className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 "
                                    onClick={handleSaveCustomer}
                                >
                                    Save
                                </button>
                            </div>
                        </div>                       
                    </div>
                </div>
            )}
        </div>
    );
}
