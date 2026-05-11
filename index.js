import { Telegraf, Markup } from "telegraf";
import { BOT_TOKEN } from "./config.js";
import { welcomeMessages } from "./messages.js";

const bot = new Telegraf(BOT_TOKEN);

/* ================= CONFIG ================= */

const ADMIN_ID = 8136997138;

const MAIN_CHANNEL = "-1002315458574";
const GLOBAL_CHANNEL = "-1002510081290";

/* ✅ ALL GROUP IDS */
const GROUPS = [
  "-1002346718545",
  "-1003527248014",
  "-1003723410396"
];

/* ================= RANDOM MESSAGE ================= */

function getRandomMessage(name) {
  const msg =
    welcomeMessages[Math.floor(Math.random() * welcomeMessages.length)];

  return msg.replace("{name}", name);
}

/* ================= CREATE INVITE LINK ================= */

async function createInviteLink(chatId) {
  const link = await bot.telegram.createChatInviteLink(chatId, {
    member_limit: 1,
    expire_date: Math.floor(Date.now() / 1000) + 3600
  });

  return link.invite_link;
}

/* ================= AUTO APPROVE ================= */

bot.on("chat_join_request", async (ctx) => {
  try {
    const chatId = ctx.chat.id.toString();

    if (!GROUPS.includes(chatId)) return;

    await ctx.approveChatJoinRequest();

  } catch (e) {
    console.log(e);
  }
});

/* ================= WELCOME SYSTEM ================= */

async function sendWelcome(ctx) {

  const chatId = ctx.chat.id;
  const name = ctx.from.first_name;

  const mainLink = await createInviteLink(MAIN_CHANNEL);
  const globalLink = await createInviteLink(GLOBAL_CHANNEL);

  const buttons = Markup.inlineKeyboard([
    [
      Markup.button.url("📢 Main TG Channel", mainLink)
    ],
    [
      Markup.button.url("🌏 Global Method Channel", globalLink)
    ],
    [
      Markup.button.callback("♻️ Generate New Link", "new_link")
    ]
  ]);

  const message = await ctx.telegram.sendMessage(
    chatId,
    getRandomMessage(name),
    buttons
  );

  /* 🔄 CHANGE MESSAGE EVERY 4 SEC */

  const interval = setInterval(async () => {

    try {

      const newMainLink = await createInviteLink(MAIN_CHANNEL);
      const newGlobalLink = await createInviteLink(GLOBAL_CHANNEL);

      const newButtons = Markup.inlineKeyboard([
        [
          Markup.button.url("📢 Main TG Channel", newMainLink)
        ],
        [
          Markup.button.url("🌏 Global Method Channel", newGlobalLink)
        ],
        [
          Markup.button.callback("♻️ Generate New Link", "new_link")
        ]
      ]);

      await ctx.telegram.editMessageText(
        chatId,
        message.message_id,
        null,
        getRandomMessage(name),
        newButtons
      );

    } catch (e) {
      clearInterval(interval);
    }

  }, 4000);

  /* 🗑 DELETE AFTER 5 MIN */

  setTimeout(() => {

    clearInterval(interval);

    ctx.telegram.deleteMessage(
      chatId,
      message.message_id
    ).catch(() => {});

  }, 300000);
}

/* ================= MEMBER JOIN EVENT ================= */

bot.on("chat_member", async (ctx) => {

  try {

    const chatId = ctx.chat.id.toString();

    if (!GROUPS.includes(chatId)) return;

    const status =
      ctx.chatMember.new_chat_member.status;

    if (status === "member") {
      sendWelcome(ctx);
    }

  } catch (e) {
    console.log(e);
  }

});

/* ================= START ================= */

bot.start(async (ctx) => {

  const name = ctx.from.first_name;

  const mainLink = await createInviteLink(MAIN_CHANNEL);
  const globalLink = await createInviteLink(GLOBAL_CHANNEL);

  const buttons = Markup.inlineKeyboard([
    [
      Markup.button.url("📢 Main TG Channel", mainLink)
    ],
    [
      Markup.button.url("🌏 Global Method Channel", globalLink)
    ],
    [
      Markup.button.callback("👤 Joined", "joined")
    ]
  ]);

  const msg = await ctx.reply(
    `👋 Welcome ${name} To Auto Approve Bot System!`,
    buttons
  );

  /* 🔄 AUTO CHANGE MESSAGE */

  const interval = setInterval(async () => {

    try {

      await ctx.telegram.editMessageText(
        ctx.chat.id,
        msg.message_id,
        null,
        getRandomMessage(name),
        buttons
      );

    } catch (e) {
      clearInterval(interval);
    }

  }, 4000);

});

/* ================= GENERATE NEW LINK ================= */

bot.action("new_link", async (ctx) => {

  try {

    const newMainLink =
      await createInviteLink(MAIN_CHANNEL);

    const newGlobalLink =
      await createInviteLink(GLOBAL_CHANNEL);

    const buttons = Markup.inlineKeyboard([
      [
        Markup.button.url(
          "📢 Main TG Channel",
          newMainLink
        )
      ],
      [
        Markup.button.url(
          "🌏 Global Method Channel",
          newGlobalLink
        )
      ],
      [
        Markup.button.callback(
          "✅ Create Successful",
          "done"
        )
      ]
    ]);

    await ctx.editMessageReplyMarkup(buttons.reply_markup);

    await ctx.answerCbQuery(
  "✅ New Link Created!",
  { show_alert: true }
).catch(() => {});

  } catch (e) {
    console.log(e);
  }

});

/* ================= JOINED BUTTON ================= */

bot.action("joined", async (ctx) => {

  try {

    await ctx.answerCbQuery().catch(() => {});

    await ctx.reply(
`🎉 Welcome ${ctx.from.first_name} !

✅ You are now verified user.
💙 Enjoy our services & stay active.`
    );

  } catch (e) {
    console.log(e);
  }

});

/* ================= START BOT ================= */

bot.launch();
process.once("SIGINT", () => bot.stop("SIGINT"));
process.once("SIGTERM", () => bot.stop("SIGTERM"));

console.log("🤖 Bot Running Successfully...");
