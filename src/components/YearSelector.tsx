import { Dropdown, DropdownItem } from 'flowbite-react';
import { useState, useEffect } from 'react';
import useAxios from '../context/useAxios';
import { API_PATHS } from '../utils/apiPath';

interface YearSelectorProps {
  selectedYear: string;
  onYearChange: (year: string) => void;
  onYearsLoaded?: (years: Array<{ id: number; year: string; is_active: boolean; is_deleted: boolean }>) => void;
  label?: string;
  className?: string;
}

export default function YearSelector({ 
  selectedYear, 
  onYearChange, 
  onYearsLoaded,
  label = "Fiscal Year:",
  className = "w-48"
}: YearSelectorProps) {
  const [fiscalYears, setFiscalYears] = useState<Array<{ id: number; year: string; is_active: boolean; is_deleted: boolean }>>([]);
  const [isLoadingYears, setIsLoadingYears] = useState(false);
  const axiosInstance = useAxios();

  // Fetch fiscal years from API
  useEffect(() => {
    const fetchFiscalYears = async () => {
      setIsLoadingYears(true);
      try {
        const response = await axiosInstance.get(API_PATHS.FISCAL_YEARS);
        const years = response.data.data || [];
        console.log('Fiscal years fetched:', years);
        setFiscalYears(years);
        
        // Notify parent component that years are loaded
        if (onYearsLoaded) {
          onYearsLoaded(years);
        }
      } catch (error) {
        console.error('Error fetching fiscal years:', error);
      } finally {
        setIsLoadingYears(false);
      }
    };

    fetchFiscalYears();
  }, [axiosInstance]); // Remove onYearsLoaded dependency

  return (
    <div className="flex items-center space-x-4 mt-4">
      <label className="text-sm font-medium text-gray-700">
        {label}
      </label>
        <Dropdown
          label={
            <span className="flex items-center space-x-2">
              {isLoadingYears ? (
                <svg className="animate-spin h-4 w-4 text-gray-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              ) : (
                <span>{selectedYear}</span>
              )}
            </span>
          }
          className={className}
          disabled={isLoadingYears}
        >
          {fiscalYears.map((year) => (
            <DropdownItem key={year.id} onClick={() => onYearChange(year.year)}>
              {year.year}
            </DropdownItem>
          ))}
        </Dropdown>
    </div>
  );
}
