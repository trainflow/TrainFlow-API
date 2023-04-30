import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FoodDiaryEntry } from './food-diary-entry.entity.ts';
import { FoodDiaryService } from './food-diary.service';
import { Food } from './food.entity.js';

@Module({
  imports: [TypeOrmModule.forFeature([FoodDiaryEntry, Food])],
  providers: [FoodDiaryService],
})
export class FoodDiaryModule {}
