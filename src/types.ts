export type ItemGender = "male" | "female" | "unisex";

export interface Item {
  title: string;
  price: number | null;
  image_url: string;
  product_url: string;
  source: "myntra" | "nykaa" | "manish_malhotra";
  gender: ItemGender;
}
