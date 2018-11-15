<script lang="ts">
import { Component, Prop, Vue } from "vue-property-decorator";
import "firebase/app";
import "firebase/firestore";
import { firestore } from "firebase/app";

@Component
export default class CollectionProvider<T> extends Vue {
  @Prop() storeRef!: firestore.CollectionReference;
  @Prop() limit?: number;
  @Prop()
  sort?: {
    field: string | firestore.FieldPath;
    asc: boolean;
  };
  @Prop()
  filter?: {
    field: string | firestore.FieldPath;
    operation: string;
    value: any;
  };
  @Prop() private items: T[] = [];
  private pageDelta: number = 0;
  private updating: boolean = false;
  private lastSnapshot?: firestore.QuerySnapshot;

  nextPage() {
    this.pageDelta++;
    this.update();
  }

  lastPage() {
    this.pageDelta--;
    this.update();
  }

  created() {
    this.update();
  }

  update() {
    if (this.updating) return;
    this.updating = true;
  }
}
</script>
