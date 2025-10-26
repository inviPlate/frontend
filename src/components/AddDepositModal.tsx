import { Modal, ModalHeader, ModalBody, ModalFooter, Button } from "flowbite-react";
import { useState, useEffect } from "react";
import useAxiosDEV from "../context/useAxiosDEV";
import { API_PATHS } from "../utils/apiPath";

interface AddDepositModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: DepositData) => void;
  editData?: DepositData | null;
}

interface DepositData {
  id?: number;
  deposit_value: number;
  maturity_value: number;
  deposit_date: string;
  maturity_date: string;
  rate_of_interest: number;
  is_premature_withdrawal?: boolean;
  is_active?: boolean;
}

export function AddDepositModal({ isOpen, onClose, onSave, editData }: AddDepositModalProps) {
  const [formData, setFormData] = useState<DepositData>({
    deposit_value: 0,
    maturity_value: 0,
    deposit_date: '',
    maturity_date: '',
    rate_of_interest: 0,
    is_premature_withdrawal: false,
    is_active: true
  });

  const [isSaving, setIsSaving] = useState(false);
  const axiosInstance = useAxiosDEV();

  // Populate form with edit data when provided
  useEffect(() => {
    if (editData && isOpen) {
      setFormData({
        id: editData.id,
        deposit_value: editData.deposit_value,
        maturity_value: editData.maturity_value,
        deposit_date: editData.deposit_date,
        maturity_date: editData.maturity_date,
        rate_of_interest: editData.rate_of_interest,
        is_premature_withdrawal: editData.is_premature_withdrawal || false,
        is_active: editData.is_active !== undefined ? editData.is_active : true
      });
    } else if (!editData && isOpen) {
      // Reset form for new deposit
      setFormData({
        deposit_value: 0,
        maturity_value: 0,
        deposit_date: '',
        maturity_date: '',
        rate_of_interest: 0,
        is_premature_withdrawal: false,
        is_active: true
      });
    }
  }, [editData, isOpen]);

  const calculateMaturityValue = (depositValue: number, rate: number, depositDate: string, maturityDate: string): number => {
    if (!depositDate || !maturityDate) return 0;
    
    const deposit = new Date(depositDate);
    const maturity = new Date(maturityDate);
    const timeInYears = (maturity.getTime() - deposit.getTime()) / (1000 * 60 * 60 * 24 * 365.25);
    
    if (timeInYears <= 0) return depositValue;
    
    // Simple interest calculation: Maturity Value = Principal + (Principal * Rate * Time)
    const interest = depositValue * (rate / 100) * timeInYears;
    return (depositValue + interest).toFixed(2) as unknown as number;
  };

  const handleInputChange = (field: keyof DepositData, value: string | number) => {
    setFormData(prev => {
      const newData = {
        ...prev,
        [field]: value
      };
      
      // Calculate maturity value when deposit_value, rate_of_interest, deposit_date, or maturity_date changes (only for new deposits)
      if (!editData && (field === 'deposit_value' || field === 'rate_of_interest' || field === 'deposit_date' || field === 'maturity_date')) {
        const depositValue = field === 'deposit_value' ? value as number : prev.deposit_value;
        const rate = field === 'rate_of_interest' ? value as number : prev.rate_of_interest;
        const depositDate = field === 'deposit_date' ? value as string : prev.deposit_date;
        const maturityDate = field === 'maturity_date' ? value as string : prev.maturity_date;
        
        if (depositValue > 0 && rate > 0 && depositDate && maturityDate) {
          newData.maturity_value = calculateMaturityValue(depositValue, rate, depositDate, maturityDate);
        }
      }
      
      return newData;
    });
  };

  const formatDateForInput = (dateString: string): string => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toISOString().split('T')[0];
  };

  const handleSave = async () => {
    // Validate form data
    const isNewDeposit = !editData;
    const requiredFields = ['deposit_value', 'deposit_date', 'maturity_date', 'rate_of_interest'];
    
    // For new deposits, maturity_value is calculated automatically but can be edited
    // For edit mode, maturity_value is required
    if (!isNewDeposit) {
      requiredFields.push('maturity_value');
    }
    
    const missingFields = requiredFields.filter(field => {
      const value = formData[field as keyof DepositData];
      return !value || (typeof value === 'number' && value <= 0);
    });
    
    if (missingFields.length > 0) {
      console.error('Please fill in all required fields:', missingFields);
      return;
    }
    
    // For new deposits, ensure maturity_value is calculated if not manually entered
    if (isNewDeposit && (!formData.maturity_value || formData.maturity_value <= 0)) {
      if (formData.deposit_value > 0 && formData.rate_of_interest > 0 && formData.deposit_date && formData.maturity_date) {
        formData.maturity_value = calculateMaturityValue(
          formData.deposit_value, 
          formData.rate_of_interest, 
          formData.deposit_date, 
          formData.maturity_date
        );
      }
    }
    
    setIsSaving(true);
    try {
      let response;
      
      if (editData?.id) {
        // Update existing deposit
        response = await axiosInstance.put(`${API_PATHS.UPDATE_DEPOSIT}?id=${editData.id}`, {
          deposit_value: formData.deposit_value,
          maturity_value: Number(formData.maturity_value),
          deposit_date: formData.deposit_date,
          maturity_date: formData.maturity_date,
          rate_of_interest: formData.rate_of_interest,
          is_premature_withdrawal: formData.is_premature_withdrawal,
          is_active: formData.is_active
        });
      } else {
        // Create new deposit
        response = await axiosInstance.post(API_PATHS.ADD_DEPOSIT, {
          deposit_value: formData.deposit_value,
          maturity_value: Number(formData.maturity_value),
          deposit_date: formData.deposit_date,
          maturity_date: formData.maturity_date,
          rate_of_interest: formData.rate_of_interest
        });
      }
      
      console.log('Deposit saved successfully:', response.data);
      
      // Call the onSave callback with the response data
      onSave(formData);
      
      // Reset form
      setFormData({
        deposit_value: 0,
        maturity_value: 0,
        deposit_date: '',
        maturity_date: '',
        rate_of_interest: 0,
        is_premature_withdrawal: false,
        is_active: true
      });
      onClose();
    } catch (error) {
      console.error('Error saving deposit:', error);
      // You could add error handling here (e.g., show error message to user)
    } finally {
      setIsSaving(false);
    }
  };

  const handleClose = () => {
    // Reset form when closing
    setFormData({
      deposit_value: 0,
      maturity_value: 0,
      deposit_date: '',
      maturity_date: '',
      rate_of_interest: 0,
      is_premature_withdrawal: false,
      is_active: true
    });
    onClose();
  };

  return (
    <Modal className="bg-white [&>*]:!bg-white [&_*]:!text-gray-900" show={isOpen} onClose={handleClose} size="md">
      <ModalHeader className="bg-white text-gray-900 border-gray-200">
        <div>
          <div className="text-lg font-semibold">{editData ? 'Edit Deposit' : 'Add Deposit'}</div>
          <div className="text-sm text-gray-600">
            Investment Deposit Details
          </div>
        </div>
      </ModalHeader>

      <ModalBody className="bg-white">
        <div className="space-y-6">
          {/* Deposit Value */}
          <div>
            <label htmlFor="deposit_value" className="mb-2 block text-sm font-medium text-gray-900">Deposit Value *</label>
            <div className="relative">
              <input
                id="deposit_value"
                type="text"
                placeholder="Enter deposit amount"
                required
                value={formData.deposit_value || ''}
                onChange={(e) => handleInputChange('deposit_value', parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 bg-blue-50 border border-blue-200 text-gray-900 placeholder-gray-500 rounded-lg focus:ring-blue-500 focus:border-blue-500 outline-none"
              />
            </div>
          </div>

          {/* Maturity Value */}
          <div>
            <label htmlFor="maturity_value" className="mb-2 block text-sm font-medium text-gray-900">
              Maturity Value {editData ? '*' : '(Auto-calculated)'}
            </label>
            <div className="relative">
              <input
                id="maturity_value"
                type="text"
                placeholder="Enter maturity amount"
                required={!!editData}
                value={formData.maturity_value || ''}
                onChange={(e) => handleInputChange('maturity_value', parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 bg-blue-50 border border-blue-200 text-gray-900 placeholder-gray-500 rounded-lg focus:ring-blue-500 focus:border-blue-500 outline-none"
              />
            </div>
            {!editData && (
              <p className="text-xs text-gray-500 mt-1">
                Maturity value is calculated automatically based on deposit value, interest rate, and time period. You can edit it if needed.
              </p>
            )}
          </div>

          {/* Deposit Date and Maturity Date */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="deposit_date" className="mb-2 block text-sm font-medium text-gray-900">Deposit Date *</label>
              <input
                id="deposit_date"
                type="date"
                required
                value={formData.deposit_date ? formatDateForInput(formData.deposit_date) : ''}
                onChange={(e) => handleInputChange('deposit_date', e.target.value)}
                className="w-full px-3 py-2 bg-blue-50 border border-blue-200 text-gray-900 rounded-lg focus:ring-blue-500 focus:border-blue-500 outline-none"
              />
            </div>

            <div>
              <label htmlFor="maturity_date" className="mb-2 block text-sm font-medium text-gray-900">Maturity Date *</label>
              <input
                id="maturity_date"
                type="date"
                required
                value={formData.maturity_date ? formatDateForInput(formData.maturity_date) : ''}
                onChange={(e) => handleInputChange('maturity_date', e.target.value)}
                className="w-full px-3 py-2 bg-blue-50 border border-blue-200 text-gray-900 rounded-lg focus:ring-blue-500 focus:border-blue-500 outline-none"
              />
            </div>
          </div>

          {/* Rate of Interest */}
          <div>
            <label htmlFor="rate_of_interest" className="mb-2 block text-sm font-medium text-gray-900">Rate of Interest (%) *</label>
            <div className="relative">
              <input
                id="rate_of_interest"
                type="number"
                step="0.01"
                placeholder="Enter interest rate"
                required
                value={formData.rate_of_interest || ''}
                onChange={(e) => handleInputChange('rate_of_interest', parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 bg-blue-50 border border-blue-200 text-gray-900 placeholder-gray-500 rounded-lg focus:ring-blue-500 focus:border-blue-500 outline-none"
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                onClick={() => handleInputChange('rate_of_interest', 0)}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                </svg>
              </button>
            </div>
          </div>

          {/* Is Premature Withdrawal - Only show when editing */}
          {editData && (
            <div className="flex items-center space-x-3">
              <input
                id="is_premature_withdrawal"
                type="checkbox"
                checked={formData.is_premature_withdrawal || false}
                onChange={(e) => handleInputChange('is_premature_withdrawal', e.target.checked)}
                className="w-4 h-4 text-blue-600 bg-blue-50 border-blue-200 rounded focus:ring-blue-500 focus:ring-2"
              />
              <label htmlFor="is_premature_withdrawal" className="text-sm font-medium text-gray-900">
                Is Premature Withdrawal
              </label>
            </div>
          )}

          {/* Is Active - Only show when editing */}
          {editData && (
            <div className="flex items-center space-x-3">
              <input
                id="is_active"
                type="checkbox"
                checked={formData.is_active || false}
                onChange={(e) => handleInputChange('is_active', e.target.checked)}
                className="w-4 h-4 text-blue-600 bg-blue-50 border-blue-200 rounded focus:ring-blue-500 focus:ring-2"
              />
              <label htmlFor="is_active" className="text-sm font-medium text-gray-900">
                Is Active
              </label>
            </div>
          )}
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
              {editData ? 'Update Deposit' : 'Save Deposit'}
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
