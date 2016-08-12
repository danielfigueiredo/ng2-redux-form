import {
  Directive,
  Input,
  Query,
  QueryList,
  OnDestroy,
  AfterViewInit
} from '@angular/core';
import {
  NgForm,
  NgModel,
  NgControl
} from '@angular/forms';

import { scheduleMicroTask } from '@angular/forms/src/facade/lang';

import {
  Subscription,
  Observable
} from 'rxjs';

import { FormException } from './form-exception';
import { FormStore } from './form-store';
import { State } from './state';
import {NgFormArray} from './ng-form-array';

@Directive({
  selector: 'form[connect]',
})
export class Connect<RootState> implements OnDestroy, AfterViewInit {

  @Input('connect') public statePath: string[] | string;

  private stateSubscription: Redux.Unsubscribe;

  private formSubscription: Subscription;

  constructor(
    @Query(NgControl) private children: QueryList<NgControl>,
    @Query(NgFormArray) private ngFormArrays: QueryList<NgFormArray>,
    private store: FormStore<RootState>,
    private form: NgForm
  ) {
    this.stateSubscription = this.store.subscribe((state: any) => {
      this.resetState();
    });
    this.children.changes.subscribe((change: QueryList<NgControl>) => {
      change.forEach(c => this.applyNgControlChanges(c));
    });
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

      this.formSubscription = Observable.from(this.form.valueChanges)
      // value changes from form triggers every single time, including when
      // their own directives are updating the HTML DOM elements values
      // this is a hack just to make sure that without this issue it's ok
        .debounceTime(10)
        .subscribe(values => {
          this.publish(values)
        });
    });
  }
  
  private get path(): string[] {
    switch (typeof this.statePath) {
      case 'string':
        return (<string> this.statePath).split(/\./g);
      case 'object':
        if (State.empty(this.statePath)) {
          return [];
        }
        if (typeof this.statePath.length === 'number') {
          return <string[]> this.statePath;
        }
      default: // fallthrough above (no break)
        throw new FormException(`Cannot determine path to object: ${JSON.stringify(this.statePath)}`);
    }
  }

  private applyNgControlChanges(c) {
    const controlPath = c.name.split(/\./g);
    const value = State.get(this.getState(), this.path.concat(controlPath));
    const control = this.form.getControl(c as NgModel);
    if (control == null || control.value !== value) {
      this.form.updateModel(c, value);
    }
  }

  protected resetState() {
    this.children.forEach(c => this.applyNgControlChanges(c));
    this.ngFormArrays.forEach(c => {
      const value = State.get(this.getState(), this.path.concat([c.name]));
      c.collections = value;
    });
  }

  // this method uses hard coded values just for testing
  private parseValues(values: any) {
    const obj = {};
    Object.keys(values)
      .forEach(key => {
        const path = key.split('.');
        if (path.length === 3) {
          const pos = parseInt(path[1], 0);
          if (!obj[path[0]]) {
            obj[path[0]] = [];
            obj[path[0]][pos] = {};
          } else if (!obj[path[0]][pos]) {
            obj[path[0]][pos] = {};
          }
          obj[path[0]][pos][path[2]] = values[key];
        } else {
          obj[key] = values[key];
        }
      });
    return obj;
  }

  protected publish(values) {
    const parsedValues = this.parseValues(values);
    this.store.valueChanged(this.path, this.form, parsedValues);
  }

  protected getState(): RootState {
    return this.store.getState();
  }
}
