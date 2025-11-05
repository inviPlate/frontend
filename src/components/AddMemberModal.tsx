import { useState, useEffect } from 'react';
import { Button, Modal, ModalHeader, ModalBody, ModalFooter, Label } from 'flowbite-react';
import useAxios from '../context/useAxios';
import { API_PATHS } from '../utils/apiPath';

interface MemberData {
  name: string;
  phone_number: string;
  email: string;
}

interface Member {
  id: number;
  name: string;
  phone_number: string;
  email: string;
  is_active?: boolean;
}

interface AddMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: MemberData) => void;
  prefilledName?: string;
  editData?: Member | null;
}

export function AddMemberModal({ isOpen, onClose, onSave, prefilledName, editData }: AddMemberModalProps) {
  const axios = useAxios();
  const [formData, setFormData] = useState<MemberData>({
    name: '',
    phone_number: '',
    email: ''
  });

  const [isSaving, setIsSaving] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const isEditMode = !!editData;

  const handleInputChange = (field: keyof MemberData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setHasUnsavedChanges(true);
  };

  const handleSave = async () => {
    // Validate form data - only name is required
    if (!formData.name.trim()) {
      setErrorMessage('Name is required');
      return;
    }

    // Email validation - only if email is provided
    if (formData.email.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email)) {
        setErrorMessage('Please enter a valid email address');
        return;
      }
    }

    setIsSaving(true);
    setErrorMessage('');

    try {
      if (isEditMode && editData) {
        // Update existing member
        await axios.put(API_PATHS.UPDATE_MEMBER(editData.id), formData);
      } else {
        // Add new member
        await axios.post(API_PATHS.ADD_MEMBER, formData);
      }
      
      // Call the onSave callback with the form data
      onSave(formData);
      
      // Reset form and close
      resetForm();
      onClose();
    } catch (error: any) {
      console.error('Error saving member:', error);
      setErrorMessage(error.response?.data?.message || error.message || `Failed to ${isEditMode ? 'update' : 'save'} member. Please try again.`);
    } finally {
      setIsSaving(false);
    }
  };

  const clearField = (field: keyof MemberData) => {
    setFormData(prev => ({ ...prev, [field]: '' }));
    setHasUnsavedChanges(true);
  };

  const resetForm = () => {
    if (editData) {
      setFormData({
        name: editData.name || '',
        phone_number: editData.phone_number || '',
        email: editData.email || ''
      });
    } else {
      setFormData({
        name: prefilledName || '',
        phone_number: '',
        email: ''
      });
    }
    setHasUnsavedChanges(false);
    setErrorMessage('');
  };

  // Reset form when modal opens or editData changes
  useEffect(() => {
    if (isOpen) {
      resetForm();
      // Focus first input after a short delay to ensure DOM is ready
      setTimeout(() => {
        const firstInput = document.getElementById('memberName');
        if (firstInput) {
          firstInput.focus();
        }
      }, 100);
    }
  }, [isOpen, editData, prefilledName]);

  const handleClose = () => {
    if (hasUnsavedChanges) {
      if (window.confirm('You have unsaved changes. Are you sure you want to close?')) {
        resetForm();
        onClose();
      }
    } else {
      resetForm();
      onClose();
    }
  };

  return (
    <Modal show={isOpen} onClose={handleClose} size="lg" className="[&>*]:!bg-gray-100 [&_*]:!text-gray-900">
      <ModalHeader className="bg-gray-100 border-gray-200">
        <div className="text-2xl font-bold text-gray-900">{isEditMode ? 'Edit Member' : 'Add New Member'}</div>
      </ModalHeader>
      
      <ModalBody className="bg-gray-100">
        <div className="space-y-6">
          {/* Error Message */}
          {errorMessage && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              <div className="flex items-center">
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
                {errorMessage}
              </div>
            </div>
          )}
          
          {/* Name Field */}
          <div>
            <Label htmlFor="memberName" className="block text-sm font-medium text-gray-700 mb-2">
              Name *
            </Label>
            <div className="relative">
              <input
                id="memberName"
                type="text"
                placeholder="Enter member name"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                className="w-full px-3 py-2 bg-white border border-gray-300 text-gray-900 placeholder-gray-500 rounded-lg focus:ring-blue-500 focus:border-blue-500 outline-none pl-10"
              />
              <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
              </svg>
              <button
                type="button"
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                onClick={() => clearField('name')}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                </svg>
              </button>
            </div>
          </div>

          {/* Phone Field */}
          <div>
            <Label htmlFor="memberPhone" className="block text-sm font-medium text-gray-700 mb-2">
              Phone Number
            </Label>
            <div className="relative">
              <input
                id="memberPhone"
                type="tel"
                placeholder="Enter phone number"
                value={formData.phone_number}
                onChange={(e) => handleInputChange('phone_number', e.target.value)}
                className="w-full px-3 py-2 bg-white border border-gray-300 text-gray-900 placeholder-gray-500 rounded-lg focus:ring-blue-500 focus:border-blue-500 outline-none pl-10"
              />
              <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"></path>
              </svg>
              <button
                type="button"
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                onClick={() => clearField('phone_number')}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                </svg>
              </button>
            </div>
          </div>

          {/* Email Field */}
          <div>
            <Label htmlFor="memberEmail" className="block text-sm font-medium text-gray-700 mb-2">
              Email Address
            </Label>
            <div className="relative">
              <input
                id="memberEmail"
                type="email"
                placeholder="Enter email address"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                className="w-full px-3 py-2 bg-white border border-gray-300 text-gray-900 placeholder-gray-500 rounded-lg focus:ring-blue-500 focus:border-blue-500 outline-none pl-10"
              />
              <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path>
              </svg>
              <button
                type="button"
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                onClick={() => clearField('email')}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                </svg>
              </button>
            </div>
          </div>
        </div>
      </ModalBody>
      
      <ModalFooter className="bg-gray-100 border-gray-200">
        <div className="flex gap-3">
          <Button
            onClick={handleClose}
            className="bg-gray-500 hover:bg-gray-600 text-white px-6 py-2 rounded-md font-medium"
          >
            Cancel
          </Button>

          <Button
            onClick={handleSave}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-md font-medium flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={isSaving}
          >
            {isSaving ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                {isEditMode ? 'Updating...' : 'Saving...'}
              </>
            ) : (
              <>
                {isEditMode ? 'Update' : 'Save'}
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path>
                </svg>
              </>
            )}
          </Button>
        </div>
      </ModalFooter>
    </Modal>
  );
}
