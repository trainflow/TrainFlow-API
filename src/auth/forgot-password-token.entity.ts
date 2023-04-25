import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { User } from '../users/user.entity';

@Entity()
export class ForgotPasswordToken {
  constructor(data: Partial<ForgotPasswordToken>) {
    Object.assign(this, data);
  }

  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  token: string;

  @Column()
  userId: number;

  @Column()
  expiry: Date;

  @ManyToOne(() => User)
  @JoinColumn()
  user: User;
}
