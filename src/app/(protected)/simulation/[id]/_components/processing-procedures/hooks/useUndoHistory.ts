import { useCallback, useRef } from 'react';

export type HistoryAction =
  | {
      type: 'toggleDisabled';
      cellIds: string[];
      previousStates: Map<string, boolean>;
      newStates: Map<string, boolean>;
    }
  | {
      type: 'setBadges';
      cellIds: string[];
      previousBadges: Map<string, any[]>;
      newBadges: Map<string, any[]>;
    }
  | {
      type: 'paste';
      targetCells: string[];
      previousStates: Map<string, { badges: any[]; disabled: boolean }>;
      newStates: Map<string, { badges: any[]; disabled: boolean }>;
    };

interface UseUndoHistoryProps {
  maxHistorySize?: number;
  onUndo?: (action: HistoryAction) => void;
  onRedo?: (action: HistoryAction) => void;
}

export function useUndoHistory({
  maxHistorySize = 50,
  onUndo,
  onRedo,
}: UseUndoHistoryProps = {}) {
  const historyRef = useRef<HistoryAction[]>([]);
  const historyIndexRef = useRef<number>(-1);

  const pushHistory = useCallback((action: HistoryAction) => {
    // 현재 인덱스 이후의 히스토리 제거 (redo 스택 클리어)
    if (historyIndexRef.current < historyRef.current.length - 1) {
      historyRef.current = historyRef.current.slice(0, historyIndexRef.current + 1);
    }

    // 새 액션 추가
    historyRef.current.push(action);
    historyIndexRef.current++;

    // 최대 크기 유지
    if (historyRef.current.length > maxHistorySize) {
      historyRef.current.shift();
      historyIndexRef.current--;
    }
  }, [maxHistorySize]);

  const undo = useCallback(() => {
    if (historyIndexRef.current >= 0) {
      const action = historyRef.current[historyIndexRef.current];
      historyIndexRef.current--;
      
      if (onUndo) {
        onUndo(action);
      }
      
      return action;
    }
    return null;
  }, [onUndo]);

  const redo = useCallback(() => {
    if (historyIndexRef.current < historyRef.current.length - 1) {
      historyIndexRef.current++;
      const action = historyRef.current[historyIndexRef.current];
      
      if (onRedo) {
        onRedo(action);
      }
      
      return action;
    }
    return null;
  }, [onRedo]);

  const canUndo = useCallback(() => {
    return historyIndexRef.current >= 0;
  }, []);

  const canRedo = useCallback(() => {
    return historyIndexRef.current < historyRef.current.length - 1;
  }, []);

  const clearHistory = useCallback(() => {
    historyRef.current = [];
    historyIndexRef.current = -1;
  }, []);

  const getHistoryLength = useCallback(() => {
    return historyRef.current.length;
  }, []);

  return {
    pushHistory,
    undo,
    redo,
    canUndo,
    canRedo,
    clearHistory,
    getHistoryLength,
  };
}