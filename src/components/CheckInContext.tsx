import { createContext, useContext } from 'react';

export const CheckInContext = createContext<{ open: () => void }>({ open: () => {} });
export const useCheckIn = () => useContext(CheckInContext);
