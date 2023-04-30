import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { User } from '../users/user.entity';
import { Food } from './food.entity';

@Entity()
export class FoodDiaryEntry {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  userId: number;

  @ManyToOne(() => User)
  user: User;

  @Column()
  foodId: number;

  @ManyToOne(() => Food)
  food: Food;

  @Column()
  added: Date;

  @Column()
  quantity: number;
}
