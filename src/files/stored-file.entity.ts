import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity()
export class StoredFile {
  constructor(partial: Partial<StoredFile>) {
    Object.assign(this, partial);
  }

  @PrimaryColumn()
  name: string;

  @Column()
  uploadedAt: Date;
}
