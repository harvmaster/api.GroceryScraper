import mongoose, { Document, Model, Schema, Types, InferSchemaType, HydratedDocument } from 'mongoose'

type SchemaInput = InferSchemaType<typeof schema>
type SchemaProps = InferSchemaType<typeof schema> & { id: string, create_date: Date }

type SchemaMethods = {
  toJSONData(): ProductProps
}
type SchemaStatics = {
  // createProduct(product: SchemaProps): Promise<SchemaDocument<SchemaMethods>>
}

type SchemaDocument<T> = Document<Types.ObjectId, T, SchemaProps>
type SchemaModel = Model<SchemaProps, {}, SchemaMethods> & SchemaStatics

const schema = new Schema({
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
    required: false,
    default: Date.now,
  }
})

schema.methods.toJSONData = function (): ProductProps {
  const { 
    retailer_product_id, 
    retailer_product_url, 
    retailer_name, 
    name, 
    barcode, 
    img_url, 
    tags, 
    create_date, 
    id
  } = this.toObject() as SchemaProps;

  return { retailer_product_id, retailer_product_url, retailer_name, id, name, barcode, img_url, tags, create_date };
}

const Product = mongoose.model<SchemaProps, SchemaModel>('Product', schema)

export type ProductInput = SchemaInput
export type ProductProps = SchemaProps
export type ProductMethods = SchemaMethods
export type ProductStatics = SchemaStatics
export type ProductDocument = HydratedDocument<SchemaProps, SchemaMethods>

export default Product;
