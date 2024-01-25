const { Telegraf } = require("telegraf");
const { message } = require('telegraf/filters');
const fs = require("fs");
require("dotenv").config();

const historyFile = 'messageHistory.json';
const MAX_HISTORY_LENGTH = 1000;
const DELETE_COUNT = 500;

const messageHistory = readHistoryFromFile(historyFile);

const receiveGroup = Number(process.env.RECEIVE_GROUP)
const sendGroup = Number(process.env.SEND_GROUP)

const bot = new Telegraf(process.env.BOT_TOKEN);

bot.use(async (ctx) => {
  const { update } = ctx;
  const message = update.channel_post;
  
  if (message) {
    await handleMessage(ctx, message);
  }
})

async function handleMessage(ctx, message) {
  if (message.reply_to_message) {
    await handleReply(ctx, message);
  } else if (message.chat.id === sendGroup) {
    await handleSentMessage(ctx, message);
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
  const enviado = await handleFile(ctx, message, options)
  messageHistory.push({
    enviarId: message.message_id,
    receberId: enviado.message_id
  });


  if (messageHistory.length > MAX_HISTORY_LENGTH) {
    messageHistory.splice(0, DELETE_COUNT);
  }
  updateHistoryFile();
}

async function handleFile(ctx, message, options) {
  if(message.text){
    return await handleText(ctx, message, options)
  } else if (message.voice) {
    return await handleVoice(ctx, message, options);
  } else if (message.video) {
    return await handleVideo(ctx, message, options);
  } else if (message.photo) {
    return await handlePhoto(ctx, message, options);
  } else if (message.audio) {
    return await handleAudio(ctx, message, options);
  }
}

async function handleText(ctx, message, options) {
  if(options) {
    return await ctx.telegram.sendMessage(receiveGroup, message.text, options);  
  }
  return await ctx.telegram.sendMessage(receiveGroup, message.text);
}

async function handleVoice(ctx, message, options) {
  if(options) {
    return await ctx.telegram.sendVoice(receiveGroup, message.voice.file_id, options);  
  }
  return await ctx.telegram.sendVoice(receiveGroup, message.voice.file_id);
}

async function handleVideo(ctx, message, options) {
  if(options) {
    return await ctx.telegram.sendVideo(receiveGroup, message.video.file_id, options);  
  }
  return await ctx.telegram.sendVideo(receiveGroup, message.video.file_id);
}

async function handlePhoto(ctx, message, options) {
  if(options) {
    return await ctx.telegram.sendPhoto(receiveGroup, message.photo[message.photo.length - 1].file_id, options);  
  }
  return await ctx.telegram.sendPhoto(receiveGroup, message.photo[message.photo.length - 1].file_id);
}

async function handleAudio(ctx, message, options) {
  if(options) {
    return await ctx.telegram.sendAudio(receiveGroup, message.audio.file_id, options);  
  }
  return await ctx.telegram.sendAudio(receiveGroup, message.audio.file_id);
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
