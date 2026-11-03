export default function handler(req, res) { return res.status(410).json({ success: false, message: 'Use the secure Netlify API' }); }
