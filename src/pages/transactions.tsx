import { useState, useEffect, useCallback } from 'react';
import { Button, Badge } from 'flowbite-react';
import { useOffertoryModal } from '../context/OffertoryModalContext';
import YearSelector from '../components/YearSelector';
import useAxios from '../context/useAxios';
import { API_PATHS } from '../utils/apiPath';
import { AddTransactionModal } from '../components/AddTransactionModal';

interface OffertoryData {
  id: number;
  created_at: string;
  updated_at: string;
  date: string;
  year_id: number;
  first_offertory: number | null;
  second_offertory: number | null;
  sunday_school: number | null;
  total_amount: number | null;
  is_active: boolean;
  year: {
    id: number;
    created_at: string;
    updated_at: string;
    year: string;
    is_active: boolean;
    is_deleted: boolean;
  };
}

interface ExpenseData {
  id: number;
  created_at: string;
  updated_at: string;
  date: string;
  type: 'income' | 'expense';
  category: string;
  description: string;
  amount: number;
  head_id: number;
  year_head_id: number;
  reference: string;
  is_active: boolean;
  head: {
    id: number;
    created_at: string;
    updated_at: string;
    head: string;
    particulars: string;
    type: string;
    is_active: boolean;
  };
  year_head: {
    id: number;
    created_at: string;
    updated_at: string;
    year_id: number;
    head_id: number;
    amount: number;
    actual: number;
    year: {
      id: number;
      created_at: string;
      updated_at: string;
      year: string;
      is_active: boolean;
      is_deleted: boolean;
    };
    head: {
      id: number;
      created_at: string;
      updated_at: string;
      head: string;
      particulars: string;
      type: string;
      is_active: boolean;
    };
  };
}

export default function Transactions() {
  const [selectedYear, setSelectedYear] = useState('2025-2026');
  const [fiscalYears, setFiscalYears] = useState<Array<{ id: number; year: string; is_active: boolean; is_deleted: boolean }>>([]);
  const [offertoryData, setOffertoryData] = useState<OffertoryData[]>([]);
  const [isLoadingOffertory, setIsLoadingOffertory] = useState(false);
  
  // Transactions state
  const [transactionsData, setTransactionsData] = useState<ExpenseData[]>([]);
  const [isLoadingTransactions, setIsLoadingTransactions] = useState(false);
  
  // Transactions pagination state
  const [transactionsPage, setTransactionsPage] = useState(1);
  const [transactionsTotal, setTransactionsTotal] = useState(0);
  const [transactionsTotalPages, setTransactionsTotalPages] = useState(0);
  const [transactionsHasNext, setTransactionsHasNext] = useState(false);
  const [transactionsHasPrev, setTransactionsHasPrev] = useState(false);
  const [transactionsPageSize] = useState(10);
  
  // Transaction modal state
  const [isTransactionModalOpen, setIsTransactionModalOpen] = useState(false);
  
  // Offertory pagination state
  const [offertoryPage, setOffertoryPage] = useState(1);
  const [offertoryTotal, setOffertoryTotal] = useState(0);
  const [offertoryTotalPages, setOffertoryTotalPages] = useState(0);
  const [offertoryHasNext, setOffertoryHasNext] = useState(false);
  const [offertoryHasPrev, setOffertoryHasPrev] = useState(false);
  const [offertoryPageSize] = useState(10);
  
  const { openModal } = useOffertoryModal();
  const axiosInstance = useAxios();

  // Get the current year ID from the selected year
  const getCurrentYearId = () => {
    const currentYear = fiscalYears.find(year => year.year === selectedYear);
    return currentYear?.id;
  };

  // Handle saving new transaction (now just for refreshing data)
  const handleSaveTransaction = async (transactionData: any) => {
    try {
      // Refresh the transactions data after successful save
      fetchTransactionsData(transactionsPage);
      console.log('Transaction data refreshed');
    } catch (error) {
      console.error('Error refreshing transaction data:', error);
    }
  };

  // Fetch offertory data from API
  const fetchOffertoryData = useCallback(async (page: number = 1) => {
    const yearId = getCurrentYearId();
    if (!yearId) return;

    setIsLoadingOffertory(true);
    try {
      const response = await axiosInstance.get(`${API_PATHS.GET_OFFERTORY}?year_id=${yearId}&page=${page}&pageSize=${offertoryPageSize}`);
      console.log('Offertory API Response:', response.data);
      
      const data = response.data?.data || [];
      const pagination = response.data?.pagination || {};
      
      setOffertoryData(data);
      setOffertoryTotal(pagination.totalItems || 0);
      setOffertoryTotalPages(pagination.totalPages || 0);
      setOffertoryHasNext(pagination.hasNext || false);
      setOffertoryHasPrev(pagination.hasPrev || false);
    } catch (error) {
      console.error('Error fetching offertory data:', error);
      setOffertoryData([]);
      setOffertoryTotal(0);
      setOffertoryTotalPages(0);
      setOffertoryHasNext(false);
      setOffertoryHasPrev(false);
    } finally {
      setIsLoadingOffertory(false);
    }
  }, [axiosInstance, selectedYear, fiscalYears, offertoryPageSize]);

  // Fetch transactions data from API
  const fetchTransactionsData = useCallback(async (page: number = 1) => {
    const yearId = getCurrentYearId();
    if (!yearId) return;

    setIsLoadingTransactions(true);
    try {
      const response = await axiosInstance.get(`${API_PATHS.TRANSACTIONS}?year_id=${yearId}&page=${page}&pageSize=${transactionsPageSize}`);
      console.log('Transactions API Response:', response.data);
      
      const data = response.data?.data || [];
      const pagination = response.data?.pagination || {};
      
      setTransactionsData(data);
      setTransactionsTotal(pagination.totalItems || 0);
      setTransactionsTotalPages(pagination.totalPages || 0);
      setTransactionsHasNext(pagination.hasNext || false);
      setTransactionsHasPrev(pagination.hasPrev || false);
    } catch (error) {
      console.error('Error fetching transactions data:', error);
      setTransactionsData([]);
      setTransactionsTotal(0);
      setTransactionsTotalPages(0);
      setTransactionsHasNext(false);
      setTransactionsHasPrev(false);
    } finally {
      setIsLoadingTransactions(false);
    }
  }, [axiosInstance, selectedYear, fiscalYears, transactionsPageSize]);

  // Fetch data when year changes or fiscal years are loaded
  useEffect(() => {
    if (fiscalYears.length > 0 && getCurrentYearId()) {
      setOffertoryPage(1); // Reset to first page when year changes
      setTransactionsPage(1); // Reset to first page for transactions
      fetchOffertoryData(1);
      fetchTransactionsData(1); // Reset to first page for transactions
    }
  }, [fiscalYears, selectedYear, fetchOffertoryData, fetchTransactionsData]);

  const formatCurrency = (value: number | null) => {
    if (value === null) return '-';
    if (typeof value === 'number') {
      return value >= 0 ? `$${value.toLocaleString()}` : `-$${Math.abs(value).toLocaleString()}`;
    }
    return '-';
  };

  return (
    <div className="min-h-screen bg-gray-50">

      {/* Main Content */}
      <div className="p-6">
        {/* Year Selector */}
        <div className="mb-6">
          <YearSelector
            selectedYear={selectedYear}
            onYearChange={(year) => {
              setSelectedYear(year);
              setOffertoryPage(1); // Reset to first page
              setTransactionsPage(1); // Reset to first page for transactions
              // Fetch new data for the selected year
              setTimeout(() => {
                fetchOffertoryData(1);
                fetchTransactionsData(1); // Reset to first page for transactions
              }, 100);
            }}
            onYearsLoaded={useCallback((years: Array<{ id: number; year: string; is_active: boolean; is_deleted: boolean }>) => {
              setFiscalYears(years);
              console.log('Years loaded in transactions:', years);
            }, [])}
          />
        </div>

        {/* Offertory Details Section */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-8">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900">Offertory Details</h2>
              <Button size="sm" className="bg-blue-600 hover:bg-blue-700 rounded-full p-2"
                onClick={openModal}>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
                </svg>
              </Button>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left text-gray-500">
              <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                <tr>
                  <th className="px-6 py-3">DATE</th>
                  <th className="px-6 py-3">FIRST OFFERTORY</th>
                  <th className="px-6 py-3">SECOND OFFERTORY</th>
                  <th className="px-6 py-3">SUNDAY SCHOOL</th>
                  <th className="px-6 py-3">TOTAL AMOUNT</th>
                </tr>
              </thead>
              <tbody>
                {isLoadingOffertory ? (
                  <tr className="bg-white">
                    <td colSpan={5} className="text-center text-gray-500 py-8">
                      <div className="flex items-center justify-center space-x-2">
                        <svg className="animate-spin h-5 w-5 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        <span>Loading offertory data...</span>
                      </div>
                    </td>
                  </tr>
                ) : offertoryData.length === 0 ? (
                  <tr className="bg-white hover:bg-gray-50">
                    <td colSpan={5} className="text-center text-gray-500 py-8">
                      No offertory data available for the selected year
                    </td>
                  </tr>
                ) : (
                  offertoryData.map((row, index) => (
                    <tr key={index} className="bg-white hover:bg-gray-50 border-b">
                      <td className="px-6 py-4 font-medium text-gray-900">
                        {new Date(row.date).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric'
                        })}
                      </td>
                      <td className={`px-6 py-4 ${row.first_offertory === null ? 'text-gray-400' : 'text-gray-900'}`}>
                        {formatCurrency(row.first_offertory)}
                      </td>
                      <td className={`px-6 py-4 ${row.second_offertory === null ? 'text-gray-400' : 'text-gray-900'}`}>
                        {formatCurrency(row.second_offertory)}
                      </td>
                      <td className={`px-6 py-4 ${row.sunday_school === null ? 'text-gray-400' : 'text-gray-900'}`}>
                        {formatCurrency(row.sunday_school)}
                      </td>
                      <td className={`px-6 py-4 ${row.total_amount === null ? 'text-gray-400' : 'text-gray-900'}`}>
                        {formatCurrency(row.total_amount)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          
          {/* Pagination */}
          <div className="flex items-center justify-between p-4 border-t border-gray-200">
            <div className="text-sm text-gray-500">
              Showing <span className="font-medium">{((offertoryPage - 1) * offertoryPageSize) + 1}</span> to <span className="font-medium">{Math.min(offertoryPage * offertoryPageSize, offertoryTotal)}</span> of <span className="font-medium">{offertoryTotal}</span> entries (Page {offertoryPage} of {offertoryTotalPages})
            </div>
            <div className="flex items-center space-x-2">
              <Button
                size="sm"
                color="gray"
                className="px-3 py-1"
                disabled={!offertoryHasPrev}
                onClick={() => {
                  const newPage = offertoryPage - 1;
                  setOffertoryPage(newPage);
                  fetchOffertoryData(newPage);
                }}
              >
                <span>‹</span>
              </Button>
              {(() => {
                const totalPages = offertoryTotalPages;
                const currentPage = offertoryPage;
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
                        setOffertoryPage(pageNum);
                        fetchOffertoryData(pageNum);
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
                disabled={!offertoryHasNext}
                onClick={() => {
                  const newPage = offertoryPage + 1;
                  setOffertoryPage(newPage);
                  fetchOffertoryData(newPage);
                }}
              >
                <span>›</span>
              </Button>
            </div>
          </div>
        </div>

        {/* Transactions Section */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900">Transactions</h2>
              <Button 
                size="sm" 
                className="bg-blue-600 hover:bg-blue-700 rounded-full p-2"
                onClick={() => setIsTransactionModalOpen(true)}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
                </svg>
              </Button>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left text-gray-500">
              <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                <tr>
                  <th className="px-6 py-3">DATE</th>
                  <th className="px-6 py-3">HEAD</th>
                  <th className="px-6 py-3">DESCRIPTION</th>
                  <th className="px-6 py-3">CATEGORY</th>
                  <th className="px-6 py-3">AMOUNT</th>
                </tr>
              </thead>
              <tbody>
                {isLoadingTransactions ? (
                  <tr className="bg-white">
                    <td colSpan={5} className="text-center text-gray-500 py-8">
                      <div className="flex items-center justify-center space-x-2">
                        <svg className="animate-spin h-5 w-5 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        <span>Loading transactions data...</span>
                      </div>
                    </td>
                  </tr>
                ) : transactionsData.length === 0 ? (
                  <tr className="bg-white hover:bg-gray-50">
                    <td colSpan={5} className="text-center text-gray-500 py-8">
                      No transactions data available for the selected year
                    </td>
                  </tr>
                ) : (
                  transactionsData.map((row: ExpenseData, index: number) => (
                    <tr key={index} className="bg-white hover:bg-gray-50 border-b">
                      <td className="px-6 py-4 font-medium text-gray-900">
                        {new Date(row.date).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric'
                        })}
                      </td>
                      <td className="px-6 py-4 text-gray-900">
                        {row.head.particulars}
                      </td>
                      <td className="px-6 py-4 text-gray-900">{row.description}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                          row.type === 'income' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {row.category}
                        </span>
                      </td>
                      <td className={`px-6 py-4 font-medium ${
                        row.type === 'income' ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {formatCurrency(row.amount)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          
          {/* Pagination */}
          <div className="flex items-center justify-between p-4 border-t border-gray-200">
            <div className="text-sm text-gray-500">
              Showing <span className="font-medium">{((transactionsPage - 1) * transactionsPageSize) + 1}</span> to <span className="font-medium">{Math.min(transactionsPage * transactionsPageSize, transactionsTotal)}</span> of <span className="font-medium">{transactionsTotal}</span> entries (Page {transactionsPage} of {transactionsTotalPages})
            </div>
            <div className="flex items-center space-x-2">
              <Button
                size="sm"
                color="gray"
                className="px-3 py-1"
                disabled={!transactionsHasPrev}
                onClick={() => {
                  const newPage = transactionsPage - 1;
                  setTransactionsPage(newPage);
                  fetchTransactionsData(newPage);
                }}
              >
                <span>‹</span>
              </Button>
              {(() => {
                const totalPages = transactionsTotalPages;
                const currentPage = transactionsPage;
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
                        setTransactionsPage(pageNum);
                        fetchTransactionsData(pageNum);
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
                disabled={!transactionsHasNext}
                onClick={() => {
                  const newPage = transactionsPage + 1;
                  setTransactionsPage(newPage);
                  fetchTransactionsData(newPage);
                }}
              >
                <span>›</span>
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Add Transaction Modal */}
      <AddTransactionModal
        isOpen={isTransactionModalOpen}
        onClose={() => setIsTransactionModalOpen(false)}
        onSave={handleSaveTransaction}
        yearId={getCurrentYearId() || 0}
      />
    </div>
  );
}
