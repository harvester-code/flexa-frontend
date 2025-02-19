import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function createObjectWithNewKeyFromArray(arr: Array<object>, newKey: string = "ID") {
    if (arr == null) return {};

    const newObj = {};
  
    for (let i = 0; i < arr.length; i++) 
    {
        const itemCur = arr[i];
  
        newObj[itemCur[newKey] + ''] = itemCur;
    }
  
    return newObj;
};