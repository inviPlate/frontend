import { Modal, ModalHeader, ModalBody, ModalFooter, Button } from "flowbite-react";
import { useState } from "react";

interface AddBudgetHeadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: BudgetHeadData) => void;
  type: 'income' | 'expense';
}

interface BudgetHeadData {
  head: string;
  particulars: string;
  budgetedAmount: string;
  incomeExpenseType: 'Income' | 'Expense';
}

export function AddBudgetHeadModal({ isOpen, onClose, onSave, type }: AddBudgetHeadModalProps) {
  const [formData, setFormData] = useState<BudgetHeadData>({
    head: '',
    particulars: '',
    budgetedAmount: '',
    incomeExpenseType: type === 'income' ? 'Income' : 'Expense'
  });

  const handleInputChange = (field: keyof BudgetHeadData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSave = () => {
    onSave(formData);
    // Reset form
    setFormData({
      head: '',
      particulars: '',
      budgetedAmount: '',
      incomeExpenseType: type === 'income' ? 'Income' : 'Expense'
    });
    onClose();
  };

  const handleClose = () => {
    // Reset form when closing
    setFormData({
      head: '',
      particulars: '',
      budgetedAmount: '',
      incomeExpenseType: type === 'income' ? 'Income' : 'Expense'
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
                placeholder="Input text"
                value={formData.head}
                required
                onChange={(e) => handleInputChange('head', e.target.value)}
                className="w-full px-3 py-2 bg-blue-50 border border-blue-200 text-gray-900 placeholder-gray-500 rounded-lg focus:ring-blue-500 focus:border-blue-500 outline-none"
              />
              <button 
                type="button"
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                onClick={() => handleInputChange('head', '')}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                </svg>
              </button>
            </div>
          </div>

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
                onChange={(e) => handleInputChange('incomeExpenseType', e.target.value as 'Income' | 'Expense')}
                className="w-full px-3 py-2 bg-blue-50 border border-blue-200 text-gray-900 rounded-lg focus:ring-blue-500 focus:border-blue-500 outline-none"
              >
                <option value="Income">Income</option>
                <option value="Expense">Expense</option>
              </select>
            </div>
          </div>
        </div>
      </ModalBody>

      <ModalFooter className="bg-white border-gray-200">
        <Button 
          onClick={handleSave}
          className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-md font-medium flex items-center gap-2"
        >
          Save
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path>
          </svg>
        </Button>
      </ModalFooter>
    </Modal>
  );
}
