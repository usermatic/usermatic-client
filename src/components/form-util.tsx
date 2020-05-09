
import React, { ChangeEvent, ReactNode, Children } from 'react'

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

export type InputComponentType = React.FC<{
  type: string
  name: string
  onChange: (e: ChangeEvent<HTMLInputElement>) => void
  value: string
  id: string
  placeholder?: string
  labelText?: ReactNode
  required?: boolean
  autoFocus?: boolean
}>

export const DefaultInputComponent: InputComponentType = ({
  type,
  name,
  onChange,
  value,
  id,
  placeholder,
  labelText,
  required = false,
  autoFocus = false
}) => (
  <div className="form-label-group">
    <input type={type} name={name} className="form-control"
           onChange={onChange}
           value={value}
           id={id}
           required={required} autoFocus={autoFocus} />
    { labelText &&
    <label className="custom-control-label" htmlFor={id}>
      {labelText}
    </label> }
  </div>
)
