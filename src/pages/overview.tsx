import { useState, useEffect } from 'react';
import { LineChart, BarChart, PieChart } from '@mui/x-charts';
import useAxios from '../context/useAxios';
import { API_PATHS } from '../utils/apiPath';

export default function Overview() {
  const [offertoryData, setOffertoryData] = useState<any[]>([]);
  const [transactionData, setTransactionData] = useState<any[]>([]);
  const [budgetData, setBudgetData] = useState<any[]>([]);
  const [balanceData, setBalanceData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const axiosInstance = useAxios();

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        // Fetch offertory data
        const offertoryResponse = await axiosInstance.get(`${API_PATHS.GET_OFFERTORY}?page=1&pageSize=100`);
        setOffertoryData(offertoryResponse.data?.data || []);

        // Fetch transaction data
        const transactionResponse = await axiosInstance.get(`${API_PATHS.TRANSACTIONS}?page=1&pageSize=500`);
        setTransactionData(transactionResponse.data?.data || []);

        // Fetch budget data (expenses)
        const budgetResponse = await axiosInstance.get(`${API_PATHS.GET_BUDGET('expense', 1, 100)}&year_id=1`);
        const fullBudgetData = budgetResponse.data?.data || [];
        // Extract only parent budgets from index 0 (children are in other indices)
        const parentBudgets = Array.isArray(fullBudgetData) && fullBudgetData[0]?.budgets ? fullBudgetData[0].budgets : [];
        setBudgetData(parentBudgets);

        // Fetch balance data
        const balanceResponse = await axiosInstance.get(API_PATHS.GET_BALANCE);
        setBalanceData(balanceResponse.data?.data || { balance: 0, bank_balance: 0 });
      } catch (error) {
        console.error('Error fetching overview data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [axiosInstance]);

  const prepareOffertoryChartData = () => {
    // Sort by date and take the last 7 entries for the mini chart
    const sortedData = [...offertoryData]
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .slice(-12);

    return {
      dates: sortedData.map(item => {
        const date = new Date(item.date);
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      }),
      amounts: sortedData.map(item => item.total_amount || 0)
    };
  };

  const getMonthLabel = (date: Date) => {
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return monthNames[date.getMonth()];
  };

  const prepareIncomeVsExpenseChartData = () => {
    const monthlyData = transactionData.reduce((acc: any, item: any) => {
      const date = new Date(item.date);
      const monthYear = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const monthLabel = getMonthLabel(date);
      
      if (!acc[monthYear]) {
        acc[monthYear] = { monthYear, monthLabel, income: 0, expense: 0, sortKey: date.getFullYear() * 12 + date.getMonth() };
      }
      
      if (item.type === 'income') {
        acc[monthYear].income += (item.amount || 0);
      } else if (item.type === 'expense') {
        acc[monthYear].expense += (item.amount || 0);
      }
      
      return acc;
    }, {});

    // Get all months that have data and find the date range
    const sortedMonths = Object.values(monthlyData).sort((a: any, b: any) => {
      return a.sortKey - b.sortKey;
    });

    // If we have data, show all months from first to last (no limit)
    return {
      months: sortedMonths.map((d: any) => d.monthLabel),
      income: sortedMonths.map((d: any) => d.income),
      expense: sortedMonths.map((d: any) => d.expense)
    };
  };

  const prepareBudgetChartData = () => {
    // Filter out any items with child_of (safety check, though we should only have parents)
    // Sort by budgeted amount, get top 20, then calculate spent and remaining
    const sortedBudgetData = [...budgetData]
      .filter(item => item && item.child_of == null)
      .sort((a, b) => (b.budgeted || 0) - (a.budgeted || 0))
      .slice(0, 20);

    return {
      categories: sortedBudgetData.map(item => {
        // Prioritize particulars field, fallback to head, then 'Unnamed'
        return item.particulars || item.particular || item.head || 'Unnamed';
      }),
      budgeted: sortedBudgetData.map(item => item.budgeted || 0),
      spent: sortedBudgetData.map(item => item.actuals || 0),
      remaining: sortedBudgetData.map(item => (item.budgeted || 0) - (item.actuals || 0))
    };
  };

  const prepareTransactionByHeadData = () => {
    // Group transactions by head and sum the amounts, only include transactions where child_of is null
    const headData = transactionData
      .filter((transaction: any) => {
        // Only include transactions where child_of is null or undefined
        return transaction.child_of == null;
      })
      .reduce((acc: any, transaction: any) => {
        const headName = transaction.head?.particulars || transaction.head?.head || 'Other';
        if (!acc[headName]) {
          acc[headName] = 0;
        }
        acc[headName] += Math.abs(transaction.amount || 0);
        return acc;
      }, {});

    // Convert to array and sort by amount descending, then take top 10
    const sortedHeads = Object.entries(headData)
      .sort((a: any, b: any) => b[1] - a[1])
      .slice(0, 10);

    // Generate colors dynamically based on number of categories
    const colors = [
      '#3B82F6', '#10B981', '#EF4444', '#F59E0B',
      '#8B5CF6', '#EC4899', '#14B8A6', '#6366F1',
      '#F97316', '#06B6D4', '#84CC16', '#A855F7',
      '#EAB308', '#22C55E', '#F43F5E', '#8B5A2B',
      '#64748B', '#0EA5E9', '#0D9488', '#7C3AED'
    ];

    return {
      labels: sortedHeads.map(([name]) => name),
      values: sortedHeads.map(([, value]) => value),
      colors: colors.slice(0, sortedHeads.length)
    };
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('hi-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  };

  const offertoryChart = prepareOffertoryChartData();
  const incomeVsExpenseChart = prepareIncomeVsExpenseChartData();
  const budgetChart = prepareBudgetChartData();
  const transactionByHeadChart = prepareTransactionByHeadData();

  // Calculate totals
  const totalOffertory = offertoryData.reduce((sum, item) => sum + (item.total_amount || 0), 0);
  const totalExpenditures = transactionData
    .filter(item => item.type === 'expense')
    .reduce((sum, item) => sum + (item.amount || 0), 0);
  const totalIncome = transactionData
    .filter(item => item.type === 'income')
    .reduce((sum, item) => sum + (item.amount || 0), 0);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Overview</h1>

      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <svg className="animate-spin h-8 w-8 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Offertories Card */}
          <div className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Offertories</h3>
              <p className="text-3xl font-bold text-gray-900 mb-4">{formatCurrency(totalOffertory)}</p>
              <div className="w-full h-48">
                {offertoryChart.amounts.length === 0 || offertoryChart.dates.length === 0 || offertoryChart.amounts.length !== offertoryChart.dates.length ? (
                  <div className="h-full flex items-center justify-center text-gray-400 text-sm">
                    No data
                  </div>
                ) : (
                  <LineChart
                    width={400}
                    height={192}
                    series={[
                      {
                        data: offertoryChart.amounts,
                        color: '#3B82F6',
                        area: true,
                      }
                    ]}
                    xAxis={[{ data: offertoryChart.dates, scaleType: 'point' }]}
                    grid={{ vertical: false, horizontal: false }}
                    yAxis={[]}
                    margin={{ left: 0, right: 0, top: 0, bottom: 0 }}
                  />
                )}
              </div>
            </div>
          </div>

          {/* Income vs Expenses Card */}
          <div className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Income vs Expenses</h3>
              <p className="text-3xl font-bold text-gray-900 mb-4">{formatCurrency(totalIncome - totalExpenditures)}</p>
              <div className="w-full h-48 overflow-x-auto">
                {incomeVsExpenseChart.months.length === 0 || incomeVsExpenseChart.income.length === 0 || incomeVsExpenseChart.expense.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-gray-400 text-sm">
                    No data
                  </div>
                ) : (
                  <div style={{ minWidth: `${Math.max(600, incomeVsExpenseChart.months.length * 50)}px` }}>
                    <LineChart
                      width={Math.max(600, incomeVsExpenseChart.months.length * 50)}
                      height={192}
                      series={[
                        {
                          data: incomeVsExpenseChart.income,
                          color: '#10B981',
                          area: true,
                        },
                        {
                          data: incomeVsExpenseChart.expense,
                          color: '#EF4444',
                          area: true,
                        }
                      ]}
                      xAxis={[{ data: incomeVsExpenseChart.months, scaleType: 'point' }]}
                      grid={{ vertical: false, horizontal: false }}
                      yAxis={[]}
                      margin={{ left: 20, right: 20, top: 0, bottom: 30 }}
                    />
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Balance Card */}
          <div className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Balance</h3>
              <div className="space-y-3">
                <div>
                  <p className="text-xs text-gray-500 mb-1">Cash Balance</p>
                  <p className="text-3xl font-bold text-green-600">
                    {balanceData ? formatCurrency(balanceData.cash_balance || 0) : '₹0'}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">Bank Balance</p>
                  <p className="text-3xl font-bold text-blue-600">
                    {balanceData ? formatCurrency(balanceData.bank_balance || 0) : '₹0'}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">Bank Statement Balance</p>
                  <p className="text-3xl font-bold text-purple-600">
                    {balanceData ? formatCurrency(balanceData.bank_statement_balance || 0) : '₹0'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Second Row - Budget Chart */}
      {!isLoading && (
        <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Budget Head/Category Spend vs Remaining */}
          <div className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden lg:col-span-2">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Budget Status</h3>
              {budgetChart.categories.length === 0 ? (
                <div className="h-64 flex items-center justify-center text-gray-500">
                  No budget data available
                </div>
              ) : (
                <div className="h-64">
                  <BarChart
                    series={[
                      {
                        data: budgetChart.spent,
                        label: 'Spent',
                        color: '#EF4444',
                        stack: 'total'
                      },
                      {
                        data: budgetChart.remaining,
                        label: 'Remaining',
                        color: '#10B981',
                        stack: 'total'
                      }
                    ]}
                    xAxis={[{ data: budgetChart.categories, scaleType: 'band' }]}
                    grid={{ vertical: true, horizontal: true }}
                    margin={{ left: 80, right: 30, top: 30, bottom: 100 }}
                  />
                </div>
              )}
            </div>
          </div>

          {/* Transactions by Head Pie Chart */}
          <div className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Transactions by Head</h3>
              {transactionByHeadChart.values.length === 0 ? (
                <div className="h-64 flex items-center justify-center text-gray-500">
                  No transaction data available
                </div>
              ) : (
                <div className="h-64">
                  <PieChart
                    series={[
                      {
                        data: transactionByHeadChart.labels.map((label, index) => ({
                          id: index,
                          value: Number(transactionByHeadChart.values[index]) || 0,
                          label: label,
                          color: transactionByHeadChart.colors[index]
                        })),
                        innerRadius: 30,
                        outerRadius: 100,
                        paddingAngle: 2,
                        cornerRadius: 5
                      }
                    ]}
                    margin={{ top: 10, right: 10, bottom: 10, left: 10 }}
                    width={350}
                    height={250}
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
