/**
 * Delivery charge calculation based on city tiers for Nepal.
 *
 * Tier 1 - Kathmandu Valley (Rs.100): Kathmandu, Lalitpur, Bhaktapur
 * Tier 2 - Major cities (Rs.150): Pokhara, Biratnagar, Birgunj, Dharan, Butwal, etc.
 * Tier 3 - Remote areas (Rs.200): Everything else
 */

const KATHMANDU_VALLEY_CHARGE = 100;
const MAJOR_CITY_CHARGE = 150;
const REMOTE_AREA_CHARGE = 200;

const kathmanduValleyCities: string[] = [
  'kathmandu',
  'lalitpur',
  'bhaktapur',
  'kirtipur',
  'madhyapur thimi',
  'bhaktapur',
];

const majorCities: string[] = [
  'pokhara',
  'biratnagar',
  'birgunj',
  'dharan',
  'butwal',
  'hetauda',
  'bharatpur',
  'nepalgunj',
  'dhangadhi',
  'janakpur',
  'itahari',
  'banepa',
  'tulsipur',
  'siddharthanagar',
  'ghorahi',
  'lahan',
  'rajbiraj',
  'damak',
  'nepalganj',
  'bandipur',
  'chitwan',
  'narayanghat',
  'tansen',
  'palpa',
  'gorkha',
  'lamjung',
  'tanahun',
  'syangja',
  'parbat',
  'baglung',
  'myagdi',
  'mustang',
  'manang',
  'chitwan',
  'makwanpur',
  'parsa',
  'bara',
  'rautahat',
  'sarlahi',
  'mahottari',
  'dhanusha',
  'sindhuli',
  'ramechhap',
  'dolakha',
  'sindhupalchok',
  'kavre',
  'nuwakot',
  'rasuwa',
  'dhading',
  'gorkha',
  'tanahu',
  'kaski',
  'syangja',
  'parbat',
  'baglung',
  'myagdi',
  'mustang',
  'manang',
  'lamjung',
  'gorkha',
];

export function calculateDeliveryCharge(city: string): number {
  const normalizedCity = city.trim().toLowerCase();

  if (kathmanduValleyCities.includes(normalizedCity)) {
    return KATHMANDU_VALLEY_CHARGE;
  }

  if (majorCities.includes(normalizedCity)) {
    return MAJOR_CITY_CHARGE;
  }

  return REMOTE_AREA_CHARGE;
}

export function getDeliveryChargeLabel(city: string): string {
  const charge = calculateDeliveryCharge(city);
  if (charge === KATHMANDU_VALLEY_CHARGE) return 'Kathmandu Valley';
  if (charge === MAJOR_CITY_CHARGE) return 'Major City';
  return 'Remote Area';
}
