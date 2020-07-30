
import React, { MouseEvent, useState } from 'react'

import { useComponents } from './component-lib'
import { ModalType, ModalContentsType } from './component-types'

type ModalOptions = {
  initialState?: boolean,
  resetOnClose?: boolean
}

export const useModal = ({
  initialState = false,
  resetOnClose = true
}: ModalOptions = {}) => {

  const [key, setKey] = useState(0)
  const [isOpen, setIsOpen] = useState(initialState)
  const open = (e?: MouseEvent) => {
    e?.preventDefault()
    setIsOpen(true)
  }
  const close = (e?: MouseEvent) => {
    e?.preventDefault()
    setIsOpen(false)
    if (resetOnClose) {
      setKey(key + 1)
    }
  }
  return { isOpen, open, close, onRequestClose: close, key, setKey }
}


export const Modal: React.FC<
  React.ComponentProps<ModalType> & React.ComponentProps<ModalContentsType>
> = ({
  isOpen,
  onRequestClose,
  title,
  footer,
  children,
}) => {
  const { ModalComponent, ModalContentsComponent } = useComponents({})

  return <ModalComponent
    isOpen={isOpen}
    onRequestClose={onRequestClose}
  >
    <ModalContentsComponent onRequestClose={onRequestClose} title={title} footer={footer}>
      {children}
    </ModalContentsComponent>
  </ModalComponent>
}
