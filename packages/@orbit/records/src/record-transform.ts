import { RecordOperation, RecordOperationResult } from './record-operation';
import { Record } from './record';
import { Transform, TransformOrOperations } from '@orbit/data';
import { RecordTransformBuilder } from './record-transform-builder';

export interface RecordTransform extends Transform<RecordOperation> {
  operations: RecordOperation[];
}

export type RecordTransformOrOperations = TransformOrOperations<
  RecordOperation,
  RecordTransformBuilder
>;

export type RecordTransformResult<T = Record> =
  | RecordOperationResult<T>
  | RecordOperationResult<T>[];
