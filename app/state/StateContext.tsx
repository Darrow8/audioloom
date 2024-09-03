import React, { createContext, useContext, useReducer, Dispatch } from 'react';
import { UserAction, userReducer } from './userReducer';
import { initialState, UserState } from '../scripts/user';

interface StateContextType {
  state: UserState;
  dispatch: Dispatch<UserAction>;
}

const StateContext = createContext<StateContextType | undefined>(undefined);

export const StateProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(userReducer, initialState);
  return (
    <StateContext.Provider value={{ state, dispatch }}>
      {children}
    </StateContext.Provider>
  );
};

export const useStateContext = (): StateContextType => {
  const context = useContext(StateContext);
  if (context === undefined) {
    throw new Error('useStateContext must be used within a StateProvider');
  }
  return context;
};
