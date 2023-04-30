import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class Food {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  barcode: string;
  @Column()
  name: string;

  @Column()
  kcalPer100g: number;

  @Column()
  carbsPer100g: number;

  @Column()
  sugarsPer100g: number;

  @Column()
  proteinsPer100g: number;

  @Column()
  fatsPer100g: number;

  @Column()
  saturatedFatsPer100g: number;

  @Column()
  saltPer100g: number;

  @Column()
  fibersPer100g: number;

  @Column()
  nutriscore: number;
}
