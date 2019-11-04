
import { useState, FormEvent, ChangeEvent } from 'react'

export interface InputValueMap {
    [key: string]: string;
}

interface FormHook {
  values: InputValueMap,
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void,
  onChange: (event: React.ChangeEvent<HTMLInputElement>) => void,
  clear: () => void
}

export const useForm = (submit: (values: InputValueMap) => void, hiddenValues: {} = {}): FormHook => {
  const [values, setValues] = useState({})

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    if (event) event.preventDefault();

    for (const k in hiddenValues) {
      if (values.hasOwnProperty(k)) {
        console.warn(`hiddenValue ${k} overridden by form data`)
      }
    }

    submit({...hiddenValues, ...values});
  };

  const onChange = (event: ChangeEvent<HTMLInputElement>) => {
    event.persist();
    const val = event.target.type == 'checkbox' ? event.target.checked : event.target.value
    setValues(values => ({ ...values, [event.target.id]: val }));
  };

  const clear = () => {
    setValues({})
  }

  return {
    onChange,
    onSubmit,
    values,
    clear
  }
}
