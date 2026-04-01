export interface MenuItem {
  id: string;
  name: string;
  price: number;
  category: 'Fish' | 'Chips' | 'Drinks';
}

export interface OrderItem extends MenuItem {
  quantity: number;
}

export interface Order {
  id: string;
  items: OrderItem[];
  total: number;
  status: 'pending' | 'paid';
}
