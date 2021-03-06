import {
  RecordKeyMap,
  Record,
  RecordSchema,
  RecordIdentity
} from '@orbit/records';

export interface RelatedRecordIdentity {
  record: RecordIdentity;
  relationship: string;
}

export interface RecordRelationshipIdentity {
  record: RecordIdentity;
  relationship: string;
  relatedRecord: RecordIdentity;
}

export interface BaseRecordAccessor {
  name?: string;
  keyMap?: RecordKeyMap;
  schema: RecordSchema;
}

export interface RecordChangeset {
  setRecords?: Record[];
  removeRecords?: RecordIdentity[];
  addInverseRelationships?: RecordRelationshipIdentity[];
  removeInverseRelationships?: RecordRelationshipIdentity[];
}

export interface SyncRecordAccessor extends BaseRecordAccessor {
  // Getters
  getRecordSync(recordIdentity: RecordIdentity): Record | undefined;
  getRecordsSync(typeOrIdentities?: string | RecordIdentity[]): Record[];
  getRelatedRecordSync(
    identity: RecordIdentity,
    relationship: string
  ): RecordIdentity | null | undefined;
  getRelatedRecordsSync(
    identity: RecordIdentity,
    relationship: string
  ): RecordIdentity[] | undefined;
  getInverseRelationshipsSync(
    recordIdentityOrIdentities: RecordIdentity | RecordIdentity[]
  ): RecordRelationshipIdentity[];

  // Setters
  setRecordSync(record: Record): void;
  setRecordsSync(records: Record[]): void;
  removeRecordSync(recordIdentity: RecordIdentity): Record | undefined;
  removeRecordsSync(recordIdentities: RecordIdentity[]): Record[];
  addInverseRelationshipsSync(
    relationships: RecordRelationshipIdentity[]
  ): void;
  removeInverseRelationshipsSync(
    relationships: RecordRelationshipIdentity[]
  ): void;
  applyRecordChangesetSync(changeset: RecordChangeset): void;
}

export interface AsyncRecordAccessor extends BaseRecordAccessor {
  // Getters
  getRecordAsync(recordIdentity: RecordIdentity): Promise<Record | undefined>;
  getRecordsAsync(
    typeOrIdentities?: string | RecordIdentity[]
  ): Promise<Record[]>;
  getRelatedRecordAsync(
    identity: RecordIdentity,
    relationship: string
  ): Promise<RecordIdentity | null | undefined>;
  getRelatedRecordsAsync(
    identity: RecordIdentity,
    relationship: string
  ): Promise<RecordIdentity[] | undefined>;
  getInverseRelationshipsAsync(
    recordIdentityOrIdentities: RecordIdentity | RecordIdentity[]
  ): Promise<RecordRelationshipIdentity[]>;

  // Setters
  setRecordAsync(record: Record): Promise<void>;
  setRecordsAsync(records: Record[]): Promise<void>;
  removeRecordAsync(
    recordIdentity: RecordIdentity
  ): Promise<Record | undefined>;
  removeRecordsAsync(recordIdentities: RecordIdentity[]): Promise<Record[]>;
  addInverseRelationshipsAsync(
    relationships: RecordRelationshipIdentity[]
  ): Promise<void>;
  removeInverseRelationshipsAsync(
    relationships: RecordRelationshipIdentity[]
  ): Promise<void>;
  applyRecordChangesetAsync(changeset: RecordChangeset): Promise<void>;
}
