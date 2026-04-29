import fs from 'fs';
import path from 'path';
import formidable from 'formidable';
import axios from 'axios';

const KEYS_FILE = path.join('/tmp', 'api_keys.json');

function getKeys() {
    try {
        if (fs.existsSync(KEYS_FILE)) {
            return JSON.parse(fs.readFileSync(KEYS_FILE, 'utf8'));
        }
    } catch (e) {}
    return {};
}

function saveKeys(keys) {
    fs.writeFileSync(KEYS_FILE, JSON.stringify(keys, null, 2));
}

export const config = { api: { bodyParser: false } };

export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-API-Key');
    
    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
    
    // CEK API KEY
    const apiKey = req.headers['x-api-key'];
    const keys = getKeys();
    
    if (!apiKey || !keys[apiKey]) {
        return res.status(401).json({ error: 'API Key tidak valid! Ambil dulu di halaman web.' });
    }
    
    // Update usage
    keys[apiKey].usage = (keys[apiKey].usage || 0) + 1;
    keys[apiKey].lastUsed = new Date().toISOString();
    saveKeys(keys);
    
    const IMGBB_KEY = 'cf2ea73123d8f799d25a7d9f5685471c';
    
    const form = formidable({});
    try {
        const [fields, files] = await form.parse(req);
        const file = files.file?.[0];
        if (!file) return res.status(400).json({ error: 'Tidak ada file' });
        
        const imageBase64 = fs.readFileSync(file.filepath).toString('base64');
        const formData = new URLSearchParams();
        formData.append('key', IMGBB_KEY);
        formData.append('image', imageBase64);
        formData.append('expiration', 0);
        
        const response = await axios.post('https://api.imgbb.com/1/upload', formData, {
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
        });
        
        if (response.data?.data?.url) {
            return res.json({
                success: true,
                url: response.data.data.url,
                usage: keys[apiKey].usage
            });
        }
        return res.status(500).json({ error: 'Upload gagal' });
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
}