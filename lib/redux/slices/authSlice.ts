import { createSlice } from '@reduxjs/toolkit';

// Интерфейс состояния аутентификации
interface AuthState {
  isAuthenticated: boolean;
  user: {
    name: string;
    email: string;
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
    // Действие для входа пользователя (заглушка)
    login: (state) => {
      state.isAuthenticated = true;
      state.user = {
        name: 'Игрок',
        email: 'player@poker.com',
      };
    },
    // Действие для выхода пользователя
    logout: (state) => {
      state.isAuthenticated = false;
      state.user = null;
    },
  },
});

export const { login, logout } = authSlice.actions;
export default authSlice.reducer;
