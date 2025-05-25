/*
 * @Description: create by southernMD
 */
import { toRaw } from 'vue' 
export function deepToRaw(obj: any):any {
    if (!obj || typeof obj !== 'object') return obj
    if (Array.isArray(obj)) {
      return obj.map(deepToRaw)
    }
    const raw = toRaw(obj)
    for (const key in raw) {
      raw[key] = deepToRaw(raw[key])
    }
    return raw
}