import { siteConfig } from '../config/siteConfig'
export const money = amount => `${siteConfig.currency}${Number(amount || 0).toLocaleString('en-BD')}`
export const currentPrice = product => product.salePrice || product.price
