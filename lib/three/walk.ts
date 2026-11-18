import { Vector3 } from "three";

// État de l'avatar publié par le pilote de la visite (TourDriver), lu dans la même image par
// l'avatar (Walker) et la caméra (WalkCamera). Aucun re-rendu React.

export const walk = {
  /** Position au sol (les pieds touchent y = 0). */
  position: new Vector3(0, 0, 10),
  /** Direction de la marche, sur le chemin. */
  tangent: new Vector3(0, 0, -1),
  /** Direction du regard (égale à la marche, ou vers l'objet ouvert). */
  facing: new Vector3(0, 0, -1),
  /** Distance parcourue sur la dernière image (m), pour le cycle de marche. */
  distance: 0,
  /** Vitesse estimée (m/s). */
  speed: 0,
  /** Vrai quand une page est ouverte : l'avatar est à l'arrêt. */
  resting: false,
};
