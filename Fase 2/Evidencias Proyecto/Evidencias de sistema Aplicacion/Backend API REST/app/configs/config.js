const yaml = require('js-yaml');
const fs = require('fs');
const path = require('path');

const swaggerDocument = yaml.load(fs.readFileSync(path.join(__dirname, '../docs/swagger.yml'), 'utf8'));

const config = {
  server: {
    context: '/ms-rutafit-neg',
    port: process.env.PORT || 3000,
    requestTimeout: 10 * 1000 // 10 seconds
  },
  swagger: {
    title: 'RutaFit API',
    description: 'Microservicio para usuarios, eventos, deportes y niveles',
    version: '1.0.0',
    endpoint: '/api-docs',
    document: swaggerDocument,
    uiOptions: {                       // opciones Swagger UI (tema RutaFit)
      customSiteTitle: 'RutaFit API — Docs',
      customCss: `
        .opblock-summary-method { background:#22c55e !important; }
        .btn.execute{ background:#22c55e !important; border:0 !important; }
        .topbar { background: transparent !important; }
      `,
      explorer: true,
      swaggerOptions: {
        docExpansion: 'list',
        persistAuthorization: true,
        displayOperationId: true,
        defaultModelsExpandDepth: 0,
      },
    },
  },
  cors: {
    origin: process.env.CORS_ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000', 'http://localhost:8081', 'https://capstone-project-3-13xo.onrender.com', 'http://localhost:5173'],

    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
  },
  routes: {
    locations: '/locations',
    users: '/users',
    nivelExperiencia: '/nivel-experiencia',
    tiposDeporte: '/tipos-deporte',
    eventos: '/eventos',
    rutas: '/rutas'
  },
  cache: {
    time: 5 * 60 * 1000 // 5 minutes
  },
  mongodb: {
    host: process.env.MONGO_HOST,
    user: process.env.MONGO_USER,
    password: process.env.MONGO_PASSWORD,
    db: process.env.MONGO_DB
  }
};

module.exports = config;