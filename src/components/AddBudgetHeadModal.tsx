import { Modal, ModalHeader, ModalBody, ModalFooter, Button } from "flowbite-react";
import { useState } from "react";
import useAxios from "../context/useAxios";
import { API_PATHS } from "../utils/apiPath";

interface AddBudgetHeadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: BudgetHeadData) => void;
}

interface BudgetHeadData {
  head: string;
  particulars: string;
  type: 'income' | 'expense';
  isActive: boolean;
}

export function AddBudgetHeadModal({ isOpen, onClose, onSave }: AddBudgetHeadModalProps) {
  const [formData, setFormData] = useState<BudgetHeadData>({
    head: '',
    particulars: '',
    type: 'expense',
    isActive: true
  });
  const [isSaving, setIsSaving] = useState(false);
  const axiosInstance = useAxios();

  const handleInputChange = (field: keyof BudgetHeadData, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: field === 'isActive' ? Boolean(value) : value
    }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const response = await axiosInstance.post(API_PATHS.Create_BUDGET_HEAD, formData);
      const savedData = response.data;
      
      // Pass saved data to parent component
      onSave(savedData);
      
      // Reset form
      setFormData({
        head: '',
        particulars: '',
        type: 'expense',
        isActive: true
      });
      onClose();
    } catch (error) {
      console.error('Error saving budget head:', error);
      // You can add error handling here (show error message to user)
    } finally {
      setIsSaving(false);
    }
  };

  const handleClose = () => {
    // Reset form when closing
    setFormData({
      head: '',
      particulars: '',
      type: 'expense',
      isActive: true
    });
    onClose();
  };

  return (
    <Modal className="bg-white [&>*]:!bg-white [&_*]:!text-gray-900" show={isOpen} onClose={handleClose} size="md">
      <ModalHeader className="bg-white text-gray-900 border-gray-200">Add Budget Head</ModalHeader>
      
      <ModalBody className="bg-white">
        <div className="space-y-6">
          {/* Head Field */}
          <div>
            <label htmlFor="head" className="mb-2 block text-sm font-medium text-gray-900">Head</label>
            <div className="relative">
              <input
                id="head"
                type="text"
                placeholder="Enter budget head name"
                value={formData.head}
                required
                onChange={(e) => handleInputChange('head', e.target.value)}
                className="w-full px-3 py-2 bg-blue-50 border border-blue-200 text-gray-900 placeholder-gray-500 rounded-lg focus:ring-blue-500 focus:border-blue-500 outline-none"
              />
              {formData.head && (
                <button 
                  type="button"
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  onClick={() => handleInputChange('head', '')}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                  </svg>
                </button>
              )}
            </div>
          </div>

          {/* Particulars Field */}
          <div>
            <label htmlFor="particulars" className="mb-2 block text-sm font-medium text-gray-900">Particulars</label>
            <div className="relative">
              <input
                id="particulars"
                type="text"
                placeholder="Enter detailed description"
                required
                value={formData.particulars}
                onChange={(e) => handleInputChange('particulars', e.target.value)}
                className="w-full px-3 py-2 bg-blue-50 border border-blue-200 text-gray-900 placeholder-gray-500 rounded-lg focus:ring-blue-500 focus:border-blue-500 outline-none"
              />
              {formData.particulars && (
                <button 
                  type="button"
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  onClick={() => handleInputChange('particulars', '')}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                  </svg>
                </button>
              )}
            </div>
          </div>

          {/* Type Selection */}
          <div>
            <label htmlFor="type" className="mb-2 block text-sm font-medium text-gray-900">Type</label>
            <select
              id="type"
              value={formData.type}
              required
              onChange={(e) => handleInputChange('type', e.target.value as 'income' | 'expense')}
              className="w-full px-3 py-2 bg-blue-50 border border-blue-200 text-gray-900 rounded-lg focus:ring-blue-500 focus:border-blue-500 outline-none"
            >
              <option value="income">Income</option>
              <option value="expense">Expense</option>
            </select>
          </div>

          {/* Active Status */}
          <div className="flex items-center">
            <input
              id="isActive"
              type="checkbox"
              checked={formData.isActive}
              onChange={(e) => handleInputChange('isActive', e.target.checked)}
              className="w-4 h-4 text-blue-600 bg-blue-50 border-blue-200 rounded focus:ring-blue-500 focus:ring-2"
            />
            <label htmlFor="isActive" className="ml-2 text-sm font-medium text-gray-900">
              Active
            </label>
          </div>
        </div>
      </ModalBody>

      <ModalFooter className="bg-white border-gray-200">
        <Button 
          onClick={handleSave}
          disabled={isSaving}
          className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-md font-medium flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSaving ? (
            <>
              <svg className="animate-spin -ml-1 mr-3 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Saving...
            </>
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
