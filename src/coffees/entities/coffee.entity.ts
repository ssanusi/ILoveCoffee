import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { Flavor } from './flavor.entity';

@Schema()
export class Coffee extends Document {
  @Prop()
  name: string;

  @Prop()
  brand: string;

  @Prop({ default: 0 })
  recommendations: number;

  @Prop([Flavor])
  flavors: Flavor[];
}

export const CoffeeSchema = SchemaFactory.createForClass(Coffee);
