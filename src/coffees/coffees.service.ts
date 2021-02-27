import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import { Connection, Model } from 'mongoose';
import { Event } from 'src/events/entities/event.entity';
import { CreateCoffeeDto } from './dto/create-coffee.dto';
import { UpdateCoffeeDto } from './dto/update-coffee.dto';
import { Coffee } from './entities/coffee.entity';
import { Flavor } from './entities/flavor.entity';

@Injectable()
export class CoffeesService {
  constructor(
    @InjectModel(Coffee.name)
    private readonly coffeeModel: Model<Coffee>,
    @InjectModel(Flavor.name)
    private readonly flavorModel: Model<Flavor>,
    @InjectConnection() private readonly connection: Connection,
    @InjectModel(Event.name)
    private readonly eventModel: Model<Event>,
  ) {}

  findAll(paginationQuery) {
    const { offset, limit } = paginationQuery;
    return this.coffeeModel.find().skip(offset).limit(limit).exec();
  }
  async findOne(id: string) {
    const coffee = await this.coffeeModel.findOne({ _id: id }).exec();
    if (!coffee) {
      throw new NotFoundException(`Coffee #${id} not found`);
    }
    return coffee;
  }

  async create(createCofferDto: CreateCoffeeDto) {
    const coffee = new this.coffeeModel(createCofferDto);
    return coffee.save();
  }
  async update(id: string, updateCoffee: any) {
    const existingCoffee = await this.coffeeModel
      .findOneAndUpdate({ _id: id }, { $set: updateCoffee }, { new: true })
      .exec();
    if (!existingCoffee) {
      throw new NotFoundException(`Coffee #${id} not found`);
    }
    return existingCoffee;
  }
  async remove(id: string) {
    const coffee = await this.findOne(id);
    coffee.remove();
  }

  async recommendCoffee(coffee: Coffee) {
    const session = await this.connection.startSession();
    session.startTransaction();
    try {
      coffee.recommendations++;
      const recommendEvent = new this.eventModel({
        name: 'recommend_coffee',
        type: 'coffee',
        payload: { coffeeId: coffee.id },
      });
      await recommendEvent.save({ session });
      await coffee.save({ session });

      await session.commitTransaction();
    } catch (error) {
      await session.abortTransaction();
    } finally {
      session.endSession();
    }
  }
}
