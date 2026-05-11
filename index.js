import { Telegraf, Markup } from "telegraf";
import { BOT_TOKEN } from "./config.js";
import { welcomeMessages } from "./messages.js";

const bot = new Telegraf(BOT_TOKEN);

/* ================= GROUPS ================= */

const GROUPS = [
  "-1002346718545",
  "-1003527248014",
  "-1003723410396"
];

/* ================= CHANNELS ================= */

const MAIN_CHANNEL = "-1002315458574";
const GLOBAL_CHANNEL = "-1002510081290";

/* ================= RANDOM MESSAGE ================= */

function getRandomMessage(name) {

  const msg =
    welcomeMessages[
      Math.floor(
        Math.random() * welcomeMessages.length
      )
    ];

  return msg.replace("{name}", name);

}

/* ================= CREATE LINK ================= */

async function createInviteLink(chatId) {

  try {

    const link =
      await bot.telegram.createChatInviteLink(
        chatId,
        {
          member_limit: 1,
          expire_date:
            Math.floor(Date.now() / 1000) + 3600
        }
      );

    return link.invite_link;

  } catch (e) {

    console.log("LINK ERROR:", e);

    return "https://t.me";

  }

}

/* ================= AUTO APPROVE ================= */

bot.on("chat_join_request", async (ctx) => {

  console.log("JOIN REQUEST DETECTED");

  try {

    const chatId =
      ctx.chat.id.toString();

    console.log("CHAT ID:", chatId);

    if (!GROUPS.includes(chatId)) {

      console.log("GROUP NOT MATCHED");

      return;

    }

    /* ✅ APPROVE */

    await bot.telegram.approveChatJoinRequest(
      chatId,
      ctx.from.id
    );

    console.log("REQUEST APPROVED");

    /* ✅ USER */

    const name =
      ctx.from.first_name || "User";

    /* ✅ LINKS */

    const mainLink =
      await createInviteLink(MAIN_CHANNEL);

    const globalLink =
      await createInviteLink(GLOBAL_CHANNEL);

    /* ✅ BUTTONS */

    const buttons =
      Markup.inlineKeyboard([
        [
          Markup.button.url(
            "📢 Main TG Channel",
            mainLink
          )
        ],
        [
          Markup.button.url(
            "💠 Global Method Channel",
            globalLink
          )
        ],
        [
          Markup.button.callback(
            "♻️ Generate New Link",
            "new_link"
          )
        ]
      ]);

    /* ✅ SEND MESSAGE */

    const msg =
      await ctx.telegram.sendMessage(
        chatId,
        getRandomMessage(name),
        buttons
      );

    /* 🔄 AUTO CHANGE */

    const interval =
      setInterval(async () => {

        try {

          await ctx.telegram.editMessageText(
            chatId,
            msg.message_id,
            null,
            getRandomMessage(name),
            buttons
          );

        } catch {

          clearInterval(interval);

        }

      }, 4000);

    /* 🗑 AUTO DELETE */

    setTimeout(async () => {

      clearInterval(interval);

      await ctx.telegram.deleteMessage(
        chatId,
        msg.message_id
      ).catch(() => {});

    }, 300000);

  } catch (e) {

    console.log("APPROVE ERROR:", e);

  }

});

/* ================= START ================= */

bot.start(async (ctx) => {

  try {

    const name =
      ctx.from.first_name || "User";

    const mainLink =
      await createInviteLink(MAIN_CHANNEL);

    const globalLink =
      await createInviteLink(GLOBAL_CHANNEL);

    const buttons =
      Markup.inlineKeyboard([
        [
          Markup.button.url(
            "📢 Main TG Channel",
            mainLink
          )
        ],
        [
          Markup.button.url(
            "💠 Global Method Channel",
            globalLink
          )
        ],
        [
          Markup.button.callback(
            "👤 Joined",
            "joined"
          )
        ]
      ]);

    await ctx.reply(
      `👋 Welcome ${name} To Auto Approve Bot System!`,
      buttons
    );

  } catch (e) {

    console.log(e);

  }

});

/* ================= GENERATE LINK ================= */

bot.action("new_link", async (ctx) => {

  try {

    const mainLink =
      await createInviteLink(MAIN_CHANNEL);

    const globalLink =
      await createInviteLink(GLOBAL_CHANNEL);

    const buttons =
      Markup.inlineKeyboard([
        [
          Markup.button.url(
            "📢 Main TG Channel",
            mainLink
          )
        ],
        [
          Markup.button.url(
            "💠 Global Method Channel",
            globalLink
          )
        ],
        [
          Markup.button.callback(
            "✅ Create Successful",
            "done"
          )
        ]
      ]);

    await ctx.editMessageReplyMarkup(
      buttons.reply_markup
    );

    await ctx.answerCbQuery(
      "✅ New Link Created!"
    ).catch(() => {});

  } catch (e) {

    console.log(e);

  }

});

/* ================= JOINED ================= */

bot.action("joined", async (ctx) => {

  try {

    await ctx.answerCbQuery()
      .catch(() => {});

    await ctx.reply(
`🎉 Welcome ${ctx.from.first_name} !

✅ You are verified user.
💙 Enjoy our services.`
    );

  } catch (e) {

    console.log(e);

  }

});

/* ================= START BOT ================= */

bot.launch();

console.log("🤖 Bot Running Successfully...");

/* ================= SAFE STOP ================= */

process.once(
  "SIGINT",
  () => bot.stop("SIGINT")
);

process.once(
  "SIGTERM",
  () => bot.stop("SIGTERM")
);
