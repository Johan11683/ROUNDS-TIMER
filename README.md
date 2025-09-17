# 🥊 Rounds Timer

Un **round timer de boxe** développé avec **React + Vite + Sass**, et déployé sur **GitHub Pages**.  
Ce projet m’a permis de créer un outil fonctionnel pour mes entraînements tout en expérimentant **Cursor**, **Jest** et **Playwright**.

👉 [Voir le projet en ligne](https://johan11683.github.io/ROUNDS-TIMER/)

---

## 🚀 Fonctionnalités

- Paramétrage basique du **nombre de rounds**, de la **durée** et du **repos**
- Paramétrage avancé **custom settings** sur une page dédiée pour créer ses rounds d'entraînement personnalisés
- Affichage d’un **compte à rebours clair**
- Cercle de progression animé
- Contrôles : **Start / Pause / Next / Reset-rounds / Reset-custom settings**
- Mode **Fullscreen** avec interface épurée
- Design sobre et lisible
- Déploiement via `gh-pages`

---

## 🛠️ Stack utilisée

- **React**, **Vite**, **Sass**
- **Cursor + ChatGPT-5** comme copilotes de développement
- **Jest** (tests unitaires) & **Playwright** (tests end-to-end)

---

## 📖 Contexte

- Projet réalisé pour un **besoin personnel** (mes entraînements de boxe).  
- Objectif : sortir rapidement une app fonctionnelle, testée et déployée.  
- J’ai utilisé l’IA pour générer l’ossature, produire des snippets ciblés et écrire les tests.  
- Mon rôle a été de **spécifier clairement**, assembler les morceaux, corriger, tester et livrer.  
- Résultat : une app **fonctionnelle**, **testée** et **en production**.

---

## ✅ Tests

- **Unitaires (Jest)** : vérification du hook `useRoundTimer` (start/pause, reset, skip…).  
- **End-to-end (Playwright)** : simulation des clics sur **Play/Pause/Reset** et vérification visuelle.  



<img width="375" height="194" alt="image" src="https://github.com/user-attachments/assets/7fb75baa-8ecc-46db-af29-e37e8f88f324" />

<img width="944" height="600" alt="image" src="https://github.com/user-attachments/assets/2fd39c64-5d0e-43ae-8e3d-99fb9a73c1cc" />


---

## ⚡ Lancement en local

Cloner le repo :

```bash
git clone https://github.com/Johan11683/ROUNDS-TIMER.git
cd ROUNDS-TIMER
npm install
npm run dev
npm run build
npm run deploy
