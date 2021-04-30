/*CMD
  command: /start
  help: 
  need_reply: true
  auto_retry_time: 
  folder: 
  answer: Yapımcı - @yusiqo
  keyboard: 📤 Send Message, \n 📥 Receive Message
  aliases: 
CMD*/

if (message == "📤 Send Message") { 
Bot.sendMessage("*Send The Message*")
User.setProperty("Start", "send", "string")
Bot.runCommand("Msg")
}else
if (message ==  "📥 Receive Message") { 
Bot.sendMessage("*Send The Message Code*")
User.setProperty("Start", "rec", "string")
Bot.runCommand("Msg")
}
