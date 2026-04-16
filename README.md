<div align="center">
  
  <div style="background: linear-gradient(135deg, #4f46e5 0%, #0ea5e9 100%); padding: 10px; border-radius: 20px; display: inline-block; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);">
     <h1 style="color: white; margin: 0; padding: 0 10px;">⚡ OpenZap</h1>
  </div>

  <h3>Plateforme SaaS Professionnelle de Gestion & Marketing WhatsApp</h3>

  <p>
    <strong>Sécurisé • Hautes Performances • Anti-Ban Intelligent</strong>
  </p>

  <!-- Badges -->
  <p>
    <img src="https://img.shields.io/badge/Laravel-FF2D20?style=for-the-badge&logo=laravel&logoColor=white" alt="Laravel" />
    <img src="https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB" alt="React" />
    <img src="https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white" alt="PostgreSQL" />
    <img src="https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white" alt="Docker" />
    <img src="https://img.shields.io/badge/Propri%C3%A9taire-Code_Ferm%C3%A9-red?style=for-the-badge" alt="Licence Propriétaire" />
  </p>

</div>

---

## 📖 À propos d'OpenZap

**OpenZap** est une architecture SaaS complète conçue pour l'envoi de campagnes WhatsApp à massive échelle. Développée avec une approche axée sur la **performance** (traitement en arrière-plan Redis/Jobs) et la **sécurité** (protection anti-bannissement), la plateforme permet aux entreprises d'orchestrer leurs communications WhatsApp de manière industrielle.

---

## 🚀 Fonctionnalités Clés

*   📲 **Instances Indépendantes** : Connexion ultra-rapide aux numéros via "Pairing Code" sans QR permanent.
*   🤖 **Le Gardien (Technologie Anti-Ban)** : Algorithmes qui simulent le comportement humain, utilisent le Spintax (variations de texte) et respectent les fenêtres d'envoi.
*   📊 **Tableau de Bord Premium** : Une interface utilisateur "Dark Mode", analytique et réactive, inspirée par Meta Business Suite.
*   ☁️ **Hébergement S3 / MinIO** : Stockage externe pour l'envoi de médias lourds (images, vidéos, PDF) sur WhatsApp.
*   🔗 **Import Intelligent** : Importation de contacts en masse via liaisons directes Google Sheets, CSV ou API HTTP.

---

## 🛠️ Stack Technique

OpenZap repose sur des technologies de pointe capables d'encaisser de lourdes charges de travail synchrones et asynchrones :

| Partie | Technologie | Description |
|---|---|---|
| **Frontend** | React 19, TypeScript, TailwindCSS 4, Vite 8 | UI moderne avec design system premium, responsive et glassmorphism. |
| **Backend** | Laravel 12, PHP 8.4 | API robuste, gestion des queues via des Jobs en arrière-plan. |
| **Base de données** | PostgreSQL 16 | Indexations composites orientées performance. |
| **Cache & Queues** | Redis 7 | Traitement rapide des centaines de milliers de messages. |
| **WhatsApp Engine**| Evolution API | Pont de communication ultra-réactif avec les fermes de téléphones. |
| **Stockage** | MinIO (Object Storage) | Compatible S3 pour une fiabilité à toute épreuve. |

---

## 🐳 Démarrage Rapide (Déploiement Docker)

Le hub OpenZap tourne intégralement sous **Docker Compose** pour éviter toute friction de configuration matérielle.

**1. Clonage & Variables d'environnement**
```bash
# Adaptez le fichier .env selon vos besoins.
cp .env.example .env
```

**2. Démarrage de l'infrastructure globale**
```bash
docker compose up -d --build
```
*Le système va exécuter PostgreSQL, Redis, MinIO, Evolution API, le backend Laravel et le frontend Vite en synergie.*

**3. Initialisation de la plateforme**
```bash
docker compose exec app composer install --optimize-autoloader
docker compose exec app php artisan key:generate
docker compose exec app php artisan migrate:fresh --seed
```

**🌐 Accès à l'écosystème :**
*   **Web App (React)** : `http://localhost:3506`
*   **API (Laravel)** : `http://localhost:3500`
*   **Stockage S3 (MinIO)** : `http://localhost:3504`

---

## 🛡️ Sécurité & Contribution

La plateforme possède des hooks stricts de sécurité empêchant toute faille de données sensibles.
Veuillez vous référer à notre fichier **[SECURITY.md](SECURITY.md)** pour le détail de l'architecture sécuritaire (Husky, Rate Limiting, CodeQL) et la ligne de conduite de signalement.

---

## ⚖️ Licence et Droits d'Utilisation

> **Attention** : Ceci est un logiciel propriétaire à usage exclusif.

Bien que le code soit visible (Source-Available) dans le cadre d'un portfolio technique, **OpenZap est protégé par des droits d'auteur stricts**. 

Il est **strictement interdit** de copier, cloner, distribuer, modifier ou vendre (en totalité ou en partie) ce code sans l'autorisation écrite formelle de Michel Ayena. Toute tentative d'utilisation commerciale autonome à partir de ces sources constitue une violation de la propriété intellectuelle.

**© 2026 Michel Ayena. Tous droits réservés.**
