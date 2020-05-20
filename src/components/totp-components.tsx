
import React, { ChangeEvent, MouseEvent, useState } from 'react'
import { useQRCode } from 'react-qrcode'
import { Formik, Form, FormikValues, FormikErrors } from 'formik'

import jwtDecode from 'jwt-decode'

import { InputComponentType } from './form-util'
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

export const ManualEntry: React.FC<{token: string}> = ({token}) => {
  const [reveal, setReveal] = useState(false)
  const { secretBase32 } = jwtDecode(token)
  const chunks = secretBase32.match(/.{1,4}/g)
  const onClick = (e: MouseEvent) => {
    e.preventDefault()
    setReveal(true)
  }

  return <div className="d-flex flex-column align-items-center text-muted">
    { reveal
      ? <div>Enter this code into your authenticator app:</div>
      : <div onClick={onClick}>click for manual entry</div> }
    { reveal && <div><code>{chunks.join(' ')}</code></div> }
  </div>
}

const DefaultCodeInput: InputComponentType = (props) => (
  <div>
    <input className="form-control" {...props} />
  </div>
)

const TotpTokenForm: React.FC<{
  submit: (code: string) => void,
  InputComponent?: InputComponentType,
  idPrefix?: string
}> = ({
  submit,
  idPrefix,
  InputComponent = DefaultCodeInput
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

  return <div>
    <Formik initialValues={initialValues} onSubmit={onSubmit} validate={validate}>
    {({values, handleChange, submitForm, resetForm}) => {

      const handleChangeWrapper = (e: ChangeEvent<HTMLInputElement>) => {
        if (/^[0-9]{0,6}$/.test(e.target.value)) {
          handleChange(e)
        }
        if (/^[0-9]{6}$/.test(e.target.value)) {
          submitForm()
        }
      }
      return <>
        <Form>
          <InputComponent
            type="text" name="code"
            onChange={handleChangeWrapper}
            value={values.code}
            id={getId(idPrefix, "totp-code")}
            required autoFocus />
        </Form>
      </>
    }}
    </Formik>
  </div>
}

const RecoveryCodeForm: React.FC<{
  submit: (code: string) => void,
  InputComponent?: InputComponentType,
  idPrefix?: string
}> = ({
  submit,
  idPrefix,
  InputComponent = DefaultCodeInput
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

  return <div className="w-100 d-flex justify-content-center">
    <Formik initialValues={initialValues} onSubmit={onSubmit} validate={validate}>
    {({values, handleChange, submitForm, resetForm}) => {
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
        <Form className="w-100 d-flex flex-column align-items-center">
          <InputComponent
            type="text" name="code"
            onChange={handleChangeWrapper}
            value={values.code}
            id={getId(idPrefix, "recovery-code")}
            required autoFocus
          />
          <button className="btn btn-primary btn-block mb-3" type="submit">
            Submit Recovery Code
          </button>
        </Form>
      </>
    }}
    </Formik>
  </div>
}

export const MFAForm: React.FC<{
  submit: (code: string) => void,
  TotpInputComponent?: InputComponentType,
  RecoveryCodeInputComponent?: InputComponentType,
  idPrefix?: string
}> = ({
  submit,
  idPrefix,
  TotpInputComponent = DefaultCodeInput,
  RecoveryCodeInputComponent = DefaultCodeInput
}) => {

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

  return <>
    <div className="text-muted p-3">
      { recoveryMode
        ? <>Please enter your recovery code:</>
        : <>Please enter the 6 digit code from your authenticator app:</>
      }
    </div>
    { recoveryMode
      ? <RecoveryCodeForm key={stateKey} submit={submit} idPrefix={idPrefix}
          InputComponent={RecoveryCodeInputComponent} />
      : <TotpTokenForm key={stateKey} submit={submit} idPrefix={idPrefix}
          InputComponent={TotpInputComponent} />
    }
    { recoveryMode
      ? <button className="btn btn-outline-secondary btn-block" onClick={exitRecoveryMode}>
          Cancel
        </button>
      : <button id={getId(idPrefix, "recovery-code-button")}
                className="my-3 btn btn-outline-secondary" onClick={enterRecoveryMode}>
          I need to use a 2FA recovery code
        </button>
    }
  </>
}

export const AddTotpForm: React.FC<{
  idPrefix?: string,
  onSuccess?: () => void,
  inputComponent?: InputComponentType
}> = ({
  idPrefix,
  onSuccess,
  inputComponent: TotpInputComponent = DefaultCodeInput
}) => {
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

  if (success) {
    return <div className="alert alert-success mt-3">
      Your authenticator app has been successfully configured.
      You will need your authenticator app in order to log in to
      your account from now on.
    </div>
  }

  return <div>
    <div className="d-flex flex-column align-items-center">
      <div>1. Scan this QRCode with your authenticator app</div>
      <div><QRCode otpauthUrl={otpauthUrl} /></div>
      <ManualEntry token={token} />
      <div>2. Then, enter the 6 digit code from the authenticator app here:</div>
      <ErrorMessage error={mutError} />
      <TotpTokenForm
        idPrefix={idPrefix}
        InputComponent={TotpInputComponent}
        submit={submitCode}
      />
      { mutLoading && <div>Please wait...</div> }
    </div>
  </div>
}
