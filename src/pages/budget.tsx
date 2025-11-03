import { Table, TableBody, TableCell, TableHead, TableHeadCell, TableRow, Button, TextInput } from "flowbite-react";
import { useState, useEffect, useCallback } from "react";
import type { Dispatch, SetStateAction } from "react";
import { AddBudgetHeadModal } from "../components/addBudgetModal";
import { AddYearModal } from "../components/AddYearModal";
import YearSelector from "../components/YearSelector";
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
  const [isAddYearModalOpen, setIsAddYearModalOpen] = useState(false);
  const [editingIncomeItem, setEditingIncomeItem] = useState<BudgetData | null>(null);
  const [editingExpenseItem, setEditingExpenseItem] = useState<BudgetData | null>(null);
  const [selectedYear, setSelectedYear] = useState<string>('2025-2026');
  const [fiscalYears, setFiscalYears] = useState<Array<{ id: number; year: string; is_active: boolean; is_deleted: boolean }>>([]);
  const [errorMessage, setErrorMessage] = useState<string>('');

  // Budget data state
  const [incomeData, setIncomeData] = useState<BudgetData[]>([]);
  const [, setExpenseData] = useState<BudgetData[]>([]);
  const [expenseGroupedData, setExpenseGroupedData] = useState<Array<{ parent: BudgetData; children: BudgetData[] }>>([]);
  const [expandedParents, setExpandedParents] = useState<Set<number>>(new Set());
  const [isLoadingIncome, setIsLoadingIncome] = useState(false);
  const [isLoadingExpense, setIsLoadingExpense] = useState(false);

  const toggleParent = (parentId: number) => {
    setExpandedParents(prev => {
      const next = new Set(prev);
      if (next.has(parentId)) {
        next.delete(parentId);
      } else {
        next.add(parentId);
      }
      return next;
    });
  };

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

  // Clear expanded parents when year or page changes
  useEffect(() => {
    setExpandedParents(new Set());
  }, [selectedYear, expensePage]);

  // Get the current year ID from the selected year
  const getCurrentYearId = () => {
    const currentYear = fiscalYears.find(year => year.year === selectedYear);
    return currentYear?.id;
  };

  // Fetch budget data when year changes or component mounts
  useEffect(() => {
    if (getCurrentYearId()) {
      fetchAllBudgetData();
    }
  }, [selectedYear, incomePage, expensePage, debouncedIncomeSearchTerm, debouncedExpenseSearchTerm]);

  // Initial data fetch after component mounts and year is selected
  useEffect(() => {
    if (fiscalYears.length > 0 && getCurrentYearId()) {
      fetchAllBudgetData();
    }
  }, [fiscalYears, selectedYear]); // Run when either fiscalYears or selectedYear changes

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



  // Fetch budget data from API
  const fetchBudgetData = async (type: 'income' | 'expense', page: number = 1, searchTerm: string = '') => {
    const yearId = getCurrentYearId();
    if (!yearId) return;

    const setIsLoading: Dispatch<SetStateAction<boolean>> = (type === 'income' ? setIsLoadingIncome : setIsLoadingExpense) as Dispatch<SetStateAction<boolean>>;
    const setData: Dispatch<SetStateAction<BudgetData[]>> = (type === 'income' ? setIncomeData : setExpenseData) as Dispatch<SetStateAction<BudgetData[]>>;
    const setTotal: Dispatch<SetStateAction<number>> = (type === 'income' ? setIncomeTotal : setExpenseTotal) as Dispatch<SetStateAction<number>>;
    const setTotalPages: Dispatch<SetStateAction<number>> = (type === 'income' ? setIncomeTotalPages : setExpenseTotalPages) as Dispatch<SetStateAction<number>>;
    const setHasNext: Dispatch<SetStateAction<boolean>> = (type === 'income' ? setIncomeHasNext : setExpenseHasNext) as Dispatch<SetStateAction<boolean>>;
    const setHasPrev: Dispatch<SetStateAction<boolean>> = (type === 'income' ? setIncomeHasPrev : setExpenseHasPrev) as Dispatch<SetStateAction<boolean>>;

    setIsLoading(true);
    try {
      let url = API_PATHS.GET_BUDGET(type, page, pageSize);
      url += `&year_id=${yearId}`;
      if (searchTerm.trim()) {
        url += `&particular=${encodeURIComponent(searchTerm.trim())}`;
      }
      const response = await axiosInstance.get(url);
      
      // Safely extract data and pagination with fallbacks
      const fullResponseData = response.data?.data || [];
      let responseData: BudgetData[] = [];
      
      if(type === 'income') {
        // For income, data structure is [{ budgets: [...] }]
        // Extract budgets from the first element
        responseData = Array.isArray(fullResponseData) && fullResponseData[0]?.budgets ? fullResponseData[0].budgets : [];
      } else if(type === 'expense') {
        // For expense, index 0 contains parents, others contain children
        // Extract parents from index 0
        const parentGroup = fullResponseData[0];
        const parentItems = parentGroup?.budgets || [];
        
        // Extract child groups (indices 1+)
        const childGroups = fullResponseData.slice(1);
        
        // Filter parents by year
        const filteredParents = parentItems.filter((item: any) => {
          if (!item || typeof item !== 'object') return false;
          if (item.year_id && item.year_id !== yearId) return false;
          return true;
        });
        
        // Organize into parent-child structure
        const grouped: Array<{ parent: BudgetData; children: BudgetData[] }> = [];
        
        filteredParents.forEach((parent: any) => {
          // Find child group where child_of matches parent's id or head_id
          const childGroup = childGroups.find((cg: any) => cg.child_of === parent.id || cg.child_of === parent.head_id);
          const children = (childGroup?.budgets || []).filter((item: any) => {
            if (!item || typeof item !== 'object') return false;
            if (item.year_id && item.year_id !== yearId) return false;
            return true;
          });
          
          grouped.push({
            parent: {
              id: parent.id,
              head: parent.head,
              particular: parent.particular,
              budgeted: parent.budgeted,
              actuals: parent.actuals,
              status: parent.status,
              head_id: parent.head_id,
              year_id: parent.year_id
            },
            children: children.map((child: any) => ({
              id: child.id,
              head: child.head,
              particular: child.particular,
              budgeted: child.budgeted,
              actuals: child.actuals,
              status: child.status,
              head_id: child.head_id,
              year_id: child.year_id
            }))
          });
        });
        
        setExpenseGroupedData(grouped);
        responseData = filteredParents;
      }
      
      const pagination = response.data?.pagination || {};

      // Ensure data is an array and contains valid objects
      if (Array.isArray(responseData)) {
        // Additional validation: filter out any items that don't belong to the selected year
        const filteredData = responseData.filter(item => {
          if (!item || typeof item !== 'object') {
            return false;
          }
          // Ensure the item belongs to the selected year
          if (item.year_id && item.year_id !== yearId) {
            return false;
          }
          return true;
        });

        setData(filteredData);
        setTotal(pagination.total || 0);
        setTotalPages(pagination.total_pages || 0);
        setHasNext(pagination.has_next || false);
        setHasPrev(pagination.has_prev || false);
      } else {
        setData([]);
        setTotal(0);
        setTotalPages(0);
        setHasNext(false);
        setHasPrev(false);
        if (type === 'expense') {
          setExpenseGroupedData([]);
        }
      }
    } catch (error) {
      console.error(`Error fetching ${type} data:`, error);
      setData([]);
      setTotal(0);
      setTotalPages(0);
      setHasNext(false);
      setHasPrev(false);
      if (type === 'expense') {
        setExpenseGroupedData([]);
      }
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
      setEditingIncomeItem(null);
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
      setEditingExpenseItem(null);
      setIsExpenseModalOpen(true);
    } else {
      console.error('No year selected');
      setErrorMessage('Please select a fiscal year before adding budget items.');
      setIsExpenseModalOpen(false);
    }
  };

  const handleEditIncome = (item: BudgetData) => {
    setEditingIncomeItem(item);
    setIsIncomeModalOpen(true);
  };

  const handleEditExpense = (item: BudgetData) => {
    setEditingExpenseItem(item);
    setIsExpenseModalOpen(true);
  };

  const handleCloseIncomeModal = () => {
    setEditingIncomeItem(null);
    setIsIncomeModalOpen(false);
  };

  const handleCloseExpenseModal = () => {
    setEditingExpenseItem(null);
    setIsExpenseModalOpen(false);
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

  const handleSaveIncomeData = (_data: BudgetHeadData) => {
    // Refresh income data after saving
    fetchBudgetData('income', incomePage, debouncedIncomeSearchTerm);
  };

  const handleSaveExpenseData = (_data: BudgetHeadData) => {
    // Refresh expense data after saving
    fetchBudgetData('expense', expensePage, debouncedExpenseSearchTerm);
  };

  const handleOpenAddYearModal = () => {
    setIsAddYearModalOpen(true);
  };

  const handleCloseAddYearModal = () => {
    setIsAddYearModalOpen(false);
  };

  const handleSaveYearData = (_data: { year: string; clone_from_id: number }) => {
    // Refresh fiscal years list after saving
    // The YearSelector will automatically refresh when fiscalYears state updates
    setIsAddYearModalOpen(false);
  };

  return (
    <div className="p-6 space-y-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Budget</h1>
        <p className="text-gray-600">Manage and organize your year budget and income sources</p>

        {/* Year Selector */}
        <div className="flex items-baseline space-x-4 mt-4">
          <YearSelector
            selectedYear={selectedYear}
            onYearChange={handleYearChange}
            onYearsLoaded={useCallback((years: Array<{ id: number; year: string; is_active: boolean; is_deleted: boolean }>) => {
              setFiscalYears(years);
            }, [])}
            className="w-48"
          />
          <Button
            size="sm"
            color="blue"
            className="px-4 py-2 h-8"
            onClick={handleOpenAddYearModal}
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
            </svg>
            Add Effective Year
          </Button>
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
                <TableHeadCell className="bg-white text-center">ACTIONS</TableHeadCell>
              </TableRow>
            </TableHead>
            <TableBody className="divide-y">
              {isLoadingIncome ? (
                <TableRow className="bg-white">
                  <TableCell colSpan={6} className="text-center text-gray-500 py-8">
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
                  <TableCell colSpan={6} className="text-center text-gray-500 py-8">
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
                      <TableCell className="text-center">
                        <Button 
                          size="xs" 
                          color="blue"
                          onClick={() => handleEditIncome(item)}
                          className="px-3 py-1"
                        >
                          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                          Edit
                        </Button>
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
              const endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
              
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
          {isLoadingExpense ? (
            <div className="text-center text-gray-500 py-8">
              <div className="flex items-center justify-center space-x-2">
                <svg className="animate-spin h-5 w-5 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span>Loading expense data...</span>
              </div>
            </div>
          ) : expenseGroupedData.length === 0 ? (
            <div className="text-center text-gray-500 py-8">
              No expenses data available
            </div>
          ) : (
            <div className="border border-gray-200 rounded-lg">
              <div className="bg-gray-50 px-6 py-3 border-b border-gray-200">
                <div className="grid grid-cols-6 gap-4 text-sm font-semibold text-gray-700 uppercase">
                  <div>HEAD</div>
                  <div>PARTICULARS</div>
                  <div>BUDGETED</div>
                  <div>ACTUALS</div>
                  <div>STATUS</div>
                  <div>ACTIONS</div>
                </div>
              </div>
              <div className="divide-y divide-gray-200">
                {expenseGroupedData.map((group) => {
                  const { parent, children } = group;
                  const hasChildren = children.length > 0;
                  const isExpanded = expandedParents.has(parent.id);
                  
                  return (
                    <div key={parent.id} className="border-b border-gray-200 last:border-b-0">
                      <div 
                        className={`bg-white hover:bg-gray-50 px-6 py-4 ${hasChildren ? 'cursor-pointer' : ''}`}
                        onClick={() => {
                          if (hasChildren) {
                            toggleParent(parent.id);
                          }
                        }}
                      >
                        <div className="flex items-center justify-between w-full pr-4">
                          <div className="flex-1 grid grid-cols-6 gap-4 text-left">
                            <div className="font-medium text-gray-900 flex items-center">
                              {hasChildren && (
                                <svg 
                                  className={`w-4 h-4 text-gray-500 mr-2 transition-transform ${isExpanded ? 'rotate-90' : ''}`} 
                                  fill="none" 
                                  stroke="currentColor" 
                                  viewBox="0 0 24 24"
                                >
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                                </svg>
                              )}
                              {parent.head || '-'}
                            </div>
                            <div className="text-gray-700">{parent.particular || '-'}</div>
                            <div className="font-medium text-gray-900">₹{(parent.budgeted || 0).toLocaleString()}</div>
                            <div className="font-medium text-gray-900">₹{(parent.actuals || 0).toLocaleString()}</div>
                            <div>
                              <span className={getStatusBadge(parent.status || 'Unknown')}>
                                {parent.status || 'Unknown'}
                              </span>
                            </div>
                            <div>
                              <Button 
                                size="xs" 
                                color="blue"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleEditExpense(parent);
                                }}
                                className="px-3 py-1"
                              >
                                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
                                Edit
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                      {hasChildren && isExpanded && (
                        <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
                          <div className="overflow-x-auto">
                            <Table>
                              <TableHead>
                                <TableRow>
                                  <TableHeadCell className="bg-gray-100">HEAD</TableHeadCell>
                                  <TableHeadCell className="bg-gray-100">PARTICULARS</TableHeadCell>
                                  <TableHeadCell className="bg-gray-100">BUDGETED</TableHeadCell>
                                  <TableHeadCell className="bg-gray-100">ACTUALS</TableHeadCell>
                                  <TableHeadCell className="bg-gray-100">STATUS</TableHeadCell>
                                  <TableHeadCell className="bg-gray-100">ACTIONS</TableHeadCell>
                                </TableRow>
                              </TableHead>
                              <TableBody className="divide-y divide-gray-200">
                                {children.map((child) => (
                                  <TableRow key={child.id} className="bg-white hover:bg-gray-50">
                                    <TableCell className="text-center whitespace-nowrap font-medium text-gray-900">
                                      {child.head || '-'}
                                    </TableCell>
                                    <TableCell className="text-center text-gray-700">{child.particular || '-'}</TableCell>
                                    <TableCell className="text-center font-medium text-gray-900">
                                      ₹{(child.budgeted || 0).toLocaleString()}
                                    </TableCell>
                                    <TableCell className="text-center font-medium text-gray-900">
                                      ₹{(child.actuals || 0).toLocaleString()}
                                    </TableCell>
                                    <TableCell className="text-center">
                                      <span className={getStatusBadge(child.status || 'Unknown')}>
                                        {child.status || 'Unknown'}
                                      </span>
                                    </TableCell>
                                    <TableCell className="text-center">
                                      <Button 
                                        size="xs" 
                                        color="blue"
                                        onClick={() => handleEditExpense(child)}
                                        className="px-3 py-1"
                                      >
                                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                        </svg>
                                        Edit
                                      </Button>
                                    </TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
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
              const endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
              
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
          onClose={handleCloseIncomeModal}
          onSave={handleSaveIncomeData}
          type="income"
          yearId={getCurrentYearId()!}
          yearText={selectedYear}
          editData={editingIncomeItem}
        />
      )}

      {getCurrentYearId() && (
        <AddBudgetHeadModal
          isOpen={isExpenseModalOpen}
          onClose={handleCloseExpenseModal}
          onSave={handleSaveExpenseData}
          type="expense"
          yearId={getCurrentYearId()!}
          yearText={selectedYear}
          editData={editingExpenseItem}
        />
      )}

      <AddYearModal
        isOpen={isAddYearModalOpen}
        onClose={handleCloseAddYearModal}
        onSave={handleSaveYearData}
        existingYears={fiscalYears}
      />
    </div>
  );
}
