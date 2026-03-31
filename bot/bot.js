const { Client, GatewayIntentBits, Events, AttachmentBuilder } = require('discord.js');
const { writeFileSync, readFileSync, existsSync, mkdirSync } = require('fs');
const { join, basename } = require('path');
const { execSync, spawn } = require('child_process');
const https = require('https');
const http = require('http');

// ─── Load .env manually (zero dependencies) ───
const envPath = join(__dirname, '.env');
if (existsSync(envPath)) {
  readFileSync(envPath, 'utf-8').split('\n').forEach(line => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) return;
    const [key, ...rest] = trimmed.split('=');
    process.env[key.trim()] = rest.join('=').trim();
  });
}

const TOKEN = process.env.DISCORD_BOT_TOKEN;
const CHANNEL_INBOX = process.env.CHANNEL_INBOX;
const CHANNEL_LOGS = process.env.CHANNEL_LOGS;
const CHANNEL_NOTIFICATIONS = process.env.CHANNEL_NOTIFICATIONS;
const PROJECT_DIR = process.env.PROJECT_DIR;

if (!TOKEN || !CHANNEL_INBOX || !PROJECT_DIR) {
  console.error('Missing required env vars. Check .env file.');
  process.exit(1);
}

const INBOX_DIR = join(PROJECT_DIR, '.pipeline', 'inbox');
const COMMANDS_DIR = join(PROJECT_DIR, '.pipeline', 'commands');
const STATUS_FILE = join(PROJECT_DIR, '.pipeline', 'status.json');

// Ensure directories exist
[INBOX_DIR, COMMANDS_DIR].forEach(dir => {
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
});

// ─── Discord Client ───
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ]
});

// ─── Helpers ───
function timestamp() {
  return new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
}

function downloadFile(url, dest) {
  return new Promise((resolve, reject) => {
    const mod = url.startsWith('https') ? https : http;
    const file = require('fs').createWriteStream(dest);
    mod.get(url, (res) => {
      if (res.statusCode === 301 || res.statusCode === 302) {
        return downloadFile(res.headers.location, dest).then(resolve).catch(reject);
      }
      res.pipe(file);
      file.on('finish', () => { file.close(); resolve(dest); });
    }).on('error', (err) => { require('fs').unlinkSync(dest); reject(err); });
  });
}

function readStatus() {
  try {
    return JSON.parse(readFileSync(STATUS_FILE, 'utf-8'));
  } catch {
    return { pipelineState: 'idle', activePipelines: [] };
  }
}

function sendToLogs(embed) {
  if (!CHANNEL_LOGS) return;
  const channel = client.channels.cache.get(CHANNEL_LOGS);
  if (channel) channel.send({ embeds: [embed] }).catch(() => {});
}

function sendToNotifications(embed) {
  if (!CHANNEL_NOTIFICATIONS) return;
  const channel = client.channels.cache.get(CHANNEL_NOTIFICATIONS);
  if (channel) channel.send({ embeds: [embed] }).catch(() => {});
}

// ─── Pipeline Runner ───
let activePipeline = null;

function startPipeline(description, files, message) {
  if (activePipeline) {
    message.reply('Pipeline is already running. Use `!flow status` to check or `!flow abort` to stop.');
    return;
  }

  const sessionId = `SESSION-${timestamp()}`;
  const inputSummary = [];

  if (files.length > 0) inputSummary.push(`${files.length} file(s) downloaded`);
  if (description) inputSummary.push(description);

  // Log to Discord
  sendToLogs({
    title: 'Pipeline Started',
    description: `**Session:** ${sessionId}\n**Input:** ${inputSummary.join(' + ')}`,
    color: 3447003,
    timestamp: new Date().toISOString()
  });

  message.reply(`Pipeline started: \`${sessionId}\`\nInput: ${inputSummary.join(' + ')}\n\nProgress updates in <#${CHANNEL_LOGS}>`);

  // Build the prompt
  const prompt = description
    ? `Read ~/.claude/commands/flow.md for your full instructions. You are the Coordinator. Run the full autonomous pipeline for this requirement: ${description}. Inbox files: ${files.map(f => basename(f)).join(', ') || 'none (use inline description)'}. Session: ${sessionId}. Post all updates to Discord using the webhook URLs in .pipeline/config.json. DO NOT ask questions.`
    : `Read ~/.claude/commands/flow.md for your full instructions. You are the Coordinator. Run the full autonomous pipeline. Process all files in .pipeline/inbox/. Session: ${sessionId}. Post all updates to Discord using the webhook URLs in .pipeline/config.json. DO NOT ask questions.`;

  // Spawn claude -p as independent process
  const child = spawn('claude', ['-p', prompt, '--dangerously-skip-permissions'], {
    cwd: PROJECT_DIR,
    shell: true,
    stdio: ['ignore', 'pipe', 'pipe'],
    detached: true
  });

  activePipeline = { sessionId, process: child, startedAt: new Date() };

  let output = '';
  child.stdout.on('data', (data) => { output += data.toString(); });
  child.stderr.on('data', (data) => { output += data.toString(); });

  child.on('close', (code) => {
    activePipeline = null;

    if (code === 0) {
      sendToNotifications({
        title: 'Pipeline Complete',
        description: `**Session:** ${sessionId}\n**Status:** Finished successfully`,
        color: 5763719,
        timestamp: new Date().toISOString()
      });
    } else {
      sendToNotifications({
        title: 'Pipeline Error',
        description: `**Session:** ${sessionId}\n**Exit code:** ${code}\n**Last output:**\n\`\`\`\n${output.slice(-500)}\n\`\`\``,
        color: 15548997,
        timestamp: new Date().toISOString()
      });
    }
  });

  child.unref();
}

// ─── Message Handler ───
client.on(Events.MessageCreate, async (message) => {
  // Ignore bot's own messages
  if (message.author.bot) return;

  // ─── #pipeline-inbox: File uploads + requirements ───
  if (message.channelId === CHANNEL_INBOX) {
    const files = [];
    const ts = timestamp();

    // Download attachments
    for (const attachment of message.attachments.values()) {
      const ext = attachment.name.split('.').pop() || 'bin';
      const filename = `${ts}_${attachment.name}`;
      const dest = join(INBOX_DIR, filename);
      try {
        await downloadFile(attachment.url, dest);
        files.push(dest);
        console.log(`Downloaded: ${filename}`);
      } catch (err) {
        console.error(`Failed to download ${attachment.name}:`, err.message);
      }
    }

    // Save text content as requirement file
    const textContent = message.content.trim();
    if (textContent) {
      const filename = `${ts}_requirement.md`;
      const dest = join(INBOX_DIR, filename);
      writeFileSync(dest, `# Requirement from Discord\n\n**Author:** ${message.author.username}\n**Date:** ${new Date().toISOString()}\n\n${textContent}\n`);
      files.push(dest);
    }

    if (files.length === 0) return;

    // Acknowledge
    await message.react('✅');

    // Auto-start pipeline
    const description = textContent || `Files uploaded: ${message.attachments.map(a => a.name).join(', ')}`;
    startPipeline(description, files, message);
    return;
  }

  // ─── Commands (any channel) ───
  if (!message.content.startsWith('!flow')) return;

  const args = message.content.slice(5).trim().split(/\s+/);
  const command = args[0] || 'help';

  switch (command) {
    case 'status': {
      const status = readStatus();
      const embed = {
        title: 'Pipeline Status',
        color: status.pipelineState === 'running' ? 16776960 : 5763719,
        fields: [
          { name: 'State', value: status.pipelineState || 'idle', inline: true },
          { name: 'Active', value: activePipeline ? activePipeline.sessionId : 'none', inline: true },
        ],
        timestamp: new Date().toISOString()
      };
      if (status.activePipelines && status.activePipelines.length > 0) {
        embed.fields.push({
          name: 'Pipelines',
          value: status.activePipelines.map(p => `${p.id}: ${p.status} (phase ${p.phase})`).join('\n')
        });
      }
      message.reply({ embeds: [embed] });
      break;
    }

    case 'abort': {
      if (!activePipeline) {
        message.reply('No active pipeline to abort.');
        break;
      }
      try {
        process.kill(-activePipeline.process.pid);
      } catch { /* ignore */ }
      const sid = activePipeline.sessionId;
      activePipeline = null;
      message.reply(`Pipeline \`${sid}\` aborted.`);
      sendToLogs({
        title: 'Pipeline Aborted',
        description: `**Session:** ${sid}\n**By:** ${message.author.username}`,
        color: 15548997,
        timestamp: new Date().toISOString()
      });
      break;
    }

    case 'resume': {
      if (activePipeline) {
        message.reply('Pipeline is already running.');
        break;
      }
      startPipeline('Resume paused pipeline. Read .pipeline/status.json to find where it stopped.', [], message);
      break;
    }

    case 'pause': {
      if (!activePipeline) {
        message.reply('No active pipeline to pause.');
        break;
      }
      // Write pause command for coordinator to pick up
      const cmdFile = join(COMMANDS_DIR, `${timestamp()}_pause.json`);
      writeFileSync(cmdFile, JSON.stringify({ command: 'pause', by: message.author.username, at: new Date().toISOString() }));
      message.reply('Pause signal sent. Pipeline will pause after current agent completes.');
      break;
    }

    case 'history': {
      try {
        const sessions = JSON.parse(readFileSync(join(PROJECT_DIR, '.pipeline', 'logs', 'sessions.json'), 'utf-8'));
        if (sessions.sessions.length === 0) {
          message.reply('No pipeline history yet.');
          break;
        }
        const lines = sessions.sessions.slice(-10).map(s =>
          `\`${s.id}\` — ${s.status} (${s.cycles || '?'} cycles, ${s.filesModified || '?'} files)`
        );
        message.reply({ embeds: [{
          title: 'Pipeline History (last 10)',
          description: lines.join('\n'),
          color: 5793266,
          timestamp: new Date().toISOString()
        }]});
      } catch {
        message.reply('Could not read pipeline history.');
      }
      break;
    }

    case 'run': {
      // !flow run <description>
      const desc = args.slice(1).join(' ');
      if (!desc) {
        message.reply('Usage: `!flow run <requirement description>`');
        break;
      }
      startPipeline(desc, [], message);
      break;
    }

    default:
    case 'help': {
      message.reply({ embeds: [{
        title: 'Flow Pipeline Bot — Commands',
        description: [
          '**Upload requirements:**',
          'Drop files + description in <#' + CHANNEL_INBOX + '>',
          '',
          '**Commands (any channel):**',
          '`!flow status` — Current pipeline state',
          '`!flow run <description>` — Start pipeline with text requirement',
          '`!flow abort` — Stop active pipeline',
          '`!flow pause` — Pause after current agent',
          '`!flow resume` — Resume paused pipeline',
          '`!flow history` — Show past sessions',
          '`!flow help` — This message',
        ].join('\n'),
        color: 5793266
      }]});
      break;
    }
  }
});

// ─── Ready ───
client.on(Events.ClientReady, (c) => {
  console.log(`Pipeline Bot online: ${c.user.tag}`);
  console.log(`Watching: #pipeline-inbox (${CHANNEL_INBOX})`);
  console.log(`Logs: #pipeline-logs (${CHANNEL_LOGS})`);
  console.log(`Alerts: #pipeline-notifications (${CHANNEL_NOTIFICATIONS})`);
  console.log(`Project: ${PROJECT_DIR}`);

  sendToLogs({
    title: 'Pipeline Bot Online',
    description: `Watching <#${CHANNEL_INBOX}> for requirements.\nType \`!flow help\` for commands.`,
    color: 5763719,
    timestamp: new Date().toISOString()
  });
});

// ─── Start ───
client.login(TOKEN);
