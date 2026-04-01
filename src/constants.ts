import { MenuItem } from './types';

export const MENU_ITEMS: MenuItem[] = [
  // Fish
  { id: 'fish-reg-chips', name: 'Regular Fish and Chips', price: 12.70, category: 'Fish' },
  { id: 'fish-large-chips', name: 'Large Fish and Chips', price: 14.50, category: 'Fish' },
  { id: 'fish-reg', name: 'Regular Fish', price: 9.00, category: 'Fish' },
  { id: 'fish-large', name: 'Large Fish', price: 10.50, category: 'Fish' },
  
  // Chips
  { id: 'chips-med', name: 'Medium Chips', price: 3.95, category: 'Chips' },
  { id: 'chips-large', name: 'Large Chips', price: 4.95, category: 'Chips' },
  { id: 'chip-butty', name: 'Chip Butty', price: 4.95, category: 'Chips' },
  
  // Drinks
  { id: 'drink-coke', name: 'Coke', price: 1.70, category: 'Drinks' },
  { id: 'drink-sprite', name: 'Sprite', price: 1.70, category: 'Drinks' },
  { id: 'drink-fanta', name: 'Fanta', price: 1.70, category: 'Drinks' },
];

export const GOOGLE_SHEET_URL = 'https://script.google.com/macros/s/AKfycbzLmV1ww5peCyj8Mltp0gfV_7PS5c8wVWxXRPsgaOAxbayzjRZ7MaKrRK57k2fe04YUmg/exec';
