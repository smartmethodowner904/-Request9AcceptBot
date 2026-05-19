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

/* ================= PRIVATE CHANNEL ================= */

const PRIVATE_CHANNEL =
  "-1002315458574";

/* ================= CHANNELS ================= */

const MAIN_CHANNEL =
  "-1002315458574";

const GLOBAL_CHANNEL =
  "-1002510081290";

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

/* ================= CREATE INVITE LINK ================= */

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

    /* ❌ UNKNOWN CHAT */

    if (
      !GROUPS.includes(chatId) &&
      chatId !== PRIVATE_CHANNEL
    ) {

      console.log("GROUP NOT MATCHED");

      return;

    }

    /* ✅ APPROVE REQUEST */

    await bot.telegram.approveChatJoinRequest(
      chatId,
      ctx.from.id
    );

    console.log("REQUEST APPROVED");

    /* ✅ CHANNEL হলে শুধু ACCEPT */

    if (!GROUPS.includes(chatId)) {

      console.log("CHANNEL REQUEST APPROVED");

      return;

    }

    /* ================= GROUP WELCOME ================= */

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
            "🌏 Global Method Channel",
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

    const interval = setInterval(async () => {

  try {

    await ctx.telegram.editMessageText(
      chatId,
      msg.message_id,
      null,
      getRandomMessage(name),
      buttons
    );

  } catch (e) {

    console.log("EDIT ERROR (ignored)");

    // ❌ interval stop করা যাবে না
    // clearInterval(interval) REMOVE

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
            "🌏 Global Method Channel",
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

    console.log("START ERROR:", e);

  }

});

/* ================= GENERATE NEW LINK ================= */

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
            "🌏 Global Method Channel",
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

    console.log("NEW LINK ERROR:", e);

  }

});

/* ================= JOINED BUTTON ================= */

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

    console.log("JOINED ERROR:", e);

  }

});
/* ================= AUTO DELETE SERVICE MESSAGES ================= */

/* ================= AUTO DELETE SERVICE MESSAGES ================= */

bot.on("message", async (ctx, next) => {
  const msg = ctx.message;

  const serviceMessage =
    msg.new_chat_members ||
    msg.left_chat_member ||
    msg.group_chat_created ||
    msg.supergroup_chat_created ||
    msg.channel_chat_created ||
    msg.pinned_message ||
    msg.new_chat_title ||
    msg.new_chat_photo ||
    msg.delete_chat_photo ||
    msg.migrate_to_chat_id ||
    msg.migrate_from_chat_id ||
    msg.message_auto_delete_timer_changed ||
    msg.video_chat_started ||
    msg.video_chat_ended ||
    msg.video_chat_participants_invited ||
    msg.video_chat_scheduled;

  if (serviceMessage) {
    try {
      await ctx.deleteMessage();
    } catch {}
    return;
  }

  return next();
});
  /* ================= ADMIN COMMANDS BY USERNAME ================= */

async function getTargetUser(ctx) {
  // 1) Reply করা হলে replied user
  if (ctx.message.reply_to_message) {
    return ctx.message.reply_to_message.from;
  }

  // 2) /ban @username
  const parts = ctx.message.text.trim().split(/\s+/);

  if (parts.length < 2) return null;

  let username = parts[1]
    .replace("@", "")
    .toLowerCase();

  try {
    const admins = await ctx.getChatAdministrators();

    const member = admins.find(
      (a) =>
        a.user.username &&
        a.user.username.toLowerCase() === username
    );

    if (member) {
      return member.user;
    }
  } catch {}

  return null;
}

/* ================= BAN COMMAND ================= */

bot.command("ban", async (ctx) => {
  const target = await getTargetUser(ctx);

  if (!target) {
    return ctx.reply(
      "❌ User not found.\nUse:\n/ban @username\nor reply to a user's message."
    );
  }

  try {
    await ctx.banChatMember(target.id);
    await ctx.reply(`✅ @${target.username || target.first_name} banned.`);
  } catch {
    await ctx.reply("❌ Failed to ban user.");
  }
});

/* ================= UNBAN COMMAND ================= */

bot.command("unban", async (ctx) => {
  const target = await getTargetUser(ctx);

  if (!target) {
    return ctx.reply(
      "❌ User not found.\nUse:\n/unban @username\nor reply to a user's message."
    );
  }

  try {
    await ctx.unbanChatMember(target.id);
    await ctx.reply(`✅ @${target.username || target.first_name} unbanned.`);
  } catch {
    await ctx.reply("❌ Failed to unban user.");
  }
});

/* ================= MUTE COMMAND ================= */

bot.command("mute", async (ctx) => {
  const target = await getTargetUser(ctx);

  if (!target) {
    return ctx.reply(
      "❌ User not found.\nUse:\n/mute @username\nor reply to a user's message."
    );
  }

  try {
    await ctx.restrictChatMember(target.id, {
      can_send_messages: false
    });

    await ctx.reply(`🔇 @${target.username || target.first_name} muted.`);
  } catch {
    await ctx.reply("❌ Failed to mute user.");
  }
});

/* ================= UNMUTE COMMAND ================= */

bot.command("unmute", async (ctx) => {
  const target = await getTargetUser(ctx);

  if (!target) {
    return ctx.reply(
      "❌ User not found.\nUse:\n/unmute @username\nor reply to a user's message."
    );
  }

  try {
    await ctx.restrictChatMember(target.id, {
      can_send_messages: true,
      can_send_audios: true,
      can_send_documents: true,
      can_send_photos: true,
      can_send_videos: true,
      can_send_video_notes: true,
      can_send_voice_notes: true,
      can_send_polls: true,
      can_send_other_messages: true,
      can_add_web_page_previews: true,
      can_change_info: false,
      can_invite_users: true,
      can_pin_messages: false
    });

    await ctx.reply(`🔊 @${target.username || target.first_name} unmuted.`);
  } catch {
    await ctx.reply("❌ Failed to unmute user.");
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
