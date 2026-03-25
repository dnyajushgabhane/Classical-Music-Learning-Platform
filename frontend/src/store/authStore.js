import { create } from 'zustand';

const userInfoFromStorage = localStorage.getItem('userInfo')
  ? JSON.parse(localStorage.getItem('userInfo'))
  : null;

const useAuthStore = create((set) => ({
  userInfo: userInfoFromStorage,
  login: (data) => {
    localStorage.setItem('userInfo', JSON.stringify(data));
    set({ userInfo: data });
  },
  logout: () => {
    localStorage.removeItem('userInfo');
    set({ userInfo: null });
  },
}));

export default useAuthStore;
