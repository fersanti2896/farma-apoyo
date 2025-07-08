import { Injectable } from '@angular/core';
import { FormGroup, ValidationErrors } from '@angular/forms';

@Injectable({
  providedIn: 'root'
})
export class ValidatorsService {
  public emailPattern: string = "^[a-z0-9._%+-]+@[a-z0-9.-]+\\.[a-z]{2,4}$";
  public passwordPatter: string = "^(?=.*[a-zA-Z])(?=.*\\d).{8,}$";
  public phonePatter: string = "^\\d{10}$";
  public zipCodePatter: string = "^['\"]?(\\d{5})['\"]?$";
  
  constructor() { }

  public isValidField = ( form: FormGroup, field: string ) => {
    return form.controls[field].errors && form.controls[field].touched;
  };

  public isFieldOneEqualFieldTwo = ( field1: string, field2: string ) => {
    return ( formGroup: FormGroup ): ValidationErrors | null => {
      const fieldValue1 = formGroup.get(field1)?.value;
      const fieldValue2 = formGroup.get(field2)?.value;

      if( fieldValue1 !== fieldValue2 ) { 
        formGroup.get(field2)?.setErrors({ noEqual: true });
        return { noEqual: true }
      }

      formGroup.get(field2)?.setErrors(null);

      return null;
    }
  }
}
