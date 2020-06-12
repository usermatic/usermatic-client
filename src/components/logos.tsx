
import React from 'react'

import { Icon } from 'react-icons-kit'
import { google } from 'react-icons-kit/fa/google'
import { facebookOfficial } from 'react-icons-kit/fa/facebookOfficial'
import { github } from 'react-icons-kit/fa/github'
import { check } from 'react-icons-kit/fa/check'

type LogoType = React.FC<{
  color?: string,
  size?: string | number
}>

export const GoogleLogo: LogoType = (props) => <Icon icon={google} {...props} />
GoogleLogo.displayName = 'GoogleLogo'
export const FbLogo: LogoType = (props) => <Icon icon={facebookOfficial} {...props} />
FbLogo.displayName = 'FbLogo'
export const GithubLogo: LogoType = (props) => <Icon icon={github} {...props} />
GithubLogo.displayName = 'GithubLogo'
export const Check: LogoType = (props) => <Icon icon={check} {...props} />
Check.displayName = 'Check'
