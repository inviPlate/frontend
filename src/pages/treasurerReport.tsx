import { useState, useCallback, useEffect } from 'react';
import { Dropdown, DropdownItem, ToggleSwitch, Table, TableBody, TableCell, TableHead, TableHeadCell, TableRow } from 'flowbite-react';
import { BarChart, LineChart } from '@mui/x-charts';
import YearSelector from '../components/YearSelector';
import useAxios from '../context/useAxios';
import { API_PATHS } from '../utils/apiPath';

const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December'
];

interface Transaction {
  id: number;
  date: string;
  type: 'income' | 'expense';
  description: string;
  amount: number;
  head_id: number;
  year_head_id: number;
  reference: string;
  mode_of_payment?: 'cash' | 'cheque' | 'upi';
  is_active: boolean;
  head: {
    id: number;
    head: string;
    particulars: string;
    type: string;
    is_active: boolean;
    child_of?: number;
  };
  year_head: {
    id: number;
    year_id: number;
    head_id: number;
    year: {
      id: number;
      year: string;
    };
  };
}

interface BudgetHead {
  id: number;
  head: string;
  particulars: string;
  type: string;
  child_of?: number;
}

interface GroupedTransaction {
  headId: number;
  headName: string;
  particulars: string;
  total: number;
  cumulative: number;
  type: 'income' | 'expense';
}

export default function TreasurerReport() {
  // Get current month name
  const getCurrentMonth = () => {
    const currentDate = new Date();
    const currentMonthIndex = currentDate.getMonth(); // 0-11
    return MONTHS[currentMonthIndex];
  };

  const [selectedYear, setSelectedYear] = useState<string>('2025-2026');
  const [selectedMonth, setSelectedMonth] = useState<string>(getCurrentMonth());
  const [isAnnual, setIsAnnual] = useState<boolean>(false);
  const [fiscalYears, setFiscalYears] = useState<Array<{ id: number; year: string; is_active: boolean; is_deleted: boolean }>>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [cumulativeTransactions, setCumulativeTransactions] = useState<Transaction[]>([]);
  const [annualTransactions, setAnnualTransactions] = useState<Transaction[]>([]);
  const [budgetHeads, setBudgetHeads] = useState<BudgetHead[]>([]);
  const [groupedTransactions, setGroupedTransactions] = useState<GroupedTransaction[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const axiosInstance = useAxios();

  const getCurrentYearId = () => {
    const currentYear = fiscalYears.find(year => year.year === selectedYear);
    return currentYear?.id;
  };

  const getMonthNumber = (monthName: string): number => {
    return MONTHS.indexOf(monthName) + 1;
  };

  const getDateRange = () => {
    const yearId = getCurrentYearId();
    if (!yearId) return { startDate: '', endDate: '' };

    // Get the fiscal year from the selected year string (e.g., "2025-2026")
    const yearParts = selectedYear.split('-');
    const startYear = parseInt(yearParts[0]);
    const endYear = yearParts.length > 1 ? parseInt(yearParts[1]) : startYear + 1;

    let startDate: Date;
    let endDate: Date;

    if (isAnnual) {
      // For annual, use the full fiscal year (typically April to March)
      // Fiscal year 2025-2026 means April 2025 to March 2026
      startDate = new Date(startYear, 3, 1); // April 1st of start year
      endDate = new Date(endYear, 2, 31, 23, 59, 59, 999); // March 31st of end year
    } else {
      // For monthly, use the selected month
      const monthNumber = getMonthNumber(selectedMonth);
      // Determine which calendar year the month belongs to
      // Months April (4) to December (12) are in startYear
      // Months January (1) to March (3) are in endYear
      const monthYear = monthNumber >= 4 ? startYear : endYear;
      
      startDate = new Date(monthYear, monthNumber - 1, 1); // First day of month
      // Get last day of month
      endDate = new Date(monthYear, monthNumber, 0, 23, 59, 59, 999); // Last day of month
    }

    // Format dates as DD/MM/YYYY
    const formatDate = (date: Date): string => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${day}/${month}/${year}`;
    };

    return {
      startDate: formatDate(startDate),
      endDate: formatDate(endDate)
    };
  };

  const getCumulativeDateRange = () => {
    const yearId = getCurrentYearId();
    if (!yearId) return { startDate: '', endDate: '' };

    // Get the fiscal year from the selected year string (e.g., "2025-2026")
    const yearParts = selectedYear.split('-');
    const startYear = parseInt(yearParts[0]);
    const endYear = yearParts.length > 1 ? parseInt(yearParts[1]) : startYear + 1;

    // Cumulative always starts from April 1st of the fiscal year
    const cumulativeStartDate = new Date(startYear, 3, 1); // April 1st of start year

    let cumulativeEndDate: Date;

    if (isAnnual) {
      // For annual, end date is March 31st of end year
      cumulativeEndDate = new Date(endYear, 2, 31, 23, 59, 59, 999); // March 31st of end year
    } else {
      // For monthly, end date is the last day of the selected month
      const monthNumber = getMonthNumber(selectedMonth);
      const monthYear = monthNumber >= 4 ? startYear : endYear;
      cumulativeEndDate = new Date(monthYear, monthNumber, 0, 23, 59, 59, 999); // Last day of month
    }

    // Format dates as DD/MM/YYYY
    const formatDate = (date: Date): string => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${day}/${month}/${year}`;
    };

    return {
      startDate: formatDate(cumulativeStartDate),
      endDate: formatDate(cumulativeEndDate)
    };
  };

  const getAnnualDateRange = () => {
    const yearId = getCurrentYearId();
    if (!yearId) return { startDate: '', endDate: '' };

    // Get the fiscal year from the selected year string (e.g., "2025-2026")
    const yearParts = selectedYear.split('-');
    const startYear = parseInt(yearParts[0]);
    const endYear = yearParts.length > 1 ? parseInt(yearParts[1]) : startYear + 1;

    // Annual always uses the full fiscal year (April to March)
    const annualStartDate = new Date(startYear, 3, 1); // April 1st of start year
    const annualEndDate = new Date(endYear, 2, 31, 23, 59, 59, 999); // March 31st of end year

    // Format dates as DD/MM/YYYY
    const formatDate = (date: Date): string => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${day}/${month}/${year}`;
    };

    return {
      startDate: formatDate(annualStartDate),
      endDate: formatDate(annualEndDate)
    };
  };

  const handleYearChange = (year: string) => {
    setSelectedYear(year);
  };

  const handleMonthChange = (month: string) => {
    setSelectedMonth(month);
  };

  // Fetch transactions
  useEffect(() => {
    const fetchTransactions = async () => {
      const yearId = getCurrentYearId();
      if (!yearId) return;

      const { startDate, endDate } = getDateRange();
      if (!startDate || !endDate) return;

      setIsLoading(true);
      try {
        // Fetch transactions with date range
        const response = await axiosInstance.get(
          `${API_PATHS.TRANSACTIONS}?yearId=${yearId}&startDate=${startDate}&endDate=${endDate}&page=1&pageSize=10000`
        );
        const data = response.data?.data || [];
        
        // Filter by year to ensure data integrity
        const filteredData = data.filter((item: Transaction) => {
          if (!item || typeof item !== 'object') return false;
          if (item.year_head && item.year_head.year_id && item.year_head.year_id !== yearId) {
            return false;
          }
          return true;
        });

        setTransactions(filteredData);
      } catch (error) {
        console.error('Error fetching transactions:', error);
        setTransactions([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTransactions();
  }, [selectedYear, selectedMonth, isAnnual, fiscalYears, axiosInstance]);

  // Fetch cumulative transactions (from April 1st to end of selected period)
  useEffect(() => {
    const fetchCumulativeTransactions = async () => {
      const yearId = getCurrentYearId();
      if (!yearId) return;

      const { startDate, endDate } = getCumulativeDateRange();
      if (!startDate || !endDate) return;

      try {
        // Fetch cumulative transactions with date range
        const response = await axiosInstance.get(
          `${API_PATHS.TRANSACTIONS}?yearId=${yearId}&startDate=${startDate}&endDate=${endDate}&page=1&pageSize=10000`
        );
        const data = response.data?.data || [];
        
        // Filter by year to ensure data integrity
        const filteredData = data.filter((item: Transaction) => {
          if (!item || typeof item !== 'object') return false;
          if (item.year_head && item.year_head.year_id && item.year_head.year_id !== yearId) {
            return false;
          }
          return true;
        });

        setCumulativeTransactions(filteredData);
      } catch (error) {
        console.error('Error fetching cumulative transactions:', error);
        setCumulativeTransactions([]);
      }
    };

    fetchCumulativeTransactions();
  }, [selectedYear, selectedMonth, isAnnual, fiscalYears, axiosInstance]);

  // Fetch annual transactions (always full fiscal year for line chart)
  useEffect(() => {
    const fetchAnnualTransactions = async () => {
      const yearId = getCurrentYearId();
      if (!yearId) return;

      const { startDate, endDate } = getAnnualDateRange();
      if (!startDate || !endDate) return;

      try {
        // Fetch annual transactions with date range (always full fiscal year)
        const response = await axiosInstance.get(
          `${API_PATHS.TRANSACTIONS}?yearId=${yearId}&startDate=${startDate}&endDate=${endDate}&page=1&pageSize=10000`
        );
        const data = response.data?.data || [];
        
        // Filter by year to ensure data integrity
        const filteredData = data.filter((item: Transaction) => {
          if (!item || typeof item !== 'object') return false;
          if (item.year_head && item.year_head.year_id && item.year_head.year_id !== yearId) {
            return false;
          }
          return true;
        });

        setAnnualTransactions(filteredData);
      } catch (error) {
        console.error('Error fetching annual transactions:', error);
        setAnnualTransactions([]);
      }
    };

    fetchAnnualTransactions();
  }, [selectedYear, fiscalYears, axiosInstance]);

  // Fetch budget heads to understand parent-child relationships
  useEffect(() => {
    const fetchBudgetHeads = async () => {
      try {
        const response = await axiosInstance.get(`${API_PATHS.BUDGET_HEADS}?page=1&pageSize=10000`);
        const heads = response.data?.data || [];
        setBudgetHeads(heads);
      } catch (error) {
        console.error('Error fetching budget heads:', error);
        setBudgetHeads([]);
      }
    };

    fetchBudgetHeads();
  }, [axiosInstance]);

  // Group transactions by head, rolling up children to parents
  useEffect(() => {
    const grouped: { [key: number]: GroupedTransaction } = {};
    const headMap = new Map<number, BudgetHead>();
    
    // Create a map of head IDs to head objects
    budgetHeads.forEach((head) => {
      headMap.set(head.id, head);
    });

    // Process regular transactions
    transactions.forEach((transaction) => {
      let headId = transaction.head?.id;
      let headName = transaction.head?.head || 'Unknown';
      let particulars = transaction.head?.particulars || '';
      let headType = transaction.head?.type || transaction.type;
      
      // If this head has a child_of, find the parent and use that instead
      if (transaction.head?.child_of) {
        const parentHead = headMap.get(transaction.head.child_of);
        if (parentHead) {
          headId = parentHead.id;
          headName = parentHead.head;
          particulars = parentHead.particulars;
          headType = parentHead.type;
        }
      }

      if (!headId) return;

      if (!grouped[headId]) {
        grouped[headId] = {
          headId,
          headName,
          particulars,
          total: 0,
          cumulative: 0,
          type: headType === 'income' ? 'income' : 'expense',
        };
      }

      grouped[headId].total += transaction.amount;
    });

    // Process cumulative transactions
    cumulativeTransactions.forEach((transaction) => {
      let headId = transaction.head?.id;
      let headName = transaction.head?.head || 'Unknown';
      let particulars = transaction.head?.particulars || '';
      let headType = transaction.head?.type || transaction.type;
      
      // If this head has a child_of, find the parent and use that instead
      if (transaction.head?.child_of) {
        const parentHead = headMap.get(transaction.head.child_of);
        if (parentHead) {
          headId = parentHead.id;
          headName = parentHead.head;
          particulars = parentHead.particulars;
          headType = parentHead.type;
        }
      }

      if (!headId) return;

      if (!grouped[headId]) {
        grouped[headId] = {
          headId,
          headName,
          particulars,
          total: 0,
          cumulative: 0,
          type: headType === 'income' ? 'income' : 'expense',
        };
      }

      grouped[headId].cumulative += transaction.amount;
    });

    const groupedArray = Object.values(grouped).sort((a, b) => 
      a.headName.localeCompare(b.headName)
    );
    setGroupedTransactions(groupedArray);
  }, [transactions, cumulativeTransactions, budgetHeads]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const handlePrint = () => {
    window.print();
  };

  const prepareChartData = () => {
    const incomeData: number[] = [];
    const expenseData: number[] = [];
    const labels: string[] = [];
    groupedTransactions.forEach((group) => {
      // Skip groups with zero total
      if (group.total === 0) return;
      
      const shortName = group.particulars;
      labels.push(shortName);
      
      if (group.type === 'income') {
        incomeData.push(group.total);
        expenseData.push(0);
      } else {
        incomeData.push(0);
        expenseData.push(-group.total); // Negative for expenses
      }
    });

    return {
      labels,
      incomeData,
      expenseData,
    };
  };

  const prepareMonthlyChartData = () => {
    // Group transactions by month (always use annual transactions)
    const monthlyData: { [key: string]: { income: number; expense: number; monthLabel: string } } = {};

    annualTransactions.forEach((transaction) => {
      const date = new Date(transaction.date);
      
      // Create a key for the month (YYYY-MM format)
      const year = date.getFullYear();
      const month = date.getMonth() + 1;
      const monthKey = `${year}-${String(month).padStart(2, '0')}`;
      
      // Format month label (e.g., "April 2025")
      const monthLabel = date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = {
          income: 0,
          expense: 0,
          monthLabel,
        };
      }

      if (transaction.type === 'income') {
        monthlyData[monthKey].income += transaction.amount;
      } else {
        monthlyData[monthKey].expense += transaction.amount;
      }
    });

    // Sort by month key (chronological order)
    const sortedMonths = Object.keys(monthlyData).sort();
    
    return {
      months: sortedMonths.map(key => monthlyData[key].monthLabel),
      income: sortedMonths.map(key => monthlyData[key].income),
      expense: sortedMonths.map(key => monthlyData[key].expense),
    };
  };

  return (
    <>
      <style dangerouslySetInnerHTML={{__html: `
        @media print {
          nav,
          header,
          .no-print,
          button {
            display: none !important;
          }
          body {
            margin: 0;
            padding: 0;
          }
          main {
            padding: 0 !important;
            margin: 0 !important;
          }
          .print-content {
            padding: 10px !important;
          }
          .print-only {
            display: block !important;
            margin-bottom: 10px !important;
          }
          .space-y-8 > * + * {
            margin-top: 0.5rem !important;
          }
          .space-y-6 > * + * {
            margin-top: 0.5rem !important;
          }
          .mb-6 {
            margin-bottom: 0.5rem !important;
          }
          .mb-4 {
            margin-bottom: 0.5rem !important;
          }
          .p-4, .p-6 {
            padding: 0.75rem !important;
          }
          .md\\:p-6 {
            padding: 0.75rem !important;
          }
          table {
            page-break-inside: avoid;
          }
          .bg-gray-50 {
            background-color: #f9fafb !important;
          }
          .gap-6 {
            gap: 0.5rem !important;
          }
          svg {
            max-height: 300px !important;
          }
          .h-96 {
            height: 300px !important;
          }
          .overflow-x-auto {
            display: flex !important;
            justify-content: center !important;
          }
          .overflow-x-auto > div {
            margin: 0 auto !important;
          }
          .bg-gray-50 {
            text-align: center !important;
          }
          .bg-gray-50 > div {
            display: flex !important;
            justify-content: center !important;
          }
          .grid {
            display: flex !important;
            flex-direction: column !important;
            align-items: center !important;
          }
          .grid > div {
            width: 100% !important;
            max-width: 100% !important;
          }
        }
      `}} />
      <div className="p-6 space-y-8 print-content">
        <div className="mb-6 no-print">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">Treasurer Report</h1>
              <p className="text-gray-600">View and manage treasurer reports</p>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={handlePrint}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-blue-600 rounded-md hover:bg-blue-700"
              >
                <svg className="w-4 h-4 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"></path>
                </svg>
                Print
              </button>
            </div>
          </div>
        </div>
        <div className="print-only" style={{ display: 'none' }}>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Treasurer Report</h1>
          <p className="text-gray-600">
            Year: <span className="font-semibold">{selectedYear}</span>
            {!isAnnual && (
              <> | Month: <span className="font-semibold">{selectedMonth}</span></>
            )}
          </p>
        </div>

        <div className="no-print">
          <div className="flex items-baseline space-x-4 mt-4">image.png
          <YearSelector
            selectedYear={selectedYear}
            onYearChange={handleYearChange}
            onYearsLoaded={useCallback((years: Array<{ id: number; year: string; is_active: boolean; is_deleted: boolean }>) => {
              setFiscalYears(years);
              if (years.length > 0 && !years.find(y => y.year === selectedYear)) {
                const activeYear = years.find(y => y.is_active) || years[0];
                setSelectedYear(activeYear.year);
              }
            }, [selectedYear])}
            className="w-48"
          />
          
          <div className="flex items-center space-x-4">
            <label className="text-sm font-medium text-gray-700">
              Month:
            </label>
            <Dropdown
              label={
                <span className="flex items-center space-x-2">
                  <span>{selectedMonth}</span>
                </span>
              }
              className="w-48"
              disabled={isAnnual}
            >
              {MONTHS.map((month) => (
                <DropdownItem key={month} onClick={() => handleMonthChange(month)}>
                  {month}
                </DropdownItem>
              ))}
            </Dropdown>
          </div>

          <div className="flex items-center space-x-2">
            <ToggleSwitch
              checked={isAnnual}
              label="Annual"
              onChange={(checked: boolean) => setIsAnnual(checked)}
              className={isAnnual ? '[&_label]:text-black [&_label]:font-medium' : ''}
            />
          </div>
        </div>
        </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        {isLoading ? (
          <div className="text-center text-gray-500 py-8">
            <div className="flex items-center justify-center space-x-2">
              <svg className="animate-spin h-5 w-5 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span>Loading transactions...</span>
            </div>
          </div>
        ) : groupedTransactions.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            <p>No transactions found for the selected period.</p>
            <p className="text-sm mt-2">Year: {selectedYear} {!isAnnual && `| Month: ${selectedMonth}`}</p>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="text-sm text-gray-600 mb-4">
              <p>
                Year: <span className="font-semibold">{selectedYear}</span>
                {!isAnnual && (
                  <> | Month: <span className="font-semibold">{selectedMonth}</span></>
                )}
              </p>
            </div>
            
            {/* Charts */}
            {groupedTransactions.length > 0 && transactions.length > 0 && (() => {
              const chartData = prepareChartData();
              const monthlyData = prepareMonthlyChartData();
              return (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6 ">
                  {/* Bar Chart */}
                  <div className="bg-gray-50 rounded-lg p-4 md:p-6">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">Transaction Summary by Head</h2>
                    <div className="overflow-x-auto">
                      <div >
                        <BarChart
                          // width={chartWidth}
                          height={400}
                          series={[
                            {
                              data: chartData.incomeData,
                              label: 'Income',
                              color: '#10b981'
                            },
                            {
                              data: chartData.expenseData,
                              label: 'Expense',
                              color: '#ef4444',
                            },
                          ]}
                          // barLabel={(v) => (v.value !=0) ? `${Math.sqrt(v.value*v.value)}` : undefined}
                          yAxis={[{ data: chartData.labels,width: 200, scaleType: 'band' }]}
                          xAxis={[{ 
                            label: 'Amount (₹)',
                            valueFormatter: (value: number) => {
                              const absValue = Math.abs(value);
                              return new Intl.NumberFormat("en-IN", {
                                style: "currency",
                                currency: "INR",
                                minimumFractionDigits: 0,
                                maximumFractionDigits: 0,
                              }).format(absValue);
                            }
                          }]}
                          layout='horizontal'
                          grid={{ vertical: true }}

                          // margin={{ left: 80, right: 30, top: 30, bottom: 100 }}
                        />
                      </div>
                    </div>
                    <div className="flex items-center justify-center space-x-6 mt-4">
                      <div className="flex items-center space-x-2">
                        <div className="w-4 h-4 bg-green-500 rounded"></div>
                        <span className="text-sm text-gray-700">Income</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="w-4 h-4 bg-red-500 rounded"></div>
                        <span className="text-sm text-gray-700">Expense</span>
                      </div>
                    </div>
                  </div>

                  {/* Line Chart - Monthly */}
                  <div className="bg-gray-50 rounded-lg p-4 ">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">Monthly Transaction Trends</h2>
                    {monthlyData.months.length === 0 ? (
                      <div className="h-96 flex items-center justify-center text-gray-500">
                        No monthly data available
                      </div>
                    ) : (
                      <>
                        <div className="overflow-x-auto">
                          <div style={{ minWidth: `${Math.max(600, monthlyData.months.length * 80)}px` }}>
                            <LineChart
                              width={Math.max(600, monthlyData.months.length * 80)}
                              height={400}
                              series={[
                                {
                                  data: monthlyData.income,
                                  label: 'Income',
                                  color: '#10b981'
                                },
                                {
                                  data: monthlyData.expense,
                                  label: 'Expense',
                                  color: '#ef4444',
                                },
                              ]}
                              xAxis={[{ 
                                data: monthlyData.months, 
                                scaleType: 'point',
                                label: 'Month'
                              }]}
                              yAxis={[{ width: 100 }]}
                              grid={{ vertical: true, horizontal: true }}
                              // margin={{ left: 100, right: 30, top: 30, bottom: 100 }}
                            />
                          </div>
                        </div>
                        <div className="flex items-center justify-center space-x-6 mt-4">
                          <div className="flex items-center space-x-2">
                            <div className="w-4 h-4 bg-green-500 rounded"></div>
                            <span className="text-sm text-gray-700">Income</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <div className="w-4 h-4 bg-red-500 rounded"></div>
                            <span className="text-sm text-gray-700">Expense</span>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              );
            })()}

            <div className="overflow-x-auto">
              <Table>
                <TableHead>
                  <TableRow>
                    <TableHeadCell>Head</TableHeadCell>
                    <TableHeadCell>Particulars</TableHeadCell>
                    <TableHeadCell className="text-right">Total Amount</TableHeadCell>
                    <TableHeadCell className="text-right">Cumulative</TableHeadCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {groupedTransactions.map((group) => (
                    <TableRow key={group.headId} className="hover:bg-gray-50">
                      <TableCell className="font-medium text-gray-900">
                        {group.headName}
                      </TableCell>
                      <TableCell className="text-gray-700">
                        {group.particulars || '-'}
                      </TableCell>
                      <TableCell className={`text-right font-bold ${group.type === 'expense' ? 'text-red-600' : 'text-green-600'}`}>
                        {formatCurrency(group.total)}
                      </TableCell>
                      <TableCell className={`text-right font-bold ${group.type === 'expense' ? 'text-red-600' : 'text-green-600'}`}>
                        {formatCurrency(group.cumulative)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <div className="bg-gray-50 px-6 py-4 border border-gray-200 rounded-lg">
              <div className="flex items-center justify-between">
                <p className="text-lg font-semibold text-gray-900">Grand Total</p>
                <div className="flex items-center space-x-8">
                  <div className="text-right">
                    <p className="text-sm text-gray-600 mb-1">Total Amount</p>
                    <p className="text-lg font-bold text-gray-900">
                      {formatCurrency(groupedTransactions.reduce((sum, group) => {
                        if (group.type === 'income') {
                          return sum + group.total;
                        } else {
                          return sum - group.total;
                        }
                      }, 0))}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-600 mb-1">Cumulative</p>
                    <p className="text-lg font-bold text-gray-900">
                      {formatCurrency(groupedTransactions.reduce((sum, group) => {
                        if (group.type === 'income') {
                          return sum + group.cumulative;
                        } else {
                          return sum - group.cumulative;
                        }
                      }, 0))}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
      </div>
    </>
  );
}

