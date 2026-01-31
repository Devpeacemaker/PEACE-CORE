const fs = require('fs');
if (fs.existsSync('.env')) require('dotenv').config({ path: __dirname + '/.env' });


const sessionName = 'session';
const session = process.env.SESSION || '';
const appname = process.env.APP_NAME || '';
const herokuapi = process.env.HEROKU_API || '';

// 🔹 BOT IDENTITY
const botname = process.env.BOTNAME || 'ᴘᴇᴀᴄᴇ-ᴄᴏʀᴇ';
const author = process.env.STICKER_AUTHOR || 'ᴄᴏʀᴇ';
const packname = process.env.STICKER_PACKNAME || 'ᴘᴇᴀᴄᴇ';


const dev = process.env.DEV || '254752818245';
const owner = dev.split(",");
const mycode = process.env.CODE || '254';
const port = process.env.PORT || 8080;


const databaseUrl = process.env.DATABASE_URL || "postgresql://neondb_owner:npg_lSc0PpxgeYn6@ep-rapid-forest-a4hm0939-pooler.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require";

// 🔹 VISUALS & MENUS
const menulink = process.env.MENU_LINK || 'https://files.catbox.moe/as1b4c.png';
const menu = process.env.MENU_TYPE || 'VIDEO'; // Options: IMAGE, VIDEO, GIF

// 🔹 MESSAGES
const bad = process.env.BAD_WORD || 'fuck';
const admin = process.env.ADMIN_MSG || 'ᴄᴏᴍᴍᴀɴᴅ ʀᴇsᴇʀᴠᴇᴅ ꜰᴏʀ ᴀᴅᴍɪɴs!';
const group = process.env.GROUP_ONLY_MSG || '👥 ᴄᴏᴍᴍᴀɴᴅ ᴍᴇᴀɴᴛ ꜰᴏʀ ɢʀᴏᴜᴘs!';
const botAdmin = process.env.BOT_ADMIN_MSG || '🧃 ʏᴏᴜ ɴᴇᴇᴅ ᴀɴ ᴀᴅᴍɪɴ ᴊᴜɪᴄᴇ ʀᴇꜰɪʟʟ ʙᴇꜰᴏʀᴇ sɪᴘᴘɪɴɢ ᴏɴ ᴛʜɪs ᴄᴏᴍᴍᴀɴᴅ!';
const NotOwner = process.env.NOT_OWNER_MSG || '👮 ᴄᴏᴍᴍᴀɴᴅ ᴍᴇᴀɴᴛ ꜰᴏʀ ᴛʜᴇ ᴏᴡɴᴇʀ!';

module.exports = {
  session,
  sessionName,
  author,
  packname,
  dev,
  owner,
  bad,
  group,
  NotOwner,
  botname,
  botAdmin,
  menu,
  menulink,
  admin,
  mycode,
  herokuapi,
  port,
  appname,
  databaseUrl
};


let file = require.resolve(__filename);
fs.watchFile(file, () => {
  fs.unwatchFile(file);
  console.log(`Update '${__filename}'`);
  delete require.cache[file];
  require(file);
});
