import { User, UserState } from "@shared/user";

export type UserAction =
    | { type: 'LOGIN'; payload: User }
    | { type: 'LOGOUT' }
    | { type: 'UPDATE_USER'; payload: Partial<User> };

export const userReducer = (state: UserState, action: UserAction): UserState => {
    switch (action.type) {
        case 'LOGIN':
            return { ...state, user: action.payload, isLoggedIn: true };
        case 'LOGOUT':
            return { ...state, user: undefined, isLoggedIn: false };
        case 'UPDATE_USER':
            return { ...state, user: state.user ? { ...state.user, ...action.payload } : undefined };
        default:
            return state;
    }
};
