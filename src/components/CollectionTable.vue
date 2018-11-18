<template>
  <div>
    <CollectionUpdater
      :db-ref="dbRef"
      :page-size="pageSize"
      :sort="sort"
      @loading="loading = $event;"
      @input="items = $event;"
      @updater="updater = $event;"
    />
    <v-data-table
      flat
      :headers="headers"
      :items="items"
      :loading="loading"
      :sort="sort"
      :custom-sort="sortHandler"
      class="elevation-5"
      must-sort
      hide-actions
    >
      <template slot="items" slot-scope="props">
        <slot name="items" :props="props">
          <tr>
            <td v-for="header in headers" :key="header.value">
              {{ props.item[header.value] }}
            </td>
          </tr>
        </slot>
      </template>
      <td slot="footer" colspan="100%">
        <v-layout row align-center justify-end>
          <v-flex style="max-width:100pt">
            <v-select
              :items="pageSizeItems"
              v-model="pageSize"
              label="Page Size"
            />
          </v-flex>
          <v-flex shrink>
            <v-btn flat icon @click="previousPage" :disabled="!prevReady">
              <v-icon>navigate_before</v-icon>
            </v-btn>
          </v-flex>
          <v-flex shrink>
            <v-btn flat icon @click="nextPage" :disabled="!nextReady">
              <v-icon>navigate_next</v-icon>
            </v-btn>
          </v-flex>
        </v-layout>
      </td>
      <p slot="no-data" style="margin:auto;text-align:center">
        You've reached the end of the data
      </p>
    </v-data-table>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue, Watch } from "vue-property-decorator";
import { firestore } from "firebase/app";
import {
  FirestoreCollectionUpdater,
  FirestoreSortInfo,
  FirestoreFilter,
  WithID
} from "@/firestoreUpdater";
import CollectionUpdater from "@/components/CollectionUpdater.vue";

export type TableHeader<T = any> = {
  text: string;
  value: keyof WithID<T>;
  align?: "left" | "center" | "right";
  sortable?: boolean;
  class?: string[] | string;
  width?: string;
};

@Component({ components: { CollectionUpdater } })
export default class CollectionTable<Item extends object> extends Vue {
  protected readonly pageSizeItems = [5, 10, 25, { text: "All", value: -1 }];
  @Prop() dbRef!: firestore.CollectionReference;
  @Prop() filter?: FirestoreFilter<Item>[];
  @Prop() headers?: TableHeader<Item>[];
  protected pageSize = 5;
  protected updater: CollectionUpdater<Item> | null = null;
  protected loading = true;
  protected items: WithID<Item>[] = [];
  protected prevReady = false;
  protected nextReady = false;
  protected sort: FirestoreSortInfo<Item> | null = null;

  previousPage() {
    this.updater && this.updater.previousPage();
  }

  nextPage() {
    this.updater && this.updater.nextPage();
  }

  @Watch("updater")
  @Watch("items")
  updatePages() {
    this.prevReady = Boolean(
      this.updater && this.updater.updater && this.updater.updater.previousPage
    );

    this.nextReady = Boolean(
      this.updater && this.updater.updater && this.updater.updater.nextPage
    );
  }

  sortHandler(
    items: WithID<Item>[],
    index: string & keyof Item,
    isDescending: boolean
  ): WithID<Item>[] {
    // Setting this.sort triggers a refresh; avoid a loop
    if (
      !this.sort ||
      this.sort.key != index ||
      this.sort.ascending == isDescending
    ) {
      this.sort = { key: index, ascending: !isDescending };
    }
    return items;
  }
}
</script>
