import { Table, TableBody, TableCell, TableHead, TableHeadCell, TableRow, Button } from "flowbite-react";
import { useState, useEffect } from "react";
import useAxiosDEV from "../context/useAxiosDEV";
import { API_PATHS } from "../utils/apiPath";
import { AddDepositModal } from "../components/AddDepositModal";

interface Deposit {
    id: number;
    created_at: string;
    updated_at: string;
    deposit_value: number;
    maturity_value: number;
    deposit_date: string;
    maturity_date: string;
    rate_of_interest: number;
    is_active: boolean;
}

interface PaginationInfo {
    page: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
}

export function Funds() {
    const [isLoading, setIsLoading] = useState(false);
    const [deposits, setDeposits] = useState<Deposit[]>([]);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [editingDeposit, setEditingDeposit] = useState<Deposit | null>(null);
    const [pagination, setPagination] = useState<PaginationInfo>({
        page: 1,
        pageSize: 10,
        totalItems: 0,
        totalPages: 0,
        hasNext: false,
        hasPrev: false
    });
    const axiosInstance = useAxiosDEV();

    // Fetch deposits on component mount
    useEffect(() => {
        const fetchDeposits = async () => {
            setIsLoading(true);
            try {
                const response = await axiosInstance.get(API_PATHS.GET_DEPOSITS);
                setDeposits(response.data.data);
                setPagination(response.data.pagination);
            } catch (error) {
                console.error('Error fetching deposits:', error);
                // You can add error handling here (show error message to user)
            } finally {
                setIsLoading(false);
            }
        };

        fetchDeposits();
    }, [axiosInstance]);

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('hi-IN', {
            style: 'currency',
            currency: 'INR'
        }).format(amount);
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    const formatPercentage = (rate: number) => {
        return `${rate}%`;
    };

    const isMatured = (maturityDate: string, isActive: boolean) => {
        if (!isActive) return false;
        const today = new Date();
        const maturity = new Date(maturityDate);
        return maturity < today;
    };

    const handleEditDeposit = (deposit: Deposit) => {
        setEditingDeposit(deposit);
        setIsAddModalOpen(true);
    };

    const handleAddDeposit = () => {
        setEditingDeposit(null);
        setIsAddModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsAddModalOpen(false);
        setEditingDeposit(null);
    };

    const handleSaveDeposit = (depositData: any) => {
        if (editingDeposit) {
            // Update existing deposit in the list
            setDeposits(prev => prev.map(deposit => 
                deposit.id === editingDeposit.id 
                    ? { ...deposit, ...depositData }
                    : deposit
            ));
        } else {
            // Add the new deposit to the list
            const newDeposit = depositData.data || depositData;
            setDeposits(prev => [...prev, newDeposit]);
        }
        setIsAddModalOpen(false);
        setEditingDeposit(null);
    };

    const handlePageChange = async (newPage: number) => {
        if (newPage < 1 || newPage > pagination.totalPages) return;
        
        setIsLoading(true);
        try {
            const response = await axiosInstance.get(`${API_PATHS.GET_DEPOSITS}?page=${newPage}&pageSize=${pagination.pageSize}`);
            setDeposits(response.data.data);
            setPagination(response.data.pagination);
        } catch (error) {
            console.error('Error fetching deposits:', error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="p-6">
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-900 mb-2">Funds</h1>
            </div>

            {/* Header with Deposits Title and Add Button */}
            <div className="flex justify-between items-center mb-6">
                <div className="flex items-center space-x-4">
                    <h2 className="text-xl font-semibold text-gray-900">Deposits</h2>
                </div>

                <Button 
                    className="flex items-center space-x-2"
                    onClick={handleAddDeposit}
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
                    </svg>
                    <span>Add Deposit</span>
                </Button>
            </div>

            {/* Deposits Table */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
                {isLoading ? (
                    <div className="p-8 text-center">
                        <div className="inline-flex items-center">
                            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            <span className="text-gray-600">Loading deposits...</span>
                        </div>
                    </div>
                ) : deposits.length === 0 ? (
                    <div className="p-8 text-center">
                        <p className="text-gray-500">No deposits found. Create your first one!</p>
                    </div>
                ) : (
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableHeadCell className="text-center">Deposit Value</TableHeadCell>
                                <TableHeadCell className="text-center">Maturity Value</TableHeadCell>
                                <TableHeadCell className="text-center">Deposit Date</TableHeadCell>
                                <TableHeadCell className="text-center">Maturity Date</TableHeadCell>
                                <TableHeadCell className="text-center">Rate of Interest</TableHeadCell>
                                <TableHeadCell className="text-center">Actions</TableHeadCell>
                            </TableRow>
                        </TableHead>
                        <TableBody className="divide-y">
                            {deposits.map((deposit) => (
                                <TableRow key={deposit.id} className="bg-white hover:bg-gray-50">
                                    <TableCell className="font-medium text-gray-900 text-center">
                                        {formatCurrency(deposit.deposit_value)}
                                    </TableCell>
                                    <TableCell className="text-center text-gray-600">
                                        {formatCurrency(deposit.maturity_value)}
                                    </TableCell>
                                    <TableCell className="text-center text-gray-600">
                                        {formatDate(deposit.deposit_date)}
                                    </TableCell>
                                    <TableCell className="text-center text-gray-600">
                                        <div className="flex items-center justify-center space-x-2">
                                            <span>{formatDate(deposit.maturity_date)}</span>
                                            {isMatured(deposit.maturity_date, deposit.is_active) && (
                                                <svg 
                                                    className="w-4 h-4 text-yellow-500" 
                                                    fill="currentColor" 
                                                    viewBox="0 0 20 20"
                                                >
                                                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                                </svg>
                                            )}
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-center text-gray-600">
                                        {formatPercentage(deposit.rate_of_interest)}
                                    </TableCell>
                                    <TableCell className="text-center">
                                        <div className="flex justify-center space-x-2">
                                            <button 
                                                className="text-blue-600 hover:text-blue-900 p-1"
                                                onClick={() => handleEditDeposit(deposit)}
                                            >
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
                                                </svg>
                                            </button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                )}
            </div>

            {/* Pagination */}
            {!isLoading && deposits.length > 0 && (
                <div className="flex items-center justify-between mt-6">
                    <div className="text-sm text-gray-700">
                        Showing <span className="font-medium">{((pagination.page - 1) * pagination.pageSize) + 1}</span> to <span className="font-medium">{Math.min(pagination.page * pagination.pageSize, pagination.totalItems)}</span> of <span className="font-medium">{pagination.totalItems}</span> results
                    </div>
                    <div className="flex space-x-2">
                        <button 
                            className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed" 
                            disabled={!pagination.hasPrev}
                            onClick={() => handlePageChange(pagination.page - 1)}
                        >
                            Previous
                        </button>
                        
                        {/* Page Numbers */}
                        {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                            const pageNum = i + 1;
                            return (
                                <button 
                                    key={pageNum}
                                    className={`px-3 py-2 text-sm font-medium border rounded-lg ${
                                        pageNum === pagination.page 
                                            ? 'text-white bg-blue-600 border-blue-600' 
                                            : 'text-gray-500 bg-white border-gray-300 hover:bg-gray-50'
                                    }`}
                                    onClick={() => handlePageChange(pageNum)}
                                >
                                    {pageNum}
                                </button>
                            );
                        })}
                        
                        {pagination.totalPages > 5 && (
                            <span className="px-3 py-2 text-sm text-gray-500">...</span>
                        )}
                        
                        <button 
                            className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed" 
                            disabled={!pagination.hasNext}
                            onClick={() => handlePageChange(pagination.page + 1)}
                        >
                            Next
                        </button>
                    </div>
                </div>
            )}

            {/* Add Deposit Modal */}
            <AddDepositModal
                isOpen={isAddModalOpen}
                onClose={handleCloseModal}
                onSave={handleSaveDeposit}
                editData={editingDeposit}
            />
        </div>
    );
}
