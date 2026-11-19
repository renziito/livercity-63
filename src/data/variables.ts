/**
 * Editable project/story variables.
 * Fictionalized names for people, groups and song titles are kept here; real locations stay real.
 */
export const gameVariables = {
  game: { title: 'LiverCity', subtitle: 'THE STORY BEHIND THE MUSIC', tagline: 'Four lives. One revolution. A story told from the inside.' },
  chapters: [
    { id:'early-days', title:'EARLY DAYS', years:'1956–1962', description:'Before the world knew their name.', levels:[
      {id:'john-early',characterId:'john',title:'THE QUARRYMEN YEARS',years:'1956–1957'},
      {id:'paul-early',characterId:'paul',title:'THE NEW KID',years:'1957–1958'},
      {id:'george-early',characterId:'george',title:'THE YOUNG GUITARIST',years:'1958–1960'},
      {id:'ringo-early',characterId:'ringo',title:'THE FINAL PIECE',years:'1960–1962'}]},
    { id:'the-beatles', title:'THE BEATLES!', years:'1962–1966', description:'The records, the crowds and the world changing overnight.', levels:[
      {id:'john-fame',characterId:'john',title:'THE VOICE',years:'1962–1966'},
      {id:'paul-fame',characterId:'paul',title:'THE MELODY',years:'1962–1966'},
      {id:'george-fame',characterId:'george',title:'THE LEAD GUITAR',years:'1962–1966'},
      {id:'ringo-fame',characterId:'ringo',title:'THE BEAT',years:'1962–1966'}]},
    { id:'no-more-concerts', title:'NO MORE CONCERTS!', years:'1966–1967', description:'The stage falls silent. The studio becomes the world.', levels:[
      {id:'john-studio',characterId:'john',title:'BEYOND THE STAGE',years:'1966–1967'},
      {id:'paul-studio',characterId:'paul',title:'THE STUDIO',years:'1966–1967'},
      {id:'george-studio',characterId:'george',title:'WITHIN AND BEYOND',years:'1966–1967'},
      {id:'ringo-studio',characterId:'ringo',title:'A DIFFERENT BEAT',years:'1966–1967'}]},
    { id:'and-in-the-end', title:'AND IN THE END...', years:'1967–1970', description:'The final recordings, changing friendships and four new paths.', levels:[
      {id:'john-end',characterId:'john',title:'A NEW DIRECTION',years:'1967–1970'},
      {id:'paul-end',characterId:'paul',title:'THE LAST DAYS',years:'1967–1970'},
      {id:'george-end',characterId:'george',title:'ALL THINGS MUST PASS',years:'1967–1970'},
      {id:'ringo-end',characterId:'ringo',title:'THE LAST CHAPTER',years:'1967–1970'}]}
  ],
  characters: {
    john:{id:'john',displayName:'Jack Lenner',shortName:'JACK',role:'Singer, rhythm guitarist and songwriter',description:'Sharp-witted, restless and fiercely imaginative.',color:'#b87945'},
    paul:{id:'paul',displayName:'Paul McKarton',shortName:'PAUL',role:'Singer, bassist and songwriter',description:'Melodic, ambitious and endlessly inventive.',color:'#6d8a72'},
    george:{id:'george',displayName:'Georgie Harrow',shortName:'GEORGIE',role:'Lead guitarist and songwriter',description:'Thoughtful, curious and quietly determined.',color:'#8a789c'},
    ringo:{id:'ringo',displayName:'Ricky Starrin',shortName:'RICKY',role:'Drummer and performer',description:'Warm, funny and a natural crowd-pleaser.',color:'#63849a'}
  },
  groups:{earlySkiffle:'The Quarry Boys',hamburgBand:'The Beat Brothers',mainBand:'The Silver Beats',fictionalRecordLabel:'Northstar Records'},
  supportingCharacters:{
    manager:{displayName:'Bernard Epston',role:'Music manager'},
    producer:{displayName:'George Marlow',role:'Record producer'},
    earlyDrummer:{displayName:'Peter West',role:'Drummer before Ricky joined'},
    earlyBassist:{displayName:'Stuart Suttler',role:'Early band member and artist'},
    photographer:{displayName:'Astrid Kirsch',role:'Photographer and artist'}
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
    { suffix:'meet', title:'A FIRST ENCOUNTER', objective:'Find the instrument needed for the next performance.', targetId:'recordshop', date:'1957-07-06', reward:10 },
    { suffix:'venue', title:'FIND THE NEXT STAGE', objective:'Visit a historic music venue and learn its story.', targetId:'cavern', date:'1957-1959', reward:15 },
    { suffix:'streets', title:'THE STREETS REMEMBER', objective:'Explore a landmark street and speak to a local.', targetId:'penny-lane', date:'1957-1960', reward:15 },
    { suffix:'friends', title:'A NEW FRIEND', objective:'Find another musician and hear their side of the story.', targetId:'casbah', date:'1958-1960', reward:20 },
    { suffix:'performance', title:'READY FOR THE NEXT SHOW', objective:'Return to the meeting point and prepare for the performance.', targetId:'st-peters', date:'1960-1962', reward:25 }
  ],
  openingMission:{
    id:'first-encounter',title:'A NEW FACE IN WOOLTON',
    description:'Find Jack near the church fête and begin the story.',
    characterId:'john',placeId:'st-peters-church',historicalDate:'1957-07-06',
    objectiveLabel:'FIND JACK',rewardCash:0,rewardReputation:0,
    dialogue:[
      'You made it. The group has a performance coming up, but there is a problem.',
      'Our guitarist needs a replacement instrument. Can you help us find one before the show?',
      'Meet me back here when you have news. Welcome to LiverCity.'
    ]
  }
} as const;
export type CharacterId = keyof typeof gameVariables.characters;
export type ChapterId = (typeof gameVariables.chapters)[number]['id'];
