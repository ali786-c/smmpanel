import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Move up to root if script is in scripts/
const rootDir = path.join(__dirname, '..');

const migrationFile = path.join(rootDir, 'migration_passwords.csv');
const sendFile = path.join(rootDir, 'send.csv');
const outputFile = path.join(rootDir, 'unsent_emails.csv');

function parseCSVLine(line) {
    const result = [];
    let current = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"') {
            inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
            result.push(current.trim());
            current = '';
        } else {
            current += char;
        }
    }
    result.push(current.trim());
    return result;
}

async function run() {
    console.log(`Checking files:\n - Migration: ${migrationFile}\n - Send: ${sendFile}`);
    
    if (!fs.existsSync(migrationFile)) {
        console.error(`Migration file not found: ${migrationFile}`);
        return;
    }
    if (!fs.existsSync(sendFile)) {
        console.error(`Send file not found: ${sendFile}`);
        return;
    }

    console.log('Reading send.csv...');
    const sendData = fs.readFileSync(sendFile, 'utf8').split('\n');
    const sentEmails = new Set();
    
    // Header is line 0, data starts from line 1
    for (let i = 1; i < sendData.length; i++) {
        const line = sendData[i].trim();
        if (!line) continue;
        const columns = parseCSVLine(line);
        if (columns.length > 1) {
            sentEmails.add(columns[1].toLowerCase());
        }
    }
    console.log(`Found ${sentEmails.size} unique sent emails.`);

    console.log('Reading migration_passwords.csv...');
    const migrationData = fs.readFileSync(migrationFile, 'utf8').split('\n');
    const unsentRows = [];
    
    // Preserve header
    const header = migrationData[0].trim();
    unsentRows.push(header);

    for (let i = 1; i < migrationData.length; i++) {
        const line = migrationData[i].trim();
        if (!line) continue;
        const columns = parseCSVLine(line);
        if (columns.length > 0) {
            const email = columns[0].toLowerCase();
            if (!sentEmails.has(email)) {
                unsentRows.push(line);
            }
        }
    }

    console.log(`Found ${unsentRows.length - 1} unsent emails.`);
    fs.writeFileSync(outputFile, unsentRows.join('\n'));
    console.log(`Saved to ${outputFile}`);
}

run().catch(err => console.error(err));
