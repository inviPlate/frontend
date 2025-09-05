import { Modal, ModalHeader, ModalBody, ModalFooter, Button } from "flowbite-react";
import { useState, useEffect } from "react";
import useAxios from "../context/useAxios";
import { API_PATHS } from "../utils/apiPath";
import { HeadAutocomplete } from "./HeadAutocomplete";

interface AddTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: TransactionData) => void;
  yearId: number;
}

interface TransactionData {
  head_id: number;
  description: string;
  amount: number;
  date: string;
  category: string;
  type: 'income' | 'expense';
  year_id: number;
}

interface HeadSuggestion {
  id: number;
  head: string;
  particulars: string;
  type: 'income' | 'expense';
}

export function AddTransactionModal({ isOpen, onClose, onSave, yearId }: AddTransactionModalProps) {
  const [formData, setFormData] = useState<TransactionData>({
    head_id: 0,
    description: '',
    amount: 0,
    date: new Date().toISOString().split('T')[0], // Today's date as default
    category: '',
    type: 'income',
    year_id: yearId
  });

  const [isSaving, setIsSaving] = useState(false);
  const [selectedHead, setSelectedHead] = useState<HeadSuggestion | null>(null);
  const axiosInstance = useAxios();

  // Clear selected head when modal closes
  useEffect(() => {
    if (!isOpen) {
      setSelectedHead(null);
    }
  }, [isOpen]);

  // Update form data when yearId changes
  useEffect(() => {
    setFormData(prev => ({
      ...prev,
      year_id: yearId
    }));
  }, [yearId]);

  const handleInputChange = (field: keyof TransactionData, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleHeadSelect = (head: HeadSuggestion) => {
    setSelectedHead(head);
    setFormData(prev => ({
      ...prev,
      head_id: head.id,
      type: head.type,
      category: head.particulars
    }));
  };

  const handleSave = async () => {
    if (!formData.head_id || !formData.description || !formData.category || !formData.amount || !formData.date) {
      alert('Please fill in all required fields');
      return;
    }

    setIsSaving(true);
    try {
      // Prepare the transaction data for API
      const transactionData = {
        head_id: formData.head_id,
        description: formData.description,
        category: formData.category,
        amount: Number(formData.amount), // Ensure amount is sent as number
        date: formData.date,
        type: formData.type,
        year_id: formData.year_id
      };

      // Call the API to create the transaction
      const response = await axiosInstance.post(API_PATHS.ADD_TRANSACTIONS, transactionData);
      
      if (response.data.success) {
        console.log('Transaction saved successfully:', response.data);
        // Reset form data
        setFormData({
          head_id: 0,
          description: '',
          amount: 0,
          date: new Date().toISOString().split('T')[0],
          category: '',
          type: 'income',
          year_id: yearId
        });
        setSelectedHead(null);
        // Close the modal
        onClose();
        // Call onSave callback to notify parent component (optional)
        onSave(response.data.data);
      } else {
        throw new Error(response.data.message || 'Failed to save transaction');
      }
    } catch (error) {
      console.error('Error saving transaction:', error);
      alert('Failed to save transaction. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Modal show={isOpen} onClose={onClose} size="md" className="bg-gray-50">
      <ModalHeader className="bg-white border-b border-gray-200 text-gray-800">
        <h3 className="text-lg font-semibold text-gray-900">Add New Transaction</h3>
      </ModalHeader>
      <ModalBody className="bg-white">
        <div className="space-y-4 p-2">
          {/* Head Selection */}
          <HeadAutocomplete
            value={formData.category}
            onChange={(value) => handleInputChange('category', value)}
            onHeadSelect={handleHeadSelect}
            placeholder="Start typing to search existing heads..."
            label="Head *"
            required
            yearId={yearId}
          />

          {/* Transaction Type */}
          <div>
            <label htmlFor="type" className="block mb-2 text-sm font-medium text-black">
              Transaction Type
            </label>
            <select
              id="type"
              value={formData.type}
              onChange={(e) => handleInputChange('type', e.target.value)}
              disabled={!!selectedHead} // Disable if head is selected (type comes from head)
              className="w-full px-3 py-2 bg-blue-50 border border-blue-200 text-gray-900 rounded-lg focus:ring-blue-500 focus:border-blue-500 outline-none disabled:bg-gray-100 disabled:cursor-not-allowed"
            >
              <option value="income">Income</option>
              <option value="expense">Expense</option>
            </select>
          </div>

          {/* Description */}
          <div>
            <label htmlFor="description" className="block mb-2 text-sm font-medium text-black">
              Description *
            </label>
            <div className="relative">
              <input
                id="description"
                type="text"
                placeholder="Input text"
                required
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                className="w-full px-3 py-2 bg-blue-50 border border-blue-200 text-gray-900 placeholder-gray-500 rounded-lg focus:ring-blue-500 focus:border-blue-500 outline-none"
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                onClick={() => handleInputChange('description', '')}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                </svg>
              </button>
            </div>
          </div>

          {/* Category */}
          <div>
            <label htmlFor="category_input" className="block mb-2 text-sm font-medium text-black">
              Category *
            </label>
            <div className="relative">
              <input
                id="category_input"
                type="text"
                placeholder="Enter category (e.g., offertory, tithe, sunday_school)"
                required
                value={formData.category}
                onChange={(e) => handleInputChange('category', e.target.value)}
                className="w-full px-3 py-2 bg-blue-50 border border-blue-200 text-gray-900 placeholder-gray-500 rounded-lg focus:ring-blue-500 focus:border-blue-500 outline-none"
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                onClick={() => handleInputChange('category', '')}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                </svg>
              </button>
            </div>
          </div>

          {/* Amount */}
          <div>
            <label htmlFor="amount" className="block mb-2 text-sm font-medium text-black">
              Amount *
            </label>
            <div className="relative">
              <input
                id="amount"
                type="number"
                step="0.01"
                min="0"
                placeholder="Input text"
                required
                value={formData.amount}
                onChange={(e) => handleInputChange('amount', e.target.value)}
                className="w-full px-3 py-2 bg-blue-50 border border-blue-200 text-gray-900 placeholder-gray-500 rounded-lg focus:ring-blue-500 focus:border-blue-500 outline-none"
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                onClick={() => handleInputChange('amount', 0)}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                </svg>
              </button>
            </div>
          </div>

          {/* Date */}
          <div>
            <label htmlFor="date" className="block mb-2 text-sm font-medium text-black">
              Date *
            </label>
            <div className="relative">
              <input
                id="date"
                type="date"
                required
                value={formData.date}
                onChange={(e) => handleInputChange('date', e.target.value)}
                className="w-full px-3 py-2 bg-blue-50 border border-blue-200 text-gray-900 rounded-lg focus:ring-blue-500 focus:border-blue-500 outline-none"
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                onClick={() => handleInputChange('date', new Date().toISOString().split('T')[0])}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                </svg>
              </button>
            </div>
          </div>
        </div>
      </ModalBody>
      <ModalFooter className="bg-gray-50 border-t border-gray-200">
        <Button onClick={onClose} color="gray" className="bg-gray-500 hover:bg-gray-600 text-white">
          Cancel
        </Button>
        <Button onClick={handleSave} disabled={isSaving} className="bg-blue-600 hover:bg-blue-700 text-white">
          {isSaving ? 'Saving...' : 'Save Transaction'}
        </Button>
      </ModalFooter>
    </Modal>
  );
}
