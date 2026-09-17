# Celyra — site vitrine

Page unique pour Celyra, le studio de Celya Rabhi, consultante développeuse à Montréal.

Page statique, sans build. Le parcours est une scène WebGL (three.js r128, via CDN) qui se
déroule au défilement ; sans WebGL ou avec `prefers-reduced-motion`, la page se replie
automatiquement sur une version empilée classique.

## Structure

```
index.html          contenu et structure
assets/style.css    styles (mode page + mode « journey »)
assets/main.js      scène three.js, défilement, HUD
```

## Développement local

```bash
python3 -m http.server 8000
# puis http://localhost:8000
```

Ouvrir `index.html` directement en `file://` fonctionne aussi, mais le serveur local
reproduit fidèlement les conditions de production.

## Mise en ligne

GitHub Pages, branche `main`, dossier racine. Chaque push met le site à jour.
