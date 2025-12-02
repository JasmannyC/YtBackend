const express = require('express');
const ytdl = require('ytdl-core');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.post('/extract-link', async (req, res) => {
  try {
    const { videoUrl, videoId } = req.body;

    if (!videoUrl) {
      return res.status(400).json({ error: 'URL del video es requerida' });
    }

    // Validar URL
    if (!ytdl.validateURL(videoUrl)) {
      return res.status(400).json({ error: 'URL de YouTube inválida' });
    }

    // Obtener información del video
    const info = await ytdl.getInfo(videoUrl);
    
    // Obtener el mejor formato
    const format = ytdl.chooseFormat(info.formats, { quality: 'highest' });

    if (!format || !format.url) {
      return res.status(404).json({ error: 'No se encontró un formato de descarga' });
    }

    res.json({
      streamUrl: format.url,
      title: info.videoDetails.title,
      duration: info.videoDetails.lengthSeconds
    });

  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ 
      error: 'Error al procesar el video',
      details: error.message 
    });
  }
});

app.get('/', (req, res) => {
  res.json({ status: 'YouTube Downloader API funcionando' });
});
