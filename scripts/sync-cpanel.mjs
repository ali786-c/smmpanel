import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const DEPLOY_DIR = path.resolve(ROOT, 'cpanel-deployment');
const UI_SRC = path.resolve(ROOT, 'artifacts/landing');
const API_SRC = path.resolve(ROOT, 'artifacts/laravel-api');

function run(command, cwd, env = process.env) {
    console.log(`> Running: ${command} in ${cwd}`);
    execSync(command, { cwd, stdio: 'inherit', env });
}

async function sync() {
    console.log('🚀 Starting cPanel Deployment Sync...');

    // 1. Ensure deployment directory exists
    if (!fs.existsSync(DEPLOY_DIR)) {
        fs.mkdirSync(DEPLOY_DIR, { recursive: true });
    }

    // 2. Build UI
    console.log('\n📦 Building UI...');
    // Provide default PORT and BASE_PATH as required by vite.config.ts
    const env = { ...process.env, PORT: '3000', BASE_PATH: '/' };
    run('pnpm run build', UI_SRC, env);

    // 3. Copy UI build to root
    console.log('\n📂 Copying UI assets to deployment root...');
    const distDir = path.join(UI_SRC, 'dist/public'); // Vite config sets outDir to dist/public
    if (fs.existsSync(distDir)) {
        // Simple copy of dist contents to DEPLOY_DIR
        copyRecursiveSync(distDir, DEPLOY_DIR);
    } else {
        console.error('❌ UI build failed: dist directory not found!');
        process.exit(1);
    }

    // 4. Copy API files to api/ (Optional - skipped by default to protect direct changes)
    const syncApi = process.argv.includes('--with-api');
    
    if (syncApi) {
        console.log('\n📂 Copying Laravel API to deployment/api...');
        const deployApiDir = path.join(DEPLOY_DIR, 'api');
        if (!fs.existsSync(deployApiDir)) {
            fs.mkdirSync(deployApiDir, { recursive: true });
        }
        
        // Copy Laravel contents (including vendor as requested for a working backend)
        copyRecursiveSync(API_SRC, deployApiDir, ['.git', 'storage/framework/cache/data', 'storage/logs']);
    } else {
        console.log('\n⏩ Skipping Backend sync (development workflow). Use --with-api to force sync.');
    }

    console.log('\n✅ Deployment sync complete!');
    console.log(`📍 Output: ${DEPLOY_DIR}`);
}

function copyRecursiveSync(src, dest, exclude = []) {
    const exists = fs.existsSync(src);
    const stats = exists && fs.statSync(src);
    const isDirectory = exists && stats.isDirectory();

    if (isDirectory) {
        if (!fs.existsSync(dest)) {
            fs.mkdirSync(dest, { recursive: true });
        }
        fs.readdirSync(src).forEach((childItemName) => {
            if (!exclude.includes(childItemName) && !exclude.some(ex => path.join(src, childItemName).includes(ex))) {
                copyRecursiveSync(path.join(src, childItemName), path.join(dest, childItemName), exclude);
            }
        });
    } else {
        fs.copyFileSync(src, dest);
    }
}

sync().catch(err => {
    console.error('❌ Sync failed:', err);
    process.exit(1);
});
