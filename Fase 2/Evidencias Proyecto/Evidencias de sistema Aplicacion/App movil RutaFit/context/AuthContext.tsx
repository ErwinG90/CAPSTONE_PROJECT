import { createContext, useState, useContext, ReactNode } from "react";

const AuthContext = createContext({
    isLoggedIn: false,
    setIsLoggedIn: (_: boolean) => { },
});

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [isLoggedIn, setIsLoggedIn] = useState(false);

    return (
        <AuthContext.Provider value={{ isLoggedIn, setIsLoggedIn }}>
            {children}
        </AuthContext.Provider>
    );
}
