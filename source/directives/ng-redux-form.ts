import {
  forwardRef,
  Directive,
  Input,
  Optional,
  Host,
  SkipSelf,
} from '@angular/core';
import {NgReduxField} from './ng-redux-field';
import {FormStore} from '../form-store';

export const reduxFormProvider: any = {
  provide: NgReduxField,
  useExisting: forwardRef(() => NgReduxForm)
};

@Directive({selector: '[ngReduxGroup]', providers: [reduxFormProvider]})
export class NgReduxForm<RootState> extends NgReduxField {


  @Input('ngReduxForm') name: string;

  constructor(
    private store: FormStore<RootState>
  ) {
    super();
    this.store.subscribe(() => this.applyChanges());
  }

  private applyChanges() {
    
  }
  
  getPath(): string[] {
    return [this.name];
  }


}
