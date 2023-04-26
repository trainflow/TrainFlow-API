import { DataSource, QueryRunner } from 'typeorm';

export const withTransaction = async <T>(
  dataSource: DataSource,
  callback: (queryRunner: QueryRunner) => Promise<T>,
): Promise<T> => {
  let result: T;
  const queryRunner = dataSource.createQueryRunner();

  await queryRunner.connect();
  await queryRunner.startTransaction();
  try {
    result = await callback(queryRunner);
    await queryRunner.commitTransaction();
  } catch (err) {
    // since we have errors lets rollback the changes we made
    await queryRunner.rollbackTransaction();
    throw err;
  } finally {
    // you need to release a queryRunner which was manually instantiated
    await queryRunner.release();
  }
  return result;
};
