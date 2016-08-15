import {
  forwardRef,
  Directive,
  Input,
  Optional,
  Host,
  SkipSelf,
} from '@angular/core';
import {NgReduxField} from './ng-redux-field';

export const reduxGroupProvider: any = {
  provide: NgReduxField,
  useExisting: forwardRef(() => NgReduxGroup)
};

@Directive({selector: '[ngReduxGroup]', providers: [reduxGroupProvider]})
export class NgReduxGroup extends NgReduxField {


  @Input('ngReduxGroup') name: string;

  constructor(
    @Optional() @Host() @SkipSelf() private _parent: NgReduxField
  ) {
    super();
  }

  getPath(): string[] {
    return this._parent ? this._parent.getPath().concat(this.name) : [this.name];
  }


}
