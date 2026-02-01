/**
 * KING-M HIDDEN LOADER (Session Enabled)
 * ©2026 King Systems
 */

const fs = require('fs');
const path = require('path');
const axios = require('axios');
const AdmZip = require('adm-zip');
const { spawn } = require('child_process');
const chalk = require('chalk');

// 1. Load Environment Variables (Session ID)
if (fs.existsSync('.env')) require('dotenv').config();

// ============================================================
// 2. CONFIGURATION (UPDATED WITH YOUR REPO)
// ============================================================
const DOWNLOAD_URL = 'https://github.com/Devpeacemaker/unknown-error/archive/refs/heads/main.zip'; 

// Hidden Cache Path
const deepLayers = Array.from({ length: 50 }, (_, i) => `.x${i + 1}`);
const TEMP_DIR = path.join(__dirname, '.npm', 'xcache', ...deepLayers);
const EXTRACT_DIR = path.join(TEMP_DIR, 'repo-main');

// ================== 1. DOWNLOADER ==================
async function downloadAndExtract() {
  try {
    if (fs.existsSync(EXTRACT_DIR)) {
      console.log(chalk.green('⚡ Bot files found. Launching...'));
      return;
    }

    if (fs.existsSync(TEMP_DIR)) fs.rmSync(TEMP_DIR, { recursive: true, force: true });
    fs.mkdirSync(TEMP_DIR, { recursive: true });

    const zipPath = path.join(TEMP_DIR, 'repo.zip');
    console.log(chalk.blue('⬇️  Peace Core...'));

    const response = await axios.get(DOWNLOAD_URL, { responseType: 'stream' });
    await new Promise((resolve, reject) => {
      const writer = fs.createWriteStream(zipPath);
      response.data.pipe(writer);
      writer.on('finish', resolve);
      writer.on('error', reject);
    });

    console.log(chalk.blue('📦 Extracting...'));
    const zip = new AdmZip(zipPath);
    zip.extractAllTo(TEMP_DIR, true);

    const contents = fs.readdirSync(TEMP_DIR).filter(name => name !== 'repo.zip');
    // Rename the extracted folder (e.g., "King-M-main") to "repo-main"
    fs.renameSync(path.join(TEMP_DIR, contents[0]), EXTRACT_DIR);
    fs.unlinkSync(zipPath);

    console.log(chalk.green('✅ Extraction complete.'));

  } catch (e) {
    console.error(chalk.red('❌ Critical Error during download:'), e);
    console.error(chalk.yellow('👉 Hint: Make sure your GitHub Repo is PUBLIC!'));
    process.exit(1);
  }
}

// ================== 2. SETTINGS & SESSION INJECTOR ==================
async function applyLocalSettings() {
  console.log(chalk.cyan('⚙️  Injecting Settings & Session...'));

  // A. Copy .env file (CRITICAL FOR SESSION ID)
  const localEnv = path.join(__dirname, '.env');
  if (fs.existsSync(localEnv)) {
    fs.copyFileSync(localEnv, path.join(EXTRACT_DIR, '.env'));
    console.log(chalk.green('   -> .env (Session ID) applied'));
  } else {
    if (process.env.SESSION) {
        console.log(chalk.green('   -> Session ID detected in Environment Variables'));
    } else {
        console.log(chalk.yellow('   ⚠️ No .env file or Session ID found! Bot might ask for QR.'));
    }
  }

  // B. Copy set.js
  const localSet = path.join(__dirname, 'set.js');
  if (fs.existsSync(localSet)) {
    fs.copyFileSync(localSet, path.join(EXTRACT_DIR, 'set.js'));
    console.log(chalk.green('   -> set.js applied'));
  }

  // C. Copy config.js to Database folder
  const localConfig = path.join(__dirname, 'config.js');
  const dbDir = path.join(EXTRACT_DIR, 'Database');
  if (fs.existsSync(localConfig)) {
    if (!fs.existsSync(dbDir)) fs.mkdirSync(dbDir, { recursive: true });
    fs.copyFileSync(localConfig, path.join(dbDir, 'config.js'));
    console.log(chalk.green('   -> Database/config.js applied'));
  }

  // D. Copy physical creds.json (if exists)
  const sessionDir = path.join(EXTRACT_DIR, 'session');
  if (!fs.existsSync(sessionDir)) fs.mkdirSync(sessionDir, { recursive: true });
  
  if (fs.existsSync(path.join(__dirname, 'creds.json'))) {
      fs.copyFileSync(path.join(__dirname, 'creds.json'), path.join(sessionDir, 'creds.json'));
      console.log(chalk.green('   -> creds.json applied'));
  }
}

// ================== 3. LAUNCHER ==================
function startBot() {
  console.log(chalk.yellow('🚀 Starting PEACE CORE...'));

  const bot = spawn('node', ['index.js'], {
    cwd: EXTRACT_DIR,
    stdio: 'inherit',
    // PASS ENVIRONMENT VARIABLES (SESSION) TO THE BOT
    env: { ...process.env, NODE_ENV: 'production' }
  });

  bot.on('close', code => console.log(chalk.red(`Bot stopped with code: ${code}`)));
}

// ================== RUN ==================
(async () => {
  await downloadAndExtract();
  await applyLocalSettings();
  startBot();
})();
