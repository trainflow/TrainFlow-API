import {
  ClassSerializerInterceptor,
  ConflictException,
  Injectable,
  UseInterceptors,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as argon2 from 'argon2';
import { DeepPartial, Repository } from 'typeorm';
import { User } from './user.entity';

export type UserWithoutPassword = Omit<User, 'password'>;

@Injectable()
@UseInterceptors(ClassSerializerInterceptor)
export class UsersService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  async delete(id: number) {
    return this.userRepository.delete({ id });
  }
  async findOneById(id: number): Promise<User | null> {
    return this.userRepository.findOneBy({ id });
  }
  async findOneByUsername(username: string): Promise<User | null> {
    return this.userRepository.findOneBy({ username });
  }

  async create(
    user: Omit<DeepPartial<User>, 'password'>,
    plainTextPassword: string,
  ): Promise<User> {
    const encryptedPassword = await argon2.hash(plainTextPassword, {
      memoryCost: 19456,
      timeCost: 2,
      parallelism: 1,
      type: argon2.argon2id,
    });
    const entity = new User({ ...user, password: encryptedPassword });
    await this.userRepository.insert(entity);
    return entity;
  }

  private async setActive(userId: number, active: boolean) {
    const existingData = await this.userRepository.findOneByOrFail({
      id: userId,
    });

    if (existingData.isActive === active) {
      throw new ConflictException(`User has already isActive = ${active}`);
    }
    return this.userRepository.update({ id: userId }, { isActive: active });
  }

  async activate(userId: number) {
    await this.setActive(userId, true);
  }

  async deactivate(userId: number) {
    await this.setActive(userId, false);
  }
}
