import {
  Directive,
  IterableDiffers,
  ChangeDetectorRef,
  IterableDiffer,
  DoCheck,
  TemplateRef,
  ViewContainerRef,
  ViewRef,
  Input,
  CollectionChangeRecord,
  EmbeddedViewRef
} from '@angular/core';
import {NgForRow} from '@angular/common/src/directives/ng_for';


@Directive({selector: '[ngFormArray]'})
export class NgFormArray implements DoCheck {

  name: string;
  
  private _collections: any;
  private _differ: IterableDiffer;
  private _viewMap: Map<any,ViewRef> = new Map<any, ViewRef>();


  constructor(
    private _changeDetectorRef: ChangeDetectorRef,
    private _differs: IterableDiffers,
    private _templateRef: TemplateRef<NgForRow>,
    private _viewContainerRef: ViewContainerRef
  ) {}

  @Input()
  set ngFormArrayOf(key: string) {
    this.name = key;
  }
  
  set collections(coll: any) {
    // need a better strategy to detect changes
    if (!this._collections || this._collections.length !== coll.length) {
      this._collections = coll;
    }
    if (!this._differ) {
      this._differ = this._differs.find(coll).create(this._changeDetectorRef);
    }
  }

  ngDoCheck(): void {
    if (this._differ) {
      const changes = this._differ.diff(this._collections);
      if (changes) {
        changes.forEachAddedItem((change: CollectionChangeRecord) => {
          const item = change.item;
          const view = this._viewContainerRef.createEmbeddedView<{$implicit: number}>(this._templateRef);
          this._viewMap.set(item, view);
        });
        changes.forEachRemovedItem((change: CollectionChangeRecord) => {
          const view = this._viewMap.get(change.item);
          const viewIndex = this._viewContainerRef.indexOf(view);
          this._viewContainerRef.remove(viewIndex);
          this._viewMap.delete(change.item);
        });
        for (let i = 0, length = this._viewContainerRef.length; i < length; i++) {
          const viewRef = <EmbeddedViewRef<NgForRow>> this._viewContainerRef.get(i);
          viewRef.context.$implicit = i;
        }
      }
    }
  }
}
