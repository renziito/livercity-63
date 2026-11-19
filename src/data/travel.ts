import { geoToWorld } from './geography';

export type TravelDestination = {
  id: string;
  label: string;
  subtitle: string;
  category: string;
  lat: number;
  lon: number;
  radius: number;
  color: string;
};

export const LIVERPOOL_TRAVEL_DESTINATIONS: TravelDestination[] = [
  { id: 'pier-head', label: 'The Port', subtitle: 'Pier Head · Waterfront', category: 'WATERFRONT', lat: 53.40590, lon: -2.99550, radius: 165, color: '#79a8b0' },
  { id: 'strawberry-field', label: 'Strawberry Field', subtitle: 'Beaconsfield Road · Woolton', category: 'JOHN LENNON', lat: 53.38007, lon: -2.88537, radius: 145, color: '#b66a57' },
  { id: 'penny-lane', label: 'Penny Lane', subtitle: 'Mossley Hill · South Liverpool', category: 'BEATLES SONG', lat: 53.38694, lon: -2.91944, radius: 175, color: '#c19a60' },
  { id: 'cavern', label: 'Matthew Street', subtitle: 'Cavern Quarter · City Centre', category: 'BEATLES HISTORY', lat: 53.40627, lon: -2.98790, radius: 135, color: '#b66a57' },
  { id: 'ringo-home', label: 'Ringo’s Street', subtitle: '9 Madryn Street · Toxteth', category: 'RINGO STARR', lat: 53.38872, lon: -2.95966, radius: 115, color: '#8da18e' },
  { id: 'george-home', label: 'George’s Oval', subtitle: '12 Arnold Grove · Wavertree', category: 'GEORGE HARRISON', lat: 53.39897, lon: -2.916643, radius: 225, color: '#b98c65' },
  { id: 'john-home', label: 'Mendips', subtitle: '251 Menlove Avenue · Woolton', category: 'JOHN LENNON', lat: 53.377262, lon: -2.881363, radius: 125, color: '#a9a184' },
  { id: 'paul-home', label: 'Forthlin Road', subtitle: '20 Forthlin Road · Allerton', category: 'PAUL McCARTNEY', lat: 53.369715, lon: -2.897915, radius: 125, color: '#b98c65' }
];

export function travelDestinationWorld(destination: TravelDestination) {
  return geoToWorld({ lat: destination.lat, lon: destination.lon });
}
