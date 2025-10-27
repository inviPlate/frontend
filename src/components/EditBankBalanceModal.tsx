import { Modal, ModalHeader, ModalBody, ModalFooter, Button } from "flowbite-react";
import { useState, useEffect } from "react";
import useAxios from "../context/useAxios";
import { API_PATHS } from "../utils/apiPath";

interface EditBankBalanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (bankBalance: number) => void;
  currentBalance: number;
}

export function EditBankBalanceModal({ isOpen, onClose, onSave, currentBalance }: EditBankBalanceModalProps) {
  const [bankBalance, setBankBalance] = useState<number>(currentBalance);
  const [isSaving, setIsSaving] = useState(false);
  const axiosInstance = useAxios();

  useEffect(() => {
    if (isOpen) {
      setBankBalance(currentBalance);
    }
  }, [currentBalance, isOpen]);

  const handleSave = async () => {
    if (!bankBalance || bankBalance < 0) {
      console.error('Please enter a valid bank balance');
      return;
    }

    setIsSaving(true);
    try {
      const response = await axiosInstance.put(API_PATHS.UPDATE_FUND, {
        bank_balance: bankBalance
      });
      
      console.log('Bank balance updated successfully:', response.data);
      onSave(bankBalance);
      onClose();
    } catch (error) {
      console.error('Error updating bank balance:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleClose = () => {
    setBankBalance(currentBalance);
    onClose();
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('hi-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount);
  };

  return (
    <Modal className="bg-white [&>*]:!bg-white [&_*]:!text-gray-900" show={isOpen} onClose={handleClose} size="md">
      <ModalHeader className="bg-white text-gray-900 border-gray-200">
        <div>
          <div className="text-lg font-semibold">Edit Bank Balance</div>
          <div className="text-sm text-gray-600">
            Update the current bank balance
          </div>
        </div>
      </ModalHeader>

      <ModalBody className="bg-white">
        <div className="space-y-6">
          {/* Current Bank Balance Display */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <label className="text-sm font-medium text-gray-700">Current Bank Balance</label>
            <p className="text-2xl font-bold text-blue-600">{formatCurrency(currentBalance)}</p>
          </div>

          {/* New Bank Balance Input */}
          <div>
            <label htmlFor="bank_balance" className="mb-2 block text-sm font-medium text-gray-900">
              New Bank Balance *
            </label>
            <input
              id="bank_balance"
              type="text"
              placeholder="Enter new bank balance"
              required
              value={bankBalance || ''}
              onChange={(e) => setBankBalance(parseFloat(e.target.value) || 0)}
              className="w-full px-3 py-2 bg-blue-50 border border-blue-200 text-gray-900 placeholder-gray-500 rounded-lg focus:ring-blue-500 focus:border-blue-500 outline-none"
            />
            <p className="text-xs text-gray-500 mt-1">
              Enter the updated bank balance amount
            </p>
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
              Update Bank Balance
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

