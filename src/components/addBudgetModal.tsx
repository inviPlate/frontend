import { Modal, ModalHeader, ModalBody, ModalFooter, Button } from "flowbite-react";
import { useState, useEffect } from "react";
import useAxios from "../context/useAxios";
import { API_PATHS } from "../utils/apiPath";
import { HeadAutocomplete } from "./HeadAutocomplete";

interface AddBudgetHeadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: BudgetHeadData) => void;
  type: 'income' | 'expense';
  yearId: number;
  yearText: string;
}

interface BudgetHeadData {
  head: string;
  particulars: string;
  budgetedAmount: string;
  incomeExpenseType: 'Income' | 'Expense';
  yearId: number;
  headId?: number; // Add headId to store the selected head's ID
}

interface AutocompleteSuggestion {
  id: number;
  head: string;
  particulars: string;
  type: 'income' | 'expense';
}

export function AddBudgetHeadModal({ isOpen, onClose, onSave, type, yearId, yearText }: AddBudgetHeadModalProps) {
  const [formData, setFormData] = useState<BudgetHeadData>({
    head: '',
    particulars: '',
    budgetedAmount: '',
    incomeExpenseType: type === 'income' ? 'Income' : 'Expense',
    yearId: yearId || 0, // Ensure yearId is set if not provided
    headId: undefined
  });

  const [isSaving, setIsSaving] = useState(false);
  const axiosInstance = useAxios();

  // Update form data when yearId or type changes
  useEffect(() => {
    setFormData(prev => ({
      ...prev,
      incomeExpenseType: type === 'income' ? 'Income' : 'Expense',
      yearId: yearId
    }));
  }, [yearId, type]);

  const handleInputChange = (field: keyof BudgetHeadData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleHeadSelect = (suggestion: AutocompleteSuggestion) => {
    setFormData(prev => ({
      ...prev,
      head: suggestion.head,
      particulars: suggestion.particulars,
      incomeExpenseType: suggestion.type === 'income' ? 'Income' : 'Expense',
      yearId: yearId,
      headId: suggestion.id // Store the head ID for API call
    }));
  };

  const handleSave = async () => {
    // Validate form data
    if (!formData.head.trim() || !formData.particulars.trim() || !formData.budgetedAmount.trim()) {
      console.error('Please fill in all required fields');
      return;
    }
    
    setIsSaving(true);
    try {
      // Make API call to create budget
      const response = await axiosInstance.post(API_PATHS.CREATE_BUDGET, {
        year_id: formData.yearId,
        head_id: formData.headId,
        amount: parseFloat(formData.budgetedAmount)
      });
      
      console.log('Budget head created successfully:', response.data);
      
      // Call the onSave callback with the response data
      onSave(formData);
      
      // Reset form
      setFormData({
        head: '',
        particulars: '',
        budgetedAmount: '',
        incomeExpenseType: type === 'income' ? 'Income' : 'Expense',
        yearId: yearId,
        headId: undefined
      });
      onClose();
    } catch (error) {
      console.error('Error creating budget head:', error);
      // You could add error handling here (e.g., show error message to user)
    } finally {
      setIsSaving(false);
    }
  };

  const handleClose = () => {
    // Reset form when closing
    setFormData({
      head: '',
      particulars: '',
      budgetedAmount: '',
      incomeExpenseType: type === 'income' ? 'Income' : 'Expense',
      yearId: yearId || 0, // Ensure yearId is reset
      headId: undefined
    });
    onClose();
  };

  return (
    <Modal className="bg-white [&>*]:!bg-white [&_*]:!text-gray-900" show={isOpen} onClose={handleClose} size="md">
      <ModalHeader className="bg-white text-gray-900 border-gray-200">
        <div>
          <div className="text-lg font-semibold">Add Budget Head</div>
          <div className="text-sm text-gray-600 capitalize">
            {type} • Year: {yearText}
          </div>
        </div>
      </ModalHeader>

      <ModalBody className="bg-white">
        <div className="space-y-6">
          {/* Head Field with Autocomplete */}
          <HeadAutocomplete
            value={formData.head}
            onChange={(value) => handleInputChange('head', value)}
            onHeadSelect={handleHeadSelect}
            placeholder="Start typing to search existing heads..."
            label="Head"
            required
            type={type}
            yearId={yearId}
          />

          {/* Particulars Field */}
          <div>
            <label htmlFor="particulars" className="mb-2 block text-sm font-medium text-gray-900">Particulars</label>
            <div className="relative">
              <input
                id="particulars"
                type="text"
                placeholder="Input text"
                required
                value={formData.particulars}
                onChange={(e) => handleInputChange('particulars', e.target.value)}
                className="w-full px-3 py-2 bg-blue-50 border border-blue-200 text-gray-900 placeholder-gray-500 rounded-lg focus:ring-blue-500 focus:border-blue-500 outline-none"
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                onClick={() => handleInputChange('particulars', '')}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                </svg>
              </button>
            </div>
          </div>

          {/* Budgeted Amount and Income/Expense Selection */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="budgetedAmount" className="mb-2 block text-sm font-medium text-gray-900">Budgeted Amount</label>
              <div className="relative">
                <input
                  id="budgetedAmount"
                  type="text"
                  placeholder="Input text"
                  required
                  value={formData.budgetedAmount}
                  onChange={(e) => handleInputChange('budgetedAmount', e.target.value)}
                  className="w-full px-3 py-2 bg-blue-50 border border-blue-200 text-gray-900 placeholder-gray-500 rounded-lg focus:ring-blue-500 focus:border-blue-500 outline-none"
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  onClick={() => handleInputChange('budgetedAmount', '')}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                  </svg>
                </button>
              </div>
            </div>

            <div>
              <label htmlFor="incomeExpense" className="mb-2 block text-sm font-medium text-gray-900">Income/Expense</label>
              <select
                id="incomeExpense"
                value={formData.incomeExpenseType}
                required
                disabled
                className="w-full px-3 py-2 bg-gray-100 border border-gray-300 text-gray-700 rounded-lg cursor-not-allowed"
              >
                <option value="Income">Income</option>
                <option value="Expense">Expense</option>
              </select>
              <p className="text-xs text-gray-500 mt-1">Automatically set based on selection</p>
            </div>
          </div>
        </div>
      </ModalBody>

      <ModalFooter className="bg-white border-gray-200">
        <Button
          onClick={handleSave}
          className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-md font-medium flex items-center gap-2"
          disabled={isSaving}
        >
          {isSaving ? (
            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          ) : (
            <>
              Save
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path>
              </svg>
            </>
          )}
        </Button>
      </ModalFooter>
    </Modal>
  );
}
