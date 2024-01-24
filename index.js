const { Telegraf } = require("telegraf")
const { message } = require('telegraf/filters')
const fs = require("fs")

const fileContent = fs.readFileSync('messageHistory.json', 'utf-8');
const messageHistory = JSON.parse(fileContent) 
console.log(messageHistory)

require("dotenv").config()
const bot = new Telegraf(process.env.BOT_TOKEN)


bot.on(message("text"), async (ctx) => {
  //-1002044334448 enviar
  //-1001917818475 receber
  // envio,ediçao e marcaçao
  // console.log(ctx)
  // console.log(ctx.message.reply_to_message)
  console.log(ctx.message)

  if(ctx.message.reply_to_message){
    const messageId = ctx.message.reply_to_message.message_id
    const messageText = ctx.message.text
    const pair = messageHistory.find(pair => pair.enviarId === messageId)
    console.log(pair)
    await ctx.telegram.sendMessage(-1001917818475, messageText, {
      reply_to_message_id: pair.receberId
    })
    return

  }

  if (ctx.message.chat.id == -1002044334448) {
    const enviado = await ctx.telegram.sendMessage(-1001917818475, ctx.message.text)
    messageHistory.push({
      enviarId: ctx.message.message_id,
      receberId: enviado.message_id
  })
  // Convertendo o array para JSON
  const jsonData = JSON.stringify(messageHistory, null, 2); // O segundo argumento (null) e o terceiro argumento (2) são opcionais e são usados para formatar o JSON com espaçamento para melhor legibilidade.

  // Escrevendo o JSON no arquivo
  fs.writeFileSync('messageHistory.json', jsonData);



    console.log(messageHistory)
    console.log("enviado com sucesso")
  }
  

  

})
bot.launch()