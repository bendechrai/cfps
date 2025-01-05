import { Continent } from './types';

const countryToContinentMap: Record<string, Continent> = {
  // Europe
  'France': 'Europe',
  'Netherlands': 'Europe',
  'Luxembourg': 'Europe',
  'Spain': 'Europe',
  'Germany': 'Europe',
  'United Kingdom': 'Europe',
  'UK': 'Europe',
  'Scotland': 'Europe',
  'Italy': 'Europe',
  'Portugal': 'Europe',
  'Ireland': 'Europe',
  'Belgium': 'Europe',
  'Switzerland': 'Europe',
  'Austria': 'Europe',
  'Sweden': 'Europe',
  'Norway': 'Europe',
  'Denmark': 'Europe',
  'Finland': 'Europe',
  'Poland': 'Europe',
  'Czech Republic': 'Europe',
  'Hungary': 'Europe',
  'Greece': 'Europe',
  'Romania': 'Europe',
  'Bulgaria': 'Europe',
  'Croatia': 'Europe',
  'Slovenia': 'Europe',
  'Slovakia': 'Europe',
  'Latvia': 'Europe',
  'Macedonia': 'Europe',
  'Turkey': 'Europe',

  // North America
  'Canada': 'North America',
  'USA': 'North America',
  'United States': 'North America',
  'Mexico': 'North America',
  'Costa Rica': 'North America',
  'Dominican Republic': 'North America',

  // South America
  'Brazil': 'South America',
  'Argentina': 'South America',
  'Chile': 'South America',
  'Colombia': 'South America',
  'Peru': 'South America',
  'Uruguay': 'South America',
  'Venezuela': 'South America',

  // Asia
  'Japan': 'Asia',
  'China': 'Asia',
  'South Korea': 'Asia',
  'India': 'Asia',
  'Singapore': 'Asia',
  'Malaysia': 'Asia',
  'Indonesia': 'Asia',
  'Thailand': 'Asia',
  'Vietnam': 'Asia',
  'Philippines': 'Asia',
  'Taiwan': 'Asia',
  'Hong Kong': 'Asia',
  'Israel': 'Asia',
  'UAE': 'Asia',
  'United Arab Emirates': 'Asia',
  'Bangladesh': 'Asia',

  // Oceania
  'Australia': 'Oceania',
  'New Zealand': 'Oceania',

  // Africa
  'South Africa': 'Africa',
  'Egypt': 'Africa',
  'Morocco': 'Africa',
  'Kenya': 'Africa',
  'Nigeria': 'Africa',
  'Ghana': 'Africa',
  'Ethiopia': 'Africa',
  'Tanzania': 'Africa',
};

export const getContinent = (location: string): Continent => {
  if (location.toLowerCase().includes('online') || 
      location.toLowerCase().includes('virtual') || 
      location.toLowerCase().includes('remote')) {
    return 'Online';
  }
  
  // Extract country from location string (usually in format "City (Country)")
  const match = location.match(/\((.*?)\)/);
  if (!match) return 'Unknown';
  
  const country = match[1]
    .replace(' (USA)', 'USA')
    .replace(' (US)', 'USA')
    .replace(' (United States)', 'USA')
    .replace(' (UK)', 'UK');
  
  return countryToContinentMap[country] || 'Unknown';
};
