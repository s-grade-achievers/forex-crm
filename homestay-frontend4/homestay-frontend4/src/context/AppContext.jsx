import { createContext, useState } from 'react';

export const AppContext = createContext();

export const AppContextProvider = ({ children }) => {
  const [role, setRole] = useState(null);
  const [hostId, setHostId] = useState(null);
  const [customerId, setCustomerId] = useState(null); // Added for customer UID management

  return (
    <AppContext.Provider value={{ role, setRole, hostId, setHostId, customerId, setCustomerId }}>
      {children}
    </AppContext.Provider>
  );
};