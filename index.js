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
  const messageText = message.text;

  const pair = messageHistory.find(pair => pair.enviarId === messageId);

  if (pair) {
    await ctx.telegram.sendMessage(receiveGroup , messageText, {
      reply_to_message_id: pair.receberId
    });
  }
}

async function handleSentMessage(ctx, message) {
  const enviado = await handleFile(ctx, message)
  console.log(enviado)
  messageHistory.push({
    enviarId: message.message_id,
    receberId: enviado.message_id
  });


  if (messageHistory.length > MAX_HISTORY_LENGTH) {
    messageHistory.splice(0, DELETE_COUNT);
  }
  updateHistoryFile();
}

async function handleFile(ctx, message) {
  if(message.text){
    return await handleText(ctx, message)
  } else if (message.voice) {
    return await handleVoice(ctx, message);
  } else if (message.video) {
    return await handleVideo(ctx, message);
  } else if (message.photo) {
    return await handlePhoto(ctx, message);
  } else if (message.audio) {
    return await handleAudio(ctx, message);
  }
}

async function handleText(ctx, message) {
  return await ctx.telegram.sendMessage(receiveGroup, message.text);
}

async function handleVoice(ctx, message) {
  return await ctx.telegram.sendVoice(receiveGroup, message.voice.file_id);
}

async function handleVideo(ctx, message) {
  return await ctx.telegram.sendVideo(receiveGroup, message.video.file_id);
}

async function handlePhoto(ctx, message) {
  return await ctx.telegram.sendPhoto(receiveGroup, message.photo[message.photo.length - 1].file_id);
}

async function handleAudio(ctx, message) {
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
