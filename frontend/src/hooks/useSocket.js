import { useEffect } from 'react';
import { socketService } from '@/services/socketService';
import useTodoStore from './useTodos';

export const useSocket = () => {
  const { socketCreate, socketUpdate, socketDelete } = useTodoStore();

  useEffect(() => {
    const offCreate = socketService.on('todo:created', ({ todo }) => socketCreate(todo));
    const offUpdate = socketService.on('todo:updated', ({ todo }) => socketUpdate(todo));
    const offDelete = socketService.on('todo:deleted', ({ todoId }) => socketDelete(todoId));

    return () => {
      offCreate();
      offUpdate();
      offDelete();
    };
  }, [socketCreate, socketUpdate, socketDelete]);
};
