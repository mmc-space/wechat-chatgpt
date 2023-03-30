import type { ScanStatus } from 'wechaty'
import { WechatyBuilder } from 'wechaty'
import type {
  ContactInterface,
  ContactSelfInterface,
  MessageInterface,
  RoomInterface,
  WechatyInterface,
} from 'wechaty/impls'
import chatgpt from './gpt'
import { groupKeywords } from './config'
import { queue } from './limit'

class Wechat {
  private history = new Map<string, string>()
  private wechaty: WechatyInterface = WechatyBuilder.build()

  constructor() {}

  private async sendMessage(
    contact: RoomInterface | ContactInterface,
    message: string,
    talker: string,
    roomTopic?: string,
  ) {
    const key = roomTopic ? `group-${roomTopic}-${talker}` : `1v1-${talker}`
    const parentMessageId = this.history.get(key)
    const time = new Date()

    // 获取gpt回复
    const request = async () => {
      try {
        const response = await chatgpt.sendMessage(message, parentMessageId)
        if (response.parentMessageId)
          this.history.set(key, response.parentMessageId)

        // 微信回复消息
        contact.say(`@${talker} ——————\n ${response?.text ?? ''}`)
      }
      catch (error) {
        console.log(error)
        contact.say(`@${talker} ——————\n ${time} 我是毛毛虫🐛 如有事请联系: mmszb@qq.com`)
      }
    }

    queue.add(request)
  }

  private onScan(qrcode: string, _status: ScanStatus) {
    console.log(`https://wechaty.js.org/qrcode/${encodeURIComponent(qrcode)}`)
  }

  private onMessage = async (message: MessageInterface) => {
    const self = message.self()
    const contact = message.talker()
    // const receiver = message.listener()
    const content = message.text().trim()
    const room = message.room()
    const talker = (await contact.alias()) || contact.name()
    const isText = message.type() === this.wechaty.Message.Type.Text

    if (self || !isText) return

    if (room) {
      if (groupKeywords.some(keyword => content.includes(keyword))) {
        const topic = await room.topic()
        console.log(`group name: ${topic} talker: ${contact.name()} content: ${content}`)
        this.sendMessage(room, content, talker, topic)
      }
    }
    else {
      console.log(`talker: ${talker} content: ${content}`)
      this.sendMessage(contact, content, talker)
    }
  }

  private onLogin(user: ContactSelfInterface) {
    console.log(`User ${user} logged in`)
  }

  public init = () => {
    this.wechaty
      .on('scan', this.onScan)
      .on('login', this.onLogin)
      .on('message', this.onMessage)

    this.wechaty.start()
  }
}

export default new Wechat()
