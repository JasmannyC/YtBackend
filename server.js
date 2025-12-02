// Archivo: server.js
const express = require('express');
const ytdl = require('ytdl-core'); 
const cors = require('cors');
const app = express();
const port = process.env.PORT || 3000; 

app.use(cors()); 
app.use(express.json());

// Este es el punto final (endpoint) al que llamará tu aplicación móvil
app.post('/extract-link', async (req, res) => {
    const { videoUrl } = req.body;

    if (!videoUrl) {
        return res.status(400).json({ error: 'Falta la URL del video.' });
    }

    try {
        const info = await ytdl.getInfo(videoUrl);

        // Busca el mejor formato MP4 con audio y video combinados.
        const format = ytdl.chooseFormat(info.formats, { 
            quality: 'highest', 
            filter: (f) => f.hasVideo && f.hasAudio && f.container === 'mp4' 
        });

        if (!format) {
            return res.status(404).json({ error: 'No se encontró un stream combinado. Prueba con otro video.' });
        }

        // Devuelve la URL de stream directa
        res.json({ streamUrl: format.url });

    } catch (error) {
        console.error('Error de ytdl-core:', error.message);
        res.status(500).json({ error: `Fallo en la extracción: ${error.message} });
    }
});

app.listen(port, () => {
    console.log(Servidor de extracción corriendo en el puerto ${port});
});
