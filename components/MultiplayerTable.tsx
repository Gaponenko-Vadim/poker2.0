"use client";

import { useState, useEffect } from "react";
import { useAppSelector, useAppDispatch } from "@/lib/redux/hooks";
import {
  clearCurrentRoom,
  selectSeat,
  updateMaxPlayers,
} from "@/lib/redux/slices/multiplayerSlice";

interface MultiplayerTableProps {
  onFinishGame: () => void;
  onDeleteRoom: () => void;
  onLeaveRoom: () => void;
  onUpdateRoom: (room: Room) => void;
  setOnGameFinished: (callback: () => void) => void;
}

import type { Room } from "@/lib/redux/types/multiplayerTypes";

/**
 * Чистый покерный стол для мультиплеера
 * Только визуал стола - без игроков, карт и прочего
 */
export default function MultiplayerTable({
  onFinishGame,
  onDeleteRoom,
  onLeaveRoom,
  onUpdateRoom,
  setOnGameFinished,
}: MultiplayerTableProps) {
  const dispatch = useAppDispatch();
  const currentRoom = useAppSelector((state) => state.multiplayer.currentRoom);
  const currentUserId = useAppSelector(
    (state) => state.multiplayer.currentUserId
  );

  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [showAddStackModal, setShowAddStackModal] = useState(false);
  const [stackAmount, setStackAmount] = useState(100);
  const [showGameFinishedModal, setShowGameFinishedModal] = useState(false);
  const [showChangeSeatsModal, setShowChangeSeatsModal] = useState(false);
  const [newMaxPlayers, setNewMaxPlayers] = useState(6);
  const [showLeaveSeatModal, setShowLeaveSeatModal] = useState(false);
  const [showLeaveLobbyModal, setShowLeaveLobbyModal] = useState(false);

  const isHost = currentRoom?.hostId === currentUserId;

  // Установить колбэк для показа попапа
  useEffect(() => {
    setOnGameFinished(() => {
      setShowGameFinishedModal(true);
    });
  }, [setOnGameFinished]);

  const handleStart = () => {
    setIsPlaying(true);
    setIsPaused(false);
  };

  const handlePause = () => {
    setIsPaused(!isPaused);
  };

  const handleReset = () => {
    // Показать попап завершения всем игрокам
    onFinishGame();
  };

  const handleCloseGameFinished = () => {
    // Закрыть попап
    setShowGameFinishedModal(false);
    // Вернуться в лобби (очистить currentRoom)
    dispatch(clearCurrentRoom());
    // Удалить комнату на сервере
    onDeleteRoom();
  };

  const handleAddStack = () => {
    // TODO: Добавить стек всем игрокам
    console.log("Добавить стек всем игрокам:", stackAmount);
    setShowAddStackModal(false);
  };

  const handleLeaveSeat = () => {
    // Проверить, занял ли текущий пользователь место
    const currentPlayer = currentRoom?.players.find(
      (p) => p.id === currentUserId
    );
    const hasSelectedSeat = currentPlayer?.seatIndex !== null;

    if (hasSelectedSeat) {
      // Показать попап подтверждения
      setShowLeaveSeatModal(true);
    }
  };

  const confirmLeaveSeat = () => {
    if (!currentRoom) return;

    // Освобождаем место игрока (ставим seatIndex в null)
    const updatedPlayers = currentRoom.players.map((p) =>
      p.id === currentUserId ? { ...p, seatIndex: null } : p
    );
    const updatedRoom = { ...currentRoom, players: updatedPlayers };

    console.log('📤 Освобождаем место, остаемся в комнате');

    // Отправить обновленную комнату на сервер
    onUpdateRoom(updatedRoom);

    // Закрыть попап
    setShowLeaveSeatModal(false);
  };

  const handleBackToLobby = () => {
    // Проверить, занял ли текущий пользователь место
    const currentPlayer = currentRoom?.players.find(
      (p) => p.id === currentUserId
    );
    const hasSelectedSeat = currentPlayer?.seatIndex !== null;

    if (hasSelectedSeat) {
      // Показать попап подтверждения
      setShowLeaveLobbyModal(true);
    } else {
      // Сразу выйти в лобби (полный выход из комнаты)
      onLeaveRoom();
      dispatch(clearCurrentRoom());
    }
  };

  const confirmBackToLobby = () => {
    // Полный выход из комнаты в лобби
    onLeaveRoom();
    dispatch(clearCurrentRoom());
    setShowLeaveLobbyModal(false);
  };

  const handleSelectSeat = (seatIndex: number) => {
    console.log('💺 Занимаем место:', seatIndex, 'пользователь:', currentUserId);

    // Занять место локально
    dispatch(selectSeat({ seatIndex }));

    // Отправить обновленную комнату на сервер
    if (currentRoom) {
      // Создаем обновленную копию комнаты
      const updatedPlayers = currentRoom.players.map((p) =>
        p.id === currentUserId ? { ...p, seatIndex } : p
      );
      const updatedRoom = { ...currentRoom, players: updatedPlayers };

      console.log('📤 Отправляем обновленную комнату:', {
        roomId: updatedRoom.id,
        players: updatedRoom.players.map(p => ({ id: p.id, name: p.name, seatIndex: p.seatIndex }))
      });

      onUpdateRoom(updatedRoom);
    }
  };

  const handleOpenChangeSeatsModal = () => {
    setNewMaxPlayers(currentRoom?.maxPlayers || 6);
    setShowChangeSeatsModal(true);
  };

  const handleChangeMaxPlayers = () => {
    if (!currentRoom) return;

    // Создать обновленную комнату с новым количеством мест
    // НЕ убираем игроков с их мест - просто меняем maxPlayers
    const updatedRoom = {
      ...currentRoom,
      maxPlayers: newMaxPlayers,
      // Игроки остаются на своих местах
      players: currentRoom.players
    };

    // Изменить количество мест локально
    dispatch(updateMaxPlayers({ maxPlayers: newMaxPlayers }));

    // Отправить обновленную комнату на сервер
    onUpdateRoom(updatedRoom);

    setShowChangeSeatsModal(false);
  };

  return (
    <div className="w-full max-w-5xl mx-auto p-8">
      {/* Панель управления */}
      <div className="mb-6 bg-gray-800 rounded-xl p-6 border border-gray-700">
        <div className="flex items-center justify-between gap-6">
          {/* Кнопки навигации */}
          <div className="flex items-center gap-3">
            <button
              onClick={handleBackToLobby}
              className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white font-semibold rounded-lg transition-all"
            >
              ← В лобби
            </button>
            {(() => {
              const currentPlayer = currentRoom?.players.find(
                (p) => p.id === currentUserId
              );
              const hasSelectedSeat = currentPlayer?.seatIndex !== null;

              return hasSelectedSeat ? (
                <button
                  onClick={handleLeaveSeat}
                  className="px-4 py-2 bg-orange-700 hover:bg-orange-600 text-white font-semibold rounded-lg transition-all"
                >
                  💺 Встать
                </button>
              ) : null;
            })()}
          </div>

          {/* Кнопки управления - только для хоста */}
          {isHost && (
            <div className="flex items-center gap-3">
              {!isPlaying ? (
                <button
                  onClick={handleStart}
                  className="px-6 py-2 bg-gradient-to-r from-green-600 to-green-500 hover:from-green-700 hover:to-green-600 text-white font-bold rounded-lg transition-all shadow-lg hover:shadow-xl"
                >
                  ▶ Старт
                </button>
              ) : (
                <>
                  <button
                    onClick={handlePause}
                    className={`px-6 py-2 ${
                      isPaused
                        ? "bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600"
                        : "bg-gradient-to-r from-yellow-600 to-yellow-500 hover:from-yellow-700 hover:to-yellow-600"
                    } text-white font-bold rounded-lg transition-all shadow-lg hover:shadow-xl`}
                  >
                    {isPaused ? "▶ Продолжить" : "⏸ Пауза"}
                  </button>
                  <button
                    onClick={handleReset}
                    className="px-6 py-2 bg-gradient-to-r from-red-600 to-red-500 hover:from-red-700 hover:to-red-600 text-white font-bold rounded-lg transition-all shadow-lg hover:shadow-xl"
                  >
                    🏁 Закончить игру
                  </button>
                </>
              )}
            </div>
          )}

          {/* Функции хоста */}
          {isHost && (
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowAddStackModal(true)}
                className="px-6 py-2 bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-700 hover:to-purple-600 text-white font-bold rounded-lg transition-all shadow-lg hover:shadow-xl"
              >
                💰 Добавить стек игрокам
              </button>
              {/* Кнопка изменения количества мест (только для cash) */}
              {currentRoom?.type === "cash" && (
                <button
                  onClick={handleOpenChangeSeatsModal}
                  className="px-6 py-2 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white font-bold rounded-lg transition-all shadow-lg hover:shadow-xl"
                >
                  🪑 Изменить места
                </button>
              )}
            </div>
          )}

          {/* Статус игры и роль */}
          <div className="flex items-center gap-4">
            {/* Роль игрока */}
            <div className="flex items-center gap-2">
              {isHost ? (
                <span className="px-3 py-1 bg-gradient-to-r from-purple-600 to-purple-500 text-white font-bold rounded-lg text-sm">
                  👑 Хост
                </span>
              ) : (
                <span className="px-3 py-1 bg-gray-700 text-gray-300 font-semibold rounded-lg text-sm">
                  👤 Участник
                </span>
              )}
            </div>

            {/* Статус игры */}
            {isPlaying && (
              <div className="flex items-center gap-2">
                <div
                  className={`w-3 h-3 rounded-full ${
                    isPaused ? "bg-yellow-500" : "bg-green-500 animate-pulse"
                  }`}
                ></div>
                <span className="text-white font-semibold">
                  {isPaused ? "На паузе" : "Идёт игра"}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Модальное окно изменения количества мест */}
      {showChangeSeatsModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-xl p-8 border border-gray-700 max-w-md w-full mx-4">
            <h3 className="text-white text-2xl font-bold mb-6">
              Изменить количество мест
            </h3>

            <div className="mb-6">
              <label className="block text-white font-semibold mb-3">
                Выберите количество мест за столом:
              </label>
              {(() => {
                // Подсчитать количество занятых мест
                const occupiedSeats = currentRoom?.players.filter((p) => p.seatIndex !== null).length || 0;

                return (
                  <>
                    <div className="grid grid-cols-4 gap-3">
                      {[2, 3, 4, 5, 6, 7, 8, 9].map((seats) => {
                        const isDisabled = seats < occupiedSeats;

                        return (
                          <button
                            key={seats}
                            onClick={() => !isDisabled && setNewMaxPlayers(seats)}
                            disabled={isDisabled}
                            className={`p-3 rounded-lg border-2 transition-all ${
                              isDisabled
                                ? "bg-gray-700 border-gray-600 opacity-50 cursor-not-allowed"
                                : newMaxPlayers === seats
                                ? "bg-blue-600 border-blue-500 shadow-lg shadow-blue-500/50"
                                : "bg-gray-900 border-gray-600 hover:border-gray-500"
                            }`}
                          >
                            <div className="text-center">
                              <div className={`font-bold text-xl mb-1 ${isDisabled ? "text-gray-500" : "text-white"}`}>
                                {seats}
                              </div>
                              <div className="text-gray-400 text-xs">
                                {seats === 2 ? "HU" : `${seats}-max`}
                              </div>
                            </div>
                          </button>
                        );
                      })}
                    </div>

                    {/* Информация о занятых местах */}
                    {occupiedSeats > 0 && (
                      <div className="mt-4 p-3 bg-blue-900/30 border border-blue-600/50 rounded-lg">
                        <p className="text-blue-200 text-sm">
                          ℹ️ Занято мест: {occupiedSeats}. Нельзя выбрать меньше занятых мест.
                        </p>
                      </div>
                    )}
                  </>
                );
              })()}
            </div>

            {newMaxPlayers < (currentRoom?.maxPlayers || 6) && (
              <div className="bg-blue-900/30 border border-blue-600/50 rounded-lg p-4 mb-6">
                <p className="text-blue-200 text-sm">
                  ℹ️ Игроки на занятых местах останутся на своих позициях. Будут скрыты только свободные места.
                </p>
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={handleChangeMaxPlayers}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white font-bold rounded-lg transition-all shadow-lg hover:shadow-xl"
              >
                Применить
              </button>
              <button
                onClick={() => setShowChangeSeatsModal(false)}
                className="flex-1 px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white font-bold rounded-lg transition-all"
              >
                Отмена
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Модальное окно добавления стека */}
      {showAddStackModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-xl p-8 border border-gray-700 max-w-md w-full mx-4">
            <h3 className="text-white text-2xl font-bold mb-6">
              Добавить стек
            </h3>

            <div className="mb-6">
              <label className="block text-white font-semibold mb-3">
                Размер стека для добавления:
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="number"
                  value={stackAmount}
                  onChange={(e) => setStackAmount(Number(e.target.value))}
                  className="flex-1 px-4 py-3 bg-gray-900 border border-gray-600 rounded-lg text-white text-lg focus:outline-none focus:border-purple-500"
                  min={10}
                  max={10000}
                  step={10}
                />
                <span className="text-gray-400 text-lg">BB</span>
              </div>
            </div>

            <div className="bg-gray-900 rounded-lg p-4 mb-6">
              <p className="text-gray-300 text-sm">
                Этот стек будет добавлен всем игрокам за столом
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleAddStack}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-700 hover:to-purple-600 text-white font-bold rounded-lg transition-all shadow-lg hover:shadow-xl"
              >
                Добавить
              </button>
              <button
                onClick={() => setShowAddStackModal(false)}
                className="flex-1 px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white font-bold rounded-lg transition-all"
              >
                Отмена
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Модальное окно подтверждения освобождения места */}
      {showLeaveSeatModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-xl p-8 border border-gray-700 max-w-md w-full mx-4">
            <h3 className="text-white text-2xl font-bold mb-6">
              💺 Встать со стола?
            </h3>

            <div className="bg-yellow-900/30 border border-yellow-600/50 rounded-lg p-4 mb-6">
              <p className="text-yellow-200 text-center">
                Вы уверены, что хотите встать со стола? Вы останетесь в комнате и сможете выбрать другое место.
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={confirmLeaveSeat}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-700 hover:to-orange-600 text-white font-bold rounded-lg transition-all shadow-lg hover:shadow-xl"
              >
                Да, встать
              </button>
              <button
                onClick={() => setShowLeaveSeatModal(false)}
                className="flex-1 px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white font-bold rounded-lg transition-all"
              >
                Отмена
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Модальное окно подтверждения выхода в лобби */}
      {showLeaveLobbyModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-xl p-8 border border-gray-700 max-w-md w-full mx-4">
            <h3 className="text-white text-2xl font-bold mb-6">
              🚪 Выйти в лобби?
            </h3>

            <div className="bg-red-900/30 border border-red-600/50 rounded-lg p-4 mb-6">
              <p className="text-red-200 text-center">
                Вы уверены, что хотите покинуть комнату и вернуться в лобби? Ваше место будет освобождено.
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={confirmBackToLobby}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-red-600 to-red-500 hover:from-red-700 hover:to-red-600 text-white font-bold rounded-lg transition-all shadow-lg hover:shadow-xl"
              >
                Да, выйти
              </button>
              <button
                onClick={() => setShowLeaveLobbyModal(false)}
                className="flex-1 px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white font-bold rounded-lg transition-all"
              >
                Отмена
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Покерный стол */}
      <div className="relative w-full h-[500px]">
        {/* Деревянный фон */}
        <div className="absolute inset-0 bg-gradient-to-br from-amber-900 via-amber-950 to-stone-950 rounded-3xl"></div>

        {/* Тень под столом */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-[92%] h-[85%] rounded-[120px] bg-black/40 blur-2xl"></div>
        </div>

        {/* Покерный стол */}
        <div className="absolute inset-0 flex items-center justify-center p-6">
          {/* Чёрный бортик */}
          <div
            className="relative w-full h-full rounded-[120px] bg-gradient-to-br from-gray-800 via-gray-900 to-gray-800 shadow-2xl"
            style={{
              boxShadow:
                "0 25px 50px -12px rgba(0, 0, 0, 0.7), inset 0 2px 4px 0 rgba(255, 255, 255, 0.1)",
            }}
          >
            <div className="absolute inset-0 rounded-[120px] shadow-inner opacity-60"></div>

            {/* Зелёный фетр */}
            <div className="absolute inset-0 p-6 flex items-center justify-center">
              <div
                className="relative w-full h-full rounded-[100px] bg-gradient-to-br from-green-700 via-green-600 to-green-700 shadow-inner"
                style={{
                  boxShadow: "inset 0 4px 20px rgba(0, 0, 0, 0.4)",
                }}
              >
                {/* Текстура фетра */}
                <div
                  className="absolute inset-0 rounded-[100px] opacity-10"
                  style={{
                    backgroundImage:
                      "radial-gradient(circle at 20% 50%, transparent 0%, rgba(0,0,0,0.1) 100%)",
                  }}
                ></div>

                {/* Места за столом */}
                {currentRoom && (
                  <>
                    {(() => {
                      // Проверить, занял ли текущий пользователь место
                      const currentPlayer = currentRoom.players.find(
                        (p) => p.id === currentUserId
                      );
                      const hasSelectedSeat = currentPlayer?.seatIndex !== null;

                      // Найти максимальный занятый индекс
                      const occupiedIndices = currentRoom.players
                        .filter((p) => p.seatIndex !== null)
                        .map((p) => p.seatIndex as number);

                      const maxOccupiedIndex = occupiedIndices.length > 0
                        ? Math.max(...occupiedIndices)
                        : -1;

                      // Показать либо maxPlayers мест, либо до максимального занятого места
                      const seatsToShow = Math.max(currentRoom.maxPlayers, maxOccupiedIndex + 1);

                      console.log('🪑 Отображение мест:', {
                        maxPlayers: currentRoom.maxPlayers,
                        occupiedIndices,
                        maxOccupiedIndex,
                        seatsToShow,
                        totalPlayers: currentRoom.players.length,
                        hasSelectedSeat
                      });

                      return Array.from({ length: seatsToShow }).map((_, index) => {
                        // Найти игрока на этом месте
                        const player = currentRoom.players.find(
                          (p) => p.seatIndex === index
                        );

                        // Если текущий игрок уже занял место, не показываем пустые места
                        if (!player && hasSelectedSeat) {
                          return null;
                        }

                        // Расчет позиции места (по кругу)
                        const angle =
                          (index / seatsToShow) * 2 * Math.PI - Math.PI / 2;
                        const radiusX = 50; // Процент от ширины
                        const radiusY = 50; // Процент от высоты
                        const x = 50 + radiusX * Math.cos(angle);
                        const y = 50 + radiusY * Math.sin(angle);

                        // Проверить, можно ли занять это место
                        const canOccupy = !player && index < currentRoom.maxPlayers && !hasSelectedSeat;

                        return (
                          <div
                            key={index}
                            className="absolute transform -translate-x-1/2 -translate-y-1/2"
                            style={{
                              left: `${x}%`,
                              top: `${y}%`,
                            }}
                          >
                            {/* Карточка места */}
                            <div
                              className={`w-24 h-28 rounded-lg border-2 flex flex-col items-center justify-center transition-all ${
                                player
                                  ? "bg-blue-600 border-blue-400 shadow-lg shadow-blue-500/50"
                                  : canOccupy
                                  ? "bg-gray-800 border-gray-600 hover:border-gray-500 cursor-pointer hover:bg-gray-700"
                                  : "bg-gray-900/50 border-gray-700 opacity-40"
                              }`}
                              onClick={() => canOccupy && handleSelectSeat(index)}
                            >
                              {player ? (
                                // Занятое место
                                <div className="text-center px-2">
                                  <div className="text-white font-bold text-sm mb-1 truncate w-full">
                                    {player.name}
                                  </div>
                                  <div className="text-xs text-blue-200">
                                    {player.isHost && "👑 "}
                                    Место {index + 1}
                                  </div>
                                  {player.isReady && (
                                    <div className="text-xs text-green-300 mt-1">
                                      ✓ Готов
                                    </div>
                                  )}
                                </div>
                              ) : (
                                // Пустое место
                                <div className="text-center">
                                  <div className={`text-3xl mb-2 ${canOccupy ? "text-gray-400" : "text-gray-600"}`}>
                                    💺
                                  </div>
                                  <div className={`text-xs ${canOccupy ? "text-gray-500" : "text-gray-700"}`}>
                                    {canOccupy ? `Место ${index + 1}` : "Недоступно"}
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      });
                    })()}
                  </>
                )}

                {/* Центральный текст */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="text-center">
                    <p className="text-white/20 text-4xl font-bold tracking-widest mb-2">
                      POKER
                    </p>
                    {currentRoom && (
                      <p className="text-emerald-400 opacity-30 text-sm font-semibold tracking-wider">
                        {(() => {
                          const maxOccupiedIndex = Math.max(
                            -1,
                            ...currentRoom.players
                              .filter((p) => p.seatIndex !== null)
                              .map((p) => p.seatIndex as number)
                          );
                          const seatsToShow = Math.max(currentRoom.maxPlayers, maxOccupiedIndex + 1);
                          return seatsToShow === 2 ? 'HU' : `${seatsToShow}-MAX`;
                        })()}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Попап завершения игры */}
      {showGameFinishedModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-xl p-8 border border-gray-700 max-w-md w-full mx-4">
            <h3 className="text-white text-2xl font-bold mb-6 text-center">
              🏁 Игра завершена
            </h3>

            <div className="bg-gray-900 rounded-lg p-6 mb-6">
              <p className="text-gray-300 text-center">
                {/* Пока пустой контент */}
                Здесь будет статистика игры
              </p>
            </div>

            <button
              onClick={handleCloseGameFinished}
              className="w-full px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white font-bold rounded-lg transition-all shadow-lg hover:shadow-xl"
            >
              Закрыть
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
