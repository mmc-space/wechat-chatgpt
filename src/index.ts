import { config } from 'dotenv'
import wechat from './wechat'

const bootstarp = async () => {
  config()
  wechat.init()
}

bootstarp()
