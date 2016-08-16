import {
  Directive,
  Input,
  Query,
  QueryList,
} from '@angular/core';
import {
  NgForm,
  NgModel,
  NgControl,
  FormGroup,
  FormArray,
  AbstractControl,
} from '@angular/forms';
import {
  scheduleMicroTask,
} from '@angular/forms/src/facade/lang';

import { Subscription } from 'rxjs';
import 'rxjs/add/operator/debounceTime';

import { FormStore } from './form-store';
import { State } from './state';

@Directive({
  selector: 'form[connect]',
})
export class Connect<RootState> {
  @Input('connect') connect: () => (string | string[]) | string | string[];

  private stateSubscription: Redux.Unsubscribe;

  private formSubscription: Subscription;

  constructor(
    @Query(NgControl, {descendants: true}) private children: QueryList<NgControl>,
    private store: FormStore<RootState>,
    private form: NgForm
  ) {
    this.stateSubscription = this.store.subscribe(() => {
      this.resetState();
    });
  }

  get _parent() {
    return this.form;
  }

  public get path(): string[] {
    const path = typeof this.connect === 'function'
      ? this.connect()
      : this.connect;

    switch (typeof path) {
      case 'object':
        if (State.empty(path)) {
          return [];
        }
        if (typeof path.length === 'number') {
          return <string[]> path;
        }
      case 'string':
        return (<string> path).split(/\./g);
      default: // fallthrough above (no break)
        throw new Error(`Cannot determine path to object: ${JSON.stringify(path)}`);
    }
  }

  ngOnDestroy () {
    if (this.formSubscription) {
      this.formSubscription.unsubscribe();
      this.formSubscription = null;
    }
  }

  ngAfterViewInit() {
    this.resetState();

    scheduleMicroTask(() => {
      this.formSubscription = this.form.valueChanges.debounceTime(0).subscribe(
        values => this.publish(values)
      );
    });
  }

  protected resetState() {
    this.children.forEach(c => {
      const value = State.get(this.getState(), this.path.concat(c.path));

      const control = this.form.getControl(c as NgModel);

      if (control == null || control.value !== value) {
        this.form.updateModel(c, value);
      }
    });
  }

  private generateControlInfo(control: AbstractControl): any {
    return {
      status: control.status,
      valid: control.valid,
      invalid: control.invalid,
      touched: control.touched,
      untouched: control.untouched,
      pristine: control.pristine,
      dirty: control.dirty,
      errors: control.errors
    };
  }

  private generateFormMetadata(control: AbstractControl, key, metaFormData = {}): any {
    if (control instanceof FormGroup) {
      Object.keys((<FormGroup> control).controls)
        .forEach(
          entry => {
            if (metaFormData[key]) {
              metaFormData[key] = Object.assign(
                metaFormData[key],
                this.generateFormMetadata(control.controls[entry], entry)
              );
            } else {
              metaFormData[entry] = this.generateFormMetadata(control.controls[entry], entry);
            }
          }
        );
    } else if (control instanceof FormArray) {
      metaFormData = [];
      (<FormArray> control).controls.forEach(
        (control, index) => metaFormData[index] = this.generateFormMetadata(control, null)
      );
    }
    metaFormData['meta'] = this.generateControlInfo(control);
    return metaFormData;
  }
  
  protected publish(value) {
    const meta = this.generateFormMetadata(this.form.form, this.connect);
    console.log(meta);
    this.store.valueChanged(this.path, this.form, value);
  }

  protected getState(): RootState {
    return this.store.getState();
  }
}
