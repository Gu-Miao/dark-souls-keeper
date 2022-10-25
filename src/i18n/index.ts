import en from './en'
import zh from './zh'

type Keys =
  | 'gettingSavesFailed'
  | 'backUp'
  | 'nameLabel'
  | 'namePlaceholder'
  | 'nameErrorMessageEmpty'
  | 'nameErrorMessageLength'
  | 'nameErrorMessageIllegal'
  | 'descriptionLabel'
  | 'descriptionPlaceholder'
  | 'submitText'
  | 'cancelText'
  | 'backupSucceeded'
  | 'backupFailed'
  | 'quickBackUp'
  | 'quickBackUpMessage'
  | 'okText'
  | 'searchPlaceholder'
  | 'load'
  | 'loadMessage'
  | 'loadingSucceeded'
  | 'loadingFailed'
  | 'remove'
  | 'removeMessage'
  | 'removalSucceeded'
  | 'removalFailed'
  | 'empty'

export type Text = Record<Keys, string>

export type Lang = 'zh' | 'en'

export function getText(lang: Lang): Text {
  return lang === 'en' ? en : zh
}
