'use client';
import { createContext, useContext, useReducer, ReactNode } from 'react';

export type ModalType = 'gameover' | 'solution' | 'leaderboard' | 'settings' | 'bug-report';

type ModalRouterProviderProps = {
  children: ReactNode;
};

type State = {
  history: ModalType[];
};

type Action = { type: 'OPEN_MENU'; menu: ModalType } | { type: 'RESET' } | { type: 'GO_BACK' };

export type ModalRouterProviderState = {
  activeModal: ModalType | null;
  openModal: (menu: ModalType) => void;
  closeModal: () => void;
  goBack: () => void;
};

const ModalRouterContext = createContext<ModalRouterProviderState | undefined>(undefined);

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

    case 'RESET': {
      return {
        history: []
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

export function ModalRouterProvider({ children }: ModalRouterProviderProps) {
  const [state, dispatch] = useReducer(reducer, {
    history: []
  });

  const activeModal = state.history[state.history.length - 1] || null;

  const openModal = (menu: ModalType) => {
    dispatch({ type: 'OPEN_MENU', menu });
  };

  const closeModal = () => {
    dispatch({ type: 'RESET' });
  };

  const goBack = () => {
    dispatch({ type: 'GO_BACK' });
  };

  return (
    <ModalRouterContext.Provider value={{ activeModal, openModal, closeModal, goBack }}>
      {children}
    </ModalRouterContext.Provider>
  );
}

export const useModalRouter = () => {
  const context = useContext(ModalRouterContext);
  if (!context) {
    throw new Error('useModalRouter must be used within an ModalRouterProvider');
  }
  return context;
};
