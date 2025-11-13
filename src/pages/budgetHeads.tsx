import { Table, TableBody, TableCell, TableHead, TableHeadCell, TableRow, Button } from "flowbite-react";
import { useState, useEffect } from "react";
import { AddBudgetHeadModal } from "../components/AddBudgetHeadModal";
import useAxios from "../context/useAxios";
import { API_PATHS } from "../utils/apiPath";

interface BudgetHead {
    id: number;
    created_at: string;
    updated_at: string;
    head: string;
    particulars: string;
    type: 'income' | 'expense';
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

export function BudgetHeads() {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [budgetHeads, setBudgetHeads] = useState<BudgetHead[]>([]);
    const [pagination, setPagination] = useState<PaginationInfo>({
        page: 1,
        pageSize: 10,
        totalItems: 0,
        totalPages: 0,
        hasNext: false,
        hasPrev: false
    });
    const axiosInstance = useAxios();

    // Fetch budget heads on component mount
    useEffect(() => {
        const fetchBudgetHeads = async () => {
            setIsLoading(true);
            try {
                const response = await axiosInstance.get(API_PATHS.BUDGET_HEADS);
                setBudgetHeads(response.data.data);
                setPagination(response.data.pagination);
            } catch (error) {
                console.error('Error fetching budget heads:', error);
                // You can add error handling here (show error message to user)
            } finally {
                setIsLoading(false);
            }
        };

        fetchBudgetHeads();
    }, [axiosInstance]);



    const getStatusBadge = (isActive: boolean) => {
        if (isActive) {
            return <span className="bg-green-100 text-green-800 text-xs font-medium px-2.5 py-0.5 rounded-full">Active</span>;
        } else {
            return <span className="bg-gray-800 text-xs font-medium px-2.5 py-0.5 rounded-full">Inactive</span>;
        }
    };

    const getTypeBadge = (type: string) => {
        if (type === 'income') {
            return <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded-full">Income</span>;
        } else {
            return <span className="bg-red-100 text-red-800 text-xs font-medium px-2.5 py-0.5 rounded-full">Expense</span>;
        }
    };

    const handleAddBudgetHead = (savedBudgetHead: any) => {
        // Add the new budget head to the list
        // The API response has the structure: { success: true, message: string, data: BudgetHead }
        const newBudgetHead = savedBudgetHead.data || savedBudgetHead;
        setBudgetHeads(prev => [...prev, newBudgetHead]);
    };

    const handlePageChange = async (newPage: number) => {
        if (newPage < 1 || newPage > pagination.totalPages) return;
        
        setIsLoading(true);
        try {
            const response = await axiosInstance.get(`${API_PATHS.BUDGET_HEADS}?page=${newPage}&pageSize=${pagination.pageSize}`);
            setBudgetHeads(response.data.data);
            setPagination(response.data.pagination);
        } catch (error) {
            console.error('Error fetching budget heads:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const getPageNumbers = (): (number | string)[] => {
        const { page, totalPages } = pagination;
        const pages: (number | string)[] = [];
        
        if (totalPages <= 7) {
            // If 7 or fewer pages, show all
            for (let i = 1; i <= totalPages; i++) {
                pages.push(i);
            }
        } else {
            // Always show first page
            pages.push(1);
            
            // Calculate start and end of the window around current page
            let start = Math.max(2, page - 1);
            let end = Math.min(totalPages - 1, page + 1);
            
            // Adjust window if we're near the beginning
            if (page <= 3) {
                end = Math.min(5, totalPages - 1);
            }
            
            // Adjust window if we're near the end
            if (page >= totalPages - 2) {
                start = Math.max(2, totalPages - 4);
            }
            
            // Add ellipsis before window if needed
            if (start > 2) {
                pages.push('ellipsis-start');
            }
            
            // Add pages in the window
            for (let i = start; i <= end; i++) {
                pages.push(i);
            }
            
            // Add ellipsis after window if needed
            if (end < totalPages - 1) {
                pages.push('ellipsis-end');
            }
            
            // Always show last page
            pages.push(totalPages);
        }
        
        return pages;
    };

    return (
        <div className="p-6">
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-900 mb-2">Budget Heads</h1>
                <p className="text-gray-600">Manage and organize your budget categories and income sources</p>
            </div>

            {/* Header with Add Button */}
            <div className="flex justify-between items-center mb-6">
                <div className="flex items-center space-x-4">
                    <div className="relative">
                        <input
                            type="text"
                            placeholder="Search budget heads..."
                            className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 w-64"
                        />
                        <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                        </svg>
                    </div>
                    

                </div>

                <Button className="flex items-center space-x-2" onClick={() => setIsModalOpen(true)}>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
                    </svg>
                    <span>Add Budget Head</span>
                </Button>
            </div>

            {/* Budget Heads Table */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
                {isLoading ? (
                    <div className="p-8 text-center">
                        <div className="inline-flex items-center">
                            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            <span className="text-gray-600">Loading budget heads...</span>
                        </div>
                    </div>
                ) : budgetHeads.length === 0 ? (
                    <div className="p-8 text-center">
                        <p className="text-gray-500">No budget heads found. Create your first one!</p>
                    </div>
                ) : (
                    <Table>
                    <TableHead>
                        <TableRow>
                            <TableHeadCell className="text-center">Head</TableHeadCell>
                            <TableHeadCell className="text-center">Particulars</TableHeadCell>

                            <TableHeadCell className="text-center">Type</TableHeadCell>
                            <TableHeadCell className="text-center">Status</TableHeadCell>

                            <TableHeadCell className="text-center">Actions</TableHeadCell>
                        </TableRow>
                    </TableHead>
                    <TableBody className="divide-y">
                        {budgetHeads.map((head) => (
                            <TableRow key={head.id} className="bg-white hover:bg-gray-50">
                                <TableCell className="font-medium text-gray-900 text-center">
                                    {head.head}
                                </TableCell>
                                <TableCell className="text-center text-gray-600">
                                    {head.particulars}
                                </TableCell>

                                <TableCell className="text-center">
                                    {getTypeBadge(head.type)}
                                </TableCell>
                                <TableCell className="text-center">
                                    {getStatusBadge(head.is_active)}
                                </TableCell>

                                <TableCell className="text-center">
                                    <div className="flex justify-center space-x-2">
                                        <button className="text-blue-600 hover:text-blue-900 p-1">
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
                                            </svg>
                                        </button>
                                        <button className="text-red-600 hover:text-red-900 p-1">
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
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
            {!isLoading && budgetHeads.length > 0 && (
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
                        {getPageNumbers().map((pageItem, index) => {
                            if (typeof pageItem === 'string') {
                                // Render ellipsis
                                return (
                                    <span key={`ellipsis-${index}`} className="px-3 py-2 text-sm text-gray-500">
                                        ...
                                    </span>
                                );
                            }
                            
                            const pageNum = pageItem;
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

            {/* Add Budget Head Modal */}
            <AddBudgetHeadModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSave={handleAddBudgetHead}
            />
        </div>
    );
}
