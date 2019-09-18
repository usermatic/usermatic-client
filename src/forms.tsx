
import React, { useState, ReactNode, FormEvent, ChangeEvent, createContext } from 'react'

type InputOptions = {
  id: string,
  inputType: string,
  initialValue: string,
  children: ReactNode,
}

export interface InputValueMap {
    [key: string]: string;
}

interface FormHook {
  values: InputValueMap,
  handleChange: (event: ChangeEvent<HTMLInputElement>) => void,
  handleSubmit: (event: FormEvent<HTMLFormElement>) => void,
}

const FormContext = createContext<FormHook | null>(null)

export const useForm = (submit: (values: InputValueMap) => void): FormHook => {
  const [values, setValues] = useState({})

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    if (event) event.preventDefault();
    submit(values);
  };

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    event.persist(); // XXX
    setValues(values => ({ ...values, [event.target.id]: event.target.value }));
  };

  return {
    handleChange,
    handleSubmit,
    values,
  }
}

export const Input: React.FC<InputOptions> = ({inputType, initialValue, children, id}) => (
  <FormContext.Consumer>
    {(formHook): ReactNode => formHook && (
      <>
      <label>
        {children}
      </label>
      <input
        id={id}
        type={inputType}
        value={formHook.values[id] || ""}
        onChange={e => formHook.handleChange(e)}
      />
      </>
    )}
  </FormContext.Consumer>
)

type FormOptions = {
  formHook: FormHook,
  children: ReactNode,
}

export const Form: React.FC<FormOptions> = ({formHook, children}) => {
  return (
    <FormContext.Provider value={formHook}>
      <form
        onSubmit={e => {
          e.preventDefault()
          formHook.handleSubmit(e)
          e.persist()
        }}
      >
        {children}
      </form>
    </FormContext.Provider>
  );
}

