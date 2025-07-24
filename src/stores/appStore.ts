import { create } from 'zustand'
import { devtools, persist } from 'zustand/middleware'

// 类型定义
export interface Lead {
  id: string
  customer_name: string
  customer_email: string
  customer_website: string
  source: string
  status: string
  created_at: string
  updated_at: string
  notes?: string
  last_contact?: string
  next_follow_up?: string
}

export interface ProductMaterial {
  id: string
  user_id: string
  created_at: string
  file_name: string
  storage_path: string
  file_type: string
  description?: string
  keywords?: string[]
  file_size?: number
}

export interface User {
  id: string
  email: string
  name?: string
}

export interface LoadingState {
  leads: boolean
  materials: boolean
  stats: boolean
  global: boolean
}

export interface ErrorState {
  leads: string | null
  materials: string | null
  stats: string | null
  global: string | null
}

export interface PaginationState {
  leads: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
  materials: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

export interface FiltersState {
  leads: {
    status: string
    source: string
    search: string
  }
  materials: {
    type: string
    search: string
  }
}

export interface StatsState {
  total: number
  pending: number
  processing: number
  completed: number
  failed: number
}

// 主要应用状态接口
interface AppState {
  // 数据状态
  leads: Lead[]
  materials: ProductMaterial[]
  user: User | null
  stats: StatsState
  
  // UI状态
  loading: LoadingState
  errors: ErrorState
  pagination: PaginationState
  filters: FiltersState
  
  // 导航状态
  activeMenu: string
  activeSubMenu: string
  
  // Actions - 数据操作
  setLeads: (leads: Lead[]) => void
  addLead: (lead: Lead) => void
  updateLead: (id: string, updates: Partial<Lead>) => void
  deleteLead: (id: string) => void
  
  setMaterials: (materials: ProductMaterial[]) => void
  addMaterial: (material: ProductMaterial) => void
  deleteMaterial: (id: string) => void
  
  setUser: (user: User | null) => void
  setStats: (stats: StatsState) => void
  
  // Actions - UI状态
  setLoading: (key: keyof LoadingState, value: boolean) => void
  setError: (key: keyof ErrorState, value: string | null) => void
  clearErrors: () => void
  
  // Actions - 分页
  setPagination: (key: keyof PaginationState, pagination: Partial<PaginationState[keyof PaginationState]>) => void
  
  // Actions - 过滤器
  setFilter: (category: keyof FiltersState, key: string, value: string) => void
  clearFilters: (category?: keyof FiltersState) => void
  
  // Actions - 导航
  setActiveMenu: (menu: string) => void
  setActiveSubMenu: (subMenu: string) => void
  
  // Actions - 重置
  reset: () => void
}

// 初始状态
const initialState = {
  leads: [],
  materials: [],
  user: null,
  stats: {
    total: 0,
    pending: 0,
    processing: 0,
    completed: 0,
    failed: 0
  },
  loading: {
    leads: false,
    materials: false,
    stats: false,
    global: false
  },
  errors: {
    leads: null,
    materials: null,
    stats: null,
    global: null
  },
  pagination: {
    leads: {
      page: 1,
      limit: 20,
      total: 0,
      totalPages: 0
    },
    materials: {
      page: 1,
      limit: 20,
      total: 0,
      totalPages: 0
    }
  },
  filters: {
    leads: {
      status: 'all',
      source: 'all',
      search: ''
    },
    materials: {
      type: 'all',
      search: ''
    }
  },
  activeMenu: 'leads',
  activeSubMenu: 'management'
}

// 创建store
export const useAppStore = create<AppState>()(
  devtools(
    persist(
      (set) => ({
        ...initialState,
        
        // 数据操作
        setLeads: (leads) => set({ leads }),
        
        addLead: (lead) => set((state) => ({
          leads: [lead, ...state.leads]
        })),
        
        updateLead: (id, updates) => set((state) => ({
          leads: state.leads.map(lead => 
            lead.id === id ? { ...lead, ...updates } : lead
          )
        })),
        
        deleteLead: (id) => set((state) => ({
          leads: state.leads.filter(lead => lead.id !== id)
        })),
        
        setMaterials: (materials) => set({ materials }),
        
        addMaterial: (material) => set((state) => ({
          materials: [material, ...state.materials]
        })),
        
        deleteMaterial: (id) => set((state) => ({
          materials: state.materials.filter(material => material.id !== id)
        })),
        
        setUser: (user) => set({ user }),
        setStats: (stats) => set({ stats }),
        
        // UI状态操作
        setLoading: (key, value) => set((state) => ({
          loading: { ...state.loading, [key]: value }
        })),
        
        setError: (key, value) => set((state) => ({
          errors: { ...state.errors, [key]: value }
        })),
        
        clearErrors: () => set({
          errors: {
            leads: null,
            materials: null,
            stats: null,
            global: null
          }
        }),
        
        // 分页操作
        setPagination: (key, pagination) => set((state) => ({
          pagination: {
            ...state.pagination,
            [key]: { ...state.pagination[key], ...pagination }
          }
        })),
        
        // 过滤器操作
        setFilter: (category, key, value) => set((state) => ({
          filters: {
            ...state.filters,
            [category]: { ...state.filters[category], [key]: value }
          }
        })),
        
        clearFilters: (category) => set((state) => {
          if (category) {
            return {
              filters: {
                ...state.filters,
                [category]: initialState.filters[category]
              }
            }
          }
          return { filters: initialState.filters }
        }),
        
        // 导航操作
        setActiveMenu: (menu) => set({ activeMenu: menu }),
        setActiveSubMenu: (subMenu) => set({ activeSubMenu: subMenu }),
        
        // 重置
        reset: () => set(initialState)
      }),
      {
        name: 'ai-email-assistant-store',
        partialize: (state) => ({
          // 只持久化用户偏好，不持久化数据
          activeMenu: state.activeMenu,
          activeSubMenu: state.activeSubMenu,
          filters: state.filters,
          pagination: state.pagination
        })
      }
    ),
    {
      name: 'ai-email-assistant'
    }
  )
)

// 选择器 - 用于优化性能
export const useLeads = () => useAppStore((state) => state.leads)
export const useMaterials = () => useAppStore((state) => state.materials)
export const useUser = () => useAppStore((state) => state.user)
export const useStats = () => useAppStore((state) => state.stats)
export const useLoading = () => useAppStore((state) => state.loading)
export const useErrors = () => useAppStore((state) => state.errors)
export const usePagination = () => useAppStore((state) => state.pagination)
export const useFilters = () => useAppStore((state) => state.filters)
export const useNavigation = () => useAppStore((state) => ({
  activeMenu: state.activeMenu,
  activeSubMenu: state.activeSubMenu
}))

// 计算选择器
export const useFilteredLeads = () => useAppStore((state) => {
  const { leads, filters } = state
  const { status, source, search } = filters.leads
  
  return leads.filter(lead => {
    const matchesStatus = status === 'all' || lead.status === status
    const matchesSource = source === 'all' || lead.source === source
    const matchesSearch = !search || 
      lead.customer_name.toLowerCase().includes(search.toLowerCase()) ||
      lead.customer_email.toLowerCase().includes(search.toLowerCase())
    
    return matchesStatus && matchesSource && matchesSearch
  })
})

export const useFilteredMaterials = () => useAppStore((state) => {
  const { materials, filters } = state
  const { type, search } = filters.materials
  
  return materials.filter(material => {
    const matchesType = type === 'all' || material.file_type.includes(type)
    const matchesSearch = !search || 
      material.file_name.toLowerCase().includes(search.toLowerCase()) ||
      (material.description && material.description.toLowerCase().includes(search.toLowerCase()))
    
    return matchesType && matchesSearch
  })
})
