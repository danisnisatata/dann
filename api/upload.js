import formidable from 'formidable';
import fs from 'fs';
import axios from 'axios';

export const config = { api: { bodyParser: false } };

const IMGBB_KEY = 'cf2ea73123d8f799d25a7d9f5685471c';
const STATIC_API_KEY = 'gantengdann-static-key-2024';

export default async function handler(req, res) {
    // CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-API-Key');
    
    if (req.method === 'OPTIONS') return res.status(200).end();
    
    // GET: Cek API Key (opsional, untuk testing)
    if (req.method === 'GET') {
        const apiKey = req.headers['x-api-key'];
        if (apiKey === STATIC_API_KEY) {
            return res.json({ success: true, apiKey: STATIC_API_KEY });
        }
        return res.status(401).json({ error: 'Invalid API Key' });
    }
    
    // POST: Upload file ke ImgBB
    if (req.method === 'POST') {
        const apiKey = req.headers['x-api-key'];
        if (apiKey !== STATIC_API_KEY) {
            return res.status(401).json({ error: 'Invalid API Key' });
        }
        
        const form = formidable({});
        try {
            const [fields, files] = await form.parse(req);
            const file = files.file?.[0];
            if (!file) return res.status(400).json({ error: 'No file uploaded' });
            
            const fileBuffer = fs.readFileSync(file.filepath);
            const base64Data = fileBuffer.toString('base64');
            
            const formData = new URLSearchParams();
            formData.append('key', IMGBB_KEY);
            formData.append('image', base64Data);
            formData.append('expiration', 0);
            
            const response = await axios.post('https://api.imgbb.com/1/upload', formData, {
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
            });
            
            if (response.data?.data?.url) {
                return res.json({
                    success: true,
                    url: response.data.data.url,
                    filename: file.originalFilename
                });
            }
            return res.status(500).json({ error: 'Upload to ImgBB failed' });
        } catch (err) {
            console.error(err);
            return res.status(500).json({ error: err.message });
        }
    }
    
    return res.status(405).json({ error: 'Method not allowed' });
}
