import { createSlice, PayloadAction } from '@reduxjs/toolkit';

// Интерфейс состояния аутентификации
interface AuthState {
  isAuthenticated: boolean;
  user: {
    email: string;
    nickname: string;
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
    login: (state, action: PayloadAction<{ email: string; nickname: string; token: string }>) => {
      state.isAuthenticated = true;
      state.user = {
        email: action.payload.email,
        nickname: action.payload.nickname,
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
        localStorage.removeItem('userNickname');
      }
    },
    // Восстановление сессии из localStorage
    restoreSession: (state, action: PayloadAction<{ email: string; nickname: string; token: string }>) => {
      state.isAuthenticated = true;
      state.user = {
        email: action.payload.email,
        nickname: action.payload.nickname,
        token: action.payload.token,
      };
    },
  },
});

export const { login, logout, restoreSession } = authSlice.actions;
export default authSlice.reducer;
