
import React, { ChangeEvent, MouseEvent, useState } from 'react'
import { useQRCode } from 'react-qrcode'
import { Formik, Form, FormikValues, FormikErrors } from 'formik'
import { ApolloError } from 'apollo-client'

import jwtDecode from 'jwt-decode'

import {
  useComponents,
  FormComponents,
  ButtonType,
  InputComponentType
} from './form-util'

import { ErrorMessage } from '../errors'
import { useAddTotp, useGetTotpKey } from '../totp'

const getId = (prefix: string | undefined, suffix: string) => {
  if (prefix) {
    return `${prefix}-${suffix}`
  } else {
    // add some random goobledygook to avoid conflicts with other component
    // libraries.
    return `um3kfiekd-${suffix}`
  }
}

export const QRCode: React.FC<{otpauthUrl: string}> = ({otpauthUrl}) => {
  const dataUrl = useQRCode(otpauthUrl)
  return <img src={dataUrl} />
}

const TotpTokenForm: React.FC<{
  submit: (code: string) => void,
  InputComponent: InputComponentType,
  idPrefix?: string
}> = ({
  submit,
  idPrefix,
  InputComponent
}) => {

  const initialValues = {
    code: ''
  }

  const validate = (values: FormikValues) => {
    const errors: FormikErrors<typeof initialValues> = {}
    if (!/^[0-9]{6}$/.test(values.code)) {
      errors.code = 'Must be 6 a digit code'
    }
  }

  const onSubmit = (values: FormikValues) => {
    submit(values.code)
  }

  return <Formik initialValues={initialValues} onSubmit={onSubmit} validate={validate}>
    {({values, handleChange, submitForm, resetForm, getFieldProps}) => {

      const handleChangeWrapper = (e: ChangeEvent<HTMLInputElement>) => {
        if (/^[0-9]{0,6}$/.test(e.target.value)) {
          handleChange(e)
        }
        if (/^[0-9]{6}$/.test(e.target.value)) {
          submitForm()
        }
      }
      return <Form>
        <InputComponent
          type="text"
          id={getId(idPrefix, "totp-code")}
          required autoFocus
          {...getFieldProps('code')}
          onChange={handleChangeWrapper}
        />
      </Form>
    }}
  </Formik>
}

const RecoveryCodeForm: React.FC<{
  submit: (code: string) => void,
  InputComponent: InputComponentType,
  Button: ButtonType,
  idPrefix?: string
}> = ({
  submit,
  idPrefix,
  InputComponent,
  Button
}) => {

  const initialValues = {
    code: ''
  }

  const validate = (values: FormikValues) => {
    const errors: FormikErrors<typeof initialValues> = {}
    if (!/^[-A-Z0-9]{14}$/.test(values.code)) {
      errors.code = 'Must be 12 character recovery code.'
    }
  }

  const onSubmit = (values: FormikValues) => {
    submit(values.code)
  }

  return <Formik initialValues={initialValues} onSubmit={onSubmit} validate={validate}>
    {({values, handleChange, submitForm, resetForm, getFieldProps}) => {
      const handleChangeWrapper = (e: ChangeEvent<HTMLInputElement>) => {
        const { selectionStart, selectionEnd } = e.target
        const upper = e.target.value.toUpperCase()
        if (/^[-0-9A-Z]{0,14}$/.test(upper)) {
          const chunks = upper.replace(/-/g, '').match(/.{1,4}/g)
          const value = chunks == null ? '' : chunks!.join('-')
          const delta = value.length - upper.length

          e.target.value = value
          e.target.selectionStart = selectionStart! + delta
          e.target.selectionEnd = selectionEnd! + delta
          handleChange(e)
        }
      }
      return <>
        <Form>
          <InputComponent
            type="text"
            id={getId(idPrefix, "recovery-code")}
            required autoFocus
            {...getFieldProps('code')}
            onChange={handleChangeWrapper}
          />
          <Button role="submit" name="submit-recovery-code" type="submit">
            Submit Recovery Code
          </Button>
        </Form>
      </>
    }}
  </Formik>
}

export const MFAForm: React.FC<{
  submit: (code: string) => void,
  loading: boolean,
  error?: ApolloError,
  components?: FormComponents,
  idPrefix?: string
}> = ({
  submit,
  loading,
  error,
  idPrefix,
  components
}) => {

  const {
    LoadingMessageComponent,
    MFAFormComponent,
    TotpInputComponent,
    RecoveryCodeInputComponent,
    Button
  } = useComponents(components)

  const [recoveryMode, setRecoveryMode] = useState<boolean>(false)
  const [stateKey, setStateKey] = useState<number>(0)

  const enterRecoveryMode = (e: MouseEvent) => {
    e.preventDefault()
    setRecoveryMode(true)
    setStateKey(stateKey + 1)
  }

  const exitRecoveryMode = (e: MouseEvent) => {
    e.preventDefault()
    setRecoveryMode(false)
    setStateKey(stateKey + 1)
  }

  return <MFAFormComponent
    error={<ErrorMessage error={error} />}
    loading={loading && <LoadingMessageComponent />}
    recoveryMode={recoveryMode}

    recoveryCodeInput={
      <RecoveryCodeForm key={stateKey} submit={submit} idPrefix={idPrefix}
          Button={Button}
          InputComponent={RecoveryCodeInputComponent} />
    }
    totpTokenInput={
      <TotpTokenForm key={stateKey} submit={submit} idPrefix={idPrefix}
          InputComponent={TotpInputComponent} />
    }

    enterRecoveryModeButton={
      <Button
        role='secondary' name='enter-recovery-mode'
        id={getId(idPrefix, "recovery-code-button")}
        onClick={enterRecoveryMode}
      >
        I need to use a 2FA recovery code
      </Button>
    }

    exitRecoveryModeButton={
      <Button
        role="cancel" name="exit-recovery-mode"
        id={getId(idPrefix, "recovery-code-cancel")}
        onClick={exitRecoveryMode}
      >
        Cancel
      </Button>
    }
  />
}
MFAForm.displayName = 'MFAForm'

export const AddTotpForm: React.FC<{
  idPrefix?: string,
  onSuccess?: () => void,
  components?: FormComponents
  inputComponent?: InputComponentType
}> = ({
  idPrefix,
  onSuccess,
  components
}) => {

  const {
    AddTotpFormComponent,
    TotpInputComponent,
    LoadingMessageComponent
  } = useComponents(components)

  const { loading, error, otpauthUrl, token } = useGetTotpKey()

  const [submit, { success, loading: mutLoading, error: mutError }] = useAddTotp({
    onCompleted: () => {
      if (onSuccess != null) { onSuccess() }
    }
  })

  if (loading) {
    return null
  }
  if (error) {
    return <ErrorMessage error={error} />
  }
  if (!otpauthUrl || !token) {
    console.error("otpauthUrl and token are required", otpauthUrl, token)
    return null
  }

  const submitCode = (code: string) => {
    submit({ code, token })
  }

  const { secretBase32 } = jwtDecode(token)
  const textCode = secretBase32.match(/.{1,4}/g).join(' ')
  return <AddTotpFormComponent
    success={success}
    error={<ErrorMessage error={mutError} />}
    loading={mutLoading && <LoadingMessageComponent/>}
    qrCode={<QRCode otpauthUrl={otpauthUrl} />}
    textCode={textCode}
    totpTokenForm={
      <TotpTokenForm
        idPrefix={idPrefix}
        InputComponent={TotpInputComponent}
        submit={submitCode}
      />
    }
  />
}
