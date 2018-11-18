import "firebase/app";
import { firestore } from "firebase/app";

export type StoreRef =
  | firestore.CollectionReference
  | firestore.DocumentReference;
export type Snapshot<Ref extends StoreRef> = Ref extends firestore.Query
  ? firestore.QuerySnapshot
  : (Ref extends firestore.DocumentReference
      ? firestore.DocumentSnapshot
      : undefined);
export type WithID<T> = T & { id: string };
export type PageInfo<PageRef> = {
  pageSize: number;
  current?: PageRef;
};
export type AbsolutePageRef = {
  pageNumber: number;
};
export type RelativePageRef<RefType> = {
  ref: RefType;
  start: boolean;
  include: boolean;
};
export type SortInfo<KeyType> = {
  key: KeyType;
  ascending: boolean;
};

export abstract class Updater<
  Self extends Updater<Self, Item, ItemsType>,
  Item,
  ItemsType = Item[]
> {
  abstract get items(): ItemsType | undefined;
  protected _unsubscribe?: () => void;
  abstract start(): void;
  stop() {
    if (this._unsubscribe) {
      this._unsubscribe();
      this._unsubscribe = undefined;
    }
  }
  constructor(
    protected readonly onUpdate?: (updater: Self) => void,
    protected readonly onError?: (updater: Self, error: Error) => void
  ) {}
}

export interface FilterableUpdater<
  Self extends FilterableUpdater<Self, Item, FilterType>,
  Item,
  FilterType = Partial<WithID<Item>>
> extends Updater<Self, Item, any> {
  readonly filter: FilterType;
}

export interface SortableUpdater<
  Self extends SortableUpdater<Self, Item, SortInfoType>,
  Item,
  SortInfoType extends SortInfo<any>
> extends Updater<Self, Item, any> {
  readonly sort?: SortInfoType;
}

export interface PageableUpdater<
  Self extends PageableUpdater<Self, PageInfoType>,
  PageInfoType extends PageInfo<any>
> extends Updater<Self, any, any> {
  previousPage?: PageInfoType;
  nextPage?: PageInfoType;
}

export abstract class FirestoreUpdater<
  Self extends FirestoreUpdater<Self, RefType, Item, ItemsType>,
  RefType extends StoreRef,
  Item extends object,
  ItemsType
> extends Updater<Self, Item, ItemsType> {
  constructor(
    readonly ref: RefType,
    onUpdate?: (updater: Self) => void,
    onError?: (updater: Self, error: Error) => void
  ) {
    super(onUpdate, onError);
  }
  protected _snapshot?: Snapshot<RefType>;
  get snapshot() {
    return this._snapshot;
  }
  protected abstract mapSnapshot(snapshot: Snapshot<RefType>): ItemsType;
  get items() {
    if (!this.snapshot) return undefined;
    return this.mapSnapshot(this.snapshot);
  }
}

export type FirestoreField<Item> = firestore.FieldPath | (string & keyof Item);
export type FirestoreFilter<Item> = {
  fieldPath: FirestoreField<Item>;
  opStr: firestore.WhereFilterOp;
  value: any;
};
export interface FirestoreFilterableUpdater<
  Self extends FirestoreFilterableUpdater<Self, Item>,
  Item extends object
>
  extends FirestoreUpdater<Self, any, Item, any>,
    FilterableUpdater<Self, Item, FirestoreFilter<Item>[]> {}

export type FirestoreSortInfo<Item> = SortInfo<FirestoreField<Item>>;
export interface FirestoreSortableUpdater<
  Self extends FirestoreSortableUpdater<Self, Item>,
  Item
> extends SortableUpdater<Self, Item, FirestoreSortInfo<Item>> {}

export type FirestorePageRef = RelativePageRef<firestore.QueryDocumentSnapshot>;
export type FirestorePageInfo = PageInfo<FirestorePageRef>;
export interface FirestorePageableUpdater<
  Self extends FirestorePageableUpdater<Self>
>
  extends FirestoreUpdater<Self, any, any, any>,
    PageableUpdater<Self, FirestorePageInfo> {}

export type DocumentItems<Item extends object> = {
  key: keyof Item;
  value: any;
}[];

// export class DocumentUpdater<Item extends object> extends FirestoreUpdater<
//   Item,
//   firestore.DocumentReference,
//   DocumentItems<WithID<Item>>,
//   DocumentUpdater<Item>
// > {
//   mapSnapshot(snapshot: firestore.DocumentSnapshot) {
//     return Object.entries({ ...snapshot.data(), id: snapshot.id }).map(
//       ([key, value]) => {
//         return { key, value };
//       }
//     ) as DocumentItems<WithID<Item>>;
//   }
// }

export class FirestoreCollectionUpdater<Item extends object>
  extends FirestoreUpdater<
    FirestoreCollectionUpdater<Item>,
    firestore.CollectionReference,
    Item,
    WithID<Item>[]
  >
  implements
    FirestoreSortableUpdater<FirestoreCollectionUpdater<Item>, Item>,
    FirestoreFilterableUpdater<FirestoreCollectionUpdater<Item>, Item>,
    FirestorePageableUpdater<FirestoreCollectionUpdater<Item>> {
  readonly query: firestore.Query;

  protected mapSnapshot(snapshot: firestore.QuerySnapshot) {
    return snapshot.docs.map(doc => {
      return { ...doc.data(), id: doc.id } as WithID<Item>;
    });
  }

  protected makeNewPage(
    newPage: (
      pageInfo: FirestorePageInfo,
      snapshot?: firestore.QuerySnapshot
    ) => FirestorePageRef | undefined
  ): FirestorePageInfo | undefined {
    if (!this.pageInfo) return;
    const current = newPage(this.pageInfo, this.snapshot);
    if (!current) return;
    return { ...this.pageInfo, current };
  }

  protected _previousPage?: FirestorePageInfo;
  get previousPage() {
    if (!this.pageInfo || !this.pageInfo.current) return undefined;
    return this._previousPage
      ? this._previousPage
      : (this._previousPage = this.makeNewPage(function(pageInfo, snapshot) {
          return pageInfo.current && pageInfo.current.start
            ? {
                ref: pageInfo.current.ref,
                start: false,
                include: !pageInfo.current.include
              }
            : snapshot && snapshot.docs.length > 0
            ? {
                ref: snapshot.docs[0],
                start: false,
                include: false
              }
            : undefined;
        }));
  }

  protected _nextPage?: FirestorePageInfo;
  get nextPage() {
    return this._nextPage
      ? this._nextPage
      : (this._nextPage = this.makeNewPage(function(pageInfo, snapshot) {
          return pageInfo.current && !pageInfo.current.start
            ? {
                ref: pageInfo.current.ref,
                start: true,
                include: !pageInfo.current.include
              }
            : snapshot && snapshot.docs.length > 0
            ? {
                ref: snapshot.docs[snapshot.docs.length - 1],
                start: true,
                include: false
              }
            : undefined;
        }));
  }

  protected unsubscribe?: () => void;

  start() {
    if (this.unsubscribe) return;
    this.unsubscribe = this.query.onSnapshot(
      snapshot => {
        this._snapshot = snapshot;
        this.onUpdate && this.onUpdate(this);
      },
      error => {
        this.onError && this.onError(this, error);
      }
    );
  }

  stop() {
    if (!this.unsubscribe) return;
    this.unsubscribe();
    this.unsubscribe = undefined;
  }

  constructor(
    ref: firestore.CollectionReference,
    readonly filter: FirestoreFilter<Item>[] = [],
    readonly sort?: FirestoreSortInfo<Item>,
    readonly pageInfo?: FirestorePageInfo,
    onUpdate?: (updater: FirestoreCollectionUpdater<Item>) => void,
    onError?: (updater: FirestoreCollectionUpdater<Item>, error: Error) => void
  ) {
    super(ref, onUpdate, onError);
    var query: firestore.Query = ref;
    if (sort) {
      query = query.orderBy(sort.key, sort.ascending ? "asc" : "desc");
    }

    for (const filter of this.filter) {
      query = query.where(filter.fieldPath, filter.opStr, filter.value);
    }

    if (this.pageInfo && this.pageInfo.pageSize > 0) {
      if (this.pageInfo.current) {
        const pageMap: (
          ref: firestore.DocumentSnapshot
        ) => firestore.Query = this.pageInfo.current.start
          ? this.pageInfo.current.include
            ? query.startAt
            : query.startAfter
          : this.pageInfo.current.include
          ? query.endAt
          : query.endBefore;
        query = pageMap.call(query, this.pageInfo.current.ref);
      }
      query = query.limit(this.pageInfo.pageSize);
    }

    this.query = query;
  }
}
