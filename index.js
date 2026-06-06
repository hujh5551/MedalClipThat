const { Client, GatewayIntentBits, AttachmentBuilder } = require('discord.js');
const puppeteer = require('puppeteer');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

client.on('messageCreate', async (message) => {
  if (message.content.toLowerCase() !== 'medal clip that shit') return;

  const messages = await message.channel.messages.fetch({ limit: 7 });
  const sorted = [...messages.values()].reverse();

  const rows = sorted.map(m => {
    const attachments = [...m.attachments.values()]
      .filter(a => a.contentType?.startsWith('image/') || a.contentType === 'image/gif')
      .map(a => `<img class="attachment" src="${a.url}">`)
      .join('');

    const embeds = m.embeds
      .filter(e => e.thumbnail?.url || e.image?.url)
      .map(e => `<img class="attachment" src="${e.thumbnail?.url || e.image?.url}">`)
      .join('');

    const stickers = [...m.stickers.values()]
      .map(s => `<img class="attachment" src="https://media.discordapp.net/stickers/${s.id}.png?size=160">`)
      .join('');

    return `
      <div class="msg">
        <img class="avatar" src="${m.author.displayAvatarURL({ size: 32, extension: 'png' })}">
        <div>
          <span class="name" style="color:${stringToColor(m.author.username)}">${escapeHtml(m.author.username)}</span>
          <span class="time">${m.createdAt.toLocaleTimeString()}</span>
          <div class="content">${escapeHtml(m.content)}</div>
          ${attachments}
          ${embeds}
          ${stickers}
        </div>
      </div>
    `;
  }).join('');

  const html = `
    <html><head><style>
      body { background:#313338; font-family: sans-serif; padding:16px; width:520px; }
      .msg { display:flex; gap:12px; margin-bottom:14px; align-items:flex-start; }
      .avatar { width:32px; height:32px; border-radius:50%; flex-shrink:0; }
      .name { font-weight:600; font-size:13px; }
      .time { color:#949BA4; font-size:11px; margin-left:8px; }
      .content { color:#DBDEE1; font-size:14px; margin-top:2px; }
      .attachment { max-width:300px; max-height:200px; border-radius:4px; margin-top:6px; display:block; }
    </style></head><body>${rows}</body></html>
  `;

  const browser = await puppeteer.launch({ args: ['--no-sandbox'] });
  const page = await browser.newPage();
  await page.setContent(html, { waitUntil: 'networkidle0' });
  await page.setViewport({ width: 552, height: 1 });
  const buf = await page.screenshot({ fullPage: true });
  await browser.close();

  const attachment = new AttachmentBuilder(buf, { name: 'clip.png' });
  await message.channel.send({ files: [attachment] });
});

function escapeHtml(str) {
  return (str || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

function stringToColor(str) {
  let hash = 0;
  for (const c of str) hash = c.charCodeAt(0) + ((hash << 5) - hash);
  return `hsl(${hash % 360}, 70%, 70%)`;
}

client.login(process.env.DISCORD_TOKEN);
