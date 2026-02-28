export type Product = {
	id: string;
	name: string;
	description: string;
	price: number;
	image: string;
	stock: number;
};

export type CartItem = Product & { qty: number };

export type SnapCheckoutResponse = {
	snap_token: string;
	order_no: string;
};
