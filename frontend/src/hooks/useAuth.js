import { useContext } from 'react';
import { AuthContext } from '../context/authContextBase';

export const useAuth = () => useContext(AuthContext);