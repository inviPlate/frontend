import { Modal, ModalHeader, ModalBody, ModalFooter, Button } from "flowbite-react";
import { useState, useEffect } from "react";
import useAxios from "../context/useAxios";
import { API_PATHS } from "../utils/apiPath";

interface AddAdvanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: any) => void;
  editData?: any | null;
}

interface AdvanceData {
  id?: number;
  amount: number;
  towards: string;
  is_recovered?: boolean;
}

export function AddAdvanceModal({ isOpen, onClose, onSave, editData }: AddAdvanceModalProps) {
  const [formData, setFormData] = useState<AdvanceData>({
    amount: 0,
    towards: '',
    is_recovered: false
  });

  const [isSaving, setIsSaving] = useState(false);
  const axiosInstance = useAxios();

  useEffect(() => {
    if (editData && isOpen) {
      setFormData({
        id: editData.id,
        amount: editData.amount,
        towards: editData.towards,
        is_recovered: editData.is_recovered || false
      });
    } else if (!editData && isOpen) {
      // Reset form for new advance
      setFormData({
        amount: 0,
        towards: '',
        is_recovered: false
      });
    }
  }, [editData, isOpen]);

  const handleInputChange = (field: keyof AdvanceData, value: string | number | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSave = async () => {
    // Validate form data
    if (!formData.amount || formData.amount <= 0 || !formData.towards) {
      console.error('Please fill in all required fields');
      return;
    }

    setIsSaving(true);
    try {
      let response;
      
      if (editData?.id) {
        // Update existing advance
        response = await axiosInstance.put(`${API_PATHS.UPDATE_ADVANCE}?id=${editData.id}`, {
          amount: formData.amount,
          towards: formData.towards,
          is_recovered: formData.is_recovered
        });
      } else {
        // Create new advance
        response = await axiosInstance.post(API_PATHS.ADD_ADVANCE, {
          amount: formData.amount,
          towards: formData.towards
        });
      }
      
      console.log('Advance saved successfully:', response.data);
      onSave(formData);
      
      // Reset form
      setFormData({
        amount: 0,
        towards: '',
        is_recovered: false
      });
      onClose();
    } catch (error) {
      console.error('Error saving advance:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleClose = () => {
    // Reset form when closing
    setFormData({
      amount: 0,
      towards: '',
      is_recovered: false
    });
    onClose();
  };

  return (
    <Modal className="bg-white [&>*]:!bg-white [&_*]:!text-gray-900" show={isOpen} onClose={handleClose} size="md">
      <ModalHeader className="bg-white text-gray-900 border-gray-200">
        <div>
          <div className="text-lg font-semibold">{editData ? 'Edit Advance' : 'Add Advance'}</div>
          <div className="text-sm text-gray-600">
            Advance Details
          </div>
        </div>
      </ModalHeader>

      <ModalBody className="bg-white">
        <div className="space-y-6">
          {/* Amount */}
          <div>
            <label htmlFor="amount" className="mb-2 block text-sm font-medium text-gray-900">Amount *</label>
            <input
              id="amount"
              type="text"
              placeholder="Enter amount"
              required
              value={formData.amount || ''}
              onChange={(e) => handleInputChange('amount', parseFloat(e.target.value) || 0)}
              className="w-full px-3 py-2 bg-blue-50 border border-blue-200 text-gray-900 placeholder-gray-500 rounded-lg focus:ring-blue-500 focus:border-blue-500 outline-none"
            />
          </div>

          {/* Towards */}
          <div>
            <label htmlFor="towards" className="mb-2 block text-sm font-medium text-gray-900">Towards *</label>
            <input
              id="towards"
              type="text"
              placeholder="Enter description"
              required
              value={formData.towards}
              onChange={(e) => handleInputChange('towards', e.target.value)}
              className="w-full px-3 py-2 bg-blue-50 border border-blue-200 text-gray-900 placeholder-gray-500 rounded-lg focus:ring-blue-500 focus:border-blue-500 outline-none"
            />
          </div>

          {/* Recovered - Only show when editing */}
          {editData && (
            <div className="flex items-center space-x-3">
              <input
                id="is_recovered"
                type="checkbox"
                checked={formData.is_recovered || false}
                onChange={(e) => handleInputChange('is_recovered', e.target.checked)}
                className="w-4 h-4 text-blue-600 bg-blue-50 border-blue-200 rounded focus:ring-blue-500 focus:ring-2"
              />
              <label htmlFor="is_recovered" className="text-sm font-medium text-gray-900">
                Recovered
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
              {editData ? 'Update Advance' : 'Save Advance'}
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

