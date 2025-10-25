import { Modal, ModalHeader, ModalBody, ModalFooter, Button } from "flowbite-react";
import { useState, useEffect } from "react";
import useAxios from "../context/useAxios";
import { API_PATHS } from "../utils/apiPath";

interface AddYearModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: { year: string; clone_from_id: number }) => void;
  existingYears: Array<{ id: number; year: string; is_active: boolean; is_deleted: boolean }>;
}

export function AddYearModal({ isOpen, onClose, onSave, existingYears }: AddYearModalProps) {
  const [formData, setFormData] = useState({
    year: '',
    clone_from_id: 0
  });
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const axiosInstance = useAxios();

  // Reset form when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setFormData({
        year: '',
        clone_from_id: 0
      });
      setErrorMessage('');
    }
  }, [isOpen]);

  const handleInputChange = (field: keyof typeof formData, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    // Clear error message when user starts typing
    if (errorMessage) {
      setErrorMessage('');
    }
  };

  const validateForm = () => {
    if (!formData.year.trim()) {
      setErrorMessage('Year is required');
      return false;
    }
    
    // Check if year already exists
    const yearExists = existingYears.some(existingYear => 
      existingYear.year.toLowerCase() === formData.year.toLowerCase()
    );
    
    if (yearExists) {
      setErrorMessage('This year already exists');
      return false;
    }

    // Basic year format validation (YYYY-YYYY)
    const yearPattern = /^\d{4}-\d{4}$/;
    if (!yearPattern.test(formData.year)) {
      setErrorMessage('Please enter year in format YYYY-YYYY (e.g., 2025-2026)');
      return false;
    }

    if (formData.clone_from_id === 0) {
      setErrorMessage('Please select a year to clone from');
      return false;
    }

    return true;
  };

  const handleSave = async () => {
    if (!validateForm()) {
      return;
    }

    setIsSaving(true);
    setErrorMessage('');

    try {
      const response = await axiosInstance.post(API_PATHS.ADD_YEAR, {
        year: formData.year,
        clone_from_id: formData.clone_from_id
      });

      console.log('Year added successfully:', response.data);
      
      // Call the onSave callback with the form data
      onSave(formData);
      
      // Reset form and close modal
      setFormData({
        year: '',
        clone_from_id: 0
      });
      onClose();
    } catch (error: any) {
      console.error('Error adding year:', error);
      setErrorMessage(
        error.response?.data?.message || 
        error.message || 
        'Failed to add year. Please try again.'
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleClose = () => {
    setFormData({
      year: '',
      clone_from_id: 0
    });
    setErrorMessage('');
    onClose();
  };

  return (
    <Modal className="bg-white [&>*]:!bg-white [&_*]:!text-gray-900" show={isOpen} onClose={handleClose} size="md">
      <ModalHeader className="bg-white text-gray-900 border-gray-200">
        <div>
          <div className="text-lg font-semibold">Add Effective Year</div>
          <div className="text-sm text-gray-600">
            Create a new fiscal year and optionally clone data from an existing year
          </div>
        </div>
      </ModalHeader>

      <ModalBody className="bg-white">
        <div className="space-y-6">
          {/* Year Input */}
          <div>
            <label htmlFor="year" className="block mb-2 text-sm font-medium text-black">
              Fiscal Year *
            </label>
            <div className="relative">
              <input
                id="year"
                type="text"
                placeholder="e.g., 2025-2026"
                required
                value={formData.year}
                onChange={(e) => handleInputChange('year', e.target.value)}
                className="w-full px-3 py-2 bg-blue-50 border border-blue-200 text-gray-900 placeholder-gray-500 rounded-lg focus:ring-blue-500 focus:border-blue-500 outline-none"
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Enter year in format YYYY-YYYY
            </p>
          </div>

          {/* Clone From Year */}
          <div>
            <label htmlFor="cloneFrom" className="block mb-2 text-sm font-medium text-black">
              Clone Data From *
            </label>
            <div className="relative">
              <select
                id="cloneFrom"
                required
                value={formData.clone_from_id}
                onChange={(e) => handleInputChange('clone_from_id', parseInt(e.target.value))}
                className="w-full px-3 py-2 bg-blue-50 border border-blue-200 text-gray-900 rounded-lg focus:ring-blue-500 focus:border-blue-500 outline-none appearance-none"
              >
                <option value={0}>Select a year to clone from</option>
                {existingYears.map((year) => (
                  <option key={year.id} value={year.id}>
                    {year.year}
                  </option>
                ))}
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                </svg>
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Select an existing year to copy budget structure and data
            </p>
          </div>

          {/* Error Message */}
          {errorMessage && (
            <div className="text-sm text-red-600 bg-red-50 border border-red-200 px-3 py-2 rounded">
              {errorMessage}
            </div>
          )}
        </div>
      </ModalBody>

      <ModalFooter className="bg-white border-gray-200">
        <Button
          onClick={handleSave}
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-md font-medium flex items-center gap-2"
          disabled={isSaving}
        >
          {isSaving ? (
            <>
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Adding Year...
            </>
          ) : (
            <>
              Add Year
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path>
              </svg>
            </>
          )}
        </Button>
        <Button
          onClick={handleClose}
          className="bg-gray-500 hover:bg-gray-600 text-white px-6 py-2 rounded-md font-medium"
          disabled={isSaving}
        >
          Cancel
        </Button>
      </ModalFooter>
    </Modal>
  );
}
