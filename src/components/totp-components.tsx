
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
  console.log('otpauthUrl', otpauthUrl)
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

export const TotpTokenForm: React.FC<{
  submit: (code: string) => void,
  InputComponent?: InputComponentType,
  idPrefix?: string
}> = ({submit, idPrefix, InputComponent = DefaultCodeInput}) => {

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
  {({values, handleChange, submitForm}) => {
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
          id={getId(idPrefix, "add-totp")}
          required autoFocus />
      </Form>
    </>
  }}
  </Formik>
}

const AddTotpInner: React.FC<{
  idPrefix?: string,
  token: string,
  InputComponent: InputComponentType
}> = ({ idPrefix, token, InputComponent }) => {
  const [submit, { success, loading, error }] = useAddTotp()

  const submitCode = (code: string) => {
    submit({ code, token })
  }

  if (success) {
    return <div className="alert alert-success">
      Your authenticator app has been successfully configured.
      You will need your app in order to log in to your account from now on.
    </div>
  }

  return <>
    <ErrorMessage error={error} />
    <TotpTokenForm
      idPrefix={idPrefix}
      InputComponent={InputComponent}
      submit={submitCode}
    />
    { loading && <div>Please wait...</div> }
  </>
}

export const AddTotpForm: React.FC<{
  idPrefix?: string,
  inputComponent?: InputComponentType
}> = ({idPrefix, inputComponent = DefaultCodeInput}) => {
  const { loading, error, otpauthUrl, token } = useGetTotpKey()

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

  console.log('token', token, jwtDecode(token))

  return <div>
    <div className="d-flex flex-column align-items-center">
      <div>1. Scan this QRCode with your authenticator app</div>
      <div><QRCode otpauthUrl={otpauthUrl} /></div>
      <ManualEntry token={token} />
      <div>2. Then, enter the 6 digit code from the authenticator app here:</div>
      <AddTotpInner idPrefix={idPrefix} token={token} InputComponent={inputComponent} />
    </div>
  </div>
}
