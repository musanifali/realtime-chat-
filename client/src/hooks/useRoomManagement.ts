// client/src/hooks/useRoomManagement.ts

import { useState, useCallback } from 'react';

export const useRoomManagement = () => {
  const [allRooms, setAllRooms] = useState<string[]>([]);
  const [myRooms, setMyRooms] = useState<Set<string>>(new Set());
  const [roomUsers, setRoomUsers] = useState<Map<string, string[]>>(new Map());

  const updateRoomList = useCallback((rooms: string[]) => {
    setAllRooms(rooms);
  }, []);

  const addToMyRooms = useCallback((room: string) => {
    setMyRooms(prev => new Set(prev).add(room));
  }, []);

  const removeFromMyRooms = useCallback((room: string) => {
    setMyRooms(prev => {
      const newSet = new Set(prev);
      newSet.delete(room);
      return newSet;
    });
  }, []);

  const updateRoomUsers = useCallback((room: string, users: string[]) => {
    setRoomUsers(prev => new Map(prev).set(room, users));
  }, []);

  const getRoomUsers = useCallback((room: string): string[] => {
    return roomUsers.get(room) || [];
  }, [roomUsers]);

  const clearRooms = useCallback(() => {
    setMyRooms(new Set());
    setRoomUsers(new Map());
  }, []);

  return {
    allRooms,
    myRooms,
    roomUsers,
    updateRoomList,
    addToMyRooms,
    removeFromMyRooms,
    updateRoomUsers,
    getRoomUsers,
    clearRooms,
  };
};
