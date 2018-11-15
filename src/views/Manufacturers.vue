<template>
  <v-container fluid>
    <TableCollectionUpdater
      :db-ref="dbRef"
      :pageSize="pageSize"
      :sort="sort"
      @loading="loading = $event;"
      @input="items = $event;"
      @updater="tableUpdater = $event;"
      ref="updater"
    />
    <v-layout column align-center fill-height>
      <v-flex>
        <h1>Manufacturers</h1>
        <br />
      </v-flex>
      <v-flex id="tableFlex">
        <v-data-table
          id="manufacturers"
          flat
          :headers="headers"
          :items="items"
          :loading="loading"
          :sort="sort !== null ? sort : undefined"
          :custom-sort="sortHandler"
          class="elevation-5"
          must-sort
          hide-actions
        >
          <template slot="items" slot-scope="props">
            <td id="idCell">{{ props.item.id }}</td>
            <td>{{ props.item.name }}</td>
          </template>
          <template slot="footer">
            <td colspan="100%" id="pagination">
              <v-layout row align-center justify-end>
                <v-flex style="max-width:100px">
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
          </template>
          <p slot="no-data" class="noData">
            You've reached the end of the data
          </p>
        </v-data-table>
      </v-flex>
    </v-layout>
  </v-container>
</template>

<script lang="ts">
import { Component, Vue, Prop, Watch } from "vue-property-decorator";
import { ComputedOptions } from "Vue";
import { createDecorator } from "vue-class-component";
import TableCollectionUpdater from "@/components/TableCollectionUpdater.vue";
import "firebase/app";
import "firebase/firestore";
import { firestore } from "firebase/app";
import { FirestoreSortInfo, WithID } from "@/firestoreUpdater";

type TableHeader<T = any> = {
  text?: string;
  value?: keyof WithID<T>;
  align?: "left" | "center" | "right";
  sortable?: boolean;
  class?: string[] | string;
  width?: string;
};

type Manufacturer = { name: string };

@Component({ components: { TableCollectionUpdater } })
export default class Manufacturers extends Vue {
  readonly headers: TableHeader<Manufacturer>[] = [
    {
      text: "ID",
      value: "id",
      sortable: false
    },
    {
      text: "Name",
      value: "name",
      sortable: true
    }
  ];
  readonly pageSizeItems = [5, 10, 25, { text: "All", value: -1 }];
  pageSize = 5;
  items: WithID<Manufacturer>[] = [];
  loading = true;
  dbRef = firestore().collection("manufacturers");
  tableUpdater: TableCollectionUpdater<Manufacturer> | null = null;
  prevReady = false;
  nextReady = false;
  sort: FirestoreSortInfo<Manufacturer> | null = null;

  @Watch("tableUpdater")
  @Watch("items")
  updatePages() {
    this.prevReady = Boolean(
      this.tableUpdater &&
        this.tableUpdater.updater &&
        this.tableUpdater.updater.previousPage
    );

    this.nextReady = Boolean(
      this.tableUpdater &&
        this.tableUpdater.updater &&
        this.tableUpdater.updater.nextPage
    );
  }

  previousPage() {
    this.tableUpdater && this.tableUpdater.previousPage();
  }

  nextPage() {
    this.tableUpdater && this.tableUpdater.nextPage();
  }

  sortHandler(
    items: WithID<Manufacturer>[],
    index: keyof Manufacturer,
    isDescending: boolean
  ): WithID<Manufacturer>[] {
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

<style lang="scss" scoped>
#tableFlex {
  width: 100%;
}
#idCell {
  width: 20em;
}
.noData {
  margin: auto;
  text-align: center;
}
</style>
