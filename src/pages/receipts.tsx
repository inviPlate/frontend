import { Button, Table, TableBody, TableCell, TableHead, TableHeadCell, TableRow } from 'flowbite-react';
import { useState, useEffect } from 'react';
import useAxios from '../context/useAxios';
import { API_PATHS } from '../utils/apiPath';

interface ReceiptData {
  id: number;
  name: string;
  amount: number;
  status: 'sent' | 'pending' | 'completed';
  date: string;
  pdf_url: string;
}

export default function Receipts() {
  const [activeTab, setActiveTab] = useState('all');
  const [receiptsData, setReceiptsData] = useState<ReceiptData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [isPdfModalOpen, setIsPdfModalOpen] = useState(false);
  const [selectedReceipt, setSelectedReceipt] = useState<ReceiptData | null>(null);
  
  const axios = useAxios();

  // Fetch receipts from API
  useEffect(() => {
    const fetchReceipts = async () => {
      setIsLoading(true);
      setError('');
      
      try {
        const response = await axios.get(API_PATHS.RECEIPTS);
        setReceiptsData(response.data.data || []);
      } catch (error: any) {
        console.error('Error fetching receipts:', error);
        setError(error.response?.data?.message || error.message || 'Failed to fetch receipts');
        // Fallback to empty array on error
        setReceiptsData([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchReceipts();
  }, [axios]);

  const getFilteredData = () => {
    if (activeTab === 'all') return receiptsData;
    return receiptsData.filter(receipt => receipt.status === activeTab);
  };

  const getStatusBadge = (status: string) => {
    const baseClasses = "px-2 py-1 text-xs font-medium rounded-md";
    switch (status) {
      case 'sent':
        return `${baseClasses} bg-blue-100 text-blue-800`;
      case 'pending':
        return `${baseClasses} bg-yellow-100 text-yellow-800`;
      case 'completed':
        return `${baseClasses} bg-green-100 text-green-800`;
      default:
        return `${baseClasses} bg-gray-100 text-gray-800`;
    }
  };

  const handleView = (id: number) => {
    const receipt = receiptsData.find(r => r.id === id);
    if (receipt && receipt.pdf_url) {
      setSelectedReceipt(receipt);
      setIsPdfModalOpen(true);
    } else {
      console.error('Receipt not found or no PDF URL available');
    }
  };

  const closePdfModal = () => {
    setIsPdfModalOpen(false);
    setSelectedReceipt(null);
  };

  const handleSend = (id: number) => {
    console.log('Send receipt:', id);
    // Add send logic here
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const tabs = [
    { id: 'all', label: 'All', icon: '📋' },
    { id: 'sent', label: 'Sent', icon: '📤' },
    { id: 'pending', label: 'Pending', icon: '⏳' }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="p-6">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Receipts</h1>
          <p className="text-gray-600">View and organize your receipts here.</p>
        </div>

        {/* Custom Tabs */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          {/* Tab Navigation */}
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8 px-6" aria-label="Tabs">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <span className="text-lg">{tab.icon}</span>
                  <span>{tab.label}</span>
                </button>
              ))}
            </nav>
          </div>

          {/* Tab Content */}
          <div className="p-4">
            {isLoading ? (
              <div className="text-center py-8">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <p className="mt-2 text-sm text-gray-500">Loading receipts...</p>
              </div>
            ) : error ? (
              <div className="text-center py-8">
                <svg className="mx-auto h-12 w-12 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-gray-900">Error loading receipts</h3>
                <p className="mt-1 text-sm text-gray-500">{error}</p>
                <button 
                  onClick={() => window.location.reload()} 
                  className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Try Again
                </button>
              </div>
            ) : (
              <ReceiptsTable 
                data={getFilteredData()} 
                onView={handleView} 
                onSend={handleSend} 
                formatCurrency={formatCurrency}
                getStatusBadge={getStatusBadge}
              />
            )}
          </div>
        </div>
      </div>

      {/* PDF Viewer Modal */}
      {isPdfModalOpen && selectedReceipt && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[95vh] flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">
                Receipt: {selectedReceipt.name}
              </h3>
              <button
                onClick={closePdfModal}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Modal Body - PDF Viewer */}
            <div className="flex-1 p-2 overflow-hidden">
              <div className="w-full h-full border border-gray-300 rounded-lg overflow-hidden min-h-[80vh]">
                <iframe
                  src={selectedReceipt.pdf_url}
                  className="w-full h-full min-h-[75vh]"
                  title={`Receipt for ${selectedReceipt.name}`}
                />
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-between p-4 border-t border-gray-200 bg-gray-50">
              <div className="text-sm text-gray-600">
                Amount: {formatCurrency(selectedReceipt.amount)} | 
                Date: {new Date(selectedReceipt.date).toLocaleDateString()} | 
                Status: <span className={getStatusBadge(selectedReceipt.status)}>
                  {selectedReceipt.status.charAt(0).toUpperCase() + selectedReceipt.status.slice(1)}
                </span>
              </div>
              <div className="flex space-x-2">
                <Button
                  color="gray"
                  onClick={closePdfModal}
                >
                  Close
                </Button>
                <Button
                  color="blue"
                  onClick={() => window.open(selectedReceipt.pdf_url, '_blank')}
                >
                  Open in New Tab
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Receipts Table Component
interface ReceiptsTableProps {
  data: ReceiptData[];
  onView: (id: number) => void;
  onSend: (id: number) => void;
  formatCurrency: (amount: number) => string;
  getStatusBadge: (status: string) => string;
}

function ReceiptsTable({ data, onView, onSend, formatCurrency, getStatusBadge }: ReceiptsTableProps) {
  if (data.length === 0) {
    return (
      <div className="text-center py-8">
        <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
        <h3 className="mt-2 text-sm font-medium text-gray-900">No receipts</h3>
        <p className="mt-1 text-sm text-gray-500">No receipts found for this tab.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHead>
          <TableRow>
            <TableHeadCell className="bg-gray-50">Name</TableHeadCell>
            <TableHeadCell className="bg-gray-50">Amount</TableHeadCell>
            <TableHeadCell className="bg-gray-50">Status</TableHeadCell>
            <TableHeadCell className="bg-gray-50">Date</TableHeadCell>
            <TableHeadCell className="bg-gray-50">Actions</TableHeadCell>
          </TableRow>
        </TableHead>
        <TableBody className="divide-y">
          {data.map((receipt) => (
            <TableRow key={receipt.id} className="bg-white hover:bg-gray-50">
              <TableCell className="whitespace-nowrap font-medium text-gray-900">
                {receipt.name}
              </TableCell>
              <TableCell className="whitespace-nowrap text-gray-900">
                {formatCurrency(receipt.amount)}
              </TableCell>
              <TableCell className="whitespace-nowrap">
                <span className={getStatusBadge(receipt.status)}>
                  {receipt.status.charAt(0).toUpperCase() + receipt.status.slice(1)}
                </span>
              </TableCell>
              <TableCell className="whitespace-nowrap text-gray-500">
                {new Date(receipt.date).toLocaleDateString()}
              </TableCell>
              <TableCell className="whitespace-nowrap">
                <div className="flex space-x-2">
                  <Button 
                    size="xs" 
                    color="gray"
                    onClick={() => onView(receipt.id)}
                    className="px-3 py-1"
                  >
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                    View
                  </Button>
                  <Button 
                    size="xs" 
                    color="blue"
                    onClick={() => onSend(receipt.id)}
                    className="px-3 py-1"
                    disabled={receipt.status === 'sent'}
                  >
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    Send
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
