import config from '../../config'

export const isValidScraperKey = (key: string) => {
  return key === config.scraperKey
}

export default isValidScraperKey
