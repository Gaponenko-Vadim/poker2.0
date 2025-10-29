import { createSlice, PayloadAction } from '@reduxjs/toolkit';

// Интерфейс состояния аутентификации
interface AuthState {
  isAuthenticated: boolean;
  user: {
    email: string;
    token: string;
  } | null;
}

// Начальное состояние
const initialState: AuthState = {
  isAuthenticated: false,
  user: null,
};

// Слайс для управления аутентификацией
const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    // Действие для входа пользователя с JWT токеном
    login: (state, action: PayloadAction<{ email: string; token: string }>) => {
      state.isAuthenticated = true;
      state.user = {
        email: action.payload.email,
        token: action.payload.token,
      };
    },
    // Действие для выхода пользователя
    logout: (state) => {
      state.isAuthenticated = false;
      state.user = null;
      // Удаляем токен из localStorage
      if (typeof window !== 'undefined') {
        localStorage.removeItem('authToken');
        localStorage.removeItem('userEmail');
      }
    },
    // Восстановление сессии из localStorage
    restoreSession: (state, action: PayloadAction<{ email: string; token: string }>) => {
      state.isAuthenticated = true;
      state.user = {
        email: action.payload.email,
        token: action.payload.token,
      };
    },
  },
});

export const { login, logout, restoreSession } = authSlice.actions;
export default authSlice.reducer;
