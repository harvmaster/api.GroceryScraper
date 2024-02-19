import mongoose, { Document, Model, Schema, Types } from 'mongoose'

export interface IProduct {
  name: string;
  img_url: string;
  tags: string[];
  description: string;
  create_date: Date;
}

interface IProductDocument extends IProduct, Document {
  toJSON(): IProduct & { id: Types.ObjectId };
}

interface IProductModel extends Model<IProductDocument> {}

const schema: Schema<IProductDocument> = new Schema({
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
  description: {
    type: String,
    required: true
  },  
  create_date: {
    type: Date,
    default: Date.now,
  }
})

schema.methods.toJSON = function (): IProduct & { id: Types.ObjectId } {
  const { name, img_url, tags, description, create_date, _id: id } = this.toObject() as IProductDocument & { _id: Types.ObjectId };
  return { id, name, img_url, tags, description, create_date };
}

const Product = mongoose.model<IProductDocument, IProductModel>('Product', schema)

export default Product;
