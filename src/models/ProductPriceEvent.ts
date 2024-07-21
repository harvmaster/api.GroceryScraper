import mongoose, { Document, Model, Schema, Types, InferSchemaType, HydratedDocument } from 'mongoose'

type SchemaInput = InferSchemaType<typeof schema>
type SchemaProps = InferSchemaType<typeof schema> & { id: string, create_date: Date }

type SchemaMethods = {
  toJSONData(): PriceEventProps
}
type SchemaStatics = {
  // createPriceEvent(product: SchemaProps): Promise<SchemaDocument<SchemaMethods>>
}

type SchemaDocument<T> = Document<Types.ObjectId, T, SchemaProps>
type SchemaModel = Model<SchemaProps, {}, SchemaMethods> & SchemaStatics

const schema = new Schema({
  product: {
    type : Schema.Types.ObjectId,
    ref: 'Product',
    index: true,
  },
  price: {
    type: Number,
    required: true,
  },
  was_price: {
    type: Number,
    required: true
  },
  create_date: {
    type: Date,
    default: Date.now,
    required: false
  }
})

schema.methods.toJSONData = function (): PriceEventProps {
  const { 
    product,
    price,
    was_price,
    create_date, 
    id
  } = this.toObject() as SchemaProps;

  return { id, product, price, was_price, create_date };
}

const PriceEvent = mongoose.model<SchemaProps, SchemaModel>('PriceEvent', schema)

export type PriceEventInput = SchemaInput
export type PriceEventProps = SchemaProps
export type PriceEventMethods = SchemaMethods
export type PriceEventStatics = SchemaStatics
export type PriceEventDocument = HydratedDocument<SchemaProps, SchemaMethods>

export default PriceEvent;