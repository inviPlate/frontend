import React, { createContext, useContext, useState, ReactNode } from 'react';

interface OffertoryModalContextType {
  isOpen: boolean;
  openModal: () => void;
  closeModal: () => void;
}

const OffertoryModalContext = createContext<OffertoryModalContextType | undefined>(undefined);

export const useOffertoryModal = () => {
  const context = useContext(OffertoryModalContext);
  if (context === undefined) {
    throw new Error('useOffertoryModal must be used within an OffertoryModalProvider');
  }
  return context;
};

interface OffertoryModalProviderProps {
  children: ReactNode;
}

export const OffertoryModalProvider: React.FC<OffertoryModalProviderProps> = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);

  const openModal = () => setIsOpen(true);
  const closeModal = () => setIsOpen(false);

  return (
    <OffertoryModalContext.Provider value={{ isOpen, openModal, closeModal }}>
      {children}
    </OffertoryModalContext.Provider>
  );
};
