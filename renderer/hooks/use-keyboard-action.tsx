import {DependencyList, useEffect, useMemo} from 'react';

export const useKeyboardAction = (keyOrFilter: string | ((key: string, eventType: string) => boolean), action: () => void, deps: DependencyList = []) => {
  const isArgFilter = typeof keyOrFilter === 'function';
  const filter = useMemo(() => typeof keyOrFilter === 'function' ? keyOrFilter : (key: string) => key === keyOrFilter, [keyOrFilter]);

  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if (filter(event.key, event.type)) {
        action();
      }
    };

    document.addEventListener('keyup', handler);
    if (isArgFilter) {
      document.addEventListener('keydown', handler);
      document.addEventListener('keypress', handler);
    }

    return () => {
      document.removeEventListener('keyup', handler);

      if (isArgFilter) {
        document.removeEventListener('keypress', handler);
        document.removeEventListener('keydown', handler);
      }
    };
  }, [...deps, filter, action]);
};
