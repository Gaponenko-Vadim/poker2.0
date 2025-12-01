import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import tableReducer from './slices/tableSlice';
import multiplayerReducer from './slices/multiplayerSlice';
import tournamentMultiplayerReducer from './slices/tournamentMultiplayerSlice';
import cashMultiplayerReducer from './slices/cashMultiplayerSlice';

export const makeStore = () => {
  return configureStore({
    reducer: {
      auth: authReducer,
      table: tableReducer,
      // Старый multiplayer (deprecated, оставлен для обратной совместимости)
      multiplayer: multiplayerReducer,
      // Новые отдельные slices для tournament и cash
      tournamentMultiplayer: tournamentMultiplayerReducer,
      cashMultiplayer: cashMultiplayerReducer,
    },
  });
};

// Infer the type of makeStore
export type AppStore = ReturnType<typeof makeStore>;
// Infer the `RootState` and `AppDispatch` types from the store itself
export type RootState = ReturnType<AppStore['getState']>;
export type AppDispatch = AppStore['dispatch'];
