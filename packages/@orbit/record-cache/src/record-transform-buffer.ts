import { objectValues, Dict } from '@orbit/utils';
import {
  deserializeRecordIdentity,
  Record,
  RecordIdentity,
  serializeRecordIdentity
} from '@orbit/records';
import { RecordChangeset, RecordRelationshipIdentity } from './record-accessor';
import { SyncRecordCache, SyncRecordCacheSettings } from './sync-record-cache';

function serializeRecordRelationshipIdentity(
  rri: RecordRelationshipIdentity
): string {
  return `${serializeRecordIdentity(rri.record)}::${rri.relationship}`;
}

function deserializeRecordRelationshipIdentity(
  rri: string
): { record: RecordIdentity; relationship: string } {
  const [record, relationship] = rri.split('::');
  return { record: deserializeRecordIdentity(record), relationship };
}

export interface RecordTransformBufferState {
  records: Dict<Record | null>;
  inverseRelationships: Dict<Dict<RecordRelationshipIdentity | null>>;
}

export interface RecordTransformBufferClass {
  new (settings: SyncRecordCacheSettings): RecordTransformBuffer;
}

export class RecordTransformBuffer extends SyncRecordCache {
  protected _state!: RecordTransformBufferState;
  protected _delta?: RecordTransformBufferState;

  constructor(settings: SyncRecordCacheSettings) {
    super(settings);
    this.reset();
  }

  reset(
    state: RecordTransformBufferState = {
      records: {},
      inverseRelationships: {}
    }
  ): void {
    this._state = state;
  }

  startTrackingChanges(): void {
    this._delta = {
      records: {},
      inverseRelationships: {}
    };
  }

  stopTrackingChanges(): RecordChangeset {
    if (this._delta === undefined) {
      throw new Error(
        `Changes are not being tracked. Call 'startTrackingChanges' before 'stopTrackingChanges'`
      );
    }

    let { records, inverseRelationships } = this._delta;

    // console.log('buffer#stopTrackingChanges - delta', records, inverseRelationships);

    let changeset: RecordChangeset = {};

    for (let rid of Object.keys(records)) {
      let rv = records[rid];
      if (rv === null) {
        changeset.removeRecords = changeset.removeRecords ?? [];
        changeset.removeRecords.push(deserializeRecordIdentity(rid));
      } else {
        changeset.setRecords = changeset.setRecords ?? [];
        changeset.setRecords.push(rv);
      }
    }

    for (let rid of Object.keys(inverseRelationships)) {
      let relatedRecord = deserializeRecordIdentity(rid);
      let rels = inverseRelationships[rid];
      for (let rel of Object.keys(rels)) {
        let rv = rels[rel];
        let { record, relationship } = deserializeRecordRelationshipIdentity(
          rel
        );
        let rri = { relatedRecord, record, relationship };
        if (rv === null) {
          changeset.removeInverseRelationships =
            changeset.removeInverseRelationships ?? [];
          changeset.removeInverseRelationships.push(rri);
        } else {
          changeset.addInverseRelationships =
            changeset.addInverseRelationships ?? [];
          changeset.addInverseRelationships.push(rri);
        }
      }
    }

    this._delta = undefined;

    // console.log('buffer#stopTrackingChanges - changeset', changeset);

    return changeset;
  }

  getRecordSync(identity: RecordIdentity): Record | undefined {
    return this._state.records[serializeRecordIdentity(identity)] ?? undefined;
  }

  getRecordsSync(typeOrIdentities?: string | RecordIdentity[]): Record[] {
    if (typeof typeOrIdentities === 'string') {
      return objectValues(this._state.records[typeOrIdentities]);
    } else if (Array.isArray(typeOrIdentities)) {
      const records: Record[] = [];
      const identities: RecordIdentity[] = typeOrIdentities;
      for (let i of identities) {
        let record = this.getRecordSync(i);
        if (record) {
          records.push(record);
        }
      }
      return records;
    } else {
      throw new Error('typeOrIdentities must be specified in getRecordsSync');
    }
  }

  setRecordSync(record: Record): void {
    this._state.records[serializeRecordIdentity(record)] = record;
    if (this._delta) {
      this._delta.records[serializeRecordIdentity(record)] = record;
    }
  }

  setRecordsSync(records: Record[]): void {
    records.forEach((record) => this.setRecordSync(record));
  }

  removeRecordSync(recordIdentity: RecordIdentity): Record | undefined {
    const record = this.getRecordSync(recordIdentity);
    if (record) {
      delete this._state.records[serializeRecordIdentity(record)];
      if (this._delta) {
        this._delta.records[serializeRecordIdentity(record)] = null;
      }
      return record;
    } else {
      return undefined;
    }
  }

  removeRecordsSync(recordIdentities: RecordIdentity[]): Record[] {
    const records = [];
    for (let recordIdentity of recordIdentities) {
      let record = this.getRecordSync(recordIdentity);
      if (record) {
        records.push(record);
        delete this._state.records[serializeRecordIdentity(record)];
        if (this._delta) {
          this._delta.records[serializeRecordIdentity(record)] = null;
        }
      }
    }
    return records;
  }

  getInverseRelationshipsSync(
    recordIdentityOrIdentities: RecordIdentity | RecordIdentity[]
  ): RecordRelationshipIdentity[] {
    if (Array.isArray(recordIdentityOrIdentities)) {
      let relationships: RecordRelationshipIdentity[] = [];
      recordIdentityOrIdentities.forEach((record) => {
        Array.prototype.push(
          relationships,
          this._getInverseRelationshipsSync(record)
        );
      });
      return relationships;
    } else {
      return this._getInverseRelationshipsSync(recordIdentityOrIdentities);
    }
  }

  addInverseRelationshipsSync(
    relationships: RecordRelationshipIdentity[]
  ): void {
    // console.log('addInverseRelationshipsSync', relationships);

    for (let relationship of relationships) {
      const ri = serializeRecordIdentity(relationship.relatedRecord);
      const rri = serializeRecordRelationshipIdentity(relationship);
      const rels = this._state.inverseRelationships[ri] ?? {};
      rels[rri] = relationship;
      this._state.inverseRelationships[ri] = rels;
      if (this._delta) {
        const rels = this._delta.inverseRelationships[ri] ?? {};
        rels[rri] = relationship;
        this._delta.inverseRelationships[ri] = rels;
      }
    }
  }

  removeInverseRelationshipsSync(
    relationships: RecordRelationshipIdentity[]
  ): void {
    // console.log('removeInverseRelationshipsSync', relationships);

    for (let relationship of relationships) {
      const ri = serializeRecordIdentity(relationship.relatedRecord);
      const rri = serializeRecordRelationshipIdentity(relationship);
      const rels = this._state.inverseRelationships[ri];

      if (rels) {
        rels[rri] = null;
        if (this._delta) {
          const rels = this._delta.inverseRelationships[ri] ?? {};
          rels[rri] = null;
        }
      }
    }
  }

  /////////////////////////////////////////////////////////////////////////////
  // Protected methods
  /////////////////////////////////////////////////////////////////////////////

  protected _getInverseRelationshipsSync(
    recordIdentity: RecordIdentity
  ): RecordRelationshipIdentity[] {
    let relationships = this._state.inverseRelationships[
      serializeRecordIdentity(recordIdentity)
    ];
    if (relationships) {
      return objectValues(relationships).filter((r) => r !== null);
    } else {
      return [];
    }
  }
}
