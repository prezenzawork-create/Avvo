import { create } from 'zustand';
import { persist } from 'zustand/middleware';

/**
 * UI Store
 * Manages global UI state (sidebar, modals, notifications, etc.)
 */

const useUIStore = create(
  persist(
    (set, get) => ({
      // Sidebar state
      sidebarOpen: true,
      toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
      setSidebarOpen: (open) => set({ sidebarOpen: open }),

      // Modal state
      modals: {},
      openModal: (modalId) =>
        set((state) => ({
          modals: { ...state.modals, [modalId]: true },
        })),
      closeModal: (modalId) =>
        set((state) => ({
          modals: { ...state.modals, [modalId]: false },
        })),
      isModalOpen: (modalId) => get().modals[modalId] || false,

      // Toast notifications
      toasts: [],
      addToast: (toast) => {
        const id = Date.now().toString();
        const newToast = {
          id,
          type: 'info',
          duration: 4000,
          ...toast,
        };
        
        set((state) => ({
          toasts: [...state.toasts, newToast],
        }));

        // Auto-remove toast after duration
        setTimeout(() => {
          get().removeToast(id);
        }, newToast.duration);

        return id;
      },
      removeToast: (id) =>
        set((state) => ({
          toasts: state.toasts.filter((toast) => toast.id !== id),
        })),
      clearToasts: () => set({ toasts: [] }),

      // Loading states
      loading: {},
      setLoading: (key, value) =>
        set((state) => ({
          loading: { ...state.loading, [key]: value },
        })),
      isLoading: (key) => get().loading[key] || false,

      // Theme (for future use)
      theme: 'light',
      toggleTheme: () =>
        set((state) => ({
          theme: state.theme === 'light' ? 'dark' : 'light',
        })),
      setTheme: (theme) => set({ theme }),

      // Page title
      pageTitle: 'Панель управления',
      setPageTitle: (title) => set({ pageTitle: title }),

      // Breadcrumbs
      breadcrumbs: [],
      setBreadcrumbs: (breadcrumbs) => set({ breadcrumbs }),

      // Selected items (for bulk actions)
      selectedItems: {},
      selectItem: (collectionId, itemId) =>
        set((state) => ({
          selectedItems: {
            ...state.selectedItems,
            [collectionId]: [
              ...(state.selectedItems[collectionId] || []),
              itemId,
            ],
          },
        })),
      deselectItem: (collectionId, itemId) =>
        set((state) => ({
          selectedItems: {
            ...state.selectedItems,
            [collectionId]: (state.selectedItems[collectionId] || []).filter(
              (id) => id !== itemId
            ),
          },
        })),
      toggleSelectItem: (collectionId, itemId) => {
        const collection = get().selectedItems[collectionId] || [];
        if (collection.includes(itemId)) {
          get().deselectItem(collectionId, itemId);
        } else {
          get().selectItem(collectionId, itemId);
        }
      },
      selectAllItems: (collectionId, itemIds) =>
        set((state) => ({
          selectedItems: {
            ...state.selectedItems,
            [collectionId]: itemIds,
          },
        })),
      clearSelection: (collectionId) =>
        set((state) => ({
          selectedItems: {
            ...state.selectedItems,
            [collectionId]: [],
          },
        })),
      getSelectedItems: (collectionId) =>
        get().selectedItems[collectionId] || [],
      hasSelectedItems: (collectionId) =>
        (get().selectedItems[collectionId] || []).length > 0,

      // Filters (for lists/tables)
      filters: {},
      setFilter: (filterId, value) =>
        set((state) => ({
          filters: { ...state.filters, [filterId]: value },
        })),
      clearFilter: (filterId) =>
        set((state) => {
          const { [filterId]: removed, ...rest } = state.filters;
          return { filters: rest };
        }),
      clearAllFilters: () => set({ filters: {} }),
      getFilter: (filterId) => get().filters[filterId],

      // Confirmation dialog
      confirmDialog: null,
      showConfirm: (config) =>
        set({
          confirmDialog: {
            title: 'Подтверждение',
            message: '',
            confirmText: 'Подтвердить',
            cancelText: 'Отмена',
            onConfirm: () => {},
            onCancel: () => {},
            ...config,
          },
        }),
      closeConfirm: () => set({ confirmDialog: null }),

      // Reset all UI state
      reset: () =>
        set({
          modals: {},
          toasts: [],
          loading: {},
          selectedItems: {},
          filters: {},
          confirmDialog: null,
        }),
    }),
    {
      name: 'avvo-ui-storage',
      partialize: (state) => ({
        sidebarOpen: state.sidebarOpen,
        theme: state.theme,
      }),
    }
  )
);

export default useUIStore;
