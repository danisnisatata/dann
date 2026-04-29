import fs from 'fs';
import path from 'path';

const KEYS_FILE = path.join('/tmp', 'api_keys.json');

// Baca keys dari file
function getKeys() {
    try {
        if (fs.existsSync(KEYS_FILE)) {
            return JSON.parse(fs.readFileSync(KEYS_FILE, 'utf8'));
        }
    } catch (e) {}
    return {};
}

// Simpan keys ke file
function saveKeys(keys) {
    fs.writeFileSync(KEYS_FILE, JSON.stringify(keys, null, 2));
}

export default async function handler(req, res) {
    // CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    if (req.method === 'OPTIONS') return res.status(200).end();
    
    const keys = getKeys();
    
    // GET: Ambil/cek API Key
    if (req.method === 'GET') {
        const apiKey = req.headers['x-api-key'];
        if (apiKey && keys[apiKey]) {
            return res.json({
                success: true,
                apiKey: apiKey,
                created: keys[apiKey].created,
                usage: keys[apiKey].usage || 0
            });
        }
        return res.status(404).json({ error: 'API Key tidak ditemukan' });
    }
    
    // POST: Generate API Key baru
    if (req.method === 'POST') {
        const newKey = crypto.randomUUID();
        keys[newKey] = {
            created: new Date().toISOString(),
            usage: 0,
            lastUsed: null
        };
        saveKeys(keys);
        
        return res.json({
            success: true,
            apiKey: newKey,
            message: 'API Key berhasil dibuat! Simpan baik-baik.'
        });
    }
    
    return res.status(405).json({ error: 'Method not allowed' });
}