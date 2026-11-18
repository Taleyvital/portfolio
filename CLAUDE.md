# Portfolio « le parcours »

Portfolio d'un candidat en alternance Architecte SI (DIIAGE Dijon). **Vision du propriétaire (2026-11-14) : un parcours extérieur 3D plein écran, parcouru au défilement par un avatar low-poly.** Le chemin part d'une clairière d'accueil, traverse une place où chaque projet est un panneau, passe sous l'arche de l'À propos et finit sur la borne de contact ; les lucioles et les arbres donnent la profondeur. L'avatar marche quand on défile, s'arrête quand on s'arrête. Elle remplace la pièce 3D (2026-10-31), elle-même venue après la ville sur carte mère (2026-10-30) et la carte mère néon. Sous cette expérience, le site reste un **site HTML rapide et complet** (« Mode classique »), servi aux mobiles, aux robots et à qui le choisit.

La référence complète (sources, budgets, plan par phases) est dans [docs/rapport.md](docs/rapport.md). En cas de doute, c'est elle qui tranche.

## Principe non négociable : le HTML d'abord, la 3D en option

- Tout le contenu existe en HTML rendu côté serveur : titres, textes, liens, métadonnées. Le `<canvas>` ne fait qu'enrichir les pages ; il ne contient jamais d'information absente du DOM.
- Le site doit être entièrement utilisable **sans WebGL et sans JavaScript 3D**. Il faut toujours une version statique de repli.
- Sans aucune interaction, l'accueil affiche le nom, « Alternance Architecte SI · DIIAGE Dijon », le rythme, la date de début et les accès au CV PDF, à LinkedIn, à GitHub et au contact.
- La navigation passe **par le menu, avec de vrais liens `<a href>`**, et on n'utilise pas d'URL à fragment `#` pour les routes. **Exception voulue par le propriétaire** : à l'accueil en mode 3D, la molette, le doigt et le clavier pilotent la visite au lieu de faire défiler la page. Le menu, les points d'étape et les liens du HUD restent des accès directs : on n'est jamais obligé de « marcher » pour atteindre une information.
- Les objets sont en 3D, **le texte reste en HTML**, dans des panneaux à fond opaque ou flouté (contraste ≥ 4,5:1).

## Stack (versions fixées, sans `^` ni `~` pour la 3D)

- **Next.js App Router, TypeScript, pages SSG** : chaque route est générée au build (`generateStaticParams` ; un slug inconnu appelle `notFound()`). Pas de rendu dynamique ni de données à la requête. `cacheComponents` est activé : ne pas utiliser `dynamicParams`, incompatible.
- **3D** : React Three Fiber **9**, `@react-three/drei` et `three` **r18x** (r185 ou r186), versions exactes. Rendu avec **WebGLRenderer** uniquement.
  - Pas de WebGPU ni de R3F v10 (alpha) : drei `Text`, `Environment` avec enfants et `@react-three/postprocessing` n'y fonctionnent pas, et le parc Android visé (Tecno, Itel, Infinix) reste en WebGL2.
  - r186 a supprimé `PCFSoftShadowMap` et les builds minifiés : ne pas les utiliser.
  - Shaders personnalisés en TSL si besoin (compatible WebGL depuis r184).
- **Caméra** : troisième personne, pilotée à la main dans `useFrame` ([WalkCamera](components/scene/WalkCamera.tsx)), amortie, sans orbite libre. GSAP est installé mais n'est pas utilisé par la scène. Pas de Theatre.js.
- **Contenu** : MDX dans `content/`. Chaque projet est un fichier `content/projets/<slug>.mdx` qui exporte `meta`, déclaré dans [lib/projets.ts](lib/projets.ts).
- **Assets 3D** : Blender low-poly → lumière bakée → GLB → `gltf-transform` (Meshopt + KTX2) → `gltfjsx --types`. Hébergement prévu sur Cloudflare R2.
- Pas de Spline ni de Babylon.

## Couche 3D (implémentée)

- Versions installées : `three@0.186.1`, `@react-three/fiber@9.8.2`, `@react-three/drei@10.7.9`, `gsap@3.15.0`. Chunk 3D mesuré : ~248 Ko gzip. Depuis drei : `PerformanceMonitor` seulement. **Ne pas utiliser drei `Html`** : chaque instance crée une racine React glissée dans le div du canvas, ce qui faisait planter la navigation (`removeChild`) et recharger la page.
- **Deux vues en mode 3D**, pilotées par `html[data-scene][data-view]` :
  - `map` (accueil) : le parcours plein écran + HUD HTML rendu côté serveur ([components/scene/RoomHud.tsx](components/scene/RoomHud.tsx)) : une section par étape de la visite (`.tour-step`, intro avec H1, disponibilité et CV/contact/LinkedIn/GitHub ; projets ; à propos ; contact) et des points d'étape ([TourRail](components/scene/TourRail.tsx)). Seule l'étape courante (`html[data-station]`) est visible ; les autres sont `inert`. Sans attribut, c'est l'intro. `main` est masqué.
  - `panel` (toutes les autres routes) : le contenu de la page s'ouvre dans un panneau défilant à gauche (défilement natif), par-dessus le parcours, avec « Retour au parcours » ; **Échap** ramène à `/`.
- **Démarrage sans flash** : [lib/scene-boot.ts](lib/scene-boot.ts) est un script inline dans `<head>` qui pose `data-scene` et `data-view` avant le premier affichage. Même logique que `initSceneMode()` dans [lib/scene-mode.ts](lib/scene-mode.ts) : les garder synchronisées. Sans JavaScript, aucun attribut n'est posé → mode classique.
- [components/scene/SceneRoot.tsx](components/scene/SceneRoot.tsx) est monté une seule fois dans le layout : canvas persistant, chargé avec `next/dynamic` après `load` (+ inactivité, 800 ms max). Il capte aussi le défilement de la visite (`useCapturedScroll` : molette, tactile, flèches/Page/Espace/Début/Fin ; calage sur l'étape la plus proche), seulement à l'accueil en mode 3D.
- Le mode (`3d` / `light`) : 3D automatique sur desktop capable, mode classique sur mobile (pointeur tactile ou < 64rem), en mouvement réduit, en économie de données ou sans WebGL2. Le choix de l'utilisateur est mémorisé, le repli automatique vaut pour la session. `?scene=3d|light` force le mode ; `?debug` affiche draw calls, triangles et fps et **désactive le repli automatique** (avertissement en console).
- **Visite** : le chemin ([path.ts](lib/three/path.ts), Catmull-Rom en x/z) et les étapes — positions de l'avatar, cadrages, panneaux et ancres de page — sont dans [lib/three/world.ts](lib/three/world.ts) ; l'état du défilement (`tour.target` / `tour.value`, étape publiée sur `html[data-station]`) dans [lib/scroll-tour.ts](lib/scroll-tour.ts). Le [TourDriver](components/scene/TourDriver.tsx) avance l'avatar sur le chemin (position, tangente, distance parcourue) et le publie dans [walk.ts](lib/three/walk.ts) ; [Walker](components/scene/Walker.tsx) et [WalkCamera](components/scene/WalkCamera.tsx) le lisent dans le même ordre. **La caméra suit l'URL** : à l'accueil, elle interpole entre les cadrages d'étape ; sur une autre route, elle rejoint l'ancre de l'objet, fait face au panneau et décale le cadrage (`setViewOffset`, constante `PANEL` synchronisée avec `globals.css`). Mouvement amorti (~1 s), instantané en `prefers-reduced-motion`.
- **Le décor** ([World.tsx](components/scene/World.tsx), [geometry.ts](components/scene/geometry.ts)) : sol, chemin, arbres, bancs, place et arche en primitives peintes par sommet, fusionnées en deux draw calls (`solid`, `glow`) ; seuls les panneaux de projet, l'arche et la borne sont des plans texturés en canvas (contenu repris en HTML). Titres et résultats sont dupliqués des `meta` MDX dans `world.ts` : les garder synchronisés. Contour lumineux autour de l'objet survolé ou de la page ouverte. Zones de clic invisibles ([Hotspots.tsx](components/scene/Hotspots.tsx)) : un glisser de plus de 6 px n'ouvre rien.
- **L'avatar** est généré en code (aucun GLB) : primitives peintes par sommet, ~1,5 m, orientation sur la tangente, balancement des bras et foulée calés sur `walk.distance` ; sa taille suit la mise sous tension (`power`). Une ombre douce au sol ([Walker](components/scene/Walker.tsx)) suffit : pas d'ombre dynamique par personnage.
- **Atmosphère** : [Ambient](components/scene/Ambient.tsx) sème 90 lucioles le long du chemin en un seul `InstancedMesh`, face caméra.
- **Lumière** : hémisphère lavande + soleil chaud de biais (2 lumières), brume `fog` de 30 à 100 m. Ombres **statiques** (PCF 2048, `autoUpdate: false`, une passe après `compileAsync`), désactivées sur pointeur tactile. Mesuré : 23 à 29 draw calls, ~8 k triangles (14,6 k avec la passe d'ombre).
- Animations dans `useFrame` calées sur l'horloge réelle, jamais sur un nombre d'images (elles doivent finir à l'heure sur un téléphone lent).
- Tester le rendu en headless sur macOS : le rendu logiciel tourne à 1–2 fps et les captures peuvent bloquer. Piloter Chrome par CDP avec `--disable-gpu-vsync --disable-frame-rate-limit --use-angle=swiftshader --enable-unsafe-swiftshader`. En `?debug`, le canvas garde son image (`preserveDrawingBuffer`) et se lit avec `toDataURL` ; attendre `power === 1` (environ 1,4 s de rampe) avant de juger une capture.

## Langues

- **Français par défaut**, servi à la racine sans préfixe (`/`, `/projets/[slug]`, `/a-propos`, `/contact`), avec `<html lang="fr">`.
- **Anglais dans un second temps**, sous `/en/...`. Ne pas le construire tant que la version FR n'est pas en ligne. Les textes d'interface sont dans [lib/site.ts](lib/site.ts) pour faciliter cette étape.

## Budgets de performance

| Poste | Budget |
|---|---|
| HTML + CSS + JS critique (avant 3D) | < 200 Ko, contenu lisible sans 3D |
| JS 3D (three + R3F + drei) | ~150–250 Ko gzip, chargé **après** l'événement `load` |
| Première scène (GLB + KTX2) | **3 Mo maximum** (viser 1,5 Mo) ; les autres quartiers se chargent à la demande |
| Total de l'expérience 3D | **5 Mo maximum** |
| Par image | < 100 draw calls, < 100 k sommets, ≤ 3 lumières (idéalement baked + 1) |
| Textures | ≤ 2048 px, en KTX2, en atlas. Jamais de PNG 4K |
| DPR | `min(devicePixelRatio, 2)`, abaissé dynamiquement |
| Core Web Vitals | LCP ≤ 2,5 s, INP < 200 ms, CLS < 0,1 |
| Lighthouse mobile | ≥ 90 |

Le matériel de référence est un Tecno ou un Infinix milieu de gamme en 4G encombrée (2 à 5 Mbps). Tester avec la 4G bridée dans les DevTools.

## Règles de performance 3D

- Charger le canvas avec `next/dynamic` et `ssr: false`, après `load`. Un **canvas unique et persistant** pour tout le site.
- Le H1 HTML est l'élément LCP : **jamais d'écran de chargement plein écran**. Le chargement se signale en petit dans un coin, avec un bouton « Passer ».
- La barre de chargement n'atteint 100 % qu'après la première image rendue (`compileAsync` avant le fondu).
- Objets répétés (arbres, poteaux, lucioles) en **InstancedMesh**, ou fusionnés avec le décor quand ils sont immobiles.
- Décor extérieur : peinture par sommet plutôt que textures ; matériaux émissifs pour les accents plutôt que des lumières supplémentaires.
- **Pas d'ombres en temps réel sur mobile**, pas de simulation de fluides, pas d'empilement de post-traitements.
- `frameloop="demand"` quand la caméra est à l'arrêt.
- Qualité adaptative : drei `PerformanceMonitor` (DPR de 0,5 à 2, mesure coupée en pause). **Ne pas utiliser son `onFallback`** : son compteur `flipflops` compte aussi les hausses, une machine fluide basculait en mode classique au bout d'environ 10 s. On bascule en mode statique seulement sur un `onDecline` alors que le DPR est déjà à 0,5.
- Entrée directe en mode classique si `prefers-reduced-motion`, si `navigator.connection.saveData` est actif ou si WebGL est absent.
- Un bouton « Explorer en 3D / Version légère » reste toujours visible, et le choix est mémorisé.
- Assets servis en Brotli, avec `Cache-Control: max-age=31536000, immutable` et les bons types MIME (`model/gltf-binary`, `image/ktx2`).

## Accessibilité et mouvement

- Lien d'évitement, focus visibles, touche Échap pour fermer, cibles tactiles d'au moins 44 × 44 px.
- Déplacements de caméra en **moins de 1 à 2 s**, sans roulis, prévisibles ; la caméra s'arrête quand l'utilisateur s'arrête. Aucun élément ne doit apparaître pendant un mouvement.
- Mouvement non essentiel désactivable (WCAG 2.3.3) ; pas de dérive automatique de caméra au repos (WCAG 2.2.2).
- Scroll natif partout, **sauf la visite de l'accueil en mode 3D** (choix du propriétaire) : elle doit rester pilotable au clavier et par les points d'étape, et le panneau de contenu garde son défilement natif.
- `@react-three/a11y` uniquement si des objets 3D sont cliquables.

## SEO et partage

- `generateMetadata` et un `opengraph-image.tsx` par page, rendus côté serveur (les partages WhatsApp et Facebook ignorent les balises injectées en JS).
- `sitemap.ts`, `robots.ts`, JSON-LD `Person` (accueil) et `CreativeWork` (projets).
- `NEXT_PUBLIC_SITE_URL` définit le domaine utilisé par `metadataBase`, le sitemap et le JSON-LD.

## Contenu

- Études de cas dans cet ordre : problème → rôle → contraintes → décisions argumentées → résultat → ce que je referais. On parle de **décisions, pas de fonctionnalités**.
- Écrire « je », jamais « nous ». Pas de barres de compétences, pas de clones de tutoriels.
- Un schéma C4 (niveaux 1 et 2) et une courte ADR par projet.
- Ne pas présenter Webey comme une agence immatriculée.
- Les contenus de démonstration sont marqués **[DÉMO]** : les chercher avant toute mise en ligne.
- Les informations à vérifier sont dans des commentaires MDX invisibles `{/* [À CONFIRMER] … */}`, `[À METTRE À JOUR]` ou `[À FOURNIR]` : `grep -rn "\[À " content/` avant toute mise en ligne. Ne jamais publier un lien non confirmé.
- Structure d'un projet : Problème → Mon rôle → Contraintes → Décisions techniques → Résultats → Liens → Ce que je referais autrement.

## À éviter

Une 3D obligatoire pour accéder au contenu, un loader plein écran, une marche obligatoire jusqu'au contact (le contact reste dans le menu et l'intro), une modale qui ne se ferme que par un seul bouton, le cliché du « bureau rétro » à la Heffernan (le parcours extérieur actuel est voulu par le propriétaire), des ombres temps réel sur mobile, des textures PNG 4K, une base R3F v10 alpha ou WebGPU seul.

## Commandes

- `npm run dev` : serveur de développement
- `npm run build` : build de production (vérifier que toutes les routes sont statiques, ○ ou ●)
- `npm run lint` : ESLint
