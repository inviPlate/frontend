import { Table, TableBody, TableCell, TableHead, TableHeadCell, TableRow, Button, TextInput, Dropdown, DropdownItem } from "flowbite-react";
import { useState, useEffect, useCallback } from "react";
import { AddBudgetHeadModal } from "../components/addBudgetModal";
import useAxios from "../context/useAxios";
import { API_PATHS } from "../utils/apiPath";

// Custom hook for debouncing values
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

interface BudgetHeadData {
  head: string;
  particulars: string;
  budgetedAmount: string;
  incomeExpenseType: 'Income' | 'Expense';
  yearId: number; // Added yearId to the interface
}

interface BudgetData {
  id: number;
  head: string;
  particular?: string;
  budgeted: number;
  actuals: number;
  status: string;
  head_id: number;
  year_id: number;
}

export default function Budget() {
  const [isIncomeModalOpen, setIsIncomeModalOpen] = useState(false);
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [selectedYear, setSelectedYear] = useState<string>('2025-2026');
  const [fiscalYears, setFiscalYears] = useState<Array<{ id: number; year: string; is_active: boolean; is_deleted: boolean }>>([]);
  const [isLoadingYears, setIsLoadingYears] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string>('');

  // Budget data state
  const [incomeData, setIncomeData] = useState<BudgetData[]>([]);
  const [expenseData, setExpenseData] = useState<BudgetData[]>([]);
  const [isLoadingIncome, setIsLoadingIncome] = useState(false);
  const [isLoadingExpense, setIsLoadingExpense] = useState(false);

  // Pagination state
  const [incomePage, setIncomePage] = useState(1);
  const [expensePage, setExpensePage] = useState(1);
  const [incomeTotal, setIncomeTotal] = useState(0);
  const [expenseTotal, setExpenseTotal] = useState(0);
  const [incomeTotalPages, setIncomeTotalPages] = useState(0);
  const [expenseTotalPages, setExpenseTotalPages] = useState(0);
  const [incomeHasNext, setIncomeHasNext] = useState(false);
  const [expenseHasNext, setExpenseHasNext] = useState(false);
  const [incomeHasPrev, setIncomeHasPrev] = useState(false);
  const [expenseHasPrev, setExpenseHasPrev] = useState(false);
  const [pageSize] = useState(20);

  // Search state
  const [incomeSearchTerm, setIncomeSearchTerm] = useState('');
  const [expenseSearchTerm, setExpenseSearchTerm] = useState('');

  // Debounced search terms (500ms delay)
  const debouncedIncomeSearchTerm = useDebounce(incomeSearchTerm, 500);
  const debouncedExpenseSearchTerm = useDebounce(expenseSearchTerm, 500);

  const axiosInstance = useAxios();

  // Fetch fiscal years from API
  useEffect(() => {
    const fetchFiscalYears = async () => {
      setIsLoadingYears(true);
      try {
        const response = await axiosInstance.get(API_PATHS.FISCAL_YEARS);
        const years = response.data.data || [];
        console.log('Fiscal years fetched:', years);
        setFiscalYears(years);

        // Set default year if available
        if (years.length > 0 && !years.find((y: { year: string }) => y.year === selectedYear)) {
          console.log('Setting default year to:', years[0].year);
          setSelectedYear(years[0].year);
        }
      } catch (error) {
        console.error('Error fetching fiscal years:', error);
      } finally {
        setIsLoadingYears(false);
      }
    };

    fetchFiscalYears();
  }, [axiosInstance, selectedYear]);

  // Fetch budget data when year changes or component mounts
  useEffect(() => {
    if (getCurrentYearId()) {
      fetchAllBudgetData();
    }
  }, [selectedYear, incomePage, expensePage, debouncedIncomeSearchTerm, debouncedExpenseSearchTerm]);

  // Initial data fetch after fiscal years are loaded
  useEffect(() => {
    console.log('Initial data fetch useEffect triggered:', {
      fiscalYearsLength: fiscalYears.length,
      currentYearId: getCurrentYearId(),
      selectedYear
    });
    if (fiscalYears.length > 0 && getCurrentYearId()) {
      console.log('Calling fetchAllBudgetData from initial useEffect');
      fetchAllBudgetData();
    }
  }, [fiscalYears]); // Run when fiscal years are loaded

  const handleYearChange = (yearId: string) => {
    setSelectedYear(yearId);
    setErrorMessage(''); // Clear any error messages
    // Reset pagination and fetch new data
    setIncomePage(1);
    setExpensePage(1);
    fetchAllBudgetData();
  };

  // Search handlers
  const handleIncomeSearch = (searchTerm: string) => {
    setIncomeSearchTerm(searchTerm);
    setIncomePage(1);
    // API call will be triggered by useEffect when debounced value changes
  };

  const handleExpenseSearch = (searchTerm: string) => {
    setExpenseSearchTerm(searchTerm);
    setExpensePage(1);
    // API call will be triggered by useEffect when debounced value changes
  };

  // Get the current year ID from the selected year
  const getCurrentYearId = () => {
    const currentYear = fiscalYears.find(year => year.year === selectedYear);
    return currentYear?.id;
  };

  // Fetch budget data from API
  const fetchBudgetData = async (type: 'income' | 'expense', page: number = 1, searchTerm: string = '') => {
    const yearId = getCurrentYearId();
    if (!yearId) return;

    const setIsLoading = type === 'income' ? setIsLoadingIncome : setIsLoadingExpense;
    const setData = type === 'income' ? setIncomeData : setExpenseData;
    const setTotal = type === 'income' ? setIncomeTotal : setExpenseTotal;
    const setTotalPages = type === 'income' ? setIncomeTotalPages : setExpenseTotalPages;
    const setHasNext = type === 'income' ? setIncomeHasNext : setExpenseHasNext;
    const setHasPrev = type === 'income' ? setIncomeHasPrev : setExpenseHasPrev;

    setIsLoading(true);
    try {
      let url = API_PATHS.GET_BUDGET(type, page, pageSize);
      if (searchTerm.trim()) {
        url += `&particular=${encodeURIComponent(searchTerm.trim())}`;
      }
      const response = await axiosInstance.get(url);
      console.log('API Response:', response.data);

      // Safely extract data and pagination with fallbacks
      const responseData = response.data?.data || [];
      const pagination = response.data?.pagination || {};

      // Ensure data is an array and contains valid objects
      if (Array.isArray(responseData)) {
        setData(responseData);
        setTotal(pagination.total || 0);
        setTotalPages(pagination.total_pages || 0);
        setHasNext(pagination.has_next || false);
        setHasPrev(pagination.has_prev || false);
      } else {
        console.error('Invalid data format received:', responseData);
        setData([]);
        setTotal(0);
        setTotalPages(0);
        setHasNext(false);
        setHasPrev(false);
      }
    } catch (error) {
      console.error(`Error fetching ${type} data:`, error);
      setData([]);
      setTotal(0);
      setTotalPages(0);
      setHasNext(false);
      setHasPrev(false);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch both income and expense data
  const fetchAllBudgetData = () => {
    fetchBudgetData('income', incomePage, debouncedIncomeSearchTerm);
    fetchBudgetData('expense', expensePage, debouncedExpenseSearchTerm);
  };

  const handleOpenIncomeModal = () => {
    const yearId = getCurrentYearId();
    if (yearId) {
      setErrorMessage('');
      setIsIncomeModalOpen(true);
    } else {
      console.error('No year selected');
      setErrorMessage('Please select a fiscal year before adding budget items.');
      setIsIncomeModalOpen(false);
    }
  };

  const handleOpenExpenseModal = () => {
    const yearId = getCurrentYearId();
    if (yearId) {
      setErrorMessage('');
      setIsExpenseModalOpen(true);
    } else {
      console.error('No year selected');
      setErrorMessage('Please select a fiscal year before adding budget items.');
      setIsExpenseModalOpen(false);
    }
  };



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
    // Refresh income data after saving
                    fetchBudgetData('income', incomePage, debouncedIncomeSearchTerm);
  };

  const handleSaveExpenseData = (data: BudgetHeadData) => {
    console.log('Expense data saved:', data);
    // Refresh expense data after saving
                    fetchBudgetData('expense', expensePage, debouncedExpenseSearchTerm);
  };

  return (
    <div className="p-6 space-y-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Budget</h1>
        <p className="text-gray-600">Manage and organize your year budget and income sources</p>

        {/* Year Selector */}
        <div className="flex items-center space-x-4 mt-4">
          <label className="text-sm font-medium text-gray-700">
            Fiscal Year:
          </label>
          <Dropdown
            label={
              <span className="flex items-center space-x-2">
                {isLoadingYears ? (
                  <svg className="animate-spin h-4 w-4 text-gray-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                ) : (
                  <span>{selectedYear}</span>
                )}
              </span>
            }
            className="w-48"
            disabled={isLoadingYears}
          >
            {fiscalYears.map((year) => (
              <DropdownItem key={year.id} onClick={() => handleYearChange(year.year)}>
                {year.year}
              </DropdownItem>
            ))}
          </Dropdown>
        </div>
        {errorMessage && (
          <div className="mt-2 text-sm text-red-600 bg-red-50 border border-red-200 px-3 py-2 rounded">
            {errorMessage}
          </div>
        )}
      </div>
      {/* Income Section */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div className="flex items-center space-x-4">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center">
              Income
              <Button
                size="xs"
                className="ml-2 p-1 bg-blue-600 hover:bg-blue-700"
                onClick={handleOpenIncomeModal}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
                </svg>
              </Button>
            </h2>
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
              value={incomeSearchTerm}
              onChange={(e) => handleIncomeSearch(e.target.value)}
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHead>
              <TableRow>
                <TableHeadCell className="bg-white text-center">HEAD</TableHeadCell>
                <TableHeadCell className="bg-white text-center">PARTICULARS</TableHeadCell>
                <TableHeadCell className="bg-white text-center">BUDGETED</TableHeadCell>
                <TableHeadCell className="bg-white text-center">ACTUALS</TableHeadCell>
                <TableHeadCell className="bg-white text-center">STATUS</TableHeadCell>
              </TableRow>
            </TableHead>
            <TableBody className="divide-y">
              {isLoadingIncome ? (
                <TableRow className="bg-white">
                  <TableCell colSpan={5} className="text-center text-gray-500 py-8">
                    <div className="flex items-center justify-center space-x-2">
                      <svg className="animate-spin h-5 w-5 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <span>Loading income data...</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : incomeData.length === 0 ? (
                <TableRow className="bg-white hover:bg-gray-50">
                  <TableCell colSpan={5} className="text-center text-gray-500 py-8">
                    No income data available
                  </TableCell>
                </TableRow>
              ) : (
                incomeData.map((item) => {
                  // Ensure item is a valid object with required properties
                  if (!item || typeof item !== 'object') {
                    console.error('Invalid item in incomeData:', item);
                    return null;
                  }

                  return (
                    <TableRow key={item.id || Math.random()} className="bg-white hover:bg-gray-50">
                      <TableCell className="text-center whitespace-nowrap font-medium text-gray-900">
                        {item.head || '-'}
                      </TableCell>
                      <TableCell className="text-center text-gray-700">{item.particular || '-'}</TableCell>
                      <TableCell className="text-center font-medium text-gray-900">
                        ₹{(item.budgeted || 0).toLocaleString()}
                      </TableCell>
                      <TableCell className="text-center font-medium text-gray-900">
                        ₹{(item.actuals || 0).toLocaleString()}
                      </TableCell>
                      <TableCell className="text-center">
                        <span className={getStatusBadge(item.status || 'Unknown')}>
                          {item.status || 'Unknown'}
                        </span>
                      </TableCell>
                    </TableRow>
                  );
                }).filter(Boolean)
              )}
            </TableBody>
          </Table>
        </div>

        <div className="flex items-center justify-between p-4 border-t border-gray-200">
          <div className="text-sm text-gray-500">
            Showing <span className="font-medium">{((incomePage - 1) * pageSize) + 1}</span> to <span className="font-medium">{Math.min(incomePage * pageSize, incomeTotal)}</span> of <span className="font-medium">{incomeTotal}</span> entries (Page {incomePage} of {incomeTotalPages})
          </div>
          <div className="flex items-center space-x-2">
            <Button
              size="sm"
              color="gray"
              className="px-3 py-1"
              disabled={!incomeHasPrev}
              onClick={() => {
                setIncomePage(incomePage - 1);
                fetchBudgetData('income', incomePage - 1, debouncedIncomeSearchTerm);
              }}
            >
              <span>‹</span>
            </Button>
            {(() => {
              const totalPages = incomeTotalPages;
              const currentPage = incomePage;
              const maxVisiblePages = 5;
              
              let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
              let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
              
              if (endPage - startPage + 1 < maxVisiblePages) {
                startPage = Math.max(1, endPage - maxVisiblePages + 1);
              }
              
              return Array.from({ length: endPage - startPage + 1 }, (_, i) => {
                const pageNum = startPage + i;
                return (
                  <Button
                    key={pageNum}
                    size="sm"
                    className={`px-3 py-1 ${currentPage === pageNum ? 'bg-blue-600 text-white' : 'text-gray-700'}`}
                    onClick={() => {
                      setIncomePage(pageNum);
                      fetchBudgetData('income', pageNum, debouncedIncomeSearchTerm);
                    }}
                  >
                    {pageNum}
                  </Button>
                );
              });
            })()}
            <Button
              size="sm"
              color="gray"
              className="px-3 py-1"
              disabled={!incomeHasNext}
              onClick={() => {
                setIncomePage(incomePage + 1);
                fetchBudgetData('income', incomePage + 1, debouncedIncomeSearchTerm);
              }}
            >
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
                onClick={handleOpenExpenseModal}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
                </svg>
              </Button>
            </h2>
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
              value={expenseSearchTerm}
              onChange={(e) => handleExpenseSearch(e.target.value)}
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHead>
              <TableRow>
                <TableHeadCell className="bg-gray-50">HEAD</TableHeadCell>
                <TableHeadCell className="bg-gray-50">PARTICULARS</TableHeadCell>
                <TableHeadCell className="bg-gray-50">BUDGETED</TableHeadCell>
                <TableHeadCell className="bg-gray-50">ACTUALS</TableHeadCell>
                <TableHeadCell className="bg-gray-50">STATUS</TableHeadCell>
              </TableRow>
            </TableHead>
            <TableBody className="divide-y">
              {isLoadingExpense ? (
                <TableRow className="bg-white">
                  <TableCell colSpan={5} className="text-center text-gray-500 py-8">
                    <div className="flex items-center justify-center space-x-2">
                      <svg className="animate-spin h-5 w-5 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <span>Loading expense data...</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : expenseData.length === 0 ? (
                <TableRow className="bg-white hover:bg-gray-50">
                  <TableCell colSpan={5} className="text-center text-gray-500 py-8">
                    No expenses data available
                  </TableCell>
                </TableRow>
              ) : (
                expenseData.map((item) => {
                  // Ensure item is a valid object with required properties
                  if (!item || typeof item !== 'object') {
                    console.error('Invalid item in expenseData:', item);
                    return null;
                  }

                  return (
                    <TableRow key={item.id || Math.random()} className="bg-white hover:bg-gray-50">
                      <TableCell className="text-center whitespace-nowrap font-medium text-gray-900">
                        {item.head || '-'}
                      </TableCell>
                      <TableCell className="text-center text-gray-700">{item.particular || '-'}</TableCell>
                      <TableCell className="text-center font-medium text-gray-900">
                        ₹{(item.budgeted || 0).toLocaleString()}
                      </TableCell>
                      <TableCell className="text-center font-medium text-gray-900">
                        ₹{(item.actuals || 0).toLocaleString()}
                      </TableCell>
                      <TableCell className="text-center">
                        <span className={getStatusBadge(item.status || 'Unknown')}>
                          {item.status || 'Unknown'}
                        </span>
                      </TableCell>
                    </TableRow>
                  );
                }).filter(Boolean)
              )}
            </TableBody>
          </Table>
        </div>

        {/* Expenses Pagination */}
        <div className="flex items-center justify-between p-4 border-t border-gray-200">
          <div className="text-sm text-gray-500">
            Showing <span className="font-medium">{((expensePage - 1) * pageSize) + 1}</span> to <span className="font-medium">{Math.min(expensePage * pageSize, expenseTotal)}</span> of <span className="font-medium">{expenseTotal}</span> entries (Page {expensePage} of {expenseTotalPages})
          </div>
          <div className="flex items-center space-x-2">
            <Button
              size="sm"
              color="gray"
              className="px-3 py-1"
              disabled={!expenseHasPrev}
              onClick={() => {
                setExpensePage(expensePage - 1);
                fetchBudgetData('expense', expensePage - 1, debouncedExpenseSearchTerm);
              }}
            >
              <span>‹</span>
            </Button>
            {(() => {
              const totalPages = expenseTotalPages;
              const currentPage = expensePage;
              const maxVisiblePages = 5;
              
              let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
              let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
              
              if (endPage - startPage + 1 < maxVisiblePages) {
                startPage = Math.max(1, endPage - maxVisiblePages + 1);
              }
              
              return Array.from({ length: endPage - startPage + 1 }, (_, i) => {
                const pageNum = startPage + i;
                return (
                  <Button
                    key={pageNum}
                    size="sm"
                    className={`px-3 py-1 ${currentPage === pageNum ? 'bg-blue-600 text-white' : 'text-gray-700'}`}
                    onClick={() => {
                      setExpensePage(pageNum);
                      fetchBudgetData('expense', pageNum, debouncedExpenseSearchTerm);
                    }}
                  >
                    {pageNum}
                  </Button>
                );
              });
            })()}
            <Button
              size="sm"
              color="gray"
              className="px-3 py-1"
              disabled={!expenseHasNext}
              onClick={() => {
                setExpensePage(expensePage + 1);
                fetchBudgetData('expense', expensePage + 1, debouncedExpenseSearchTerm);
              }}
            >
              <span>›</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Modals */}
      {getCurrentYearId() && (
        <AddBudgetHeadModal
          isOpen={isIncomeModalOpen}
          onClose={() => setIsIncomeModalOpen(false)}
          onSave={handleSaveIncomeData}
          type="income"
          yearId={getCurrentYearId()!}
          yearText={selectedYear}
        />
      )}

      {getCurrentYearId() && (
        <AddBudgetHeadModal
          isOpen={isExpenseModalOpen}
          onClose={() => setIsExpenseModalOpen(false)}
          onSave={handleSaveExpenseData}
          type="expense"
          yearId={getCurrentYearId()!}
          yearText={selectedYear}
        />
      )}
    </div>
  );
}
