import React, { createContext, useContext, useReducer, ReactNode, Dispatch } from 'react';
import { mockCommunities } from '@/data/mockData';
import { Community } from '@/types/community';

interface CommunitiesState {
  communities: Community[];
  selectedCommunityId: string | null;
  // Add more state like subgroups, members, messages as needed
}

type CommunitiesAction =
  | { type: 'SELECT_COMMUNITY'; payload: string }
  | { type: 'ADD_COMMUNITY'; payload: Community }
  | { type: 'UPDATE_COMMUNITY'; payload: Community }
  | { type: 'DELETE_COMMUNITY'; payload: string };

const initialState: CommunitiesState = {
  communities: mockCommunities,
  selectedCommunityId: null,
};

const CommunitiesContext = createContext<{
  state: CommunitiesState;
  dispatch: Dispatch<CommunitiesAction>;
}>({
  state: initialState,
  dispatch: () => null,
});

const communitiesReducer = (
  state: CommunitiesState,
  action: CommunitiesAction,
): CommunitiesState => {
  switch (action.type) {
    case 'SELECT_COMMUNITY':
      return { ...state, selectedCommunityId: action.payload };
    case 'ADD_COMMUNITY':
      return { ...state, communities: [...state.communities, action.payload] };
    case 'UPDATE_COMMUNITY':
      return {
        ...state,
        communities: state.communities.map((c) =>
          c.id === action.payload.id ? action.payload : c,
        ),
      };
    case 'DELETE_COMMUNITY':
      return {
        ...state,
        communities: state.communities.filter((c) => c.id !== action.payload),
        selectedCommunityId:
          state.selectedCommunityId === action.payload ? null : state.selectedCommunityId,
      };
    default:
      return state;
  }
};

export const CommunitiesProvider = ({ children }: { children: ReactNode }) => {
  const [state, dispatch] = useReducer(communitiesReducer, initialState);
  return (
    <CommunitiesContext.Provider value={{ state, dispatch }}>
      {children}
    </CommunitiesContext.Provider>
  );
};

export const useCommunities = () => useContext(CommunitiesContext);
