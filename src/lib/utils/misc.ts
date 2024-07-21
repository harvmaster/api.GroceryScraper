export const dedupe = <T>(arr: T[], fn?: (item: T) => unknown): T[] => {
  if (fn) {
    const seen = new Set()
    return arr.filter(item => {
      const key = fn(item)
      if (seen.has(key)) {
        return false
      }

      seen.add(key)
      return true
    })
  }

  return [...new Set(arr)]
}