import { geoToWorld } from './geography';

export type CuratedPhoto = {
  src: string;
  caption: string;
  credit: string;
};

export type LocationInfo = {
  id: string;
  name: string;
  shortName: string;
  address: string;
  lat: number;
  lon: number;
  description: string;
  historicalNote: string;
  prompt: string;
  color: string;
  streetViewHeading: number;
  streetViewPitch: number;
  gallery: CuratedPhoto[];
  world: { x: number; z: number };
  website?: string;
};

const rawLocations = [
  {
    id: 'cavern', name: 'The Cavern Club', shortName: 'CAVERN',
    address: '10 Mathew Street, Liverpool L2 6RE, Reino Unido',
    lat: 53.40627, lon: -2.98790,
    description: 'Un sótano convertido en uno de los escenarios más importantes de la historia del rock. Aquí The Beatles tocaron cientos de veces entre 1961 y 1963.',
    historicalNote: 'El local actual ocupa el mismo emplazamiento del club original. El edificio fue reconstruido después de que el Cavern original fuera demolido en los años setenta.',
    prompt: 'EXPLORAR', color: '#9b5948', streetViewHeading: 35, streetViewPitch: 0,
    website: 'https://www.cavernclub.com/',
    gallery: []
  },
  {
    id: 'jacaranda', name: 'The Jacaranda', shortName: 'JACARANDA',
    address: '21–23 Slater Street, Liverpool L1 4BW, Reino Unido',
    lat: 53.40243, lon: -2.97958,
    description: 'Café y local musical donde los jóvenes Beatles ensayaron y pintaron murales en el sótano.',
    historicalNote: 'Allan Williams abrió el local en 1958. Su sótano forma parte de los primeros capítulos de la escena musical de Liverpool.',
    prompt: 'EXPLORAR', color: '#98744f', streetViewHeading: 150, streetViewPitch: 0,
    website: 'https://www.jacarandarecords.com/thejacclub/',
    gallery: []
  },
  {
    id: 'pier-head', name: 'Pier Head y la estatua de The Beatles', shortName: 'PIER HEAD',
    address: 'Pier Head, Liverpool Waterfront, Reino Unido',
    lat: 53.40590, lon: -2.99550,
    description: 'El paseo marítimo junto al río Mersey, con la conocida escultura de los cuatro músicos.',
    historicalNote: 'El waterfront recuerda la relación de Liverpool con el puerto y con las rutas que conectaron la ciudad con el mundo.',
    prompt: 'CONOCER', color: '#b6a58a', streetViewHeading: 210, streetViewPitch: 0,
    gallery: []
  },
  {
    id: 'albert-dock', name: 'Royal Albert Dock', shortName: 'ALBERT DOCK',
    address: 'Royal Albert Dock, Liverpool L3 4AD, Reino Unido',
    lat: 53.39950, lon: -2.99150,
    description: 'Complejo histórico de muelles, almacenes de ladrillo y espacios culturales junto al Mersey.',
    historicalNote: 'El conjunto abrió en 1846 y hoy es uno de los espacios patrimoniales más reconocibles de Liverpool.',
    prompt: 'EXPLORAR', color: '#9b6b52', streetViewHeading: 25, streetViewPitch: 0,
    gallery: []
  },
  {
    id: 'beatles-story', name: 'The Beatles Story', shortName: 'BEATLES STORY',
    address: 'Britannia Vaults, Royal Albert Dock, Liverpool L3 4AD, Reino Unido',
    lat: 53.39920, lon: -2.99110,
    description: 'Museo dedicado a la historia del grupo, desde sus inicios en Liverpool hasta su impacto mundial.',
    historicalNote: 'Su exposición reúne objetos, recreaciones y relatos sobre distintas etapas de la trayectoria de The Beatles.',
    prompt: 'EXPLORAR', color: '#7d8c84', streetViewHeading: 80, streetViewPitch: 0,
    website: 'https://www.beatlesstory.com/',
    gallery: []
  },
  {
    id: 'recordshop', name: 'Needle & Groove', shortName: 'TIENDA',
    address: 'Liverpool City Centre, Liverpool, Reino Unido',
    lat: 53.40420, lon: -2.98200,
    description: 'Una tienda ficticia de discos creada para la aventura. Aquí empieza la búsqueda de instrumentos y música.',
    historicalNote: 'Este punto pertenece al mundo narrativo de LiverCity; no representa un comercio histórico real.',
    prompt: 'EXPLORAR', color: '#71877d', streetViewHeading: 90, streetViewPitch: 0,
    gallery: []
  },
  {
    id: 'penny-lane', name: 'Penny Lane', shortName: 'PENNY LANE',
    address: 'Penny Lane, Mossley Hill, Liverpool L18, Reino Unido',
    lat: 53.38694, lon: -2.91944,
    description: 'Una calle del sur de Liverpool que quedó inmortalizada en la canción publicada en 1967.',
    historicalNote: 'La letra recoge comercios, personajes y escenas cotidianas del barrio. No es un museo: es una calle viva de la ciudad.',
    prompt: 'EXPLORAR', color: '#b58a60', streetViewHeading: 100, streetViewPitch: 0,
    gallery: []
  },
  {
    id: 'st-peters', name: "St Peter's Church, Woolton", shortName: 'ST PETER’S',
    address: 'Church Road, Woolton, Liverpool L25 5JF, Reino Unido',
    lat: 53.37597, lon: -2.86948,
    description: 'La iglesia de Woolton donde John Lennon y Paul McCartney se conocieron durante la fiesta parroquial del 6 de julio de 1957.',
    historicalNote: 'Este lugar es el punto de partida de la historia de LiverCity. La fecha del encuentro está documentada.',
    prompt: 'EXPLORAR', color: '#9a9b89', streetViewHeading: 20, streetViewPitch: 0,
    website: 'https://www.stpeters-woolton.org.uk/',
    gallery: []
  },
  {
    id: 'strawberry-field', name: 'Strawberry Field', shortName: 'STRAWBERRY FIELD',
    address: 'Beaconsfield Road, Woolton, Liverpool, Reino Unido',
    lat: 53.38007, lon: -2.88537,
    description: 'El antiguo hogar infantil de The Salvation Army, cerca de la casa donde creció John Lennon.',
    historicalNote: 'El lugar inspiró la canción Strawberry Fields Forever. Hoy cuenta con exposición y espacios para visitantes.',
    prompt: 'EXPLORAR', color: '#a65b4b', streetViewHeading: 40, streetViewPitch: 0,
    website: 'https://www.strawberryfieldliverpool.com/',
    gallery: []
  },
  {
    id: 'mendips', name: 'Mendips · Casa de John Lennon', shortName: 'MENDIPS',
    address: '251 Menlove Avenue, Liverpool L25 7SA, Reino Unido',
    lat: 53.377262, lon: -2.881363,
    description: 'La casa de la infancia de John Lennon, donde vivió con su tía Mimi y su tío George.',
    historicalNote: 'La vivienda está protegida y es administrada por National Trust. Las visitas interiores requieren reserva y disponibilidad.',
    prompt: 'EXPLORAR', color: '#c0aa86', streetViewHeading: 180, streetViewPitch: 0,
    website: 'https://www.nationaltrust.org.uk/visit/liverpool-lancashire/beatles-childhood-homes',
    gallery: []
  },
  {
    id: 'forthlin-road', name: '20 Forthlin Road · Casa de Paul McCartney', shortName: 'FORTHLIN ROAD',
    address: '20 Forthlin Road, Liverpool L18 9TN, Reino Unido',
    lat: 53.369715, lon: -2.897915,
    description: 'La casa donde creció Paul McCartney y donde el grupo ensayó durante sus primeros años.',
    historicalNote: 'La vivienda forma parte de las visitas de National Trust junto con Mendips. El acceso interior es mediante visita reservada.',
    prompt: 'EXPLORAR', color: '#b88c67', streetViewHeading: 180, streetViewPitch: 0,
    website: 'https://www.nationaltrust.org.uk/visit/liverpool-lancashire/beatles-childhood-homes',
    gallery: []
  },
  {
    id: 'casbah', name: 'Casbah Coffee Club', shortName: 'CASBAH',
    address: "8 Hayman's Green, West Derby, Liverpool L12 7JG, Reino Unido",
    lat: 53.432425, lon: -2.911977,
    description: 'El club que Mona Best abrió en el sótano de su casa. The Quarrymen tocaron la noche de su inauguración.',
    historicalNote: 'El Casbah abrió en 1959 y conserva espacios y elementos de su historia musical. El acceso se realiza mediante visitas concertadas.',
    prompt: 'EXPLORAR', color: '#947a65', streetViewHeading: 210, streetViewPitch: 0,
    gallery: []
  }
] as const;

export const LIVERPOOL_LOCATIONS: LocationInfo[] = rawLocations.map((location) => ({
  ...location,
  world: geoToWorld({ lat: location.lat, lon: location.lon })
}));
