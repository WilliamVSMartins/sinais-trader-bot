const { Telegraf } = require("telegraf");
const fs = require("fs");

require("dotenv").config();

const historyFile = 'messageHistory.json';
const MAX_HISTORY_LENGTH = 1000;
const DELETE_COUNT = 500;

const messageHistory = readHistoryFromFile(historyFile);

const receiveGroup = Number(process.env.RECEIVE_GROUP)
const sendGroup = Number(process.env.SEND_GROUP)

const bot = new Telegraf(process.env.BOT_TOKEN);

bot.on("channel_post", async (ctx) => {
  const { update } = ctx;
  const message = update.channel_post;
  
  if (message) {
    await handleMessage(ctx, message);
  }
})

bot.on("edited_channel_post", async (ctx) => {
  const { update } = ctx;
  const editedMessage = update.edited_channel_post;
  
  if(editedMessage && editedMessage.text){
      await handleEdit(ctx, editedMessage)
  }
})

async function handleMessage(ctx, message) {
  if (message.reply_to_message) {
    await handleReply(ctx, message);
  } else if (message.chat.id === sendGroup) {
    await handleSentMessage(ctx, message);
  }
}

async function handleEdit(ctx, editedMessage) {
  const editedMessageId = editedMessage.message_id;

  const pair = messageHistory.find(pair => pair.enviarId === editedMessageId);

  if (pair) {
    await ctx.telegram.editMessageText(receiveGroup, pair.receberId, undefined, editedMessage.text); 
  }
}

async function handleReply(ctx, message) {
  const messageId = message.reply_to_message.message_id;

  const pair = messageHistory.find(pair => pair.enviarId === messageId);

  if (pair) {
    await handleSentMessage(ctx, message, {
      reply_to_message_id: pair.receberId
    })
  }
}

async function handleSentMessage(ctx, message, options) {
  const enviado = await ctx.telegram.copyMessage(receiveGroup, sendGroup, message.message_id, options); 
  messageHistory.push({
    enviarId: message.message_id,
    receberId: enviado.message_id
  });


  if (messageHistory.length > MAX_HISTORY_LENGTH) {
    messageHistory.splice(0, DELETE_COUNT);
  }
  updateHistoryFile();
}

function readHistoryFromFile(file) {
  if (fs.existsSync(file)) {
    return JSON.parse(fs.readFileSync(file, 'utf-8'));
  } else {
    return [];
  }
}

function updateHistoryFile() {
  const jsonData = JSON.stringify(messageHistory, null, 2);
  fs.writeFileSync(historyFile, jsonData);
}

bot.launch()
