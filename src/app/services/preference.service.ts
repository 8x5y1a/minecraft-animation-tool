import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class PreferenceService {
  get isDisableTooltips(): boolean {
    return localStorage.getItem('disableTooltips') === 'true';
  }
  set isDisableTooltips(value: boolean) {
    localStorage.setItem('disableTooltips', value.toString());
  }

  get autoRemoveAir(): boolean {
    return localStorage.getItem('autoRemoveAir') === 'true';
  }
  set autoRemoveAir(value: boolean) {
    localStorage.setItem('autoRemoveAir', value.toString());
  }

  get hideHowTo(): boolean {
    return localStorage.getItem('hideHowTo') === 'true';
  }
  set hideHowTo(value: boolean) {
    localStorage.setItem('hideHowTo', value.toString());
  }

  get skipBlockList(): boolean {
    return localStorage.getItem('skipBlockList') === 'true';
  }
  set skipBlockList(value: boolean) {
    localStorage.setItem('skipBlockList', value.toString());
  }
}
