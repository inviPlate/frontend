import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import useAxios from "../context/useAxios";
import { API_PATHS } from "../utils/apiPath";

interface BalanceData {
  cash_balance: number;
  bank_balance: number;
  bank_statement_balance: number;
}

interface Deposit {
  id: number;
  deposit_value: number;
  maturity_value: number;
  deposit_date: string;
  maturity_date: string;
  rate_of_interest: number;
  is_active: boolean;
}

interface Advance {
  id: number;
  amount: number;
  towards: string;
  is_recovered?: boolean;
}

export default function BalanceSheet() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const year = searchParams.get("year") || "";
  const yearId = searchParams.get("yearId") || "";

  const [isLoading, setIsLoading] = useState(true);
  const [balance, setBalance] = useState<BalanceData>({
    cash_balance: 0,
    bank_balance: 0,
    bank_statement_balance: 0,
  });
  const [deposits, setDeposits] = useState<Deposit[]>([]);
  const [advances, setAdvances] = useState<Advance[]>([]);
  const [loans, setLoans] = useState<number>(0); // Placeholder for loans

  const axiosInstance = useAxios();

  useEffect(() => {
    const fetchBalanceSheetData = async () => {
      if (!year || !yearId) {
        console.warn("Year or YearId missing from query params");
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      try {
        // Fetch balance (cash in hand and account balance)
        const balanceResponse = await axiosInstance.get(API_PATHS.GET_BALANCE);
        setBalance(balanceResponse.data.data || {
          cash_balance: 0,
          bank_balance: 0,
          bank_statement_balance: 0,
        });

        // Fetch deposits
        const depositsResponse = await axiosInstance.get(
          `${API_PATHS.GET_DEPOSITS}?page=1&pageSize=1000&isActive=true`
        );
        setDeposits(depositsResponse.data.data || []);

        // Fetch advances
        const advancesResponse = await axiosInstance.get(API_PATHS.GET_ADVANCES);
        setAdvances(advancesResponse.data.data || []);

        // TODO: Fetch loans when API endpoint is available
        // For now, loans is set to 0
        setLoans(0);
      } catch (error) {
        console.error("Error fetching balance sheet data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchBalanceSheetData();
  }, [year, yearId, axiosInstance]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Calculate totals
  const currentAssetsTotal =
    balance.cash_balance + balance.bank_balance;
  const depositsTotal = deposits.reduce(
    (sum, deposit) => sum + (deposit.deposit_value || 0),
    0
  );
  const advancesTotal = advances
    .filter((advance) => !advance.is_recovered)
    .reduce((sum, advance) => sum + (advance.amount || 0), 0);
  const fixedAssetsTotal = depositsTotal + advancesTotal;
  const totalAssets = currentAssetsTotal + fixedAssetsTotal;
  const generalFund = totalAssets;
  const totalLiabilities = loans + generalFund;

  const handlePrint = () => {
    window.print();
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
            padding: 20px !important;
          }
          .print-only {
            display: block !important;
            margin-bottom: 20px;
          }
          table {
            page-break-inside: avoid;
          }
        }
      `}} />
      <div className="p-6 space-y-8 print-content">
        <div className="mb-6 no-print">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">Balance Sheet</h1>
              <p className="text-gray-600">
                Balance Sheet for Fiscal Year: <span className="font-semibold">{year}</span>
              </p>
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
              <button
                onClick={() => navigate(-1)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Back
              </button>
            </div>
          </div>
        </div>
        <div className="print-only" style={{ display: 'none' }}>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Balance Sheet</h1>
          <p className="text-gray-600">
            Balance Sheet for Fiscal Year: <span className="font-semibold">{year}</span>
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        {isLoading ? (
          <div className="text-center text-gray-500 py-8">
            <div className="flex items-center justify-center space-x-2">
              <svg
                className="animate-spin h-5 w-5 text-blue-600"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              <span>Loading balance sheet data...</span>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b-2 border-gray-300">
                  <th className="text-left p-4 font-semibold text-gray-900 w-1/4">
                    Assets
                  </th>
                  <th className="text-right p-4 font-semibold text-gray-900 w-1/4">
                    Amount (₹)
                  </th>
                  <th className="w-8"></th>
                  <th className="text-left p-4 font-semibold text-gray-900 w-1/4">
                    Liabilities
                  </th>
                  <th className="text-right p-4 font-semibold text-gray-900 w-1/4">
                    Amount (₹)
                  </th>
                </tr>
              </thead>
              <tbody>
                {/* Assets Section */}
                <tr className="bg-gray-100 border-b border-gray-200">
                  <td className="p-0 font-semibold text-gray-900">Assets</td>
                  <td className="p-0"></td>
                  <td className="p-0"></td>
                  <td className="p-0 pl-8 font-bold text-gray-900">General Fund</td>
                  <td className="p-0 text-right font-bold text-gray-900">
                    {formatCurrency(generalFund)}
                  </td>
                </tr>

                {/* Current Assets */}
                <tr className="border-b border-gray-200">
                  <td className="p-0 pl-8 font-medium text-gray-800">
                    Current Assets
                  </td>
                  <td className="p-0"></td>
                  <td className="p-0"></td>
                  <td className="p-0"></td>
                  <td className="p-0"></td>
                </tr>
                <tr className="border-b border-gray-200 hover:bg-gray-50">
                  <td className="p-0 pl-12 text-gray-700">Cash in Hand</td>
                  <td className="p-0 text-right font-medium text-gray-900">
                    {formatCurrency(balance.cash_balance)}
                  </td>
                  <td className="p-0"></td>
                  <td className="p-0"></td>
                  <td className="p-0"></td>
                </tr>
                <tr className="border-b border-gray-200 hover:bg-gray-50">
                  <td className="p-0 pl-12 text-gray-700">Account Balance</td>
                  <td className="p-0 text-right font-medium text-gray-900">
                    {formatCurrency(balance.bank_balance)}
                  </td>
                  <td className="p-0"></td>
                  <td className="p-0"></td>
                  <td className="p-0"></td>
                </tr>
                <tr className="bg-gray-50 border-b-2 border-gray-300">
                  <td className="p-0 pl-8 font-semibold text-gray-900">
                    Total Current Assets
                  </td>
                  <td className="p-0 text-right font-bold text-gray-900">
                    {formatCurrency(currentAssetsTotal)}
                  </td>
                  <td className="p-0"></td>
                  <td className="p-0"></td>
                  <td className="p-0"></td>
                </tr>

                {/* Fixed Assets */}
                <tr className="border-b border-gray-200">
                  <td className="p-0 pl-8 font-medium text-gray-800 mt-4">
                    Fixed Assets
                  </td>
                  <td className="p-0"></td>
                  <td className="p-0"></td>
                  <td className="p-0"></td>
                  <td className="p-0"></td>
                </tr>
                <tr className="border-b border-gray-200">
                  <td className="p-0 pl-12 font-medium text-gray-800">
                    Deposits
                  </td>
                  <td className="p-0"></td>
                  <td className="p-0"></td>
                  <td className="p-0"></td>
                  <td className="p-0"></td>
                </tr>
                {deposits.length > 0 ? (
                  deposits.map((deposit) => (
                    <tr
                      key={deposit.id}
                      className="border-b border-gray-200 hover:bg-gray-50"
                    >
                      <td className="p-0 pl-16 text-gray-700">
                        Deposit #{deposit.id} ({deposit.rate_of_interest}%)
                      </td>
                      <td className="p-0 text-right font-medium text-gray-900">
                        {formatCurrency(deposit.deposit_value)}
                      </td>
                      <td className="p-0"></td>
                      <td className="p-0"></td>
                      <td className="p-0"></td>
                    </tr>
                  ))
                ) : (
                  <tr className="border-b border-gray-200">
                    <td className="p-0 pl-16 text-gray-500 italic">
                      No deposits
                    </td>
                    <td className="p-0"></td>
                    <td className="p-0"></td>
                    <td className="p-0"></td>
                    <td className="p-0"></td>
                  </tr>
                )}
                <tr className="bg-gray-50 border-b border-gray-200">
                  <td className="p-0 pl-12 font-semibold text-gray-900">
                    Total Deposits
                  </td>
                  <td className="p-0 text-right font-bold text-gray-900">
                    {formatCurrency(depositsTotal)}
                  </td>
                  <td className="p-0"></td>
                  <td className="p-0"></td>
                  <td className="p-0"></td>
                </tr>
                <tr className="border-b border-gray-200">
                  <td className="p-0 pl-12 font-medium text-gray-800">
                    Advances
                  </td>
                  <td className="p-0"></td>
                  <td className="p-0"></td>
                  <td className="p-0"></td>
                  <td className="p-0"></td>
                </tr>
                {advances.filter((advance) => !advance.is_recovered).length >
                0 ? (
                  advances
                    .filter((advance) => !advance.is_recovered)
                    .map((advance) => (
                      <tr
                        key={advance.id}
                        className="border-b border-gray-200 hover:bg-gray-50"
                      >
                        <td className="p-0 pl-16 text-gray-700">
                          {advance.towards || `Advance #${advance.id}`}
                        </td>
                        <td className="p-0 text-right font-medium text-gray-900">
                          {formatCurrency(advance.amount)}
                        </td>
                        <td className="p-0"></td>
                        <td className="p-0"></td>
                        <td className="p-0"></td>
                      </tr>
                    ))
                ) : (
                  <tr className="border-b border-gray-200">
                    <td className="p-0 pl-16 text-gray-500 italic">
                      No advances
                    </td>
                    <td className="p-0"></td>
                    <td className="p-0"></td>
                    <td className="p-0"></td>
                    <td className="p-0"></td>
                  </tr>
                )}
                <tr className="bg-gray-50 border-b border-gray-200">
                  <td className="p-0 pl-12 font-semibold text-gray-900">
                    Total Advances
                  </td>
                  <td className="p-0 text-right font-bold text-gray-900">
                    {formatCurrency(advancesTotal)}
                  </td>
                  <td className="p-0"></td>
                  <td className="p-0"></td>
                  <td className="p-0"></td>
                </tr>
                <tr className="bg-gray-50 border-b-2 border-gray-300">
                  <td className="p-0 pl-8 font-semibold text-gray-900">
                    Total Fixed Assets
                  </td>
                  <td className="p-0 text-right font-bold text-gray-900">
                    {formatCurrency(fixedAssetsTotal)}
                  </td>
                  <td className="p-0"></td>
                  <td className="p-0"></td>
                  <td className="p-0"></td>
                </tr>

                {/* Liabilities Section */}
                <tr className="border-b border-gray-200 hover:bg-gray-50">
                  <td className="p-0"></td>
                  <td className="p-0"></td>
                  <td className="p-0"></td>
                </tr>
                <tr className="border-b border-gray-200">
                  <td className="p-0"></td>
                  <td className="p-0"></td>
                  <td className="p-0"></td>
                  <td className="p-0 pl-8 font-medium text-gray-800">Loans</td>
                  <td className="p-0 text-right font-medium text-gray-900">
                    {formatCurrency(loans)}
                  </td>
                </tr>

                {/* Total Row */}
                <tr className="bg-blue-50 border-t-4 border-blue-500">
                  <td className="p-0 font-bold text-lg text-gray-900">
                    Total Assets
                  </td>
                  <td className="p-0 text-right font-bold text-lg text-gray-900">
                    {formatCurrency(totalAssets)}
                  </td>
                  <td className="p-0"></td>
                  <td className="p-0 font-bold text-lg text-gray-900">
                    Total Liabilities
                  </td>
                  <td className="p-0 text-right font-bold text-lg text-gray-900">
                    {formatCurrency(totalLiabilities)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        )}
        </div>
      </div>
    </>
  );
}

