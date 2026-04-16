# Politique de Sécurité d'OpenZap 🛡️

La sécurité est une priorité absolue pour le projet OpenZap. Nous prenons très au sérieux la protection des données de nos utilisateurs, la fiabilité des instances WhatsApp et l'intégrité de la plateforme.

## Versions Supportées

Actuellement, seule la branche principale (`main`) reçoit des mises à jour de sécurité de manière active.

| Version | Supporté |
| :--- | :--- |
| `1.x.x` (Main) | ✅ Oui |
| `< 1.0.0` | ❌ Non |

---

## 🔒 Signalement d'une Vulnérabilité

**S'il vous plaît, ne signalez PAS de vulnérabilités critiques via des issues GitHub publiques.** 

Si vous pensez avoir trouvé une faille de sécurité dans OpenZap (par exemple : faille SSRF, exécution de code à distance, problème de rate limiting ou contournement d'authentification), merci de nous le signaler de manière privée :

1. **Email** : [Renseignez votre email ici]
2. **Contact Direct** : [Votre lien WhatsApp ou autre canal privé]

Nous vous répondrons sous **48 heures** pour accuser réception de votre rapport et discuter des prochaines étapes de mitigation.

---

## 🛡️ Architecture de Sécurité du Projet

Pour maintenir un haut standard de sécurité, OpenZap intègre plusieurs couches de protection :

### 1. Prévention des Secrets (En Local)
Nous utilisons **Husky** et **Secretlint** au niveau des hooks Git.
- **Principe** : Il est impossible de commiter localement des clés API (AWS, services externes) ou des mots de passe.
- **Exécution** : Le hook `.husky/pre-commit` analyse les fichiers avant chaque soumission.

### 2. Validation & Intégration Continue (GitHub)
- **CodeQL** : Une analyse statique automatique propulsée par l'intelligence artificielle de GitHub scrute chaque Pull Request et la branche `main` à la recherche de vulnérabilités (ex: XSS, Injections SQL).
- **Dependabot** : Notre configuration vérifie hebdomadairement l'obsolescence et les vulnérabilités de nos packages `npm`, dépendances `composer` et de l'environnement `docker`.

### 3. API & Backend (Laravel & Nginx)
- **Protection Anti-SSRF** : La lecture et l'import de dépendances externes (comme Google Sheets) sont rigoureusement validés et isolés.
- **Rate Limiting** : Les endpoints sensibles comme les webhooks de l'API Evolution et les routes de connexion (Login/Register) imposent des limites strictes pour déjouer le Bruteforce et les attaques DDOS.
- **Cache & Opti** : Les accès administration intensifs sont mis en cache.
- **Header Security** : Nginx et Laravel renforcent la sécurité des entêtes HTTP (Strict-Transport-Security, X-Frame-Options, X-XSS-Protection).

### 4. Instance WhatsApp ("Le Gardien")
Pour préserver vos numéros WhatsApp du bannissement :
- **Limites journalières** : Application stricte de plafonds d'envoi.
- **Fenêtres de tir sécurisées** : Verrouillage des envois hors "heures d'ouverture".
- **Spintax** : Algorithmes de génération de variations de texte empêchant la classification en Spam par Meta.

---

## Ce que nous ne stockons pas
Dans une logique de stricte sécurité :
- Les mots de passe utilisateurs sont hashés mathématiquement via Bcrypt (12 tours). 
- Nous ne lisons ni de stockons de manière permanente le contenu de vos messages WhatsApp reçus en dehors du contexte d'envoi ciblé, conformément à notre éthique de la vie privée.
