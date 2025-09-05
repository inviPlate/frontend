import { useState, useEffect } from 'react';
import { Button, Modal, ModalHeader, ModalBody, ModalFooter, Label } from 'flowbite-react';
import useAxios from '../context/useAxios';
import useAxiosDev from '../context/useAxiosDev';
import { API_PATHS } from '../utils/apiPath';
import { HeadAutocomplete } from './HeadAutocomplete';

interface OffertoryData {
  firstOffertory: string;
  secondOffertory: string;
  sundaySchool: string;
  offertoryDate: string;
  others?: string;
  note?: string;
  OthersHeadID?: string;
  tithes: Array<{
    name: string;
    amount: string;
    modeOfPayment: 'Cash' | 'Cheque' | 'UPI';
    upiChequeNo: string;
  }>;
}

interface HeadSuggestion {
  id: number;
  head: string;
  particulars: string;
  type: 'income' | 'expense';
}

interface OffertoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: OffertoryData) => void;
}

export function OffertoryModal({ isOpen, onClose, onSave }: OffertoryModalProps) {
  const [formData, setFormData] = useState<OffertoryData>({
    firstOffertory: '',
    secondOffertory: '',
    sundaySchool: '',
    offertoryDate: '',
    others: '',
    note: '',
    OthersHeadID: undefined,
    tithes: [{ name: '', amount: '', modeOfPayment: 'Cash', upiChequeNo: '' }]
  });

  const [isSaving, setIsSaving] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [titheNameSuggestions, setTitheNameSuggestions] = useState<string[]>([]);
  const [showTitheSuggestions, setShowTitheSuggestions] = useState<number | null>(null); // Track which tithe index is showing suggestions
  const [isLoadingTitheNames, setIsLoadingTitheNames] = useState(false);
  const axiosInstance = useAxios();
  const axiosInstanceDev = useAxiosDev();
  // Helper function to format date to DD/MM/YYYY
  const formatDateToDDMMYYYY = (dateString: string): string => {
    const date = new Date(dateString);
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  // Function to fetch tithe name suggestions
  const fetchTitheNameSuggestions = async (searchTerm: string, titheIndex: number) => {
    if (searchTerm.trim().length < 2) {
      setTitheNameSuggestions([]);
      setShowTitheSuggestions(null);
      return;
    }

    setIsLoadingTitheNames(true);
    try {
      const response = await axiosInstance.get(`${API_PATHS.GET_TITHE_NAMES}?search=${encodeURIComponent(searchTerm)}`);
      console.log('API Response:', response.data); // Debug log
      
      // Extract names from the tithe entries
      const titheEntries = response.data.data || [];
      const suggestions = titheEntries.map((entry: any) => entry.name);
      console.log('Extracted names:', suggestions); // Debug log
      
      setTitheNameSuggestions(suggestions);
      if (suggestions.length > 0) {
        setShowTitheSuggestions(titheIndex);
      }
    } catch (error) {
      console.error('Error fetching tithe name suggestions:', error);
      setTitheNameSuggestions([]);
      setShowTitheSuggestions(null);
    } finally {
      setIsLoadingTitheNames(false);
    }
  };

  // Debounced search function
  const debouncedSearch = (() => {
    let timeoutId: ReturnType<typeof setTimeout>;
    return (searchTerm: string, titheIndex: number) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        fetchTitheNameSuggestions(searchTerm, titheIndex);
      }, 300);
    };
  })();

  // Handle suggestion selection
  const handleSuggestionSelect = (index: number, suggestion: string) => {
    handleTitheChange(index, 'name', suggestion);
    setShowTitheSuggestions(null);
    setTitheNameSuggestions([]);
  };

  // Handle input blur
  const handleInputBlur = (index: number) => {
    // Small delay to allow suggestion click to register first
    setTimeout(() => {
      setShowTitheSuggestions(null);
    }, 100);
  };

  const handleInputChange = (field: keyof OffertoryData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setHasUnsavedChanges(true);
  };

  const handleHeadSelect = (head: HeadSuggestion) => {
    setFormData(prev => ({ ...prev, OthersHeadID: head.head }));
    setHasUnsavedChanges(true);
  };

  const handleTitheChange = (index: number, field: keyof OffertoryData['tithes'][0], value: string) => {
    setFormData(prev => ({
      ...prev,
      tithes: prev.tithes.map((tithe, i) => 
        i === index ? { ...tithe, [field]: value } : tithe
      )
    }));
    setHasUnsavedChanges(true);

    // If updating name field, trigger autocomplete search
    if (field === 'name') {
      debouncedSearch(value, index);
    }
  };

  const addMoreTithes = () => {
    setFormData(prev => ({
      ...prev,
      tithes: [...prev.tithes, { name: '', amount: '', modeOfPayment: 'Cash', upiChequeNo: '' }]
    }));
    setHasUnsavedChanges(true);
  };

  const removeTithe = (index: number) => {
    if (formData.tithes.length > 1) {
      setFormData(prev => ({
        ...prev,
        tithes: prev.tithes.filter((_, i) => i !== index)
      }));
      setHasUnsavedChanges(true);
    }
  };

  const handleSave = async () => {
    // Validate form data
    if (!formData.firstOffertory.trim() && !formData.secondOffertory.trim() && 
        !formData.sundaySchool.trim() && !formData.others?.trim() && !formData.OthersHeadID && formData.tithes.every(t => !t.name.trim() && !t.amount.trim())) {
      console.error('Please fill in at least one field');
      return;
    }
    
    setIsSaving(true);
    try {
      // Prepare data for API call
      const apiData = {
        date: formData.offertoryDate ? formatDateToDDMMYYYY(formData.offertoryDate) : formatDateToDDMMYYYY(new Date().toISOString()),
        first_offertory: parseFloat(formData.firstOffertory) || 0,
        second_offertory: parseFloat(formData.secondOffertory) || 0,
        sunday_school: parseFloat(formData.sundaySchool) || 0,
        others: formData.others,
        notes: formData.note,
        others_head_id: formData.OthersHeadID,
        tithes: formData.tithes
          .filter(tithe => tithe.name.trim() && tithe.amount.trim()) // Only include filled tithes
          .map(tithe => ({
            name: tithe.name.trim(),
            amount: parseFloat(tithe.amount) || 0,
            mode_of_payment: tithe.modeOfPayment.toLowerCase(),
            payment_reference: tithe.modeOfPayment === 'Cash' ? '' : tithe.upiChequeNo.trim()
          }))
      };

      // Make API call
      const response = await axiosInstanceDev.post(API_PATHS.CREATE_OFFERTORY, apiData);
      
      console.log('Offertory saved successfully:', response.data);
      
      // Call the onSave callback with the response data
      onSave(formData);
      
      // Reset form and close
      resetForm();
      onClose();
    } catch (error: any) {
      console.error('Error saving offertory:', error);
      setErrorMessage(error.response?.data?.message || error.message || 'Failed to save offertory. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const clearField = (field: keyof OffertoryData) => {
    setFormData(prev => ({ ...prev, [field]: '' }));
  };

  const clearTitheField = (index: number, field: keyof OffertoryData['tithes'][0]) => {
    handleTitheChange(index, field, '');
  };

  const resetForm = () => {
          setFormData({
        firstOffertory: '',
        secondOffertory: '',
        sundaySchool: '',
        offertoryDate: '',
        others: '',
        note: '',
        OthersHeadID: undefined,
        tithes: [{ name: '', amount: '', modeOfPayment: 'Cash', upiChequeNo: '' }]
      });
    setHasUnsavedChanges(false);
    setErrorMessage('');
    setTitheNameSuggestions([]);
    setShowTitheSuggestions(null);
  };

  // Reset form when modal opens and focus first input
  useEffect(() => {
    if (isOpen) {
      resetForm();
      // Focus first input after a short delay to ensure DOM is ready
      setTimeout(() => {
        const firstInput = document.getElementById('firstOffertory');
        if (firstInput) {
          firstInput.focus();
        }
      }, 100);
    }
  }, [isOpen]);

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
    <Modal show={isOpen} onClose={handleClose} size="4xl" className="[&>*]:!bg-gray-100 [&_*]:!text-gray-900">
      <ModalHeader className="bg-gray-100 border-gray-200">
        <div className="text-2xl font-bold text-gray-900">Offertory Details</div>
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
          
          {/* First and Second Offertory Section */}
            <div className="grid grid-cols-2 gap-6">
              <div>
                <Label htmlFor="firstOffertory" className="block text-sm font-medium text-gray-700 mb-2">
                  First Offertory
                </Label>
                <div className="relative">
                  <input
                    id="firstOffertory"
                    type="text"
                    placeholder="First offertory"
                    value={formData.firstOffertory}
                    onChange={(e) => handleInputChange('firstOffertory', e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-gray-300 text-gray-900 placeholder-gray-500 rounded-lg focus:ring-blue-500 focus:border-blue-500 outline-none pl-8"
                  />
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 font-medium">₹</span>
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    onClick={() => clearField('firstOffertory')}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                    </svg>
                  </button>
                </div>
              </div>

              <div>
                <Label htmlFor="secondOffertory" className="block text-sm font-medium text-gray-700 mb-2">
                  Second Offertory
                </Label>
                <div className="relative">
                  <input
                    id="secondOffertory"
                    type="text"
                    placeholder="Second offertory"
                    value={formData.secondOffertory}
                    onChange={(e) => handleInputChange('secondOffertory', e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-gray-300 text-gray-900 placeholder-gray-500 rounded-lg focus:ring-blue-500 focus:border-blue-500 outline-none pl-8"
                  />
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 font-medium">₹</span>
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    onClick={() => clearField('secondOffertory')}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                    </svg>
                  </button>
                </div>
              </div>
            </div>

            {/* Sunday School Section */}
            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Sunday School
                </label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Sunday School"
                    value={formData.sundaySchool}
                    onChange={(e) => handleInputChange('sundaySchool', e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-gray-300 text-gray-900 placeholder-gray-500 rounded-lg focus:ring-blue-500 focus:border-blue-500 outline-none pl-8"
                  />
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 font-medium">₹</span>
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    onClick={() => clearField('sundaySchool')}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                    </svg>
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Date
                </label>
                <div className="relative">
                  <input
                    type="date"
                    value={formData.offertoryDate}
                    onChange={(e) => handleInputChange('offertoryDate', e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-gray-300 text-gray-900 rounded-lg focus:ring-blue-500 focus:border-blue-500 outline-none pl-10"
                  />
                  <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                  </svg>
                </div>
              </div>
            </div>

            {/* Others and Note Section */}
            <div className="grid grid-cols-2 gap-6">
              <div>
                <Label htmlFor="others" className="block text-sm font-medium text-gray-700 mb-2">
                  Others
                </Label>
                <div className="relative">
                  <input
                    id="others"
                    type="text"
                    placeholder="Others"
                    value={formData.others}
                    onChange={(e) => handleInputChange('others', e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-gray-300 text-gray-900 placeholder-gray-500 rounded-lg focus:ring-blue-500 focus:border-blue-500 outline-none pl-8"
                  />
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 font-medium">₹</span>
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    onClick={() => clearField('others')}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                    </svg>
                  </button>
                </div>
              </div>

              <div>
                <Label htmlFor="note" className="block text-sm font-medium text-gray-700 mb-2">
                  Note
                </Label>
                <div className="relative">
                  <textarea
                    id="note"
                    placeholder="Add any notes (e.g., special instructions)"
                    value={formData.note}
                    onChange={(e) => handleInputChange('note', e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 bg-white border border-gray-300 text-gray-900 rounded-lg focus:ring-blue-500 focus:border-blue-500 outline-none resize-none"
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    onClick={() => clearField('note')}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                    </svg>
                  </button>
                </div>
              </div>
            </div>

            {/* Head Selection */}
            <HeadAutocomplete
              value={formData.OthersHeadID?.toString() ?? ''}
              onChange={(value) => handleInputChange('OthersHeadID', value)}
              onHeadSelect={handleHeadSelect}
              placeholder="Start typing to search existing heads..."
              label="Head for Others"
              type="income"
            />

            {/* Tithes Section */}
            <div className="border-t-2 border-blue-500 pt-4">
              <h3 className="text-lg font-semibold text-gray-900 text-center mb-4">Tithes</h3>
              
              {formData.tithes.map((tithe, index) => (
                <div key={index} className="bg-white p-4 rounded-lg mb-4 border border-gray-200 relative">
                  {/* Serial Counter */}
                  <div className="absolute top-2 left-2 bg-blue-100 text-blue-800 text-xs font-semibold px-2 py-1 rounded-full">
                    #{index + 1}
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 mb-4 mt-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Name
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          placeholder="Start typing to search names..."
                          value={tithe.name}
                          onChange={(e) => handleTitheChange(index, 'name', e.target.value)}
                          onFocus={() => {
                            if (tithe.name.trim().length >= 2 && titheNameSuggestions.length > 0) {
                              setShowTitheSuggestions(index);
                            }
                          }}
                          onBlur={() => handleInputBlur(index)}
                          className="w-full px-3 py-2 bg-white border border-gray-300 text-gray-900 placeholder-gray-500 rounded-lg focus:ring-blue-500 focus:border-blue-500 outline-none"
                        />
                        <button
                          type="button"
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                          onClick={() => clearTitheField(index, 'name')}
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                          </svg>
                        </button>

                        {/* Autocomplete Suggestions Dropdown */}
                        {showTitheSuggestions === index && (
                          <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                            {isLoadingTitheNames ? (
                              <div className="p-3 text-center text-gray-500">
                                <div className="inline-flex items-center">
                                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                  </svg>
                                  Searching...
                                </div>
                              </div>
                            ) : titheNameSuggestions.length > 0 ? (
                              titheNameSuggestions.map((suggestion, suggestionIndex) => (
                                <button
                                  key={suggestionIndex}
                                  type="button"
                                  className="w-full px-3 py-2 text-left hover:bg-gray-50 focus:bg-gray-50 focus:outline-none border-b border-gray-100 last:border-b-0"
                                  onClick={() => handleSuggestionSelect(index, suggestion)}
                                >
                                  <div className="font-medium text-gray-900">{suggestion}</div>
                                </button>
                              ))
                            ) : (
                              <div className="p-3 text-center text-gray-500">No matching names found</div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Ammount
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          placeholder="Input text"
                          value={tithe.amount}
                          onChange={(e) => handleTitheChange(index, 'amount', e.target.value)}
                          className="w-full px-3 py-2 bg-white border border-gray-300 text-gray-900 placeholder-gray-500 rounded-lg focus:ring-blue-500 focus:border-blue-500 outline-none"
                        />
                        <button
                          type="button"
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                          onClick={() => clearTitheField(index, 'amount')}
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Mode of payment
                    </label>
                    <div className="flex items-center space-x-4">
                      <label className="flex items-center">
                        <input
                          type="radio"
                          name={`mode-${index}`}
                          value="Cash"
                          checked={tithe.modeOfPayment === 'Cash'}
                          onChange={(e) => handleTitheChange(index, 'modeOfPayment', e.target.value as 'Cash' | 'Cheque' | 'UPI')}
                          className="mr-2 text-blue-600 focus:ring-blue-500"
                        />
                        Cash
                      </label>
                      <label className="flex items-center">
                        <input
                          type="radio"
                          name={`mode-${index}`}
                          value="Cheque"
                          checked={tithe.modeOfPayment === 'Cheque'}
                          onChange={(e) => handleTitheChange(index, 'modeOfPayment', e.target.value as 'Cash' | 'Cheque' | 'UPI')}
                          className="mr-2 text-blue-600 focus:ring-blue-500"
                        />
                        Cheque
                      </label>
                      <label className="flex items-center">
                        <input
                          type="radio"
                          name={`mode-${index}`}
                          value="UPI"
                          checked={tithe.modeOfPayment === 'UPI'}
                          onChange={(e) => handleTitheChange(index, 'modeOfPayment', e.target.value as 'Cash' | 'Cheque' | 'UPI')}
                          className="mr-2 text-blue-600 focus:ring-blue-500"
                        />
                        UPI
                      </label>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      UPI/Cheque no
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        placeholder={tithe.modeOfPayment === 'Cash' ? 'Not required for cash' : 'Input text'}
                        value={tithe.upiChequeNo}
                        onChange={(e) => handleTitheChange(index, 'upiChequeNo', e.target.value)}
                        disabled={tithe.modeOfPayment === 'Cash'}
                        className={`w-full px-3 py-2 border rounded-lg outline-none ${
                          tithe.modeOfPayment === 'Cash' 
                            ? 'bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed' 
                            : 'bg-white border-gray-300 text-gray-900 focus:ring-blue-500 focus:border-blue-500'
                        }`}
                      />
                      {tithe.modeOfPayment !== 'Cash' && (
                        <button
                          type="button"
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                          onClick={() => clearTitheField(index, 'upiChequeNo')}
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                          </svg>
                        </button>
                      )}
                    </div>
                  </div>

                  {formData.tithes.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeTithe(index)}
                      className="absolute top-2 right-2 text-red-500 hover:text-red-700 transition-colors p-1 rounded-full hover:bg-red-50"
                      title="Remove tithe entry"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                      </svg>
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
          
          {/* Add More Button - Centered */}
          <div className="flex justify-center pt-4">
            <Button
              onClick={addMoreTithes}
              className="bg-blue-600 hover:bg-blue-700 text-white border border-blue-600 px-6 py-2 rounded-md font-medium flex items-center gap-2"
            >
              Add More
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
              </svg>
            </Button>
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
          </div>
                 </ModalFooter>
       </Modal>
     );
   }
