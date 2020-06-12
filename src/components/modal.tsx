
import { MouseEvent, useState } from 'react'

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

