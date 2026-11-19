/**
 * Editable project/story variables.
 * Fictionalized names for people, groups and song titles are kept here; real locations stay real.
 */
export const gameVariables = {
  game: { title: 'LiverCity', subtitle: 'LA HISTORIA DETRÁS DE LA MÚSICA', tagline: 'Cuatro vidas. Una revolución musical. Vive la historia desde adentro.' },
  chapters: [
    { id:'early-days', title:'LOS PRIMEROS AÑOS', years:'1956–1962', description:'Antes de que el mundo conociera su nombre.', levels:[
      {id:'john-early',characterId:'john',title:'LOS AÑOS DE LOS QUARRYMEN',years:'1956–1957'},
      {id:'paul-early',characterId:'paul',title:'EL NUEVO DEL GRUPO',years:'1957–1958'},
      {id:'george-early',characterId:'george',title:'EL GUITARRISTA MÁS JOVEN',years:'1958–1960'},
      {id:'ringo-early',characterId:'ringo',title:'LA ÚLTIMA PIEZA',years:'1960–1962'}]},
    { id:'the-beatles', title:'¡LA BEATLEMANÍA!', years:'1962–1966', description:'Discos, multitudes y un mundo que cambió de la noche a la mañana.', levels:[
      {id:'john-fame',characterId:'john',title:'LA VOZ',years:'1962–1966'},
      {id:'paul-fame',characterId:'paul',title:'LA MELODÍA',years:'1962–1966'},
      {id:'george-fame',characterId:'george',title:'LA GUITARRA PRINCIPAL',years:'1962–1966'},
      {id:'ringo-fame',characterId:'ringo',title:'EL RITMO',years:'1962–1966'}]},
    { id:'no-more-concerts', title:'¡SE APAGAN LOS ESCENARIOS!', years:'1966–1967', description:'Los escenarios quedan en silencio. El estudio se convierte en su mundo.', levels:[
      {id:'john-studio',characterId:'john',title:'MÁS ALLÁ DEL ESCENARIO',years:'1966–1967'},
      {id:'paul-studio',characterId:'paul',title:'EL ESTUDIO',years:'1966–1967'},
      {id:'george-studio',characterId:'george',title:'HACIA ADENTRO Y MÁS ALLÁ',years:'1966–1967'},
      {id:'ringo-studio',characterId:'ringo',title:'OTRO RITMO',years:'1966–1967'}]},
    { id:'and-in-the-end', title:'Y AL FINAL...', years:'1967–1970', description:'Las últimas grabaciones, amistades que cambian y cuatro caminos nuevos.', levels:[
      {id:'john-end',characterId:'john',title:'UN NUEVO RUMBO',years:'1967–1970'},
      {id:'paul-end',characterId:'paul',title:'LOS ÚLTIMOS DÍAS',years:'1967–1970'},
      {id:'george-end',characterId:'george',title:'TODO PASA',years:'1967–1970'},
      {id:'ringo-end',characterId:'ringo',title:'EL ÚLTIMO CAPÍTULO',years:'1967–1970'}]}
  ],
  characters: {
    john:{id:'john',displayName:'Jack Lenner',shortName:'JACK',role:'Cantante, guitarrista rítmico y compositor',description:'Ingenioso, inquieto y con una imaginación enorme.',color:'#b87945'},
    paul:{id:'paul',displayName:'Paul McKarton',shortName:'PAUL',role:'Cantante, bajista y compositor',description:'Melódico, ambicioso y siempre creativo.',color:'#6d8a72'},
    george:{id:'george',displayName:'Georgie Harrow',shortName:'GEORGIE',role:'Guitarrista principal y compositor',description:'Reflexivo, curioso y decidido.',color:'#8a789c'},
    ringo:{id:'ringo',displayName:'Ricky Starrin',shortName:'RICKY',role:'Baterista y músico de escenario',description:'Cálido, bromista y con facilidad para conectar con la gente.',color:'#63849a'}
  },
  groups:{earlySkiffle:'The Quarry Boys',hamburgBand:'The Beat Brothers',mainBand:'The Silver Beats',fictionalRecordLabel:'Northstar Records'},
  supportingCharacters:{
    manager:{displayName:'Bernard Epston',role:'Representante musical'},
    producer:{displayName:'George Marlow',role:'Productor musical'},
    earlyDrummer:{displayName:'Peter West',role:'Baterista antes de que se uniera Ricky'},
    earlyBassist:{displayName:'Stuart Suttler',role:'Integrante inicial del grupo y artista'},
    photographer:{displayName:'Astrid Kirsch',role:'Fotógrafa y artista'}
  },
  songs:{
    loveMeDo:{id:'love-me-do',displayTitle:'Hold Me Close',era:'1962'},
    pleasePleaseMe:{id:'please-please-me',displayTitle:'Ask Me Again',era:'1963'},
    fromMeToYou:{id:'from-me-to-you',displayTitle:'A Note from Me',era:'1963'},
    sheLovesYou:{id:'she-loves-you',displayTitle:'You Know She Cares',era:'1963'},
    iWantToHoldYourHand:{id:'i-want-to-hold-your-hand',displayTitle:'Take My Hand Tonight',era:'1963'},
    aHardDaysNight:{id:'a-hard-days-night',displayTitle:'One Long Working Night',era:'1964'},
    help:{id:'help',displayTitle:'I Need a Hand',era:'1965'},
    yesterday:{id:'yesterday',displayTitle:'The Day Before',era:'1965'},
    norwegianWood:{id:'norwegian-wood',displayTitle:'A Room of Cedar',era:'1965'},
    tomorrowNeverKnows:{id:'tomorrow-never-knows',displayTitle:'The Future Is Unknown',era:'1966'},
    strawberryFieldsForever:{id:'strawberry-fields-forever',displayTitle:'The Gardens of Memory',era:'1967'},
    pennyLane:{id:'penny-lane',displayTitle:'The Corner by the Clock',era:'1967'},
    allYouNeedIsLove:{id:'all-you-need-is-love',displayTitle:'Love Is All We Need',era:'1967'},
    heyJude:{id:'hey-jude',displayTitle:'Hey, Jules',era:'1968'},
    whileMyGuitarGentlyWeeps:{id:'while-my-guitar-gently-weeps',displayTitle:'As My Guitar Cries',era:'1968'},
    comeTogether:{id:'come-together',displayTitle:'Gather Around',era:'1969'},
    hereComesTheSun:{id:'here-comes-the-sun',displayTitle:'The Morning Returns',era:'1969'},
    letItBe:{id:'let-it-be',displayTitle:'Let Things Be',era:'1970'}
  },
  places:{
    liverpool:{id:'liverpool',displayName:'LiverCity',realWorldReference:'Liverpool, England'},
    woolton:{id:'woolton',displayName:'Woolton',cityId:'liverpool'},
    stPetersChurch:{id:'st-peters-church',displayName:"St Peter's Church",cityId:'liverpool'},
    pennyLane:{id:'penny-lane-place',displayName:'Penny Lane',cityId:'liverpool'},
    cavernClub:{id:'cavern-club',displayName:'The Cavern Club',cityId:'liverpool'},
    casbahCoffeeClub:{id:'casbah-coffee-club',displayName:'Casbah Coffee Club',cityId:'liverpool'},
    hamburg:{id:'hamburg',displayName:'Hamburg',country:'Germany'},
    indraClub:{id:'indra-club',displayName:'Indra Club',cityId:'hamburg'},
    starClub:{id:'star-club',displayName:'Star-Club',cityId:'hamburg'},
    recordShop:{id:'record-shop',displayName:'Needle & Groove',cityId:'liverpool'},
    london:{id:'london',displayName:'London',country:'England'},
    abbeyRoadStudios:{id:'abbey-road-studios',displayName:'Abbey Road Studios',cityId:'london'},
    savileRow:{id:'savile-row',displayName:'Savile Row',cityId:'london'},
    sheaStadium:{id:'shea-stadium',displayName:'Shea Stadium',cityId:'new-york'},
    newYork:{id:'new-york',displayName:'New York',country:'United States'},
    india:{id:'india',displayName:'India',country:'India'}
  },
  missionTemplates: [
    { suffix:'meet', title:'EL PRIMER ENCUENTRO', objective:'Consigue el instrumento que necesitan para su próxima presentación.', targetId:'recordshop', date:'1957-07-06', reward:10 },
    { suffix:'venue', title:'BUSCA EL SIGUIENTE ESCENARIO', objective:'Visita un local histórico de música y descubre su historia.', targetId:'cavern', date:'1957-1959', reward:15 },
    { suffix:'streets', title:'LAS CALLES TIENEN MEMORIA', objective:'Recorre una calle emblemática y conversa con alguien del barrio.', targetId:'penny-lane', date:'1957-1960', reward:15 },
    { suffix:'friends', title:'UN NUEVO AMIGO', objective:'Encuentra a otro músico y escucha su versión de la historia.', targetId:'casbah', date:'1958-1960', reward:20 },
    { suffix:'performance', title:'LISTOS PARA EL PRÓXIMO SHOW', objective:'Regresa al punto de encuentro y prepárate para la presentación.', targetId:'st-peters', date:'1960-1962', reward:25 }
  ],
  openingMission:{
    id:'first-encounter',title:'UNA NUEVA CARA EN WOOLTON',
    description:'Encuentra a Jack cerca de la fiesta de la iglesia y empieza la historia.',
    characterId:'john',placeId:'st-peters-church',historicalDate:'1957-07-06',
    objectiveLabel:'ENCUENTRA A JACK',rewardCash:0,rewardReputation:0,
    dialogue:[
      '¡Llegaste! Tenemos una presentación pronto, pero se nos ha presentado un problema.',
      'Nuestro guitarrista necesita otro instrumento. ¿Nos das una mano para conseguirlo antes del show?',
      'Regresa cuando tengas novedades. ¡Bienvenido a LiverCity!'
    ]
  }
} as const;
export type CharacterId = keyof typeof gameVariables.characters;
export type ChapterId = (typeof gameVariables.chapters)[number]['id'];
