import OpenAI from 'openai'
import fs from 'fs'

import config from '../../../config'
const openaiApiKey = config.openaiApiKey

import RateLimiter from './RateLimiter'
const rateLimit = new RateLimiter(15, 60)

type ItemTags = string[]
type ItemTagMap = { [itemName: string]: ItemTags }

export const getItemTags = async (itemName: string): Promise<ItemTags> => {
  const openaiClient = new OpenAI({
    apiKey: openaiApiKey,
  })

  const system = `Given the name of an item, provide a list of tags that describe the item. Respond in a json format like this { success: boolean, tags: string[] }`
  // const system = `Given the item name, provide a list of tags that describe the item. \n\nItem name: ${itemName}\nTags:`
  
  const response = await openaiClient.chat.completions.create({
    model: "gpt-3.5-turbo",
    messages: [
      {
        role: "system",
        content: system
      },
      {
        role: "user",
        content: itemName
      },
    ],
    temperature: 0.4,
    max_tokens: 512,
    top_p: 1,
    frequency_penalty: 0,
    presence_penalty: 0,
  });
  try {
    const json = JSON.parse(response.choices[0].message.content);
    return json.tags
  } catch (e) {
    console.error(e)
    return []
  }
}

export const getBulkItemTags = async (itemNames: string[]): Promise<ItemTagMap> => {
  // split itemnames into lists of 20
  const itemNamesLists = []
  let currentList = []
  for (let i = 0; i < itemNames.length; i++) {
    currentList.push(itemNames[i])
    if (currentList.length === 20) {
      itemNamesLists.push(currentList)
      currentList = []
    }
  }
  if (currentList.length > 0) {
    itemNamesLists.push(currentList)
  }

  const tagPromises = []
  for (let i = 0; i < itemNamesLists.length; i++) {
    const itemNamesList = itemNamesLists[i]
    await rateLimit.consume()
    const itemTags = getTagsForItemList(itemNamesList)
    tagPromises.push(itemTags)
  }

  const tagsList = await Promise.all(tagPromises).then((tagLists) => {
    return tagLists.flat()
  })

  const tags = {}
  tagsList.forEach((tagList) => {
    Object.keys(tagList).forEach((itemName) => {
      tags[itemName] = tagList[itemName]
    })
  })

  return tags
}

export const getTagsForItemList = async (itemNames: string[]): Promise<ItemTagMap> => {
  const openaiClient = new OpenAI({
    apiKey: openaiApiKey,
  })

  const system = `Given an array of items, provide a list of tags that describe the individual items. Respond in a json format like this { success: boolean, items: { itemName: string[] } }. Be verbose with the amount of tags. Minimum 7 tags per item.`

  const response = await openaiClient.chat.completions.create({
    model: "gpt-3.5-turbo",
    messages: [
      {
        role: "system",
        content: system
      },
      {
        role: "user",
        content: `["${itemNames.join('", "')}"]`
      },
    ],
    temperature: 0.4,
    max_tokens: 4096,
    top_p: 1,
    frequency_penalty: 0,
    presence_penalty: 0,
  });
  try {
    const json = JSON.parse(response.choices[0].message.content);
    // console.log(json)
    return json.items
  } catch (e) {
    console.error(e)
    const errorFile = `error-${Date.now()}.json`
    const errorData = {
      error: e,
      system,
      input: `["${itemNames.join('", "')}"]`,
      response: response.choices[0].message.content
    }
    fs.writeFileSync(errorFile, JSON.stringify(errorData))
    return {}
  }
}

export default getItemTags
