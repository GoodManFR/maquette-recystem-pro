# Maquette de refonte — Recy'stem-Pro (conformité REP, mandataire européen)

Maquette de prospection. **Ce n'est pas le site de Recy'stem-Pro** : c'est une proposition
de refonte, non sollicitée, produite à partir d'un audit public de leur site.

- Site statique, sans dépendance : HTML, CSS et JavaScript sans framework ni build.
- Chaque page porte un bandeau qui la désigne comme maquette.
- Toutes les pages sont en `noindex, nofollow` : une maquette ne doit jamais
  concurrencer le site réel dans les résultats de recherche.
- Les formulaires ne sont pas reliés et le disent.

Déploiement : rien à construire. Vercel sert la racine telle quelle
(`vercel.json` active `cleanUrls` et les en-têtes).

---
Audit du 21 septembre 2026.
