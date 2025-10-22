<div align="center">

<p align="center">
  <p align="center">
  <img
    src="./Fase 2/Evidencias Proyecto/Evidencias de sistema Aplicacion/App movil RutaFit/assets/ImgPerfil/bannner-readme.png"
    alt="Banner RutaFit"
    <p align="center"><em> 🏃‍♀️Tu compañero para descubrir y compartir rutas deportivas</em></p>
</p>

<br/>

# 🎓 **CAPSTONE_PROJECT**
**Proyecto de Titulación Duoc UC 2025**  
📱 App Móvil &nbsp; + &nbsp; 🌐 API REST
<br/><br/>
[![React Native](https://img.shields.io/badge/React_Native-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](#)
[![Expo](https://img.shields.io/badge/Expo-000000?style=for-the-badge&logo=expo&logoColor=white)](#)
[![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=node.js&logoColor=white)](#)
[![Express](https://img.shields.io/badge/Express.js-000000?style=for-the-badge&logo=express&logoColor=white)](#)
[![MongoDB](https://img.shields.io/badge/MongoDB-4EA94B?style=for-the-badge&logo=mongodb&logoColor=white)](#)
[![Firebase](https://img.shields.io/badge/Firebase-ffca28?style=for-the-badge&logo=firebase&logoColor=black)](#)
[![Render](https://img.shields.io/badge/Render-000000?style=for-the-badge&logo=render&logoColor=white)](#)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](#)
[![GitHub](https://img.shields.io/badge/GitHub-181717?style=for-the-badge&logo=github&logoColor=white)](#)

---

</div>

## Descripción

**RutaFit** es una aplicación móvil deportiva creada como parte del **Proyecto Capstone Duoc UC**.  
Permite **registrar, crear y compartir rutas deportivas** (ciclismo, trekking, running, etc.) y **participar en eventos grupales**, fomentando la actividad física y la comunidad entre deportistas.

> 💡 El proyecto combina una **App móvil (React Native + Expo)** y un **Backend REST API (Node.js + MongoDB)** desplegado en Render, con autenticación segura mediante Firebase.

---

## 🚀 Funcionalidades

✅ Registro e inicio de sesión con **Firebase Authentication**  
✅ Edición de perfil y selección de avatar  
✅ Creación y gestión de **eventos deportivos**  
✅ Participación y cancelación de eventos  
✅ Registro y visualización de **rutas en mapa (Expo Location & Maps)**  
✅ Integración con **MongoDB Atlas** para almacenamiento de datos  

---

## 🛠️ Tecnologías Utilizadas

```bash
### Prerequisites
- **Node.js:** **22.11.0 (LTS)**  
- **npm:** **10.8.1**  
- **Git:** 2.30+  
```

### 🧰 Stack técnico (versiones)

```bash
**Backend:** `express@5.1.0` · `cors@2.8.5` · `dotenv@17.2.2` · `mongodb@6.20.0` · `swagger-ui-express@5.0.1` · `axios@1.12.2` · **dev:** `jest@30.1.3` · `nodemon@3.0.1`

**Frontend:** `expo@54.0.17` · `react@19.1.0` · `react-native@0.81.5` · `expo-router@6.0.13` · `firebase@12.3.0` · `tailwindcss@3.4.17` · `nativewind@4.2.1`
```

<div align="center">

| Categoría | Tecnologías |
|------------|--------------|
| **Frontend** | React Native, Expo, NativeWind (Tailwind), Expo Router |
| **Backend** | Node.js, Express, Swagger UI |
| **Base de Datos** | MongoDB Atlas |
| **Autenticación** | Firebase Authentication |
| **Despliegue** | Render |
| **Colaboración** | GitHub, Figma |

</div>

---
## 📁 Estructura del Proyecto

```text
```text
CAPSTONE_PROJECT/
├─ README.md
│
├─ Fase 1/
│  ├─ Evidencias Grupales/
│  └─ Evidencias Individuales/
│
├─ Fase 2/
│  ├─ Evidencias Grupales/
│  ├─ Evidencias Individuales/
│  └─ Evidencias Proyecto/
│     ├─ Evidencias de Base de datos/
│     ├─ Evidencias de documentación/
│     └─ Evidencias de sistema Aplicacion/
│        │
│        ├─ App movil RutaFit/
│        │  ├─ app/
│        │  │  ├─ (auth)/
│        │  │  ├─ (tabs)/
│        │  │  └─ ...
│        │  ├─ assets/
│        │  │  ├─ ImgPerfil/
│        │  │  ├─ icons/
│        │  │  └─ ...
│        │  ├─ context/
│        │  ├─ interface/
│        │  ├─ services/
│        │  ├─ src/
│        │  ├─ app.config.js
│        │  ├─ babel.config.js
│        │  ├─ index.ts
│        │  ├─ package.json
│        │  └─ ...
│        │
│        └─ Backend API REST/
│           ├─ app/
│           │  ├─ cache/
│           │  ├─ clients/
│           │  ├─ configs/
│           │  ├─ constants/
│           │  ├─ controllers/
│           │  ├─ docs/
│           │  ├─ domains/
│           │  ├─ dtos/
│           │  ├─ errors/
│           │  ├─ mappers/
│           │  ├─ middlewares/
│           │  ├─ repositories/
│           │  ├─ routes/
│           │  └─ services/
│           ├─ node_modules/
│           ├─ .env
│           ├─ .gitignore
│           ├─ app.js
│           ├─ index.js
│           ├─ package.json
│           └─ package-lock.json
│
└─ ...
```

## ⚙️ Instalación y Uso

 ### 1) Clonar el repositorio
```bash
git clone https://github.com/ErwinG90/CAPSTONE_PROJECT.git
cd CAPSTONE_PROJECT
```

###  🔧 Backend

```bash
cd "Fase 2/Evidencias Proyecto/Evidencias de sistema Aplicacion/Backend API REST"
npm install
``` 
Crea un archivo **`Backend API REST/.env`** con tus variables de entorno.
```bash
# MongoDB Atlas
MONGO_USER=YOUR_MONGO_USER
MONGO_PASSWORD=YOUR_MONGO_PASSWORD
MONGO_HOST=YOUR_MONGO_HOST       
MONGO_DB=YOUR_MONGO_DATABASE  
```
 
Iniciar la aplicación
```bash
npm start
```


### 🔧 FrontEnd
```bash
cd "Fase 2/Evidencias Proyecto/Evidencias de sistema Aplicacion/App movil RutaFit"
npm install
```
Crea un archivo **`App movil RutaFit/.env`** con tus variables de entorno.
```bash
# Firebase 
EXPO_PUBLIC_FB_API_KEY=YOUR_FIREBASE_API_KEY
EXPO_PUBLIC_FB_AUTH_DOMAIN=YOUR_FIREBASE_AUTH_DOMAIN
EXPO_PUBLIC_FB_PROJECT_ID=YOUR_FIREBASE_PROJECT_ID
EXPO_PUBLIC_FB_STORAGE_BUCKET=YOUR_FIREBASE_STORAGE_BUCKET
EXPO_PUBLIC_FB_MESSAGING_SENDER_ID=YOUR_FIREBASE_SENDER_ID
EXPO_PUBLIC_FB_APP_ID=YOUR_FIREBASE_APP_ID

# Google Maps 
EXPO_PUBLIC_GOOGLE_MAPS_KEY=YOUR_GOOGLE_MAPS_API_KEY 
```
Iniciar la aplicación
```bash
npx expo start -c
```

## 🤝 Contribuidores

Gracias a todas las personas que han colaborado en el desarrollo de **RutaFit** 💚

<a href="https://github.com/ErwinG90/CAPSTONE_PROJECT/graphs/contributors">
  <img src="https://contrib.rocks/image?repo=ErwinG90/CAPSTONE_PROJECT" alt="Contribuidores" />
</a>

### 👩‍💻 Equipo de desarrollo principal

| Nombre | Rol | Contacto | GitHub |
|:--------|:----|:----------|:--------|
| 🧭 **Bárbara Riffo** | Product Owner  | bar.riffo@duocuc.cl | [@BarbaraNicoleR](https://github.com/BarbaraNicoleR) |
| ⚙️ **Erwin González** | Backend Developer | erw.gonzalez@duocuc.cl | [@ErwinG90](https://github.com/ErwinG90) |
| 🎨 **Cindy Beyer Ulloa** | Frontend Developer | ci.beyer@duocuc.cl | [@merluu](https://github.com/merluu) |


