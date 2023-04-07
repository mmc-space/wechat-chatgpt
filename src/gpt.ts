import { ChatGPTAPI } from 'chatgpt'
// import https from 'https-proxy-agent'
// import http from 'http-proxy-agent'
// import nodeFetch from 'node-fetch'
import config from './config'

class ChatGPT {
  private chatgpt: ChatGPTAPI = new ChatGPTAPI({
    apiKey: process.env.API_KEY || config.apiKey,
    // fetch: (url, options) => nodeFetch(url, { ...options, agent: https(config.proxyUrl) }),
  })

  constructor() {}

  async sendMessage(prompt: string, parentMessageId?: string) {
    const response = await this.chatgpt?.sendMessage(prompt, {
      parentMessageId,
    })

    return response
  }
}

export default new ChatGPT()
