# Spirit Agency — site vitrine

Page unique pour Spirit Agency, le studio de Celya Rabhi, consultante développeuse à Montréal.

Page statique, sans build. Le parcours est une scène WebGL (three.js r128, via CDN) qui se
déroule au défilement ; sans WebGL ou avec `prefers-reduced-motion`, la page se replie
automatiquement sur une version empilée classique.

## Structure

```
index.html          contenu et structure
assets/style.css    styles (mode page + mode « journey »)
assets/main.js      scène three.js, défilement, HUD
assets/logo.png     cheval seul, fond transparent (barre du site)
assets/favicon-*.png  icône de l'onglet et de l'écran d'accueil
assets/og.jpg       image d'aperçu pour les partages
```

## Marque

Les fichiers sources du logo (PDF et PNG haute définition : logo principal, icône,
version horizontale) sont hors dépôt, dans `~/Documents/build/`. Les fichiers
d'`assets/` en sont dérivés — le cheval de la barre a été détouré depuis la version
sur fond clair, puis rempli du dégradé de la marque.

## Développement local

```bash
python3 -m http.server 8000
# puis http://localhost:8000
```

Ouvrir `index.html` directement en `file://` fonctionne aussi, mais le serveur local
reproduit fidèlement les conditions de production.

## Mise en ligne

GitHub Pages, branche `main`, dossier racine. Chaque push met le site à jour.
