import { Telegraf, Markup } from "telegraf";
import fs from "fs";
import {
  BOT_TOKEN,
  GROUPS,
  CHANNEL_ID,
  METHOD_CHANNEL,
  LINK_EXPIRE,
  MEMBER_LIMIT
} from "./config.js";

import { welcomeMessages } from "./messages.js";

const bot = new Telegraf(BOT_TOKEN);

/* ================= RANDOM MESSAGE ================= */
function getRandomMessage(name) {
  const msg = welcomeMessages[Math.floor(Math.random() * welcomeMessages.length)];
  return msg.replace("{name}", name);
}

/* ================= JOIN REQUEST AUTO ACCEPT ================= */
GROUPS.forEach(groupId => {
  bot.on("chat_join_request", async (ctx) => {
    try {
      await ctx.approveChatJoinRequest(groupId, ctx.from.id);
    } catch (e) {}
  });
});

/* ================= INVITE LINK CREATE ================= */
async function createInviteLink(chatId) {
  const link = await bot.telegram.createChatInviteLink(chatId, {
    member_limit: MEMBER_LIMIT,
    expire_date: Math.floor(Date.now() / 1000) + LINK_EXPIRE
  });
  return link.invite_link;
}

/* ================= WELCOME MESSAGE SYSTEM ================= */
async function sendWelcome(ctx, chatId) {
  const name = ctx.from.first_name;

  let msgIndex = 0;

  const buttons = Markup.inlineKeyboard([
    [Markup.button.url("📢 Main TG Channel", "https://t.me/your_main_channel")],
    [Markup.button.url("🌏 Global Method Channel", "https://t.me/your_method_channel")],
    [Markup.button.callback("♻️ Generate New Link", "new_link")]
  ]);

  const message = await ctx.telegram.sendMessage(
    chatId,
    getRandomMessage(name),
    buttons
  );

  const interval = setInterval(async () => {
    msgIndex = (msgIndex + 1) % welcomeMessages.length;
    try {
      await ctx.telegram.editMessageText(
        chatId,
        message.message_id,
        null,
        getRandomMessage(name),
        buttons
      );
    } catch (e) {
      clearInterval(interval);
    }
  }, 4000);

  // 5 min পরে delete
  setTimeout(() => {
    clearInterval(interval);
    ctx.telegram.deleteMessage(chatId, message.message_id).catch(() => {});
  }, 300000);
}

/* ================= GROUP JOIN EVENT ================= */
GROUPS.forEach(groupId => {
  bot.on("new_chat_members", async (ctx) => {
    if (ctx.chat.id.toString() === groupId) {
      sendWelcome(ctx, groupId);
    }
  });
});

/* ================= START COMMAND ================= */
bot.start(async (ctx) => {
  const buttons = Markup.inlineKeyboard([
    [Markup.button.url("📢 Main TG Channel", "https://t.me/your_main_channel")],
    [Markup.button.url("🌏 Global Method Channel", "https://t.me/your_method_channel")],
    [Markup.button.callback("👤 Joined", "joined")]
  ]);

  ctx.reply("👋 Welcome to Bot System!", buttons);
});

/* ================= BUTTON ACTION ================= */
bot.action("new_link", async (ctx) => {
  const link = await createInviteLink(METHOD_CHANNEL);

  await ctx.answerCbQuery("✅ Create Successful");

  ctx.editMessageText(
    `🔗 New Invite Link:\n${link}`
  );
});

bot.action("joined", async (ctx) => {
  ctx.reply("🎉 Welcome! You are verified user.");
});

/* ================= GLOBAL WELCOME (CHANNEL IGNORE) ================= */
// channel join ignore

bot.launch();

console.log("Bot is running...");
