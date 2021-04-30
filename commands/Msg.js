/*CMD
  command: Msg
  help: 
  need_reply: true
  auto_retry_time: 
  folder: 
  answer: 
  keyboard: 
  aliases: 
CMD*/

var n = User.getProperty("Start")
if (n == "rec") {
var msg = Bot.getProperty(message)
if (msg == undefined) {
Bot.sendMessage("*Msg Not Found*")
}else{
Bot.sendMessage("*"+msg+"*")
}
}
if (n == "send"){
var num = Libs.Random.randomInt(10000000,9999999999)
Bot.setProperty(num, message, "string")
Bot.sendMessage("*Your Message Code is* "+num)
}
Bot.runCommand("/start")
