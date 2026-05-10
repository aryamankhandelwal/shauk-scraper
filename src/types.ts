export type ItemGender = "male" | "female" | "unisex";

export interface Item {
  title: string;
  price: number | null;
  image_url: string;
  product_url: string;
  source: string;
  gender?: ItemGender;
  garment_type?: string | null;
  color?: string | null;
  fabric?: string | null;
  embellishments?: string[];
  currency?: string;
  available_sizes?: string[];
}
