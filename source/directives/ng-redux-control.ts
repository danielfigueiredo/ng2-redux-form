import {
  forwardRef,
  Directive,
  Input,
  Optional,
  Host,
  SkipSelf,
} from '@angular/core';
import {NgReduxField} from './ng-redux-field';

export const reduxControlProvider: any = {
  provide: NgReduxField,
  useExisting: forwardRef(() => NgReduxControl)
};

@Directive({selector: '[ngReduxControl][ngModel]', providers: [reduxControlProvider]})
export class NgReduxControl extends NgReduxField {


  @Input('ngReduxControl') name: string;

  constructor(
    @Optional() @Host() @SkipSelf() private _parent: NgReduxField
  ) {
    super();
  }

  ngOnInit() {
    console.log(this.getPath());
  }

  getPath(): string[] {
    return this._parent ? this._parent.getPath().concat(this.name) : [this.name];
  }


}
