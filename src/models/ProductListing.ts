import mongoose, { Document, Model, Schema, Types } from 'mongoose'

export interface IProductListing {
  product_id: Schema.Types.ObjectId;
  supplier: string;
  supplier_product_id: string;
  img_url: string;
  create_date: Date;
}

interface IProductListingDocument extends IProductListing, Document {
  toJSON(): IProductListing & { id: Types.ObjectId };
}

interface IProductListingModel extends Model<IProductListingDocument> {}

const schema: Schema<IProductListingDocument> = new Schema({
  product_id: {
    type: Schema.Types.ObjectId,
    ref: 'Product',
  },
  supplier: {
    type: String,
    required: true,
    index: true,
  },
  supplier_product_id: {
    type: String,
    required: true,
    index: true,
  },
  img_url: {
    type: String,
    required: false
  },
  create_date: {
    type: Date,
    default: Date.now,
  }
})

schema.methods.toJSON = function (): IProductListing & { id: Types.ObjectId } {
  const { product_id, supplier, supplier_product_id, img_url, create_date, _id: id } = this.toObject() as IProductListingDocument & { _id: Types.ObjectId };
  return { id, product_id, supplier, supplier_product_id, img_url, create_date };
}

const ProductListing = mongoose.model<IProductListingDocument, IProductListingModel>('ProductListing', schema)

export default ProductListing;
