
import React, { ReactNode, Children } from 'react'

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
