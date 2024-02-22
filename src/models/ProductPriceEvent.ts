import mongoose, { Document, Model, Schema, Types } from 'mongoose'

export interface IProductPriceEvent {
  product: Schema.Types.ObjectId;
  price: number;
  discounted_from: number;
  provider: string;
  create_date: Date;
}

interface IProductPriceEventDocument extends IProductPriceEvent, Document {
  toJSON(): IProductPriceEvent & { id: Types.ObjectId };
}

interface IProductPriceEventModel extends Model<IProductPriceEventDocument> {}

const schema: Schema<IProductPriceEventDocument> = new Schema({
  product: {
    type : Schema.Types.ObjectId,
    ref: 'Product',
    index: true,
  },
  price: {
    type: Number,
    required: true,
  },
  discounted_from: {
    type: Number,
    required: true
  },
  provider: {
    type: String,
    required: true
  },
  create_date: {
    type: Date,
    default: Date.now,
  }
})

schema.methods.toJSON = function (): IProductPriceEvent & { id: Types.ObjectId } {
  const { product, price, discounted_from, provider, create_date, _id: id } = this.toObject() as IProductPriceEventDocument & { _id: Types.ObjectId };
  return { id, product, price, discounted_from, provider, create_date };
}

const Product = mongoose.model<IProductPriceEventDocument, IProductPriceEventModel>('Product', schema)

export default Product;
