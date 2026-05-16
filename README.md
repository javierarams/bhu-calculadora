# Simulador Préstamo Hipotecario BHU

Calculadora interactiva para el préstamo "Podés Comprar" del Banco Hipotecario del Uruguay.

**[→ Ver calculadora en vivo](https://TU_USUARIO.github.io/bhu-calculadora/)**

## Qué calcula

- Préstamo máximo según tasación BHU (80%)
- Cuota mensual desglosada: préstamo + FPI + seguro de vida
- Proyección año a año con inflación
- Costo total del apartamento al terminar de pagar
- Costos del trámite BHU

## Deploy local

```bash
npm install
npm run dev
```

## Deploy en GitHub Pages

El deploy es automático al hacer push a `main` via GitHub Actions.

**Antes de publicar**, editá `vite.config.js` y cambiá `base` al nombre exacto de tu repositorio:

```js
base: "/nombre-de-tu-repo/",
```

### Pasos para publicar por primera vez

1. Creá un repo en GitHub (ej: `bhu-calculadora`)
2. Actualizá `base` en `vite.config.js` con el nombre del repo
3. Subí el código:
   ```bash
   git init
   git add .
   git commit -m "initial commit"
   git branch -M main
   git remote add origin https://github.com/TU_USUARIO/bhu-calculadora.git
   git push -u origin main
   ```
4. En GitHub → Settings → Pages → Source: **GitHub Actions**
5. El workflow se ejecuta automáticamente y en ~1 minuto la calculadora está online

## Tecnologías

- React 19 + Vite
- Sin dependencias externas de UI
- GitHub Actions para CI/CD
