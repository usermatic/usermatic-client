
import React, { useState, FormEvent, ChangeEvent, ReactNode, Children } from 'react'

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
    setValues(values => ({ ...values, [event.target.getAttribute('data-var') as string]: val }));
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

// A simple utility for allowing labels to come before or after inputs.
export const InputLabel: React.FC<{children: ReactNode, flip: boolean}> = ({children, flip}) => {
  const childrenArr = Children.toArray(children)
  if (childrenArr.length !== 2) {
    throw new Error("<InputLabel> requires exactly two children")
  }
  if (flip) {
    return <>
      {childrenArr[1]}
      {childrenArr[0]}
    </>
  } else {
    return <>
      {childrenArr[0]}
      {childrenArr[1]}
    </>
  }
}
