import { Button, Table, TableBody, TableCell, TableHead, TableHeadCell, TableRow } from 'flowbite-react';
import { useState } from 'react';

interface ReceiptData {
  id: number;
  name: string;
  amount: number;
  status: 'sent' | 'pending' | 'completed';
  date: string;
}

export default function Receipts() {
  const [activeTab, setActiveTab] = useState('all');

  // Mock data - replace with actual API data
  const receiptsData: ReceiptData[] = [
    { id: 1, name: 'John Doe', amount: 150.00, status: 'sent', date: '2025-01-15' },
    { id: 2, name: 'Jane Smith', amount: 75.50, status: 'pending', date: '2025-01-14' },
    { id: 3, name: 'Mike Johnson', amount: 200.00, status: 'completed', date: '2025-01-13' },
    { id: 4, name: 'Sarah Wilson', amount: 125.25, status: 'sent', date: '2025-01-12' },
    { id: 5, name: 'David Brown', amount: 300.00, status: 'pending', date: '2025-01-11' },
  ];

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
    console.log('View receipt:', id);
    // Add view logic here
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
            <ReceiptsTable 
              data={getFilteredData()} 
              onView={handleView} 
              onSend={handleSend} 
              formatCurrency={formatCurrency}
              getStatusBadge={getStatusBadge}
            />
          </div>
        </div>
      </div>
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
