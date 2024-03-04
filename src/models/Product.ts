import mongoose, { Document, Model, Schema, Types } from 'mongoose'

export interface IProduct {
  retailer_product_id: string;
  retailer_product_url?: string;
  retailer_name: string;
  name: string;
  img_url: string;
  tags: string[];
  barcode?: string;
  create_date: Date;
}

export interface IProductDocument extends IProduct, Document {
  toJSONData(): IProduct & { id: Types.ObjectId };
}

export interface IProductModel extends Model<IProductDocument> {}

const schema: Schema<IProductDocument> = new Schema({
  retailer_product_id: { // We will set this to a sha256 hash of the product name if the retailer does not provide an ID
    type: String,
    required: true,
    index: true,
  },
  retailer_product_url: {
    type: String,
    required: false,
  },
  retailer_name: {
    type: String,
    required: true,
    index: true,
  },
  name: {
    type: String,
    required: true,
    index: true,
  },
  img_url: {
    type: String,
    required: false
  },
  tags: {
    type: [String],
    required: true
  },
  barcode: {
    type: String,
    required: false,
    index: true,
  },
  create_date: {
    type: Date,
    default: Date.now,
  }
})

schema.methods.toJSONData = function (): IProduct & { id: Types.ObjectId } {
  const { retailer_product_id, retailer_product_url, retailer_name, name, barcode, img_url, tags, create_date, _id: id } = this.toObject() as IProductDocument & { _id: Types.ObjectId };
  return { retailer_product_id, retailer_product_url, retailer_name, id, name, barcode, img_url, tags, create_date };
}

const Product = mongoose.model<IProductDocument, IProductModel>('Product', schema)

export default Product;
