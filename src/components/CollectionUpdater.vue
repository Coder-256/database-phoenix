<template>
  <div><slot /></div>
</template>

<script lang="ts">
import { Component, Prop, Vue, Watch } from "vue-property-decorator";
import { firestore } from "firebase/app";
import {
  FirestoreCollectionUpdater,
  FirestoreSortInfo,
  FirestoreFilter,
  FirestorePageInfo
} from "@/firestoreUpdater";

@Component
export default class CollectionUpdater<Item extends object> extends Vue {
  @Prop() dbRef!: firestore.CollectionReference;
  @Prop() sort?: FirestoreSortInfo<Item>;
  @Prop() filter?: FirestoreFilter<Item>[];
  @Prop() pageSize?: number;
  private pageInfo: FirestorePageInfo | null = null;
  protected updaterData: FirestoreCollectionUpdater<Item> | null = null;

  @Watch("ref")
  @Watch("sort")
  @Watch("filters")
  @Watch("pageSize")
  resetUpdater() {
    if (!this.dbRef) {
      console.error("ERROR: dbRef is not defined in resetUpdater()");
      return;
    }

    const newUpdater = new FirestoreCollectionUpdater<Item>(
      this.dbRef,
      this.filter,
      this.sort,
      this.pageSize && this.pageSize > 0
        ? { ...this.pageInfo, pageSize: this.pageSize }
        : undefined, // Ignore this.pageInfo when pageSize is invalid
      updater => {
        this.$emit("input", updater.items);
        this.$emit("loading", false);
      },
      (_updater, error) => {
        this.$emit("error", error);
        this.$emit("loading", false);
      }
    );

    this.$emit("loading", true);
    if (this.updaterData) this.updaterData.stop();
    this.updaterData = newUpdater;
    this.updaterData && this.updaterData.start();
    this.$emit("updater", this);
  }

  get updater(): FirestoreCollectionUpdater<Item> | null {
    if (!this.updaterData) this.resetUpdater();
    return this.updaterData;
  }

  previousPage() {
    this.pageInfo = (this.updaterData && this.updaterData.previousPage) || null;
    this.resetUpdater();
  }

  nextPage() {
    // TODO: Have some sort of loading indicator... (show the current page in
    // the meantime). However, the promise should resolve as long as the
    // *current* page is loaded, then we need to await nextpage().snapshot for
    // the *next* page to load.
    this.pageInfo = (this.updaterData && this.updaterData.nextPage) || null;
    this.resetUpdater();
  }

  mounted() {
    this.resetUpdater();
  }
}
</script>
