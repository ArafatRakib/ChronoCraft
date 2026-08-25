import puppeteer from 'puppeteer-core';
import fs from 'fs';
import path from 'path';

// --- Dynamic Chromium Path Detection ---
const TERMUX_DEFAULT = '/data/data/com.termux/files/usr/bin/chromium';
const LINUX_DEFAULT = '/usr/bin/chromium-browser';

const CHROMIUM_PATH = 
  process.env.CHROMIUM_PATH || 
  (fs.existsSync(TERMUX_DEFAULT) ? TERMUX_DEFAULT : LINUX_DEFAULT);

// --- Output Directories ---
const README_DIR = path.resolve('./assets/screenshots');
const FASTLANE_BASE = path.resolve('./fastlane/metadata/android/en-US/images');

const DIRECTORIES = {
  readme: README_DIR,
  phone: path.join(FASTLANE_BASE, 'phoneScreenshots'),
  sevenInch: path.join(FASTLANE_BASE, 'sevenInchScreenshots'),
  tenInch: path.join(FASTLANE_BASE, 'tenInchScreenshots'),
};

// --- Target Device Resolutions ---
const DEVICES = [
  {
    id: 'phone',
    name: 'Phone-Portrait',
    width: 412,          // Mobile CSS width (< 768px)
    height: 915,
    scale: 3,            // Outputs 1236 x 2745 physical PNGs
    fastlaneDir: DIRECTORIES.phone,
  },
  {
    id: 'sevenInch',
    name: 'Tablet-7inch',
    width: 600,          // 7" tablet CSS width
    height: 960,
    scale: 2,            // Outputs 1200 x 1920 physical PNGs
    fastlaneDir: DIRECTORIES.sevenInch,
  },
  {
    id: 'tenInch',
    name: 'Tablet-10inch',
    width: 1280,         // Expanded 10" tablet CSS width (Landscape / Wide Grid)
    height: 800,         // Expanded 10" tablet CSS height
    scale: 2,            // Outputs crisp 2560 x 1600 physical PNGs
    fastlaneDir: DIRECTORIES.tenInch,
  },
];


// Helper to hide dev tools overlays like Eruda
async function preparePageForCapture(page) {
  await page.addStyleTag({
    content: `
      #eruda, div[id*="eruda"] { display: none !important; visibility: hidden !important; opacity: 0 !important; pointer-events: none !important; }
    `
  });
}

// Helper to click a button by matching its visible text
async function clickBtnByText(page, text) {
  return page.evaluate((targetText) => {
    const buttons = Array.from(document.querySelectorAll('button'));
    const btn = buttons.find((b) => b.textContent && b.textContent.toLowerCase().includes(targetText.toLowerCase()));
    if (btn) {
      btn.click();
      return true;
    }
    return false;
  }, text);
}

// Screen capture step definitions with explicit element waits
const SCREENS = [
  {
    id: '01_main_dashboard',
    label: 'Main Dashboard (Grid Layout)',
    action: async (page) => {},
  },
  {
    id: '02a_create_timer_modal',
    label: 'Create Clock Modal (Timer Tab)',
    action: async (page) => {
      await clickBtnByText(page, 'Add');
      await page.waitForSelector('.fixed.inset-0', { visible: true, timeout: 3000 });
      await new Promise((r) => setTimeout(r, 300));
    },
  },
  {
    id: '02b_create_stopwatch_modal',
    label: 'Create Clock Modal (Stopwatch Tab)',
    action: async (page) => {
      await clickBtnByText(page, 'Add');
      await page.waitForSelector('.fixed.inset-0', { visible: true, timeout: 3000 });
      await new Promise((r) => setTimeout(r, 200));

      // Target 2nd button in CreateModal tab switcher
      await page.evaluate(() => {
        const modal = document.querySelector('.fixed');
        if (modal) {
          const tabBtns = modal.querySelectorAll('div.grid.grid-cols-3 button');
          if (tabBtns && tabBtns[1]) tabBtns[1].click();
        }
      });
      await new Promise((r) => setTimeout(r, 300));
    },
  },
  {
    id: '02c_create_interval_builder',
    label: 'Create Clock Modal (HIIT Interval Tab)',
    action: async (page) => {
      await clickBtnByText(page, 'Add');
      await page.waitForSelector('.fixed.inset-0', { visible: true, timeout: 3000 });
      await new Promise((r) => setTimeout(r, 200));

      // Target 3rd button in CreateModal tab switcher
      await page.evaluate(() => {
        const modal = document.querySelector('.fixed');
        if (modal) {
          const tabBtns = modal.querySelectorAll('div.grid.grid-cols-3 button');
          if (tabBtns && tabBtns[2]) tabBtns[2].click();
        }
      });
      await new Promise((r) => setTimeout(r, 300));
    },
  },
  {
    id: '03_presets_library',
    label: 'Preset Workflows Library',
    action: async (page) => {
      await clickBtnByText(page, 'Presets');
      await page.waitForSelector('.fixed.inset-0', { visible: true, timeout: 3000 });
      await new Promise((r) => setTimeout(r, 300));
    },
  },
  {
    id: '04_history_log',
    label: 'Run History Logs',
    action: async (page) => {
      await page.evaluate(() => {
        const toolsBtn = document.querySelector('button[title*="Tools"]');
        if (toolsBtn) toolsBtn.click();
      });
      await new Promise((r) => setTimeout(r, 300));
      await clickBtnByText(page, 'Run History Logs');
      await page.waitForSelector('.fixed.inset-0', { visible: true, timeout: 3000 });
      await new Promise((r) => setTimeout(r, 300));
    },
  },
  {
    id: '05_settings_audio',
    label: 'Sound & Audio Settings',
    action: async (page) => {
      await page.evaluate(() => {
        const toolsBtn = document.querySelector('button[title*="Tools"]');
        if (toolsBtn) toolsBtn.click();
      });
      await new Promise((r) => setTimeout(r, 300));
      await clickBtnByText(page, 'Sound & Settings');
      await page.waitForSelector('.fixed.inset-0', { visible: true, timeout: 3000 });
      await new Promise((r) => setTimeout(r, 300));
    },
  },
 {
    id: '06_stopwatch_analytics',
    label: 'Lap Analytics & CSV Export',
    action: async (page) => {
      // 1. Target options menu specifically inside the Stopwatch section/card
      await page.evaluate(() => {
        const swSection = Array.from(document.querySelectorAll('section, div')).find(
          (el) => el.textContent && el.textContent.includes('Sprint & Laps Stopwatch')
        );
        const moreBtn = swSection ? swSection.querySelector('button[title*="Options"], .relative button') : null;
        if (moreBtn) moreBtn.click();
      });
      await new Promise((r) => setTimeout(r, 300));
      await clickBtnByText(page, 'Lap Analytics');
      await page.waitForSelector('.fixed.inset-0', { visible: true, timeout: 3000 });
      await new Promise((r) => setTimeout(r, 300));
    },
  },
  {
    id: '07a_focus_mode',
    label: 'Fullscreen Focus Mode',
    action: async (page) => {
      // Click focus icon explicitly inside the Stopwatch card
      await page.evaluate(() => {
        const swCard = Array.from(document.querySelectorAll('div')).find(
          (el) => el.textContent && el.textContent.includes('Sprint & Laps Stopwatch')
        );
        const focusBtn = swCard ? swCard.querySelector('button[title*="Focus"]') : null;
        if (focusBtn) focusBtn.click();
      });
      await page.waitForSelector('.fixed.inset-0', { visible: true, timeout: 3000 });
      await new Promise((r) => setTimeout(r, 300));
    },
  },
  {
    id: '07b_focus_mode_laps',
    label: 'Focus Mode (View Laps Sheet)',
    action: async (page) => {
      // 1. Open Focus Mode on the Stopwatch card (NOT HIIT)
      await page.evaluate(() => {
        const swCard = Array.from(document.querySelectorAll('div')).find(
          (el) => el.textContent && el.textContent.includes('Sprint & Laps Stopwatch')
        );
        const focusBtn = swCard ? swCard.querySelector('button[title*="Focus"]') : null;
        if (focusBtn) focusBtn.click();
      });
      await page.waitForSelector('.fixed.inset-0', { visible: true, timeout: 3000 });
      await new Promise((r) => setTimeout(r, 300));

      // 2. Open Laps Drawer inside Stopwatch Focus view
      await clickBtnByText(page, 'View History');
      await new Promise((r) => setTimeout(r, 300));
    },
  },
  {
    id: '08_compact_layout',
    label: 'Compact List View',
    action: async (page) => {
      await page.evaluate(() => {
        const layoutBtn = document.querySelector('button[title*="Compact"]');
        if (layoutBtn) layoutBtn.click();
      });
      await new Promise((r) => setTimeout(r, 300));
    },
  },
 {
    id: '09_color_filter',
    label: 'Color Tag Filter Dropdown',
    action: async (page) => {
      // Target color dropdown by searching for 'All Colors' text button
      await page.evaluate(() => {
        const btns = Array.from(document.querySelectorAll('button'));
        const colorBtn = btns.find((b) => b.textContent && b.textContent.includes('All Colors'));
        if (colorBtn) colorBtn.click();
      });
      await new Promise((r) => setTimeout(r, 400));
    },
  },
];

function ensureDir(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

async function detectActiveServerUrl() {
  if (process.env.APP_URL) return process.env.APP_URL;
  const candidatePorts = [5173, 5174, 5175, 3000, 4173];
  for (const port of candidatePorts) {
    const candidateUrl = `http://localhost:${port}`;
    try {
      const res = await fetch(candidateUrl);
      if (res.ok || res.status === 200 || res.status === 304) return candidateUrl;
    } catch (e) {}
  }
  return null;
}

(async () => {
  if (!fs.existsSync(CHROMIUM_PATH)) {
    console.error(`❌ System Chromium not found at ${CHROMIUM_PATH}`);
    process.exit(1);
  }

  console.log('🔍 Checking for running Vite dev server...');
  const targetUrl = await detectActiveServerUrl();

  if (!targetUrl) {
    console.error('❌ Could not connect to active dev server!');
    process.exit(1);
  }

  console.log(`✅ Connected to dev server at: ${targetUrl}`);
  Object.values(DIRECTORIES).forEach(ensureDir);

  console.log('🚀 Launching Chromium...');
  const browser = await puppeteer.launch({
    executablePath: CHROMIUM_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu'],
  });

  const page = await browser.newPage();

  const THEMES = [
    { mode: 'dark', classAction: (p) => p.evaluate(() => document.documentElement.classList.add('dark')) },
    { mode: 'light', classAction: (p) => p.evaluate(() => document.documentElement.classList.remove('dark')) },
  ];

  for (const device of DEVICES) {
    console.log(`\n📱 Capturing screens for ${device.name} (${device.width}x${device.height})...`);

    await page.setViewport({
      width: device.width,
      height: device.height,
      deviceScaleFactor: device.scale,
      isMobile: true,
      hasTouch: true,
    });

    for (const theme of THEMES) {
      console.log(`  🎨 Theme: [${theme.mode.toUpperCase()}]`);

      for (const screen of SCREENS) {
        await page.goto(targetUrl, { waitUntil: 'networkidle0' });
        await preparePageForCapture(page);
        await theme.classAction(page);
        await new Promise((res) => setTimeout(res, 400));

        try {
          await screen.action(page);
          await preparePageForCapture(page);
          await theme.classAction(page);
          await new Promise((res) => setTimeout(res, 500));
        } catch (err) {
          console.warn(`    ⚠️ Trigger error on [${screen.label}], capturing current state.`);
        }

        const readmeFileName = `${device.name}_${theme.mode}_${screen.id}.png`;
        const storeFileName = `${theme.mode}_${screen.id}.png`;

        const readmePath = path.join(DIRECTORIES.readme, readmeFileName);
        const fastlanePath = path.join(device.fastlaneDir, storeFileName);

        await page.screenshot({ path: readmePath, fullPage: false });
        fs.copyFileSync(readmePath, fastlanePath);

        console.log(`    ✔ Captured [${screen.label}] -> ${readmeFileName}`);
      }
    }
  }

  await browser.close();
  console.log('\n✨ Screenshot automation complete!');
})();
