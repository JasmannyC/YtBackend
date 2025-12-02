const express = require('express');
const ytdl = require('ytdl-core');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Ruta de salud para verificar que el servidor está vivo
app.get('/', (req, res) => {
  res.json({ 
    status: 'YouTube Downloader API funcionando correctamente',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

// Ruta de health check para Render
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK' });
});

// Ruta principal para extraer enlaces
app.post('/extract-link', async (req, res) => {
  try {
    const { videoUrl, videoId } = req.body;

    // Validación
    if (!videoUrl) {
      return res.status(400).json({ 
        error: 'URL del video es requerida' 
      });
    }

    // Validar URL de YouTube
    if (!ytdl.validateURL(videoUrl)) {
      return res.status(400).json({ 
        error: 'URL de YouTube inválida' 
      });
    }

    console.log('Procesando video:', videoUrl);

    // Obtener información del video con timeout
    const info = await Promise.race([
      ytdl.getInfo(videoUrl),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Timeout')), 25000)
      )
    ]);
    
    // Filtrar formatos válidos
    const formats = info.formats.filter(f => f.url && f.hasVideo && f.hasAudio);
    
    if (formats.length === 0) {
      return res.status(404).json({ 
        error: 'No se encontró un formato de descarga válido' 
      });
    }

    // Obtener el mejor formato
    const format = ytdl.chooseFormat(formats, { quality: 'highest' });

    if (!format || !format.url) {
      return res.status(404).json({ 
        error: 'No se pudo obtener la URL de descarga' 
      });
    }

    console.log('Video procesado exitosamente');

    res.json({
      streamUrl: format.url,
      title: info.videoDetails.title,
      duration: info.videoDetails.lengthSeconds,
      quality: format.qualityLabel || 'desconocida'
    });

  } catch (error) {
    console.error('Error al procesar video:', error.message);
    
    let errorMessage = 'Error al procesar el video';
    let statusCode = 500;

    if (error.message.includes('Video unavailable')) {
      errorMessage = 'El video no está disponible';
      statusCode = 404;
    } else if (error.message.includes('Timeout')) {
      errorMessage = 'El servidor tardó demasiado en responder';
      statusCode = 504;
    } else if (error.message.includes('private')) {
      errorMessage = 'El video es privado';
      statusCode = 403;
    }

    res.status(statusCode).json({ 
      error: errorMessage,
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Manejo de errores global
app.use((err, req, res, next) => {
  console.error('Error no manejado:', err);
  res.status(500).json({ 
    error: 'Error interno del servidor' 
  });
});

// Manejo de rutas no encontradas
app.use((req, res) => {
  res.status(404).json({ 
    error: 'Ruta no encontrada' 
  });
});

// Iniciar servidor
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(✅ Servidor corriendo en puerto ${PORT});
  console.log(🌐 Ambiente: ${process.env.NODE_ENV || 'production'});
});

// Manejo de señales de cierre
process.on('SIGTERM', () => {
  console.log('SIGTERM recibido, cerrando servidor...');
  server.close(() => {
    console.log('Servidor cerrado correctamente');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT recibido, cerrando servidor...');
  server.close(() => {
    console.log('Servidor cerrado correctamente');
    process.exit(0);
  });
});

// Manejo de errores no capturados
process.on('uncaughtException', (error) => {
  console.error('Excepción no capturada:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Promesa rechazada no manejada:', reason);
  process.exit(1);
});
