import { Modal, ModalHeader, ModalBody, ModalFooter, Button } from "flowbite-react";
import { useState, useEffect } from "react";
import useAxios from "../context/useAxios";
import { API_PATHS } from "../utils/apiPath";
import { HeadAutocomplete } from "./HeadAutocomplete";
import { MemberNameInput } from "./MemberNameInput";
import { AddMemberModal } from "./AddMemberModal";

interface AddTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: TransactionData) => void;
  yearId: number;
  editData?: TransactionData & { id?: number }; // Add optional edit data
}

interface TransactionData {
  head_id: number;
  description: string;
  amount: number;
  date: string;
  type: 'income' | 'expense';
  year_id: number;
  member_id?: number;
  head_particulars?: string;
  mode_of_payment?: 'cash' | 'cheque' | 'upi';
}

interface HeadSuggestion {
  id: number;
  head: string;
  particulars: string;
  type: 'income' | 'expense';
}

export function AddTransactionModal({ isOpen, onClose, onSave, yearId, editData }: AddTransactionModalProps) {
  const [formData, setFormData] = useState<TransactionData>({
    head_id: 0,
    description: '',
    amount: 0,
    date: new Date().toISOString().split('T')[0], // Today's date as default
    type: 'income',
    year_id: yearId,
    mode_of_payment: 'cash' // Default mode of payment
  });

  const [isSaving, setIsSaving] = useState(false);
  const [selectedHead, setSelectedHead] = useState<HeadSuggestion | null>(null);
  const [headQuery, setHeadQuery] = useState<string>('');
  const [memberName, setMemberName] = useState<string>('');
  const [nameSuggestions, setNameSuggestions] = useState<Array<{ id: number; name: string }>>([]);
  const [isLoadingNames, setIsLoadingNames] = useState<boolean>(false);
  const [showNameSuggestions, setShowNameSuggestions] = useState<boolean>(false);
  const [isAddMemberModalOpen, setIsAddMemberModalOpen] = useState<boolean>(false);
  const [prefilledMemberName, setPrefilledMemberName] = useState<string>('');
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

  // Populate form data when editing
  useEffect(() => {
    if (editData && isOpen) {
      // Format date for HTML date input (YYYY-MM-DD)
      const formatDateForInput = (dateString: string) => {
        try {
          const date = new Date(dateString);
          return date.toISOString().split('T')[0];
        } catch (error) {
          console.error('Error formatting date:', error);
          return new Date().toISOString().split('T')[0];
        }
      };

      setFormData({
        head_id: editData.head_id,
        description: editData.description,
        amount: editData.amount,
        date: formatDateForInput(editData.date),
        type: editData.type,
        year_id: editData.year_id,
        member_id: editData.member_id,
        mode_of_payment: editData.mode_of_payment || 'cash'
      });
      
      // Set the selected head for display
      if (editData.head_id) {
        setHeadQuery(editData.head_particulars || '');
        setSelectedHead({
          id: editData.head_id,
          head: '', // We'll need to fetch this or pass it in editData
          particulars: editData.head_particulars || '', // We'll need to fetch this or pass it in editData
          type: editData.type
        });
      }
    } else if (!editData && isOpen) {
      // Reset form for new transaction
      setFormData({
        head_id: 0,
        description: '',
        amount: 0,
        date: new Date().toISOString().split('T')[0],
        type: 'income',
        year_id: yearId,
        mode_of_payment: 'cash'
      });
      setSelectedHead(null);
      setHeadQuery('');
      setMemberName('');
    }
  }, [editData, isOpen, yearId]);

  const handleInputChange = (field: keyof TransactionData, value: string | number | 'cash' | 'cheque' | 'upi') => {
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
      type: head.type
    }));
    setHeadQuery(head.particulars);
  };

  // Debounced search for member names
  const debouncedSearch = (() => {
    let timeoutId: ReturnType<typeof setTimeout>;
    return (searchTerm: string) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(async () => {
        if (searchTerm.trim().length < 2) {
          setNameSuggestions([]);
          setShowNameSuggestions(false);
          return;
        }
        setIsLoadingNames(true);
        try {
          const response = await axiosInstance.get(`${API_PATHS.MEMBERS}?search=${encodeURIComponent(searchTerm)}`);
          const entries = response.data?.data || [];
          const suggestions = entries.map((e: any) => ({ id: e.id ?? e.member_id ?? e._id ?? 0, name: e.name }));
          setNameSuggestions(suggestions);
          setShowNameSuggestions(true);
        } catch (e) {
          setNameSuggestions([]);
          setShowNameSuggestions(false);
        } finally {
          setIsLoadingNames(false);
        }
      }, 300);
    };
  })();

  const handleMemberNameChange = (value: string) => {
    setMemberName(value);
    debouncedSearch(value);
  };

  const handleSelectName = (suggestion: string) => {
    setMemberName(suggestion);
    const match = nameSuggestions.find(s => s.name === suggestion);
    setFormData(prev => ({ ...prev, member_id: match?.id }));
    setShowNameSuggestions(false);
  };

  const openAddMemberModal = () => {
    setPrefilledMemberName(memberName);
    setIsAddMemberModalOpen(true);
  };

  const handleMemberAdded = async (memberData: { name: string; phone_number: string; email: string }) => {
    setIsAddMemberModalOpen(false);
    setMemberName(memberData.name);
    // Refresh suggestions and set member_id
    await (async () => {
      try {
        const response = await axiosInstance.get(`${API_PATHS.MEMBERS}?search=${encodeURIComponent(memberData.name)}`);
        const entries = response.data?.data || [];
        const suggestions = entries.map((e: any) => ({ id: e.id ?? e.member_id ?? e._id ?? 0, name: e.name }));
        setNameSuggestions(suggestions);
        const match = suggestions.find((s: { id: number; name: string }) => s.name === memberData.name);
        if (match) {
          setFormData(prev => ({ ...prev, member_id: match.id }));
        }
      } catch (e) {
        // swallow
      }
    })();
  };

  const handleSave = async () => {
    if (!formData.head_id || !formData.description || !formData.amount || !formData.date) {
      alert('Please fill in all required fields');
      return;
    }

    setIsSaving(true);
    try {
      // Prepare the transaction data for API
      const transactionData = {
        head_id: formData.head_id,
        description: formData.description,
        amount: Number(formData.amount), // Ensure amount is sent as number
        date: formData.date,
        type: formData.type,
        year_id: formData.year_id,
        member_id: formData.member_id,
        mode_of_payment: formData.mode_of_payment
      };

      let response;
      
      if (editData?.id) {
        // Update existing transaction using PATCH with ID as query parameter
        response = await axiosInstance.put(`${API_PATHS.UPDATE_TRANSACTION}?id=${editData.id}`, transactionData);
      } else {
        // Create new transaction using POST
        response = await axiosInstance.post(API_PATHS.ADD_TRANSACTIONS, transactionData);
      }
      
      if (response.data.success) {
        console.log(editData?.id ? 'Transaction updated successfully:' : 'Transaction saved successfully:', response.data);
        // Reset form data
        setFormData({
          head_id: 0,
          description: '',
          amount: 0,
          date: new Date().toISOString().split('T')[0],
          type: 'income',
          year_id: yearId,
          mode_of_payment: 'cash'
        });
        setSelectedHead(null);
        setHeadQuery('');
        setMemberName('');
        setNameSuggestions([]);
        setShowNameSuggestions(false);
        setFormData(prev => ({ ...prev, member_id: undefined }));
        // Close the modal
        onClose();
        // Call onSave callback to notify parent component (optional)
        onSave(response.data.data);
      } else {
        throw new Error(response.data.message || `Failed to ${editData?.id ? 'update' : 'save'} transaction`);
      }
    } catch (error) {
      console.error(`Error ${editData?.id ? 'updating' : 'saving'} transaction:`, error);
      alert(`Failed to ${editData?.id ? 'update' : 'save'} transaction. Please try again.`);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Modal show={isOpen} onClose={onClose} size="md" className="bg-gray-50">
      <ModalHeader className="bg-white border-b border-gray-200 text-gray-800">
        <div className="text-lg font-semibold text-gray-900">
          {editData?.id ? 'Edit Transaction' : 'Add New Transaction'}
        </div>
      </ModalHeader>
      <ModalBody className="bg-white">
        <div className="space-y-4 p-2">
          {/* Head Selection */}
          <HeadAutocomplete
            value={headQuery}
            onChange={(value) => setHeadQuery(value)}
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

          {/* Mode of Payment */}
          <div>
            <label className="block mb-2 text-sm font-medium text-black">
              Mode of Payment
            </label>
            <div className="flex items-center space-x-4">
              <label className="flex items-center">
                <input
                  type="radio"
                  name="mode_of_payment"
                  value="cash"
                  checked={formData.mode_of_payment === 'cash'}
                  onChange={(e) => handleInputChange('mode_of_payment', e.target.value as 'cash' | 'cheque' | 'upi')}
                  className="mr-2 text-blue-600 focus:ring-blue-500"
                />
                Cash
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="mode_of_payment"
                  value="cheque"
                  checked={formData.mode_of_payment === 'cheque'}
                  onChange={(e) => handleInputChange('mode_of_payment', e.target.value as 'cash' | 'cheque' | 'upi')}
                  className="mr-2 text-blue-600 focus:ring-blue-500"
                />
                Cheque
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="mode_of_payment"
                  value="upi"
                  checked={formData.mode_of_payment === 'upi'}
                  onChange={(e) => handleInputChange('mode_of_payment', e.target.value as 'cash' | 'cheque' | 'upi')}
                  className="mr-2 text-blue-600 focus:ring-blue-500"
                />
                UPI
              </label>
            </div>
          </div>

          {/* Member Name (optional) */}
          <div>
            <MemberNameInput
              label="Member Name"
              value={memberName}
              onChange={handleMemberNameChange}
              onClear={() => setMemberName('')}
              onBlur={() => setTimeout(() => setShowNameSuggestions(false), 150)}
              onFocus={() => {
                if (memberName.trim().length >= 2 && nameSuggestions.length > 0) {
                  setShowNameSuggestions(true);
                }
              }}
              suggestions={nameSuggestions.map(s => s.name)}
              isLoading={isLoadingNames}
              onSelectSuggestion={handleSelectName}
              showSuggestions={showNameSuggestions}
              showAddNew={memberName.trim().length >= 2 && !nameSuggestions.some((s: { id: number; name: string }) => s.name.toLowerCase() === memberName.trim().toLowerCase())}
              onAddNew={openAddMemberModal}
            />
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

          {/* Category removed: comes from selected head */}

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
            </div>
          </div>
        </div>
      </ModalBody>
      <ModalFooter className="bg-gray-50 border-t border-gray-200">
        <Button onClick={onClose} color="gray" className="bg-gray-500 hover:bg-gray-600 text-white">
          Cancel
        </Button>
        <Button onClick={handleSave} disabled={isSaving} className="bg-blue-600 hover:bg-blue-700 text-white">
          {isSaving ? (editData?.id ? 'Updating...' : 'Saving...') : (editData?.id ? 'Update Transaction' : 'Save Transaction')}
        </Button>
      </ModalFooter>
      <AddMemberModal
        isOpen={isAddMemberModalOpen}
        onClose={() => setIsAddMemberModalOpen(false)}
        onSave={handleMemberAdded}
        prefilledName={prefilledMemberName}
      />
    </Modal>
  );
}
