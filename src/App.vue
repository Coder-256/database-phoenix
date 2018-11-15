<template>
  <v-app>
    <v-navigation-drawer app clipped v-model="drawer">
      <v-list>
        <v-list-tile
          router
          v-for="item in items"
          :to="item.to"
          :key="item.to"
          exact
        >
          <v-list-tile-content>
            <v-list-tile-title v-text="item.title"></v-list-tile-title>
          </v-list-tile-content>
        </v-list-tile>
      </v-list>
    </v-navigation-drawer>
    <v-toolbar fixed app clipped-left>
      <v-toolbar-side-icon
        @click.stop="drawer = !drawer;"
      ></v-toolbar-side-icon>
    </v-toolbar>
    <v-content>
      <v-container fluid> <router-view /> </v-container>
    </v-content>
  </v-app>
</template>

<script lang="ts">
import { Component, Vue } from "vue-property-decorator";

@Component
export default class App extends Vue {
  drawer = false;
  items = [
    {
      title: "Home",
      to: "/"
    },
    {
      title: "About",
      to: "/about"
    },
    {
      title: "Manufacturers",
      to: "manufacturers"
    }
  ];
}
</script>
