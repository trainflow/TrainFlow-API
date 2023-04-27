import {
  ClassSerializerInterceptor,
  ConflictException,
  Injectable,
  Logger,
  UseInterceptors,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as argon2 from 'argon2';
import { cpus } from 'os';
import { DeepPartial, Repository } from 'typeorm';
import { User } from './user.entity';

export type UserWithoutPassword = Omit<User, 'password'>;

@Injectable()
@UseInterceptors(ClassSerializerInterceptor)
export class UsersService {
  private readonly logger = new Logger(UsersService.name);
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  async delete(id: number) {
    return this.userRepository.delete({ id });
  }

  async update(user: Partial<UserWithoutPassword>) {
    return this.userRepository.save(user);
  }

  async findOneByEmail(email: string): Promise<User | null> {
    return this.userRepository.findOneBy({ email });
  }

  async findOneById(id: number): Promise<User | null> {
    return this.userRepository.findOneBy({ id });
  }

  async findOneByUsername(username: string): Promise<User | null> {
    return this.userRepository.findOneBy({ username });
  }

  async hashPassword(plainTextPassword: string): Promise<string> {
    return argon2.hash(plainTextPassword, {
      memoryCost: 65536,
      timeCost: 16,
      parallelism: cpus().length,
      type: argon2.argon2id,
    });
  }

  async create(
    user: Omit<DeepPartial<User>, 'password'>,
    plainTextPassword: string,
  ): Promise<User> {
    const encryptedPassword = await this.hashPassword(plainTextPassword);
    const entity = new User({ ...user, password: encryptedPassword });
    await this.userRepository.insert(entity);
    return entity;
  }

  async updatePassword(user: User, password: string) {
    const hashedPassword = await this.hashPassword(password);
    await this.userRepository.update(
      { id: user.id },
      { password: hashedPassword },
    );
    this.logger.verbose(`Updated password for user ${user.id}`);
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
