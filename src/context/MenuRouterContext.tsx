'use client';
import { createContext, useContext, useReducer, ReactNode } from 'react';

export type MenuType = 'win' | 'lose' | 'solution' | 'leaderboard' | 'settings';

type MenuRouterProviderProps = {
  children: ReactNode;
};

type State = {
  history: MenuType[];
};

type Action = { type: 'OPEN_MENU'; menu: MenuType } | { type: 'GO_BACK' };

export type MenuRouterProviderState = {
  activeMenu: MenuType | null;
  openMenu: (menu: MenuType) => void;
  goBack: () => void;
};

const MenuRouterContext = createContext<MenuRouterProviderState | undefined>(undefined);

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'OPEN_MENU': {
      // ignore if opening same menu twice
      if (state.history.at(-1) === action.menu) return state;

      return {
        ...state,
        history: [...state.history, action.menu]
      };
    }

    case 'GO_BACK': {
      if (state.history.length <= 1) {
        return { history: [] }; // no active menu
      }

      return {
        ...state,
        history: state.history.slice(0, -1)
      };
    }

    default:
      return state;
  }
}

export function MenuRouterProvider({ children }: MenuRouterProviderProps) {
  const [state, dispatch] = useReducer(reducer, {
    history: []
  });

  const activeMenu = state.history[state.history.length - 1] || null;

  const openMenu = (menu: MenuType) => {
    dispatch({ type: 'OPEN_MENU', menu });
  };

  const goBack = () => {
    dispatch({ type: 'GO_BACK' });
  };

  return (
    <MenuRouterContext.Provider value={{ activeMenu, openMenu, goBack }}>
      {children}
    </MenuRouterContext.Provider>
  );
}

export const useMenuRouter = () => {
  const context = useContext(MenuRouterContext);
  if (!context) {
    throw new Error('useMenuRouter must be used within an MenuRouterProvider');
  }
  return context;
};
