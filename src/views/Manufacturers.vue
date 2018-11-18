<template>
  <v-layout column align-center fill-height>
    <v-flex>
      <h1>Manufacturers</h1>
      <br />
    </v-flex>
    <v-flex id="tableFlex" style="width:100%">
      <CollectionTable :db-ref="dbRef" :headers="headers" id="table" />
    </v-flex>
  </v-layout>
</template>

<script lang="ts">
import { Component, Vue, Prop, Watch } from "vue-property-decorator";
import CollectionTable, { TableHeader } from "@/components/CollectionTable.vue";
import { firestore } from "firebase/app";

type Manufacturer = { name: string };

@Component({ components: { CollectionTable } })
export default class Manufacturers extends Vue {
  readonly headers: TableHeader<Manufacturer>[] = [
    {
      text: "ID",
      value: "id",
      sortable: false,
      class: "idCol"
    },
    {
      text: "Name",
      value: "name",
      sortable: true
    }
  ];

  readonly dbRef = firestore().collection("manufacturers");
}
</script>

<style lang="scss" scoped>
#table /deep/ .idCol {
  width: 200pt;
}
</style>
