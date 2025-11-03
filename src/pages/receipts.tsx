import { Button, Table, TableBody, TableCell, TableHead, TableHeadCell, TableRow } from 'flowbite-react';
import { useState, useEffect } from 'react';
import useAxios from '../context/useAxios';
import { API_PATHS } from '../utils/apiPath';

interface ReceiptData {
  id: number;
  name: string;
  amount: number;
  status: 'sent' | 'pending' | 'completed' | 'created';
  date: string;
  pdf_url: string;
  send_to_email: string;
  transaction_id: number;
  tithe_id: number | null;
  year_head_id: number;
  member_id: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  transaction_description: string;
  member: {
    id: number;
    name: string;
    email: string;
    phone_number: string;
    is_active: boolean;
  };
}

export default function Receipts() {
  const [activeTab, setActiveTab] = useState('all');
  const [receiptsData, setReceiptsData] = useState<ReceiptData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [isPdfModalOpen, setIsPdfModalOpen] = useState(false);
  const [selectedReceipt, setSelectedReceipt] = useState<ReceiptData | null>(null);
  const [regeneratingReceipts, setRegeneratingReceipts] = useState<Set<number>>(new Set());
  const [successMessage, setSuccessMessage] = useState<string>('');
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [hasNext, setHasNext] = useState(false);
  const [hasPrev, setHasPrev] = useState(false);
  const [pageSize] = useState(10);
  
  const axios = useAxios();

  // Fetch receipts from API
  const fetchReceipts = async (page: number = 1) => {
    setIsLoading(true);
    setError('');
    
    try {
      const response = await axios.get(`${API_PATHS.RECEIPTS}?page=${page}&pageSize=${pageSize}`);
      console.log('Receipts API Response:', response.data);
      
      const data = response.data?.data || [];
      const pagination = response.data?.pagination || {};
      
      setReceiptsData(data);
      setTotalItems(pagination.totalItems || 0);
      setTotalPages(pagination.totalPages || 0);
      setHasNext(pagination.hasNext || false);
      setHasPrev(pagination.hasPrev || false);
      setCurrentPage(pagination.page || page);
    } catch (error: any) {
      console.error('Error fetching receipts:', error);
      setError(error.response?.data?.message || error.message || 'Failed to fetch receipts');
      // Fallback to empty array on error
      setReceiptsData([]);
      setTotalItems(0);
      setTotalPages(0);
      setHasNext(false);
      setHasPrev(false);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchReceipts(1);
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
      case 'created':
        return `${baseClasses} bg-purple-100 text-purple-800`;
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

  const handleSendWhatsApp = (receipt: ReceiptData) => {
    const message = `A receipt has been generated. please find the link: ${receipt.pdf_url}`;
    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/${receipt.member.phone_number}?text=${encodedMessage}`;
    window.open(whatsappUrl, '_blank');
  };

  const handleRegenerate = async (id: number) => {
    try {
      // Add to regenerating set
      setRegeneratingReceipts(prev => new Set(prev).add(id));
      
      // Make request to external API with correct format
      const response = await axios.post(API_PATHS.REGENERATE_RECEIPT, {
        receipt_id: id
      });
      
      // Update the receipt data with the new PDF URL if provided
      if (response.data && response.data.success && response.data.data && response.data.data.pdf_url) {
        setReceiptsData(prev => 
          prev.map(receipt => 
            receipt.id === id 
              ? { ...receipt, pdf_url: response.data.data.pdf_url }
              : receipt
          )
        );
        console.log('Receipt regenerated successfully:', id, response.data.message);
        setSuccessMessage(`Receipt regenerated successfully! New PDF: ${response.data.data.file_name}`);
        // Clear success message after 5 seconds
        setTimeout(() => setSuccessMessage(''), 5000);
      } else {
        console.warn('Unexpected API response format:', response.data);
      }
    } catch (error: any) {
      console.error('Error regenerating receipt:', error);
      // You might want to show a toast notification here
    } finally {
      // Remove from regenerating set
      setRegeneratingReceipts(prev => {
        const newSet = new Set(prev);
        newSet.delete(id);
        return newSet;
      });
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'INR'
    }).format(amount);
  };

  const tabs = [
    { id: 'all', label: 'All', icon: '📋' },
    { id: 'sent', label: 'Sent', icon: '📤' },
    { id: 'pending', label: 'Pending', icon: '⏳' },
    { id: 'created', label: 'Created', icon: '✨' }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="p-6">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Receipts</h1>
          <p className="text-gray-600">View and organize your receipts here.</p>
        </div>

        {/* Success Message */}
        {successMessage && (
          <div className="mb-6 bg-green-50 border border-green-200 rounded-md p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-green-800">{successMessage}</p>
              </div>
            </div>
          </div>
        )}

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
                onSendWhatsApp={handleSendWhatsApp}
                onRegenerate={handleRegenerate}
                formatCurrency={formatCurrency}
                getStatusBadge={getStatusBadge}
                regeneratingReceipts={regeneratingReceipts}
                currentPage={currentPage}
                totalItems={totalItems}
                totalPages={totalPages}
                hasNext={hasNext}
                hasPrev={hasPrev}
                pageSize={pageSize}
                onPageChange={(page) => {
                  setCurrentPage(page);
                  fetchReceipts(page);
                }}
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
  onSendWhatsApp: (receipt: ReceiptData) => void;
  onRegenerate: (id: number) => void;
  formatCurrency: (amount: number) => string;
  getStatusBadge: (status: string) => string;
  regeneratingReceipts: Set<number>;
  currentPage: number;
  totalItems: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
  pageSize: number;
  onPageChange: (page: number) => void;
}

function ReceiptsTable({ data, onView, onSend, onSendWhatsApp, onRegenerate, formatCurrency, getStatusBadge, regeneratingReceipts, currentPage, totalItems, totalPages, hasNext, hasPrev, pageSize, onPageChange }: ReceiptsTableProps) {
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
    <>
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
                    <Button 
                      size="xs" 
                      color="green"
                      onClick={() => onSendWhatsApp(receipt)}
                      className="px-3 py-1"
                    >
                      <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488"/>
                      </svg>
                      WhatsApp
                    </Button>
                    <Button 
                      size="xs" 
                      color="green"
                      onClick={() => onRegenerate(receipt.id)}
                      className="px-3 py-1"
                      disabled={regeneratingReceipts.has(receipt.id)}
                    >
                      {regeneratingReceipts.has(receipt.id) ? (
                        <svg className="w-4 h-4 mr-1 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                      ) : (
                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                      )}
                      {regeneratingReceipts.has(receipt.id) ? 'Regenerating...' : 'Regenerate'}
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      
      {/* Pagination */}
      <div className="flex items-center justify-between p-4 border-t border-gray-200">
        <div className="text-sm text-gray-500">
          Showing <span className="font-medium">{((currentPage - 1) * pageSize) + 1}</span> to <span className="font-medium">{Math.min(currentPage * pageSize, totalItems)}</span> of <span className="font-medium">{totalItems}</span> entries (Page {currentPage} of {totalPages})
        </div>
        <div className="flex items-center space-x-2">
          <Button
            size="sm"
            color="gray"
            className="px-3 py-1"
            disabled={!hasPrev}
            onClick={() => onPageChange(currentPage - 1)}
          >
            <span>‹</span>
          </Button>
          {(() => {
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
                  onClick={() => onPageChange(pageNum)}
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
            disabled={!hasNext}
            onClick={() => onPageChange(currentPage + 1)}
          >
            <span>›</span>
          </Button>
        </div>
      </div>
    </>
  );
}
