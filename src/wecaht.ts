import type { ScanStatus } from 'wechaty'
import { WechatyBuilder } from 'wechaty'
import type {
  ContactSelfInterface,
  MessageInterface,
  WechatyInterface,
} from 'wechaty/impls'
import chatgpt from './gpt'

class Wechat {
  private history = new Map<string, string>()
  private wechaty: WechatyInterface = WechatyBuilder.build()

  constructor() {}

  private onScan(qrcode: string, status: ScanStatus) {
    console.log(
      `Scan QR Code to login: ${status}\nhttps://wechaty.js.org/qrcode/${encodeURIComponent(
        qrcode,
      )}`,
    )
  }

  private onMessage = async (message: MessageInterface) => {
    const self = message.self()
    const contact = message.talker()
    // const receiver = message.listener()
    const content = message.text().trim()
    const room = message.room()
    const alias = (await contact.alias()) || contact.name()
    const isText = message.type() === this.wechaty.Message.Type.Text

    if (self || !isText)
      return

    if (room) {
      const topic = await room.topic()
      console.log(
        `group name: ${topic} talker: ${contact.name()} content: ${content}`,
      )
    }
    else {
      console.log(`talker: ${alias} content: ${content}`)
      const time = new Date()
      const parentMessageId = this.history.get(contact.id)

      // 获取gpt回复
      try {
        const response = await chatgpt.sendMessage(content, parentMessageId)
        if (response.parentMessageId)
          this.history.set(contact.id, response.parentMessageId)

        // 微信回复消息
        contact.say(response?.text ?? '')
      }
      catch (error) {
        console.log(error)
        contact.say(`${time} 我是毛毛虫🐛 如有事请联系: mmszb@qq.com`)
      }
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
