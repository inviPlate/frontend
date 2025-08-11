import { Table, TableBody, TableCell, TableHead, TableHeadCell, TableRow, Button, TextInput } from "flowbite-react";
import { useState } from "react";
import { AddBudgetHeadModal } from "../components/AddBudgetHeadModal";

interface BudgetHeadData {
  head: string;
  particulars: string;
  budgetedAmount: string;
  incomeExpenseType: 'Income' | 'Expense';
}

export default function Budget() {
  const [isIncomeModalOpen, setIsIncomeModalOpen] = useState(false);
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const incomeData = [
    { head: "301.0", operatingIncome: "Offerings", budgeted: "$2300", actuals: "$2300", status: "Under Budget" },
    { head: "301.1", operatingIncome: "Tithes", budgeted: "-$670", actuals: "-$670", status: "Under Budget" },
    { head: "302", operatingIncome: "Contributions", budgeted: "$234", actuals: "$234", status: "Over Budget" },
    { head: "303", operatingIncome: "Missions", budgeted: "$5000", actuals: "$5000", status: "On Budget" },
    { head: "304", operatingIncome: "Benevolences", budgeted: "$2300", actuals: "$2300", status: "Under Budget" },
    { head: "305", operatingIncome: "Thank Offering", budgeted: "$560", actuals: "$560", status: "Under Budget" },
  ];

  const getStatusBadge = (status: string) => {
    const baseClasses = "px-2 py-1 text-xs font-medium rounded-md";
    switch (status) {
      case "Under Budget":
        return `${baseClasses} bg-green-100 text-green-800`;
      case "Over Budget":
        return `${baseClasses} bg-red-100 text-red-800`;
      case "On Budget":
        return `${baseClasses} bg-blue-100 text-blue-800`;
      default:
        return `${baseClasses} bg-gray-100 text-gray-800`;
    }
  };

  const handleSaveIncomeData = (data: BudgetHeadData) => {
    console.log('Income data saved:', data);
    // Here you would typically save to your backend or state management
  };

  const handleSaveExpenseData = (data: BudgetHeadData) => {
    console.log('Expense data saved:', data);
    // Here you would typically save to your backend or state management
  };

  return (
    <div className="p-6 space-y-8">
      {/* Income Section */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div className="flex items-center space-x-4">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center">
              Income
              <Button 
                size="xs" 
                className="ml-2 p-1 bg-blue-600 hover:bg-blue-700"
                onClick={() => setIsIncomeModalOpen(true)}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
                </svg>
              </Button>
            </h2>
            <div className="flex items-center space-x-2">
              <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
              </svg>
              <span className="text-sm text-gray-600">2025-2026</span>
            </div>
          </div>
          <div className="relative">
            <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
            </svg>
            <TextInput
              type="text"
              placeholder="Search"
              className="pl-10 w-64"
              sizing="sm"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHead>
              <TableRow>
                <TableHeadCell className="bg-white text-center">HEAD</TableHeadCell>
                <TableHeadCell className="bg-white text-center">OPERATING INCOME</TableHeadCell>
                <TableHeadCell className="bg-white text-center">BUDGETED</TableHeadCell>
                <TableHeadCell className="bg-white text-center">ACTUALS</TableHeadCell>
                <TableHeadCell className="bg-white text-center">STATUS</TableHeadCell>
              </TableRow>
            </TableHead>
            <TableBody className="divide-y">
              {incomeData.map((item, index) => (
                <TableRow key={index} className="bg-white hover:bg-gray-50">
                  <TableCell className="text-center whitespace-nowrap font-medium text-gray-900">
                    {item.head}
                  </TableCell>
                  <TableCell className="text-center text-gray-700">{item.operatingIncome}</TableCell>
                  <TableCell className="text-center font-medium text-gray-900">{item.budgeted}</TableCell>
                  <TableCell className="text-center font-medium text-gray-900">{item.actuals}</TableCell>
                  <TableCell className="text-center">
                    <span className={getStatusBadge(item.status)}>
                      {item.status}
                    </span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        <div className="flex items-center justify-between p-4 border-t border-gray-200">
          <div className="text-sm text-gray-500">
            Showing <span className="font-medium">1-10</span> of <span className="font-medium">1000</span>
          </div>
          <div className="flex items-center space-x-2">
            <Button size="sm" color="gray" className="px-3 py-1">
              <span>‹</span>
            </Button>
            <Button size="sm" className="px-3 py-1 bg-blue-600 text-white">1</Button>
            <Button size="sm" color="gray" className="px-3 py-1">2</Button>
            <Button size="sm" color="gray" className="px-3 py-1">3</Button>
            <span className="px-2 text-gray-500">...</span>
            <Button size="sm" color="gray" className="px-3 py-1">100</Button>
            <Button size="sm" color="gray" className="px-3 py-1">
              <span>›</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Expenses Section */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div className="flex items-center space-x-4">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center">
              Expenses
              <Button 
                size="xs" 
                className="ml-2 p-1 bg-blue-600 hover:bg-blue-700"
                onClick={() => setIsExpenseModalOpen(true)}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
                </svg>
              </Button>
            </h2>
            <div className="flex items-center space-x-2">
              <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
              </svg>
              <span className="text-sm text-gray-600">2025-2026</span>
            </div>
          </div>
          <div className="relative">
            <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
            </svg>
            <TextInput
              type="text"
              placeholder="Search"
              className="pl-10 w-64"
              sizing="sm"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHead>
              <TableRow>
                <TableHeadCell className="bg-gray-50">HEAD</TableHeadCell>
                <TableHeadCell className="bg-gray-50">OPERATING EXPENSE</TableHeadCell>
                <TableHeadCell className="bg-gray-50">BUDGETED</TableHeadCell>
                <TableHeadCell className="bg-gray-50">ACTUALS</TableHeadCell>
                <TableHeadCell className="bg-gray-50">STATUS</TableHeadCell>
              </TableRow>
            </TableHead>
            <TableBody className="divide-y">
              {/* Expenses data would go here */}
              <TableRow className="bg-white hover:bg-gray-50">
                <TableCell colSpan={5} className="text-center text-gray-500 py-8">
                  No expenses data available
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Modals */}
      <AddBudgetHeadModal
        isOpen={isIncomeModalOpen}
        onClose={() => setIsIncomeModalOpen(false)}
        onSave={handleSaveIncomeData}
        type="income"
      />

      <AddBudgetHeadModal
        isOpen={isExpenseModalOpen}
        onClose={() => setIsExpenseModalOpen(false)}
        onSave={handleSaveExpenseData}
        type="expense"
      />
    </div>
  );
}
