import {create} from 'zustand';
import {persist, createJSONStorage} from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface PostsStoreState {
  readPostIds: string[];
  hiddenPostIds: string[];
}

interface PostsStoreActions {
  markAsRead: (id: string) => void;
  markAsUnread: (id: string) => void;
  hidePost: (id: string) => void;
  unhidePost: (id: string) => void;
  isRead: (id: string) => boolean;
  isHidden: (id: string) => boolean;
  clearReadHistory: () => void;
}

type PostsStore = PostsStoreState & PostsStoreActions;

const MAX_READ_IDS = 2000; // Avoid unbounded growth in AsyncStorage

export const usePostsStore = create<PostsStore>()(
  persist(
    (set, get) => ({
      readPostIds: [],
      hiddenPostIds: [],

      markAsRead: (id: string) => {
        const {readPostIds} = get();
        if (readPostIds.includes(id)) {
          return;
        }
        // Keep only the most recent MAX_READ_IDS
        const updated = [id, ...readPostIds].slice(0, MAX_READ_IDS);
        set({readPostIds: updated});
      },

      markAsUnread: (id: string) => {
        set(state => ({
          readPostIds: state.readPostIds.filter(pid => pid !== id),
        }));
      },

      hidePost: (id: string) => {
        const {hiddenPostIds} = get();
        if (hiddenPostIds.includes(id)) {
          return;
        }
        set(state => ({hiddenPostIds: [...state.hiddenPostIds, id]}));
      },

      unhidePost: (id: string) => {
        set(state => ({
          hiddenPostIds: state.hiddenPostIds.filter(pid => pid !== id),
        }));
      },

      isRead: (id: string) => {
        return get().readPostIds.includes(id);
      },

      isHidden: (id: string) => {
        return get().hiddenPostIds.includes(id);
      },

      clearReadHistory: () => {
        set({readPostIds: []});
      },
    }),
    {
      name: 'roddit-posts',
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
