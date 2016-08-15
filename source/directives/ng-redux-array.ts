import {
  forwardRef,
  Directive,
  Input,
  Optional,
  Host,
  SkipSelf,
} from '@angular/core';
import {NgReduxField} from './ng-redux-field';

export const reduxArrayProvider: any = {
  provide: NgReduxField,
  useExisting: forwardRef(() => NgReduxArray)
};

@Directive({selector: '[ngReduxArray]', providers: [reduxArrayProvider]})
export class NgReduxArray extends NgReduxField {


  name: string;

  constructor(
    @Optional() @Host() @SkipSelf() private _parent: NgReduxField
  ) {
    super();
  }

  @Input()
  set ngReduxArrayOf(key: string) {
    this.name = key;
  }

  getPath(): string[] {
    return this._parent ? this._parent.getPath().concat(this.name) : [this.name];
  }

  
}
