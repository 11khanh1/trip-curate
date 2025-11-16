// src/context/UserContext.tsx
import { createContext, useContext, useState, useEffect, type Dispatch, type SetStateAction } from "react";

export interface User {
  id?: string | number;
  name: string;
  email: string;
  role?: "admin" | "user" | "partner" | "customer";
  phone?: string;
  address?: string;
  dateOfBirth?: string;
  gender?: string;
}

interface UserContextType {
  currentUser: User | null;
  setCurrentUser: Dispatch<SetStateAction<User | null>>;
}

const UserContext = createContext<UserContextType>({
  currentUser: null,
  setCurrentUser: () => undefined,
});

export const UserProvider = ({ children }: { children: React.ReactNode }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      setCurrentUser(JSON.parse(storedUser));
    }
  }, []);

  return (
    <UserContext.Provider value={{ currentUser, setCurrentUser }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => useContext(UserContext);
