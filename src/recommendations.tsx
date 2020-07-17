
import { useMemo } from 'react'

import {
  useCredentials,
  Credential,
  isPasswordCredential,
  isTotpCredential,
} from './user'

import {
  useAppConfig,
} from './auth'

import {
  useGetRecoveryCodeCount
} from './recoverycodes'

export type Recommendations = {
  any?: boolean,
  setPassword?: boolean
  addTotp?: boolean
  recoveryCodes?: boolean
}

export const useRecommendations = (): Recommendations => {

  const { totpEnabled } = useAppConfig()
  const { error, loading, credentials } = useCredentials()
  const { loading: countLoading, count } = useGetRecoveryCodeCount()

  return useMemo(() => {
    if (loading) { return {} }
    if (error) {
      console.error("error useRecommendations:", error)
      return {}
    }

    const ret: Recommendations = {}

    const noPassword = credentials?.find((c: Credential) => (
      isPasswordCredential(c)
    )) == null

    if (noPassword) {
      ret.any = true
      ret.setPassword = true
    }

    if (totpEnabled) {
      const noTotp = credentials?.find((c: Credential) => (
        isTotpCredential(c)
      )) == null

      if (noTotp) {
        ret.any = true
        ret.addTotp = true
      }
    }

    if (!countLoading && (!count || count <= 3)) {
      ret.any = true
      ret.recoveryCodes = true
    }

    return ret
  }, [loading, error, credentials, countLoading, totpEnabled, count])
}
