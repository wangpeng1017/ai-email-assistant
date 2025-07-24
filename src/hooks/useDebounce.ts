import { useState, useEffect } from 'react'

/**
 * 防抖Hook - 延迟更新值直到指定的延迟时间过去
 * @param value 要防抖的值
 * @param delay 延迟时间（毫秒）
 * @returns 防抖后的值
 */
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value)

  useEffect(() => {
    // 设置定时器来更新防抖值
    const handler = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    // 清理函数：如果value或delay改变，清除定时器
    return () => {
      clearTimeout(handler)
    }
  }, [value, delay])

  return debouncedValue
}

/**
 * 防抖回调Hook - 防抖执行回调函数
 * @param callback 要防抖的回调函数
 * @param delay 延迟时间（毫秒）
 * @param deps 依赖数组
 * @returns 防抖后的回调函数
 */
export function useDebouncedCallback<T extends (...args: unknown[]) => unknown>(
  callback: T,
  delay: number,
  deps: React.DependencyList = []
): T {
  const [debouncedCallback, setDebouncedCallback] = useState<T>(() => callback)

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedCallback(() => callback)
    }, delay)

    return () => {
      clearTimeout(handler)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [callback, delay, ...deps])

  return debouncedCallback
}

/**
 * 搜索防抖Hook - 专门用于搜索输入的防抖
 * @param searchTerm 搜索词
 * @param delay 延迟时间（毫秒），默认300ms
 * @returns 包含防抖搜索词和是否正在搜索的对象
 */
export function useSearchDebounce(searchTerm: string, delay: number = 300) {
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState(searchTerm)
  const [isSearching, setIsSearching] = useState(false)

  useEffect(() => {
    // 如果搜索词改变，设置为正在搜索状态
    if (searchTerm !== debouncedSearchTerm) {
      setIsSearching(true)
    }

    const handler = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm)
      setIsSearching(false)
    }, delay)

    return () => {
      clearTimeout(handler)
    }
  }, [searchTerm, delay, debouncedSearchTerm])

  return {
    debouncedSearchTerm,
    isSearching
  }
}

/**
 * 防抖状态Hook - 防抖更新状态值
 * @param initialValue 初始值
 * @param delay 延迟时间（毫秒）
 * @returns [当前值, 防抖值, 设置值函数]
 */
export function useDebouncedState<T>(
  initialValue: T,
  delay: number
): [T, T, React.Dispatch<React.SetStateAction<T>>] {
  const [value, setValue] = useState<T>(initialValue)
  const debouncedValue = useDebounce(value, delay)

  return [value, debouncedValue, setValue]
}

export default useDebounce
