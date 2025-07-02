import { defaultNavigator, isClient } from '@vueuse/core'

export function userAgent(pattern: RegExp): boolean {
  return isClient && !!defaultNavigator && pattern.test(defaultNavigator.userAgent)
}

export const IE = userAgent(/Trident.*rv[ :]?11\.|msie|iemobile|Windows Phone/i)
export const Edge = userAgent(/Edge/i)
export const FireFox = userAgent(/firefox/i)
export const Safari = userAgent(/safari/i) && !userAgent(/chrome/i) && !userAgent(/android/i)
export const IOS = userAgent(/ipad|ipod|iphone/i)
export const ChromeForAndroid = userAgent(/chrome/i) && userAgent(/android/i)
